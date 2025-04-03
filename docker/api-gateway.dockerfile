FROM python:3.10-slim

WORKDIR /app

# Copy the necessary files
COPY requirements.txt .
COPY requirements/api-requirements.txt ./requirements/
COPY src/api/ ./src/api/
COPY src/models/ ./src/models/
COPY src/core/ ./src/core/
COPY src/schemas/ ./src/schemas/
COPY src/agents/ ./src/agents/
COPY alembic.ini .
COPY migrations/ ./migrations/

# Install curl for healthchecks and pip packages
RUN apt-get update && \
    apt-get install -y curl gcc python3-dev libpq-dev && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir -r requirements/api-requirements.txt && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV PYTHONPATH=/app
ENV ENVIRONMENT=staging
ENV LOG_LEVEL=INFO

EXPOSE 8000

# Use main.py instead of the limited staging_main.py for full functionality
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
