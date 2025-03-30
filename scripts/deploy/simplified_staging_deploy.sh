#!/bin/bash
# Simplified staging deployment script that handles all steps in one command

set -e

echo "Starting simplified staging deployment"

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
SSH_KEY=${SSH_KEY:-"~/.ssh/id_rsa"}

# Create a timestamp for the archive
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_ARCHIVE="staging_deploy_${TIMESTAMP}.tar.gz"

echo "Deploying to $SSH_USER@$SSH_HOST:$REMOTE_DIR using archive $DEPLOY_ARCHIVE"

# Build the frontend if it exists
if [ -d "frontend" ]; then
    echo "Building frontend..."
    cd frontend
    if [ -f "package.json" ]; then
        npm install
        npm run build
    fi
    cd ..
fi

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
    cp config/env/.env.staging $TEMP_DIR/.env 2>/dev/null || echo "Warning: No staging environment template found."
fi

# Copy frontend env
if [ -f frontend/.env.staging ]; then
    cp frontend/.env.staging $TEMP_DIR/frontend/.env
elif [ -f deployment_secrets/frontend.env.staging.real ]; then
    cp deployment_secrets/frontend.env.staging.real $TEMP_DIR/frontend/.env
elif [ -f frontend/.env.staging.template ]; then
    cp frontend/.env.staging.template $TEMP_DIR/frontend/.env
else
    echo "Warning: No frontend environment file found."
fi

# Create deployment package
echo "Creating deployment archive..."
tar -czf $DEPLOY_ARCHIVE -C $TEMP_DIR .
echo "Created deployment archive: $DEPLOY_ARCHIVE"

# Create deployment archive directory if it doesn't exist
mkdir -p deployment_archives
cp $DEPLOY_ARCHIVE deployment_archives/

# Upload the archive to the server
echo "Uploading deployment archive to server..."
scp -P $SSH_PORT -i $SSH_KEY $DEPLOY_ARCHIVE $SSH_USER@$SSH_HOST:/tmp/

# Execute remote commands
echo "Executing deployment commands on the server..."
ssh -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST << EOF
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
    find scripts -type f -name "*.sh" -o -name "*.py" | xargs chmod +x 2>/dev/null || echo "No scripts found to make executable"
    
    # Run docker-compose for staging environment
    echo "Starting Docker containers..."
    docker-compose -f docker-compose.staging.yml down || echo "No existing containers to stop"
    docker-compose -f docker-compose.staging.yml up -d
    
    # Clean up
    echo "Cleaning up..."
    rm /tmp/$DEPLOY_ARCHIVE
    
    echo "Deployment completed successfully!"
EOF

# Clean up local temporary files
echo "Cleaning up local temporary files..."
rm -rf $TEMP_DIR
# Keep the archive file in deployment_archives but remove from root
[ -f $DEPLOY_ARCHIVE ] && rm $DEPLOY_ARCHIVE

echo "Deployment script completed successfully!"
echo "Archive saved to: deployment_archives/$DEPLOY_ARCHIVE"