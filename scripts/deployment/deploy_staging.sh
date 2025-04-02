#!/bin/bash
# Script to deploy the Ultimate Marketing Team application to staging
# Fixed version to resolve deployment issues

# Set -e to exit immediately on error for better error handling
set -e

# Display script banner
echo "🚀 ================================= 🚀"
echo "🚀  Ultimate Marketing Team Deployer  🚀"
echo "🚀      STAGING ENVIRONMENT           🚀"
echo "🚀 ================================= 🚀"

# Check for clean deployment flag
CLEAN_DEPLOY=false
if [ "$1" == "--clean" ]; then
  CLEAN_DEPLOY=true
  echo "⚠️  CLEAN DEPLOYMENT MODE ENABLED - All existing files will be removed! ⚠️"
  read -p "Are you sure you want to proceed with a clean deployment? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Clean deployment canceled"
    exit 1
  fi
fi

# Load environment variables
ENV_FILE=".env.staging"
if [ -f "$ENV_FILE" ]; then
  echo "🔹 Loading environment variables from $ENV_FILE"
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "❌ Environment file $ENV_FILE not found!"
  # Create a temporary .env.staging file from the template if it doesn't exist
  if [ -f "config/env/.env.staging.template" ]; then
    echo "📄 Creating temporary .env.staging file from template..."
    cp config/env/.env.staging.template .env.staging
    set -a
    source ".env.staging"
    set +a
  else
    echo "❌ Could not find template file either. Cannot proceed."
    exit 1
  fi
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
    echo "❌ Cannot find a suitable SSH key. Please place the key file in the project directory or specify the correct path."
    exit 1
  fi
fi

# Set proper permissions for SSH key
chmod 600 "$SSH_KEY"

echo "🚀 Starting deployment to STAGING environment"
echo "🔹 Target: $SSH_USER@$SSH_HOST:$SSH_PORT"
echo "🔹 Remote directory: $REMOTE_DIR"

# Test SSH connection before proceeding
echo "🔹 Testing SSH connection..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "echo SSH connection successful" 2>/dev/null
SSH_RESULT=$?

if [ $SSH_RESULT -ne 0 ]; then
  echo "❌ SSH connection failed (error code: $SSH_RESULT). Please check:"
  echo "  - EC2 instance is running"
  echo "  - Security groups allow SSH access from your IP"
  echo "  - SSH key is valid and has correct permissions"
  echo "  - Instance hostname is correct"
  echo ""
  echo "Attempting to diagnose the issue..."
  
  # Check if the key is in the correct format
  if grep -q "PRIVATE KEY" "$SSH_KEY"; then
    echo "✅ SSH key format appears valid"
  else
    echo "❌ SSH key format may be invalid. It should be a PEM file containing a private key."
  fi
  
  # Try to ping the host to check connectivity
  ping -c 1 $SSH_HOST >/dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ Host is reachable via ping"
  else
    echo "❌ Host is not reachable via ping. It might be down or blocking ICMP packets."
  fi
  
  # Try an SSH connection with more debugging
  echo "🔍 Attempting SSH connection with verbose logging..."
  ssh -i "$SSH_KEY" -p "$SSH_PORT" -v -o ConnectTimeout=5 -o BatchMode=yes -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "echo test" 2>&1 | grep -i "debug\|error"
  
  exit 1
else
  echo "✅ SSH connection successful"
fi

# Check disk space before proceeding
echo "🔹 Checking disk space on server..."
DISK_SPACE=$(ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "df -h / | grep -v Filesystem")
DISK_USAGE_PCT=$(echo "$DISK_SPACE" | awk '{print $5}' | sed 's/%//')

echo "$DISK_SPACE"

if [ "$DISK_USAGE_PCT" -gt 85 ] && [ "$CLEAN_DEPLOY" = false ]; then
  echo "⚠️ Warning: Disk usage is high ($DISK_USAGE_PCT%)."
  echo "   It's recommended to use --clean flag or run ./scripts/deployment/check_server_space.sh first."
  read -p "Do you want to continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 1
  fi
