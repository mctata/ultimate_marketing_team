#!/bin/bash
# Compact deployment script for low-bandwidth situations
set -e

PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../" && pwd)
cd "$PROJECT_ROOT"

echo "======== CREATING MINIMAL DEPLOYMENT PACKAGE ========"

# Setup configuration
echo "Setting up configuration..."
./scripts/utilities/manual_setup.sh staging

# Create a reduced deployment archive with essential files only
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

echo "Copying essential files only..."
# Copy only the essential directories and files
mkdir -p $TEMP_DIR/scripts
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
cp -r config/env $TEMP_DIR/config/

# Copy source code
cp -r src $TEMP_DIR/
cp -r migrations $TEMP_DIR/

# Copy essential configuration files
cp requirements.txt $TEMP_DIR/
cp pyproject.toml $TEMP_DIR/
cp alembic.ini $TEMP_DIR/

# Create minimal deployment archive
echo "Creating minimal deployment archive..."
DEPLOY_ARCHIVE="minimal_staging_deploy_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf $DEPLOY_ARCHIVE -C $TEMP_DIR .
echo "Created deployment archive: $DEPLOY_ARCHIVE ($(du -h $DEPLOY_ARCHIVE | cut -f1))"

# Save a copy for reference
mkdir -p deployments/archives/staging
cp $DEPLOY_ARCHIVE deployments/archives/staging/
echo "Saved a copy of the archive to deployments/archives/staging/"

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
    
    echo "Fixing main postgres container..."
    docker exec -i \$(docker ps -q -f name=postgres) bash -c "apk add --no-cache git build-base postgresql-dev && \\
    git clone https://github.com/pgvector/pgvector.git && \\
    cd pgvector && \\
    make && \\
    make install && \\
    psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c 'CREATE EXTENSION IF NOT EXISTS vector;'"
    
    echo "Fixing vector-db container..."
    docker exec -i \$(docker ps -q -f name=vector-db) bash -c "apk add --no-cache git build-base postgresql-dev && \\
    git clone https://github.com/pgvector/pgvector.git && \\
    cd pgvector && \\
    make && \\
    make install && \\
    psql -U \$VECTOR_DB_USER -d \$VECTOR_DB_NAME -c 'CREATE EXTENSION IF NOT EXISTS vector;'"
    
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
rm $DEPLOY_ARCHIVE

echo "✅ Minimal deployment to staging completed!"
echo ""
echo "You can now access your staging environment at:"
echo "https://staging.tangible-studios.com"