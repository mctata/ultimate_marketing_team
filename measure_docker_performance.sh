#!/bin/bash
# Script to measure Docker performance metrics

echo "===== Docker Performance Measurement ====="
echo "Date: $(date)"

# Ensure Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Remove any existing containers
echo "Cleaning up any existing containers..."
docker-compose down -v 2>/dev/null

# Clear Docker build cache (optional)
docker builder prune -f

# Time the Docker build process
echo "Measuring Docker build time..."
BUILD_START=$(date +%s)
docker-compose build
BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))
echo "Total build time: $BUILD_TIME seconds"

# Measure image sizes
echo "Measuring Docker image sizes..."
echo "API Gateway: $(docker images | grep api-gateway | awk '{print $7}')"
echo "Frontend: $(docker images | grep frontend | awk '{print $7}')"
echo "Marketing Agent: $(docker images | grep marketing-agent | awk '{print $7}')"

# Time the Docker startup process
echo "Measuring container startup time..."
STARTUP_START=$(date +%s)
docker-compose up -d
STARTUP_END=$(date +%s)
STARTUP_TIME=$((STARTUP_END - STARTUP_START))
echo "Total startup time: $STARTUP_TIME seconds"

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Measure memory usage
echo "Measuring container memory usage..."
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Clean up
echo "Cleaning up containers..."
docker-compose down

echo "===== Docker Performance Measurement Complete ====="