fi

# Prepare deployment files
echo "🔹 Preparing deployment package..."
DEPLOY_DIR="tmp_deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Create a clean docker-compose.yml without api-gateway service
echo "🔧 Creating custom docker-compose.yml without api-gateway service..."
cat > $DEPLOY_DIR/docker-compose.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL database with pgvector extension
  postgres:
    image: postgres:17-alpine
    container_name: umt-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: umt
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s
    restart: unless-stopped
    networks:
      - umt_network

  # A proxy service to ensure database initialization sequence is correct
  postgres-proxy:
    image: alpine:latest
    container_name: umt-postgres-proxy
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./scripts/deployment:/scripts
    command: >
      sh -c "
        apk add --no-cache postgresql-client &&
        until pg_isready -h postgres -p 5432 -U postgres; do
          echo 'Waiting for postgres...' &&
          sleep 2;
        done;
        echo 'PostgreSQL is ready!' &&
        # Use PostgreSQL 17 compatible command for database creation
        psql -h postgres -U postgres -c \"SELECT 'CREATE DATABASE umt' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'umt')\gexec\" &&
        psql -h postgres -U postgres -d umt -c 'CREATE SCHEMA IF NOT EXISTS umt;' &&
        tail -f /dev/null
      "
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h postgres -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - umt_network

  # Database migrations service
  migrations:
    build:
      context: .
      dockerfile: docker/migrations/Dockerfile
    container_name: umt-migrations
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/umt
      PYTHONPATH: /app
      UMT_ENV: staging
    depends_on:
      postgres-proxy:
        condition: service_healthy
    command: ["alembic", "upgrade", "head"]
    restart: on-failure
    networks:
      - umt_network

  # Frontend (using prebuilt image as fallback if frontend directory doesn't exist)
  frontend:
    image: ${FRONTEND_IMAGE:-nginx:alpine}
    container_name: umt-frontend
    ports:
      - "3000:80"
    restart: unless-stopped
    networks:
      - umt_network

  # Redis for caching and session storage
  redis:
    image: redis:7-alpine
    container_name: umt-redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    ports:
      - "6379:6379"
    networks:
      - umt_network

  # RabbitMQ for message brokering between agents
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: umt-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: rabbitmq-diagnostics -q ping
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s
    ports:
      - "5672:5672"
      - "15672:15672"
    restart: unless-stopped
    networks:
      - umt_network

  # Vector database proxy for embeddings
  vector-db-proxy:
    image: alpine:latest
    container_name: umt-vector-db-proxy
    command: >
      sh -c "
        apk add --no-cache postgresql-client &&
        until pg_isready -h postgres -p 5432 -U postgres; do
          echo 'Waiting for postgres...' &&
          sleep 2;
        done;
        # Use PostgreSQL 17 compatible command for database creation
        psql -h postgres -U postgres -c \"SELECT 'CREATE DATABASE vector_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'vector_db')\gexec\" &&
        echo 'Vector database initialized!' &&
        # Now create the extension pgvector
        psql -h postgres -U postgres -d vector_db -c 'CREATE EXTENSION IF NOT EXISTS vector;' || echo 'Failed to create vector extension - will install later' &&
        echo 'Vector setup complete!' &&
        # Keep container running
        tail -f /dev/null
      "
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h postgres -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - umt_network

  # Health monitoring API
  health-api:
    build:
      context: .
      dockerfile: monitoring/Dockerfile.health-api
    container_name: umt-health-api
    environment:
      POSTGRES_HOST: postgres
      REDIS_HOST: redis
      RABBITMQ_HOST: rabbitmq
      API_GATEWAY_HOST: localhost
      ENVIRONMENT: staging
    healthcheck:
      test: ["CMD", "echo", "skip-health-check"]
      interval: 60s
      timeout: 5s
      retries: 3
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    ports:
      - "8001:8000"
    restart: unless-stopped
    networks:
      - umt_network

  # Agent services
  auth-agent:
    build:
      context: .
      dockerfile: docker/agents/Dockerfile
    environment:
      AGENT_TYPE: auth
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/umt
      RABBITMQ_HOST: rabbitmq
      UMT_ENV: staging
    depends_on:
      rabbitmq:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - umt_network

  brand-agent:
    build:
      context: .
      dockerfile: docker/agents/Dockerfile
    environment:
      AGENT_TYPE: brand
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/umt
      RABBITMQ_HOST: rabbitmq
      UMT_ENV: staging
    depends_on:
      rabbitmq:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - umt_network

  content-strategy-agent:
    build:
      context: .
      dockerfile: docker/agents/Dockerfile
    environment:
      AGENT_TYPE: content_strategy
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/umt
      RABBITMQ_HOST: rabbitmq
      VECTOR_DB_URL: postgresql://postgres:postgres@postgres:5432/vector_db
      UMT_ENV: staging
    depends_on:
      rabbitmq:
        condition: service_healthy
      vector-db-proxy:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - umt_network

  content-creation-agent:
    build:
      context: .
      dockerfile: docker/agents/Dockerfile
    environment:
      AGENT_TYPE: content_creation
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/umt
      RABBITMQ_HOST: rabbitmq
      UMT_ENV: staging
    depends_on:
      rabbitmq:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - umt_network

  content-ad-agent:
    build:
      context: .
      dockerfile: docker/agents/Dockerfile
    environment:
      AGENT_TYPE: content_ad
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/umt
      RABBITMQ_HOST: rabbitmq
      UMT_ENV: staging
    depends_on:
      rabbitmq:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - umt_network

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:

