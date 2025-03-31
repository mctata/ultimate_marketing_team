#!/bin/bash
# Script to initialize the RDS database with the pgvector extension

echo "========== RDS DATABASE INITIALIZATION SCRIPT =========="

# Load environment variables
ENV_FILE=".env.staging"
if [ -f "$ENV_FILE" ]; then
  echo "Loading environment variables from $ENV_FILE"
  export $(grep -v '^#' $ENV_FILE | xargs)
else
  echo "Environment file $ENV_FILE not found!"
  exit 1
fi

# Install PostgreSQL client if needed
echo "Checking for PostgreSQL client..."
command -v psql >/dev/null 2>&1 || {
  echo "PostgreSQL client not found. Installing..."
  apt-get update && apt-get install -y postgresql-client
}

# Test connection
echo "Testing connection to RDS instance at $POSTGRES_HOST..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT version();" || {
  echo "Failed to connect to PostgreSQL. Check your credentials and network settings."
  exit 1
}

# Check if pgvector is already installed
echo "Checking if pgvector extension is already installed..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';" || {
  echo "Error checking for pgvector extension."
  exit 1
}

# Install pgvector extension if needed
echo "Installing pgvector extension..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c "CREATE EXTENSION IF NOT EXISTS vector;" || {
  echo "Failed to create pgvector extension. Make sure it's available on your RDS instance."
  exit 1
}

# Verify installation
echo "Verifying pgvector installation..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';" || {
  echo "Error verifying pgvector installation."
  exit 1
}

echo "Vector extension is installed and ready to use!"

# Create schema if it doesn't exist
echo "Creating schema umt if it doesn't exist..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c "CREATE SCHEMA IF NOT EXISTS umt;" || {
  echo "Error creating schema."
  exit 1
}

# Check for existing tables
echo "Checking for existing tables in schema..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'umt';" || {
  echo "Error checking for existing tables."
  exit 1
}

echo "========== DATABASE INITIALIZATION COMPLETE =========="