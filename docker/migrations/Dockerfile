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
# Check if skip checks flag is passed\n\
SKIP_CHECKS=false\n\
ALEMBIC_ARGS=""\n\
for arg in "$@"; do\n\
  if [ "$arg" == "--skip-checks" ]; then\n\
    SKIP_CHECKS=true\n\
  else\n\
    ALEMBIC_ARGS="$ALEMBIC_ARGS $arg"\n\
  fi\n\
done\n\
\n\
# If no arguments provided or arguments do not include a command, default to upgrade head\n\
if [ -z "$ALEMBIC_ARGS" ]; then\n\
  ALEMBIC_ARGS="upgrade head"\n\
fi\n\
\n\
if [ "$SKIP_CHECKS" = false ]; then\n\
  echo "Running migration pattern checks..."\n\
  python /app/scripts/check_migration_patterns.py\n\
  PATTERN_CHECK_EXIT=$?\n\
  if [ $PATTERN_CHECK_EXIT -ne 0 ]; then\n\
    echo "Migration pattern checks failed with exit code $PATTERN_CHECK_EXIT"\n\
    exit $PATTERN_CHECK_EXIT\n\
  fi\n\
\n\
  echo "Running pre-migration validation..."\n\
  python /app/scripts/pre_migration_check.py --skip-simulation\n\
  PRE_CHECK_EXIT=$?\n\
  if [ $PRE_CHECK_EXIT -ne 0 ]; then\n\
    echo "Pre-migration checks failed with exit code $PRE_CHECK_EXIT"\n\
    exit $PRE_CHECK_EXIT\n\
  fi\n\
  echo "Pre-migration checks passed, running migrations..."\n\
else\n\
  echo "Skipping pre-migration checks (--skip-checks flag provided)"\n\
fi\n\
\n\
# Run alembic with the appropriate command\n\
echo "Running: alembic $ALEMBIC_ARGS"\n\
alembic $ALEMBIC_ARGS\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Health check
HEALTHCHECK --interval=5s --timeout=5s --retries=3 \
    CMD alembic current || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
CMD []