# Simplified Staging Deployment Guide

This guide provides a streamlined approach to deploying the Ultimate Marketing Team application to the staging environment.

## Prerequisites

1. SSH access to the staging server
2. Docker and Docker Compose installed on both local and remote machines
3. Proper environment variables (credentials, API keys, etc.)

## One-Command Deployment

The simplified deployment script handles all deployment steps in a single command:

```bash
./scripts/deploy/simplified_staging_deploy.sh
```

This script will:
1. Build the frontend application (if available)
2. Create a deployment archive with all necessary files
3. Upload the archive to the staging server
4. Extract the files on the remote server
5. Start the Docker containers using docker-compose
6. Save a copy of the deployment archive to `deployment_archives/`

## Environment Variables

You can customize the deployment by setting these environment variables:

```bash
SSH_USER="your_ssh_user" SSH_HOST="your_ssh_host" ./scripts/deploy/simplified_staging_deploy.sh
```

Available variables:
- `SSH_USER`: SSH username (default: "tangible-studios.com")
- `SSH_HOST`: SSH hostname (default: "ssh.tangible-studios.com")
- `SSH_PORT`: SSH port (default: "22")
- `REMOTE_DIR`: Remote directory path (default: "/customers/8/2/5/tangible-studios.com/httpd.www/staging")
- `SSH_KEY`: SSH key path (default: "~/.ssh/id_rsa")

## Verifying Deployment

After deployment, verify that:
1. All Docker containers are running: `docker-compose ps`
2. The application is accessible at the staging URL
3. All services are functioning correctly

## Troubleshooting

If you encounter issues:

1. **SSH Connection Problems**: Verify SSH credentials and server availability
2. **Docker Issues**: Check if Docker and Docker Compose are installed and running
3. **Container Startup Failures**: Check Docker logs: `docker-compose -f docker-compose.staging.yml logs`
4. **Environment Configuration**: Verify that environment variables are correctly set

For more detailed troubleshooting, refer to [STAGING_DEPLOYMENT_TROUBLESHOOTING.md](STAGING_DEPLOYMENT_TROUBLESHOOTING.md)