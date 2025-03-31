# Deployment Scripts

This directory contains scripts for deploying the Ultimate Marketing Team application.

## Main Deployment Script

- `deploy_staging.sh`: Simplified script to deploy to the staging environment

## Utility Scripts

Utility scripts are located in the `util` directory:

- `clean_docker.sh`: Cleans up Docker resources on the staging server
- `check_health_api.sh`: Verifies the health API is running correctly

## Patches

Patches for known issues are stored in the `patches` directory:

- `db_check_fix.patch`: Fixes for database connectivity checks
- `main_fix.patch`: Fixes for FastAPI startup issues

## Deployment Process

The deployment process follows these steps:

1. Clean up Docker resources on the staging server
2. Prepare a minimal deployment package
3. Deploy the health-api service first
4. Verify health-api is working
5. Deploy the api-gateway service

This approach ensures reliable deployments even with limited disk space.
