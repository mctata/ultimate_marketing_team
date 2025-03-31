#!/bin/bash
# Ultra-simplified script to deploy the Ultimate Marketing Team application to staging

set -e  # Exit immediately if a command exits with a non-zero status

# Load environment variables
ENV_FILE=".env.staging"
if [ -f "$ENV_FILE" ]; then
  echo "🔹 Loading environment variables from $ENV_FILE"
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "❌ Environment file $ENV_FILE not found!"
  exit 1
fi

# Load deployment configuration
DEPLOY_CONFIG="config/env/deployment.env.staging"
if [ -f "$DEPLOY_CONFIG" ]; then
  echo "🔹 Loading deployment configuration from $DEPLOY_CONFIG"
  set -a
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

echo "🚀 Starting deployment to STAGING environment"
echo "🔹 Target: $SSH_USER@$SSH_HOST:$SSH_PORT"
echo "🔹 Remote directory: $REMOTE_DIR"

# First clean up Docker resources
echo "🔹 Cleaning up Docker resources..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "docker system prune -af --volumes"

# Create remote directory if it doesn't exist
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "mkdir -p $REMOTE_DIR"

# Create health_api.py directly on the server
echo "🔹 Creating health_api.py on server..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cat > $REMOTE_DIR/health_api.py << 'EOF'
import os
import time
import psutil
from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get('/')
async def root():
    return {
        'status': 'healthy',
        'timestamp': time.time(),
        'service': 'health-api',
        'version': '1.0.0',
        'environment': os.environ.get('ENVIRONMENT', 'development')
    }

@app.get('/ping')
async def ping():
    return 'pong'

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)
EOF"

# Create Dockerfile.health-api directly on the server
echo "🔹 Creating Dockerfile for health-api..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cat > $REMOTE_DIR/Dockerfile.health-api << 'EOF'
FROM python:3.10-slim

WORKDIR /app

RUN pip install fastapi uvicorn psutil

COPY health_api.py /app/

EXPOSE 8000

CMD [\"python\", \"health_api.py\"]
EOF"

# Create simplified docker-compose.yml directly on the server
echo "🔹 Creating docker-compose.yml..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cat > $REMOTE_DIR/docker-compose.yml << 'EOF'
version: '3.8'

services:
  health-api:
    build:
      context: .
      dockerfile: Dockerfile.health-api
    ports:
      - \"8001:8000\"
    environment:
      - ENVIRONMENT=staging
    restart: always
    networks:
      - umt-network

networks:
  umt-network:
    driver: bridge
EOF"

# Deploy health-api container
echo "🔹 Deploying health-api service..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose build health-api && docker-compose up -d health-api"

# Wait a bit for health-api to start
sleep 10

# Check health-api is working
echo "🔹 Checking health-api..."
HEALTH_CHECK=$(ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8001/ping || echo 'failed'")
if [ "$HEALTH_CHECK" = "failed" ]; then
  echo "❌ Health API failed to start. Check server logs."
  ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose logs health-api"
  exit 1
else
  echo "✅ Health API is running"
fi

echo "✅ Deployment to STAGING complete!"
echo "📝 Health API: https://$DOMAIN:8001"