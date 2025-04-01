# Deployment Scripts

This directory contains scripts for deploying the Ultimate Marketing Team to different environments.

## Available Scripts

### Primary Deployment Scripts

- `deploy_staging.sh`: The primary script for deploying to staging environments.
  - Usage: `./scripts/deployment/deploy_staging.sh`
  - This script copies necessary files to the remote server and deploys using docker-compose.

### Enhanced Deployment Scripts (with Database Validation)

- `staging/deploy.sh`: An enhanced version of the deployment script with better database validation and error recovery.
  - Usage: `./scripts/deployment/staging/deploy.sh`
  - This script assumes you're running it locally with Docker installed.
  - Features improved PostgreSQL 17 compatibility and automated error recovery.

### Utility Scripts

- `fix_api_gateway_db.sh`: Fixes common database issues with the API gateway.
  - Usage: `./scripts/deployment/fix_api_gateway_db.sh`
  - Run this if the API gateway is having database connectivity issues.

- `fix_health_api.sh`: Fixes issues with the health-api service, ensuring proper setup of the monitoring directory.
  - Usage: `./scripts/deployment/fix_health_api.sh`
  - Run this if you encounter "build path ./monitoring does not exist" errors.

## Deployment Workflow

1. For standard remote staging deployment:
   ```
   ./scripts/deployment/deploy_staging.sh
   ```

2. For local deployment with enhanced database validation:
   ```
   ./scripts/deployment/staging/deploy.sh
   ```

3. If you encounter specific service issues:
   ```
   ./scripts/deployment/fix_api_gateway_db.sh  # For API gateway database issues
   ./scripts/deployment/fix_health_api.sh      # For health-api service issues
   ```