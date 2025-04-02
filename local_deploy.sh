#\!/bin/bash
# Simple script to deploy services locally for testing without SSH

echo "🚀 ======================= 🚀"
echo "🚀  Local Deployment Tool  🚀"
echo "🚀 ======================= 🚀"

# Check if Docker is running
if \! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check if jq is installed
if \! command -v jq &> /dev/null; then
    echo "⚠️ jq is not installed. This will be needed for health checks."
    echo "   Install with: brew install jq"
    JQ_INSTALLED=false
else
    echo "✅ jq is installed"
    JQ_INSTALLED=true
fi

# Build API Gateway image
echo "🔹 Building API Gateway image..."
docker build -t api-gateway:latest -f docker/api-gateway.dockerfile .

# Stop any existing containers
echo "🔹 Stopping existing containers..."
docker-compose -f docker-compose.staging.yml down --remove-orphans

# Start the services
echo "🔹 Starting services..."
docker-compose -f docker-compose.staging.yml up -d

# Wait for services to start
echo "🔹 Waiting for services to start up..."
sleep 10

# Show running containers
echo "🔹 Running containers:"
docker-compose -f docker-compose.staging.yml ps

# Check service health
echo "🔹 Checking service health..."

# Check API Gateway health
echo "🔹 Checking API Gateway..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ API Gateway is running"
    if [ "$JQ_INSTALLED" = true ]; then
        curl -s http://localhost:8000/health | jq
    else
        curl -s http://localhost:8000/health
    fi
else
    echo "❌ API Gateway is not responding"
fi

# Check Health API
echo "🔹 Checking Health API..."
if curl -s http://localhost:8001 > /dev/null; then
    echo "✅ Health API is running"
    if [ "$JQ_INSTALLED" = true ]; then
        curl -s http://localhost:8001 | jq
    else
        curl -s http://localhost:8001
    fi
else
    echo "❌ Health API is not responding"
fi

# Check Health API ping endpoint
echo "🔹 Checking Health API ping endpoint..."
if curl -s http://localhost:8001/ping > /dev/null; then
    echo "✅ Health API ping endpoint is working"
    echo "Response: $(curl -s http://localhost:8001/ping)"
else
    echo "❌ Health API ping endpoint is not responding"
fi

echo ""
echo "🔹 Service URLs:"
echo "- API Gateway: http://localhost:8000"
echo "- Health API: http://localhost:8001"
echo "- Frontend: http://localhost:3000"
echo ""
echo "To view logs: docker-compose -f docker-compose.staging.yml logs -f [service_name]"
echo "To stop services: docker-compose -f docker-compose.staging.yml down"
