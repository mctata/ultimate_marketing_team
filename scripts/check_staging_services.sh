#!/bin/bash
# Script to check services in staging environment

set -e

echo "Checking all services in staging environment"

# Configuration
SSH_USER=${SSH_USER:-"tangible-studios.com"}
SSH_HOST=${SSH_HOST:-"ssh.tangible-studios.com"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/customers/8/2/5/tangible-studios.com/httpd.www/staging"}
SSH_KEY=${SSH_KEY:-"~/.ssh/id_rsa"}

# Check if SSH credentials are provided
if [[ "$SSH_USER" == "your_ssh_user" ]]; then
    echo "Error: SSH_USER not set. Run with SSH_USER=username SSH_HOST=hostname ./scripts/check_staging_services.sh"
    exit 1
fi

# Execute remote commands
echo "Connecting to server to check services..."
ssh -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST << EOF
    set -e
    echo "Connected to the server..."
    
    # Navigate to the project directory
    cd $REMOTE_DIR
    
    echo "=== Running Containers ==="
    docker-compose -f docker-compose.staging.yml ps
    
    echo ""
    echo "=== Container Logs ==="
    for service in \$(docker-compose -f docker-compose.staging.yml config --services); do
        echo "--- \$service logs (last 10 lines) ---"
        docker-compose -f docker-compose.staging.yml logs --tail=10 \$service
        echo ""
    done
EOF

echo "Service check completed!"