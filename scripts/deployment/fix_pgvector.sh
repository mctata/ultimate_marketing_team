#!/bin/bash
# Enhanced pgvector installation and verification script for PostgreSQL containers
set -e

echo "========== pgvector extension installer and verification =========="

# Process arguments
CONTAINER_PREFIX=${1:-"ultimate-marketing-team"}
DB_NAME=${2:-"ultimatemarketing_db"}

# Get container IDs
POSTGRES_CONTAINER=$(docker ps -q -f name=${CONTAINER_PREFIX}_postgres | head -n 1)
VECTOR_DB_CONTAINER=$(docker ps -q -f name=${CONTAINER_PREFIX}_vector-db | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ Error: Postgres container not found"
    echo "Usage: $0 [container_prefix] [database_name]"
    echo "Example: $0 umt ultimatemarketing_db"
    exit 1
fi

install_pgvector() {
    local container=$1
    local db_name=$2
    local service_name=$3
    
    echo "📦 Installing pgvector in $service_name container ($container)..."
    
    # Try to run the verification script if it exists
    if docker exec $container bash -c "[ -f /usr/local/bin/verify_pgvector.sh ]"; then
        echo "🔍 Found verification script, running it..."
        docker exec $container bash -c "/usr/local/bin/verify_pgvector.sh $db_name"
        if [ $? -eq 0 ]; then
            echo "✅ pgvector installation verified successfully using container script"
            return 0
        fi
    fi
    
    # If verification script doesn't exist or fails, proceed with manual installation
    echo "⚙️ Installing build dependencies and pgvector from source..."
    docker exec -i $container bash -c "
        # Install build dependencies with more comprehensive support
        echo 'Installing build dependencies...'
        apk add --no-cache postgresql-contrib git build-base postgresql-dev clang llvm openssl-dev zlib-dev

        # Clone specific version of pgvector
        echo 'Cloning pgvector repository...'
        git clone --branch v0.6.0 https://github.com/pgvector/pgvector.git /tmp/pgvector

        # Build with multiple fallback options
        echo 'Building and installing pgvector...'
        cd /tmp/pgvector
        
        # Try standard build first
        if ! make USE_PGXS=1; then
            echo 'Standard build failed, trying with JIT disabled'
            sed -i 's/USE_PGXS=1 clean/USE_PGXS=1 NO_JIT=1 clean/g' Makefile
            sed -i 's/USE_PGXS=1 all/USE_PGXS=1 NO_JIT=1 all/g' Makefile
            sed -i 's/USE_PGXS=1 install/USE_PGXS=1 NO_JIT=1 install/g' Makefile
            make USE_PGXS=1 NO_JIT=1
        fi
        
        # Install pgvector
        make USE_PGXS=1 install
        
        # Create the extension
        echo 'Creating vector extension...'
        psql -U postgres -d $db_name -c 'CREATE EXTENSION IF NOT EXISTS vector;' || echo 'Failed to create extension'
        
        # Test the extension
        echo 'Testing vector extension...'
        if psql -U postgres -d $db_name -c \"
            CREATE TABLE IF NOT EXISTS vector_test (id SERIAL PRIMARY KEY, embedding vector(3));
            INSERT INTO vector_test (embedding) VALUES ('[1,2,3]');
            SELECT * FROM vector_test;
            DROP TABLE vector_test;
        \"; then
            echo 'Vector extension test succeeded'
        else
            echo 'Vector extension test failed'
            exit 1
        fi
        
        # Clean up
        rm -rf /tmp/pgvector
    "
    
    # Verify installation was successful
    if docker exec $container psql -U postgres -d $db_name -c "SELECT count(*) FROM pg_extension WHERE extname = 'vector';" | grep -q 1; then
        echo "✅ pgvector extension successfully installed in $service_name"
        return 0
    else
        echo "❌ Failed to install pgvector in $service_name"
        return 1
    fi
}

# Install for main PostgreSQL container
install_pgvector "$POSTGRES_CONTAINER" "$DB_NAME" "postgres"
MAIN_RESULT=$?

# Install for vector-db container if it exists
if [ ! -z "$VECTOR_DB_CONTAINER" ]; then
    install_pgvector "$VECTOR_DB_CONTAINER" "$DB_NAME" "vector-db"
    VECTOR_RESULT=$?
else
    echo "ℹ️ Vector DB container not found, skipping..."
    VECTOR_RESULT=0
fi

# Final report
echo "========================= Installation Report ========================="
if [ $MAIN_RESULT -eq 0 ]; then
    echo "✅ PostgreSQL container: pgvector successfully installed"
else
    echo "❌ PostgreSQL container: pgvector installation failed"
fi

if [ ! -z "$VECTOR_DB_CONTAINER" ]; then
    if [ $VECTOR_RESULT -eq 0 ]; then
        echo "✅ Vector DB container: pgvector successfully installed"
    else
        echo "❌ Vector DB container: pgvector installation failed"
    fi
fi

# Exit with success only if both installations succeeded
if [ $MAIN_RESULT -eq 0 ] && [ $VECTOR_RESULT -eq 0 ]; then
    echo "✅ All pgvector installations completed successfully!"
    exit 0
else
    echo "❌ One or more pgvector installations failed"
    exit 1
fi