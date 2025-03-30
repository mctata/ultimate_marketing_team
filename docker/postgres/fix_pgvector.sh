#!/bin/bash
# Script to manually install pgvector in PostgreSQL container
# Usage: ./fix_pgvector.sh [container_name] [database_name]

set -e

# Default values
CONTAINER=${1:-"postgres"}
DATABASE=${2:-"umt_db"}

echo "Installing pgvector extension in container $CONTAINER for database $DATABASE..."

docker exec -i $CONTAINER bash -c "
    echo 'Installing build dependencies...'
    apk add --no-cache git build-base postgresql-dev

    echo 'Cloning pgvector repository...'
    git clone https://github.com/pgvector/pgvector.git /tmp/pgvector

    echo 'Building and installing pgvector...'
    cd /tmp/pgvector && make && make install

    echo 'Creating vector extension...'
    psql -U postgres -d $DATABASE -c 'CREATE EXTENSION IF NOT EXISTS vector;'
    
    echo 'Testing vector extension...'
    psql -U postgres -d $DATABASE -c \"
        CREATE TABLE IF NOT EXISTS vector_test (id SERIAL PRIMARY KEY, embedding vector(3));
        INSERT INTO vector_test (embedding) VALUES ('[1,2,3]');
        SELECT * FROM vector_test;
        DROP TABLE vector_test;
    \"
"

echo "✅ pgvector extension installed successfully in container $CONTAINER for database $DATABASE"