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

# Copy environment template files
echo "Copying environment template files..."
cp config/env/.env.staging.template $TEMP_DIR/
cp frontend/.env.staging.template $TEMP_DIR/frontend/

# Create real environment files from templates if they don't exist on the server
echo "Creating environment files from templates if needed..."
ssh -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST << EOF
    set -e
    
    # Create .env from template if it doesn't exist
    if [ ! -f $REMOTE_DIR/.env ]; then
        echo "Creating .env file from template..."
        cp $REMOTE_DIR/.env.staging.template $REMOTE_DIR/.env
        echo "IMPORTANT: Please update $REMOTE_DIR/.env with proper credentials"
    fi
    
    # Create frontend/.env from template if it doesn't exist
    if [ ! -f $REMOTE_DIR/frontend/.env ]; then
        echo "Creating frontend/.env file from template..."
        mkdir -p $REMOTE_DIR/frontend
        cp $REMOTE_DIR/frontend/.env.staging.template $REMOTE_DIR/frontend/.env
        echo "IMPORTANT: Please update $REMOTE_DIR/frontend/.env with proper credentials"
    fi
EOF

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