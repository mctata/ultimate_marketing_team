#!/bin/bash
# Universal deployment script for any environment
# Usage: ./scripts/deployment/deploy.sh [environment]
# Example: ./scripts/deployment/deploy.sh staging

set -e

# Default to staging if no environment is specified
DEPLOY_ENV=${1:-"staging"}
echo "Starting deployment to $DEPLOY_ENV environment..."

# Fetch secrets from Bitwarden
FETCH_SCRIPT="scripts/utilities/fetch_secrets.sh"
if [ ! -f "$FETCH_SCRIPT" ]; then
    echo "Error: Fetch secrets script $FETCH_SCRIPT not found."
    exit 1
fi

# Check if the environment file needs to be regenerated
ENV_FILE="config/env/deployment.env.$DEPLOY_ENV"
TEMPLATE_FILE="config/env/deployment.env.$DEPLOY_ENV.template"

if [ ! -f "$ENV_FILE" ]; then
    echo "Environment file doesn't exist. Fetching from Bitwarden..."
    
    # Make sure the template exists
    if [ ! -f "$TEMPLATE_FILE" ]; then
        echo "Error: Template file $TEMPLATE_FILE not found."
        echo "Please create a template file first."
        exit 1
    fi
    
    # Fetch secrets
    $FETCH_SCRIPT $DEPLOY_ENV
    
    if [ ! -f "$ENV_FILE" ]; then
        echo "Error: Failed to fetch secrets from Bitwarden."
        exit 1
    fi
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
echo "SSH Key: $SSH_KEY (sensitive)"
echo "Docker Compose File: $COMPOSE_FILE"

# Test connection first
if [ "$SSH_HOST" == "localhost" ]; then
    echo "✅ Local deployment - SSH connection test skipped"
else
    echo "Testing SSH connection to $SSH_USER@$SSH_HOST:$SSH_PORT..."
    ssh -q -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST exit
    if [ $? -ne 0 ]; then
        echo "SSH connection failed. Please check your SSH credentials and try again."
        exit 1
    fi
    echo "SSH connection successful."
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
    --exclude='frontend/node_modules' --exclude='logs' \
    --exclude='config/env/deployment.env.*' \
    . $TEMP_DIR/

# Copy environment files
echo "Copying environment files..."
if [ -f deployments/secrets/.env.$DEPLOY_ENV.real ]; then
    echo "Using real credentials from deployments/secrets folder..."
    cp deployments/secrets/.env.$DEPLOY_ENV.real $TEMP_DIR/.env
else
    echo "Using template credentials from config/env folder (WILL NEED TO BE UPDATED)..."
    cp config/env/.env.$DEPLOY_ENV $TEMP_DIR/.env
fi

# Copy frontend env
if [ -f frontend/.env.$DEPLOY_ENV ]; then
    cp frontend/.env.$DEPLOY_ENV $TEMP_DIR/frontend/.env
elif [ -f deployments/secrets/frontend.env.$DEPLOY_ENV.real ]; then
    cp deployments/secrets/frontend.env.$DEPLOY_ENV.real $TEMP_DIR/frontend/.env
else
    cp frontend/.env.$DEPLOY_ENV.template $TEMP_DIR/frontend/.env
fi

# Create deployment package
echo "Creating deployment archive..."
DEPLOY_ARCHIVE="${DEPLOY_ENV}_deploy_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf $DEPLOY_ARCHIVE -C $TEMP_DIR .
echo "Created deployment archive: $DEPLOY_ARCHIVE"

# For local deployment, extract to local directory
if [ "$SSH_HOST" == "localhost" ]; then
    echo "Local deployment selected - extracting to $REMOTE_DIR"
    mkdir -p $REMOTE_DIR
    tar -xzf $DEPLOY_ARCHIVE -C $REMOTE_DIR
    
    # Make scripts executable
    find $REMOTE_DIR/scripts -type f \( -name "*.sh" -o -name "*.py" \) -exec chmod +x {} \;
    
    # Navigate to the project directory
    cd $REMOTE_DIR
    
    # Start Docker containers
    echo "Starting Docker containers for $DEPLOY_ENV environment..."
    docker-compose -f $COMPOSE_FILE down
    docker-compose -f $COMPOSE_FILE up -d
    
else
    # Save a copy to deployments archives directory for future reference
    mkdir -p deployments/archives/$DEPLOY_ENV
    cp $DEPLOY_ARCHIVE deployments/archives/$DEPLOY_ENV/
    echo "Saved a copy of the archive to deployments/archives/$DEPLOY_ENV/"
    
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
        
        # Run docker-compose for environment
        echo "Starting Docker containers..."
        docker-compose -f $COMPOSE_FILE down
        docker-compose -f $COMPOSE_FILE up -d
        
        # Clean up
        echo "Cleaning up..."
        rm /tmp/$DEPLOY_ARCHIVE
        
        echo "Deployment completed successfully!"
EOF
fi

# Clean up local temporary files
echo "Cleaning up local temporary files..."
rm -rf $TEMP_DIR
rm $DEPLOY_ARCHIVE

echo "Deployment script completed successfully!"
if [ "$SSH_HOST" == "localhost" ]; then
    echo "You can now access the local environment at http://localhost:3000/"
else
    echo "You can now access the $DEPLOY_ENV environment at https://$DEPLOY_ENV.example.com/"
fi