# Build stage
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -U pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# Install additional observability packages
RUN pip install --no-cache-dir \
    prometheus-client==0.17.1 \
    opentelemetry-api==1.20.0 \
    opentelemetry-sdk==1.20.0 \
    opentelemetry-exporter-otlp==1.20.0 \
    opentelemetry-instrumentation-fastapi==0.40b0 \
    opentelemetry-instrumentation-sqlalchemy==0.40b0 \
    opentelemetry-instrumentation-aiohttp==0.40b0 \
    opentelemetry-instrumentation-redis==0.40b0 \
    opentelemetry-instrumentation-requests==0.40b0 \
    elasticsearch==8.9.0 \
    python-logstash==0.4.8

# Run stage
FROM python:3.11-slim

WORKDIR /app

# Install system runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Create a non-root user to run the application
RUN useradd -m appuser
RUN chown -R appuser:appuser /app
USER appuser

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Expose ports
EXPOSE 8000

# Entrypoint and command
ENTRYPOINT ["python"]
CMD ["-m", "src.api.main"]