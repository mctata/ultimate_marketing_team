#!/bin/bash
# Script to connect to the RDS database

set -e  # Exit immediately if a command exits with a non-zero status

# Load environment variables
ENV_FILE=".env.staging"
if [ -f "$ENV_FILE" ]; then
  echo "🔹 Loading environment variables from $ENV_FILE"
  # Use set -a to export all variables
  set -a
  # Source the file with quotes to handle spaces correctly
  source "$ENV_FILE"
  set +a
else
  echo "❌ Environment file $ENV_FILE not found!"
  exit 1
fi

# Install PostgreSQL client if needed
echo "🔹 Checking for PostgreSQL client..."
command -v psql >/dev/null 2>&1 || {
  echo "PostgreSQL client not found. Installing..."
  apt-get update && apt-get install -y postgresql-client
}

echo "🔹 Connecting to RDS database at $POSTGRES_HOST..."
echo "🔹 Database: $POSTGRES_DB"
echo "🔹 User: $POSTGRES_USER"

# Connect to the database
echo "🔹 Starting PostgreSQL client session..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB

echo "✅ Database connection closed!"