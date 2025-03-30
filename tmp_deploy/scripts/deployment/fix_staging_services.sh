#!/bin/bash
# Script to fix API Gateway and Migrations services on staging environment

set -e

echo "Fixing API Gateway and Migrations services on staging environment..."

# Configuration
SSH_USER=${SSH_USER:-"ubuntu"}
SSH_HOST=${SSH_HOST:-"ec2-44-202-29-233.compute-1.amazonaws.com"}
REMOTE_DIR=${REMOTE_DIR:-"/home/ubuntu/ultimate-marketing-team"}
SSH_KEY=${SSH_KEY:-"ultimate-marketing-staging.pem"}

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key file '$SSH_KEY' not found."
    echo "Please provide the path to your SSH key file using SSH_KEY=path/to/key"
    exit 1
fi

# Execute remote commands
echo "Connecting to server to fix services..."
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" << 'ENDSSH'
    # Basic variables
    REMOTE_DIR="/home/ubuntu/ultimate-marketing-team"
    
    set -e
    echo "Connected to the server..."
    
    # Navigate to the project directory
    cd $REMOTE_DIR
    
    # Create a backup of the original Dockerfiles
    echo "Creating backups of Dockerfiles..."
    mkdir -p docker/backups
    cp docker/api_gateway/Dockerfile docker/backups/api_gateway_Dockerfile.backup-$(date +%Y%m%d%H%M%S)
    cp docker/migrations/Dockerfile docker/backups/migrations_Dockerfile.backup-$(date +%Y%m%d%H%M%S)
    
    # Fix API Gateway Dockerfile
    echo "Fixing API Gateway Dockerfile..."
    cat > docker/api_gateway/Dockerfile << 'EOF'
# Builder stage
FROM python:3.10-slim as builder

WORKDIR /app

# Install only build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements file
COPY requirements.txt .

# Install dependencies into a virtual environment
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.10-slim

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /venv /venv
ENV PATH="/venv/bin:$PATH"

# Copy only necessary application code - include all required directories
COPY src/__init__.py /app/src/__init__.py
COPY src/api /app/src/api
COPY src/models /app/src/models
COPY src/core /app/src/core
COPY src/schemas /app/src/schemas
COPY alembic.ini /app/

# Create empty directories to fix imports
RUN mkdir -p /app/src/agents

# Expose the application port
EXPOSE 8000

# Set environment variables to optimize Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONHASHSEED=random \
    PYTHONFAULTHANDLER=1

# Run in production mode (no reload)
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

    # Fix Migrations Dockerfile
    echo "Fixing Migrations Dockerfile..."
    cat > docker/migrations/Dockerfile << 'EOF'
# Builder stage
FROM python:3.10-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install only requirements needed for migrations
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir alembic psycopg2-binary sqlalchemy loguru pydantic

# Final stage
FROM python:3.10-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy pip packages from builder
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin/alembic /usr/local/bin/alembic

# Copy only necessary application code
COPY alembic.ini /app/
COPY migrations /app/migrations
COPY src/__init__.py /app/src/__init__.py
COPY src/models /app/src/models
COPY src/core /app/src/core
COPY src/schemas /app/src/schemas

# Set environment variables
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1

# Create entrypoint script with simplified logic
RUN echo '#!/bin/sh\n\
# Run alembic with the provided command or default to upgrade head\n\
if [ $# -eq 0 ]; then\n\
  alembic upgrade head\n\
else\n\
  alembic "$@"\n\
fi\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
CMD []
EOF

    # Create stub file for src/models/user.py if it doesn't exist
    echo "Creating stub for user.py if needed..."
    mkdir -p src/models
    if [ ! -f src/models/user.py ]; then
        echo "Creating src/models/user.py stub file..."
        cat > src/models/user.py << 'EOF'
# This is a stub file to fix import issues
# The actual User model is defined in src/models/system.py
from src.models.system import User
EOF
    fi

    # Ensure src directory has __init__.py
    echo "Ensuring src directory has __init__.py..."
    mkdir -p src
    touch src/__init__.py
    
    # Clean up Docker environment
    echo "Cleaning up Docker environment..."
    docker system prune -f  # Remove unused containers, networks, etc.
    
    # Rebuild and restart services
    echo "Rebuilding and restarting services..."
    docker-compose -f docker-compose.staging.yml build api-gateway migrations
    
    # Stop and remove current services
    echo "Stopping services..."
    docker-compose -f docker-compose.staging.yml stop api-gateway migrations
    docker-compose -f docker-compose.staging.yml rm -f api-gateway migrations
    
    # Start services
    echo "Starting services..."
    docker-compose -f docker-compose.staging.yml up -d migrations
    docker-compose -f docker-compose.staging.yml up -d api-gateway

    # Verify the services are running
    echo "Verifying services..."
    docker-compose -f docker-compose.staging.yml ps
    
    # Check logs for api-gateway
    echo "API Gateway logs:"
    docker-compose -f docker-compose.staging.yml logs --tail=20 api-gateway

    # Run the frontend-ssl service if not already running
    if ! docker ps | grep -q frontend-ssl; then
        echo "Starting frontend-ssl service..."
        docker-compose -f frontend-ssl.yml up -d
    fi
    
    echo "Service fix completed!"
ENDSSH

echo "Service fix script completed!"
echo "Run './scripts/deployment/check_services.sh' to verify the services are running."
echo "Try accessing https://staging.tangible-studios.com/ in a private/incognito window."