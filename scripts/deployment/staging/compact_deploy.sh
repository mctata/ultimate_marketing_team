#!/bin/bash
# Compact deployment script for low-bandwidth situations
set -e

PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../" && pwd)
cd "$PROJECT_ROOT"

echo "======== CREATING MINIMAL DEPLOYMENT PACKAGE ========"

# Setup configuration if env files don't exist
CONFIG_ENV_FILE="config/env/.env.staging"
DEPLOY_ENV_FILE="config/env/deployment.env.staging"

if [ -f "$CONFIG_ENV_FILE" ] && [ -f "$DEPLOY_ENV_FILE" ]; then
    echo "Configuration files already exist. Skipping setup..."
else
    echo "Setting up configuration..."
    ./scripts/utilities/manual_setup.sh staging
fi

# Create a reduced deployment archive with essential files only
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

echo "Copying essential files only..."
# Copy only the essential directories and files
mkdir -p $TEMP_DIR/scripts/deployment
mkdir -p $TEMP_DIR/scripts/utilities
mkdir -p $TEMP_DIR/src
mkdir -p $TEMP_DIR/docker
mkdir -p $TEMP_DIR/migrations
mkdir -p $TEMP_DIR/config/env

# Copy essential docker files
cp docker-compose.staging.yml $TEMP_DIR/
cp -r docker/api_gateway $TEMP_DIR/docker/
cp -r docker/frontend $TEMP_DIR/docker/
cp -r docker/agents $TEMP_DIR/docker/
cp -r docker/migrations $TEMP_DIR/docker/
cp -r docker/postgres $TEMP_DIR/docker/

# Copy env files
cp config/env/.env.staging $TEMP_DIR/.env
mkdir -p $TEMP_DIR/frontend
if [ -f "frontend/.env.staging" ]; then
    cp frontend/.env.staging $TEMP_DIR/frontend/.env.staging
else
    echo "Warning: frontend/.env.staging not found, creating empty file..."
    touch $TEMP_DIR/frontend/.env.staging
fi
cp -r config/env $TEMP_DIR/config/

# Copy source code
cp -r src $TEMP_DIR/
cp -r migrations $TEMP_DIR/

# Copy deployment scripts
cp -r scripts/deployment/* $TEMP_DIR/scripts/deployment/
cp -r scripts/utilities/manual_setup.sh $TEMP_DIR/scripts/utilities/

# Copy essential configuration files
cp requirements.txt $TEMP_DIR/
cp pyproject.toml $TEMP_DIR/
cp alembic.ini $TEMP_DIR/

# Create minimal deployment archive
echo "Creating minimal deployment archive..."
mkdir -p deployments/archives/staging
DEPLOY_ARCHIVE="deployments/archives/staging/minimal_staging_deploy_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf $DEPLOY_ARCHIVE -C $TEMP_DIR .
echo "Created deployment archive: $DEPLOY_ARCHIVE ($(du -h $DEPLOY_ARCHIVE | cut -f1))"

# Upload
echo "Uploading minimal archive to server..."
scp -i ultimate-marketing-staging.pem $DEPLOY_ARCHIVE ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com:/tmp/

# Remote deploy
echo "Deploying on server..."
ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com << EOF
    set -e
    echo "Connected to the server..."
    
    # Create directory if it doesn't exist
    mkdir -p /home/ubuntu/ultimate-marketing-team
    
    # Extract files
    echo "Extracting minimal deployment archive..."
    tar -xzf /tmp/$DEPLOY_ARCHIVE -C /home/ubuntu/ultimate-marketing-team
    
    # Navigate to the project directory
    cd /home/ubuntu/ultimate-marketing-team
    
    # Make scripts executable
    find scripts -type f -name "*.sh" -exec chmod +x {} \;
    
    # Run docker-compose
    echo "Starting Docker containers..."
    docker-compose -f docker-compose.staging.yml down
    docker-compose -f docker-compose.staging.yml up -d
    
    # Fix pgvector extension
    echo "Fixing pgvector extension..."
    # Source environment variables
    set -a
    source .env
    set +a
    
    echo "Installing pgvector in PostgreSQL containers..."
    # Get container IDs
    POSTGRES_CONTAINER=$(docker ps -q -f name=postgres | head -n 1)
    VECTOR_DB_CONTAINER=$(docker ps -q -f name=vector-db | head -n 1)
    
    if [ ! -z "$POSTGRES_CONTAINER" ]; then
        echo "Fixing main postgres container..."
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
    else
        echo "Warning: Main postgres container not found"
    fi
    
    if [ ! -z "$VECTOR_DB_CONTAINER" ]; then
        echo "Fixing vector-db container..."
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
        echo "Warning: Vector DB container not found, skipping..."
    fi
    
    # Restart to apply changes
    echo "Restarting services..."
    docker-compose -f docker-compose.staging.yml restart
    
    # Clean up
    echo "Cleaning up..."
    rm /tmp/$DEPLOY_ARCHIVE
    
    echo "Deployment completed successfully!"
EOF

# Clean up local temporary files
echo "Cleaning up local temporary files..."
rm -rf $TEMP_DIR
# Note: Not removing the archive as it's now stored in the proper location

echo "✅ Minimal deployment to staging completed!"
echo ""
echo "You can now access your staging environment at:"
echo "https://staging.tangible-studios.com"