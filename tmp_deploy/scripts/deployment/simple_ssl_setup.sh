#!/bin/bash
# Simple and reliable SSL setup script

set -e

echo "Setting up SSL frontend service for staging environment"

# Configuration
SSH_USER=${SSH_USER:-"ubuntu"}
SSH_HOST=${SSH_HOST:-"ec2-44-202-29-233.compute-1.amazonaws.com"}
REMOTE_DIR=${REMOTE_DIR:-"/home/ubuntu/ultimate-marketing-team"}
SSH_KEY=${SSH_KEY:-"ultimate-marketing-staging.pem"}
DOMAIN="staging.tangible-studios.com"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key file '$SSH_KEY' not found."
    echo "Please provide the path to your SSH key file using SSH_KEY=path/to/key"
    exit 1
fi

# Execute remote commands
echo "Connecting to server to set up SSL..."
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" << 'ENDSSH'
    # Basic variables
    DOMAIN="staging.tangible-studios.com"
    REMOTE_DIR="/home/ubuntu/ultimate-marketing-team"
    NETWORK_NAME="ultimate-marketing-team_umt-network"
    
    set -e
    echo "Connected to the server..."
    
    # Navigate to the project directory
    cd $REMOTE_DIR
    
    # Create a backup of the original docker-compose.yml
    echo "Creating backup of docker-compose file..."
    cp docker-compose.staging.yml docker-compose.staging.yml.backup-$(date +%Y%m%d%H%M%S)
    
    # Create SSL directory and copy certificates
    echo "Setting up SSL certificates..."
    sudo mkdir -p /tmp/ssl-cert
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /tmp/ssl-cert/cert.pem
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /tmp/ssl-cert/key.pem
    sudo chmod 644 /tmp/ssl-cert/*.pem
    
    # Create nginx-ssl directory and configuration
    echo "Creating nginx SSL configuration..."
    mkdir -p nginx-ssl
    cat > nginx-ssl/nginx.conf << 'EOF'
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;
    sendfile on;
    keepalive_timeout 65;
    server_tokens off;
    
    # HTTP server - redirect to HTTPS
    server {
        listen 80;
        server_name staging.tangible-studios.com;
        
        # Redirect all HTTP requests to HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl;
        server_name staging.tangible-studios.com;
        
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        
        # API requests
        location /api/ {
            proxy_pass http://api-gateway:8000/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_read_timeout 300s;
        }

        # WebSocket support
        location /ws/ {
            proxy_pass http://api-gateway:8000/ws/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Serve static content directly
        location / {
            proxy_pass http://api-gateway:8000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
EOF
    
    # Create separate docker-compose file for frontend-ssl
    echo "Creating frontend-ssl.yml file..."
    cat > frontend-ssl.yml << EOF
version: '3.8'

services:
  frontend-ssl:
    image: nginx:alpine
    container_name: frontend-ssl
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-ssl/nginx.conf:/etc/nginx/nginx.conf
      - ssl-certs:/etc/nginx/ssl
    networks:
      - $NETWORK_NAME
    restart: always

volumes:
  ssl-certs:

networks:
  $NETWORK_NAME:
    external: true
EOF
    
    # Create or update SSL volume
    echo "Setting up SSL volume..."
    docker volume create ssl-certs
    docker run --rm -v ssl-certs:/ssl-certs -v /tmp/ssl-cert:/source:ro alpine sh -c "mkdir -p /ssl-certs && cp /source/cert.pem /ssl-certs/ && cp /source/key.pem /ssl-certs/ && chmod 644 /ssl-certs/*.pem"
    
    # Stop any existing frontend-ssl service
    echo "Stopping any existing frontend-ssl service..."
    docker stop frontend-ssl 2>/dev/null || true
    docker rm frontend-ssl 2>/dev/null || true
    
    # Start the frontend-ssl service
    echo "Starting frontend-ssl service..."
    docker-compose -f frontend-ssl.yml up -d
    
    # Verify the service is running
    echo "Checking if service is running..."
    docker-compose -f frontend-ssl.yml ps
    
    # Check for port 443
    echo "Checking if port 443 is being listened to..."
    ss -tulpn | grep :443 || echo "WARNING: Port 443 is not being listened to!"
    
    # Try a test connection
    echo "Testing local HTTPS connection..."
    curl -k https://localhost -I || echo "WARNING: Local HTTPS test failed"
    
    echo "SSL setup completed! Try accessing https://$DOMAIN"
ENDSSH

echo "SSL setup script completed!"
echo "Try accessing https://staging.tangible-studios.com/ in a private/incognito window."
echo ""
echo "If it doesn't work, check the logs by running:"
echo "SSH_KEY=$SSH_KEY ssh -i $SSH_KEY $SSH_USER@$SSH_HOST \"cd $REMOTE_DIR && docker-compose -f frontend-ssl.yml logs\""