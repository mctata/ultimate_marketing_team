#!/bin/bash
# Test SSH connection to staging environment before deployment

set -e

echo "Testing SSH connection to staging server..."

# Configuration
SSH_USER=${SSH_USER:-"tangible-studios.com"}
SSH_HOST=${SSH_HOST:-"ssh.tangible-studios.com"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/customers/8/2/5/tangible-studios.com/httpd.www/staging"}
SSH_KEY=${SSH_KEY:-"~/.ssh/id_rsa"}

# Check if SSH credentials are provided
if [[ "$SSH_USER" == "your_ssh_user" ]]; then
    echo "Error: SSH_USER not set. Run with SSH_USER=username SSH_HOST=hostname ./scripts/deployment/test_connection.sh"
    exit 1
fi

echo "Testing connection to $SSH_USER@$SSH_HOST:$REMOTE_DIR..."

# Test SSH connection
if ssh -p $SSH_PORT -i $SSH_KEY -o BatchMode=yes -o ConnectTimeout=5 $SSH_USER@$SSH_HOST echo "SSH connection successful"; then
    echo "✅ SSH connection test passed"
else
    echo "❌ SSH connection test failed. Please verify your SSH credentials and try again."
    exit 1
fi

# Test write permissions
echo "Testing write permissions to remote directory..."
if ssh -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST "mkdir -p $REMOTE_DIR && touch $REMOTE_DIR/test_write_permission && rm $REMOTE_DIR/test_write_permission"; then
    echo "✅ Write permission test passed"
else
    echo "❌ Write permission test failed. Please verify your directory permissions."
    exit 1
fi

# Test Docker and Docker Compose availability
echo "Checking if Docker and Docker Compose are installed on the remote server..."
if ssh -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST "command -v docker && command -v docker-compose"; then
    echo "✅ Docker and Docker Compose are available"
else
    echo "❌ Docker and/or Docker Compose not available on the remote server."
    exit 1
fi

# Test PostgreSQL Vector Extension compatibility 
echo "Testing if ankane/pgvector image is available..."
if docker pull ankane/pgvector:latest >/dev/null 2>&1; then
    echo "✅ ankane/pgvector image available"
else
    echo "❌ Failed to pull ankane/pgvector image. Check Docker Hub or your internet connection."
    exit 1
fi

# Test if we can start a temporary PostgreSQL container
echo "Testing PostgreSQL vector extension initialization..."
docker run --name pg_vector_test -e POSTGRES_PASSWORD=postgres -d ankane/pgvector:latest >/dev/null 2>&1
sleep 5  # Give the container time to start

# Test if vector extension is available
if docker exec pg_vector_test psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS vector;" >/dev/null 2>&1; then
    echo "✅ PostgreSQL vector extension installation successful"
else
    echo "❌ Failed to create vector extension in PostgreSQL container"
    docker rm -f pg_vector_test >/dev/null 2>&1
    exit 1
fi

# Clean up test container
docker rm -f pg_vector_test >/dev/null 2>&1

echo "All connection tests passed! You can now proceed with the deployment."