#!/bin/bash
# Script to fix common issues with services on EC2

set -e

# Configuration
SSH_USER=${SSH_USER:-"ubuntu"}
SSH_HOST=${SSH_HOST:-"ec2-44-202-29-233.compute-1.amazonaws.com"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/home/ubuntu/ultimate-marketing-team"}
SSH_KEY=${SSH_KEY:-"ultimate-marketing-staging.pem"}

echo "Fixing services on EC2 environment..."

# Verify SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key file '$SSH_KEY' not found."
    echo "Please provide the path to your SSH key file using SSH_KEY=path/to/key"
    exit 1
fi

# Execute remote commands
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" << 'EOF'
    set -e
    echo "Connected to the server..."
    
    # Navigate to the project directory
    cd /home/ubuntu/ultimate-marketing-team
    
    # Check if Docker is running
    echo "Checking Docker status..."
    if ! sudo systemctl is-active --quiet docker; then
        echo "Docker is not running. Starting Docker..."
        sudo systemctl start docker
    fi
    
    # Clean up Docker environment
    echo "Cleaning up Docker environment..."
    docker system prune -f
    
    # Rebuild and restart services
    echo "Rebuilding and restarting services..."
    docker-compose -f docker-compose.ec2.yml build
    
    # Stop and remove current services
    echo "Stopping services..."
    docker-compose -f docker-compose.ec2.yml down
    
    # Start services
    echo "Starting services..."
    docker-compose -f docker-compose.ec2.yml up -d
    
    # Verify services are running
    echo "Verifying services..."
    docker-compose -f docker-compose.ec2.yml ps
    
    # Start frontend-ssl if needed
    if [ -f "frontend-ssl.yml" ]; then
        echo "Starting SSL-enabled frontend..."
        docker-compose -f frontend-ssl.yml up -d
    fi
    
    echo "Service fix completed!"
EOF

echo "Service fix script completed!"
echo "To check services: SSH_KEY=$SSH_KEY ./scripts/deployment/ec2/check_services.sh"