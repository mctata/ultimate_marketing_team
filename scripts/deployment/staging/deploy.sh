#!/bin/bash
# Deployment script for staging environment

set -e

# Source utility functions
source "$(dirname "$0")/../shared/utils.sh"

# Configuration
SSH_USER=${SSH_USER:-"tangible-studios.com"}
SSH_HOST=${SSH_HOST:-"ssh.tangible-studios.com"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/customers/8/2/5/tangible-studios.com/httpd.www/staging"}
SSH_KEY=${SSH_KEY:-"~/.ssh/id_rsa"}

echo "Starting deployment to staging environment: $SSH_USER@$SSH_HOST:$REMOTE_DIR"

# Check if SSH credentials are provided
if [[ "$SSH_USER" == "your_ssh_user" ]]; then
    echo "Error: SSH_USER not set. Run with SSH_USER=username SSH_HOST=hostname ./scripts/deployment/staging/deploy.sh"
    exit 1
fi

# Copy environment files if needed
if [ -f deployment_secrets/.env.staging.real ]; then
    echo "Using real credentials from deployment_secrets folder..."
    cp deployment_secrets/.env.staging.real .env.tmp
else
    echo "Using template credentials from config/env folder (WILL NEED TO BE UPDATED)..."
    cp config/env/.env.staging .env.tmp
fi

if [ -f frontend/.env.staging ]; then
    cp frontend/.env.staging frontend/.env.tmp
elif [ -f deployment_secrets/frontend.env.staging.real ]; then
    cp deployment_secrets/frontend.env.staging.real frontend/.env.tmp
else
    cp frontend/.env.staging.template frontend/.env.tmp
fi

# Create archive
ARCHIVE_NAME=$(create_deployment_archive "--exclude='.env' --exclude='frontend/.env'")

# Restore environment files
if [ -f .env.tmp ]; then
    mv .env.tmp .env
fi

if [ -f frontend/.env.tmp ]; then
    mv frontend/.env.tmp frontend/.env
fi

# Deploy archive
deploy_archive "$ARCHIVE_NAME" "$SSH_USER" "$SSH_HOST" "$REMOTE_DIR" "$SSH_KEY" "$SSH_PORT" "docker-compose.staging.yml"

echo "Staging deployment completed successfully!"
echo "You can now access the staging environment at https://staging.tangible-studios.com/"