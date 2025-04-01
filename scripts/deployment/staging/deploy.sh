#!/bin/bash
# Staging environment deployment script with database validation

set -e

echo "======= STAGING DEPLOYMENT SCRIPT ======="
echo "This script deploys the Ultimate Marketing Team to staging"
echo "with enhanced database initialization and validation"

# Current directory should be the project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"

# Configuration
COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE="config/env/staging.env"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/staging_backup_$TIMESTAMP.tar.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker first."
    echo "On macOS, open Docker Desktop application."
    echo "On Linux, run: sudo systemctl start docker"
    exit 1
fi

# Check Docker Compose version (supports both docker-compose and docker compose)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif docker-compose --version &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Docker Compose is not installed or not in PATH."
    exit 1
fi

# Create directory for env file if it doesn't exist
mkdir -p $(dirname "$ENV_FILE")

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️ Environment file not found at $ENV_FILE"
    echo "Creating a default environment file..."
    
    # Create a default environment file
    cat > "$ENV_FILE" << EOF
# Staging environment configuration
UMT_ENV=staging
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/umt
SCHEMA_NAME=umt
RABBITMQ_HOST=rabbitmq
REDIS_HOST=redis
JWT_SECRET=staging_jwt_secret_change_this_in_production
SECRET_KEY=staging_secret_key_change_this_in_production
CSRF_SECRET=staging_csrf_secret_change_this_in_production
UMT_LOG_LEVEL=INFO
UMT_MAINTENANCE_MODE=false
EOF
    
    echo "✅ Default environment file created at $ENV_FILE"
    echo "⚠️ Please review and update the environment file before proceeding in production"
fi

# Load environment variables
echo "Loading environment variables from $ENV_FILE"
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
else
    echo "⚠️ Environment file could not be loaded, using default values"
fi

# Function to back up existing deployment
function backup_deployment() {
    echo "Creating backup of existing deployment..."
    
    # Check if there are running containers to back up
    if [ "$($DOCKER_COMPOSE -f "$COMPOSE_FILE" ps -q 2>/dev/null | wc -l)" -gt 0 ]; then
        # Export any important container data
        mkdir -p "$BACKUP_DIR/data"
        
        # Try to export database
        echo "Backing up database..."
        if $DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T postgres pg_dump -U postgres umt > "$BACKUP_DIR/data/umt_db_backup.sql" 2>/dev/null; then
            echo "✅ Database backup created successfully"
        else
            echo "⚠️ Could not create database backup"
        fi
        
        # Archive the backup
        tar -czf "$BACKUP_FILE" -C "$BACKUP_DIR/data" .
        rm -rf "$BACKUP_DIR/data"
        
        echo "✅ Backup created at $BACKUP_FILE"
    else
        echo "No running containers found for backup"
    fi
}

# Function to check if PostgreSQL is reachable
function check_postgres_health() {
    echo "Checking PostgreSQL health..."
    
    if $DOCKER_COMPOSE -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        if $DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres; then
            echo "✅ PostgreSQL is healthy"
            return 0
        else
            echo "⚠️ PostgreSQL is running but not accepting connections"
            return 1
        fi
    else
        echo "⚠️ PostgreSQL container is not running"
        return 1
    fi
}

# Main deployment process
echo "Starting deployment process..."

# Create backup
backup_deployment

# Pull latest images if using pre-built ones or build locally
echo "Building or pulling Docker images..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" build

# Check if any containers already exist and stop them
if [ "$($DOCKER_COMPOSE -f "$COMPOSE_FILE" ps -q 2>/dev/null | wc -l)" -gt 0 ]; then
    echo "Stopping existing containers..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" down
fi

# Start the database first to ensure it's ready
echo "Starting PostgreSQL database..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
attempt=1
max_attempts=30
until check_postgres_health || [ $attempt -gt $max_attempts ]; do
    echo "Attempt $attempt/$max_attempts: PostgreSQL not ready yet, waiting..."
    sleep 5
    ((attempt++))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ PostgreSQL did not become ready in time. Deployment may fail."
    echo "Consider running the fix script after deployment completes."
else
    echo "✅ PostgreSQL is ready"
fi

# Start the database proxy to ensure schema initialization
echo "Starting PostgreSQL proxy for initialization..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d postgres-proxy

# Wait for proxy to be ready
echo "Waiting for PostgreSQL proxy to be healthy..."
attempt=1
max_attempts=20
until $DOCKER_COMPOSE -f "$COMPOSE_FILE" ps postgres-proxy | grep -q "(healthy)" || [ $attempt -gt $max_attempts ]; do
    echo "Attempt $attempt/$max_attempts: PostgreSQL proxy not healthy yet, waiting..."
    sleep 5
    ((attempt++))
done

# Run migrations
echo "Running database migrations..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d migrations

# Wait for migrations to complete
echo "Waiting for migrations to complete..."
attempt=1
max_attempts=20
until [ "$($DOCKER_COMPOSE -f "$COMPOSE_FILE" ps -q migrations 2>/dev/null)" == "" ] || [ $attempt -gt $max_attempts ]; do
    echo "Attempt $attempt/$max_attempts: Migrations still running, waiting..."
    sleep 5
    ((attempt++))
done

# Start all remaining services
echo "Starting all services..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d

# Specifically ensure health-api is working
echo "Ensuring health-api is properly initialized..."
if [ -f "$SCRIPT_DIR/../fix_health_api.sh" ]; then
    bash "$SCRIPT_DIR/../fix_health_api.sh"
else
    echo "Health API fix script not found, continuing without it..."
fi

# Check if API gateway is healthy
echo "Checking API gateway health..."
attempt=1
max_attempts=30
until curl -s http://localhost:8000/api/health >/dev/null 2>&1 || [ $attempt -gt $max_attempts ]; do
    echo "Attempt $attempt/$max_attempts: API gateway not ready yet, waiting..."
    sleep 5
    ((attempt++))
done

if [ $attempt -gt $max_attempts ]; then
    echo "⚠️ API gateway did not become ready in time."
    echo "Running fix script to address potential database issues..."
    bash "$SCRIPT_DIR/fix_api_gateway_db.sh"
    
    # Final health check
    if curl -s http://localhost:8000/api/health/db | grep -q "\"status\":\"connected\""; then
        echo "✅ Database issues fixed successfully"
    else
        echo "⚠️ Database issues may still persist. Please check the logs:"
        echo "$DOCKER_COMPOSE -f $COMPOSE_FILE logs api-gateway"
    fi
else
    echo "✅ API gateway is healthy"
    
    # Check database connectivity specifically
    if curl -s http://localhost:8000/api/health/db | grep -q "\"status\":\"connected\""; then
        echo "✅ API gateway database connection successful"
    else
        echo "⚠️ API gateway cannot connect to the database"
        echo "Running fix script to address database issues..."
        bash "$SCRIPT_DIR/fix_api_gateway_db.sh"
    fi
fi

# Final status check of all services
echo "Checking status of all services..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" ps

echo "======= DEPLOYMENT COMPLETE ======="
echo "The application should be available at:"
echo "- API: http://localhost:8000"
echo "- Frontend: http://localhost:3000"
echo ""
echo "If there are any issues with the API gateway database connection:"
echo "1. Run the fix script: bash scripts/deployment/staging/fix_api_gateway_db.sh"
echo "2. Check the logs: $DOCKER_COMPOSE -f $COMPOSE_FILE logs api-gateway"
echo ""
