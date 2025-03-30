# Deployment Summary

This document summarizes the deployment options available for the Ultimate Marketing Team application.

## Deployment Environments

### Staging Environment

The staging environment is available at `https://staging.tangible-studios.com` and is hosted on a shared hosting provider.

**Deployment Commands:**
```bash
# Test connection and prerequisites before deployment
./scripts/deployment/test_connection.sh

# Standard deployment 
./scripts/deployment/deploy_staging.sh

# Quick deployment with existing archive
./scripts/deployment/quick_deploy.sh <archive_name>

# Check service status
./scripts/deployment/check_services.sh
```

For detailed instructions, see [Simplified Staging Deploy](SIMPLIFIED_STAGING_DEPLOY.md).

### EC2 Environment

The EC2 deployment is available at `https://staging.tangible-studios.com` (same domain, different server) and is hosted on AWS EC2.

**Deployment Commands:**
```bash
# Deploy to EC2
SSH_KEY=ultimate-marketing-staging.pem ./scripts/deployment/ec2_deploy.sh

# Check service status
SSH_KEY=ultimate-marketing-staging.pem ./scripts/deployment/check_services.sh

# Fix services if needed
SSH_KEY=ultimate-marketing-staging.pem ./scripts/deployment/fix_staging_services.sh
```

For detailed instructions, see [EC2 Deployment Guide](EC2_DEPLOYMENT_GUIDE.md).

## Project Organization

### Deployment Scripts

All deployment scripts are organized in the `scripts/deployment/` directory:

```
scripts/deployment/
├── deploy_staging.sh          # Main staging deployment script
├── ec2_deploy.sh              # EC2 deployment script
├── check_services.sh          # Check services status
├── fix_staging_services.sh    # Fix services if needed
├── quick_deploy.sh            # Fast deployment with existing archive
├── test_connection.sh         # Test SSH connection and deployment prerequisites
├── test_local_db.sh           # Test local PostgreSQL setup
└── simple_ssl_setup.sh        # SSL certificate setup
```

### Deployment Assets

Deployment assets are organized in the `deployments/` directory:

```
deployments/
├── archives/                  # Deployment archives for all environments
│   ├── staging/               # Staging deployment archives
│   └── production/            # Production deployment archives
└── secrets/                   # Environment credentials (gitignored)
    ├── .env.staging.real      # Staging environment variables
    └── frontend.env.staging.real  # Frontend staging environment variables
```

## Database Configuration

All environments now use the `ankane/pgvector` PostgreSQL image with vector extension support:

```yaml
postgres:
  image: ankane/pgvector:latest
  volumes:
    - postgres-data:/var/lib/postgresql/data
    - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/1_init.sql
    - ./docker/postgres/integration_upgrade.sql:/docker-entrypoint-initdb.d/2_integration_upgrade.sql
    - ./docker/postgres/install_pgvector.sql:/docker-entrypoint-initdb.d/3_install_pgvector.sql
```

For detailed information on the PostgreSQL configuration, see [PostgreSQL Version Upgrade](POSTGRES_VERSION_UPGRADE.md).

## Deployment Process

The general deployment process is as follows:

1. **Create Archive**: Package the application code into a deployment archive
2. **Transfer**: Upload the archive to the target server
3. **Extract**: Extract the archive on the server
4. **Configure**: Apply environment-specific configurations
5. **Start Services**: Start Docker containers and services
6. **Verify**: Verify that all services are running correctly

## Continuous Integration/Deployment

Automated deployments can be set up using GitHub Actions or similar CI/CD tools.

Sample workflow:
1. Push changes to the `staging` branch
2. Automated tests run
3. On test success, deploy to staging environment
4. Push changes to the `main` branch
5. Automated tests run
6. On test success, deploy to production environment

## Rollback Procedure

If a deployment fails or introduces issues:

1. Identify the issue using the check_services.sh script
2. Use quick_deploy.sh with a previous known-good archive
3. If that doesn't work, use fix_services.sh to rebuild and restart services