#\!/bin/bash
# Script to deploy only the health-api to staging

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

# Set deploy directory
DEPLOY_DIR="tmp_minimal_deploy"
# Clean up any existing deployment directory
rm -rf $DEPLOY_DIR
# Create directory structure
mkdir -p $DEPLOY_DIR

# Check SSH key
if [ \! -f "$SSH_KEY" ]; then
  echo "❌ SSH key not found at $SSH_KEY"
  exit 1
fi

echo "🚀 Starting minimal deployment to STAGING environment"
echo "🔹 Target: $SSH_USER@$SSH_HOST:$SSH_PORT"
echo "🔹 Remote directory: $REMOTE_DIR"

# Copy necessary files to deployment directory
echo "🔹 Preparing deployment files..."
cp docker-compose.minimal.yml health_api.py Dockerfile.health-api $DEPLOY_DIR/

# Create a tar file of the deployment directory
echo "🔹 Creating deployment archive..."
TAR_FILE="health-api-deploy.tar.gz"
tar -czf $TAR_FILE -C $DEPLOY_DIR .

# Create remote directory if it doesn't exist
echo "🔹 Creating remote directory if it doesn't exist..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "mkdir -p $REMOTE_DIR"

# Copy the tar file to the remote server
echo "🔹 Copying deployment files to remote server..."
scp -i "$SSH_KEY" -P "$SSH_PORT" $TAR_FILE "$SSH_USER@$SSH_HOST:$REMOTE_DIR/"

# Extract the tar file on the remote server
echo "🔹 Extracting deployment files on remote server..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && tar -xzf $TAR_FILE && rm $TAR_FILE"

# Stop and remove existing containers
echo "🔹 Stopping existing containers..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose down --remove-orphans"

# Start the health-api container with forced rebuild
echo "🔹 Starting health-api container with forced rebuild..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose -f docker-compose.minimal.yml build --no-cache && docker-compose -f docker-compose.minimal.yml up -d"

# Verify deployment
echo "🔹 Verifying health-api deployment..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && \
    echo 'Container status:' && \
    docker ps && \
    echo 'Logs from health-api service:' && \
    docker-compose -f docker-compose.minimal.yml logs --tail=20 health-api"

# Check health-api endpoint
echo "🔹 Checking health-api endpoint..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8001 || echo 'Failed to connect to health-api'"

# Check health-api ping endpoint
echo "🔹 Checking health-api ping endpoint..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8001/ping || echo 'Failed to connect to health-api ping endpoint'"

# Clean up local deployment files
echo "🔹 Cleaning up local deployment files..."
rm $TAR_FILE
rm -rf $DEPLOY_DIR

echo "✅ Minimal deployment to STAGING complete\!"
echo "📝 Health API: http://$DOMAIN:8001"
