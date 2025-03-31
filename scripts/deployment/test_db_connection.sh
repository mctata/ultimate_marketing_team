#!/bin/bash
# Test direct connection to the database

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

echo "🔹 Testing connection to PostgreSQL at $POSTGRES_HOST:$POSTGRES_PORT"
echo "🔹 Database: $POSTGRES_DB"
echo "🔹 User: $POSTGRES_USER"

# Test connection only - don't execute any SQL
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;" -o /dev/null && echo "✅ Connection successful!" || echo "❌ Connection failed"