#!/bin/bash
# Script to deploy the Ultimate Marketing Team application to staging

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

# Clean up Docker resources to ensure enough space
echo "🔹 Cleaning up Docker resources..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "docker system prune -af"

# Prepare deployment files
echo "🔹 Preparing deployment package..."
DEPLOY_DIR="tmp_deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR
mkdir -p $DEPLOY_DIR/docker/{agents,api_gateway,frontend,migrations,health-api}
mkdir -p $DEPLOY_DIR/src/{api,core,models,agents,schemas}

# Copy essential files for all services
cp docker-compose.staging.yml $DEPLOY_DIR/docker-compose.yml
cp -r docker/* $DEPLOY_DIR/docker/
cp scripts/deployment/src/health_api.py $DEPLOY_DIR/health_api.py
cp scripts/deployment/src/staging_main.py $DEPLOY_DIR/staging_main.py
cp .env.staging $DEPLOY_DIR/.env

# Copy source code for all services
cp -r src/api/* $DEPLOY_DIR/src/api/
cp -r src/core/* $DEPLOY_DIR/src/core/
cp -r src/models/* $DEPLOY_DIR/src/models/
cp -r src/agents/* $DEPLOY_DIR/src/agents/
[ -d "src/schemas" ] && cp -r src/schemas/* $DEPLOY_DIR/src/schemas/

# Create necessary empty Python packages
touch $DEPLOY_DIR/src/__init__.py
touch $DEPLOY_DIR/src/api/__init__.py
touch $DEPLOY_DIR/src/core/__init__.py
touch $DEPLOY_DIR/src/models/__init__.py
touch $DEPLOY_DIR/src/agents/__init__.py
touch $DEPLOY_DIR/src/schemas/__init__.py

# Create simple health-api Dockerfile in the health-api directory
cat > $DEPLOY_DIR/docker/health-api/Dockerfile << 'EOF'
FROM python:3.10-slim

WORKDIR /app

RUN pip install fastapi uvicorn psutil

COPY health_api.py /app/

EXPOSE 8000

CMD ["python", "health_api.py"]
EOF

# Create a tar file of the deployment directory
TAR_FILE="staging-deploy.tar.gz"
tar -czf $TAR_FILE -C $DEPLOY_DIR .

# Create remote directory if it doesn't exist
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "mkdir -p $REMOTE_DIR"

# Copy the tar file to the remote server
echo "🔹 Copying deployment files to remote server..."
scp -i "$SSH_KEY" -P "$SSH_PORT" $TAR_FILE "$SSH_USER@$SSH_HOST:$REMOTE_DIR/"

# Extract the tar file on the remote server
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && tar -xzf $TAR_FILE && rm $TAR_FILE"

# Deploy health-api first (lightweight service)
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
else
  echo "✅ Health API is running"
fi

# Deploy data services
echo "🔹 Deploying data services (PostgreSQL proxy, Redis, RabbitMQ)..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose up -d postgres-proxy redis rabbitmq vector-db-proxy"

# Deploy API gateway
echo "🔹 Deploying API gateway..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose build api-gateway && docker-compose up -d api-gateway"

# Deploy agent services
echo "🔹 Deploying agent services..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && \
  docker-compose build auth-agent brand-agent content-strategy-agent content-creation-agent content-ad-agent && \
  docker-compose up -d auth-agent brand-agent content-strategy-agent content-creation-agent content-ad-agent"

# Deploy frontend
echo "🔹 Deploying frontend..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose build frontend && docker-compose up -d frontend"

# Run database migrations
echo "🔹 Running database migrations..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose up -d migrations"

# Wait a bit for services to initialize
sleep 10

# Check API gateway
echo "🔹 Verifying API gateway..."
API_HEALTH_CHECK=$(ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8000/api/health || echo 'failed'")
if [[ "$API_HEALTH_CHECK" == *"failed"* ]]; then
  echo "⚠️ API Gateway might not be running correctly. Check logs for more details."
  ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose logs api-gateway"
else
  echo "✅ API Gateway is running"
fi

# Show all running containers
echo "🔹 Deployed containers:"
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose ps"

# Clean up local deployment files
rm $TAR_FILE
rm -rf $DEPLOY_DIR

echo "✅ Deployment to STAGING complete!"
echo "📝 Access the application at: https://$DOMAIN"
echo "📝 Health API: https://$DOMAIN:8001"
echo "📝 API Gateway: https://$DOMAIN:8000"
echo "📝 Frontend: https://$DOMAIN:3000"