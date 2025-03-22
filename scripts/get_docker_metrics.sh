#!/bin/bash
# Simple Docker Metrics Script
# This script captures basic metrics for Docker containers

echo "Docker Container Metrics"
echo "======================="

# Get container stats
docker stats --no-stream

# Get image sizes
echo ""
echo "Docker Image Sizes:"
docker images | grep 'ultimate_marketing_team'

# Check service status
echo ""
echo "Container Status:"
docker-compose ps