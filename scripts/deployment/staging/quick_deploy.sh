#!/bin/bash
# Quick deployment script for staging that uses an existing archive

set -e

# Source utility functions
source "$(dirname "$0")/../shared/utils.sh"

# Configuration
SSH_USER=${SSH_USER:-"tangible-studios.com"}
SSH_HOST=${SSH_HOST:-"ssh.tangible-studios.com"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/customers/8/2/5/tangible-studios.com/httpd.www/staging"}
SSH_KEY=${SSH_KEY:-"~/.ssh/id_rsa"}
ARCHIVE_NAME=${1}

# Check if archive name is provided
if [ -z "$ARCHIVE_NAME" ]; then
    echo "Error: Archive name not provided."
    echo "Usage: ./scripts/deployment/staging/quick_deploy.sh <archive_name>"
    echo "Available archives:"
    ls -la scripts/deployment/archives/
    exit 1
fi

# Check if archive exists
if [ ! -f "scripts/deployment/archives/$ARCHIVE_NAME" ]; then
    echo "Error: Archive not found at scripts/deployment/archives/$ARCHIVE_NAME"
    echo "Available archives:"
    ls -la scripts/deployment/archives/
    exit 1
fi

echo "Starting quick deployment to staging with archive: $ARCHIVE_NAME"

# Deploy the archive
deploy_archive "$ARCHIVE_NAME" "$SSH_USER" "$SSH_HOST" "$REMOTE_DIR" "$SSH_KEY" "$SSH_PORT" "docker-compose.staging.yml"

echo "Quick deployment completed successfully!"
echo "You can now access the staging environment at https://staging.tangible-studios.com/"