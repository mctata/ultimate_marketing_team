#!/bin/bash
# Quick deployment script using existing archives for any environment
# Usage: ./scripts/deployment/quick_deploy.sh <archive_filename> [environment]
# Example: ./scripts/deployment/quick_deploy.sh staging_deploy_20250328_112844.tar.gz staging

set -e

if [ $# -lt 1 ]; then
    echo "Usage: $0 <archive_filename> [environment]"
    echo "Example: $0 staging_deploy_20250328_112844.tar.gz staging"
    exit 1
fi

ARCHIVE_FILENAME=$1
DEPLOY_ENV=${2:-"staging"}

# Check if the archive exists
if [[ $ARCHIVE_FILENAME == */* ]]; then
    # Full path specified
    ARCHIVE_PATH="$ARCHIVE_FILENAME"
else
    # Only filename specified, look in deployment archives
    ARCHIVE_PATH="deployments/archives/$DEPLOY_ENV/$ARCHIVE_FILENAME"
fi

if [ ! -f "$ARCHIVE_PATH" ]; then
    echo "Archive not found: $ARCHIVE_PATH"
    echo "Please specify a valid archive filename or path"
    exit 1
fi

# Load environment-specific configuration
ENV_FILE="config/env/deployment.env.$DEPLOY_ENV"
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file $ENV_FILE not found."
    echo "Available environments:"
    ls -1 config/env/deployment.env.* | sed 's/.*deployment.env.//'
    exit 1
fi

# Source the configuration file
source "$ENV_FILE"

# Configuration - use defaults if not set in env file
SSH_USER=${SSH_USER:-"localhost"}
SSH_HOST=${SSH_HOST:-"localhost"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/tmp/local-deploy"}
SSH_KEY=${SSH_KEY:-"~/.ssh/id_rsa"}
COMPOSE_FILE=${COMPOSE_FILE:-"docker-compose.yml"}

echo "Using deployment configuration for $DEPLOY_ENV environment:"
echo "SSH User: $SSH_USER"
echo "SSH Host: $SSH_HOST"
echo "SSH Port: $SSH_PORT"
echo "Remote Directory: $REMOTE_DIR"
echo "SSH Key: $SSH_KEY"
echo "Docker Compose File: $COMPOSE_FILE"
echo "Archive: $ARCHIVE_PATH"

# For local deployment, extract to local directory
if [ "$SSH_HOST" == "localhost" ]; then
    echo "Local deployment selected - extracting to $REMOTE_DIR"
    mkdir -p $REMOTE_DIR
    tar -xzf $ARCHIVE_PATH -C $REMOTE_DIR
    
    # Make scripts executable
    find $REMOTE_DIR/scripts -type f \( -name "*.sh" -o -name "*.py" \) -exec chmod +x {} \;
    
    # Navigate to the project directory
    cd $REMOTE_DIR
    
    # Start Docker containers
    echo "Starting Docker containers for $DEPLOY_ENV environment..."
    docker-compose -f $COMPOSE_FILE down
    docker-compose -f $COMPOSE_FILE up -d
    
else
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
        docker-compose -f $COMPOSE_FILE down
        docker-compose -f $COMPOSE_FILE up -d
        
        # Clean up
        echo "Cleaning up..."
        rm /tmp/deploy.tar.gz
        
        echo "Deployment completed successfully!"
EOF
fi

echo "Quick deployment completed successfully!"
if [ "$SSH_HOST" == "localhost" ]; then
    echo "You can now access the local environment at http://localhost:3000/"
else
    echo "You can now access the $DEPLOY_ENV environment at https://$DEPLOY_ENV.tangible-studios.com/"
fi