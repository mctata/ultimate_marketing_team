#!/bin/bash
# Fix script for API gateway database connection issues in staging
# This script attempts to diagnose and repair common database connection issues

set -e

echo "==== API Gateway Database Connection Repair Tool ===="

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

echo "Running diagnostic checks and repairs..."

# Store container names - both standard and traditional format
API_CONTAINER_STANDARD="umt-api-gateway"
DB_CONTAINER_STANDARD="umt-postgres"
MIGRATIONS_CONTAINER_STANDARD="umt-migrations"

API_CONTAINER_TRADITIONAL="ultimate-marketing-team_api-gateway_1"
DB_CONTAINER_TRADITIONAL="ultimate-marketing-team_postgres_1"
MIGRATIONS_CONTAINER_TRADITIONAL="ultimate-marketing-team_migrations_1"
DB_PROXY_TRADITIONAL="ultimate-marketing-team_postgres-proxy_1"

# Determine which container format is being used by checking both
if docker ps | grep -q "$API_CONTAINER_STANDARD"; then
    API_CONTAINER="$API_CONTAINER_STANDARD"
    DB_CONTAINER="$DB_CONTAINER_STANDARD"
    MIGRATIONS_CONTAINER="$MIGRATIONS_CONTAINER_STANDARD"
    CONTAINER_FORMAT="standard"
elif docker ps | grep -q "$API_CONTAINER_TRADITIONAL"; then
    API_CONTAINER="$API_CONTAINER_TRADITIONAL"
    DB_CONTAINER="$DB_CONTAINER_TRADITIONAL"
    MIGRATIONS_CONTAINER="$MIGRATIONS_CONTAINER_TRADITIONAL"
    DB_PROXY="$DB_PROXY_TRADITIONAL"
    CONTAINER_FORMAT="traditional"
else
    echo "⚠️ Could not find API gateway container. Make sure the containers are running."
    echo "Running containers:"
    docker ps
    exit 1
fi

echo "Using container format: $CONTAINER_FORMAT"
echo "API container: $API_CONTAINER"
echo "Database container: $DB_CONTAINER"

# Check if postgres proxy is actually healthy
echo "Checking PostgreSQL container health..."
if [ "$CONTAINER_FORMAT" = "standard" ]; then
    PG_STATUS=$(docker inspect --format='{{.State.Health.Status}}' $DB_CONTAINER 2>/dev/null || echo "container not found")
else
    PG_STATUS=$(docker inspect --format='{{.State.Health.Status}}' $DB_CONTAINER 2>/dev/null || echo "container not found")
    PROXY_STATUS=$(docker inspect --format='{{.State.Health.Status}}' $DB_PROXY 2>/dev/null || echo "container not found")
    echo "Postgres proxy status: $PROXY_STATUS"
fi

if [ "$PG_STATUS" != "healthy" ]; then
    echo "⚠️ PostgreSQL container is not healthy. Status: $PG_STATUS"
    echo "Attempting to restart PostgreSQL container..."
    docker restart $DB_CONTAINER
    
    # Wait for container to become healthy
    echo "Waiting for PostgreSQL to become healthy..."
    for i in {1..30}; do
        echo "Attempt $i/30..."
        PG_STATUS=$(docker inspect --format='{{.State.Health.Status}}' $DB_CONTAINER 2>/dev/null || echo "container not found")
        if [ "$PG_STATUS" = "healthy" ]; then
            echo "✅ PostgreSQL container is now healthy!"
            break
        fi
        sleep 3
    done
    
    if [ "$PG_STATUS" != "healthy" ]; then
        echo "❌ PostgreSQL container is still not healthy after restart."
        echo "Checking PostgreSQL logs for errors:"
        docker logs $DB_CONTAINER --tail 50
    fi
else
    echo "✅ PostgreSQL container appears to be healthy"
fi

