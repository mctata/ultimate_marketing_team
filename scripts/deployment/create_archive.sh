#!/bin/bash
# Simple script to create a deployment archive without attempting to deploy it

set -e

echo "Creating deployment archive..."

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
    --exclude='*.tar.gz' --exclude='deployment_archives/old' \
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
DEPLOY_ARCHIVE="deployment_archives/staging_deploy_$(date +%Y%m%d_%H%M%S).tar.gz"
mkdir -p deployment_archives
tar -czf $DEPLOY_ARCHIVE -C $TEMP_DIR .
echo "Created deployment archive: $DEPLOY_ARCHIVE"

# Clean up local temporary files
echo "Cleaning up local temporary files..."
rm -rf $TEMP_DIR

echo "Archive creation completed successfully!"