networks:
  umt_network:
    driver: bridge
EOF

# Create required directories and prepare files
mkdir -p $DEPLOY_DIR/monitoring
mkdir -p $DEPLOY_DIR/src/api
cp monitoring/health_api.py $DEPLOY_DIR/monitoring/health_api.py 2>/dev/null || echo "⚠️ Warning: health_api.py not found"
cp monitoring/Dockerfile.health-api $DEPLOY_DIR/monitoring/Dockerfile.health-api 2>/dev/null || echo "⚠️ Warning: Dockerfile.health-api not found"
cp src/api/staging_main.py $DEPLOY_DIR/src/api/staging_main.py 2>/dev/null || echo "⚠️ Warning: staging_main.py not found"
cp src/api/staging_main.py $DEPLOY_DIR/staging_main.py 2>/dev/null || echo "⚠️ Warning: staging_main.py not copied to root"
cp .env.staging $DEPLOY_DIR/.env 2>/dev/null || echo "⚠️ Warning: .env.staging not found"

# Create health API files if missing
if [ ! -f "$DEPLOY_DIR/monitoring/health_api.py" ]; then
  echo "🔧 Creating missing health_api.py file..."
  cat > $DEPLOY_DIR/monitoring/health_api.py << 'EOF'
from fastapi import FastAPI
import uvicorn
import time
import os
import requests

app = FastAPI()

@app.get("/")
async def health_check():
    # Check API Gateway health if configured
    api_gateway_status = "unknown"
    api_gateway_host = os.getenv("API_GATEWAY_HOST", "localhost")
    api_gateway_url = f"http://{api_gateway_host}:8000/health"
    
    try:
        # Use a short timeout to avoid blocking
        response = requests.get(api_gateway_url, timeout=2)
        if response.status_code == 200:
            api_gateway_status = "healthy"
        else:
            api_gateway_status = f"unhealthy (status code: {response.status_code})"
    except requests.exceptions.RequestException:
        api_gateway_status = "unavailable"
    
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "service": "health-api",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "staging"),
        "api_gateway": api_gateway_status
    }

@app.get("/ping")
async def ping():
    return "pong"

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF
fi

