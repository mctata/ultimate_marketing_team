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

# Copy only necessary application code
COPY src/api /app/src/api
COPY src/models /app/src/models
COPY src/core /app/src/core
COPY src/schemas /app/src/schemas
COPY alembic.ini /app/

# Create empty agents directory to fix imports
RUN mkdir -p /app/src/agents

# Expose the application port
EXPOSE 8000

# Set environment variables to optimize Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONHASHSEED=random \
    PYTHONFAULTHANDLER=1 \
    USE_SIMPLIFIED_API=false

# Copy simplified API for staging
COPY staging_main.py /app/

# Use a script to determine which API to run
RUN echo '#!/bin/bash\n\
if [ "$USE_SIMPLIFIED_API" = "true" ]; then\n\
  echo "Starting simplified API gateway..."\n\
  exec uvicorn staging_main:app --host 0.0.0.0 --port 8000\n\
else\n\
  echo "Starting standard API gateway..."\n\
  exec uvicorn src.api.main:app --host 0.0.0.0 --port 8000\n\
fi' > /app/start.sh && chmod +x /app/start.sh

# Run the startup script
CMD ["/app/start.sh"]