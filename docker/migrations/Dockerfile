FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir alembic psycopg2-binary

# Set environment variables
ENV PYTHONPATH=/app

# Copy application code and migration files
COPY . .

# Health check
HEALTHCHECK --interval=5s --timeout=5s --retries=3 \
    CMD alembic current || exit 1

CMD ["alembic", "upgrade", "head"]