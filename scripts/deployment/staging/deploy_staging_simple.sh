#\!/bin/bash
# Simple, efficient deployment script for staging

set -e  # Exit immediately if a command exits with a non-zero status

# Load environment variables
ENV_FILE=".env.staging"
if [ -f "$ENV_FILE" ]; then
  echo "🔹 Loading environment variables from $ENV_FILE"
  source "$ENV_FILE"
else
  echo "❌ Environment file $ENV_FILE not found\!"
  exit 1
fi

# Load deployment configuration
DEPLOY_CONFIG="config/env/deployment.env.staging"
if [ -f "$DEPLOY_CONFIG" ]; then
  echo "🔹 Loading deployment configuration from $DEPLOY_CONFIG"
  source "$DEPLOY_CONFIG"
else
  echo "❌ Deployment configuration file $DEPLOY_CONFIG not found\!"
  exit 1
fi

# Check SSH key
if [ \! -f "$SSH_KEY" ]; then
  echo "❌ SSH key not found at $SSH_KEY"
  exit 1
fi

echo "🚀 Deploying to STAGING"
echo "🔹 Target: $SSH_USER@$SSH_HOST:$SSH_PORT"

# 1. Clean up remote Docker resources first
echo "🧹 Cleaning up Docker resources..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "docker system prune -af --volumes && echo '✅ Cleanup complete'"

# 2. Prepare deployment files locally
echo "📦 Preparing deployment files..."
DEPLOY_DIR="staging_deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy only what's needed
cp -r docker $DEPLOY_DIR/
cp docker-compose.staging.yml $DEPLOY_DIR/docker-compose.yml
cp ../../monitoring/Dockerfile.health-api ../../monitoring/health_api.py ../../src/api/staging_main.py $DEPLOY_DIR/
cp .env.staging $DEPLOY_DIR/.env

# Create the tar file
TAR_FILE="staging_deploy.tar.gz"
tar -czf $TAR_FILE -C $DEPLOY_DIR .
rm -rf $DEPLOY_DIR

# 3. Copy and deploy
echo "🚚 Copying deployment files..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "mkdir -p $REMOTE_DIR"
scp -i "$SSH_KEY" -P "$SSH_PORT" $TAR_FILE "$SSH_USER@$SSH_HOST:$REMOTE_DIR/"

echo "🔧 Deploying services..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && \
  tar -xzf $TAR_FILE && \
  rm $TAR_FILE && \
  docker-compose build health-api && \
  docker-compose up -d health-api && \
  echo '✅ Health API deployed' && \
  sleep 5 && \
  docker-compose build api-gateway && \
  docker-compose up -d api-gateway && \
  echo '✅ API Gateway deployed' && \
  docker-compose ps"

# 4. Check deployment
echo "🔍 Checking deployment..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8001/ping || echo 'Health API not responding'"

# Clean up local files
rm $TAR_FILE

echo "✅ Deployment complete\!"
echo "Health API: https://$DOMAIN:8001"
echo "API Gateway: https://$DOMAIN:8000"
