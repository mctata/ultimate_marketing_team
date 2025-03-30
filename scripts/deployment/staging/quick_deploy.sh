#!/bin/bash
# Quick deployment script for staging using existing archives
# Usage: ./scripts/deployment/staging/quick_deploy.sh <archive_filename>
# Example: ./scripts/deployment/staging/quick_deploy.sh staging_deploy_20250328_112844.tar.gz

set -e

if [ $# -lt 1 ]; then
    echo "Usage: $0 <archive_filename>"
    echo "Example: $0 staging_deploy_20250328_112844.tar.gz"
    exit 1
fi

ARCHIVE_FILENAME=$1
ARCHIVE_PATH="deployments/archives/staging/$ARCHIVE_FILENAME"

if [ ! -f "$ARCHIVE_PATH" ]; then
    echo "Archive not found: $ARCHIVE_PATH"
    echo "Please specify a valid archive filename from deployments/archives/staging/"
    exit 1
fi

# Configuration
SSH_USER=${SSH_USER:-"ubuntu"}
SSH_HOST=${SSH_HOST:-"ec2-44-202-29-233.compute-1.amazonaws.com"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/home/ubuntu/ultimate-marketing-team"}
SSH_KEY=${SSH_KEY:-"ultimate-marketing-staging.pem"}

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