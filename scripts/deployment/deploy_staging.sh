#!/bin/bash
# Universal Staging Deployment Script - The ONLY script you need for staging deployment
set -e

echo "========== ULTIMATE MARKETING TEAM: STAGING DEPLOYMENT =========="

# Parse arguments
DRY_RUN=false
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help)
      echo "Usage: $0 [--dry-run]"
      echo ""
      echo "Options:"
      echo "  --dry-run    Prepare deployment package but don't upload or deploy"
      echo "  --help       Show this help message"
      exit 0
      ;;
  esac
done

# Get project root directory
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$PROJECT_ROOT"

# Configuration with defaults
SSH_USER=ubuntu
SSH_HOST=ec2-44-202-29-233.compute-1.amazonaws.com
SSH_PORT=22
REMOTE_DIR=/home/ubuntu/ultimate-marketing-team
SSH_KEY="$PROJECT_ROOT/ultimate-marketing-staging.pem"
DOMAIN=staging.tangible-studios.com

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
  echo "❌ Error: SSH key not found at $SSH_KEY"
  echo "Please provide the correct path to your SSH key or place it in the project root."
  exit 1
fi

# Set SSH key permissions
chmod 600 "$SSH_KEY"

echo "🔹 Target: $SSH_USER@$SSH_HOST:$REMOTE_DIR"
echo "🔹 Mode: $([ "$DRY_RUN" == "true" ] && echo "Dry run (no upload)" || echo "Full deployment")"

# Create a deployment directory
echo "🔹 Preparing deployment package..."
rm -rf tmp_deploy
mkdir -p tmp_deploy

# Copy essential files to the deployment directory
echo "🔹 Copying project files..."
cp -r docker docker-compose.staging.yml docker-compose.yml scripts migrations src config tests requirements.txt pyproject.toml alembic.ini tmp_deploy/

# Create placeholder frontend/dist directory for build
echo "🔹 Creating placeholder frontend/dist directory..."
mkdir -p tmp_deploy/frontend/dist
echo "<html><body><h1>Ultimate Marketing Team</h1><p>Frontend placeholder - will be built in production</p></body></html>" > tmp_deploy/frontend/dist/index.html

# Create nginx.conf if needed
echo "🔹 Creating nginx configuration files..."
mkdir -p tmp_deploy/docker/frontend
cat > tmp_deploy/docker/frontend/nginx.conf << EOL
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://api-gateway:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOL

# Create basic environment files
echo "🔹 Creating environment files..."
cat > tmp_deploy/.env.staging << EOL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_password
POSTGRES_DB=ultimatemarketing_db
POSTGRES_HOST=postgres
VECTOR_DB_USER=postgres
VECTOR_DB_PASSWORD=postgres_password
VECTOR_DB_NAME=umt_vector_db
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
EOL

# Create frontend environment file
echo "🔹 Creating frontend environment file..."
mkdir -p tmp_deploy/frontend
cat > tmp_deploy/frontend/.env.staging << EOL
VITE_API_URL=http://${SSH_HOST}:8000
VITE_ENV=staging
EOL

if [ "$DRY_RUN" == "true" ]; then
  echo "✅ Dry run completed. Deployment package created in tmp_deploy/"
  echo "✅ To perform the actual deployment, run without --dry-run"
  exit 0
fi

# Test connection before proceeding
echo "🔹 Testing connection to staging server..."
if ! ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=5 -o BatchMode=yes "$SSH_USER@$SSH_HOST" "echo Connection successful" 2>/dev/null; then
  echo "❌ Connection to $SSH_USER@$SSH_HOST failed. Please check your SSH credentials and network."
  exit 1
fi

# Upload to server - using tar+ssh instead of rsync for better compatibility
echo "🔹 Uploading to server..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "mkdir -p $REMOTE_DIR"

echo "🔹 Creating tar archive for upload..."
tar -czf tmp_deploy.tar.gz -C tmp_deploy .

echo "🔹 Uploading archive (this may take a moment)..."
scp -i "$SSH_KEY" -P "$SSH_PORT" tmp_deploy.tar.gz "$SSH_USER@$SSH_HOST:$REMOTE_DIR/"

echo "🔹 Extracting files on server..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && tar -xzf tmp_deploy.tar.gz && rm tmp_deploy.tar.gz"

# Deploy on server
echo "🔹 Deploying on server..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && \
    echo 'Making scripts executable...' && \
    find scripts -name '*.sh' -type f -exec chmod +x {} \; && \
    echo 'Stopping existing containers...' && \
    docker-compose -f docker-compose.staging.yml down && \
    echo 'Starting containers...' && \
    docker-compose -f docker-compose.staging.yml up -d"

# Verify deployment
echo "🔹 Verifying deployment..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && \
    echo 'Container status:' && \
    docker ps && \
    echo 'Checking for pgvector extension:' && \
    POSTGRES_CONTAINER=\$(docker ps -q -f name=postgres | head -n 1) && \
    if [ ! -z \"\$POSTGRES_CONTAINER\" ]; then \
        if ! docker exec \$POSTGRES_CONTAINER psql -U postgres -c \"SELECT extname FROM pg_extension WHERE extname='vector';\" | grep -q vector; then \
            echo 'Installing pgvector extension...' && \
            chmod +x scripts/deployment/fix_pgvector.sh && \
            ./scripts/deployment/fix_pgvector.sh; \
        else \
            echo 'pgvector extension is already installed'; \
        fi; \
    else \
        echo 'PostgreSQL container not found'; \
        exit 1; \
    fi"

# Clean up
echo "🔹 Cleaning up..."
rm -rf tmp_deploy tmp_deploy.tar.gz

echo "✅ Deployment completed successfully!"
echo "✅ Access your staging environment at: https://$DOMAIN"
echo ""
echo "Useful commands:"
echo "  - Connect to server:      ssh -i \"$SSH_KEY\" \"$SSH_USER@$SSH_HOST\""
echo "  - View container logs:    ssh -i \"$SSH_KEY\" \"$SSH_USER@$SSH_HOST\" \"cd $REMOTE_DIR && docker-compose -f docker-compose.staging.yml logs -f\""
echo "  - Check container status: ssh -i \"$SSH_KEY\" \"$SSH_USER@$SSH_HOST\" \"cd $REMOTE_DIR && docker ps\""