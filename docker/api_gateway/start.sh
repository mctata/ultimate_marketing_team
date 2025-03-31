#!/bin/bash
set -e

# Configuration
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-umt}
MAX_RETRIES=${MAX_RETRIES:-60}
RETRY_INTERVAL=${RETRY_INTERVAL:-2}
SCHEMA_NAME=${SCHEMA_NAME:-umt}

echo "Starting API gateway with database at ${DB_HOST}:${DB_PORT}..."

# Wait for the database to be available with a clearer message format
counter=0
echo "Waiting for database to be ready..."

while ! pg_isready -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -t 1 > /dev/null 2>&1; do
    counter=$((counter+1))
    if [ $counter -ge $MAX_RETRIES ]; then
        echo "⚠️ Database connection failed after $MAX_RETRIES attempts."
        echo "The API will start but database functionality will be limited."
        echo "Use the database health check endpoint to monitor connectivity."
        echo "Once database is available, restart the API container."
        break
    fi
    echo "Waiting for database connection (attempt $counter/$MAX_RETRIES)..."
    sleep $RETRY_INTERVAL
done

if [ $counter -lt $MAX_RETRIES ]; then
    echo "✅ Database is available!"
    
    # Ensure schema exists
    echo "Checking if schema '${SCHEMA_NAME}' exists..."
    PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "CREATE SCHEMA IF NOT EXISTS ${SCHEMA_NAME};" || echo "Could not create schema, but continuing..."
    
    # Run database migrations if enabled
    if [ "$RUN_MIGRATIONS" = "true" ]; then
        echo "Running database migrations..."
        cd /app
        for attempt in {1..3}; do
            echo "Migration attempt $attempt/3..."
            if python -m alembic upgrade head; then
                echo "✅ Migrations completed successfully!"
                break
            else
                echo "⚠️ Migration attempt $attempt failed."
                if [ $attempt -eq 3 ]; then
                    echo "⚠️ All migration attempts failed. API may not function correctly."
                else
                    echo "Retrying in 5 seconds..."
                    sleep 5
                fi
            fi
        done
    else
        echo "Database migrations are disabled. Skipping."
    fi
else
    echo "Will periodically retry connecting to the database in the background..."
    # Start a background process to periodically try to connect
    (
        while true; do
            if pg_isready -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -t 1 > /dev/null 2>&1; then
                echo "✅ Database is now available. Please restart the API container."
                break
            fi
            sleep 30
        done
    ) &
fi

# Start the appropriate API
if [ "$USE_SIMPLIFIED_API" = "true" ]; then
    echo "Starting simplified API gateway..."
    exec uvicorn staging_main:app --host 0.0.0.0 --port 8000
else
    echo "Starting standard API gateway..."
    exec uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'
fi
