# Staging Deployment

This directory contains scripts for deploying to the staging environment.

## Deployment Options

### Standard Deployment

To deploy to staging with a single command, run:

```bash
./scripts/deployment/staging/deploy.sh
```

This script:
1. Sets up configuration files
2. Deploys to the staging EC2 instance
3. Automatically fixes any known issues (such as pgvector extensions)
4. Restarts services if needed

### Compact Deployment (for slow connections)

If you're experiencing timeouts or slow uploads, use the compact deploy script:

```bash
./scripts/deployment/staging/compact_deploy.sh
```

This creates a minimal deployment package with only essential files, making it faster to upload over limited bandwidth connections.

## Staging Environment

- **URL**: https://staging.tangible-studios.com
- **EC2 Instance**: ec2-44-202-29-233.compute-1.amazonaws.com
- **SSH User**: ubuntu
- **SSH Key**: ultimate-marketing-staging.pem (in project root)

## Troubleshooting

If you encounter any issues with the deployment, check:

1. SSH key permissions: `chmod 400 ultimate-marketing-staging.pem`
2. Network connectivity to EC2
3. Docker service on the server: `systemctl status docker`
4. Container logs: `docker-compose logs -f`