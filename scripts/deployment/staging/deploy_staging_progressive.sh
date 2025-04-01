#\!/bin/bash
# Progressive deployment script for staging environment
# This script deploys services one by one to avoid running out of disk space

set -e  # Exit immediately if a command exits with a non-zero status

# Load environment variables
ENV_FILE=".env.staging"
if [ -f "$ENV_FILE" ]; then
  echo "🔹 Loading environment variables from $ENV_FILE"
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "❌ Environment file $ENV_FILE not found\!"
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
  echo "❌ Deployment configuration file $DEPLOY_CONFIG not found\!"
  exit 1
fi

# Check SSH key
if [ \! -f "$SSH_KEY" ]; then
  echo "❌ SSH key not found at $SSH_KEY"
  exit 1
fi

echo "🚀 Starting progressive deployment to STAGING environment"
echo "🔹 Target: $SSH_USER@$SSH_HOST:$SSH_PORT"
echo "🔹 Remote directory: $REMOTE_DIR"

# First, clean up Docker resources
echo "🔹 Cleaning up Docker resources..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose down --remove-orphans"
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "docker system prune -af"
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "docker volume prune -f"

# Create temporary service files
echo "🔹 Preparing service-specific compose files..."

cat > docker-compose.health-api.yml << 'EOL'
version: '3.8'
services:
  health-api:
    build:
      context: .
      dockerfile: Dockerfile.health-api
    ports:
      - "8001:8000"
    environment:
      - ENVIRONMENT=staging
    restart: always
    networks:
      - umt-network
networks:
  umt-network:
    driver: bridge
EOL

cat > docker-compose.api-gateway.yml << 'EOL'
version: '3.8'
services:
  api-gateway:
    build:
      context: .
      dockerfile: ./docker/api_gateway/Dockerfile
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=staging
      - LOG_LEVEL=INFO
      - USE_SIMPLIFIED_API=true
    volumes:
      - ./staging_main.py:/app/src/api/main.py
    restart: always
    networks:
      - umt-network
networks:
  umt-network:
    external: true
EOL

cat > docker-compose.frontend.yml << 'EOL'
version: '3.8'
services:
  frontend:
    build:
      context: .
      dockerfile: ./docker/frontend/Dockerfile
    ports:
      - "3000:80"
    restart: always
    networks:
      - umt-network
networks:
  umt-network:
    external: true
EOL

# Function to deploy a specific service
deploy_service() {
  local service_name=$1
  local compose_file="docker-compose.${service_name}.yml"
  
  echo "🔹 Deploying service: ${service_name}"
  
  # Copy the service compose file to the server
  scp -i "$SSH_KEY" -P "$SSH_PORT" "$compose_file" "$SSH_USER@$SSH_HOST:$REMOTE_DIR/"
  
  # Deploy the service
  ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose -f $compose_file build --no-cache && docker-compose -f $compose_file up -d"
  
  # Check service status
  ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose -f $compose_file ps"
  
  echo "✅ Service ${service_name} deployed successfully"
}

# Copy required files
echo "🔹 Copying required files..."
# Create a deployment package with just the core files
DEPLOY_DIR="tmp_progressive_deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR
mkdir -p $DEPLOY_DIR/docker/api_gateway
mkdir -p $DEPLOY_DIR/docker/frontend

# Copy the essential files
cp ../../monitoring/Dockerfile.health-api ../../monitoring/health_api.py ../../src/api/staging_main.py $DEPLOY_DIR/
cp docker/api_gateway/Dockerfile $DEPLOY_DIR/docker/api_gateway/
cp docker/frontend/Dockerfile $DEPLOY_DIR/docker/frontend/

# Create a tar file of the deployment directory
TAR_FILE="progressive-deploy.tar.gz"
tar -czf $TAR_FILE -C $DEPLOY_DIR .

# Copy the tar file to the remote server
scp -i "$SSH_KEY" -P "$SSH_PORT" $TAR_FILE "$SSH_USER@$SSH_HOST:$REMOTE_DIR/"

# Extract files on the server
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && tar -xzf $TAR_FILE && rm $TAR_FILE"

# Deploy services one by one
deploy_service "health-api"
echo "🔹 Waiting 30 seconds before deploying next service..."
sleep 30

deploy_service "api-gateway"
echo "🔹 Waiting 30 seconds before deploying next service..."
sleep 30

deploy_service "frontend"

# Clean up local files
rm -rf $DEPLOY_DIR docker-compose.*.yml $TAR_FILE

echo "✅ Progressive deployment complete\!"
echo "📝 Services deployed:"
echo "  - Health API: https://$DOMAIN:8001"
echo "  - API Gateway: https://$DOMAIN:8000"
echo "  - Frontend: https://$DOMAIN:3000"
