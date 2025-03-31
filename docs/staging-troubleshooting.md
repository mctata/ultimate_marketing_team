# Staging Environment Troubleshooting Guide

This document provides guidance for resolving common issues with the staging environment, especially after upgrading to PostgreSQL 17.

## PostgreSQL 17 Compatibility

The project has been updated to use PostgreSQL 17-alpine. Key changes include:

1. **Database Creation Syntax**: PostgreSQL 17 requires a different syntax for creating databases on the fly:
   ```sql
   SELECT 'CREATE DATABASE mydatabase' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mydatabase')\gexec
   ```

2. **PGVector Extension**: We're using pgvector v0.6.0 which is compatible with PostgreSQL 17, with fallback to NO_JIT compilation if needed.

3. **Health Checks**: All health checks are properly configured for PostgreSQL 17.

## Deployment Process

The staging deployment now follows a specific sequence:

1. Database startup and initialization
2. Database proxy to ensure schema exists
3. Migrations run with proper dependency checking
4. Application services startup with health verification
5. Automatic repair script for common issues

## Common Issues and Solutions

### Database Connection Issues

If the API gateway can't connect to the database:

1. Check if the database is running:
   ```bash
   docker ps | grep postgres
   ```

2. Verify the container is healthy:
   ```bash
   docker inspect --format='{{.State.Health.Status}}' umt-postgres
   ```

3. Run the automatic fix script:
   ```bash
   scripts/deployment/fix_api_gateway_db.sh
   ```

### Migration Issues

For migration conflicts or multiple heads:

1. Check current migration status:
   ```bash
   docker exec umt-api-gateway bash -c "cd /app && python -m alembic heads"
   ```

2. If you see multiple heads, merge them:
   ```bash
   docker exec umt-api-gateway bash -c "cd /app && python -m alembic merge heads -m 'merge heads'"
   ```

3. Run migrations again:
   ```bash
   docker exec umt-api-gateway bash -c "cd /app && python -m alembic upgrade head"
   ```

### PGVector Issues

If you encounter pgvector-related errors:

1. Check if the extension is installed:
   ```bash
   docker exec umt-postgres psql -U postgres -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
   ```

2. If not, run the fix script:
   ```bash
   ./docker/postgres/fix_pgvector.sh umt-postgres umt
   ```

## Monitoring and Logging

The system now includes enhanced monitoring:

1. **Health API**: Available at http://localhost:8001/health
2. **Database Health**: Available at http://localhost:8000/api/health/db
3. **Logs**: Can be viewed with `docker-compose -f docker-compose.staging.yml logs [service]`

## Backup and Restore

Before making significant changes:

1. Create a backup:
   ```bash
   scripts/database/backup_database.py --environment staging
   ```

2. To restore a backup:
   ```bash
   scripts/database/restore_database.py --environment staging --backup-file /path/to/backup.sql
   ```

## Complete Redeployment

If you need to completely redeploy the staging environment:

1. Clean up existing containers:
   ```bash
   docker-compose -f docker-compose.staging.yml down
   ```

2. Clean up volumes (WARNING: This will delete all data):
   ```bash
   docker volume prune
   ```

3. Run the deployment script:
   ```bash
   scripts/deployment/staging/deploy.sh
   ```