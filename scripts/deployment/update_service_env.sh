#!/bin/bash
# Script to update environment variables for a specific Docker service

set -e  # Exit immediately if a command exits with a non-zero status

# Check arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <service_name> [env_var=value ...]"
    echo "Example: $0 api-gateway LOG_LEVEL=DEBUG ENVIRONMENT=staging"
    exit 1
fi

SERVICE_NAME=$1
shift  # Remove service name from args

# Load environment variables
ENV_FILE=".env.staging"
if [ -f "$ENV_FILE" ]; then
    echo "🔹 Loading environment variables from $ENV_FILE"
    source $ENV_FILE
else
    echo "❌ Environment file $ENV_FILE not found!"
    exit 1
fi

# Load deployment configuration
DEPLOY_CONFIG="config/env/deployment.env.staging.template"
if [ -f "$DEPLOY_CONFIG" ]; then
    echo "🔹 Loading deployment configuration from $DEPLOY_CONFIG"
    source $DEPLOY_CONFIG
else
    echo "❌ Deployment configuration file $DEPLOY_CONFIG not found!"
    exit 1
fi

# Check SSH key
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found at $SSH_KEY"
    exit 1
fi

echo "🔍 Updating environment variables for service: $SERVICE_NAME"
echo "🔹 Target: $SSH_USER@$SSH_HOST:$SSH_PORT"
echo "🔹 Remote directory: $REMOTE_DIR"

# Update environment variables for the service
echo "🔹 Variables to update: $@"

ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && \
    docker-compose -f $COMPOSE_FILE stop $SERVICE_NAME && \
    docker-compose -f $COMPOSE_FILE rm -f $SERVICE_NAME && \
    docker-compose -f $COMPOSE_FILE up -d --no-deps $SERVICE_NAME"

echo "✅ Environment variables updated for $SERVICE_NAME!"
echo "🔹 Checking service logs..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && \
    docker-compose -f $COMPOSE_FILE logs --tail=20 $SERVICE_NAME"