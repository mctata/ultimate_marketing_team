# Staging Deployment Instructions

This document provides simple instructions for deploying to the staging environment.

## Prerequisites

- SSH access to the staging server
- SSH key for authentication

## Deployment

To deploy to staging, simply run:

```bash
./scripts/deploy_staging.sh
```

This script will:
1. Create a deployment archive with all necessary files
2. Upload the archive to the staging server
3. Extract files on the server
4. Make scripts executable
5. Start all services using Docker Compose

## Customizing Deployment

You can customize the deployment with environment variables:

```bash
SSH_USER=username SSH_HOST=hostname SSH_KEY=~/.ssh/keyfile ./scripts/deploy_staging.sh
```

Available environment variables:
- `SSH_USER`: SSH username (default: tangible-studios.com)
- `SSH_HOST`: Server hostname (default: ssh.tangible-studios.com)
- `SSH_PORT`: SSH port (default: 22)
- `REMOTE_DIR`: Remote directory (default: /customers/8/2/5/tangible-studios.com/httpd.www/staging)
- `SSH_KEY`: Path to SSH key file (default: ~/.ssh/id_rsa)

## Checking Service Status

To check the status of all services:

```bash
./scripts/check_staging_services.sh
```

This will:
- Connect to the staging server
- Show all running containers
- Display recent logs for each service

## Troubleshooting

If deployment fails:
1. Check if you have the correct SSH credentials
2. Verify Docker and Docker Compose are installed on the staging server
3. Ensure all required environment variables are set
4. Check service logs using `./scripts/check_staging_services.sh`

## Important Notes

### PostgreSQL Version

The staging environment uses PostgreSQL 17. Make sure any local development is compatible with PostgreSQL 17 features and syntax.

### Database Connection

The staging database is hosted at:
```
ultimatemarketing-staging.c0dcu2ywapx7.us-east-1.rds.amazonaws.com
```

The `POSTGRES_HOST` environment variable must be set correctly in your .env file.