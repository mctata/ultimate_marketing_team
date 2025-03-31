# Staging Environment Troubleshooting Guide

This guide provides solutions for common issues encountered when deploying the Ultimate Marketing Team to the staging environment, with a particular focus on database initialization problems.

## API Gateway Database Connection Issues

### Symptoms

- API Gateway container starts but logs show database connection failures
- The health check endpoint `/api/health/db` returns an error or "status": "error"
- Migrations container exits with a non-zero status code
- API functions that require database access don't work properly

### Quick Fix

Run the automated repair script:

```bash
bash scripts/deployment/staging/fix_api_gateway_db.sh
```

This script will:
1. Check PostgreSQL container health
2. Test network connectivity
3. Verify database and schema existence
4. Run migrations manually if needed
5. Restart the API gateway

### Manual Debugging and Fixes

If the automatic repair script doesn't solve the issue, follow these steps:

#### 1. Check Database Container Health

```bash
docker inspect --format='{{.State.Health.Status}}' ultimate-marketing-team_postgres-proxy_1
```

If not healthy, check the logs:

```bash
docker logs ultimate-marketing-team_postgres-proxy_1
```

#### 2. Verify Database Connection Parameters

The API gateway should use these connection parameters:
- Host: postgres
- Port: 5432
- User: postgres
- Password: postgres
- Database: umt
- Schema: umt

Confirm these settings in the API gateway container:

```bash
docker exec -it ultimate-marketing-team_api-gateway_1 env | grep DB_
```

#### 3. Check Network Connectivity

Test connectivity from API gateway to database:

```bash
docker exec ultimate-marketing-team_api-gateway_1 ping -c 2 postgres
docker exec ultimate-marketing-team_api-gateway_1 pg_isready -h postgres -p 5432 -U postgres
```

#### 4. Verify Database and Schema Existence

Connect to the PostgreSQL container and check:

```bash
docker exec -it ultimate-marketing-team_postgres_1 psql -U postgres -c "\l"  # List databases
docker exec -it ultimate-marketing-team_postgres_1 psql -U postgres -d umt -c "\dn"  # List schemas
```

If the database or schema doesn't exist, create them:

```bash
docker exec -it ultimate-marketing-team_postgres_1 psql -U postgres -c "CREATE DATABASE umt;"
docker exec -it ultimate-marketing-team_postgres_1 psql -U postgres -d umt -c "CREATE SCHEMA umt;"
```

#### 5. Check Migration Status

Verify if migrations have been applied:

```bash
docker exec -it ultimate-marketing-team_postgres_1 psql -U postgres -d umt -c "SELECT * FROM umt.alembic_version;"
```

If the table doesn't exist or you want to run migrations manually:

```bash
docker exec -it ultimate-marketing-team_api-gateway_1 python -m alembic upgrade head
```

#### 6. Restart the API Gateway

After fixing the issues, restart the API gateway:

```bash
docker restart ultimate-marketing-team_api-gateway_1
```

## Common Migration Issues

### Multiple Alembic Heads

If you encounter errors about multiple alembic heads:

```
ERROR [alembic.util.messaging] Multiple head revisions are present for given argument 'head'
```

Merge the heads:

```bash
docker exec -it ultimate-marketing-team_api-gateway_1 python -m alembic merge heads -m "merge heads"
docker exec -it ultimate-marketing-team_api-gateway_1 python -m alembic upgrade head
```

### Migration Conflicts

If migrations fail due to conflicts:

1. Backup the database first:
   ```bash
   docker exec -it ultimate-marketing-team_postgres_1 pg_dump -U postgres umt > backup_before_fix.sql
   ```

2. Check what's in the database:
   ```bash
   docker exec -it ultimate-marketing-team_postgres_1 psql -U postgres -d umt -c "\dt umt.*"
   ```

3. If needed, stamp the database with a known revision:
   ```bash
   docker exec -it ultimate-marketing-team_api-gateway_1 python -m alembic stamp <revision>
   ```

## Circular Dependencies in Models

If you're experiencing errors related to circular imports or SQLAlchemy mapper configuration:

1. Check the API Gateway logs:
   ```bash
   docker logs ultimate-marketing-team_api-gateway_1 | grep -i "mapper"
   ```

2. Look for circular imports:
   ```bash
   docker exec -it ultimate-marketing-team_api-gateway_1 python -c "import src.models"
   ```

3. Fix circular imports by:
   - Moving imports to the function level (lazy imports)
   - Using string references for foreign keys
   - Rearranging the import order in `__init__.py` files

## PostgreSQL Connection Retries

The API Gateway has been configured to retry database connections multiple times. You can adjust these settings:

- `MAX_RETRIES`: Number of retry attempts (default: 60)
- `RETRY_INTERVAL`: Seconds between retries (default: 2)

Change these in the Docker environment variables or in the start.sh script.

## Separating Database Concerns

For persistent issues, you may want to set up a dedicated database for staging:

1. Create a separate database configuration in `docker-compose.staging.yml`:
   ```yaml
   services:
     postgres-staging:
       image: postgres:14-alpine
       environment:
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
         POSTGRES_DB: umt_staging
       volumes:
         - postgres_staging_data:/var/lib/postgresql/data
     
     # Update the DATABASE_URL in api-gateway service
     api-gateway:
       environment:
         DATABASE_URL: postgresql://postgres:postgres@postgres-staging:5432/umt_staging
   
   volumes:
     postgres_staging_data:
   ```

2. Update the scripts to use this dedicated database.

## Data Persistence Issues

If database data is lost between deployments:

1. Ensure volumes are properly configured in docker-compose.yml
2. Check if volumes are being removed during cleanup

To verify volume persistence:

```bash
docker volume ls | grep postgres_data
```

To inspect a volume:

```bash
docker volume inspect postgres_data
```

## Maintenance and Recovery

### Database Backup

Create a backup of the database:

```bash
docker exec -it ultimate-marketing-team_postgres_1 pg_dump -U postgres umt > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Database Restore

Restore from a backup:

```bash
cat backup_file.sql | docker exec -i ultimate-marketing-team_postgres_1 psql -U postgres -d umt
```

### Complete Reset

If you need to start from scratch:

```bash
# Stop containers
docker compose -f docker-compose.staging.yml down

# Remove volumes (CAUTION: This deletes all data)
docker volume rm ultimate-marketing-team_postgres_data

# Start fresh
docker compose -f docker-compose.staging.yml up -d
```

## Monitoring Database Health

A custom health check endpoint is available at `/api/health/db`. Use it to monitor database connectivity:

```bash
curl http://localhost:8000/api/health/db | jq
```

The response includes:
- `status`: "connected" or "error"
- `schema_exists`: Whether the schema exists
- `error`: Error message if there's a problem
- `database_version`: PostgreSQL version information

## Logging

### Enhanced Logging

We've implemented enhanced logging for database operations. To view these logs:

```bash
docker logs ultimate-marketing-team_api-gateway_1 | grep -i "database"
```

For migrations:

```bash
docker logs ultimate-marketing-team_migrations_1
```

### Log Files

In the API gateway container, database logs are available at:

```
/app/logs/database.log
```

View with:

```bash
docker exec -it ultimate-marketing-team_api-gateway_1 cat /app/logs/database.log
```

## Contact Support

If you've tried all these troubleshooting steps and still have issues, please contact the development team with:

1. The output of the fix script
2. Database logs
3. API gateway logs
4. Current container status (`docker ps -a`)
