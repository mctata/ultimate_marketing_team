#!/bin/bash
# Deployment script for the staging environment at staging.tangible-studios.com

set -e

echo "Starting deployment to staging.tangible-studios.com"

# Configuration
SSH_USER=${SSH_USER:-"your_ssh_user"}
SSH_HOST=${SSH_HOST:-"staging.tangible-studios.com"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/var/www/staging.tangible-studios.com"}
SSH_KEY=${SSH_KEY:-"~/.ssh/id_rsa"}

# Check if SSH credentials are provided
if [[ "$SSH_USER" == "your_ssh_user" ]]; then
    echo "Error: SSH_USER not set. Run with SSH_USER=username SSH_HOST=hostname ./scripts/deploy_staging.sh"
    exit 1
fi

echo "Deploying to $SSH_USER@$SSH_HOST:$REMOTE_DIR"

# Create a temporary directory for deployment files
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# Copy essential files to the temp directory
echo "Copying project files..."
rsync -av --exclude='node_modules' --exclude='venv' --exclude='.git' \
    --exclude='__pycache__' --exclude='*.pyc' --exclude='.env' \
    --exclude='.env.development' --exclude='.env.production' \
    --exclude='frontend/.env.local' --exclude='frontend/.env.development' \
    --exclude='frontend/.env.production' \
    . $TEMP_DIR/

# Copy environment files
echo "Copying environment files..."
if [ -f deployment_secrets/.env.staging.real ]; then
    echo "Using real credentials from deployment_secrets folder..."
    cp deployment_secrets/.env.staging.real $TEMP_DIR/.env
else
    echo "Using template credentials from config/env folder (WILL NEED TO BE UPDATED)..."
    cp config/env/.env.staging $TEMP_DIR/.env
fi

# Copy frontend env
if [ -f frontend/.env.staging ]; then
    cp frontend/.env.staging $TEMP_DIR/frontend/.env
elif [ -f deployment_secrets/frontend.env.staging.real ]; then
    cp deployment_secrets/frontend.env.staging.real $TEMP_DIR/frontend/.env
else
    cp frontend/.env.staging.template $TEMP_DIR/frontend/.env
fi

# Note about credentials
echo "NOTE: The .env files contain template values. Update credentials after deployment."

# Create deployment package
echo "Creating deployment archive..."
DEPLOY_ARCHIVE="staging_deploy_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf $DEPLOY_ARCHIVE -C $TEMP_DIR .
echo "Created deployment archive: $DEPLOY_ARCHIVE"

# Upload the archive to the server
echo "Uploading deployment archive to server..."
scp -P $SSH_PORT -i $SSH_KEY $DEPLOY_ARCHIVE $SSH_USER@$SSH_HOST:/tmp/

# Execute remote commands
echo "Executing deployment commands on the server..."
ssh -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST << EOF
    set -e
    echo "Connected to the server..."
    
    # Create directory if it doesn't exist
    mkdir -p $REMOTE_DIR
    
    # Extract files
    echo "Extracting deployment archive..."
    tar -xzf /tmp/$DEPLOY_ARCHIVE -C $REMOTE_DIR
    
    # Navigate to the project directory
    cd $REMOTE_DIR
    
    # Make scripts executable
    chmod +x scripts/*.sh scripts/*.py
    
    # Run docker-compose for staging environment
    echo "Starting Docker containers..."
    docker-compose -f docker-compose.staging.yml down
    docker-compose -f docker-compose.staging.yml up -d
    
    # Clean up
    echo "Cleaning up..."
    rm /tmp/$DEPLOY_ARCHIVE
    
    echo "Deployment completed successfully!"
EOF

# Clean up local temporary files
echo "Cleaning up local temporary files..."
rm -rf $TEMP_DIR
rm $DEPLOY_ARCHIVE

echo "Deployment script completed successfully!"