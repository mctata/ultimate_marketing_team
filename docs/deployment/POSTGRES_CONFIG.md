# PostgreSQL Configuration

## Overview

The Ultimate Marketing Team application uses PostgreSQL 17 with vector extension support for AI features. This configuration is designed to match our AWS RDS environment in production.

## Docker Configuration

All environments use the `postgres:17-alpine` image:

```yaml
postgres:
  image: postgres:17-alpine
  volumes:
    - postgres-data:/var/lib/postgresql/data
    - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/1_init.sql
    - ./docker/postgres/integration_upgrade.sql:/docker-entrypoint-initdb.d/2_integration_upgrade.sql
    - ./docker/postgres/install_pgvector.sql:/docker-entrypoint-initdb.d/3_install_pgvector.sql
```

## Initialization Order

1. `init.sql` - Creates database schema and tables
2. `integration_upgrade.sql` - Adds integration-specific fields
3. `install_pgvector.sql` - Installs vector extension

## Vector Extension Setup

The vector extension enables AI features like embeddings storage and similarity search. The installation script:

```sql
-- Install vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Test with a simple vector table
DO $$
BEGIN
    CREATE TABLE IF NOT EXISTS vector_test (
        id SERIAL PRIMARY KEY,
        embedding vector(3)
    );
    
    INSERT INTO vector_test (embedding) VALUES ('[1,2,3]');
    DROP TABLE vector_test;
END$$;
```

## AWS RDS Configuration

For production on AWS RDS PostgreSQL 17:

1. Create the vector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. Set appropriate RDS parameter group settings:
   - `shared_preload_libraries` for required extensions
   - Proper `max_connections` value
   - Sufficient memory allocation

3. Performance considerations:
   - Use appropriate RDS instance size
   - Consider index optimization for vector columns
   - Monitor query performance for vector operations

## Verification

Use our testing scripts to verify proper setup:

```bash
# Test local setup
./scripts/deployment/test_local_db.sh

# Test deployment environment
./scripts/deployment/test_connection.sh
```

These scripts check:
- PostgreSQL image availability
- Vector extension installation
- Basic vector operations