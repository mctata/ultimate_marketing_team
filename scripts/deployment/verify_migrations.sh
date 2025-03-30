#!/bin/bash
# Verify database migrations are properly applied
set -e

# Default to staging if no environment is specified
DEPLOY_ENV=${1:-"staging"}
echo "Verifying database migrations for $DEPLOY_ENV environment..."

# Load environment-specific configuration
ENV_FILE="config/env/deployment.env.$DEPLOY_ENV"
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file $ENV_FILE not found."
    exit 1
fi

# Source the configuration file
source "$ENV_FILE"

# Verify SSH connection
if ssh -i $SSH_KEY $SSH_USER@$SSH_HOST "echo Connected successfully"; then
    echo "✅ SSH connection successful"
else
    echo "❌ SSH connection failed"
    exit 1
fi

# Check if database tables exist
echo "Checking database schema..."
DB_CHECK=$(ssh -i $SSH_KEY $SSH_USER@$SSH_HOST "
    cd $REMOTE_DIR && 
    POSTGRES_CONTAINER=\$(docker ps -q -f name=postgres | head -n 1) &&
    if [ ! -z \"\$POSTGRES_CONTAINER\" ]; then
        docker exec \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"
            SELECT count(*) FROM information_schema.tables 
            WHERE table_schema = 'public';
        \"
    else
        echo 'Postgres container not found'
    fi
")

if echo "$DB_CHECK" | grep -q "[1-9][0-9]*"; then
    TABLE_COUNT=$(echo "$DB_CHECK" | grep -o "[0-9]*" | head -1)
    echo "✅ Database has $TABLE_COUNT tables"
else
    echo "❌ Database schema check failed or no tables found"
    exit 1
fi

# Check alembic version
echo "Checking alembic version..."
ALEMBIC_VERSION=$(ssh -i $SSH_KEY $SSH_USER@$SSH_HOST "
    cd $REMOTE_DIR && 
    POSTGRES_CONTAINER=\$(docker ps -q -f name=postgres | head -n 1) &&
    if [ ! -z \"\$POSTGRES_CONTAINER\" ]; then
        docker exec \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"
            SELECT version_num FROM alembic_version;
        \"
    else
        echo 'Postgres container not found'
    fi
")

if echo "$ALEMBIC_VERSION" | grep -q "[a-f0-9]"; then
    VERSION=$(echo "$ALEMBIC_VERSION" | grep -o "[a-f0-9]*" | head -1)
    echo "✅ Alembic version is $VERSION"
else
    echo "❌ Alembic version check failed or no version found"
    exit 1
fi

# Run a test query to check essential tables
echo "Testing essential tables..."
TABLES_CHECK=$(ssh -i $SSH_KEY $SSH_USER@$SSH_HOST "
    cd $REMOTE_DIR && 
    POSTGRES_CONTAINER=\$(docker ps -q -f name=postgres | head -n 1) &&
    if [ ! -z \"\$POSTGRES_CONTAINER\" ]; then
        docker exec \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"
            SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users');
            SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'templates');
            SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'brands');
        \"
    else
        echo 'Postgres container not found'
    fi
")

if echo "$TABLES_CHECK" | grep -q "t.*t.*t"; then
    echo "✅ Essential tables exist in the database"
else
    echo "❌ One or more essential tables are missing"
    echo "$TABLES_CHECK"
    exit 1
fi

echo "✅ Database migrations verification completed successfully"