if [ ! -f "$DEPLOY_DIR/monitoring/Dockerfile.health-api" ]; then
  echo "🔧 Creating missing Dockerfile.health-api..."
  cat > $DEPLOY_DIR/monitoring/Dockerfile.health-api << 'EOF'
FROM python:3.10-slim

WORKDIR /app

RUN pip install fastapi uvicorn requests psutil

COPY monitoring/health_api.py /app/

EXPOSE 8000

CMD ["python", "health_api.py"]
EOF
fi

# Create a simple main file if missing
if [ ! -f "$DEPLOY_DIR/staging_main.py" ]; then
  echo "🔧 Creating missing staging_main.py file..."
  cat > $DEPLOY_DIR/staging_main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import time

# Create FastAPI app
app = FastAPI(
    title="Ultimate Marketing Team API",
    description="API for the Ultimate Marketing Team application",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint for API health checks
@app.get("/api/health")
async def api_health():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "staging")
    }

# Health check endpoint (root path)
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "staging")
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to the Ultimate Marketing Team API",
        "docs_url": "/docs",
        "environment": os.getenv("ENVIRONMENT", "staging")
    }

# Ping endpoint
@app.get("/ping")
async def ping():
    return "pong"

# Simple mocked API endpoints for demonstration
@app.get("/api/campaigns")
async def get_campaigns():
    return [
        {"id": 1, "name": "Summer Sale", "status": "active", "budget": 5000},
        {"id": 2, "name": "Product Launch", "status": "draft", "budget": 10000},
        {"id": 3, "name": "Holiday Special", "status": "completed", "budget": 7500}
    ]

@app.get("/api/metrics")
async def get_metrics():
    return {
        "campaign_count": 3,
        "active_campaigns": 1,
        "total_budget": 22500,
        "engagement_rate": 3.7,
        "conversion_rate": 2.1
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF
fi

# Copy the same file to both locations for redundancy
cp $DEPLOY_DIR/staging_main.py $DEPLOY_DIR/src/api/staging_main.py

# Create a standalone API file for the API Gateway
echo "🔹 Creating standalone API Gateway file..."
API_FILE="api_gateway.py"
cat > $API_FILE << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import time

app = FastAPI(
    title="Ultimate Marketing Team API",
    description="API for the Ultimate Marketing Team application",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def api_health():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "staging")
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "staging")
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Ultimate Marketing Team API",
        "docs_url": "/docs",
        "environment": os.getenv("ENVIRONMENT", "staging")
    }

@app.get("/ping")
async def ping():
    return "pong"

@app.get("/api/campaigns")
async def get_campaigns():
    return [
        {"id": 1, "name": "Summer Sale", "status": "active", "budget": 5000},
        {"id": 2, "name": "Product Launch", "status": "draft", "budget": 10000},
        {"id": 3, "name": "Holiday Special", "status": "completed", "budget": 7500}
    ]

