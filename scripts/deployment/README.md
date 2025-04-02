# Deployment Scripts

This directory contains scripts for deploying the Ultimate Marketing Team to different environments.

> **For full deployment documentation, see [DEPLOYMENT_GUIDE.md](../../docs/deployment/DEPLOYMENT_GUIDE.md)**

## Main Deployment Scripts

- `deploy_staging.sh` - Main script for deploying full stack to staging environment
- `deploy_frontend.sh` - Deploy only the React frontend to staging

## Monitoring and Maintenance Scripts

- `check_staging.sh` - Comprehensive script to check staging environment health
  - Checks disk space
  - Monitors Docker containers 
  - Verifies service health
  - Provides cleanup options
- `verify_deployment.sh` - Verify successful deployment

## Database Scripts

- `db_connect.sh` - Connect to the database
- `init_rds_database.sh` - Initialize AWS RDS database

## Utility Scripts

- `update_service_env.sh` - Update service environment variables

## Usage Examples

### Full Deployment
```bash
./scripts/deployment/deploy_staging.sh
```

### Clean Deployment (removes existing data)
```bash
./scripts/deployment/deploy_staging.sh --clean
```

### Frontend Only Deployment
```bash
./scripts/deployment/deploy_frontend.sh
```

### Check Staging Environment
```bash
# Check everything (disk space, Docker, services)
./scripts/deployment/check_staging.sh

# Check and clean disk space
./scripts/deployment/check_staging.sh --clean-disk

# Check only specific components
./scripts/deployment/check_staging.sh --disk-only
./scripts/deployment/check_staging.sh --docker-only
./scripts/deployment/check_staging.sh --services-only
```

### Database Connection
```bash
./scripts/deployment/db_connect.sh
```

## Common Issues

- If you see "Frontend directory not found" warning:
  - Make sure the frontend directory exists in the project root
  - The deployment script will now auto-create necessary files if they don't exist
  
- If you see database connection issues:
  - Check your database credentials in the environment files
  - Verify that the PostgreSQL service is running
  
- If deployment fails with timeout errors:
  - Try running with the `--clean` flag for a fresh installation
  - Check server resources using `./scripts/deployment/check_staging.sh`