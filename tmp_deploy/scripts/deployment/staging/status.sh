#!/bin/bash
# Script to check the status of the staging environment
set -e

echo "======== CHECKING STAGING ENVIRONMENT STATUS ========"

# Get the project root directory
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../" && pwd)
cd "$PROJECT_ROOT"

# Load environment variables
DEPLOY_ENV_FILE="config/env/deployment.env.staging"

if [ ! -f "$DEPLOY_ENV_FILE" ]; then
    echo "❌ Error: Deployment configuration file not found at $DEPLOY_ENV_FILE"
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

# Display environment information
echo "Staging environment details:"
echo "Host: $SSH_HOST"
echo "User: $SSH_USER"
echo "Directory: $REMOTE_DIR"
echo "Compose file: $COMPOSE_FILE"
echo ""

# Check SSH connection
echo "1. Testing SSH connection..."
if ssh -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=5 "$SSH_USER@$SSH_HOST" "echo 'Connection successful'"; then
    echo "✅ SSH connection successful"
else
    echo "❌ SSH connection failed"
    exit 1
fi

# Check if project directory exists
echo "2. Checking project directory..."
if ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "test -d $REMOTE_DIR && echo 'Directory exists'"; then
    echo "✅ Project directory found"
else
    echo "❌ Project directory not found"
    exit 1
fi

# Check docker and docker-compose
echo "3. Checking Docker status..."
DOCKER_STATUS=$(ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker ps --format 'table {{.Names}}\t{{.Status}}' 2>/dev/null || echo 'Docker command failed'")

if [[ "$DOCKER_STATUS" == *"Docker command failed"* ]]; then
    echo "❌ Docker not running or not accessible"
    exit 1
else
    echo "✅ Docker is running"
    echo ""
    echo "Running containers:"
    echo "$DOCKER_STATUS"
fi

# Check application services
echo ""
echo "4. Checking application services status..."
SERVICES=$(ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose -f $COMPOSE_FILE ps --services 2>/dev/null || echo 'Docker Compose command failed'")

if [[ "$SERVICES" == *"Docker Compose command failed"* ]]; then
    echo "❌ Docker Compose not working or compose file not found"
    exit 1
else
    echo "✅ Services defined in docker-compose:"
    echo "$SERVICES"
    
    # Check if services are running
    RUNNING_SERVICES=$(ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose -f $COMPOSE_FILE ps | grep 'Up' | awk '{print \$1}'")
    if [ -z "$RUNNING_SERVICES" ]; then
        echo "⚠️ No services are currently running"
    else
        echo "✅ Running services:"
        echo "$RUNNING_SERVICES"
    fi
fi

# Check the application endpoints
echo ""
echo "5. Checking application endpoints..."
API_STATUS=$(ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health 2>/dev/null || echo 'failed'")

if [ "$API_STATUS" == "200" ]; then
    echo "✅ API endpoint is responding (HTTP 200)"
else
    echo "❌ API endpoint is not responding (Status: $API_STATUS)"
fi

# Check frontend
FRONTEND_STATUS=$(ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>/dev/null || echo 'failed'")

if [ "$FRONTEND_STATUS" == "200" ]; then
    echo "✅ Frontend is responding (HTTP 200)"
else
    echo "❌ Frontend is not responding (Status: $FRONTEND_STATUS)"
fi

echo ""
echo "======== STAGING ENVIRONMENT STATUS SUMMARY ========"
echo "SSH Connection: OK"
echo "Project Directory: $REMOTE_DIR"
echo "Docker Status: Running"
echo "API Health: $([ "$API_STATUS" == "200" ] && echo "Healthy" || echo "Not responding")"
echo "Frontend: $([ "$FRONTEND_STATUS" == "200" ] && echo "Accessible" || echo "Not responding")"
echo ""
echo "To connect to the staging server, run:"
echo "./scripts/deployment/staging/connect.sh"
echo ""
echo "To execute a specific command on the staging server, run:"
echo "./scripts/deployment/staging/connect.sh -c 'your command here'"