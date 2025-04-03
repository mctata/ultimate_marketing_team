"""
Utilities for managing database migrations
"""

import os
import sys
import subprocess
import time
import logging
from typing import Optional
from pathlib import Path

# Set up logging
logger = logging.getLogger(__name__)

def run_migrations(max_attempts: int = 5, retry_delay: int = 5) -> bool:
    """
    Run database migrations using alembic before application startup
    
    Args:
        max_attempts: Maximum number of attempts to run migrations
        retry_delay: Delay between retry attempts in seconds
        
    Returns:
        bool: True if migrations were successful, False otherwise
    """
    logger.info("Preparing to run database migrations...")
    
    # Get project root directory
    project_root = Path(__file__).resolve().parents[2]
    
    # Ensure alembic.ini exists
    alembic_ini = project_root / "alembic.ini"
    if not alembic_ini.exists():
        logger.error(f"alembic.ini not found at {alembic_ini}")
        return False
    
    # Command to run migrations - use "heads" to handle multiple heads
    cmd = [sys.executable, "-m", "alembic", "upgrade", "heads"]
    
    # Try to run migrations with retries
    for attempt in range(1, max_attempts + 1):
        try:
            logger.info(f"Attempt {attempt}/{max_attempts} - Running database migrations")
            process = subprocess.run(
                cmd,
                cwd=str(project_root),
                capture_output=True,
                text=True,
                check=True
            )
            logger.info(f"Migration output: {process.stdout}")
            logger.info("Database migrations completed successfully")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Migration error (attempt {attempt}/{max_attempts}): {e}")
            logger.error(f"Error output: {e.stderr}")
            
            # Check if this is a database connection error
            if "could not connect to server" in e.stderr or "could not translate host name" in e.stderr:
                if attempt < max_attempts:
                    logger.info(f"Database connection error. Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                else:
                    logger.error("Maximum retry attempts reached. Could not connect to database.")
                    return False
            else:
                # If it's not a connection error, don't retry
                logger.error("Migration failed due to a non-connection error.")
                return False
    
    # We should never reach here, but just in case
    return False

def check_schema_exists(schema_name: str, db_session) -> bool:
    """
    Check if the specified schema exists in the database
    
    Args:
        schema_name: The schema name to check
        db_session: SQLAlchemy database session
        
    Returns:
        bool: True if schema exists, False otherwise
    """
    try:
        from sqlalchemy import text
        
        with db_session.connection() as conn:
            query = text(
                "SELECT EXISTS (SELECT 1 FROM information_schema.schemata "
                "WHERE schema_name = :schema_name)"
            )
            result = conn.execute(query, {"schema_name": schema_name})
            return bool(result.scalar())
    except Exception as e:
        logger.error(f"Error checking schema: {e}")
        return False

def ensure_schema_exists(schema_name: str, db_session) -> bool:
    """
    Ensure the specified schema exists, creating it if needed
    
    Args:
        schema_name: The schema to create
        db_session: SQLAlchemy database session
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        from sqlalchemy import text
        
        # Check if schema exists
        if check_schema_exists(schema_name, db_session):
            logger.info(f"Schema '{schema_name}' already exists")
            return True
        
        # Create schema if it doesn't exist
        logger.info(f"Creating schema '{schema_name}'")
        with db_session.connection() as conn:
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
            conn.commit()
        
        return True
    except Exception as e:
        logger.error(f"Error creating schema: {e}")
        return False
