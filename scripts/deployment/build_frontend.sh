#!/bin/bash
# Script to build and test only the frontend service

set -e

# Change to project root directory
cd "$(dirname "$0")/../.."

echo "Building frontend service only..."
docker-compose -f docker-compose.staging.yml build frontend

echo "Starting frontend service..."
docker-compose -f docker-compose.staging.yml up -d frontend

echo "Checking frontend service status..."
docker-compose -f docker-compose.staging.yml ps frontend

echo "Frontend logs:"
docker-compose -f docker-compose.staging.yml logs frontend