#!/bin/bash
# Script to verify and fix pgvector extension in PostgreSQL
set -e

DB_NAME="${1:-postgres}"
LOG_FILE="/var/lib/postgresql/data/pgvector_install.log"

echo "$(date) - Verifying pgvector extension in database $DB_NAME" | tee -a "$LOG_FILE"

# Check if pgvector is already installed and working
if psql -U postgres -d "$DB_NAME" -c "SELECT count(*) FROM pg_extension WHERE extname = 'vector';" | grep -q 1; then
    echo "pgvector extension is already installed" | tee -a "$LOG_FILE"
    
    # Test if it works properly
    if psql -U postgres -d "$DB_NAME" -c "CREATE TABLE IF NOT EXISTS _vector_test (id SERIAL PRIMARY KEY, embedding vector(3)); 
        INSERT INTO _vector_test (embedding) VALUES ('[1,2,3]'); 
        SELECT * FROM _vector_test; 
        DROP TABLE _vector_test;" > /dev/null 2>&1; then
        echo "✓ pgvector extension is functioning correctly" | tee -a "$LOG_FILE"
        exit 0
    else
        echo "! pgvector extension is installed but not functioning correctly" | tee -a "$LOG_FILE"
    fi
fi

echo "Installing pgvector extension in database $DB_NAME..." | tee -a "$LOG_FILE"

# Try to create the extension
if psql -U postgres -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS vector;" > /dev/null 2>&1; then
    echo "✓ Successfully created vector extension" | tee -a "$LOG_FILE"
else
    echo "! Failed to create vector extension, attempting to install from source..." | tee -a "$LOG_FILE"
    
    # Install build dependencies if needed
    echo "Installing build dependencies..." | tee -a "$LOG_FILE"
    apk add --no-cache git build-base postgresql-dev clang llvm 2>&1 | tee -a "$LOG_FILE"
    
    # Clone and build pgvector
    echo "Building pgvector from source..." | tee -a "$LOG_FILE"
    cd /tmp
    git clone --branch v0.6.0 https://github.com/pgvector/pgvector.git 2>&1 | tee -a "$LOG_FILE"
    cd pgvector
    
    # Try standard build first
    if make USE_PGXS=1 2>&1 | tee -a "$LOG_FILE"; then
        echo "Standard build successful" | tee -a "$LOG_FILE"
    else
        echo "Standard build failed, trying with JIT disabled" | tee -a "$LOG_FILE"
        sed -i 's/USE_PGXS=1 clean/USE_PGXS=1 NO_JIT=1 clean/g' Makefile
        sed -i 's/USE_PGXS=1 all/USE_PGXS=1 NO_JIT=1 all/g' Makefile
        sed -i 's/USE_PGXS=1 install/USE_PGXS=1 NO_JIT=1 install/g' Makefile
        make USE_PGXS=1 NO_JIT=1 2>&1 | tee -a "$LOG_FILE"
    fi
    
    make USE_PGXS=1 install 2>&1 | tee -a "$LOG_FILE"
    
    # Try to create the extension again
    if psql -U postgres -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>&1 | tee -a "$LOG_FILE"; then
        echo "✓ Successfully created vector extension after source installation" | tee -a "$LOG_FILE"
    else
        echo "✗ Failed to create vector extension even after source installation" | tee -a "$LOG_FILE"
        exit 1
    fi
    
    # Clean up
    cd /
    rm -rf /tmp/pgvector
fi

# Test if it works
echo "Testing pgvector functionality..." | tee -a "$LOG_FILE"
if psql -U postgres -d "$DB_NAME" -c "
    CREATE TABLE IF NOT EXISTS _vector_test (id SERIAL PRIMARY KEY, embedding vector(3));
    INSERT INTO _vector_test (embedding) VALUES ('[1,2,3]');
    SELECT * FROM _vector_test;
    DROP TABLE _vector_test;
" 2>&1 | tee -a "$LOG_FILE"; then
    echo "✓ pgvector extension is functioning correctly" | tee -a "$LOG_FILE"
else
    echo "✗ pgvector extension installation verification failed" | tee -a "$LOG_FILE"
    exit 1
fi

echo "pgvector extension installation and verification completed successfully" | tee -a "$LOG_FILE"
exit 0