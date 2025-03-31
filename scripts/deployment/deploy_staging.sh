#!/bin/bash
# Script to deploy the Ultimate Marketing Team application to staging

set -e  # Exit immediately if a command exits with a non-zero status

# Load environment variables
ENV_FILE=".env.staging"
if [ -f "$ENV_FILE" ]; then
  echo "🔹 Loading environment variables from $ENV_FILE"
  source $ENV_FILE
else
  echo "❌ Environment file $ENV_FILE not found!"
  exit 1
fi

# Load deployment configuration
DEPLOY_CONFIG="config/env/deployment.env.staging.template"
if [ -f "$DEPLOY_CONFIG" ]; then
  echo "🔹 Loading deployment configuration from $DEPLOY_CONFIG"
  source $DEPLOY_CONFIG
else
  echo "❌ Deployment configuration file $DEPLOY_CONFIG not found!"
  exit 1
fi

# Set deploy directory
DEPLOY_DIR="tmp_deploy"
mkdir -p $DEPLOY_DIR

# Check SSH key
if [ ! -f "$SSH_KEY" ]; then
  echo "❌ SSH key not found at $SSH_KEY"
  exit 1
fi

echo "🚀 Starting deployment to STAGING environment"
echo "🔹 Target: $SSH_USER@$SSH_HOST:$SSH_PORT"
echo "🔹 Remote directory: $REMOTE_DIR"
echo "🔹 Using Docker Compose file: $COMPOSE_FILE"

# Copy necessary files to deployment directory
echo "🔹 Preparing deployment files..."
cp -r docker $DEPLOY_DIR/
cp docker-compose.staging.yml $DEPLOY_DIR/
cp .env.staging $DEPLOY_DIR/
cp -r scripts/deployment $DEPLOY_DIR/scripts/
chmod +x $DEPLOY_DIR/scripts/deployment/*.sh

# Create a tar file of the deployment directory
echo "🔹 Creating deployment archive..."
TAR_FILE="ultimate-marketing-staging-deploy.tar.gz"
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
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose -f $COMPOSE_FILE down --remove-orphans"

# Make scripts executable
echo "🔹 Making scripts executable..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && chmod +x scripts/deployment/*.sh"

# Initialize RDS database
echo "🔹 Initializing RDS database..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && scripts/deployment/init_rds_database.sh"

# Start the containers
echo "🔹 Starting containers..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose -f $COMPOSE_FILE up -d --build"

# Verify deployment
echo "🔹 Verifying deployment..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && \
    echo 'Container status:' && \
    docker ps && \
    echo 'Logs from api-gateway service:' && \
    docker-compose -f $COMPOSE_FILE logs --tail=50 api-gateway"

# Clean up local deployment files
echo "🔹 Cleaning up local deployment files..."
rm $TAR_FILE
rm -rf $DEPLOY_DIR

echo "✅ Deployment to STAGING complete!"
echo "📝 Access the application at: http://$SSH_HOST"
echo "📝 Health API: http://$SSH_HOST:8001"
echo "📝 API Gateway: http://$SSH_HOST:8000"
echo "📝 Frontend: http://$SSH_HOST:3000"