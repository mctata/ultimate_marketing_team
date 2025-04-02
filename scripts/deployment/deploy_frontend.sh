#!/bin/bash
# Script to build and deploy the React frontend on staging server

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
  # Look for the SSH key in common locations
  for possible_key in ~/.ssh/id_rsa ~/.ssh/id_ed25519 ~/.ssh/ultimate-marketing-staging.pem; do
    if [ -f "$possible_key" ]; then
      echo "🔑 Found SSH key at $possible_key, using it instead."
      SSH_KEY="$possible_key"
      break
    fi
  done
  
  # If still not found, exit
  if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Cannot find a suitable SSH key."
    exit 1
  fi
fi

chmod 600 "$SSH_KEY"

# Verify frontend directory exists
if [ ! -d "frontend" ]; then
  echo "❌ Frontend directory not found!"
  exit 1
fi

echo "🔄 Deploying frontend to staging server..."
echo "🔹 Target: $SSH_USER@$SSH_HOST:$SSH_PORT"

# Create temp directory for deployment
TMP_DIR="tmp_frontend_deploy"
rm -rf $TMP_DIR
mkdir -p $TMP_DIR

# Copy frontend files (excluding node_modules and dist)
echo "🔹 Preparing frontend files..."
rsync -a --exclude node_modules --exclude dist frontend/ $TMP_DIR/

# Create tar file
TAR_FILE="frontend_deploy.tar.gz"
tar -czf $TAR_FILE -C $TMP_DIR .

# Copy the tar file to the server
echo "🔹 Copying files to server..."
scp -i "$SSH_KEY" -P "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no $TAR_FILE "$SSH_USER@$SSH_HOST:~/"

# Run commands on the server
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "
cd $REMOTE_DIR

echo '🔹 Setting up frontend directory...'
mkdir -p frontend
rm -rf frontend/*
tar -xzf ~/frontend_deploy.tar.gz -C frontend

echo '🔹 Building frontend Docker image...'
cd frontend
docker build -t umt-frontend:latest .

echo '🔹 Stopping frontend container...'
cd ..
docker-compose stop frontend
docker-compose rm -f frontend

echo '🔹 Updating docker-compose.yml...'
# Update the frontend section in docker-compose.yml to use the custom image
sed -i '/frontend:/,/networks:/s|image: \${FRONTEND_IMAGE:-nginx:alpine}|image: umt-frontend:latest|' docker-compose.yml

echo '🔹 Starting frontend container with our React app...'
export COMPOSE_HTTP_TIMEOUT=300
docker-compose up -d frontend

echo '🔹 Checking frontend container...'
docker ps | grep frontend

echo '✅ Frontend deployment completed!'
"

# Clean up temporary files
rm -rf $TMP_DIR $TAR_FILE

echo "✅ Frontend deployment completed!"
echo "🌐 Your React application should now be accessible at https://staging.tangible-studios.com"