# Deployment Scripts

This directory contains scripts for deploying the Ultimate Marketing Team application to different environments.

## Deployment Process

The deployment process consists of the following steps:

1. **Connection Testing** - Test SSH connection to the target environment
2. **Configuration Setup** - Ensure environment-specific configuration files exist
3. **Package Creation** - Create a deployment package with necessary files
4. **Remote Deployment** - Upload package to the server and start services
5. **Post-Deployment Fixes** - Apply any necessary fixes (e.g., pgvector installation)
6. **Verification** - Verify that the deployment was successful

## Available Scripts

### General Scripts

- `test_connection.sh [environment]` - Test SSH connection to environment
- `verify_deployment.sh [environment]` - Verify deployment was successful
- `fix_pgvector.sh` - Fix pgvector extension if it was not installed correctly

### Staging Environment Scripts

- `staging/deploy.sh` - Standard deployment to staging
- `staging/compact_deploy.sh` - Optimized deployment with minimal package size
- `staging/check_services.sh` - Check if services are running in staging

## Staging Deployment

For deploying to the staging environment, use:

```bash
# Test connection first
./scripts/deployment/test_connection.sh staging

# Deploy using compact method (optimized for low bandwidth)
./scripts/deployment/staging/compact_deploy.sh

# Verify deployment
./scripts/deployment/verify_deployment.sh staging
```

## Environment Configuration

Environment-specific configuration is stored in:
- `config/env/.env.<environment>` - Application environment variables
- `config/env/deployment.env.<environment>` - Deployment configuration

## Verification Scripts

The deployment includes several verification scripts to ensure everything is working correctly:

- `verify_deployment.sh` - Main verification script that runs on the server
- `verify_frontend.sh` - Verifies frontend build files exist locally before deployment
- `verify_schemas.sh` - Verifies required schema files exist locally before deployment

## Troubleshooting

If services are not starting correctly:

1. Check logs: `docker-compose logs -f <service-name>`
2. Verify environment variables: `cat .env` on the remote server
3. Check PostgreSQL vector extension: `./scripts/deployment/fix_pgvector.sh`
4. Verify network connectivity: `docker network inspect umt-network`
5. Check container filesystem: `docker exec -it <container-id> ls -la /path/to/check`

## Common Issues

### pgvector Extension

The PostgreSQL vector extension (pgvector) may fail to initialize if not properly installed. 
If this happens, the `fix_pgvector.sh` script can be used to fix it:

```bash
ssh -i <ssh-key> <user>@<host> "cd <remote-dir> && ./scripts/deployment/fix_pgvector.sh"
```

### Frontend Build

If the frontend is not building correctly:
- Ensure Node.js and npm are installed and up to date
- Run `cd frontend && npm ci && npm run build` to test the build process
- Check for any TypeScript errors with `npm run typecheck`
- Verify the built files exist in `frontend/dist` directory

### API Schemas

If the API is failing with import errors:
- Ensure the `src/schemas` directory exists and contains all required files
- Check that `src/schemas/template.py` exists and has the correct class definitions
- Verify the Dockerfile includes the schemas directory in the COPY commands

### Frontend Configuration

If the frontend is not loading correctly, ensure that:
- `frontend/.env.staging` exists in the deployment package
- The API endpoint is correctly configured in the environment file
- The frontend container has restarted after any configuration changes
- The Dockerfile has the correct paths for copying frontend files
- Nginx configuration is correctly set up for API proxying