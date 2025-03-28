#!/usr/bin/env python
"""
Migration Monitoring Script

This script monitors database migrations in production environments
by checking the alembic_version table and comparing with expected versions.
It can be used to:
1. Verify migrations completed successfully
2. Alert on failed migrations
3. Provide reporting on migration history
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timedelta

import sqlalchemy as sa
from sqlalchemy import Column, String, DateTime, create_engine, inspect, MetaData, Table, text
from sqlalchemy.orm import sessionmaker

# Default schema
DEFAULT_SCHEMA = "umt"

# Migration status constants
STATUS_OK = "OK"
STATUS_FAILED = "FAILED"
STATUS_IN_PROGRESS = "IN_PROGRESS"
STATUS_UNKNOWN = "UNKNOWN"


def get_db_connection(database_url):
    """Create a database connection.
    
    Args:
        database_url (str): Database connection string
        
    Returns:
        Engine: SQLAlchemy engine
    """
    try:
        engine = create_engine(database_url)
        return engine
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)


def check_alembic_table(engine):
    """Check if alembic_version table exists.
    
    Args:
        engine (Engine): SQLAlchemy engine
        
    Returns:
        bool: True if table exists, False otherwise
    """
    try:
        inspector = inspect(engine)
        return "alembic_version" in inspector.get_table_names()
    except Exception as e:
        print(f"Error checking alembic table: {e}")
        return False


def get_current_version(engine):
    """Get current migration version.
    
    Args:
        engine (Engine): SQLAlchemy engine
        
    Returns:
        str: Current version or None if not found
    """
    if not check_alembic_table(engine):
        return None
        
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            row = result.fetchone()
            return row[0] if row else None
    except Exception as e:
        print(f"Error getting current version: {e}")
        return None


def get_migration_history(engine, schema=DEFAULT_SCHEMA):
    """Get migration history from custom monitoring table if available.
    
    Args:
        engine (Engine): SQLAlchemy engine
        schema (str): Database schema
        
    Returns:
        list: List of migration history records
    """
    try:
        inspector = inspect(engine)
        if "migration_history" not in inspector.get_table_names(schema=schema):
            return []
            
        metadata = MetaData(schema=schema)
        migration_history = Table(
            "migration_history", 
            metadata,
            Column("version", String),
            Column("applied_at", DateTime),
            Column("status", String),
            autoload_with=engine
        )
        
        with engine.connect() as conn:
            result = conn.execute(sa.select(migration_history).order_by(migration_history.c.applied_at.desc()))
            return [
                {
                    "version": row.version,
                    "applied_at": row.applied_at.isoformat() if row.applied_at else None,
                    "status": row.status
                }
                for row in result
            ]
    except Exception as e:
        print(f"Error getting migration history: {e}")
        return []


def check_migration_status(engine, expected_version=None, schema=DEFAULT_SCHEMA):
    """Check migration status.
    
    Args:
        engine (Engine): SQLAlchemy engine
        expected_version (str): Expected migration version
        schema (str): Database schema
        
    Returns:
        dict: Migration status information
    """
    current_version = get_current_version(engine)
    history = get_migration_history(engine, schema)
    
    # Check if migrations are in progress
    in_progress = False
    if history:
        latest = history[0]
        if latest["status"] == STATUS_IN_PROGRESS:
            # Check if the migration has been running for more than 10 minutes
            applied_at = datetime.fromisoformat(latest["applied_at"])
            if datetime.now() - applied_at < timedelta(minutes=10):
                in_progress = True
    
    status = STATUS_UNKNOWN
    
    if current_version is None:
        status = STATUS_FAILED
        message = "No migrations found. Database may not be initialized."
    elif in_progress:
        status = STATUS_IN_PROGRESS
        message = f"Migration to version {latest['version']} is in progress."
    elif expected_version and current_version != expected_version:
        status = STATUS_FAILED
        message = f"Migration version mismatch. Current: {current_version}, Expected: {expected_version}"
    else:
        status = STATUS_OK
        message = f"Migration version: {current_version}"
    
    return {
        "status": status,
        "message": message,
        "current_version": current_version,
        "expected_version": expected_version,
        "history": history[:5]  # Include most recent 5 migrations
    }
    

def main():
    parser = argparse.ArgumentParser(description='Database Migration Monitor')
    parser.add_argument('--database-url', default=os.environ.get('DATABASE_URL'),
                        help='Database connection URL')
    parser.add_argument('--expected-version',
                        help='Expected migration version')
    parser.add_argument('--schema', default=DEFAULT_SCHEMA,
                        help=f'Database schema (default: {DEFAULT_SCHEMA})')
    parser.add_argument('--output', choices=['text', 'json'], default='text',
                        help='Output format (default: text)')
    
    args = parser.parse_args()
    
    if not args.database_url:
        print("ERROR: Database URL not provided. Use --database-url or set DATABASE_URL environment variable")
        sys.exit(1)
    
    engine = get_db_connection(args.database_url)
    status = check_migration_status(engine, args.expected_version, args.schema)
    
    if args.output == 'json':
        print(json.dumps(status, indent=2))
    else:
        print(f"Migration Status: {status['status']}")
        print(f"Message: {status['message']}")
        print(f"Current Version: {status['current_version']}")
        
        if status['expected_version']:
            print(f"Expected Version: {status['expected_version']}")
        
        if status['history']:
            print("\nRecent Migration History:")
            for entry in status['history']:
                print(f"  - {entry['version']} ({entry['status']}): {entry['applied_at']}")
    
    # Exit with appropriate status code
    if status['status'] == STATUS_OK:
        sys.exit(0)
    elif status['status'] == STATUS_IN_PROGRESS:
        sys.exit(0)  # In progress is okay for monitoring
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()