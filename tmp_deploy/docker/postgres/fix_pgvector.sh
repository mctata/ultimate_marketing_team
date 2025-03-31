#!/bin/bash
# Script to manually install pgvector in PostgreSQL container
# Usage: ./fix_pgvector.sh [container_name] [database_name]

set -e

# Default values
CONTAINER=${1:-"postgres"}
DATABASE=${2:-"umt_db"}

echo "Installing pgvector extension in container $CONTAINER for database $DATABASE..."

docker exec -i $CONTAINER bash -c "
    echo 'Adding PostgreSQL contrib packages...'
    apk add --no-cache postgresql-contrib
    
    # Check if the vector extension is available from contrib
    if psql -U postgres -d $DATABASE -c 'CREATE EXTENSION IF NOT EXISTS vector;' 2>/dev/null; then
        echo 'Successfully installed pgvector from contrib packages'
    else
        echo 'pgvector not available from contrib, installing from source...'
        
        # Install build dependencies
        apk add --no-cache git build-base postgresql-dev
        
        # Clone a specific version of pgvector known to work with PostgreSQL 17
        git clone --branch v0.6.0 https://github.com/pgvector/pgvector.git /tmp/pgvector
        
        # Build and install pgvector with JIT disabled to avoid clang dependency
        cd /tmp/pgvector \
        && echo "Disabling JIT in Makefile to avoid clang dependency" \
        && sed -i 's/USE_PGXS=1 clean/USE_PGXS=1 NO_JIT=1 clean/g' Makefile \
        && sed -i 's/USE_PGXS=1 all/USE_PGXS=1 NO_JIT=1 all/g' Makefile \
        && sed -i 's/USE_PGXS=1 install/USE_PGXS=1 NO_JIT=1 install/g' Makefile \
        && make USE_PGXS=1 NO_JIT=1 \
        && make USE_PGXS=1 NO_JIT=1 install
        
        # Create the extension
        psql -U postgres -d $DATABASE -c 'CREATE EXTENSION IF NOT EXISTS vector;'
    fi
    
    echo 'Testing vector extension...'
    psql -U postgres -d $DATABASE -c \"
        CREATE TABLE IF NOT EXISTS vector_test (id SERIAL PRIMARY KEY, embedding vector(3));
        INSERT INTO vector_test (embedding) VALUES ('[1,2,3]');
        SELECT * FROM vector_test;
        DROP TABLE vector_test;
    \"
"

echo "✅ pgvector extension installed successfully in container $CONTAINER for database $DATABASE"