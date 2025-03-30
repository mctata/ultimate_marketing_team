#!/bin/bash
# Quick deployment script using existing archives
# Usage: ./scripts/deployment/quick_deploy.sh <archive_path>
# Example: ./scripts/deployment/quick_deploy.sh deployments/archives/staging/staging_deploy_20250328_112844.tar.gz

set -e

if [ $# -lt 1 ]; then
    echo "Usage: $0 <archive_path>"
    echo "Example: $0 deployments/archives/staging/staging_deploy_20250328_112844.tar.gz"
    exit 1
fi

ARCHIVE_PATH=$1

if [ ! -f "$ARCHIVE_PATH" ]; then
    echo "Archive not found: $ARCHIVE_PATH"
    exit 1
fi

# Configuration
SSH_USER=${SSH_USER:-"tangible-studios.com"}
SSH_HOST=${SSH_HOST:-"ssh.tangible-studios.com"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/customers/8/2/5/tangible-studios.com/httpd.www/staging"}
SSH_KEY=${SSH_KEY:-"~/.ssh/id_rsa"}

# Test connection first
echo "Testing SSH connection to $SSH_USER@$SSH_HOST:$SSH_PORT..."
ssh -q -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST exit
if [ $? -ne 0 ]; then
    echo "SSH connection failed. Please check your SSH credentials and try again."
    exit 1
fi
echo "SSH connection successful."

# Upload and deploy the archive
echo "Deploying archive $ARCHIVE_PATH to $SSH_USER@$SSH_HOST:$REMOTE_DIR"
scp -P $SSH_PORT -i $SSH_KEY "$ARCHIVE_PATH" $SSH_USER@$SSH_HOST:/tmp/deploy.tar.gz

# Execute remote commands
ssh -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST << EOF
    set -e
    echo "Connected to the server..."
    
    # Create directory if it doesn't exist
    mkdir -p $REMOTE_DIR
    
    # Extract files
    echo "Extracting deployment archive..."
    tar -xzf /tmp/deploy.tar.gz -C $REMOTE_DIR
    
    # Navigate to the project directory
    cd $REMOTE_DIR
    
    # Make scripts executable
    find scripts -type f \( -name "*.sh" -o -name "*.py" \) -exec chmod +x {} \;
    
    # Start Docker containers
    echo "Starting Docker containers..."
    docker-compose -f docker-compose.staging.yml down
    docker-compose -f docker-compose.staging.yml up -d
    
    # Clean up
    echo "Cleaning up..."
    rm /tmp/deploy.tar.gz
    
    echo "Deployment completed successfully!"
EOF

echo "Quick deployment completed successfully!"
echo "You can now access the staging environment at https://staging.tangible-studios.com/"