# Get PostgreSQL version to ensure we're using the right commands
PG_VERSION=$(docker exec $DB_CONTAINER psql -U postgres -c "SHOW server_version;" -t 2>/dev/null | xargs)
echo "PostgreSQL version: $PG_VERSION"
IS_PG17=$(echo $PG_VERSION | grep -q "^17" && echo "true" || echo "false")

echo "Using PostgreSQL 17 compatible commands: $IS_PG17"

# Check network connectivity from API gateway to PostgreSQL
echo "Testing network connectivity from API gateway to PostgreSQL..."
if docker exec $API_CONTAINER ping -c 2 postgres; then
    echo "✅ Network connectivity to PostgreSQL is successful"
else
    echo "⚠️ Network connectivity issues. This might be normal if ping is not available in the API container."
fi

# Get environment variables
echo "Retrieving database connection information..."
DB_HOST=$(docker exec $API_CONTAINER bash -c 'echo $DB_HOST')
DB_PORT=$(docker exec $API_CONTAINER bash -c 'echo $DB_PORT')
DB_USER=$(docker exec $API_CONTAINER bash -c 'echo $DB_USER')
DATABASE=$(docker exec $API_CONTAINER bash -c 'echo $DB_NAME')

echo "Database connection parameters:"
echo "Host: ${DB_HOST:-postgres}"
echo "Port: ${DB_PORT:-5432}"
echo "User: ${DB_USER:-postgres}"
echo "Database: ${DATABASE:-umt}"

# Check if the database exists
echo "Checking if database exists in PostgreSQL container..."
DB_EXISTS=$(docker exec $DB_CONTAINER psql -U postgres -c "SELECT EXISTS(SELECT datname FROM pg_catalog.pg_database WHERE datname = '${DATABASE:-umt}');" -t || echo "query failed")

if [[ $DB_EXISTS == *"t"* ]]; then
    echo "✅ Database '${DATABASE:-umt}' exists"
else
    echo "⚠️ Database '${DATABASE:-umt}' doesn't exist or couldn't be checked"
    echo "Attempting to create database..."
    
    if [ "$IS_PG17" = "true" ]; then
        # PostgreSQL 17 compatible command
        docker exec $DB_CONTAINER psql -U postgres -c "SELECT 'CREATE DATABASE ${DATABASE:-umt}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DATABASE:-umt}')\gexec" || echo "Failed to create database"
    else
        # Fallback command for older PostgreSQL versions
        docker exec $DB_CONTAINER psql -U postgres -c "CREATE DATABASE ${DATABASE:-umt};" || echo "Failed to create database"
    fi
fi

# Test database connection from API gateway
echo "Testing database connection from API gateway..."
if docker exec $API_CONTAINER bash -c "pg_isready -h ${DB_HOST:-postgres} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres}"; then
    echo "✅ Database connection from API gateway successful"
else
    echo "⚠️ Database connection test failed. Checking possible issues..."
    
    # Check if postgres is listening on the right address
    LISTEN_ADDRESSES=$(docker exec $DB_CONTAINER psql -U postgres -c "SHOW listen_addresses;" -t || echo "query failed")
    echo "PostgreSQL listen_addresses: $LISTEN_ADDRESSES"
    
    if [[ $LISTEN_ADDRESSES != *"*"* ]]; then
        echo "⚠️ PostgreSQL might not be listening on all interfaces."
        echo "Attempting to update configuration..."
        docker exec $DB_CONTAINER psql -U postgres -c "ALTER SYSTEM SET listen_addresses = '*';" || echo "Could not update listen_addresses"
        docker restart $DB_CONTAINER
        echo "Waiting for PostgreSQL to restart..."
        sleep 10
    fi
    
    # Check authentication method for PostgreSQL 17
    if [ "$IS_PG17" = "true" ]; then
        AUTH_METHOD=$(docker exec $DB_CONTAINER psql -U postgres -c "SHOW password_encryption;" -t || echo "query failed")
        echo "PostgreSQL authentication method: $AUTH_METHOD"
        
        # Check pg_hba.conf configuration
        echo "Checking client authentication configuration..."
        docker exec $DB_CONTAINER psql -U postgres -c "SELECT type, database, user_name, auth_method FROM pg_hba_file_rules;" || echo "Could not check pg_hba.conf"
    fi
