#!/bin/bash
# Script to initialize the RDS database with the pgvector extension
set -e

echo "========== RDS DATABASE INITIALIZATION SCRIPT =========="

# Load environment variables from .env.staging
ENV_FILE=".env.staging"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Environment file $ENV_FILE not found"
    exit 1
fi

# Export environment variables
export $(grep -v '^#' $ENV_FILE | xargs)

# Check if required variables are set
if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$POSTGRES_DB" ] || [ -z "$POSTGRES_HOST" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Required: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST"
    exit 1
fi

echo "🔹 Connecting to RDS database: $POSTGRES_HOST"
echo "🔹 Database name: $POSTGRES_DB"
echo "🔹 Username: $POSTGRES_USER"

# Install PostgreSQL client if needed
command -v psql >/dev/null 2>&1 || {
    echo "🔹 Installing PostgreSQL client..."
    apt-get update && apt-get install -y postgresql-client || {
        echo "❌ Failed to install PostgreSQL client"
        exit 1
    }
}

# Function to run SQL commands
run_sql() {
    local sql="$1"
    PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c "$sql"
}

# Test connection
echo "🔹 Testing connection to RDS..."
if ! PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1" > /dev/null 2>&1; then
    echo "❌ Connection to RDS failed"
    exit 1
fi
echo "✅ Connection successful"

# Check if pgvector extension is installed
echo "🔹 Checking for pgvector extension..."
if run_sql "SELECT extname FROM pg_extension WHERE extname = 'vector';" | grep -q "vector"; then
    echo "✅ pgvector extension is already installed"
else
    echo "🔹 Installing pgvector extension..."
    if run_sql "CREATE EXTENSION IF NOT EXISTS vector;"; then
        echo "✅ pgvector extension installed successfully"
    else
        echo "❌ Failed to install pgvector extension"
        echo "You may need to install the extension manually on the RDS instance"
        exit 1
    fi
fi

# Test pgvector functionality
echo "🔹 Testing pgvector functionality..."
run_sql "
    CREATE TABLE IF NOT EXISTS _vector_test (id SERIAL PRIMARY KEY, embedding vector(3));
    INSERT INTO _vector_test (embedding) VALUES ('[1,2,3]');
    SELECT * FROM _vector_test;
    DROP TABLE _vector_test;
"
echo "✅ pgvector functionality test passed"

# Initialize schema if it doesn't exist
echo "🔹 Creating schema if it doesn't exist..."
run_sql "CREATE SCHEMA IF NOT EXISTS umt;"
echo "✅ Schema created or already exists"

echo "✅ RDS database initialization completed successfully"