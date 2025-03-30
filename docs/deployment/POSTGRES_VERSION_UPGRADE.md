# PostgreSQL Version Upgrade Guide

This document outlines the steps to test and verify the PostgreSQL version change from 14 to 17 before deploying to staging.

## Background

We've updated the PostgreSQL version from 14 to 17 in all environments. This upgrade requires careful testing to ensure all database operations work correctly with the new version.

## Changes Made

1. Updated PostgreSQL image version from `postgres:14-alpine` to `postgres:17-alpine` in:
   - docker-compose.dev.yml
   - docker-compose.test.yml
   - docker-compose.staging.yml

2. Added `POSTGRES_HOST` environment variable to Postgres service configuration
   - Default: `postgres` for local development/testing
   - Staging: `ultimatemarketing-staging.c0dcu2ywapx7.us-east-1.rds.amazonaws.com`

3. Updated all `DATABASE_URL` references to use the `POSTGRES_HOST` environment variable

## Testing Instructions

Follow these steps to test the PostgreSQL version upgrade:

### 1. Clean Your Environment

Remove existing PostgreSQL volumes to start with a clean database:

```bash
# Stop all containers and remove volumes
docker-compose down -v
```

### 2. Start Development Environment

```bash
# Start PostgreSQL and other services
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Run Migrations

```bash
# Create a virtual environment if you don't have one
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head
```

### 4. Run Tests

```bash
# Run tests that interact with the database
pytest tests/models/
pytest tests/integration/test_migrations.py
```

### 5. Test Specific PostgreSQL 17 Features

PostgreSQL 17 has several new features and changes that may affect our application. Test the following:

- Query execution plans (EXPLAIN)
- Full-text search functionality
- JSON operations
- Transaction handling

```bash
# Run specific PostgreSQL 17 tests
pytest tests/database/test_specific_pg17_features.py
```

### 6. Run the Application Locally

```bash
# Start the development server
uvicorn src.api.main:app --reload
```

Test all functionality that interacts with the database.

## Common Issues

### Compatibility Issues

PostgreSQL 17 has some syntax changes and deprecated features:

1. **Deprecated Functions**:
   - Some string functions have changed
   - Timestamp handling has been updated

2. **Changed Behavior**:
   - Some indexing behavior is different
   - Query optimization may produce different execution plans

### Connection Issues

If you encounter connection issues:

1. Verify the `POSTGRES_HOST` environment variable is set correctly
2. Check that PostgreSQL is running: `docker ps | grep postgres`
3. Try connecting directly with psql:
   ```bash
   docker exec -it $(docker ps -q -f name=postgres) psql -U postgres -d ultimatemarketing
   ```

## Rollback Plan

If serious issues are found, follow these steps to rollback:

1. Revert the Docker Compose files to use PostgreSQL 14
2. Rebuild and restart the containers
3. Restore from a database backup if needed

## Verification

Before deploying to staging, verify:

1. All migrations run successfully with PostgreSQL 17
2. All tests pass with PostgreSQL 17
3. The application functions normally with PostgreSQL 17
4. No performance regressions are observed