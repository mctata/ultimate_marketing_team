#!/bin/bash
# Script to fix pgvector installation and then remove itself
set -e

ENV=${1:-"staging"}
CONFIG_DIR="config/env"
DEPLOYMENT_CONFIG="${CONFIG_DIR}/deployment.env.${ENV}"
SCRIPT_PATH=$(realpath "$0")

echo "🔧 Starting pgvector fix and cleanup process..."

# Source environment file
if [ -f "$DEPLOYMENT_CONFIG" ]; then
    source "$DEPLOYMENT_CONFIG"
else
    echo "Configuration file not found: $DEPLOYMENT_CONFIG"
    echo "Please run ./scripts/utilities/manual_setup.sh $ENV first"
    exit 1
fi

# Check if deployment is local or remote
if [ "$SSH_HOST" == "localhost" ]; then
    echo "📌 Fixing pgvector for local PostgreSQL containers..."
    
    # Fix main postgres container
    echo "Fixing main postgres container..."
    docker exec -it $(docker ps -q -f name=postgres) bash -c "apk add --no-cache git build-base postgresql-dev && \
    git clone https://github.com/pgvector/pgvector.git && \
    cd pgvector && \
    make && \
    make install && \
    psql -U $POSTGRES_USER -d $POSTGRES_DB -c 'CREATE EXTENSION IF NOT EXISTS vector;'"
    
    # Fix vector-db container
    echo "Fixing vector-db container..."
    docker exec -it $(docker ps -q -f name=vector-db) bash -c "apk add --no-cache git build-base postgresql-dev && \
    git clone https://github.com/pgvector/pgvector.git && \
    cd pgvector && \
    make && \
    make install && \
    psql -U $VECTOR_DB_USER -d $VECTOR_DB_NAME -c 'CREATE EXTENSION IF NOT EXISTS vector;'"
    
else
    echo "📌 Fixing pgvector for remote PostgreSQL containers on $SSH_HOST..."
    
    # SSH to server and fix postgres containers
    ssh -i $SSH_KEY $SSH_USER@$SSH_HOST << EOF
        cd $REMOTE_DIR
        
        # Source environment variables
        set -a
        source .env
        set +a
        
        echo "Fixing main postgres container..."
        docker exec -it \$(docker ps -q -f name=postgres) bash -c "apk add --no-cache git build-base postgresql-dev && \\
        git clone https://github.com/pgvector/pgvector.git && \\
        cd pgvector && \\
        make && \\
        make install && \\
        psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c 'CREATE EXTENSION IF NOT EXISTS vector;'"
        
        echo "Fixing vector-db container..."
        docker exec -it \$(docker ps -q -f name=vector-db) bash -c "apk add --no-cache git build-base postgresql-dev && \\
        git clone https://github.com/pgvector/pgvector.git && \\
        cd pgvector && \\
        make && \\
        make install && \\
        psql -U \$VECTOR_DB_USER -d \$VECTOR_DB_NAME -c 'CREATE EXTENSION IF NOT EXISTS vector;'"
EOF
fi

echo "✅ pgvector fix completed!"

# Now update the docker-compose.yml to include proper installation commands
FIX_SCRIPT_PATH="scripts/fix_pgvector.sh"
if [ -f "$FIX_SCRIPT_PATH" ]; then
    echo "Removing fix script: $FIX_SCRIPT_PATH"
    rm -f "$FIX_SCRIPT_PATH"
fi

# Remove this script
echo "Removing this script: $SCRIPT_PATH"
chmod +w "$SCRIPT_PATH"
rm -f "$SCRIPT_PATH"

echo "🧹 Cleanup completed. The pgvector fix has been applied and temporary scripts have been removed."