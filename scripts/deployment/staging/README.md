# Staging Environment Tools

This directory contains utilities for managing the staging environment.

## Deployment

There are two deployment options:

```bash
# Option 1: Standard remote deployment script (recommended for production use)
./scripts/deployment/deploy_staging.sh

# Option 2: Enhanced local deployment with better database validation (for development)
./scripts/deployment/staging/deploy.sh
```

The `deploy.sh` script in this directory provides enhanced database validation and error recovery, but requires you to have Docker running locally. The `deploy_staging.sh` script in the parent directory is used for standard remote deployment.

## Management Tools

### SSH Connection

```bash
# Connect to staging server
./scripts/deployment/staging/connect.sh

# Run a command on staging without interactive session
./scripts/deployment/staging/connect.sh -c "docker ps"
```

### Environment Status

```bash
# Check the status of all services
./scripts/deployment/staging/status.sh
```

### Database Operations

```bash
# View available database commands
./scripts/deployment/staging/db_operations.sh help

# Check database status
./scripts/deployment/staging/db_operations.sh status

# Connect to database console
./scripts/deployment/staging/db_operations.sh console

# Create a database backup
./scripts/deployment/staging/db_operations.sh backup

# Check migrations
./scripts/deployment/staging/db_operations.sh migrations

# Check pgvector extension
./scripts/deployment/staging/db_operations.sh pgvector

# Fix pgvector issues
./scripts/deployment/staging/db_operations.sh fix-pgvector
```

## Staging Environment

- **URL**: https://staging.tangible-studios.com
- **EC2 Instance**: ec2-44-202-29-233.compute-1.amazonaws.com
- **SSH User**: ubuntu
- **SSH Key**: ultimate-marketing-staging.pem (in project root)

## Troubleshooting

If you encounter any issues with the deployment, check:

1. SSH key permissions: `chmod 400 ultimate-marketing-staging.pem`
2. Network connectivity to EC2: `ping ec2-44-202-29-233.compute-1.amazonaws.com`
3. Docker service on the server: `ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com "systemctl status docker"`
4. Container logs: `ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com "cd /home/ubuntu/ultimate-marketing-team && docker-compose -f docker-compose.staging.yml logs -f"`

### Common Deployment Errors

#### Permission Issues
If you see "Permission denied" errors during deployment:
```
rm: cannot remove '/home/ubuntu/ultimate-marketing-team/something': Permission denied
```

This often happens with files created by Docker containers. The latest compact_deploy.sh script includes fixes for this, but you can also manually fix it:
```bash
ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com "sudo chown -R ubuntu:ubuntu /home/ubuntu/ultimate-marketing-team"
```

#### Container Startup Failures
If containers continuously restart:
1. Check the specific container logs:
   ```bash
   ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com "cd /home/ubuntu/ultimate-marketing-team && docker-compose -f docker-compose.staging.yml logs api-gateway"
   ```

2. Check for missing environment variables:
   ```bash
   ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com "cd /home/ubuntu/ultimate-marketing-team && cat .env"
   ```

#### Missing Frontend Assets
If the frontend is loading but shows empty/broken pages:
1. Check that the frontend container has the correct files:
   ```bash
   ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com "docker exec -it \$(docker ps -q -f name=frontend) ls -la /usr/share/nginx/html"
   ```

2. Run the frontend verification script:
   ```bash
   ./scripts/deployment/verify_frontend.sh
   ```