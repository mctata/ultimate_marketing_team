#!/bin/bash
# Script to connect to the staging environment
set -e

echo "======== CONNECTING TO STAGING ENVIRONMENT ========"

# Get the project root directory
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../" && pwd)
cd "$PROJECT_ROOT"

# Load environment variables
DEPLOY_ENV_FILE="config/env/deployment.env.staging"

if [ ! -f "$DEPLOY_ENV_FILE" ]; then
    echo "❌ Error: Deployment configuration file not found at $DEPLOY_ENV_FILE"
    echo "Creating from template..."
    
    if [ ! -f "$DEPLOY_ENV_FILE.template" ]; then
        echo "❌ Error: Template file not found. Cannot continue."
        exit 1
    fi
    
    # Create a copy from template
    cp "$DEPLOY_ENV_FILE.template" "$DEPLOY_ENV_FILE"
    echo "✅ Created $DEPLOY_ENV_FILE from template"
    echo "Please edit the file with your staging environment details before continuing."
    exit 1
fi

# Source the configuration file
source "$DEPLOY_ENV_FILE"

# Check if the SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Error: SSH key file not found at $SSH_KEY"
    
    # Check if the default staging key exists
    DEFAULT_KEY="ultimate-marketing-staging.pem"
    if [ -f "$DEFAULT_KEY" ]; then
        SSH_KEY="$DEFAULT_KEY"
        echo "✅ Using default key: $DEFAULT_KEY"
    else
        echo "Please update the SSH_KEY path in $DEPLOY_ENV_FILE"
        exit 1
    fi
fi

# Set key permissions
chmod 600 "$SSH_KEY"

# Display connection information
echo "Connecting to staging environment:"
echo "Host: $SSH_HOST"
echo "User: $SSH_USER"
echo "Key:  $SSH_KEY"
echo "Remote directory: $REMOTE_DIR"
echo ""

# Connect to the staging server
if [ "$1" == "--command" ] || [ "$1" == "-c" ]; then
    # Execute a command remotely and return
    if [ -z "$2" ]; then
        echo "❌ Error: No command provided after --command/-c option"
        echo "Usage: $0 --command 'your command here'"
        exit 1
    fi
    
    echo "Executing command: $2"
    ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && $2"
else
    # Interactive SSH session
    echo "Opening SSH session to staging environment..."
    echo "Use 'exit' to return to your local machine"
    echo ""
    
    ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST"
fi