# Simplified Dockerfile for staging environment to reduce disk space usage
FROM python:3.10-slim

WORKDIR /app

# Install only essential runtime dependencies without build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create a stub agent runner for staging
RUN mkdir -p /app/src/agents && \
    echo 'import os\nimport time\n\ndef main():\n    agent_name = os.environ.get("AGENT_NAME", "unknown")\n    print(f"Agent {agent_name} initialized in stub mode")\n    while True:\n        print(f"Agent {agent_name} is running in stub mode (no real operations)")\n        time.sleep(60)\n\nif __name__ == "__main__":\n    main()' > /app/src/agents/runner.py && \
    mkdir -p /app/src/agents/config

# Set environment variables to optimize Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONHASHSEED=random \
    PYTHONFAULTHANDLER=1

# Set default command
CMD ["python", "/app/src/agents/runner.py"]