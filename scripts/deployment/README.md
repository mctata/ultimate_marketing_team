# Deployment Scripts

This directory contains scripts for deploying the Ultimate Marketing Team to different environments.

> **For full deployment documentation, see [DEPLOYMENT_GUIDE.md](../../docs/deployment/DEPLOYMENT_GUIDE.md)**

## Main Deployment Scripts

- `deploy_staging.sh` - Main script for deploying full stack to staging environment
- `deploy_frontend.sh` - Deploy only the React frontend to staging

## Web Server Configuration Scripts

- `check_nginx_ssl.sh` - Check Nginx configuration and SSL certificates
- `restart_nginx.sh` - Restart the Nginx server
- `fix_nginx_apache.sh` - Fix conflicts between Nginx and Apache

## Docker and Services Scripts

- `check_docker_services.sh` - Check status of Docker containers
- `fix_backend_services.sh` - Restart backend Docker services
- `check_server_space.sh` - Check available disk space on server
- `check_staging_services.sh` - Comprehensive service health check

## Database Scripts

- `fix_pgvector.sh` - Fix pgvector extension issues
- `db_connect.sh` - Connect to the database
- `test_db_connection.sh` - Test database connectivity
- `init_rds_database.sh` - Initialize AWS RDS database

## API Service Fix Scripts

- `fix_api_gateway.sh` - Fix API Gateway service issues
- `fix_api_gateway_db.sh` - Fix API Gateway database connection
- `fix_health_api.sh` - Fix Health API service issues

## Connection and Testing Scripts

- `test_connection.sh` - Test SSH connection to server
- `update_service_env.sh` - Update service environment variables
- `verify_deployment.sh` - Verify successful deployment

## Usage Examples

### Full Deployment
```bash
./scripts/deployment/deploy_staging.sh
```

### Frontend Only Deployment
```bash
./scripts/deployment/deploy_frontend.sh
```

### Checking Services
```bash
./scripts/deployment/check_docker_services.sh
```

### Fixing Nginx/Apache Conflicts
```bash
./scripts/deployment/fix_nginx_apache.sh
```

## Common Issues

- If you see "build path ./monitoring does not exist": Run `./scripts/deployment/fix_health_api.sh`
- If you see database connection issues: Run `./scripts/deployment/fix_api_gateway_db.sh`
- If Nginx shows Apache default page: Run `./scripts/deployment/fix_nginx_apache.sh`