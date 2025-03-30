#!/bin/bash
# Simplified deployment script for staging environment
# Usage: ./scripts/deployment/staging/deploy.sh

set -e

echo "Starting deployment to staging.tangible-studios.com"

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
    --exclude='frontend/node_modules' --exclude='logs' \
    . $TEMP_DIR/

# Copy environment files
echo "Copying environment files..."
if [ -f deployments/secrets/.env.staging.real ]; then
    echo "Using real credentials from deployments/secrets folder..."
    cp deployments/secrets/.env.staging.real $TEMP_DIR/.env
else
    echo "Using template credentials from config/env folder (WILL NEED TO BE UPDATED)..."
    cp config/env/.env.staging $TEMP_DIR/.env
fi

# Copy frontend env
if [ -f frontend/.env.staging ]; then
    cp frontend/.env.staging $TEMP_DIR/frontend/.env
elif [ -f deployments/secrets/frontend.env.staging.real ]; then
    cp deployments/secrets/frontend.env.staging.real $TEMP_DIR/frontend/.env
else
    cp frontend/.env.staging.template $TEMP_DIR/frontend/.env
fi

# Create deployment package
echo "Creating deployment archive..."
DEPLOY_ARCHIVE="staging_deploy_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf $DEPLOY_ARCHIVE -C $TEMP_DIR .
echo "Created deployment archive: $DEPLOY_ARCHIVE"

# Save a copy to deployments archives directory for future reference
mkdir -p deployments/archives/staging
cp $DEPLOY_ARCHIVE deployments/archives/staging/
echo "Saved a copy of the archive to deployments/archives/staging/"

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
    
    # Make scripts executable (recursive through all subdirectories)
    find scripts -type f \( -name "*.sh" -o -name "*.py" \) -exec chmod +x {} \;
    
    # Check if Docker is installed
    echo "Checking if Docker is installed..."
    if ! command -v docker &> /dev/null; then
        echo "Docker is not installed. Please install Docker before deploying."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    echo "Checking if Docker Compose is installed..."
    if ! command -v docker-compose &> /dev/null; then
        echo "Docker Compose is not installed. Please install Docker Compose before deploying."
        exit 1
    fi
    
    # Ensure environment variables are loaded
    echo "Loading environment variables from .env file..."
    set -a
    source .env
    set +a
    
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
echo "You can now access the staging environment at https://staging.tangible-studios.com/"