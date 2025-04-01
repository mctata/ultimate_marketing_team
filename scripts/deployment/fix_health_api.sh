#!/bin/bash
# Script to specifically fix the health-api deployment issue
set -e

echo "=== HEALTH API FIX SCRIPT ==="

# Set up Docker Compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif docker-compose --version &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Docker Compose is not installed or not in PATH."
    exit 1
fi

# Determine if we're using standard or traditional container naming
if docker ps | grep -q "umt-health-api"; then
    HEALTH_CONTAINER="umt-health-api"
    CONTAINER_FORMAT="standard"
elif docker ps | grep -q "ultimate-marketing-team_health-api_1"; then
    HEALTH_CONTAINER="ultimate-marketing-team_health-api_1"
    CONTAINER_FORMAT="traditional"
else
    echo "❌ Health API container not found in running containers."
    echo "Available containers:"
    docker ps
    HEALTH_CONTAINER="health-api"  # Default fallback
fi

echo "Using container format: $CONTAINER_FORMAT"
echo "Health API container: $HEALTH_CONTAINER"

# Create the monitoring directory if it doesn't exist
mkdir -p monitoring

# Check if health_api.py exists in monitoring directory
if [ ! -f "monitoring/health_api.py" ]; then
    # If not in monitoring but exists in root, copy it
    if [ -f "health_api.py" ]; then
        echo "Copying health_api.py to monitoring directory..."
        cp health_api.py monitoring/
    else
        echo "Creating health_api.py in monitoring directory..."
        cat > monitoring/health_api.py << 'EOF'
from fastapi import FastAPI
import uvicorn
import time
import os

app = FastAPI()

@app.get("/")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "service": "health-api", 
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "staging")
    }

@app.get("/ping")
async def ping():
    return "pong"

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF
    fi
fi

# Check if Dockerfile.health-api exists in monitoring directory
if [ ! -f "monitoring/Dockerfile.health-api" ]; then
    # If not in monitoring but exists in root, copy it
    if [ -f "Dockerfile.health-api" ]; then
        echo "Copying Dockerfile.health-api to monitoring directory..."
        cp Dockerfile.health-api monitoring/
    else
        echo "Creating Dockerfile.health-api in monitoring directory..."
        cat > monitoring/Dockerfile.health-api << 'EOF'
FROM python:3.10-slim

WORKDIR /app

RUN pip install fastapi uvicorn psutil

COPY health_api.py /app/

EXPOSE 8000

CMD ["python", "health_api.py"]
EOF
    fi
fi

# Stop and remove the health-api container if it exists
echo "Stopping and removing existing health-api container..."
docker stop $HEALTH_CONTAINER 2>/dev/null || true
docker rm $HEALTH_CONTAINER 2>/dev/null || true

# Build and start the health-api using the root context
echo "Building and starting health-api with correct context..."
$DOCKER_COMPOSE -f docker-compose.staging.yml build health-api
$DOCKER_COMPOSE -f docker-compose.staging.yml up -d health-api

# Check if the health-api is running
echo "Checking if health-api is running..."
sleep 5
if docker ps | grep -q "$HEALTH_CONTAINER"; then
    echo "✅ Health API container is running"
    # Check if the health endpoint works
    if curl -s http://localhost:8001/ping | grep -q "pong"; then
        echo "✅ Health API endpoint is working"
    else
        echo "⚠️ Health API is running but endpoints aren't accessible"
    fi
else
    echo "❌ Health API failed to start"
    docker logs $HEALTH_CONTAINER
fi

echo "=== HEALTH API FIX COMPLETED ==="