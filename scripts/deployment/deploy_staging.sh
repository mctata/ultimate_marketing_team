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

# Simple mode ensures we only deploy the essential services
SIMPLE_MODE=""
if [ "$1" == "simple" ]; then
  SIMPLE_MODE="true"
  echo "🔹 Using simple deployment (only essential services)"
fi

# Deploy infrastructure services
echo "🔹 Deploying infrastructure services first..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose up -d postgres"

# Deploy health-api as the first application service
echo "🔹 Deploying health-api service..."

# First, make sure the monitoring directory exists and has correct files
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && [ -d monitoring ] || mkdir -p monitoring"

# Check if health_api.py exists in monitoring directory
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && [ -f monitoring/health_api.py ] || echo 'Missing monitoring/health_api.py - will attempt to fix'"

# If monitoring files don't exist, create them remotely
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && if [ ! -f monitoring/health_api.py ]; then
cat > monitoring/health_api.py << 'EOF'
from fastapi import FastAPI
import uvicorn
import time
import os

app = FastAPI()

@app.get('/')
async def health_check():
    return {
        'status': 'healthy',
        'timestamp': time.time(),
        'service': 'health-api', 
        'version': '1.0.0',
        'environment': os.getenv('ENVIRONMENT', 'staging')
    }

@app.get('/ping')
async def ping():
    return 'pong'

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)
EOF

cat > monitoring/Dockerfile.health-api << 'EOF'
FROM python:3.10-slim

WORKDIR /app

RUN pip install fastapi uvicorn psutil

COPY monitoring/health_api.py /app/

EXPOSE 8000

