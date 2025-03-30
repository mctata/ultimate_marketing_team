#!/bin/bash
# Verify that the deployment was successful
set -e

# Default to staging if no environment is specified
DEPLOY_ENV=${1:-"staging"}
echo "Verifying deployment for $DEPLOY_ENV environment..."

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

# Check docker container status
echo "Verifying Docker containers..."
CONTAINERS=$(ssh -i $SSH_KEY $SSH_USER@$SSH_HOST "cd $REMOTE_DIR && docker-compose -f $COMPOSE_FILE ps -q")

if [ -z "$CONTAINERS" ]; then
    echo "❌ No containers running for the application"
    exit 1
else
    CONTAINER_COUNT=$(echo "$CONTAINERS" | wc -l)
    echo "✅ Found $CONTAINER_COUNT containers running"
fi

# Check if services are healthy
echo "Checking container status..."
UNHEALTHY=$(ssh -i $SSH_KEY $SSH_USER@$SSH_HOST "cd $REMOTE_DIR && docker-compose -f $COMPOSE_FILE ps | grep -v 'running' | grep -v 'NAME' | grep -v 'migration'")

if [ -n "$UNHEALTHY" ]; then
    echo "❌ Some containers are not running:"
    echo "$UNHEALTHY"
    exit 1
else
    echo "✅ All required containers are running"
fi

# Check if pgvector extension is installed
echo "Verifying pgvector extension installation..."
PGVECTOR_STATUS=$(ssh -i $SSH_KEY $SSH_USER@$SSH_HOST "
    cd $REMOTE_DIR && 
    POSTGRES_CONTAINER=\$(docker ps -q -f name=postgres | head -n 1) &&
    if [ ! -z \"\$POSTGRES_CONTAINER\" ]; then
        docker exec \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT * FROM pg_extension WHERE extname = 'vector';\"
    else
        echo 'Postgres container not found'
    fi
")

if echo "$PGVECTOR_STATUS" | grep -q "vector"; then
    echo "✅ pgvector extension is installed"
else
    echo "❌ pgvector extension is not properly installed"
    exit 1
fi

# Check API health endpoint
echo "Checking API health endpoint..."
API_HEALTH=$(ssh -i $SSH_KEY $SSH_USER@$SSH_HOST "
    cd $REMOTE_DIR && 
    curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health || echo 'failed'
")

if [ "$API_HEALTH" == "200" ]; then
    echo "✅ API health endpoint is responding correctly"
else
    echo "❌ API health endpoint is not responding (status: $API_HEALTH)"
    exit 1
fi

# Check frontend
echo "Checking frontend service..."
FRONTEND_STATUS=$(ssh -i $SSH_KEY $SSH_USER@$SSH_HOST "
    cd $REMOTE_DIR && 
    docker ps --filter name=frontend --format '{{.Status}}' | grep -i 'up'
")

if [ -n "$FRONTEND_STATUS" ]; then
    echo "✅ Frontend service is running"
else
    echo "❌ Frontend service is not running properly"
    exit 1
fi

echo "✅ Deployment verification complete. The application is running correctly."