#!/bin/bash
# EC2 Deployment script for the Ultimate Marketing Team application

set -e

echo "Starting deployment to EC2 instance..."

# Configuration
EC2_USER=${EC2_USER:-"ubuntu"}
EC2_HOST=${EC2_HOST:-"ec2-44-202-29-233.compute-1.amazonaws.com"}
EC2_PORT=${EC2_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/home/ubuntu/ultimate_marketing_team"}
SSH_KEY=${SSH_KEY:-"ultimate-marketing-staging.pem"}

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key not found at $SSH_KEY"
    echo "Please provide the correct path with SSH_KEY=/path/to/key.pem"
    exit 1
fi

# Set proper permissions for SSH key
chmod 400 "$SSH_KEY"

echo "Deploying to $EC2_USER@$EC2_HOST:$REMOTE_DIR"

# Build frontend application
echo "Building frontend application..."
if [ -d "frontend" ]; then
    (cd frontend && npm run build) || {
        echo "Warning: Frontend build had errors but continuing with deployment."
    }
else
    echo "Warning: Frontend directory not found, skipping build."
fi

# Create a temporary directory for deployment files
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# Copy essential files to the temp directory
echo "Copying project files..."
rsync -av --exclude='node_modules' --exclude='venv' --exclude='.git' \
    --exclude='__pycache__' --exclude='*.pyc' --exclude='.env.local' \
    --exclude='frontend/node_modules' \
    --exclude='logs' --exclude='tmp_deploy' \
    . "$TEMP_DIR/"

# Create environment file if not exists
if [ ! -f ".env" ]; then
    echo "Environment file .env not found. Creating a template..."
    cp config/env/.env.staging "$TEMP_DIR/.env" || {
        echo "Warning: Could not find staging environment template."
        touch "$TEMP_DIR/.env"
    }
else
    cp .env "$TEMP_DIR/.env"
fi

# Create deployment package
echo "Creating deployment archive..."
DEPLOY_ARCHIVE="ec2_deploy_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$DEPLOY_ARCHIVE" -C "$TEMP_DIR" .
echo "Created deployment archive: $DEPLOY_ARCHIVE"

# Save a copy to deployment_archives
mkdir -p deployment_archives
cp "$DEPLOY_ARCHIVE" "deployment_archives/"
echo "Saved a copy of the archive to deployment_archives/"

# Upload the archive to the server
echo "Uploading deployment archive to EC2 server..."
scp -P "$EC2_PORT" -i "$SSH_KEY" "$DEPLOY_ARCHIVE" "$EC2_USER@$EC2_HOST:/tmp/"

# Execute remote commands
echo "Executing deployment commands on the EC2 server..."
ssh -p "$EC2_PORT" -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" << EOF
    set -e
    echo "Connected to the EC2 server..."
    
    # Check if Docker is installed
    echo "Checking if Docker is installed..."
    if ! command -v docker &> /dev/null; then
        echo "Docker not found. Installing Docker..."
        sudo apt-get update
        sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
        sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable"
        sudo apt-get update
        sudo apt-get install -y docker-ce
        sudo systemctl enable docker
        sudo systemctl start docker
        sudo usermod -aG docker \$USER
        echo "Docker installed successfully!"
    else
        echo "Docker is already installed."
    fi
    
    # Check if Docker Compose is installed
    echo "Checking if Docker Compose is installed..."
    if ! command -v docker-compose &> /dev/null; then
        echo "Docker Compose not found. Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.0/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        echo "Docker Compose installed successfully!"
    else
        echo "Docker Compose is already installed."
    fi
    
    # Create directory if it doesn't exist
    echo "Creating destination directory..."
    sudo mkdir -p "$REMOTE_DIR"
    sudo chown "\$USER:\$USER" "$REMOTE_DIR"
    
    # Extract files
    echo "Extracting deployment archive..."
    tar -xzf /tmp/$DEPLOY_ARCHIVE -C "$REMOTE_DIR"
    
    # Navigate to the project directory
    cd "$REMOTE_DIR"
    
    # Make scripts executable
    echo "Making scripts executable..."
    find scripts -type f \( -name "*.sh" -o -name "*.py" \) -exec chmod +x {} \;
    
    # Stop any running containers
    echo "Stopping running containers..."
    sudo docker-compose -f docker-compose.ec2.yml down 2>/dev/null || echo "No containers were running."
    
    # Start Docker containers
    echo "Starting Docker containers with EC2 configuration..."
    sudo docker-compose -f docker-compose.ec2.yml up -d
    
    # Clean up
    echo "Cleaning up..."
    rm /tmp/$DEPLOY_ARCHIVE
    
    echo "Deployment to EC2 completed successfully!"
    echo "The application should now be accessible at http://$EC2_HOST"
    echo "For secure access, please set up SSL certificates following the instructions in the documentation."
EOF

# Clean up local temporary files
echo "Cleaning up local temporary files..."
rm -rf "$TEMP_DIR"
rm "$DEPLOY_ARCHIVE"

echo "EC2 deployment script completed successfully!"