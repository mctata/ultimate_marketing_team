# PostgreSQL Version Upgrade with pgvector

This document outlines the process of upgrading PostgreSQL to use the pgvector extension for vector operations across all environments (development, testing, staging, production).

## Background

We need to support vector operations in PostgreSQL for AI features in our application. The pgvector extension provides efficient vector similarity search capabilities.

## Chosen Solution

After evaluating different options, we've decided to use the `ankane/pgvector` image which comes with the vector extension pre-installed. This provides several advantages:

1. Simplified setup - no need to compile or install the extension manually
2. Consistent behavior across environments
3. Regularly updated with latest PostgreSQL and pgvector versions
4. Production-ready with proper configuration

## Implementation Details

### Docker Image

All environments now use the `ankane/pgvector` image instead of the standard PostgreSQL image:

```yaml
postgres:
  image: ankane/pgvector:latest
  # ... other configuration ...
```

### SQL Initialization Scripts

We've organized our PostgreSQL initialization in the following order:

1. `init.sql` - Creates the database schema and tables
2. `integration_upgrade.sql` - Adds integration-specific fields and tables
3. `install_pgvector.sql` - Ensures the vector extension is installed and tests it

The `install_pgvector.sql` script contains a validation test to ensure the vector extension is working correctly:

```sql
-- SQL Script to install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation with a simple test
DO $$
BEGIN
    -- Create a test table
    CREATE TABLE IF NOT EXISTS vector_test (
        id SERIAL PRIMARY KEY,
        embedding vector(3)
    );
    
    -- Insert a test vector
    INSERT INTO vector_test (embedding) VALUES ('[1,2,3]');
    
    -- Clean up
    DROP TABLE vector_test;
    
    RAISE NOTICE 'pgvector extension successfully installed and tested';
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error testing pgvector extension: %', SQLERRM;
END$$;
```

### Environment-Specific Configuration

Each environment has its specific Docker Compose file that uses the ankane/pgvector image:

- `docker-compose.dev.yml` - Development environment
- `docker-compose.test.yml` - Testing environment
- `docker-compose.staging.yml` - Staging environment
- `docker-compose.production.yml` - Production environment

### Testing Scripts

We've created two scripts to verify the PostgreSQL setup:

1. `scripts/deployment/test_local_db.sh` - Tests the local development setup
2. `scripts/deployment/test_connection.sh` - Tests the deployment environment connection and PostgreSQL compatibility

## Deployment Process

When deploying to a new environment or upgrading an existing one:

1. Run the appropriate test script to verify PostgreSQL compatibility
2. Use the environment-specific Docker Compose file to deploy the services
3. Verify that the migrations run successfully
4. Test vector operations in the application

## Troubleshooting

Common issues and their solutions:

1. **Container exits immediately**
   - Check if the host machine has enough disk space
   - Verify that no other service is using the specified ports
   - Check the logs for specific errors: `docker logs <container_id>`

2. **Vector extension not available**
   - Verify you're using the ankane/pgvector image
   - Check if the install_pgvector.sql script is being mounted correctly
   - Try running the CREATE EXTENSION command manually

3. **Data migration issues**
   - If upgrading from a previous PostgreSQL version, use pg_dump and pg_restore
   - Make sure to backup your data before upgrading

## Performance Considerations

- The pgvector extension may require additional memory for optimal performance
- For production, consider allocating more resources to the PostgreSQL container
- Monitor query performance, especially for vector similarity searches