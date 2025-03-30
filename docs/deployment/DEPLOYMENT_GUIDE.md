# Ultimate Marketing Team - Deployment Guide

This guide provides comprehensive instructions for deploying the Ultimate Marketing Team application to all environments.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Environment Setup](#environment-setup)
3. [PostgreSQL Configuration](#postgresql-configuration)
4. [Deployment Steps](#deployment-steps)
   - [Staging Deployment](#staging-deployment)
   - [EC2 Deployment](#ec2-deployment)
   - [Production Deployment](#production-deployment)
5. [Verification and Monitoring](#verification-and-monitoring)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedure](#rollback-procedure)
8. [SSL Configuration](#ssl-configuration)

## Deployment Overview

The Ultimate Marketing Team application can be deployed to multiple environments:

- **Staging Environment** - Shared hosting at staging.tangible-studios.com
- **EC2 Environment** - AWS EC2 instance for more control and scalability
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

The deployment system uses a unified directory structure:

```
scripts/deployment/
├── staging/                   # Staging-specific deployment scripts
│   ├── deploy.sh              # Main staging deployment script
│   ├── quick_deploy.sh        # Fast deployment with existing archive
│   └── check_services.sh      # Check services status
├── ec2/                       # EC2-specific deployment scripts
│   ├── deploy.sh              # Main EC2 deployment script
│   ├── fix_services.sh        # Fix services if needed
│   └── check_services.sh      # Check service status
├── shared/                    # Shared deployment utilities
│   └── ssl_setup.sh           # SSL certificate setup
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

#### Standard Deployment

Deploy to the shared hosting staging environment:

```bash
./scripts/deployment/staging/deploy.sh
```

This creates a fresh archive and deploys it to the staging server.

#### Customization Options

```bash
SSH_USER=username SSH_HOST=hostname SSH_KEY=~/.ssh/keyfile ./scripts/deployment/staging/deploy.sh
```

Available variables:
- `SSH_USER`: SSH username (default: tangible-studios.com)
- `SSH_HOST`: Server hostname (default: ssh.tangible-studios.com)
- `SSH_PORT`: SSH port (default: 22)
- `REMOTE_DIR`: Remote directory (default: /customers/8/2/5/tangible-studios.com/httpd.www/staging)
- `SSH_KEY`: Path to SSH key file (default: ~/.ssh/id_rsa)

#### Quick Deployment with Existing Archive

For faster deployment using an existing archive:

```bash
./scripts/deployment/staging/quick_deploy.sh staging_deploy_20250330_120000.tar.gz
```

### EC2 Deployment

#### First-Time Deployment

Deploy to an AWS EC2 instance:

```bash
SSH_KEY=path/to/key.pem ./scripts/deployment/ec2/deploy.sh
```

This script will:
1. Build the frontend application
2. Create and upload a deployment archive
3. Set up Docker and Docker Compose if needed
4. Start all services
5. Configure SSL certificates

#### Customization Options

```bash
SSH_USER=ubuntu SSH_HOST=ec2-instance.amazonaws.com SSH_KEY=path/to/key.pem ./scripts/deployment/ec2/deploy.sh
```

Available variables:
- `SSH_USER`: SSH username (default: ubuntu)
- `SSH_HOST`: EC2 hostname or IP (default: ec2-44-202-29-233.compute-1.amazonaws.com)
- `SSH_PORT`: SSH port (default: 22)
- `REMOTE_DIR`: Remote directory (default: /home/ubuntu/ultimate-marketing-team)
- `SSH_KEY`: Path to SSH key file (required)

#### Fixing Services

If EC2 services aren't starting properly:

```bash
SSH_KEY=path/to/key.pem ./scripts/deployment/ec2/fix_services.sh
```

### Production Deployment

Production deployment follows similar steps to staging, but with additional safeguards:

```bash
./scripts/deployment/production/deploy.sh
```

## Verification and Monitoring

### Service Health Checks

After deployment, verify services are running correctly:

```bash
# For staging:
./scripts/deployment/staging/check_services.sh

# For EC2:
SSH_KEY=path/to/key.pem ./scripts/deployment/ec2/check_services.sh
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
ssh user@host "cd /path && docker-compose -f docker-compose.staging.yml logs --tail=20"

# Monitor resource usage
ssh user@host "docker stats"
```

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Verify SSH credentials and key permissions (`chmod 400 keyfile.pem`)
   - Test connection: `ssh -i keyfile.pem user@host`
   - Check network rules and security groups (for EC2)

2. **Container Startup Failures**
   - Check environment variables in `.env` files
   - Verify Docker and Docker Compose versions
   - Inspect container logs

3. **Database Issues**
   - Verify PostgreSQL container is running
   - Check migrations with `docker-compose logs migrations`
   - Test database connection

4. **EC2-Specific Issues**
   - Ensure instance has sufficient resources
   - Check security groups allow necessary ports (80, 443, etc.)
   - Verify Docker service is running: `systemctl status docker`

### AWS RDS Configuration

For the production environment on AWS RDS PostgreSQL 17:

1. Enable the vector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. Verify RDS parameter group settings are appropriate for the workload.

## Rollback Procedure

If a deployment introduces issues:

1. Identify the problem using the check_services.sh script

2. For staging environment:
   ```bash
   ./scripts/deployment/staging/quick_deploy.sh staging_deploy_PREVIOUS_VERSION.tar.gz
   ```

3. For EC2 environment:
   ```bash
   SSH_KEY=path/to/key.pem ./scripts/deployment/ec2/fix_services.sh
   ```

4. Verify services are working after rollback.

## SSL Configuration

SSL certificates are automatically set up during deployment. For manual setup:

### Staging SSL

SSL is managed by the hosting provider for staging.tangible-studios.com.

### EC2 SSL

For EC2, SSL is set up using Let's Encrypt:

```bash
SSH_KEY=path/to/key.pem ssh -i path/to/key.pem ubuntu@ec2-instance
cd /home/ubuntu/ultimate-marketing-team
./scripts/deployment/shared/ssl_setup.sh
```

This script will:
1. Install certbot
2. Obtain certificates for your domain
3. Configure nginx with the SSL certificates
4. Set up auto-renewal