fi

# Check if schema exists
echo "Checking if schema 'umt' exists..."
SCHEMA_EXISTS=$(docker exec $DB_CONTAINER psql -U postgres -d ${DATABASE:-umt} -c "SELECT EXISTS(SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'umt');" -t || echo "query failed")

if [[ $SCHEMA_EXISTS == *"t"* ]]; then
    echo "✅ Schema 'umt' exists"
else
    echo "⚠️ Schema 'umt' doesn't exist or couldn't be checked"
    echo "Attempting to create schema..."
    docker exec $DB_CONTAINER psql -U postgres -d ${DATABASE:-umt} -c "CREATE SCHEMA IF NOT EXISTS umt;" || echo "Failed to create schema"
fi

# Run migrations manually
echo "Attempting to run migrations manually..."
if docker exec $API_CONTAINER bash -c "cd /app && python -m alembic upgrade head"; then
    echo "✅ Migrations completed successfully"
else
    echo "⚠️ Migration failed, but continuing repair process"
    
    # Try to fix common migration issues
    echo "Checking for multiple heads..."
    HEADS=$(docker exec $API_CONTAINER bash -c "cd /app && python -m alembic heads" || echo "command failed")
    
    if [[ $HEADS == *"multiple"* ]]; then
        echo "Detected multiple heads. Attempting to merge..."
        docker exec $API_CONTAINER bash -c "cd /app && python -m alembic merge heads -m 'merge heads'" || echo "Failed to merge heads"
        
        echo "Retrying migration after merge..."
        docker exec $API_CONTAINER bash -c "cd /app && python -m alembic upgrade head" || echo "Migration still failed"
    fi
fi

# Check if the alembic_version table exists
echo "Checking if alembic_version table exists..."
TABLE_EXISTS=$(docker exec $DB_CONTAINER psql -U postgres -d ${DATABASE:-umt} -c "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'umt' AND table_name = 'alembic_version');" -t || echo "query failed")

if [[ $TABLE_EXISTS == *"t"* ]]; then
    echo "✅ Alembic version table exists"
    # Check current migration version
    VERSION=$(docker exec $DB_CONTAINER psql -U postgres -d ${DATABASE:-umt} -c "SELECT version_num FROM umt.alembic_version;" -t || echo "query failed")
    echo "Current migration version: $VERSION"
else
    echo "⚠️ Alembic version table doesn't exist - migrations have never been run successfully"
fi

# Restart API gateway
echo "Restarting API gateway container..."
docker restart $API_CONTAINER

echo "Waiting for API gateway to start..."
sleep 10

# Check API gateway health
echo "Checking API gateway health..."
if curl -s http://localhost:8000/api/health; then
    echo -e "\n✅ API gateway health endpoint is accessible"
else
    echo -e "\n⚠️ Could not reach API health endpoint"
fi

echo ""
if curl -s http://localhost:8000/api/health/db; then
    echo -e "\n✅ Database health endpoint is accessible"
    
    # Check connection status
    DB_STATUS=$(curl -s http://localhost:8000/api/health/db | grep -o '"status":"[^"]*"' || echo "not found")
    if [[ $DB_STATUS == *"connected"* ]]; then
        echo "✅ Database connection is working properly"
    else
        echo "⚠️ Database connection status is not 'connected'. Please check API logs for more details."
    fi
else
    echo -e "\n⚠️ Could not reach database health endpoint"
fi

echo -e "\n==== Repair process completed ===="
echo "If issues persist, you may need to:"
echo "1. Check database credentials in environment variables"
echo "2. Verify PostgreSQL configuration"
echo "3. Examine API gateway logs with: docker logs $API_CONTAINER"
echo "4. For PostgreSQL 17 specific issues, check the troubleshooting guide in docs/staging-troubleshooting.md"
