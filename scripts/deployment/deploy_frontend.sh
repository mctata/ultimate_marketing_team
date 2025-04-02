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
  exit 1
fi
chmod 600 "$SSH_KEY"

# Build the frontend locally
echo "🔹 Building frontend locally..."
cd frontend
npm ci
npm run build
cd ..

echo "🔄 Deploying frontend to staging server..."
echo "🔹 Target: $SSH_USER@$SSH_HOST"

# Create directory for dist files
TMP_DIR="tmp_frontend_deploy"
mkdir -p $TMP_DIR
cp -r frontend/dist $TMP_DIR/

# Copy the Dockerfile
mkdir -p $TMP_DIR/docker
cp docker/frontend/Dockerfile $TMP_DIR/docker/
cp docker/frontend/nginx.conf $TMP_DIR/docker/ 2>/dev/null || echo "Warning: nginx.conf not found"

# Create a simple nginx.conf if it doesn't exist
if [ ! -f "$TMP_DIR/docker/nginx.conf" ]; then
  echo "🔧 Creating default nginx.conf file..."
  cat > $TMP_DIR/docker/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle SPA routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Disable caching for service worker
    location = /service-worker.js {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }

    # Gzip compression
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_types
        application/javascript
        application/json
        application/xml
        text/css
        text/plain
        text/xml;
}
EOF
fi

# Create a modified Dockerfile for staging
cat > $TMP_DIR/Dockerfile << 'EOF'
FROM nginx:stable-alpine

# Copy pre-built assets
COPY dist /usr/share/nginx/html

# Copy custom nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

# Create tar file
TAR_FILE="frontend_deploy.tar.gz"
tar -czf $TAR_FILE -C $TMP_DIR .

# Copy the tar file to the server
scp -i "$SSH_KEY" -P "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no $TAR_FILE "$SSH_USER@$SSH_HOST:~/"

# Run commands on the server
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "
cd $REMOTE_DIR

echo '🔹 Extracting frontend files...'
mkdir -p frontend_deploy
tar -xzf ~/frontend_deploy.tar.gz -C frontend_deploy

echo '🔹 Stopping frontend container...'
docker-compose stop frontend
docker-compose rm -f frontend

echo '🔹 Building frontend Docker image...'
cd frontend_deploy
docker build -t umt-frontend:latest .
cd ..

echo '🔹 Updating docker-compose.yml...'
# Update the frontend section in docker-compose.yml to use the custom image
sed -i '/frontend:/,/networks:/s|image: \${FRONTEND_IMAGE:-nginx:alpine}|image: umt-frontend:latest|' docker-compose.yml

echo '🔹 Starting frontend container with our React app...'
export COMPOSE_HTTP_TIMEOUT=300
docker-compose up -d frontend

echo '🔹 Checking frontend container...'
docker ps | grep frontend

echo '🔹 Testing frontend response...'
curl -s http://localhost:3000 | grep -o 'React' || echo 'React app not detected in response, but this may be normal if it loads dynamically'

echo '✅ Frontend deployment completed!'
"

# Clean up temporary files
rm -rf $TMP_DIR $TAR_FILE

echo "✅ Frontend deployment completed!"
echo "🌐 Your React application should now be accessible at https://staging.tangible-studios.com"