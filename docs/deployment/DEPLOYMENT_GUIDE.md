# Ultimate Marketing Team - Deployment Guide

> **TL;DR: Quick Guide**
>
> **Which script should I use to deploy?**
> - For actual remote deployment: `./scripts/deployment/deploy_staging.sh`
> - For local testing: `./scripts/deployment/staging/deploy.sh`
>
> **Common issues:**
> - If you see "build path ./monitoring does not exist": Run `./scripts/deployment/fix_health_api.sh`
> - If you see "API gateway database connection issues": Run `./scripts/deployment/fix_api_gateway_db.sh`

This guide provides comprehensive instructions for deploying the Ultimate Marketing Team application to different environments.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Environment Configuration](#environment-configuration)
3. [PostgreSQL Configuration](#postgresql-configuration)
4. [Deployment Steps](#deployment-steps)
5. [Verification and Monitoring](#verification-and-monitoring)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedure](#rollback-procedure)
8. [SSL Configuration](#ssl-configuration)

## Deployment Overview

The Ultimate Marketing Team application can be deployed to the following environments:

- **Staging Environment** - AWS EC2 instance at staging.tangible-studios.com
- **Local Environment** - Local development setup for testing
- **Production Environment** - Live environment for end users (coming soon)

All environments use Docker and Docker Compose for containerization, ensuring consistency across deployments.

## Environment Configuration

The deployment system now uses environment-specific configuration templates and Bitwarden for secure credential storage:

```
config/env/
├── deployment.env.local.template    # Local deployment template
├── deployment.env.staging.template  # Staging deployment template
└── README.md                        # Instructions for configuration management
```

> ⚠️ **SECURITY ALERT**: Never store actual credentials in the repository.
> See [Deployment Security Best Practices](./DEPLOYMENT_SECURITY.md) for details.

### Setting Up a New Environment

To add a new deployment environment:

1. Create a template file: `config/env/deployment.env.<environment_name>.template`
2. Add the following parameters with placeholder values:

```bash
# Deployment SSH configuration - TEMPLATE
SSH_USER=<username>
SSH_HOST=<hostname>
SSH_PORT=22
REMOTE_DIR=<remote_directory>
SSH_KEY=<ssh_key_path>
ENVIRONMENT=<environment_name>
COMPOSE_FILE=<docker_compose_file>
```

### Directory Structure

The deployment system uses the following directory structure:

```
scripts/deployment/
├── deploy.sh               # Universal deployment script (new)
├── check_services.sh       # Universal service check script (new)
├── quick_deploy.sh         # Universal quick deployment script (new)
├── staging/                # Staging-specific scripts (legacy)
│   ├── deploy.sh           # Main staging deployment script
│   ├── quick_deploy.sh     # Fast deployment with existing archive
│   └── check_services.sh   # Check services status
├── deploy_staging.sh       # Legacy staging deployment script
├── check_staging_services.sh  # Legacy script to check staging services
├── test_connection.sh      # Test SSH connection and prerequisites
├── test_local_db.sh        # Test local PostgreSQL setup
└── verify_deployment_setup.sh # Verify deployment configuration

deployments/
├── archives/               # Deployment archives
│   ├── staging/            # Staging deployment archives
│   ├── local/              # Local deployment archives
│   └── production/         # Production deployment archives
└── secrets/                # Environment credentials (gitignored)
```

## PostgreSQL Configuration

### PostgreSQL 17 with Vector Support

The application uses PostgreSQL 17 with vector extension support for AI features, matching our AWS RDS environment:

```yaml
postgres:
  image: postgres:17-alpine
  volumes:
    - postgres-data:/var/lib/postgresql/data
    - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/1_init.sql
    - ./docker/postgres/integration_upgrade.sql:/docker-entrypoint-initdb.d/2_integration_upgrade.sql
    - ./docker/postgres/install_pgvector.sql:/docker-entrypoint-initdb.d/3_install_pgvector.sql
```

### Database Connections

- **Staging Database**: ultimatemarketing-staging.c0dcu2ywapx7.us-east-1.rds.amazonaws.com
- **Local Database**: localhost:5432
- **Production Database**: (Configure in secrets file)

## Deployment Steps

All deployment scripts support multiple environments by passing the environment name as a parameter, using environment-specific configuration files.

### Prerequisites

Before deploying, ensure you have the following prerequisites:

1. **SSH Access**:
   - SSH key with access to the staging server
   - SSH client installed locally

2. **Configuration Files**:
   - Environment configuration (see "Setting Up Credentials" below)
   - SSH keys with correct permissions (typically chmod 400)

### Setting Up Credentials

To set up deployment credentials:

```bash
# Generate configuration files with placeholders
./scripts/utilities/manual_setup.sh staging

# Edit the files to add actual credentials
nano config/env/deployment.env.staging
nano config/env/.env.staging
```

This will create the necessary configuration files with placeholder values that you must edit to add the actual credentials before deploying.

### Testing Connection

Before deploying, test your connection to the target environment:

```bash
# Test connection to staging (default)
./scripts/deployment/test_connection.sh

# Test connection to local environment
./scripts/deployment/test_connection.sh local
```

### Standard Deployment

For a fresh deployment to any environment:

```bash
# Deploy to staging (default)
./scripts/deployment/deploy.sh

# Deploy to local environment
./scripts/deployment/deploy.sh local
```

This script will:
1. Check if credentials need to be fetched from Bitwarden
2. Load environment-specific configuration
3. Create a deployment archive
4. Deploy to the specified environment
5. Start Docker containers using the environment's compose file

### Compact Deployment (Recommended)

For deployments over slow connections or with minimal changes:

```bash
# First, test the connection
./scripts/deployment/test_connection.sh

# Then run the compact deployment
./scripts/deployment/staging/compact_deploy.sh

# After deployment, verify it was successful
./scripts/deployment/verify_deployment.sh
./scripts/deployment/verify_migrations.sh
```

This creates a minimal deployment package with only essential files, making it faster to upload over limited bandwidth connections.

#### What the compact_deploy.sh script does:

1. **Preparation**:
   - Verifies configuration files exist
   - Builds the frontend application
   - Verifies frontend build and schema files

2. **Packaging**:
   - Creates a minimal archive (usually <2MB)
   - Only includes essential code and configuration
   - Excludes node_modules, venv, and other large directories

3. **Deployment**:
   - Transfers archive to staging server
   - Extracts files with proper permissions
   - Sets up Docker containers
   - Installs pgvector extension
   - Applies database migrations

### Quick Deployment

For faster deployment using an existing archive:

```bash
# Quick deploy to staging (default)
./scripts/deployment/quick_deploy.sh staging_deploy_20250330_120000.tar.gz

# Quick deploy to local environment
./scripts/deployment/quick_deploy.sh staging_deploy_20250330_120000.tar.gz local
```

Replace `staging_deploy_20250330_120000.tar.gz` with your actual archive filename.

## Verification and Monitoring

### Checking Service Status

After deployment, verify services are running correctly:

```bash
# Comprehensive verification of deployed services
./scripts/deployment/verify_deployment.sh

# Verify database migrations were applied correctly
./scripts/deployment/verify_migrations.sh

# Check frontend build files for proper structure
./scripts/deployment/verify_frontend.sh

# Verify schemas directory for API dependencies
./scripts/deployment/verify_schemas.sh

# Legacy check services command
./scripts/deployment/check_services.sh
```

These scripts verify different aspects of the deployment:
- `verify_deployment.sh` - Checks containers, services, and API endpoints
- `verify_migrations.sh` - Confirms database schema and tables are properly created
- `verify_frontend.sh` - Ensures frontend assets are correctly built
- `verify_schemas.sh` - Validates API schema files exist for proper imports
- Legacy `check_services.sh` - Checks container status and logs

### Manual Monitoring

#### Staging Environment

```bash
# Check container logs
ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com "cd /home/ubuntu/ultimate-marketing-team && docker-compose -f docker-compose.staging.yml logs --tail=20"

# Monitor resource usage
ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com "docker stats"

# Check API health
curl https://staging.tangible-studios.com/api/health
```

#### Local Environment

```bash
# Check container logs
docker-compose -f docker-compose.dev.yml logs --tail=20

# Monitor resource usage
docker stats

# Check API health
curl http://localhost:8000/api/health
```

## Troubleshooting

### PostgreSQL 17 Compatibility Issues

The project has been updated to use PostgreSQL 17-alpine. Key changes include:

1. **Database Creation Syntax**: PostgreSQL 17 requires a different syntax for creating databases on the fly:
   ```sql
   SELECT 'CREATE DATABASE mydatabase' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mydatabase')\gexec
   ```

2. **PGVector Extension**: We're using pgvector v0.6.0 which is compatible with PostgreSQL 17, with fallback to NO_JIT compilation if needed.

3. **Health Checks**: All health checks are properly configured for PostgreSQL 17.

If you encounter "build path ./monitoring does not exist" errors:
```bash
./scripts/deployment/fix_health_api.sh
```

### Database Connection Issues

If the API gateway can't connect to the database:

1. Check if the database is running:
   ```bash
   docker ps | grep postgres
   ```

2. Verify the container is healthy:
   ```bash
   docker inspect --format='{{.State.Health.Status}}' umt-postgres
   ```

3. Run the automatic fix script:
   ```bash
   scripts/deployment/fix_api_gateway_db.sh
   ```

### Migration Issues

For migration conflicts or multiple heads:

1. Check current migration status:
   ```bash
   docker exec umt-api-gateway bash -c "cd /app && python -m alembic heads"
   ```

2. If you see multiple heads, merge them:
   ```bash
   docker exec umt-api-gateway bash -c "cd /app && python -m alembic merge heads -m 'merge heads'"
   ```

3. Run migrations again:
   ```bash
   docker exec umt-api-gateway bash -c "cd /app && python -m alembic upgrade head"
   ```

### PGVector Issues

If you encounter pgvector-related errors:

1. Check if the extension is installed:
   ```bash
   docker exec umt-postgres psql -U postgres -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
   ```

2. If not, run the fix script:
   ```bash
   ./docker/postgres/fix_pgvector.sh umt-postgres umt
   ```

### Configuration Issues
   - Check if your environment file exists: `config/env/deployment.env.<environment>`
   - Verify SSH connection details in the environment file
   - Ensure script permissions: `chmod +x scripts/deployment/deploy_staging.sh`
   
### SSH Issues
   - Ensure your SSH key has correct permissions: `chmod 400 your_key.pem`
   - Test SSH connection: `ssh -i your_key.pem user@host`
   - For staging: `ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com`

### Docker Issues
   - Verify Docker is running: `docker ps`
   - Check Docker Compose is installed: `docker-compose --version`
   - Ensure the correct Docker Compose file is specified in the environment config

### EC2 Server Issues
   - Check security groups allow necessary ports (22, 80, 443)
   - Verify Docker service is running: `systemctl status docker`
   - Check system logs: `sudo journalctl -u docker`

### Permission Issues
   - If you see "Permission denied" errors during deployment:
     ```
     rm: cannot remove '/home/ubuntu/ultimate-marketing-team/something': Permission denied
     ```
   - This often happens with files created by Docker containers. The latest compact_deploy.sh script includes fixes for this, but you can also manually fix it:
     ```bash
     ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com "sudo chown -R ubuntu:ubuntu /home/ubuntu/ultimate-marketing-team"
     ```

### Container Startup Failures
   - If containers continuously restart:
     1. Check the specific container logs:
        ```bash
        ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com "cd /home/ubuntu/ultimate-marketing-team && docker-compose -f docker-compose.staging.yml logs api-gateway"
        ```
     2. Check for missing environment variables:
        ```bash
        ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com "cd /home/ubuntu/ultimate-marketing-team && cat .env"
        ```

### Missing Frontend Assets
   - If the frontend is loading but shows empty/broken pages:
     1. Check that the frontend container has the correct files:
        ```bash
        ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com "docker exec -it $(docker ps -q -f name=frontend) ls -la /usr/share/nginx/html"
        ```
     2. Run the frontend verification script:
        ```bash
        ./scripts/deployment/verify_frontend.sh
        ```

### API Schema Import Errors
   - If the API fails with import errors related to schemas:
     1. Verify the schemas directory exists in the API container:
        ```bash
        ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com "docker exec -it $(docker ps -q -f name=api-gateway) ls -la /app/src/schemas"
        ```
     2. Check the Dockerfile to ensure it's copying schemas:
        ```bash
        cat docker/api_gateway/Dockerfile | grep schemas
        ```
     3. Verify schema files locally:
        ```bash
        ./scripts/deployment/verify_schemas.sh
        ```

### AWS RDS Configuration

For PostgreSQL 17 on AWS RDS:

1. Enable the vector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. Verify RDS parameter group settings match your workload needs.

## Rollback Procedure

If a deployment has issues:

1. Identify which previous deployment was working
2. Use quick_deploy.sh to deploy that version:

```bash
./scripts/deployment/quick_deploy.sh <previous_working_archive> <environment>
```

3. Verify services are running correctly:

```bash
./scripts/deployment/check_services.sh <environment>
```

## SSL Configuration

SSL certificates are automatically set up during deployment.

### Staging SSL Configuration

SSL for staging.tangible-studios.com is provided through AWS Certificate Manager:

1. Certificates are managed in AWS Certificate Manager
2. The load balancer terminates SSL
3. No additional configuration needed on the EC2 instance

If SSL issues occur, check:
1. Certificate expiration in AWS Certificate Manager
2. Load balancer configuration
3. Security group settings (port 443 must be open)