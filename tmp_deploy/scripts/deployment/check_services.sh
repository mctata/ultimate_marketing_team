#!/bin/bash
# Script to check all running services and configuration in staging

set -e

echo "Checking all services in staging environment"

# Configuration
SSH_USER=${SSH_USER:-"ubuntu"}
SSH_HOST=${SSH_HOST:-"ec2-44-202-29-233.compute-1.amazonaws.com"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/home/ubuntu/ultimate-marketing-team"}
SSH_KEY=${SSH_KEY:-"ultimate-marketing-staging.pem"}

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key file '$SSH_KEY' not found."
    echo "Please provide the path to your SSH key file using SSH_KEY=path/to/key"
    exit 1
fi

# Execute remote commands
echo "Connecting to server to check services..."
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" << EOF
    set -e
    echo "Connected to the server..."
    
    # Navigate to the project directory
    cd $REMOTE_DIR
    
    echo "=== Docker Compose Configuration ==="
    echo "Services defined in docker-compose.staging.yml:"
    grep -E "^  [a-zA-Z0-9_-]+:" docker-compose.staging.yml | sed 's/:.*//g'
    
    echo ""
    echo "=== Running Containers ==="
    docker-compose -f docker-compose.staging.yml ps
    
    echo ""
    echo "=== Network Ports ==="
    if command -v netstat > /dev/null; then
        sudo netstat -tulpn | grep LISTEN
    elif command -v ss > /dev/null; then
        sudo ss -tulpn | grep LISTEN
    elif command -v lsof > /dev/null; then
        sudo lsof -i -P -n | grep LISTEN
    else
        echo "No port checking tools found. Skipping port check."
    fi
    
    echo ""
    echo "=== SSL Certificates ==="
    if [ -d "/etc/letsencrypt/live/" ]; then
        sudo ls -la /etc/letsencrypt/live/
    else
        echo "No Let's Encrypt certificates found."
    fi
    
    echo ""
    echo "=== Nginx Configurations ==="
    if docker-compose -f docker-compose.staging.yml ps | grep -q frontend; then
        echo "Checking frontend container nginx configuration..."
        docker-compose -f docker-compose.staging.yml exec frontend cat /etc/nginx/nginx.conf 2>/dev/null || echo "No nginx.conf found"
    fi
    
    if docker-compose -f docker-compose.staging.yml ps | grep -q frontend-ssl; then
        echo "Checking frontend-ssl container nginx configuration..."
        docker-compose -f docker-compose.staging.yml exec frontend-ssl cat /etc/nginx/nginx.conf 2>/dev/null || echo "No nginx.conf found"
    fi
    
    echo ""
    echo "=== Docker Volumes ==="
    docker volume ls
    
    echo ""
    echo "=== Let's Encrypt Certificate Status ==="
    if command -v certbot > /dev/null; then
        sudo certbot certificates
    else
        echo "certbot not installed. Cannot check certificate status."
    fi
    
    echo ""
    echo "=== Host File System ==="
    echo "Checking nginx-ssl directory..."
    ls -la nginx-ssl 2>/dev/null || echo "nginx-ssl directory not found"
EOF

echo "Service check completed!"