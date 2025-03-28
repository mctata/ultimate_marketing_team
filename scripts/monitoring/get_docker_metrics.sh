#!/bin/bash
# Simple Docker Performance Measurement Script

echo "Measuring Docker Performance Metrics"
echo "==================================="
echo ""

# Get container info
echo "Container Resource Usage:"
echo "------------------------"
docker-compose ps
echo ""

# Get memory and CPU usage of all containers
echo "Memory and CPU Usage:"
echo "-------------------"
docker stats --no-stream $(docker-compose ps -q)
echo ""

# Get image sizes
echo "Image Sizes:"
echo "-----------"
docker images | grep ultimate_marketing_team
echo ""

# Check API Gateway health
echo "API Gateway Health Check:"
echo "----------------------"
if docker-compose exec -T api-gateway python -c "import requests; print(requests.get('http://localhost:8000/api/health').json())"; then
  echo "API Gateway health check successful!"
else
  echo "API Gateway health check failed!"
fi
echo ""

# Get API response times
echo "API Response Times:"
echo "----------------"
docker-compose exec -T api-gateway python -c "
import requests
import time
import statistics

times = []
for i in range(5):
    start = time.time()
    response = requests.get('http://localhost:8000/api/health')
    end = time.time()
    duration = (end - start) * 1000  # Convert to ms
    times.append(duration)
    print(f'Request {i+1}: {duration:.2f} ms')

print(f'Average: {statistics.mean(times):.2f} ms')
print(f'Min: {min(times):.2f} ms')
print(f'Max: {max(times):.2f} ms')
"