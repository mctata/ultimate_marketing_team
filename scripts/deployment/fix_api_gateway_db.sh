#!/bin/bash
# Fix script for API gateway database connection issues in staging
# This script attempts to diagnose and repair common database connection issues

set -e

echo "==== API Gateway Database Connection Repair Tool ===="
echo "Running diagnostic checks and repairs..."

# Store container names
API_CONTAINER="ultimate-marketing-team_api-gateway_1"
DB_CONTAINER="ultimate-marketing-team_postgres-proxy_1"
MIGRATIONS_CONTAINER="ultimate-marketing-team_migrations_1"

# Check if postgres proxy is actually healthy
echo "Checking PostgreSQL container health..."
PG_STATUS=$(docker inspect --format='{{.State.Health.Status}}' $DB_CONTAINER 2>/dev/null || echo "container not found")

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

# Check network connectivity from API gateway to PostgreSQL
echo "Testing network connectivity from API gateway to PostgreSQL..."
docker exec $API_CONTAINER ping -c 2 postgres || true

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
    docker exec $DB_CONTAINER psql -U postgres -c "CREATE DATABASE ${DATABASE:-umt};" || echo "Failed to create database"
fi

# Test database connection from API gateway
echo "Testing database connection from API gateway..."
docker exec $API_CONTAINER bash -c "pg_isready -h ${DB_HOST:-postgres} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres}" || echo "Connection test failed"

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
docker exec $API_CONTAINER bash -c "cd /app && python -m alembic upgrade head" || echo "Migration failed, but continuing repair process"

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
curl -s http://localhost:8000/api/health || echo "Could not reach API health endpoint"
echo ""
curl -s http://localhost:8000/api/health/db || echo "Could not reach database health endpoint"

echo "==== Repair process completed ===="
echo "If issues persist, you may need to:"
echo "1. Check database credentials in environment variables"
echo "2. Verify PostgreSQL configuration"
echo "3. Examine API gateway logs with: docker logs $API_CONTAINER"
