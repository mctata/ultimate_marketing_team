#!/bin/bash
# Docker Performance Measurement Script
# This script measures container startup time and resource usage
# for the Ultimate Marketing Team platform.

set -e

echo "Starting Ultimate Marketing Team Docker Performance Measurement"
echo "=============================================================="
echo ""

# Ensure script is run from the project root
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

# Make sure containers are stopped
echo "Ensuring all containers are stopped..."
docker-compose down -v &>/dev/null || true
sleep 2

# Clear Docker stats file if it exists
STATS_FILE="$PROJECT_ROOT/docker_performance_stats.txt"
rm -f "$STATS_FILE"

# Function to measure container startup time
measure_startup_time() {
  echo "Measuring container startup time..."
  
  # Record start time
  START_TIME=$(date +%s.%N)
  
  # Start containers
  docker-compose up -d
  
  # Wait for containers to be ready
  echo "Waiting for containers to be ready..."
  
  # Wait for API Gateway to be ready (max 60 seconds)
  MAX_WAIT=60
  ELAPSED=0
  
  echo "Checking API Gateway logs for startup:"
  docker-compose logs api-gateway | tail -n 20
  
  while [ $ELAPSED -lt $MAX_WAIT ]; do
    docker-compose logs api-gateway | tail -n 1
    if docker-compose logs api-gateway | grep -q "Application startup complete"; then
      break
    fi
    sleep 1
    ELAPSED=$((ELAPSED+1))
    printf "."
  done
  
  # If we reach the timeout, just continue
  if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo ""
    echo "Warning: API Gateway startup not detected after $MAX_WAIT seconds."
  else
    echo ""
    echo "All containers started successfully!"
  fi
  
  # Record end time and calculate duration
  END_TIME=$(date +%s.%N)
  DURATION=$(echo "$END_TIME - $START_TIME" | bc)
  
  echo "Container startup time: $DURATION seconds"
  echo "Container startup time: $DURATION seconds" >> "$STATS_FILE"
}

# Function to measure resource usage
measure_resource_usage() {
  echo "Measuring container resource usage..."
  
  # Get list of running containers
  CONTAINERS=$(docker-compose ps -q)
  
  echo "Container,CPU%,Memory Usage,Memory Limit,Memory %" > "$STATS_FILE.tmp"
  
  # Get stats for each container
  for CONTAINER in $CONTAINERS; do
    NAME=$(docker inspect --format '{{.Name}}' "$CONTAINER" | sed 's/\///')
    STATS=$(docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}}" "$CONTAINER")
    echo "$STATS" >> "$STATS_FILE.tmp"
  done
  
  # Format and display stats
  column -t -s ',' "$STATS_FILE.tmp" | tee -a "$STATS_FILE"
  rm "$STATS_FILE.tmp"
}

# Function to measure image sizes
measure_image_sizes() {
  echo "Measuring Docker image sizes..."
  
  # Build images if they don't exist
  docker-compose build &>/dev/null || true
  
  # Get image sizes
  echo "Image,Size" > "$STATS_FILE.tmp"
  
  docker images | grep 'ultimate_marketing_team' | \
  awk '{print $1 ":" $2 "," $7}' >> "$STATS_FILE.tmp"
  
  # Format and display sizes
  column -t -s ',' "$STATS_FILE.tmp" | tee -a "$STATS_FILE"
  rm "$STATS_FILE.tmp"
}

# Function to run API load test with Python
run_api_load_test() {
  echo "Running simple API load test..."
  
  # Wait for API to be ready
  sleep 5
  
  # Create Python script for measuring response times
  cat > api_test.py << 'EOF'
import requests
import time
import sys

# Test API health endpoint
for i in range(1, 11):
    start_time = time.time()
    try:
        response = requests.get("http://localhost:8000/api/health")
        end_time = time.time()
        total_time = end_time - start_time
        print(f"Request {i}: {total_time:.6f}s")
    except Exception as e:
        print(f"Request {i}: Error - {str(e)}")

EOF

  # Execute Python script and append results to stats file
  echo "Response times for /api/health endpoint:" | tee -a "$STATS_FILE"
  python3 api_test.py | tee -a "$STATS_FILE"
  
  # Clean up test script
  rm api_test.py
}

# Run measurements
measure_startup_time
measure_resource_usage
measure_image_sizes
run_api_load_test

# Clean up
echo "Cleaning up..."
docker-compose down

echo ""
echo "Performance measurement complete!"
echo "Results saved to: $STATS_FILE"
echo ""
echo "To compare with previous measurements, review $STATS_FILE"