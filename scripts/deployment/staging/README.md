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
# First, test the connection
./scripts/deployment/test_connection.sh

# Then run the compact deployment
./scripts/deployment/staging/compact_deploy.sh

# After deployment, verify it was successful
./scripts/deployment/verify_deployment.sh
./scripts/deployment/verify_migrations.sh
```

This creates a minimal deployment package with only essential files, making it faster to upload over limited bandwidth connections.

#### What the compact_deploy.sh script does:

1. **Preparation**:
   - Verifies configuration files exist
   - Builds the frontend application
   - Verifies frontend build and schema files

2. **Packaging**:
   - Creates a minimal archive (usually <2MB)
   - Only includes essential code and configuration
   - Excludes node_modules, venv, and other large directories

3. **Deployment**:
   - Transfers archive to staging server
   - Extracts files with proper permissions
   - Sets up Docker containers
   - Installs pgvector extension
   - Applies database migrations

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