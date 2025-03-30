#!/bin/bash
# Script to check services in EC2 environment

set -e

# Source utility functions
source "$(dirname "$0")/../shared/utils.sh"

# Configuration
SSH_USER=${SSH_USER:-"ubuntu"}
SSH_HOST=${SSH_HOST:-"ec2-44-202-29-233.compute-1.amazonaws.com"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/home/ubuntu/ultimate-marketing-team"}
SSH_KEY=${SSH_KEY:-"ultimate-marketing-staging.pem"}

# Verify SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key file '$SSH_KEY' not found."
    echo "Please provide the path to your SSH key file using SSH_KEY=path/to/key"
    exit 1
fi

# Check services
check_services "$SSH_USER" "$SSH_HOST" "$REMOTE_DIR" "$SSH_KEY" "$SSH_PORT" "docker-compose.ec2.yml"

echo "Service check completed!"