CMD [\"python\", \"health_api.py\"]
EOF
echo 'Created monitoring files on remote server';
fi"

# Now build and start the health-api
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose build health-api && docker-compose up -d health-api"

# Check health-api is working
echo "🔹 Checking health-api..."
HEALTH_CHECK=$(ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8001/ping || echo 'failed'")
if [ "$HEALTH_CHECK" = "failed" ]; then
  echo "❌ Health API failed to start. Attempting to fix issues..."
  
  # Run fix commands
  ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && 
    echo 'Creating standalone health API...' &&
    cat > health_api.py << 'EOF'
from fastapi import FastAPI
import uvicorn
import time
import os

app = FastAPI()

@app.get('/')
async def health_check():
    return {
        'status': 'healthy',
        'timestamp': time.time(),
        'service': 'health-api', 
        'version': '1.0.0',
        'environment': os.getenv('ENVIRONMENT', 'staging')
    }

@app.get('/ping')
async def ping():
    return 'pong'

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)
EOF
    
    cat > Dockerfile.health-api << 'EOF'
FROM python:3.10-slim

WORKDIR /app

RUN pip install fastapi uvicorn

COPY health_api.py /app/

EXPOSE 8000

CMD [\"python\", \"health_api.py\"]
EOF

    echo 'Rebuilding health-api with simplified configuration...' &&
    docker-compose stop health-api &&
    docker-compose build health-api &&
    docker-compose up -d health-api &&
    echo 'Health API rebuilt.'"
  
  # Check again after fix
  HEALTH_CHECK=$(ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8001/ping || echo 'failed'")
  if [ "$HEALTH_CHECK" = "failed" ]; then
    echo "❌ Health API still failing. Check logs:"
    ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose logs health-api"
  else
    echo "✅ Health API started successfully after fix"
  fi
else
  echo "✅ Health API is running"
fi

# Deploy API gateway
echo "🔹 Deploying API gateway..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose build api-gateway && docker-compose up -d api-gateway"

# Run database migrations before starting agents
echo "🔹 Running database migrations..."

# First check if postgres-proxy is healthy
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && 
  echo 'Verifying postgres-proxy is healthy...'
  if ! docker-compose ps postgres-proxy | grep -q '(healthy)'; then
    echo 'postgres-proxy is not healthy yet. Waiting...'
    attempt=1
    max_attempts=30
    while [ \$attempt -le \$max_attempts ] && ! docker-compose ps postgres-proxy | grep -q '(healthy)'; do
      echo \"Attempt \$attempt/\$max_attempts: postgres-proxy not healthy yet, waiting...\"
      sleep 5
      attempt=\$((attempt+1))
    done
    
    if [ \$attempt -gt \$max_attempts ]; then
      echo '⚠️ postgres-proxy did not become healthy. Will try direct DB access'
      # Create schema directly in case proxy is failing
      docker-compose exec -T postgres psql -U postgres -d umt -c 'CREATE SCHEMA IF NOT EXISTS umt;'
    else
      echo '✅ postgres-proxy is now healthy'
    fi
  else
    echo '✅ postgres-proxy is already healthy'
  fi
"

# Run migrations with a simpler approach
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && 
  echo 'Running migrations directly to avoid container health issues...'
  docker-compose run --rm migrations
"

# Check migration logs for errors
echo "Checking migration results..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && 
  # Check alembic_version table for successful migrations
  version_check=\$(docker-compose exec -T postgres psql -U postgres -d umt -c \"SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'umt' AND table_name = 'alembic_version');\" -t)
  
  if [[ \$version_check == *\"t\"* ]]; then
    echo '✅ Alembic version table exists - migrations likely succeeded'
    # Get current version
    current_version=\$(docker-compose exec -T postgres psql -U postgres -d umt -c \"SELECT version_num FROM umt.alembic_version;\" -t)
    echo \"Current migration version: \$current_version\"
  else
    echo '⚠️ Alembic version table does not exist - migrations may have failed'
    
    # Check for multiple heads
    echo 'Checking for multiple migration heads...'
    multiple_heads=\$(docker-compose run --rm migrations bash -c \"cd /app && python -m alembic heads\" | grep -c head || echo \"0\")
    
    if [ \"\$multiple_heads\" -gt \"1\" ]; then
      echo '⚠️ Detected multiple migration heads. Attempting to merge...'
      docker-compose run --rm migrations bash -c \"cd /app && python -m alembic merge heads -m 'merge heads'\"
      echo 'Rerunning migrations after merge...'
      docker-compose run --rm migrations
    fi
    
    # Check again after potential fix
    version_check=\$(docker-compose exec -T postgres psql -U postgres -d umt -c \"SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'umt' AND table_name = 'alembic_version');\" -t)
    if [[ \$version_check == *\"t\"* ]]; then
      echo '✅ Migrations succeeded after fixes'
    else
      echo '⚠️ Migrations still not completed properly. Will proceed but API may not work correctly.'
    fi
  fi"

# Deploy agent services if not in simple mode
if [ "$SIMPLE_MODE" != "true" ]; then
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
else
  echo "🔹 Skipping agent services and frontend in simple deployment mode"
fi

# Wait a bit for services to initialize
sleep 5

# Check API gateway
echo "🔹 Verifying API gateway..."
API_HEALTH_CHECK=$(ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8000/api/health || echo 'failed'")
if [[ "$API_HEALTH_CHECK" == *"failed"* ]]; then
  echo "⚠️ API Gateway might not be running correctly. Attempting to fix..."
  
  # Run fix script remotely if it exists
  ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && if [ -f scripts/deployment/fix_api_gateway_db.sh ]; then 
    echo 'Running API gateway database fix script...'
    chmod +x scripts/deployment/fix_api_gateway_db.sh && 
    ./scripts/deployment/fix_api_gateway_db.sh
  else
    echo 'Fix script not found. Performing basic recovery...'
    docker-compose restart api-gateway
    docker-compose restart postgres
    sleep 10
    docker-compose logs api-gateway
  fi"
  
  # Check again after fix
  echo "Checking API gateway again after fix attempts..."
  API_HEALTH_CHECK=$(ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8000/api/health || echo 'failed'")
  if [[ "$API_HEALTH_CHECK" == *"failed"* ]]; then
    echo "⚠️ API Gateway still not responding. Check logs for details:"
    ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose logs api-gateway"
  else
    echo "✅ API Gateway is now running correctly after fix"
  fi
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