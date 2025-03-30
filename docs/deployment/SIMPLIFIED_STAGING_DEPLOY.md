# Simplified Staging Deployment Guide

This guide provides a simplified process for deploying to the staging environment.

## Prerequisites

- SSH access to the staging server
- Appropriate SSH key file

## Quick Start

### Standard Deployment

To deploy to the staging environment:

```bash
./scripts/deployment/staging/deploy.sh
```

This script will:

1. Create a deployment archive with all necessary files
2. Save a copy of the archive to `deployments/archives/staging/` for future reference
3. Upload the archive to the staging server
4. Extract files on the server
5. Start or restart all Docker containers

### Quick Deployment

If you already have a deployment archive (useful for deploying the same version multiple times):

```bash
./scripts/deployment/staging/quick_deploy.sh staging_deploy_20250330_120000.tar.gz
```

Replace `staging_deploy_20250330_120000.tar.gz` with the name of your archive file (stored in `deployments/archives/staging/`).

## Customizing Deployment

You can customize the deployment with environment variables:

```bash
SSH_USER=username SSH_HOST=hostname SSH_KEY=~/.ssh/keyfile ./scripts/deployment/staging/deploy.sh
```

Available variables:

- `SSH_USER`: SSH username (default: tangible-studios.com)
- `SSH_HOST`: Hostname (default: ssh.tangible-studios.com)
- `SSH_PORT`: SSH port (default: 22)
- `REMOTE_DIR`: Remote directory (default: /customers/8/2/5/tangible-studios.com/httpd.www/staging)
- `SSH_KEY`: Path to SSH key file (default: ~/.ssh/id_rsa)

## Checking Services

To check the status of deployed services:

```bash
./scripts/deployment/staging/check_services.sh
```

This will display:
- Running containers
- Container logs
- Service status

## Troubleshooting

If services are not starting properly:

1. Check logs for errors:
```bash
./scripts/deployment/staging/check_services.sh
```

2. Make sure Docker and Docker Compose are installed on the server

3. Verify environment files contain the correct configuration

4. Ensure the SSH key has the correct permissions:
```bash
chmod 400 path/to/your/key.pem
```