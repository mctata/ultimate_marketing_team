# Ultimate Marketing Team Deployment

This directory contains scripts for deploying and managing the Ultimate Marketing Team application.

## Main Deployment Script

```bash
# Deploy to staging environment
./scripts/deployment/deploy_staging.sh

# Test the deployment process (dry run)
./scripts/deployment/deploy_staging.sh --dry-run

# View help options
./scripts/deployment/deploy_staging.sh --help
```

## Database Connection

For quick PostgreSQL access:

```bash
# Connect to main database
./scripts/deployment/db_connect.sh

# Connect to vector database
./scripts/deployment/db_connect.sh vector
```

## Utility Scripts

- `fix_pgvector.sh` - Fixes pgvector extension issues in PostgreSQL
- `test_connection.sh` - Tests SSH connection to deployment environment
- `verify_deployment.sh` - Verifies a completed deployment works correctly

## Staging Management Tools

- `staging/connect.sh` - SSH into the staging server
- `staging/status.sh` - Check status of the staging environment 
- `staging/db_operations.sh` - Advanced database operations on staging

## Troubleshooting

If services are not starting correctly:

1. Verify PostgreSQL pgvector extension with `fix_pgvector.sh`
2. Check connection with `test_connection.sh`
3. For database-specific issues, use `db_connect.sh` to inspect tables directly