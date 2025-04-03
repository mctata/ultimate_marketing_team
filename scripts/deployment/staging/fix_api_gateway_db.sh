#!/bin/bash
# Script to fix API gateway database connection issues
# Based on the POSTGRES17_MIGRATION.md guidance

set -e

echo "======= API GATEWAY DATABASE FIX SCRIPT ======="
echo "This script fixes database connectivity issues between the API gateway and PostgreSQL"

# Current directory should be the project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"

# Configuration
COMPOSE_FILE="docker-compose.staging.yml"

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker first."
    exit 1
fi

# Determine Docker Compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif docker-compose --version &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Docker Compose is not installed or not in PATH."
    exit 1
fi

# Check database container
echo "Checking PostgreSQL container status..."
if ! $DOCKER_COMPOSE -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
    echo "⚠️ PostgreSQL container is not running. Starting it..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d postgres
    
    echo "Waiting for PostgreSQL to start..."
    sleep 10
fi

# Verify PostgreSQL is running correctly
echo "Verifying PostgreSQL connection..."
if ! $DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres; then
    echo "⚠️ Cannot connect to PostgreSQL. Restarting container..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" restart postgres
    
    echo "Waiting for PostgreSQL to restart..."
    sleep 15
    
    if ! $DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres; then
        echo "❌ PostgreSQL still not responding. Applying more aggressive fix..."
        $DOCKER_COMPOSE -f "$COMPOSE_FILE" down
        $DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d postgres
        
        echo "Waiting for fresh PostgreSQL container..."
        sleep 20
    fi
fi

# Check if pgvector extension is installed
echo "Verifying pgvector extension..."
if ! $DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d ultimatemarketing -c "SELECT * FROM pg_extension WHERE extname = 'vector';" | grep -q "vector"; then
    echo "⚠️ pgvector extension not found. Installing it..."
    
    echo "Applying pgvector fix..."
    chmod +x docker/postgres/fix_pgvector.sh
    ./docker/postgres/fix_pgvector.sh "$(docker-compose -f "$COMPOSE_FILE" ps -q postgres)" "ultimatemarketing"
fi

# Restart API gateway container
echo "Restarting API gateway container..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" restart api-gateway

echo "Waiting for API gateway to initialize..."
sleep 10

# Check API gateway health
echo "Verifying API gateway health..."
if curl -s http://localhost:8000/health | grep -q "\"status\":\"ok\""; then
    echo "✅ API gateway is healthy"
else
    echo "⚠️ API gateway still has issues. Restarting dependent services..."
    
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" restart redis rabbitmq api-gateway
    
    echo "Waiting for services to restart..."
    sleep 15
    
    if curl -s http://localhost:8000/health | grep -q "\"status\":\"ok\""; then
        echo "✅ API gateway is now healthy"
    else
        echo "❌ API gateway still has issues. Consider rebuilding all containers:"
        echo "$DOCKER_COMPOSE -f $COMPOSE_FILE down"
        echo "$DOCKER_COMPOSE -f $COMPOSE_FILE up -d"
        exit 1
    fi
fi

echo "======= FIX COMPLETE ======="
echo "API gateway should now be properly connected to the database."
echo "If problems persist, check logs with:"
echo "$DOCKER_COMPOSE -f $COMPOSE_FILE logs api-gateway"