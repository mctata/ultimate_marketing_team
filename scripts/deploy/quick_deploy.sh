#!/bin/bash
# Quick deployment script that assumes the archive is already uploaded

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Configuration
SSH_USER=${SSH_USER:-"tangible-studios.com"}
SSH_HOST=${SSH_HOST:-"ssh.tangible-studios.com"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/customers/8/2/5/tangible-studios.com/httpd.www/staging"}
DEPLOY_ARCHIVE=${1:-"staging_deploy_20250328_112844.tar.gz"}

echo "Starting quick deployment process to $SSH_USER@$SSH_HOST:$REMOTE_DIR"
echo "Using archive: $DEPLOY_ARCHIVE"

# First, upload the archive
echo "Uploading deployment archive to server..."
scp $DEPLOY_ARCHIVE $SSH_USER@$SSH_HOST:/tmp/

# Execute remote commands
echo "Executing deployment commands on the server..."
ssh $SSH_USER@$SSH_HOST << EOF
    set -e
    echo "Connected to the server..."
    
    # Check if docker is installed on the remote server
    if ! command -v docker &> /dev/null; then
        echo "Docker is not installed on the remote server. Please install Docker first."
        exit 1
    fi

    # Check if docker-compose is installed on the remote server
    if ! command -v docker-compose &> /dev/null; then
        echo "Docker Compose is not installed on the remote server. Please install Docker Compose first."
        exit 1
    fi
    
    # Create directory if it doesn't exist
    mkdir -p $REMOTE_DIR
    
    # Extract files
    echo "Extracting deployment archive..."
    tar -xzf /tmp/$DEPLOY_ARCHIVE -C $REMOTE_DIR
    
    # Navigate to the project directory
    cd $REMOTE_DIR
    
    # Make scripts executable
    find scripts -type f -name "*.sh" -o -name "*.py" | xargs chmod +x
    
    # Run docker-compose for staging environment
    echo "Starting Docker containers..."
    docker-compose -f docker-compose.staging.yml down
    docker-compose -f docker-compose.staging.yml up -d
    
    # Clean up
    echo "Cleaning up..."
    rm /tmp/$DEPLOY_ARCHIVE
    
    echo "Deployment completed successfully!"
EOF

echo "Deployment script completed successfully!"