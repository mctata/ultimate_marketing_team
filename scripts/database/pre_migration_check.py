#!/usr/bin/env python3
"""
Pre-migration validation script for database migrations.

This script performs validation checks before running migrations to ensure
the database is in a consistent state and migrations are likely to succeed.
"""

import os
import sys
import logging
import argparse
from sqlalchemy import text, inspect, MetaData, Table, create_engine
from sqlalchemy.exc import SQLAlchemyError

# Add the project root to the Python path to ensure imports work
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.core.settings import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('pre_migration_check')

def get_database_url():
    """Get the database URL from environment variables or settings."""
    return os.environ.get('DATABASE_URL', settings.DATABASE_URL)

def get_database_engine():
    """Create and return a SQLAlchemy engine."""
    database_url = get_database_url()
    try:
        engine = create_engine(database_url)
        logger.info("Database engine created successfully")
        return engine
    except Exception as e:
        logger.error(f"Failed to create database engine: {str(e)}")
        sys.exit(1)

def check_database_connection(engine):
    """Check if the database is accessible."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            if result == 1:
                logger.info("✅ Database connection successful")
                return True
            else:
                logger.error("❌ Database connection check failed")
                return False
    except Exception as e:
        logger.error(f"❌ Database connection error: {str(e)}")
        return False

def check_schema_exists(engine, schema_name):
    """Check if the specified schema exists."""
    try:
        with engine.connect() as conn:
            query = text(
                "SELECT EXISTS (SELECT 1 FROM information_schema.schemata "
                "WHERE schema_name = :schema_name)"
            )
            result = conn.execute(query, {"schema_name": schema_name}).scalar()
            if result:
                logger.info(f"✅ Schema '{schema_name}' exists")
                return True
            else:
                logger.warning(f"❗ Schema '{schema_name}' does not exist (will be created during migration)")
                return False
    except Exception as e:
        logger.error(f"❌ Error checking schema: {str(e)}")
        return False

def check_alembic_version_table(engine, schema_name):
    """Check if the alembic_version table exists."""
    try:
        with engine.connect() as conn:
            query = text(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables "
                "WHERE table_schema = :schema_name "
                "AND table_name = 'alembic_version')"
            )
            result = conn.execute(query, {"schema_name": schema_name}).scalar()
            if result:
                logger.info("✅ alembic_version table exists")
                # Get current revision
                query = text(f"SELECT version_num FROM {schema_name}.alembic_version")
                revision = conn.execute(query).scalar()
                logger.info(f"Current alembic revision: {revision}")
                return True
            else:
                logger.warning("❗ alembic_version table does not exist (initial migration needed)")
                return False
    except Exception as e:
        logger.error(f"❌ Error checking alembic_version table: {str(e)}")
        return False

def check_for_circular_dependencies():
    """Check for potential circular dependencies in model imports."""
    try:
        # Try to import all models and configure mappers
        from sqlalchemy.orm import configure_mappers
        from src.models import *
        
        configure_mappers()
        logger.info("✅ No circular dependencies detected in model imports")
        return True
    except ImportError as e:
        logger.error(f"❌ Possible circular dependency detected: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"❌ Error checking for circular dependencies: {str(e)}")
        return False

def check_pg_extension_availability(engine, extension_name):
    """Check if the specified Postgres extension is available."""
    try:
        with engine.connect() as conn:
            query = text(
                "SELECT EXISTS (SELECT 1 FROM pg_available_extensions "
                "WHERE name = :extension_name)"
            )
            result = conn.execute(query, {"extension_name": extension_name}).scalar()
            if result:
                logger.info(f"✅ Extension '{extension_name}' is available")
                return True
            else:
                logger.warning(f"❗ Extension '{extension_name}' is not available")
                return False
    except Exception as e:
        logger.error(f"❌ Error checking extension availability: {str(e)}")
        return False

def check_database_version(engine):
    """Check the PostgreSQL database version."""
    try:
        with engine.connect() as conn:
            query = text("SELECT version()")
            version = conn.execute(query).scalar()
            logger.info(f"Database version: {version}")
            return True
    except Exception as e:
        logger.error(f"❌ Error checking database version: {str(e)}")
        return False

def run_all_checks():
    """Run all pre-migration checks."""
    schema_name = os.environ.get('SCHEMA_NAME', 'umt')
    
    logger.info("=== Starting pre-migration checks ===")
    
    # Get the database engine
    engine = get_database_engine()
    
    # Run all checks
    checks = [
        check_database_connection(engine),
        check_database_version(engine),
        check_schema_exists(engine, schema_name),
        check_alembic_version_table(engine, schema_name),
        check_for_circular_dependencies(),
        check_pg_extension_availability(engine, 'uuid-ossp'),
        check_pg_extension_availability(engine, 'vector')
    ]
    
    # Summarize results
    success_count = sum(1 for check in checks if check)
    total_checks = len(checks)
    
    logger.info(f"=== Completed {success_count}/{total_checks} checks successfully ===")
    
    # Pass if all critical checks pass
    critical_checks = checks[0:3]  # Connection, version, and schema checks
    if all(critical_checks):
        logger.info("✅ All critical checks passed - migrations can proceed")
        return 0
    else:
        logger.error("❌ One or more critical checks failed - migrations may fail")
        return 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pre-migration database validation")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose output")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    sys.exit(run_all_checks())
