#!/bin/bash
# Script to set up SSL certificates for the application

set -e

echo "Setting up SSL certificates..."

# Create directory for SSL certificates
mkdir -p nginx-ssl

# Check if we're running on EC2
if [ -f "/etc/os-release" ] && grep -q "Amazon Linux" /etc/os-release; then
    # Amazon Linux
    echo "Detected Amazon Linux, using Let's Encrypt for SSL..."
    
    # Install certbot if needed
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        sudo amazon-linux-extras install epel -y
        sudo yum install certbot -y
    fi
    
    # Get certificate
    sudo certbot certonly --standalone --agree-tos --email admin@tangible-studios.com -d staging.tangible-studios.com
    
    # Copy certificates
    sudo cp /etc/letsencrypt/live/staging.tangible-studios.com/fullchain.pem nginx-ssl/cert.pem
    sudo cp /etc/letsencrypt/live/staging.tangible-studios.com/privkey.pem nginx-ssl/key.pem
    sudo chown -R $(whoami) nginx-ssl/
    
elif [ -f "/etc/os-release" ] && grep -q "Ubuntu" /etc/os-release; then
    # Ubuntu
    echo "Detected Ubuntu, using Let's Encrypt for SSL..."
    
    # Install certbot if needed
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        sudo apt-get update
        sudo apt-get install -y certbot
    fi
    
    # Get certificate
    sudo certbot certonly --standalone --agree-tos --email admin@tangible-studios.com -d staging.tangible-studios.com
    
    # Copy certificates
    sudo cp /etc/letsencrypt/live/staging.tangible-studios.com/fullchain.pem nginx-ssl/cert.pem
    sudo cp /etc/letsencrypt/live/staging.tangible-studios.com/privkey.pem nginx-ssl/key.pem
    sudo chown -R $(whoami) nginx-ssl/
    
else
    # Default to self-signed certificates for development
    echo "Using self-signed certificates for SSL..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx-ssl/key.pem \
        -out nginx-ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=staging.tangible-studios.com"
fi

# Set appropriate permissions
chmod 600 nginx-ssl/key.pem
chmod 644 nginx-ssl/cert.pem

# Start SSL-enabled frontend
if [ -f "frontend-ssl.yml" ]; then
    echo "Starting SSL-enabled frontend..."
    docker-compose -f frontend-ssl.yml up -d
else
    echo "Warning: frontend-ssl.yml not found. SSL setup completed but service not started."
fi

echo "SSL setup completed successfully!"