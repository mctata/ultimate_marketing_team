#!/bin/bash
# Script to safely run database migrations in staging environment

set -e

echo "======== RUNNING DATABASE MIGRATIONS FOR STAGING ========"

# Get the project root directory
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
cd "$PROJECT_ROOT"

# Load environment variables
DEPLOY_ENV_FILE="config/env/deployment.env.staging"

if [ -f "$DEPLOY_ENV_FILE" ]; then
    echo "Loading environment variables from $DEPLOY_ENV_FILE"
    source "$DEPLOY_ENV_FILE"
fi

# Ensure DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Create a backup before proceeding
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="staging_db_backup_$TIMESTAMP.sql"
echo "Creating database backup to $BACKUP_FILE..."

# Extract database connection details from DATABASE_URL
if [[ $DATABASE_URL =~ postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
    
    # Backup the database
    PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_FILE"
    echo "Backup created: $BACKUP_FILE"
else
    echo "WARNING: Could not parse DATABASE_URL for backup. Proceeding without backup."
fi

# Run pre-migration checks
echo "Running pre-migration validation checks..."
python scripts/database/pre_migration_check.py

if [ $? -ne 0 ]; then
    echo "WARNING: Pre-migration checks reported issues. Review the output above."
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Migration aborted."
        exit 1
    fi
fi

# Set max retry attempts
MAX_RETRIES=3
RETRY_DELAY=5

# Run the migrations with retry logic
for i in $(seq 1 $MAX_RETRIES); do
    echo "Attempt $i/$MAX_RETRIES: Running database migrations..."
    
    if python -m alembic upgrade head; then
        echo "✅ Database migrations completed successfully!"
        break
    else
        if [ $i -eq $MAX_RETRIES ]; then
            echo "❌ All migration attempts failed. Please check the logs."
            
            # Offer to restore the backup
            if [ -f "$BACKUP_FILE" ]; then
                read -p "Do you want to restore the database from the backup? (y/n) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    echo "Restoring database from backup..."
                    PGPASSWORD="$DB_PASSWORD" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$BACKUP_FILE"
                    echo "Database restored to pre-migration state."
                fi
            fi
            
            exit 1
        else
            echo "Migration failed. Retrying in $RETRY_DELAY seconds..."
            sleep $RETRY_DELAY
        fi
    fi
done

# Verify migrations were applied correctly
echo "Verifying migration status..."
python -m alembic current

echo "======== MIGRATION PROCESS COMPLETED ========"
