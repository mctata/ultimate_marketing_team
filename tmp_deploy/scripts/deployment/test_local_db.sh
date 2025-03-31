#!/bin/bash
# Test the local PostgreSQL setup with vector extension

set -e

echo "Testing local PostgreSQL setup with vector extension..."

# Configuration
POSTGRES_USER=${POSTGRES_USER:-"postgres"}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-"postgres"}
POSTGRES_DB=${POSTGRES_DB:-"ultimatemarketing"}
POSTGRES_HOST=${POSTGRES_HOST:-"localhost"}
POSTGRES_PORT=${POSTGRES_PORT:-"5432"}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop or Docker daemon."
    exit 1
fi

# Clean up any existing test containers
echo "Cleaning up any existing test containers..."
docker rm -f pg_dev_test >/dev/null 2>&1 || true

# Pull the latest pgvector image
echo "Pulling the ankane/pgvector image..."
if ! docker pull ankane/pgvector:latest >/dev/null 2>&1; then
    echo "❌ Failed to pull ankane/pgvector image. Check Docker Hub or your internet connection."
    exit 1
fi

# Start a PostgreSQL container with pgvector
echo "Starting PostgreSQL container with pgvector..."
docker run --name pg_dev_test -e POSTGRES_USER=$POSTGRES_USER -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
  -e POSTGRES_DB=$POSTGRES_DB -d -p $POSTGRES_PORT:5432 ankane/pgvector:latest >/dev/null 2>&1

echo "Waiting for PostgreSQL to start..."
sleep 10  # Give the container time to start

# Test connection to PostgreSQL
echo "Testing connection to PostgreSQL..."
if docker exec pg_dev_test psql -U $POSTGRES_USER -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ PostgreSQL connection successful"
else
    echo "❌ Failed to connect to PostgreSQL"
    docker rm -f pg_dev_test >/dev/null 2>&1
    exit 1
fi

# Test vector extension
echo "Testing vector extension..."
if docker exec pg_dev_test psql -U $POSTGRES_USER -c "CREATE EXTENSION IF NOT EXISTS vector;" >/dev/null 2>&1; then
    echo "✅ Vector extension is available and can be created"
else
    echo "❌ Failed to create vector extension"
    docker rm -f pg_dev_test >/dev/null 2>&1
    exit 1
fi

# Test vector functionality
echo "Testing vector functionality..."
TEST_QUERY=$(cat <<EOF
DO \$\$
BEGIN
    -- Create a test table
    CREATE TABLE IF NOT EXISTS vector_test (
        id SERIAL PRIMARY KEY,
        embedding vector(3)
    );
    
    -- Insert a test vector
    INSERT INTO vector_test (embedding) VALUES ('[1,2,3]');
    
    -- Query the test vector
    PERFORM * FROM vector_test WHERE embedding = '[1,2,3]';
    
    -- Clean up
    DROP TABLE vector_test;
    
    RAISE NOTICE 'Vector functionality test passed';
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Vector functionality test failed: %', SQLERRM;
END\$\$;
EOF
)

if docker exec pg_dev_test psql -U $POSTGRES_USER -c "$TEST_QUERY" >/dev/null 2>&1; then
    echo "✅ Vector functionality test passed"
else
    echo "❌ Vector functionality test failed"
    docker rm -f pg_dev_test >/dev/null 2>&1
    exit 1
fi

# Test init.sql script
echo "Testing init.sql script..."
docker cp /Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/docker/postgres/init.sql pg_dev_test:/tmp/init.sql
if docker exec pg_dev_test psql -U $POSTGRES_USER -f /tmp/init.sql >/dev/null 2>&1; then
    echo "✅ init.sql script executed successfully"
else
    echo "❌ Failed to execute init.sql script"
    docker rm -f pg_dev_test >/dev/null 2>&1
    exit 1
fi

# Test integration_upgrade.sql script
echo "Testing integration_upgrade.sql script..."
docker cp /Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/docker/postgres/integration_upgrade.sql pg_dev_test:/tmp/integration_upgrade.sql
if docker exec pg_dev_test psql -U $POSTGRES_USER -f /tmp/integration_upgrade.sql >/dev/null 2>&1; then
    echo "✅ integration_upgrade.sql script executed successfully"
else
    echo "❌ Failed to execute integration_upgrade.sql script"
    docker rm -f pg_dev_test >/dev/null 2>&1
    exit 1
fi

# Test install_pgvector.sql script
echo "Testing install_pgvector.sql script..."
docker cp /Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/docker/postgres/install_pgvector.sql pg_dev_test:/tmp/install_pgvector.sql
if docker exec pg_dev_test psql -U $POSTGRES_USER -f /tmp/install_pgvector.sql >/dev/null 2>&1; then
    echo "✅ install_pgvector.sql script executed successfully"
else
    echo "❌ Failed to execute install_pgvector.sql script"
    docker rm -f pg_dev_test >/dev/null 2>&1
    exit 1
fi

# Clean up
echo "Cleaning up test container..."
docker rm -f pg_dev_test >/dev/null 2>&1

echo "✅ All PostgreSQL tests passed! Your development setup is ready."
echo "Run 'docker-compose -f docker-compose.dev.yml up -d' to start your development environment."