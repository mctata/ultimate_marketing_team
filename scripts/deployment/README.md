# Deployment Scripts

This directory contains scripts for deploying the Ultimate Marketing Team to different environments.

> **For full deployment documentation, see [DEPLOYMENT_GUIDE.md](../../docs/deployment/DEPLOYMENT_GUIDE.md)**

## Quick Reference

### Primary Deployment Scripts

- `deploy_staging.sh`: The main script for deploying to remote staging environment.
  - Usage: `./scripts/deployment/deploy_staging.sh`
  - This script copies necessary files to the remote server and deploys using docker-compose.

- `staging/deploy.sh`: Enhanced script for local testing with PostgreSQL 17 compatibility.
  - Usage: `./scripts/deployment/staging/deploy.sh`
  - This script assumes you're running it locally with Docker installed.
  - Features improved database validation and automated error recovery.

### Utility Scripts

- `fix_api_gateway_db.sh`: Fixes database connection issues with the API gateway.
  - Usage: `./scripts/deployment/fix_api_gateway_db.sh`

- `fix_health_api.sh`: Fixes "build path ./monitoring does not exist" errors.
  - Usage: `./scripts/deployment/fix_health_api.sh`

## Common Issues

- If you see "build path ./monitoring does not exist": Run `./scripts/deployment/fix_health_api.sh`
- If you see database connection issues: Run `./scripts/deployment/fix_api_gateway_db.sh`