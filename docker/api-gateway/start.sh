#\!/bin/bash
set -e

echo "Starting API Gateway service..."
cd /app
python -m uvicorn api_gateway:app --host 0.0.0.0 --port 8000
