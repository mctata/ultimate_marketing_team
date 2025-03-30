#!/bin/bash
# Script to check services in staging environment

set -e

# Source utility functions
source "$(dirname "$0")/../shared/utils.sh"

# Configuration
SSH_USER=${SSH_USER:-"tangible-studios.com"}
SSH_HOST=${SSH_HOST:-"ssh.tangible-studios.com"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/customers/8/2/5/tangible-studios.com/httpd.www/staging"}
SSH_KEY=${SSH_KEY:-"~/.ssh/id_rsa"}

# Check if SSH credentials are provided
if [[ "$SSH_USER" == "your_ssh_user" ]]; then
    echo "Error: SSH_USER not set. Run with SSH_USER=username SSH_HOST=hostname ./scripts/deployment/staging/check_services.sh"
    exit 1
fi

# Check services
check_services "$SSH_USER" "$SSH_HOST" "$REMOTE_DIR" "$SSH_KEY" "$SSH_PORT" "docker-compose.staging.yml"

echo "Service check completed!"