#!/bin/bash
# Test SSH connection to environment before deployment
# Usage: ./scripts/deployment/test_connection.sh [environment]
# Example: ./scripts/deployment/test_connection.sh staging

set -e

# Default to staging if no environment is specified
DEPLOY_ENV=${1:-"staging"}
echo "Testing SSH connection to $DEPLOY_ENV server..."

# Load environment-specific configuration
ENV_FILE="config/env/deployment.env.$DEPLOY_ENV"
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file $ENV_FILE not found."
    echo "Available environments:"
    ls -1 config/env/deployment.env.* | sed 's/.*deployment.env.//'
    exit 1
fi

# Source the configuration file
source "$ENV_FILE"

# Configuration - use defaults if not set in env file
SSH_USER=${SSH_USER:-"localhost"}
SSH_HOST=${SSH_HOST:-"localhost"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/tmp/local-deploy"}
SSH_KEY=${SSH_KEY:-"~/.ssh/id_rsa"}

echo "Using deployment configuration for $DEPLOY_ENV environment:"
echo "SSH User: $SSH_USER"
echo "SSH Host: $SSH_HOST"
echo "SSH Port: $SSH_PORT"
echo "Remote Directory: $REMOTE_DIR"
echo "SSH Key: $SSH_KEY"
echo "Docker Compose File: $COMPOSE_FILE"

# Test SSH connection
if [ "$SSH_HOST" == "localhost" ]; then
    echo "✅ Local deployment - SSH connection test skipped"
else
    echo "Testing connection to $SSH_USER@$SSH_HOST:$REMOTE_DIR..."
    
    # Test SSH connection
    if ssh -p $SSH_PORT -i $SSH_KEY -o BatchMode=yes -o ConnectTimeout=5 $SSH_USER@$SSH_HOST echo "SSH connection successful"; then
        echo "✅ SSH connection test passed"
    else
        echo "❌ SSH connection test failed. Please verify your SSH credentials and try again."
        exit 1
    fi
    
    # Test write permissions
    echo "Testing write permissions to remote directory..."
    if ssh -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST "mkdir -p $REMOTE_DIR && touch $REMOTE_DIR/test_write_permission && rm $REMOTE_DIR/test_write_permission"; then
        echo "✅ Write permission test passed"
    else
        echo "❌ Write permission test failed. Please verify your directory permissions."
        exit 1
    fi
    
    # Test Docker and Docker Compose availability
    echo "Checking if Docker and Docker Compose are installed on the remote server..."
    if ssh -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST "command -v docker && command -v docker-compose"; then
        echo "✅ Docker and Docker Compose are available"
    else
        echo "❌ Docker and/or Docker Compose not available on the remote server."
        exit 1
    fi
fi

# Test PostgreSQL 17 compatibility
echo "Testing if postgres:17-alpine image is available..."
if docker pull postgres:17-alpine >/dev/null 2>&1; then
    echo "✅ postgres:17-alpine image available"
else
    echo "❌ Failed to pull postgres:17-alpine image. Check Docker Hub or your internet connection."
    exit 1
fi

# Test if we can start a temporary PostgreSQL container
echo "Testing PostgreSQL vector extension initialization..."
docker run --name pg_vector_test -e POSTGRES_PASSWORD=postgres -d postgres:17-alpine >/dev/null 2>&1
sleep 5  # Give the container time to start

# Copy vector extension installation script to container
docker cp ./docker/postgres/install_pgvector.sql pg_vector_test:/tmp/install_pgvector.sql

# Test if vector extension is available and can be installed
if docker exec pg_vector_test psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS vector;" >/dev/null 2>&1; then
    echo "✅ PostgreSQL vector extension installation successful"
else
    echo "❌ Failed to create vector extension in PostgreSQL container"
    echo "   Attempting to install vector extension package..."
    
    # Try to install vector extension
    docker exec pg_vector_test apk add --no-cache postgresql-contrib
    
    if docker exec pg_vector_test psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS vector;" >/dev/null 2>&1; then
        echo "✅ PostgreSQL vector extension installation successful after installing postgresql-contrib"
    else
        echo "❌ Failed to create vector extension in PostgreSQL container"
        docker rm -f pg_vector_test >/dev/null 2>&1
        exit 1
    fi
fi

# Clean up test container
docker rm -f pg_vector_test >/dev/null 2>&1

echo "All connection tests passed! You can now proceed with deployment to $DEPLOY_ENV environment."