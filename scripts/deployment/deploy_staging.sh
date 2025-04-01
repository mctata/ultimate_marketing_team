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

# Check free disk space on the server
echo "🔹 Checking disk space on server..."
DISK_SPACE=$(ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "df -h / | tail -1 | awk '{print \$5}' | sed 's/%//'")
if [ "$DISK_SPACE" -gt 85 ]; then
  echo "⚠️ Warning: Disk space is limited (${DISK_SPACE}% used). Performing thorough cleanup..."
  # Try to free up space by cleaning Docker resources
  ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "docker system prune -af --volumes && docker builder prune -af"
fi

# Stop all containers first to release resources
echo "🔹 Stopping existing containers..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose down --remove-orphans || true"

# Prepare deployment files
echo "🔹 Preparing deployment package..."
DEPLOY_DIR="tmp_deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy essential files
cp docker-compose.staging.yml $DEPLOY_DIR/docker-compose.yml
mkdir -p $DEPLOY_DIR/monitoring
cp monitoring/health_api.py $DEPLOY_DIR/monitoring/health_api.py
cp monitoring/Dockerfile.health-api $DEPLOY_DIR/monitoring/Dockerfile.health-api
cp src/api/staging_main.py $DEPLOY_DIR/staging_main.py
cp .env.staging $DEPLOY_DIR/.env

# No need to create Dockerfile here - we're copying it from the monitoring directory

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

# Copy source code directories (without using tar to avoid memory issues)
echo "🔹 Copying source code directories..."
DIRS=("src" "docker" "monitoring")
for dir in "${DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "  Copying $dir directory..."
    ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "mkdir -p $REMOTE_DIR/$dir"
    rsync -av --delete -e "ssh -i $SSH_KEY -p $SSH_PORT" --exclude "*.pyc" --exclude "__pycache__" $dir/ "$SSH_USER@$SSH_HOST:$REMOTE_DIR/$dir/"
  fi
done

# Ensure required directories exist
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "mkdir -p $REMOTE_DIR/src/api $REMOTE_DIR/src/core $REMOTE_DIR/src/models $REMOTE_DIR/src/agents $REMOTE_DIR/monitoring"

# Create __init__.py files where needed
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "touch $REMOTE_DIR/src/__init__.py $REMOTE_DIR/src/api/__init__.py $REMOTE_DIR/src/core/__init__.py $REMOTE_DIR/src/models/__init__.py $REMOTE_DIR/src/agents/__init__.py"

# Deploy services in stages to manage disk space
echo "🔹 Deploying infrastructure services first..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose up -d postgres-proxy redis rabbitmq vector-db-proxy"

# Deploy health-api as the first application service
echo "🔹 Deploying health-api service..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose build health-api && docker-compose up -d health-api"

# Check health-api is working
echo "🔹 Checking health-api..."
HEALTH_CHECK=$(ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8001/ping || echo 'failed'")
if [ "$HEALTH_CHECK" = "failed" ]; then
  echo "❌ Health API failed to start. Check server logs."
  ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose logs health-api"
else
  echo "✅ Health API is running"
fi

# Deploy API gateway
echo "🔹 Deploying API gateway..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose build api-gateway && docker-compose up -d api-gateway"

# Run database migrations before starting agents
echo "🔹 Running database migrations..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose up -d migrations"

# Deploy agent services one by one to avoid resource exhaustion
echo "🔹 Deploying agent services individually..."
AGENTS=("auth-agent" "brand-agent" "content-strategy-agent" "content-creation-agent" "content-ad-agent")
for agent in "${AGENTS[@]}"; do
  echo "  Starting $agent..."
  ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose build $agent && docker-compose up -d $agent"
  sleep 2  # Give a short pause between agents
done

# Deploy frontend last
echo "🔹 Deploying frontend..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose build frontend && docker-compose up -d frontend"

# Wait a bit for services to initialize
sleep 5

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
rm -rf $DEPLOY_DIR $TAR_FILE

echo "✅ Deployment to STAGING complete!"
echo "📝 Access the application at: https://$DOMAIN"
echo "📝 Health API: https://$DOMAIN:8001"
echo "📝 API Gateway: https://$DOMAIN:8000"
echo "📝 Frontend: https://$DOMAIN:3000"