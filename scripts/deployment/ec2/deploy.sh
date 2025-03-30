#!/bin/bash
# Deployment script for EC2 environment

set -e

# Source utility functions
source "$(dirname "$0")/../shared/utils.sh"

# Configuration
SSH_USER=${SSH_USER:-"ubuntu"}
SSH_HOST=${SSH_HOST:-"ec2-44-202-29-233.compute-1.amazonaws.com"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/home/ubuntu/ultimate-marketing-team"}
SSH_KEY=${SSH_KEY:-"ultimate-marketing-staging.pem"}
DOMAIN="staging.tangible-studios.com"

echo "Starting deployment to EC2 environment: $SSH_USER@$SSH_HOST:$REMOTE_DIR"

# Verify SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key file '$SSH_KEY' not found."
    echo "Please provide the path to your SSH key file using SSH_KEY=path/to/key"
    exit 1
fi

# Set proper permissions for SSH key
chmod 400 "$SSH_KEY"

# Build frontend if needed
if [ -d "frontend" ]; then
    echo "Building frontend application..."
    (cd frontend && npm run build) || {
        echo "Warning: Frontend build had errors but continuing with deployment."
    }
else
    echo "Warning: Frontend directory not found, skipping build."
fi

# Create archive
ARCHIVE_NAME=$(create_deployment_archive)

# Deploy archive to EC2
echo "Deploying to EC2 server..."
ssh -i "$SSH_KEY" -v "$SSH_USER@$SSH_HOST" "echo Connection successful"

if [ $? -eq 0 ]; then
    echo "SSH connection successful, proceeding with deployment..."
    deploy_archive "$ARCHIVE_NAME" "$SSH_USER" "$SSH_HOST" "$REMOTE_DIR" "$SSH_KEY" "$SSH_PORT" "docker-compose.ec2.yml"
    
    # Set up SSL if needed
    echo "Setting up SSL..."
    ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" << EOF
        cd $REMOTE_DIR
        if [ ! -f "nginx-ssl/cert.pem" ]; then
            echo "Setting up SSL..."
            ./scripts/deployment/shared/ssl_setup.sh
        else
            echo "SSL already set up, starting frontend-ssl service..."
            docker-compose -f frontend-ssl.yml up -d
        fi
EOF
else
    echo "SSH connection failed. Please check if the server is running and accessible."
    echo "Verify AWS EC2 instance status in the AWS Management Console."
    exit 1
fi

echo "EC2 deployment completed successfully!"
echo "You can now access the environment at https://$DOMAIN/"
echo "To check services: SSH_KEY=$SSH_KEY ./scripts/deployment/ec2/check_services.sh"