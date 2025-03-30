# Ultimate Marketing Team - Deployment Guide

This guide provides comprehensive instructions for deploying the Ultimate Marketing Team application to all environments.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Environment Setup](#environment-setup)
3. [PostgreSQL Configuration](#postgresql-configuration)
4. [Deployment Steps](#deployment-steps)
   - [Staging Deployment](#staging-deployment)
   - [Production Deployment](#production-deployment)
5. [Verification and Monitoring](#verification-and-monitoring)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedure](#rollback-procedure)
8. [SSL Configuration](#ssl-configuration)

## Deployment Overview

The Ultimate Marketing Team application can be deployed to the following environments:

- **Staging Environment** - AWS EC2 instance at staging.tangible-studios.com
- **Production Environment** - Live environment for end users

All environments use Docker and Docker Compose for containerization, ensuring consistency across deployments.

## Environment Setup

### Prerequisites

Before deploying, ensure you have:

- SSH access to the target server
- Docker and Docker Compose installed locally
- Appropriate SSH key file
- Proper permissions to the deployment directories

### Directory Structure

The deployment system uses the following directory structure:

```
scripts/deployment/
├── staging/                   # Staging-specific deployment scripts
│   ├── deploy.sh              # Main staging deployment script
│   ├── quick_deploy.sh        # Fast deployment with existing archive
│   └── check_services.sh      # Check services status
├── deploy_staging.sh          # Legacy staging deployment script
├── check_staging_services.sh  # Legacy script to check staging services
├── quick_deploy.sh            # General quick deployment script
├── test_connection.sh         # Test SSH connection and prerequisites
├── test_local_db.sh           # Test local PostgreSQL setup
└── verify_deployment_setup.sh # Verify deployment configuration

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

The vector extension is installed via initialization scripts during container startup.

### Database Connections

- **Staging Database**: ultimatemarketing-staging.c0dcu2ywapx7.us-east-1.rds.amazonaws.com
- **Production Database**: (Configure in secrets file)

## Deployment Steps

### Preparation Steps for All Environments

1. Verify your deployment setup:
   ```bash
   ./scripts/deployment/verify_deployment_setup.sh
   ```

2. Test connection to the target server:
   ```bash
   ./scripts/deployment/test_connection.sh
   ```

### Staging Deployment

The staging environment runs on AWS EC2 at staging.tangible-studios.com.

#### Standard Deployment (Recommended)

Deploy using the staging-specific deployment script:

```bash
./scripts/deployment/staging/deploy.sh
```

This creates a fresh archive and deploys it to the staging server.

#### Legacy Deployment Script

There's also a legacy deployment script available:

```bash
./scripts/deployment/deploy_staging.sh
```

Both scripts perform similar functions, but the staging-specific script includes additional checks and better organization.

#### Customization Options

You can customize the deployment with environment variables:

```bash
SSH_USER=ubuntu SSH_HOST=ec2-44-202-29-233.compute-1.amazonaws.com SSH_KEY=ultimate-marketing-staging.pem ./scripts/deployment/staging/deploy.sh
```

Available variables:
- `SSH_USER`: SSH username (default: ubuntu)
- `SSH_HOST`: EC2 hostname (default: ec2-44-202-29-233.compute-1.amazonaws.com)
- `SSH_PORT`: SSH port (default: 22)
- `REMOTE_DIR`: Remote directory (default: /home/ubuntu/ultimate-marketing-team)
- `SSH_KEY`: Path to SSH key file (default: ultimate-marketing-staging.pem)

#### Quick Deployment with Existing Archive

For faster deployment using an existing archive:

```bash
./scripts/deployment/staging/quick_deploy.sh staging_deploy_20250330_120000.tar.gz
```

This option is useful when:
- Redeploying the same version
- Rolling back to a previous version
- Deploying to multiple instances

### Production Deployment

Production deployment will follow similar steps to staging, with additional safeguards. The production deployment script is still in development:

```bash
# To be implemented
# ./scripts/deployment/production/deploy.sh
```

## Verification and Monitoring

### Service Health Checks

After deployment, verify services are running correctly:

```bash
# Using the recommended script
./scripts/deployment/staging/check_services.sh

# Or the legacy script
./scripts/deployment/check_staging_services.sh
```

These scripts show:
- Running container status
- Container logs
- API endpoint health
- Database connection status

### Manual Monitoring

```bash
# Check API health
curl https://staging.tangible-studios.com/api/health

# Check container logs
ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com "cd /home/ubuntu/ultimate-marketing-team && docker-compose -f docker-compose.staging.yml logs --tail=20"

# Monitor resource usage
ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com "docker stats"
```

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Verify SSH credentials and key permissions (`chmod 400 keyfile.pem`)
   - Test connection: `ssh -i keyfile.pem user@host`
   - Check AWS security groups allow SSH on port 22
   - Verify the EC2 instance is running

2. **Container Startup Failures**
   - Check environment variables in `.env` files
   - Verify Docker and Docker Compose versions on the server
   - Inspect container logs with `docker-compose logs`
   - Check disk space with `df -h`

3. **Database Issues**
   - Verify PostgreSQL container is running
   - Check migrations with `docker-compose logs migrations`
   - Test database connection
   - Verify RDS connection settings if using external database

4. **EC2 Server Issues**
   - Ensure instance has sufficient resources (CPU/Memory)
   - Check security groups allow necessary ports (80, 443, etc.)
   - Verify Docker service is running: `systemctl status docker`
   - Check system logs: `sudo journalctl -u docker`

### AWS RDS Configuration

For PostgreSQL 17 on AWS RDS:

1. Enable the vector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. Verify RDS parameter group settings match your workload needs.

## Rollback Procedure

If a deployment introduces issues:

1. Identify the problem using the check_services.sh script

2. Roll back using the quick deployment script with a previous archive:
   ```bash
   ./scripts/deployment/staging/quick_deploy.sh staging_deploy_PREVIOUS_VERSION.tar.gz
   ```

3. Verify services are working after rollback.

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