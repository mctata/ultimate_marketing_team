#!/bin/bash
# Script to check services in any environment
# Usage: ./scripts/deployment/check_services.sh [environment]
# Example: ./scripts/deployment/check_services.sh staging

set -e

# Default to staging if no environment is specified
DEPLOY_ENV=${1:-"staging"}
echo "Checking all services in $DEPLOY_ENV environment"

# Load environment-specific configuration
ENV_FILE="config/env/deployment.env.$DEPLOY_ENV"
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file $ENV_FILE not found."
    echo "Available environments:"
    ls -1 config/env/deployment.env.* | sed 's/.*deployment.env.//'
    exit 1
fi

# Source the configuration file
source "$ENV_FILE"

# Configuration - use defaults if not set in env file
SSH_USER=${SSH_USER:-"localhost"}
SSH_HOST=${SSH_HOST:-"localhost"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/tmp/local-deploy"}
SSH_KEY=${SSH_KEY:-"~/.ssh/id_rsa"}
COMPOSE_FILE=${COMPOSE_FILE:-"docker-compose.yml"}

echo "Using deployment configuration for $DEPLOY_ENV environment:"
echo "SSH User: $SSH_USER"
echo "SSH Host: $SSH_HOST"
echo "SSH Port: $SSH_PORT"
echo "Remote Directory: $REMOTE_DIR"
echo "SSH Key: $SSH_KEY"
echo "Docker Compose File: $COMPOSE_FILE"

# For local environment, check services locally
if [ "$SSH_HOST" == "localhost" ]; then
    echo "Checking local services..."
    
    if [ ! -d "$REMOTE_DIR" ]; then
        echo "❌ Local deployment directory not found: $REMOTE_DIR"
        exit 1
    fi
    
    cd $REMOTE_DIR
    
    echo "=== Running Containers ==="
    docker-compose -f $COMPOSE_FILE ps
    
    echo ""
    echo "=== Container Logs ==="
    for service in $(docker-compose -f $COMPOSE_FILE config --services); do
        echo "--- $service logs (last 10 lines) ---"
        docker-compose -f $COMPOSE_FILE logs --tail=10 $service
        echo ""
    done
    
    echo "=== Health Checks ==="
    # Check if the API is running locally
    API_URL="http://localhost:8000/api/health"
    echo "Testing API health endpoint: $API_URL"
    if command -v curl &> /dev/null; then
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)
        if [ "$HTTP_STATUS" == "200" ]; then
            echo "✅ API is responding with 200 OK"
        else
            echo "❌ API returned status: $HTTP_STATUS"
        fi
    else
        echo "❌ curl not available, skipping API health check"
    fi
    
else
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
        docker-compose -f $COMPOSE_FILE ps
        
        echo ""
        echo "=== Container Logs ==="
        for service in \$(docker-compose -f $COMPOSE_FILE config --services); do
            echo "--- \$service logs (last 10 lines) ---"
            docker-compose -f $COMPOSE_FILE logs --tail=10 \$service
            echo ""
        done
        
        echo "=== Health Checks ==="
        # Check if the API is running
        API_URL="https://$DEPLOY_ENV.tangible-studios.com/api/health"
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
fi

echo "Service check completed!"