# Deployment Summary

This project supports multiple deployment environments. Below is a summary of available deployment methods.

## 1. EC2 Deployment

**Description**: Deploy the application to an Amazon EC2 instance using Docker and Docker Compose.

**Command**:
```bash
./scripts/deployment/ec2/deploy.sh
```

**Customization**:
```bash
EC2_USER="ubuntu" EC2_HOST="ec2-44-202-29-233.compute-1.amazonaws.com" SSH_KEY="path/to/key.pem" ./scripts/deployment/ec2/deploy.sh
```

**Documentation**: [EC2 Deployment Guide](./EC2_DEPLOYMENT_GUIDE.md)

## 2. Shared Hosting Deployment

**Description**: Deploy the application to a shared hosting environment (tangible-studios.com).

**Command**:
```bash
./scripts/deployment/shared/deploy_staging.sh
```

**Customization**:
```bash
SSH_USER="username" SSH_HOST="ssh.tangible-studios.com" SSH_KEY="~/.ssh/id_rsa" ./scripts/deployment/shared/deploy_staging.sh
```

**Documentation**: [Staging Deploy Instructions](./STAGING_DEPLOY_INSTRUCTIONS.md)

## 3. Quick Deployment

**Description**: Fast deployment for development or small updates.

**Command**:
```bash
./scripts/deployment/shared/quick_deploy.sh
```

**Documentation**: [Simplified Staging Deploy](./SIMPLIFIED_STAGING_DEPLOY.md)

## Docker Compose Configurations

Multiple Docker Compose configurations are available for different environments:

- `docker-compose.yml` - Base configuration
- `docker-compose.dev.yml` - Development environment
- `docker-compose.test.yml` - Testing environment
- `docker-compose.staging.yml` - Staging environment (shared hosting)
- `docker-compose.ec2.yml` - EC2 deployment
- `docker-compose.production.yml` - Production environment
- `docker-compose.monitoring.yml` - Monitoring setup

## SSL Configuration

SSL certificates are required for secure HTTPS connections:

- For development: Use self-signed certificates with `./scripts/deployment/simple_ssl_setup.sh`
- For production: Follow the Let's Encrypt setup in the [EC2 Deployment Guide](./EC2_DEPLOYMENT_GUIDE.md)

## Deployment Archives

All deployments create an archive in the `deployment_archives/` directory for backup and rollback purposes.

## Setting Up a New Environment

To set up a new environment:

1. Create appropriate environment files (.env, frontend/.env)
2. Select the appropriate Docker Compose configuration
3. Run the deployment script for your target environment
4. Verify the deployment and check for any errors

For detailed setup instructions, see [Staging Setup](../setup/STAGING_SETUP.md).