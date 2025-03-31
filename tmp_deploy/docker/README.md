# Docker Configuration

This directory contains Docker configuration files for various components of the application.

## Directory Structure

- `/agents/`: Docker configuration for agent services
- `/api_gateway/`: Docker configuration for the API gateway
- `/frontend/`: Docker configuration for the frontend application
- `/migrations/`: Docker configuration for database migrations
- `/postgres/`: Docker configuration and initialization scripts for PostgreSQL
- `/gsc-test/`: Docker configuration for Google Search Console testing

## Docker Compose Files

The following Docker Compose files are available at the project root:

- `docker-compose.yml`: Default development environment
- `docker-compose.dev.yml`: Extended development environment
- `docker-compose.test.yml`: Test environment
- `docker-compose.staging.yml`: Staging environment
- `docker-compose.production.yml`: Production environment
- `docker-compose.monitoring.yml`: Monitoring stack

The Google Search Console testing environment is available at:

- `docker/gsc-test/docker-compose.gsc-test.yml`