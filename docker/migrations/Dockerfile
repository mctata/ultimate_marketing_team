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

# Run migration pre-check script before migrations
RUN chmod +x /app/scripts/check_migration_patterns.py
RUN chmod +x /app/scripts/pre_migration_check.py

# Create entrypoint script
RUN echo '#!/bin/bash\n\
echo "Running pre-migration checks..."\n\
python /app/scripts/pre_migration_check.py\n\
PRE_CHECK_EXIT=$?\n\
if [ $PRE_CHECK_EXIT -ne 0 ]; then\n\
  echo "Pre-migration checks failed with exit code $PRE_CHECK_EXIT"\n\
  exit $PRE_CHECK_EXIT\n\
fi\n\
echo "Pre-migration checks passed, running migrations..."\n\
alembic upgrade head\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Health check
HEALTHCHECK --interval=5s --timeout=5s --retries=3 \
    CMD alembic current || exit 1

CMD ["/app/entrypoint.sh"]