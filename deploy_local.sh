#\!/bin/bash
# Script to deploy services locally for testing

echo "🚀 Deploying services locally for testing..."

# Install jq if not already installed
if \! command -v jq &> /dev/null; then
    echo "jq is not installed. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install jq
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update && sudo apt-get install -y jq
    else
        echo "Unsupported OS for automatic jq installation. Please install jq manually."
        exit 1
    fi
fi

# Check if Docker is running
if \! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start the services using docker-compose.staging.yml
echo "🔹 Starting services using docker-compose.staging.yml..."
docker-compose -f docker-compose.staging.yml down --remove-orphans
docker-compose -f docker-compose.staging.yml build
docker-compose -f docker-compose.staging.yml up -d

# Wait for services to start
echo "🔹 Waiting for services to start..."
sleep 10

# Check service status
echo "🔹 Checking service status..."
docker-compose -f docker-compose.staging.yml ps

# Check health-api endpoint
echo "🔹 Checking health-api endpoint..."
curl -s http://localhost:8001 | jq || echo "Failed to connect to health-api"

# Check health-api ping endpoint
echo "🔹 Checking health-api ping endpoint..."
curl -s http://localhost:8001/ping | jq || echo "Failed to connect to health-api ping endpoint"

# Check api-gateway endpoint
echo "🔹 Checking api-gateway endpoint..."
curl -s http://localhost:8000 | jq || echo "Failed to connect to api-gateway"

# Check api-gateway health endpoint
echo "🔹 Checking api-gateway health endpoint..."
curl -s http://localhost:8000/health | jq || echo "Failed to connect to api-gateway health endpoint"

echo "✅ Local deployment complete\!"
