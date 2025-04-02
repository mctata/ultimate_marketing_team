#!/bin/bash
# Script to check the health of services in the staging environment

set -e  # Exit immediately if a command exits with a non-zero status

# Load deployment configuration
DEPLOY_CONFIG="config/env/deployment.env.staging"
if [ -f "$DEPLOY_CONFIG" ]; then
  echo "🔹 Loading deployment configuration from $DEPLOY_CONFIG"
  # Use set -a to export all variables
  set -a
  # Source the file with quotes to handle spaces correctly
  source "$DEPLOY_CONFIG"
  set +a
else
  echo "❌ Deployment configuration file $DEPLOY_CONFIG not found!"
  echo "Please create it from the template and set the correct SSH key path."
  echo "cp config/env/deployment.env.staging.template config/env/deployment.env.staging"
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
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8001 || echo 'Failed to connect to health-api'"

# Check health-api ping endpoint
echo "🔹 Checking health-api ping endpoint..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8001/ping || echo 'Failed to connect to health-api ping endpoint'"

# Check api-gateway endpoint
echo "🔹 Checking api-gateway endpoint..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8000 || echo 'Failed to connect to api-gateway'"

# Check api-gateway health endpoint
echo "🔹 Checking api-gateway health endpoint..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8000/health || echo 'Failed to connect to api-gateway health endpoint'"

# Check simplified version status
echo "🔹 Checking if simplified API is being used..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker logs api-gateway --tail=20 | grep 'Starting simplified API gateway' || echo 'Not using simplified API'"

# Check logs from api-gateway
echo "🔹 Checking api-gateway logs..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker logs api-gateway --tail=20 || echo 'Could not get API Gateway logs'"

# Check logs from health-api
echo "🔹 Checking health-api logs..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker logs umt-health-api --tail=20 || echo 'Could not get Health API logs'"

# Check RDS connection
echo "🔹 Checking database connection..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker exec umt-postgres pg_isready -U postgres || echo 'Could not connect to database'"

# Check frontend
echo "🔹 Checking frontend..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s -I http://localhost:3000 | head -n 1"

echo "✅ Service health check complete!"