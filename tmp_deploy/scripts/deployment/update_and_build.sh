#!/bin/bash
# Script to update codebase and build docker containers
set -e

# Change to the project directory
cd /home/ubuntu/ultimate-marketing-team

# Pull latest code
echo "Pulling latest code from repository..."
git pull

# Build the Docker services
echo "Building Docker services..."
docker-compose -f docker-compose.staging.yml build

# Run migrations
echo "Running database migrations..."
docker-compose -f docker-compose.staging.yml up -d migrations

# Start all services
echo "Starting all services..."
docker-compose -f docker-compose.staging.yml up -d

echo "Deployment complete!"
echo "Application accessible at https://staging.tangible-studios.com"