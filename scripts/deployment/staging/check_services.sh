#!/bin/bash
# Script to check services in staging environment
# Usage: ./scripts/deployment/staging/check_services.sh

set -e

echo "Checking all services in staging environment"

# Configuration
SSH_USER=${SSH_USER:-"ubuntu"}
SSH_HOST=${SSH_HOST:-"ec2-44-202-29-233.compute-1.amazonaws.com"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/home/ubuntu/ultimate-marketing-team"}
SSH_KEY=${SSH_KEY:-"ultimate-marketing-staging.pem"}

# Test connection first
echo "Testing SSH connection to $SSH_USER@$SSH_HOST:$SSH_PORT..."
ssh -q -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST exit
if [ $? -ne 0 ]; then
    echo "SSH connection failed. Please check your SSH credentials and try again."
    exit 1
fi
echo "SSH connection successful."

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
    
    echo "=== Health Checks ==="
    # Check if the API is running
    API_URL="https://staging.tangible-studios.com/api/health"
    echo "Testing API health endpoint: $API_URL"
    if command -v curl &> /dev/null; then
        HTTP_STATUS=\$(curl -s -o /dev/null -w "%{http_code}" $API_URL)
        if [ "\$HTTP_STATUS" == "200" ]; then
            echo "✅ API is responding with 200 OK"
        else
            echo "❌ API returned status: \$HTTP_STATUS"
        fi
    else
        echo "❌ curl not available, skipping API health check"
    fi
EOF

echo "Service check completed!"