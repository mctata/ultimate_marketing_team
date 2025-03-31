#!/bin/bash
# Simple script to connect to the staging PostgreSQL database
set -e

# Configuration with defaults
SSH_USER=ubuntu
SSH_HOST=ec2-44-202-29-233.compute-1.amazonaws.com
SSH_PORT=22
REMOTE_DIR=/home/ubuntu/ultimate-marketing-team
SSH_KEY="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/ultimate-marketing-staging.pem"

# Set SSH key permissions
chmod 600 "$SSH_KEY"

# Parse arguments
DB_NAME="ultimatemarketing_db"
if [ "$1" == "vector" ]; then
  DB_NAME="umt_vector_db"
  echo "Connecting to vector database ($DB_NAME)..."
elif [ "$1" == "help" ] || [ "$1" == "--help" ]; then
  echo "Usage: $0 [main|vector]"
  echo ""
  echo "Options:"
  echo "  main       Connect to main PostgreSQL database (default)"
  echo "  vector     Connect to vector database"
  echo "  help       Show this help message"
  exit 0
else
  echo "Connecting to main database ($DB_NAME)..."
fi

# Test connection
echo "Testing connection to $SSH_HOST..."
if ! ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=5 -o BatchMode=yes "$SSH_USER@$SSH_HOST" "echo Connection successful" 2>/dev/null; then
  echo "❌ Connection to $SSH_USER@$SSH_HOST failed. Please check your SSH credentials and network."
  exit 1
fi

# Connect to PostgreSQL
echo "Opening PostgreSQL console..."
if [ "$DB_NAME" == "ultimatemarketing_db" ]; then
  SERVICE="postgres"
else
  SERVICE="vector-db"
fi

ssh -t -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && \
  CONTAINER=\$(docker ps -q -f name=$SERVICE | head -n 1) && \
  if [ ! -z \"\$CONTAINER\" ]; then \
    docker exec -it \$CONTAINER psql -U postgres -d $DB_NAME; \
  else \
    echo '❌ $SERVICE container not running'; \
    exit 1; \
  fi"

echo "Database connection closed."