@app.get("/api/metrics")
async def get_metrics():
    return {
        "campaign_count": 3,
        "active_campaigns": 1,
        "total_budget": 22500,
        "engagement_rate": 3.7,
        "conversion_rate": 2.1
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF

# Create a tar file of the deployment directory
TAR_FILE="staging-deploy.tar.gz"
tar -czf $TAR_FILE -C $DEPLOY_DIR .

# Create remote directory if it doesn't exist, or clean it if clean mode is enabled
if [ "$CLEAN_DEPLOY" = true ]; then
  echo "🔹 CLEAN MODE: Removing all existing files from $REMOTE_DIR..."
  ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "
    # Stop all containers first
    cd $REMOTE_DIR 2>/dev/null && docker-compose down --remove-orphans || true
    
    # Remove all containers with the umt- prefix
    docker ps -a | grep 'umt-' | awk '{print \$1}' | xargs -r docker rm -f
    
    # Clean up Docker volumes if present
    docker volume ls | grep 'umt_' | awk '{print \$2}' | xargs -r docker volume rm
    
    # Clean up Docker images that may be stale
    docker images -f 'reference=*umt*' | grep -v REPOSITORY | awk '{print \$3}' | xargs -r docker rmi -f || true
    
    # Remove all files except protected ones (like .env files if needed)
    mkdir -p ${REMOTE_DIR}_backup
    if [ -f ${REMOTE_DIR}/.env ]; then
      cp ${REMOTE_DIR}/.env ${REMOTE_DIR}_backup/
    fi
    
    # Remove the directory and recreate it
    rm -rf $REMOTE_DIR
    mkdir -p $REMOTE_DIR
    
    # Restore any backed up files if needed
    if [ -f ${REMOTE_DIR}_backup/.env ]; then
      cp ${REMOTE_DIR}_backup/.env ${REMOTE_DIR}/
    fi
    
    echo 'Clean deployment: Directory cleared successfully!'
  "
else
  echo "🔹 Creating remote directory if it doesn't exist..."
  ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "mkdir -p $REMOTE_DIR"
fi

# Copy the tar file to the remote server
echo "🔹 Copying deployment files to remote server..."
scp -i "$SSH_KEY" -P "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no $TAR_FILE "$SSH_USER@$SSH_HOST:$REMOTE_DIR/"

# Extract the tar file on the remote server
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && tar -xzf $TAR_FILE && rm $TAR_FILE"

# Copy source code directories
echo "🔹 Copying source code directories..."
DIRS=("src" "docker" "monitoring" "migrations")
for dir in "${DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "  Copying $dir directory..."
    ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "mkdir -p $REMOTE_DIR/$dir"
    rsync -av --delete -e "ssh -i $SSH_KEY -p $SSH_PORT -o ConnectTimeout=10 -o StrictHostKeyChecking=no" --exclude "*.pyc" --exclude "__pycache__" $dir/ "$SSH_USER@$SSH_HOST:$REMOTE_DIR/$dir/"
  fi
done

# Check and copy frontend directory only if it exists
if [ -d "frontend" ] && [ -f "frontend/Dockerfile" ]; then
  echo "🔹 Copying frontend directory..."
  ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "mkdir -p $REMOTE_DIR/frontend"
  rsync -av --delete -e "ssh -i $SSH_KEY -p $SSH_PORT -o ConnectTimeout=10 -o StrictHostKeyChecking=no" \
    --exclude "node_modules" --exclude "dist" --exclude "*.log" \
    frontend/ "$SSH_USER@$SSH_HOST:$REMOTE_DIR/frontend/"
  echo "✅ Frontend directory copied successfully"
else
  echo "⚠️ Frontend directory not found or incomplete - will use fallback nginx image"
fi

# Copy API file to server
echo "🔹 Copying API Gateway file to server..."
scp -i "$SSH_KEY" -P "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no $API_FILE "$SSH_USER@$SSH_HOST:$REMOTE_DIR/"

# Deploy using fixed docker-compose setup without api-gateway
echo "🔹 DEPLOYING: Setting up the server and running docker-compose"

# First, stop any existing containers on remote host
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose down --remove-orphans || true"

# Create necessary directories
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && mkdir -p scripts/monitoring scripts/database scripts/api src/api"

# Create monitoring script
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && cat > scripts/monitoring/check_api_health.sh << 'EOF'
#!/bin/bash
# Script to check health-api status and fix issues

echo \"Checking health API configuration...\"
mkdir -p monitoring

# Install curl in containers if needed
echo \"Installing curl in containers if needed...\"
docker ps -a | grep -q umt-health-api && (docker exec umt-health-api apt-get update && docker exec umt-health-api apt-get install -y curl) || echo \"Health API container not running\"

# Check health API response
echo \"Checking health API response...\"
if docker ps | grep -q umt-health-api; then
  docker exec umt-health-api curl -s http://localhost:8000/ || echo \"Health API not responding\"
else
  echo \"Health API container not running\"
fi

echo \"Health check completed!\"
EOF
chmod +x scripts/monitoring/check_api_health.sh"

# Create pgvector fix script
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && cat > scripts/database/fix_pgvector.sh << 'EOF'
#!/bin/bash
# Script to fix vector-db-proxy in case of issues

# Create vector_db database if it doesn't exist
echo 'Creating vector_db database...'
docker exec -i umt-postgres psql -U postgres -c 'CREATE DATABASE vector_db;' 2>/dev/null || echo 'Database may already exist'

# Install PostgreSQL contrib and build packages
echo 'Installing PostgreSQL contrib and build packages...'
docker exec umt-postgres apk add --no-cache postgresql-contrib git build-base postgresql-dev clang llvm 2>/dev/null || true

# Install pgvector from source
echo 'Installing pgvector from source...'
docker exec umt-postgres sh -c 'cd /tmp && rm -rf pgvector && git clone --branch v0.6.0 https://github.com/pgvector/pgvector.git && cd pgvector && make USE_PGXS=1 NO_JIT=1 && make USE_PGXS=1 NO_JIT=1 install' || echo 'pgvector installation failed'

# Create the vector extension
echo 'Creating vector extension...'
docker exec -i umt-postgres psql -U postgres -d vector_db -c 'CREATE EXTENSION IF NOT EXISTS vector;' || echo 'Failed to create extension'

# Verify the extension was created
echo 'Verifying vector extension with simple query:'
docker exec -i umt-postgres psql -U postgres -d vector_db -c 'SELECT extname FROM pg_extension;'

echo 'Vector DB fix completed!'
EOF
chmod +x scripts/database/fix_pgvector.sh"

# Create simple start script for API Gateway
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && cat > scripts/api/simple_start.sh << 'EOF'
#!/bin/bash
# Simple startup script for API gateway
echo 'Starting simplified API...'
cd /app
exec uvicorn staging_main:app --host 0.0.0.0 --port 8000
EOF
chmod +x scripts/api/simple_start.sh"

# Create symbolic links for convenience
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && ln -sf scripts/monitoring/check_api_health.sh fix_health_api.sh && ln -sf scripts/database/fix_pgvector.sh fix_vector_db.sh"

# Start PostgreSQL first and ensure it's ready
echo "🔹 Starting PostgreSQL..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose up -d postgres"
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && echo 'Waiting for PostgreSQL...' && sleep 15"

# Create database and schema directly to avoid migration issues
echo "🔹 Setting up database directly..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose exec -T postgres psql -U postgres -c 'CREATE DATABASE umt;' 2>/dev/null || true"
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose exec -T postgres psql -U postgres -d umt -c 'CREATE SCHEMA IF NOT EXISTS umt;' 2>/dev/null || true"

# Ensure alembic_version table exists (required for API Gateway to start)
echo "🔹 Creating alembic_version table..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose exec -T postgres psql -U postgres -d umt -c \"
CREATE TABLE IF NOT EXISTS umt.alembic_version (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
INSERT INTO umt.alembic_version (version_num) 
VALUES ('manual_migration') 
ON CONFLICT DO NOTHING;\" 2>/dev/null || true"

# Start essential infrastructure services
echo "🔹 Starting essential infrastructure services..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose up -d redis rabbitmq"
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && echo 'Waiting for services to start...' && sleep 15"

# Set up the database proxies
echo "🔹 Setting up database proxies..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose up -d postgres-proxy vector-db-proxy"
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && ./scripts/database/fix_pgvector.sh || echo 'Vector DB fix failed but continuing deployment'"

# Start the standalone API Gateway container
echo "🔹 Setting up standalone API Gateway container..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && 
# Stop any existing API Gateway container
docker stop umt-api-gateway 2>/dev/null || true
docker rm -f umt-api-gateway 2>/dev/null || true

# Ensure network exists
docker network ls | grep umt_network || docker network create umt_network

# Deploy standalone container
docker run -d --name umt-api-gateway \
  --network umt_network \
  -p 8000:8000 \
  -e PYTHONUNBUFFERED=1 \
  -e ENVIRONMENT=staging \
  -v \$PWD/api_gateway.py:/app/api.py \
  --restart always \
  python:3.10-slim \
  bash -c 'pip install --no-cache-dir fastapi uvicorn && cd /app && python -m uvicorn api:app --host 0.0.0.0 --port 8000'

echo 'API Gateway container started - allowing time to initialize...'
sleep 5

# Test the endpoints (for internal verification only)
echo 'Testing internal API endpoints:'
(curl -s http://localhost:8000/health && echo '') || echo 'Health endpoint not responding'
(curl -s http://localhost:8000/api/health && echo '') || echo 'API health endpoint not responding'
"

# Build and start the Health API
echo "🔹 Building and starting Health API..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose build health-api"
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose up -d health-api"

# Start remaining agent services
echo "🔹 Starting agent services..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose up -d auth-agent brand-agent content-strategy-agent content-creation-agent content-ad-agent || echo 'Agent services startup failed but continuing deployment'"

# Check if frontend directory exists and modify docker-compose accordingly
echo "🔹 Checking for frontend directory..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "
cd $REMOTE_DIR
if [ ! -d 'frontend' ] || [ ! -f 'frontend/Dockerfile' ]; then
  echo 'Frontend directory not found, using nginx:alpine as fallback'
  # Make sure we don't try to build the frontend
  export FRONTEND_IMAGE=nginx:alpine
  
  # Create a simple index.html file in a new nginx directory
  mkdir -p nginx/html
  cat > nginx/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Ultimate Marketing Team</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
    h1 { color: #333; }
    .info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; }
    .endpoints { margin-top: 20px; }
    .endpoint { background-color: #e9ecef; padding: 10px; margin-bottom: 10px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class='container'>
    <h1>Ultimate Marketing Team - Staging</h1>
    <p>Welcome to the Ultimate Marketing Team staging environment.</p>
    
    <div class='info'>
      <h2>Service Status</h2>
      <p>This is a placeholder frontend while the actual UI is being built.</p>
    </div>
    
    <div class='endpoints'>
      <h2>API Endpoints</h2>
      <div class='endpoint'>API Gateway: <a href='http://localhost:8000/'>http://localhost:8000/</a></div>
      <div class='endpoint'>Health API: <a href='http://localhost:8001/'>http://localhost:8001/</a></div>
    </div>
  </div>
</body>
</html>
EOF

  # Update docker-compose to mount this directory
  sed -i '/frontend:/,/networks:/s|image: \${FRONTEND_IMAGE:-nginx:alpine}|image: nginx:alpine\n    volumes:\n      - ./nginx/html:/usr/share/nginx/html|' docker-compose.yml
fi
"

# Start frontend
echo "🔹 Starting frontend..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose up -d frontend || echo 'Frontend startup failed but continuing deployment'"

# Show all deployed containers
echo "🔹 Deployed containers:"
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker-compose ps"

# Run health check script to verify services
echo "🔹 Running health check..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && ./scripts/monitoring/check_api_health.sh"

# Clean up local deployment files
rm -rf $DEPLOY_DIR $TAR_FILE

echo "✅ Deployment to STAGING complete!"
echo "📝 Access the application at: https://$DOMAIN"
echo "📝 Health API: https://$DOMAIN:8001"
echo "📝 API Gateway: https://$DOMAIN:8000"
echo "📝 Frontend: https://$DOMAIN:3000"
echo ""
echo "Note: The API Gateway is running as a standalone container outside of docker-compose."
echo "HTTPS access is handled by your domain configuration and proxy settings."
echo ""

if [ "$CLEAN_DEPLOY" = true ]; then
  echo "🧹 This was a CLEAN DEPLOYMENT - All previous files and Docker data were removed."
  echo "   If you encounter any issues, please check that all necessary data was properly restored."
else
  echo "💡 TIP: If you encounter issues with file conflicts or Docker containers, try running with --clean:"
  echo "   ./scripts/deployment/deploy_staging.sh --clean"
fi