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
    echo "   Installing pgvector extension..."
    
    INSTALL_RESULT=$(ssh -i $SSH_KEY $SSH_USER@$SSH_HOST "
        cd $REMOTE_DIR && 
        POSTGRES_CONTAINER=\$(docker ps -q -f name=postgres | head -n 1) &&
        if [ ! -z \"\$POSTGRES_CONTAINER\" ]; then
            docker exec -i \$POSTGRES_CONTAINER bash -c \"
                apk add --no-cache git build-base postgresql-dev
                git clone https://github.com/pgvector/pgvector.git /tmp/pgvector
                cd /tmp/pgvector && make && make install
                psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c 'CREATE EXTENSION IF NOT EXISTS vector;'
            \"
        else
            echo 'Postgres container not found'
        fi
    ")
    
    # Verify installation succeeded
    PGVECTOR_VERIFY=$(ssh -i $SSH_KEY $SSH_USER@$SSH_HOST "
        cd $REMOTE_DIR && 
        POSTGRES_CONTAINER=\$(docker ps -q -f name=postgres | head -n 1) &&
        if [ ! -z \"\$POSTGRES_CONTAINER\" ]; then
            docker exec \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT * FROM pg_extension WHERE extname = 'vector';\"
        else
            echo 'Postgres container not found'
        fi
    ")
    
    if echo "$PGVECTOR_VERIFY" | grep -q "vector"; then
        echo "✅ pgvector extension installed successfully"
    else
        echo "❌ Failed to install pgvector extension"
        echo "   Manual fix required. Connect to the server and run:"
        echo "   cd $REMOTE_DIR && docker-compose exec postgres /bin/bash -c 'cd /docker-entrypoint-initdb.d && psql -U postgres -d umt_db -f fix_pgvector.sh'"
        exit 1
    fi
fi

# Check for src/schemas in the API container
echo "Verifying schemas directory in API container..."
SCHEMAS_STATUS=$(ssh -i $SSH_KEY $SSH_USER@$SSH_HOST "
    cd $REMOTE_DIR && 
    API_CONTAINER=\$(docker ps -q -f name=api-gateway | head -n 1) &&
    if [ ! -z \"\$API_CONTAINER\" ]; then
        docker exec \$API_CONTAINER ls -la /app/src/schemas || echo 'Schemas directory not found'
    else
        echo 'API container not found'
    fi
")

if echo "$SCHEMAS_STATUS" | grep -q "template.py"; then
    echo "✅ Schemas directory exists in API container"
else
    echo "❌ Schemas directory is missing in API container"
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

# Check frontend files in container
echo "Verifying frontend files in container..."
FRONTEND_FILES=$(ssh -i $SSH_KEY $SSH_USER@$SSH_HOST "
    cd $REMOTE_DIR && 
    FRONTEND_CONTAINER=\$(docker ps -q -f name=frontend | head -n 1) &&
    if [ ! -z \"\$FRONTEND_CONTAINER\" ]; then
        docker exec \$FRONTEND_CONTAINER ls -la /usr/share/nginx/html || echo 'Frontend files not found'
    else
        echo 'Frontend container not found'
    fi
")

if echo "$FRONTEND_FILES" | grep -q "index.html"; then
    echo "✅ Frontend files exist in container"
else
    echo "❌ Frontend files are missing in container"
    exit 1
fi

# Check for frontend assets
echo "Verifying frontend assets..."
FRONTEND_ASSETS=$(ssh -i $SSH_KEY $SSH_USER@$SSH_HOST "
    cd $REMOTE_DIR && 
    FRONTEND_CONTAINER=\$(docker ps -q -f name=frontend | head -n 1) &&
    if [ ! -z \"\$FRONTEND_CONTAINER\" ]; then
        docker exec \$FRONTEND_CONTAINER ls -la /usr/share/nginx/html/assets || echo 'Frontend assets not found'
    else
        echo 'Frontend container not found'
    fi
")

if echo "$FRONTEND_ASSETS" | grep -q ".js"; then
    echo "✅ Frontend assets exist in container"
else
    echo "❌ Frontend assets are missing in container"
    exit 1
fi

echo "✅ Deployment verification complete. The application is running correctly."