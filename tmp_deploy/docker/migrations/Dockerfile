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
    pip install --no-cache-dir alembic psycopg2-binary sqlalchemy

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
COPY src/models /app/src/models

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