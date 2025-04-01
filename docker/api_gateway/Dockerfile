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
    postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /venv /venv
ENV PATH="/venv/bin:$PATH"

# Copy application code
COPY src /app/src
COPY scripts /app/scripts
COPY alembic.ini /app/
COPY migrations /app/migrations

# Create empty agents directory to fix imports if not exists
RUN mkdir -p /app/src/agents

# Make scripts executable
RUN chmod +x /app/scripts/deployment/staging/*.sh \
    && chmod +x /app/scripts/database/*.py

# Expose the application port
EXPOSE 8000

# Set environment variables to optimize Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONHASHSEED=random \
    PYTHONFAULTHANDLER=1 \
    RUN_MIGRATIONS=true \
    USE_SIMPLIFIED_API=false

# Copy simplified API for staging
COPY src/api/staging_main.py /app/

# Create an enhanced startup script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Wait for the database to be available\n\
max_retries=30\n\
counter=0\n\
echo "Waiting for database to be ready..."\n\
until pg_isready -h ${DB_HOST:-postgres} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -t 1; do\n\
    counter=$((counter+1))\n\
    if [ $counter -ge $max_retries ]; then\n\
        echo "Database connection failed after $max_retries attempts. Starting anyway..."\n\
        break\n\
    fi\n\
    echo "Waiting for database connection (attempt $counter/$max_retries)..."\n\
    sleep 2\n\
done\n\
\n\
# Run database migrations if enabled\n\
if [ "$RUN_MIGRATIONS" = "true" ]; then\n\
    echo "Running database migrations..."\n\
    python -m alembic upgrade head || echo "Migration failed but continuing startup"\n\
fi\n\
\n\
# Start the appropriate API\n\
if [ "$USE_SIMPLIFIED_API" = "true" ]; then\n\
    echo "Starting simplified API gateway..."\n\
    exec uvicorn staging_main:app --host 0.0.0.0 --port 8000\n\
else\n\
    echo "Starting standard API gateway..."\n\
    exec uvicorn src.api.main:app --host 0.0.0.0 --port 8000\n\
fi' > /app/start.sh && chmod +x /app/start.sh

# Run the startup script
CMD ["/app/start.sh"]
