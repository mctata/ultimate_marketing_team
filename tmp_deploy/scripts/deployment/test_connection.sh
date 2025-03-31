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

# Copy our verification script to test container
echo "Copying pgvector verification script..."
mkdir -p ./docker/postgres/scripts
docker cp ./scripts/deployment/fix_pgvector.sh pg_vector_test:/tmp/fix_pgvector.sh
docker exec pg_vector_test chmod +x /tmp/fix_pgvector.sh

# Test if vector extension is available and can be installed
echo "Testing pgvector extension compatibility..."

# First, try with the contributed modules
echo "Step 1: Trying with PostgreSQL contrib packages..."
docker exec pg_vector_test bash -c "apk add --no-cache postgresql-contrib"
if docker exec pg_vector_test psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS vector;" >/dev/null 2>&1; then
    echo "✅ PostgreSQL vector extension installation successful with contrib packages"
    
    # Test if it actually works
    if docker exec pg_vector_test psql -U postgres -c "
        CREATE TABLE vector_test (id SERIAL PRIMARY KEY, embedding vector(3));
        INSERT INTO vector_test (embedding) VALUES ('[1,2,3]');
        SELECT * FROM vector_test;
        DROP TABLE vector_test;" >/dev/null 2>&1; then
        echo "✅ Vector extension functionality verified"
    else
        echo "⚠️ Vector extension installed but not functioning correctly"
        echo "   Proceeding with full installation from source..."
        NEEDS_SOURCE_INSTALL=true
    fi
else
    echo "Vector extension not available through contrib packages"
    NEEDS_SOURCE_INSTALL=true
fi

# If needed, install from source with comprehensive dependencies
if [ "$NEEDS_SOURCE_INSTALL" = true ]; then
    echo "Step 2: Installing from source with comprehensive dependency support..."
    
    # Try to install vector extension from source with clang and llvm support
    docker exec pg_vector_test bash -c "
        echo 'Installing comprehensive build dependencies...'
        apk add --no-cache git build-base postgresql-dev clang llvm openssl-dev zlib-dev
        
        echo 'Cloning pgvector repository...'
        git clone --branch v0.6.0 https://github.com/pgvector/pgvector.git /tmp/pgvector
        
        echo 'Building pgvector...'
        cd /tmp/pgvector
        
        # Try standard build first
        if make USE_PGXS=1; then
            echo 'Standard build successful'
        else
            echo 'Standard build failed, trying with JIT disabled'
            sed -i 's/USE_PGXS=1 clean/USE_PGXS=1 NO_JIT=1 clean/g' Makefile
            sed -i 's/USE_PGXS=1 all/USE_PGXS=1 NO_JIT=1 all/g' Makefile
            sed -i 's/USE_PGXS=1 install/USE_PGXS=1 NO_JIT=1 install/g' Makefile
            make USE_PGXS=1 NO_JIT=1
        fi
        
        echo 'Installing pgvector...'
        make USE_PGXS=1 install
        
        echo 'Testing extension creation...'
        psql -U postgres -c 'CREATE EXTENSION IF NOT EXISTS vector;'
    "
    
    # Test if installation was successful
    if docker exec pg_vector_test psql -U postgres -c "
        CREATE TABLE vector_test (id SERIAL PRIMARY KEY, embedding vector(3));
        INSERT INTO vector_test (embedding) VALUES ('[1,2,3]');
        SELECT * FROM vector_test;
        DROP TABLE vector_test;" >/dev/null 2>&1; then
        echo "✅ PostgreSQL vector extension successfully installed and verified"
    else
        echo "❌ Failed to create and use vector extension in PostgreSQL container"
        echo "   Please check your Docker environment and PostgreSQL compatibility."
        docker rm -f pg_vector_test >/dev/null 2>&1
        exit 1
    fi
fi

# Clean up test container
docker rm -f pg_vector_test >/dev/null 2>&1

echo "All connection tests passed! You can now proceed with deployment to $DEPLOY_ENV environment."