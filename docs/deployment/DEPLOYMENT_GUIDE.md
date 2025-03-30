# Ultimate Marketing Team - Deployment Guide

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

All deployment scripts now support multiple environments by passing the environment name as a parameter, with credentials securely fetched from Bitwarden.

### Prerequisites

Before deploying, ensure you have the following prerequisites installed:

1. **Bitwarden CLI**:
   ```bash
   npm install -g @bitwarden/cli
   ```

2. **jq (JSON processor)**:
   ```bash
   # On macOS with Homebrew
   brew install jq
   
   # On Ubuntu/Debian
   sudo apt-get install jq
   
   # On CentOS/RHEL
   sudo yum install jq
   ```

3. **Login to Bitwarden**:
   ```bash
   bw login
   ```

4. **Verify your Bitwarden has the correct items**:
   - An item named "deployment-{environment}" (e.g., "deployment-staging") with fields:
     - SSH_USER
     - SSH_HOST
     - SSH_PORT
     - REMOTE_DIR
     - SSH_KEY
     - COMPOSE_FILE
   - An item named "env-{environment}" (e.g., "env-staging") with your application environment variables

### Setting Up Credentials

Before deploying, fetch the secure credentials from Bitwarden:

```bash
# Unlock your Bitwarden vault first if needed
bw unlock

# Fetch credentials for the target environment
./scripts/utilities/fetch_secrets.sh staging
```

After running this command, verify that the configuration files were created:
```bash
ls -la config/env/deployment.env.staging
ls -la config/env/.env.staging
```

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
# Check services on staging (default)
./scripts/deployment/check_services.sh

# Check services on local environment
./scripts/deployment/check_services.sh local
```

This script will show:
- Running container status
- Container logs (last 10 lines)
- API endpoint health

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

### Common Issues

1. **Bitwarden and Secret Management Issues**
   - Check that Bitwarden CLI is installed: `which bw`
   - Install jq if missing: `brew install jq` (macOS) or `apt-get install jq` (Ubuntu)
   - Verify Bitwarden status: `bw status` (should show "unlocked")
   - Unlock Bitwarden if needed: `bw unlock`
   - Check that your items exist in Bitwarden:
     ```bash
     # List all items
     bw list items
     
     # Find specific item
     bw list items --search "deployment-staging"
     ```
   - Ensure script permissions: `chmod +x scripts/utilities/fetch_secrets.sh`
   - Check for proper item structure in your Bitwarden vault

2. **Configuration Issues**
   - Check if your environment file exists: `config/env/deployment.env.<environment>`
   - Verify SSH connection details in the environment file
   - Make sure you've run the fetch_secrets.sh script before deploying
   
3. **SSH Issues**
   - Ensure your SSH key has correct permissions: `chmod 400 your_key.pem`
   - Test SSH connection: `ssh -i your_key.pem user@host`
   - For staging: `ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com`
   - Verify key path in Bitwarden matches actual location on your system

4. **Docker Issues**
   - Verify Docker is running: `docker ps`
   - Check Docker Compose is installed: `docker-compose --version`
   - Ensure the correct Docker Compose file is specified in the environment config

5. **EC2 Server Issues**
   - Check security groups allow necessary ports (22, 80, 443)
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