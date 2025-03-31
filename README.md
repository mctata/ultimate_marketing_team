# Ultimate Marketing Team

AI-driven marketing automation system designed to replace a traditional marketing team, handling end-to-end marketing functions for enterprise-scale operations.

## Database Initialization Improvements

We've addressed the API gateway database initialization issues when deploying to staging with the following improvements:

### 1. Migration Utilities

- Added `src/core/migration_utils.py` with specialized functions for running database migrations before API startup
- Created a comprehensive pre-migration validation script (`scripts/database/pre_migration_check.py`) to verify database readiness
- Added a dedicated script for running migrations safely in staging (`scripts/deployment/staging/run_migrations.sh`)

### 2. Database Connection Enhancements

- Improved the database module (`src/core/database.py`) with better error handling and connection management
- Added retry logic for database operations with exponential backoff
- Added health check functions to verify database connectivity
- Enhanced connection pool configuration for better stability

### 3. Environment-Specific Settings

- Created a structured settings system with environment-specific configurations
- Added optimized database connection parameters for staging and production environments
- Implemented a settings hierarchy (base → environment-specific) for better organization

### 4. Startup Process Improvements

- Overhauled the API gateway startup process in `src/api/main.py`
- Added a dedicated database initialization function
- Ensured that database migrations run before API startup
- Implemented proper error handling to allow API startup even if database is temporarily unavailable

### 5. Docker & Deployment Enhancements

- Updated the Docker configuration to include database tools and proper error handling
- Added a dedicated database migration script for the staging environment
- Enhanced the Docker startup script to wait for database availability
- **Upgraded to PostgreSQL 17** with compatible commands and configuration

## Quick Start

To fix database initialization issues in staging:

```bash
# Make scripts executable 
chmod +x scripts/deployment/staging/deploy.sh
chmod +x scripts/deployment/fix_api_gateway_db.sh
chmod +x scripts/deployment/staging/run_migrations.sh

# Deploy using the enhanced deployment script
./scripts/deployment/staging/deploy.sh

# If issues persist, run the repair script
./scripts/deployment/fix_api_gateway_db.sh
```

## Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/mctata/ultimate_marketing_team.git
   cd ultimate_marketing_team
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/umt"
   export UMT_ENV="development"
   ```

4. Run database migrations:
   ```
   python -m alembic upgrade head
   ```

5. Start the API server:
   ```
   uvicorn src.api.main:app --reload
   ```

## Staging Deployment

To deploy to the staging environment:

1. Set the environment variable for staging:
   ```
   export UMT_ENV="staging"
   ```

2. Run the dedicated migration script:
   ```
   ./scripts/deployment/staging/run_migrations.sh
   ```

3. Build and start the Docker containers:
   ```
   docker-compose -f docker-compose.staging.yml up -d
   ```

## Troubleshooting Database Issues

If you encounter database initialization issues:

1. Check database connectivity:
   ```
   curl http://localhost:8000/api/health/db
   ```

2. Run the pre-migration validation:
   ```
   python scripts/database/pre_migration_check.py
   ```

3. Check database operations logs:
   ```
   ./scripts/deployment/staging/db_operations.sh status
   ```

4. For more extensive database operations in staging:
   ```
   ./scripts/deployment/staging/db_operations.sh console
   ```

5. Read the comprehensive troubleshooting guide:
   ```
   docs/staging-troubleshooting.md
   ```
