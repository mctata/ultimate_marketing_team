# Ultimate Marketing Team - Deployment Guide

This guide provides comprehensive instructions for deploying the Ultimate Marketing Team application to different environments.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Environment Setup](#environment-setup)
3. [PostgreSQL Configuration](#postgresql-configuration)
4. [Deployment Steps](#deployment-steps)
5. [Verification and Monitoring](#verification-and-monitoring)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedure](#rollback-procedure)

## Deployment Overview

The Ultimate Marketing Team application can be deployed to:

- **Staging Environment** - For testing before production
- **Production Environment** - Live environment for end users

All environments use Docker and Docker Compose for containerization.

## Environment Setup

### Prerequisites

Before deploying, ensure you have:

- SSH access to the target server
- Docker and Docker Compose installed locally
- Appropriate SSH key file

### Directory Structure

The deployment system uses the following structure:

```
scripts/deployment/
├── staging/                   # Staging-specific deployment scripts
│   ├── deploy.sh              # Main staging deployment script
│   ├── quick_deploy.sh        # Fast deployment with existing archive
│   └── check_services.sh      # Check services status
├── production/                # Production deployment scripts
├── test_connection.sh         # Test SSH connection and prerequisites
├── verify_deployment_setup.sh # Verify deployment configuration
└── quick_deploy.sh            # General quick deployment script

deployments/
├── archives/                  # Deployment archives
│   ├── staging/               # Staging deployment archives
│   └── production/            # Production deployment archives
└── secrets/                   # Environment credentials (gitignored)
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

The vector extension is installed using the `install_pgvector.sql` script which:
1. Creates the vector extension
2. Verifies it works with a simple test
3. Ensures compatibility with our application requirements

## Deployment Steps

### Step 1: Verify Setup

First, verify your deployment setup is correct:

```bash
./scripts/deployment/verify_deployment_setup.sh
```

This ensures all required scripts and directories exist and have the correct permissions.

### Step 2: Test Connection

Test your connection to the target server:

```bash
./scripts/deployment/test_connection.sh
```

This checks SSH connectivity, write permissions, and Docker availability.

### Step 3: Deploy Application

#### Option A: Full Deployment (New Archive)

For a complete deployment with a fresh archive:

```bash
./scripts/deployment/staging/deploy.sh
```

This script will:
- Create a deployment archive
- Save a copy for future reference
- Upload and extract on the server
- Start Docker containers

#### Option B: Quick Deployment (Existing Archive)

For faster deployment using an existing archive:

```bash
./scripts/deployment/staging/quick_deploy.sh staging_deploy_20250330_120000.tar.gz
```

Replace the filename with your actual archive from `deployments/archives/staging/`.

### Step 4: Verify Deployment

After deployment, check if all services are running properly:

```bash
./scripts/deployment/staging/check_services.sh
```

This will show container status, logs, and verify API health.

## Verification and Monitoring

### Service Health Checks

The `check_services.sh` script provides comprehensive health information:

- Running container status
- Container logs (last 10 lines)
- API endpoint health
- Database connection status

### Monitoring Commands

To monitor the application manually:

```bash
# Check API health
curl https://staging.tangible-studios.com/api/health

# Check container logs
ssh user@host "cd /path && docker-compose -f docker-compose.staging.yml logs --tail=20"
```

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Verify SSH credentials and key permissions (`chmod 400 keyfile.pem`)
   - Check network connectivity to the server

2. **Container Startup Failures**
   - Check environment variables in `.env` files
   - Verify Docker and Docker Compose versions on the server
   - Inspect container logs for specific errors

3. **Database Issues**
   - Verify PostgreSQL container is running
   - Check that migrations have been applied
   - Validate vector extension installation

### AWS RDS Configuration

For the production environment on AWS RDS PostgreSQL 17:

1. Enable the vector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. Verify RDS parameter group settings:
   - Ensure `shared_preload_libraries` includes required extensions
   - Set appropriate `max_connections` for your workload

3. Test vector operations after setup:
   ```sql
   CREATE TABLE test_vectors (id serial PRIMARY KEY, embedding vector(3));
   INSERT INTO test_vectors (embedding) VALUES ('[1,2,3]');
   SELECT * FROM test_vectors;
   DROP TABLE test_vectors;
   ```

## Rollback Procedure

If a deployment introduces issues:

1. Identify the problem using `check_services.sh`
2. Use `quick_deploy.sh` with a previous working archive:
   ```bash
   ./scripts/deployment/staging/quick_deploy.sh staging_deploy_PREVIOUS_VERSION.tar.gz
   ```
3. Verify services are working correctly after rollback