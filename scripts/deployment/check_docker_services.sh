#!/bin/bash
# Script to check Docker services on staging server

set -e

# Load deployment configuration (just need SSH_KEY, SSH_USER, SSH_HOST)
DEPLOY_CONFIG="config/env/deployment.env.staging"
if [ -f "$DEPLOY_CONFIG" ]; then
  echo "🔹 Loading deployment configuration from $DEPLOY_CONFIG"
  source "$DEPLOY_CONFIG"
else
  echo "❌ Deployment configuration file $DEPLOY_CONFIG not found!"
  exit 1
fi

# Check SSH key
if [ ! -f "$SSH_KEY" ]; then
  echo "❌ SSH key not found at $SSH_KEY"
  exit 1
fi
chmod 600 "$SSH_KEY"

echo "🔍 Checking Docker services on staging server..."
echo "🔹 Target: $SSH_USER@$SSH_HOST"

# Run checks
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "
echo '🔹 Checking running Docker containers:'
docker ps

echo '🔹 Checking Docker networks:'
docker network ls

echo '🔹 Checking if frontend container is running:'
docker ps | grep frontend || echo 'Frontend container not running!'

echo '🔹 Checking if API Gateway container is running:'
docker ps | grep api-gateway || echo 'API Gateway container not running!'

echo '🔹 Checking local port bindings:'
sudo apt-get install -y net-tools || true
sudo netstat -tlnp || echo 'Unable to check port bindings'

echo '🔹 Checking Docker logs for frontend container:'
docker logs \$(docker ps -q --filter name=frontend) 2>&1 | tail -n 20 || echo 'No frontend logs available'

echo '🔹 Checking Docker logs for API Gateway container:'
docker logs \$(docker ps -q --filter name=api-gateway) 2>&1 | tail -n 20 || echo 'No API Gateway logs available'

echo '✅ Docker service check completed'
"

echo "✅ Docker services check completed!"