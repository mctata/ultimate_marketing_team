FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY pyproject.toml requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir locust psutil requests

# Copy benchmark files
COPY benchmarks /app/benchmarks
COPY src /app/src

# Create results directory
RUN mkdir -p /app/results

# Set Python path
ENV PYTHONPATH=/app

CMD ["python", "benchmarks/runners/run_benchmark.py"]