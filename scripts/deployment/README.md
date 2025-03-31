# Deployment Scripts

This directory contains scripts for deploying the Ultimate Marketing Team application to different environments.

## Simplified Deployment Process

We have streamlined the deployment process into a single script that handles all steps:

1. **Package Creation** - Create a deployment package with necessary files
2. **Connection Testing** - Test SSH connection to the target environment
3. **Remote Deployment** - Upload package to the server and start services
4. **Verification & Fixes** - Verify deployment and fix issues (e.g., pgvector)

## Main Deployment Script

The primary script you should use for deployments:

```bash
# Deploy to staging environment
./scripts/deployment/deploy_staging.sh

# Test the deployment process without actually deploying
./scripts/deployment/deploy_staging.sh --dry-run

# Get help
./scripts/deployment/deploy_staging.sh --help
```

## Utility Scripts

- `fix_pgvector.sh` - Fixes pgvector extension issues in PostgreSQL containers
- `test_connection.sh` - Tests SSH connection to deployment environment
- `test_local_db.sh` - Tests local database configuration and setup
- `db_connect.sh` - Connect directly to the PostgreSQL database
  ```bash
  # Connect to main database
  ./scripts/deployment/db_connect.sh
  
  # Connect to vector database
  ./scripts/deployment/db_connect.sh vector
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
- `verify_migrations.sh` - Verifies database migrations are properly applied

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