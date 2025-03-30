#!/bin/bash
# Fix pgvector extension installation for PostgreSQL containers
set -e

echo "========== Fixing pgvector extension for PostgreSQL containers =========="

# Get postgres container ID
POSTGRES_CONTAINER=$(docker ps -q -f name=postgres | head -n 1)
VECTOR_DB_CONTAINER=$(docker ps -q -f name=vector-db | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "Error: Postgres container not found"
    exit 1
fi

echo "1. Installing pgvector in main postgres container..."
docker exec -i $POSTGRES_CONTAINER bash -c "
    echo 'Installing build dependencies...'
    apk add --no-cache git build-base postgresql-dev

    echo 'Cloning pgvector repository...'
    git clone https://github.com/pgvector/pgvector.git /tmp/pgvector

    echo 'Building and installing pgvector...'
    cd /tmp/pgvector && make && make install

    echo 'Creating vector extension...'
    psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c 'CREATE EXTENSION IF NOT EXISTS vector;' || echo 'Failed to create extension'
    
    echo 'Testing vector extension...'
    psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"
        CREATE TABLE IF NOT EXISTS vector_test (id SERIAL PRIMARY KEY, embedding vector(3));
        INSERT INTO vector_test (embedding) VALUES ('[1,2,3]');
        SELECT * FROM vector_test;
        DROP TABLE vector_test;
    \" || echo 'Vector extension test failed'
"

if [ ! -z "$VECTOR_DB_CONTAINER" ]; then
    echo "2. Installing pgvector in vector-db container..."
    docker exec -i $VECTOR_DB_CONTAINER bash -c "
        echo 'Installing build dependencies...'
        apk add --no-cache git build-base postgresql-dev

        echo 'Cloning pgvector repository...'
        git clone https://github.com/pgvector/pgvector.git /tmp/pgvector

        echo 'Building and installing pgvector...'
        cd /tmp/pgvector && make && make install

        echo 'Creating vector extension...'
        psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c 'CREATE EXTENSION IF NOT EXISTS vector;' || echo 'Failed to create extension'
        
        echo 'Testing vector extension...'
        psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"
            CREATE TABLE IF NOT EXISTS vector_test (id SERIAL PRIMARY KEY, embedding vector(3));
            INSERT INTO vector_test (embedding) VALUES ('[1,2,3]');
            SELECT * FROM vector_test;
            DROP TABLE vector_test;
        \" || echo 'Vector extension test failed'
    "
else
    echo "Vector DB container not found, skipping..."
fi

echo "pgvector extension fix completed!"