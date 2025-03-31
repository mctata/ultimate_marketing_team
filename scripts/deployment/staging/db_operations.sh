#!/bin/bash
# Script to manage the PostgreSQL database in the staging environment
set -e

echo "======== STAGING DATABASE OPERATIONS ========"

# Get the project root directory
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../" && pwd)
cd "$PROJECT_ROOT"

# Load environment variables
DEPLOY_ENV_FILE="config/env/deployment.env.staging"

if [ ! -f "$DEPLOY_ENV_FILE" ]; then
    echo "❌ Error: Deployment configuration file not found at $DEPLOY_ENV_FILE"
    exit 1
fi

# Source the configuration file
source "$DEPLOY_ENV_FILE"

# Check if the SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Error: SSH key file not found at $SSH_KEY"
    
    # Check if the default staging key exists
    DEFAULT_KEY="ultimate-marketing-staging.pem"
    if [ -f "$DEFAULT_KEY" ]; then
        SSH_KEY="$DEFAULT_KEY"
        echo "✅ Using default key: $DEFAULT_KEY"
    else
        echo "Please update the SSH_KEY path in $DEPLOY_ENV_FILE"
        exit 1
    fi
fi

# Set key permissions
chmod 600 "$SSH_KEY"

# Display usage information
display_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Available commands:"
    echo "  status        - Check database status"
    echo "  console       - Open PostgreSQL console"
    echo "  backup        - Create a database backup"
    echo "  migrations    - Check applied migrations"
    echo "  pgvector      - Check pgvector extension status"
    echo "  fix-pgvector  - Fix pgvector extension issues"
    echo "  help          - Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 backup"
}

# If no arguments or help requested, show usage
if [ "$1" == "" ] || [ "$1" == "help" ]; then
    display_usage
    exit 0
fi

# Check SSH connection
echo "Testing SSH connection..."
if ! ssh -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=5 "$SSH_USER@$SSH_HOST" "echo 'Connection successful'" > /dev/null; then
    echo "❌ SSH connection failed"
    exit 1
fi

# Process commands
case "$1" in
    status)
        echo "Checking database status..."
        ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && \
        POSTGRES_CONTAINER=\$(docker ps -q -f name=postgres | head -n 1) && \
        if [ ! -z \"\$POSTGRES_CONTAINER\" ]; then \
            echo 'Database container ID: '\$POSTGRES_CONTAINER && \
            docker exec \$POSTGRES_CONTAINER pg_isready -U postgres && \
            docker exec \$POSTGRES_CONTAINER psql -U postgres -c \"SELECT count(*) FROM pg_stat_activity;\" && \
            docker exec \$POSTGRES_CONTAINER psql -U postgres -c \"SELECT datname FROM pg_database WHERE datistemplate = false;\" && \
            docker exec \$POSTGRES_CONTAINER psql -U postgres -c \"SELECT count(*) FROM pg_extension;\" && \
            echo 'Disk usage:' && \
            docker exec \$POSTGRES_CONTAINER df -h /var/lib/postgresql/data; \
        else \
            echo 'Postgres container not found'; \
        fi"
        ;;
        
    console)
        echo "Opening PostgreSQL console..."
        ssh -t -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && \
        POSTGRES_CONTAINER=\$(docker ps -q -f name=postgres | head -n 1) && \
        if [ ! -z \"\$POSTGRES_CONTAINER\" ]; then \
            docker exec -it \$POSTGRES_CONTAINER psql -U postgres; \
        else \
            echo 'Postgres container not found'; \
        fi"
        ;;
        
    backup)
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_FILE="ultimatemarketing_db_backup_$TIMESTAMP.sql"
        echo "Creating database backup to $BACKUP_FILE..."
        ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && \
        POSTGRES_CONTAINER=\$(docker ps -q -f name=postgres | head -n 1) && \
        if [ ! -z \"\$POSTGRES_CONTAINER\" ]; then \
            docker exec \$POSTGRES_CONTAINER pg_dump -U postgres -d \$POSTGRES_DB > $BACKUP_FILE && \
            echo 'Backup created: $BACKUP_FILE' && \
            echo 'Backup size: '\$(du -h $BACKUP_FILE | cut -f1); \
        else \
            echo 'Postgres container not found'; \
        fi"
        ;;
        
    migrations)
        echo "Checking applied migrations..."
        ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && \
        POSTGRES_CONTAINER=\$(docker ps -q -f name=postgres | head -n 1) && \
        if [ ! -z \"\$POSTGRES_CONTAINER\" ]; then \
            docker exec \$POSTGRES_CONTAINER psql -U postgres -d \$POSTGRES_DB -c \"SELECT version_num, description FROM alembic_version LEFT JOIN alembic_version_history ON alembic_version.version_num = alembic_version_history.version;\"; \
        else \
            echo 'Postgres container not found'; \
        fi"
        ;;
        
    pgvector)
        echo "Checking pgvector extension status..."
        ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && \
        POSTGRES_CONTAINER=\$(docker ps -q -f name=postgres | head -n 1) && \
        VECTOR_DB_CONTAINER=\$(docker ps -q -f name=vector-db | head -n 1) && \
        
        if [ ! -z \"\$POSTGRES_CONTAINER\" ]; then \
            echo 'Main PostgreSQL container:' && \
            docker exec \$POSTGRES_CONTAINER psql -U postgres -d \$POSTGRES_DB -c \"SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';\" && \
            echo 'Testing vector functionality:' && \
            docker exec \$POSTGRES_CONTAINER psql -U postgres -d \$POSTGRES_DB -c \"CREATE TABLE IF NOT EXISTS _vector_test (id SERIAL PRIMARY KEY, embedding vector(3)); INSERT INTO _vector_test (embedding) VALUES ('[1,2,3]'); SELECT * FROM _vector_test; DROP TABLE _vector_test;\"; \
        else \
            echo 'Postgres container not found'; \
        fi && \
        
        if [ ! -z \"\$VECTOR_DB_CONTAINER\" ]; then \
            echo 'Vector DB container:' && \
            docker exec \$VECTOR_DB_CONTAINER psql -U postgres -d \$VECTOR_DB_NAME -c \"SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';\" && \
            echo 'Testing vector functionality:' && \
            docker exec \$VECTOR_DB_CONTAINER psql -U postgres -d \$VECTOR_DB_NAME -c \"CREATE TABLE IF NOT EXISTS _vector_test (id SERIAL PRIMARY KEY, embedding vector(3)); INSERT INTO _vector_test (embedding) VALUES ('[1,2,3]'); SELECT * FROM _vector_test; DROP TABLE _vector_test;\"; \
        else \
            echo 'Vector DB container not found'; \
        fi"
        ;;
        
    fix-pgvector)
        echo "Fixing pgvector extension..."
        ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && \
        chmod +x ./scripts/deployment/fix_pgvector.sh && \
        ./scripts/deployment/fix_pgvector.sh"
        ;;
        
    *)
        echo "❌ Unknown command: $1"
        display_usage
        exit 1
        ;;
esac

echo "✅ Operation completed successfully!"