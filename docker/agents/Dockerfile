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
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /venv /venv
ENV PATH="/venv/bin:$PATH"

# Copy only necessary application code
COPY src/models /app/src/models
COPY src/core /app/src/core
COPY src/agents/base_agent.py /app/src/agents/
COPY src/agents/runner.py /app/src/agents/
COPY src/agents/__init__.py /app/src/agents/
COPY src/agents/config /app/src/agents/config

# Set environment variables to optimize Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONHASHSEED=random \
    PYTHONFAULTHANDLER=1

# Run the agent service - agent name is specified via environment variable
CMD ["python", "-m", "src.agents.runner"]