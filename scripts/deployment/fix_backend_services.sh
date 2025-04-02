#!/bin/bash
# Script to restart backend Docker services on staging server

set -e

# Load deployment configuration
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

echo "🔄 Restarting backend services on staging server..."
echo "🔹 Target: $SSH_USER@$SSH_HOST"

# Run restart
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "
cd $REMOTE_DIR

echo '🔹 Setting higher Docker Compose timeout:'
export COMPOSE_HTTP_TIMEOUT=300

echo '🔹 Stopping and removing frontend container:'
docker-compose stop frontend
docker-compose rm -f frontend

echo '🔹 Stopping and removing API Gateway container:'
docker stop umt-api-gateway 2>/dev/null || true
docker rm -f umt-api-gateway 2>/dev/null || true

echo '🔹 Starting frontend container:'
docker-compose up -d frontend

echo '🔹 Starting API Gateway container:'
docker run -d --name umt-api-gateway \
  --network umt_network \
  -p 8000:8000 \
  -e PYTHONUNBUFFERED=1 \
  -e ENVIRONMENT=staging \
  -v \$PWD/api_gateway.py:/app/api.py \
  --restart always \
  python:3.10-slim \
  bash -c 'pip install --no-cache-dir fastapi uvicorn && cd /app && python -m uvicorn api:app --host 0.0.0.0 --port 8000'

echo '🔹 Waiting for services to start...'
sleep 10

echo '🔹 Checking if frontend container is running:'
docker ps | grep frontend

echo '🔹 Checking if API Gateway container is running:'
docker ps | grep api-gateway

echo '🔹 Testing API Gateway:'
curl -s http://localhost:8000/health || echo 'API Gateway health endpoint not responding'

echo '🔹 Verifying Nginx routing to backend services:'
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl reload nginx

echo '✅ Backend services restart completed'
"

echo "✅ Backend services restart completed!"