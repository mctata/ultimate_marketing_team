#!/bin/bash
# Script to deploy to staging environment and set up SSL
set -e

echo "Deploying to staging environment..."

# Configuration
SSH_USER=${SSH_USER:-"ubuntu"}
SSH_HOST=${SSH_HOST:-"ec2-44-202-29-233.compute-1.amazonaws.com"}
REMOTE_DIR=${REMOTE_DIR:-"/home/ubuntu/ultimate-marketing-team"}
SSH_KEY=${SSH_KEY:-"ultimate-marketing-staging.pem"}
DOMAIN="staging.tangible-studios.com"

# Verify SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key file '$SSH_KEY' not found."
    echo "Please provide the path to your SSH key file using SSH_KEY=path/to/key"
    exit 1
fi

# Create a directory for deployment archives
ARCHIVE_DIR="scripts/deployment/archives"
mkdir -p "$ARCHIVE_DIR"

# Create a deployment archive
echo "Creating deployment archive..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="staging_deploy_${TIMESTAMP}.tar.gz"
ARCHIVE_PATH="${ARCHIVE_DIR}/${ARCHIVE_NAME}"

# Create a minimal archive with just what we need to update
echo "Creating a minimal deployment archive..."
mkdir -p tmp_deploy/{docker/{api_gateway,migrations,frontend},scripts/deployment}
cp docker/api_gateway/Dockerfile tmp_deploy/docker/api_gateway/
cp docker/migrations/Dockerfile tmp_deploy/docker/migrations/
cp docker/frontend/Dockerfile tmp_deploy/docker/frontend/
cp docker/frontend/nginx.conf tmp_deploy/docker/frontend/ 2>/dev/null || echo "Warning: nginx.conf not found"
cp scripts/deployment/*.sh tmp_deploy/scripts/deployment/
cp docker-compose.staging.yml tmp_deploy/ 2>/dev/null || echo "Warning: docker-compose.staging.yml not found"
cp frontend-ssl.yml tmp_deploy/ 2>/dev/null || echo "Warning: frontend-ssl.yml not found"

# Create very small archive (only about 8KB)
(cd tmp_deploy && tar -czf "../$ARCHIVE_PATH" .)

echo "Created archive: $ARCHIVE_PATH"

# Copy archive to staging server
echo "Copying archive to staging server..."
echo "Attempting to debug connection to staging server..."
echo "Testing SSH connectivity with verbose output:"
ssh -i "$SSH_KEY" -v "$SSH_USER@$SSH_HOST" "echo Connection successful"

if [ $? -eq 0 ]; then
    echo "SSH connection successful, proceeding with file transfer..."
    scp -i "$SSH_KEY" "$ARCHIVE_PATH" "$SSH_USER@$SSH_HOST:/tmp/"
    ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "cd /tmp"
else
    echo "SSH connection failed. Please check if the server is running and accessible."
    echo "Verify AWS EC2 instance status in the AWS Management Console."
    exit 1
fi

# Execute remote commands
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" << EOF
    echo "Connected to staging server..."
    
    # Backup current deployment
    if [ -d "$REMOTE_DIR" ]; then
        echo "Backing up current deployment..."
        BACKUP_TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
        BACKUP_DIR="/home/ubuntu/deployment_backups/\$BACKUP_TIMESTAMP"
        mkdir -p "\$BACKUP_DIR"
        cp -r "$REMOTE_DIR"/* "\$BACKUP_DIR/" 2>/dev/null || true
    fi
    
    # Create directory if it doesn't exist
    mkdir -p "$REMOTE_DIR"
    
    # Extract archive
    echo "Extracting deployment archive..."
    mkdir -p "$REMOTE_DIR/docker/api_gateway" "$REMOTE_DIR/docker/migrations" "$REMOTE_DIR/docker/frontend" "$REMOTE_DIR/scripts/deployment"
    tar -xzf "/tmp/$ARCHIVE_NAME" -C "$REMOTE_DIR"
    
    # Navigate to project directory
    cd "$REMOTE_DIR"
    
    # Make scripts executable
    echo "Setting execute permissions on scripts..."
    find scripts -name "*.sh" -exec chmod +x {} \;
    
    # Fix Dockerfiles if needed
    echo "Ensuring Dockerfiles are up to date..."
    # API Gateway Dockerfile
    if ! grep -q "COPY src/schemas /app/src/schemas" docker/api_gateway/Dockerfile; then
        echo "Updating API Gateway Dockerfile..."
        sed -i '/COPY src\/core \/app\/src\/core/a COPY src/schemas /app/src/schemas' docker/api_gateway/Dockerfile
    fi
    
    # Migrations Dockerfile
    if ! grep -q "COPY src/schemas /app/src/schemas" docker/migrations/Dockerfile; then
        echo "Updating Migrations Dockerfile..."
        sed -i '/COPY src\/core \/app\/src\/core/a COPY src/schemas /app/src/schemas' docker/migrations/Dockerfile
    fi
    
    # Frontend Dockerfile
    if ! grep -q "./frontend/dist" docker/frontend/Dockerfile; then
        echo "Updating Frontend Dockerfile..."
        sed -i 's|COPY frontend/dist|COPY ./frontend/dist|g' docker/frontend/Dockerfile
        sed -i 's|COPY docker/frontend/nginx.conf|COPY ./docker/frontend/nginx.conf|g' docker/frontend/Dockerfile
    fi
    
    # Build and start services
    echo "Building and starting services..."
    docker-compose -f docker-compose.staging.yml down
    docker-compose -f docker-compose.staging.yml build
    docker-compose -f docker-compose.staging.yml up -d migrations
    docker-compose -f docker-compose.staging.yml up -d
    
    # Set up SSL if needed
    if [ ! -f "/home/ubuntu/ultimate-marketing-team/nginx-ssl/cert.pem" ]; then
        echo "Setting up SSL..."
        ./scripts/deployment/simple_ssl_setup.sh
    else
        echo "SSL already set up, starting frontend-ssl service..."
        docker-compose -f frontend-ssl.yml up -d
    fi
    
    # Clean up
    echo "Cleaning up..."
    rm "/tmp/$ARCHIVE_NAME"
    
    # Check service status
    echo "Checking service status..."
    docker-compose -f docker-compose.staging.yml ps
    docker-compose -f frontend-ssl.yml ps
EOF

echo "Deployment completed successfully!"
echo "You can now access the staging environment at https://$DOMAIN/"
echo "To check services: SSH_KEY=$SSH_KEY ./scripts/deployment/check_services.sh"