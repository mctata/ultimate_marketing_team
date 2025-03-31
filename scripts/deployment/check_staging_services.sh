#!/bin/bash
# Script to check the health of services in the staging environment

set -e  # Exit immediately if a command exits with a non-zero status

# Load deployment configuration
DEPLOY_CONFIG="config/env/deployment.env.staging.template"
if [ -f "$DEPLOY_CONFIG" ]; then
  echo "🔹 Loading deployment configuration from $DEPLOY_CONFIG"
  # Use set -a to export all variables
  set -a
  # Source the file with quotes to handle spaces correctly
  source "$DEPLOY_CONFIG"
  set +a
else
  echo "❌ Deployment configuration file $DEPLOY_CONFIG not found!"
  exit 1
fi

# Check SSH key
if [ ! -f "$SSH_KEY" ]; then
  echo "❌ SSH key not found at $SSH_KEY"
  exit 1
fi

echo "🔍 Checking services on STAGING environment"
echo "🔹 Target: $SSH_USER@$SSH_HOST:$SSH_PORT"
echo "🔹 Remote directory: $REMOTE_DIR"

# Check container status
echo "🔹 Checking container status..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker ps"

# Check health-api endpoint
echo "🔹 Checking health-api endpoint..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8001 | jq"

# Check api-gateway endpoint
echo "🔹 Checking api-gateway endpoint..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8000 | jq"

# Check api-gateway health endpoint
echo "🔹 Checking api-gateway health endpoint..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8000/api/health | jq"

# Check logs from api-gateway
echo "🔹 Checking api-gateway logs..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose -f $COMPOSE_FILE logs --tail=20 api-gateway"

# Check logs from health-api
echo "🔹 Checking health-api logs..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose -f $COMPOSE_FILE logs --tail=20 health-api"

# Check RDS connection
echo "🔹 Checking RDS connection..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && scripts/deployment/init_rds_database.sh"

# Check frontend
echo "🔹 Checking frontend..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s -I http://localhost:3000 | head -n 1"

echo "✅ Service health check complete!"