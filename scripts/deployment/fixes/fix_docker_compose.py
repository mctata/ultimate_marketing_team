#\!/usr/bin/env python3

with open('docker-compose.staging.yml', 'w') as f:
    f.write('''version: '3.8'

services:
  # Simple Health API
  health-api:
    image: python:3.10-slim
    working_dir: /app
    ports:
      - "8001:8000"
    command: |
      bash -c "pip install fastapi uvicorn psutil && 
      cat > /app/health_app.py << 'EOF'
from fastapi import FastAPI
import time
import os

app = FastAPI()

@app.get('/')
async def health_check():
    return {
        'status': 'healthy',
        'timestamp': time.time(),
        'service': 'health-api', 
        'version': '1.0.0',
        'environment': os.getenv('ENVIRONMENT', 'staging')
    }

@app.get('/ping')
async def ping():
    return 'pong'
EOF
      uvicorn health_app:app --host 0.0.0.0 --port 8000"
    restart: always
    environment:
      - ENVIRONMENT=staging
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/ping || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - umt-network
    deploy:
      resources:
        limits:
          cpus: '0.2'
          memory: '256M'

  # API Gateway
  api-gateway:
    build:
      context: .
      dockerfile: ./docker/api_gateway/Dockerfile
    ports:
      - "8000:8000"
    env_file: ./.env.staging
    environment:
      - ENVIRONMENT=staging
      - LOG_LEVEL=INFO
    depends_on:
      postgres-proxy:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    restart: always
    networks:
      - umt-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  # Frontend
  frontend:
    build:
      context: .
      dockerfile: ./docker/frontend/Dockerfile
    ports:
      - "3000:80"
    env_file: ./frontend/.env.staging
    depends_on:
      - api-gateway
    restart: always
    networks:
      - umt-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  # Agent Services
  auth-agent:
    build:
      context: .
      dockerfile: ./docker/agents/Dockerfile
    env_file: ./.env.staging
    environment:
      - AGENT_NAME=auth_integration_agent
      - ENVIRONMENT=staging
      - LOG_LEVEL=INFO
    depends_on:
      - rabbitmq
      - postgres-proxy
    restart: always
    networks:
      - umt-network
    command: ["python", "-m", "src.agents.runner"]
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  brand-agent:
    build:
      context: .
      dockerfile: ./docker/agents/Dockerfile
    env_file: ./.env.staging
    environment:
      - AGENT_NAME=brand_project_management_agent
      - ENVIRONMENT=staging
      - LOG_LEVEL=INFO
    depends_on:
      - rabbitmq
      - postgres-proxy
    restart: always
    networks:
      - umt-network
    command: ["python", "-m", "src.agents.runner"]
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  content-strategy-agent:
    build:
      context: .
      dockerfile: ./docker/agents/Dockerfile
    env_file: ./.env.staging
    environment:
      - AGENT_NAME=content_strategy_agent
      - ENVIRONMENT=staging
      - LOG_LEVEL=INFO
    depends_on:
      - rabbitmq
      - postgres-proxy
    restart: always
    networks:
      - umt-network
    command: ["python", "-m", "src.agents.runner"]
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  content-creation-agent:
    build:
      context: .
      dockerfile: ./docker/agents/Dockerfile
    env_file: ./.env.staging
    environment:
      - AGENT_NAME=content_creation_agent
      - ENVIRONMENT=staging
      - LOG_LEVEL=INFO
    depends_on:
      - rabbitmq
      - postgres-proxy
    restart: always
    networks:
      - umt-network
    command: ["python", "-m", "src.agents.runner"]
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  content-ad-agent:
    build:
      context: .
      dockerfile: ./docker/agents/Dockerfile
    env_file: ./.env.staging
    environment:
      - AGENT_NAME=content_ad_management_agent
      - ENVIRONMENT=staging
      - LOG_LEVEL=INFO
    depends_on:
      - rabbitmq
      - postgres-proxy
    restart: always
    networks:
      - umt-network
    command: ["python", "-m", "src.agents.runner"]
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  # Database Proxy for RDS (no local PostgreSQL)
  # We're using AWS RDS instance directly: ${POSTGRES_HOST}
  postgres-proxy:
    image: alpine:latest
    command: >
      sh -c "
        apk add --no-cache curl && 
        echo 'PostgreSQL proxy container is running.' && 
        echo 'Using RDS instance at ${POSTGRES_HOST}' && 
        while true; do sleep 3600; done
      "
    networks:
      - umt-network
    healthcheck:
      test: ["CMD", "echo", "Proxy running"]
      interval: 30s
      timeout: 5s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '0.1'
          memory: 64M

  redis:
    image: redis:6.2-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - umt-network
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  rabbitmq:
    image: rabbitmq:3.9-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      - RABBITMQ_DEFAULT_USER=${RABBITMQ_USER}
      - RABBITMQ_DEFAULT_PASS=${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    networks:
      - umt-network
    restart: always
    healthcheck:
      test: ["CMD", "rabbitmqctl", "status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 1G

  # Vector Database Proxy - using the same RDS instance
  vector-db-proxy:
    image: alpine:latest
    command: >
      sh -c "
        apk add --no-cache curl && 
        echo 'Vector database proxy container is running.' && 
        echo 'Using RDS instance for vector database' && 
        while true; do sleep 3600; done
      "
    networks:
      - umt-network
    healthcheck:
      test: ["CMD", "echo", "Proxy running"]
      interval: 30s
      timeout: 5s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '0.1'
          memory: 64M
      
  # Database Migrations
  migrations:
    build:
      context: .
      dockerfile: ./docker/migrations/Dockerfile
    env_file: ./.env.staging
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}
      - PYTHONPATH=/app
      - ENVIRONMENT=staging
      - LOG_LEVEL=INFO
    depends_on:
      - postgres-proxy
    networks:
      - umt-network
    command: alembic upgrade head

networks:
  umt-network:
    driver: bridge

volumes:
  redis-data:
  rabbitmq-data:''')
