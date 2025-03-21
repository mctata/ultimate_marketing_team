#!/usr/bin/env python
"""
Pre-migration check script that runs before applying migrations.
This script:
1. Verifies migration integrity
2. Validates SQL patterns
3. Simulates migrations on a test database
4. Logs validation results
"""

import os
import sys
import subprocess
import argparse
import logging
import importlib.util
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple
import tempfile
import shutil
import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('migration_validation.log')
    ]
)
logger = logging.getLogger('pre_migration')

# Project directories
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
MIGRATIONS_DIR = os.path.join(PROJECT_ROOT, 'migrations')
VERSIONS_DIR = os.path.join(MIGRATIONS_DIR, 'versions')

def run_command(command: List[str], check: bool = True) -> Tuple[int, str, str]:
    """
    Run a shell command and return exit code, stdout, and stderr
    """
    logger.debug(f"Running command: {' '.join(command)}")
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    stdout, stderr = process.communicate()
    exit_code = process.returncode
    
    if check and exit_code != 0:
        logger.error(f"Command failed with exit code {exit_code}")
        logger.error(f"Command: {' '.join(command)}")
        logger.error(f"Stdout: {stdout}")
        logger.error(f"Stderr: {stderr}")
    
    return exit_code, stdout, stderr

def check_migration_patterns() -> bool:
    """
    Check migration files for proper SQLAlchemy patterns
    """
    logger.info("Checking migration files for proper SQLAlchemy patterns...")
    
    migration_checker_path = os.path.join(SCRIPT_DIR, 'check_migration_patterns.py')
    
    if not os.path.exists(migration_checker_path):
        logger.error(f"Migration pattern checker script not found at {migration_checker_path}")
        return False
    
    exit_code, stdout, stderr = run_command(['python', migration_checker_path], check=False)
    
    if exit_code != 0:
        logger.error("Migration pattern check failed")
        logger.error(f"Issues found:\n{stdout}")
        return False
    
    logger.info("Migration pattern check passed")
    return True

def verify_migration_sequence() -> bool:
    """
    Verify that migration sequence is correct (down_revision links form a proper chain)
    """
    logger.info("Verifying migration sequence...")
    
    # Get all migration files
    migration_files = []
    for filename in os.listdir(VERSIONS_DIR):
        if filename.endswith('.py') and not filename.startswith('__'):
            migration_files.append(os.path.join(VERSIONS_DIR, filename))
    
    if not migration_files:
        logger.error("No migration files found")
        return False
    
    # Extract revision and down_revision from each file
    revisions = {}
    for file_path in migration_files:
        try:
            with open(file_path, 'r') as f:
                content = f.read()
                
                # Extract revision
                revision_match = re.search(r"revision\s*=\s*['\"]([^'\"]+)['\"]", content)
                if not revision_match:
                    logger.error(f"Could not find revision in {file_path}")
                    return False
                
                revision = revision_match.group(1)
                
                # Extract down_revision
                down_revision_match = re.search(r"down_revision\s*=\s*['\"]?([^'\"]+)['\"]?", content)
                if not down_revision_match:
                    down_revision = None
                else:
                    down_revision = down_revision_match.group(1)
                    if down_revision == "None":
                        down_revision = None
                
                revisions[revision] = {
                    'file': os.path.basename(file_path),
                    'down_revision': down_revision
                }
        except Exception as e:
            logger.error(f"Error parsing {file_path}: {e}")
            return False
    
    # Check for a single root revision (down_revision is None)
    roots = [rev for rev, data in revisions.items() if data['down_revision'] is None]
    if len(roots) != 1:
        logger.error(f"Expected exactly one root migration, found {len(roots)}: {roots}")
        return False
    
    # Validate that all migrations can be reached from the root
    visited = set()
    current = roots[0]
    
    while current:
        visited.add(current)
        
        # Find all migrations that have this as their down_revision
        next_revisions = [rev for rev, data in revisions.items() if data['down_revision'] == current]
        
        if len(next_revisions) > 1:
            logger.warning(f"Found branch in migration history at {current}, multiple next revisions: {next_revisions}")
        
        if not next_revisions:
            # We've reached a head revision
            break
        
        # For simplicity, just follow the first branch
        current = next_revisions[0]
    
    # Check if all revisions are reachable
    unreachable = set(revisions.keys()) - visited
    if unreachable:
        logger.error(f"Found unreachable migrations: {unreachable}")
        return False
    
    logger.info("Migration sequence verification passed")
    return True

def create_test_database() -> bool:
    """
    Create a test database for migration simulation
    """
    try:
        # Create a unique temporary database name
        timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        test_db_name = f"migration_test_{timestamp}"
        
        # Get the database connection URL
        from src.core.database import get_engine
        engine = get_engine()
        connection_url = str(engine.url)
        
        # Create a new database URL for the test database
        if 'postgresql' in connection_url.lower():
            # Get base URL (without database name)
            base_url = connection_url.rsplit('/', 1)[0]
            test_db_url = f"{base_url}/{test_db_name}"
            
            # Create database
            import sqlalchemy
            create_engine = sqlalchemy.create_engine(f"{base_url}/postgres")
            conn = create_engine.connect()
            conn.execute(sqlalchemy.text(f"CREATE DATABASE {test_db_name}"))
            conn.close()
            
            logger.info(f"Created test database: {test_db_name}")
            
            # Set environment variable for alembic
            os.environ['SQLALCHEMY_TEST_URL'] = test_db_url
            return True
        else:
            logger.error(f"Unsupported database type: {connection_url}")
            return False
    except Exception as e:
        logger.error(f"Error creating test database: {e}")
        return False

def cleanup_test_database() -> None:
    """
    Clean up test database after simulation
    """
    try:
        if 'SQLALCHEMY_TEST_URL' in os.environ:
            test_db_url = os.environ['SQLALCHEMY_TEST_URL']
            test_db_name = test_db_url.rsplit('/', 1)[1]
            
            # Get base URL
            base_url = test_db_url.rsplit('/', 1)[0]
            
            # Connect to postgres database to drop the test database
            import sqlalchemy
            create_engine = sqlalchemy.create_engine(f"{base_url}/postgres")
            conn = create_engine.connect()
            
            # Terminate connections to the database
            conn.execute(sqlalchemy.text(
                f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{test_db_name}'"
            ))
            
            # Drop the database
            conn.execute(sqlalchemy.text(f"DROP DATABASE IF EXISTS {test_db_name}"))
            conn.close()
            
            logger.info(f"Cleaned up test database: {test_db_name}")
        
    except Exception as e:
        logger.error(f"Error cleaning up test database: {e}")

def simulate_migrations() -> bool:
    """
    Simulate migrations on a test database
    """
    logger.info("Simulating migrations on test database...")
    try:
        # Create a copy of alembic.ini for testing
        with tempfile.NamedTemporaryFile(suffix='.ini', delete=False) as temp_file:
            temp_config = temp_file.name
            shutil.copyfile(os.path.join(PROJECT_ROOT, 'alembic.ini'), temp_config)
            
            # Update the config to use test database
            with open(temp_config, 'r') as f:
                config_content = f.read()
            
            if 'SQLALCHEMY_TEST_URL' in os.environ:
                # Replace the URL
                test_db_url = os.environ['SQLALCHEMY_TEST_URL']
                config_content = re.sub(
                    r'sqlalchemy.url = .*',
                    f'sqlalchemy.url = {test_db_url}',
                    config_content
                )
                
                with open(temp_config, 'w') as f:
                    f.write(config_content)
                
                # Run the migrations
                exit_code, stdout, stderr = run_command(
                    ['alembic', '-c', temp_config, 'upgrade', 'head'],
                    check=False
                )
                
                if exit_code != 0:
                    logger.error("Migration simulation failed")
                    logger.error(f"Output: {stdout}")
                    logger.error(f"Errors: {stderr}")
                    return False
                
                # Test downgrade to check for errors (optional)
                exit_code, stdout, stderr = run_command(
                    ['alembic', '-c', temp_config, 'downgrade', 'base'],
                    check=False
                )
                
                if exit_code != 0:
                    logger.warning("Migration downgrade simulation failed")
                    logger.warning(f"Output: {stdout}")
                    logger.warning(f"Errors: {stderr}")
                    
                # Upgrade again to ensure it works after downgrade
                exit_code, stdout, stderr = run_command(
                    ['alembic', '-c', temp_config, 'upgrade', 'head'],
                    check=False
                )
                
                if exit_code != 0:
                    logger.error("Migration re-upgrade simulation failed")
                    logger.error(f"Output: {stdout}")
                    logger.error(f"Errors: {stderr}")
                    return False
                
                logger.info("Migration simulation passed")
                return True
            else:
                logger.error("Test database URL not set")
                return False
    except Exception as e:
        logger.error(f"Error simulating migrations: {e}")
        return False
    finally:
        # Clean up
        if 'temp_config' in locals():
            try:
                os.unlink(temp_config)
            except:
                pass

def parse_args():
    """
    Parse command line arguments
    """
    parser = argparse.ArgumentParser(description='Pre-migration validation script')
    parser.add_argument('--skip-simulation', action='store_true', help='Skip migration simulation on test database')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    return parser.parse_args()

def main():
    args = parse_args()
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    logger.info("Starting pre-migration validation")
    
    # Track validation steps
    validation_steps = []
    
    # Step 1: Check migration patterns
    pattern_check = check_migration_patterns()
    validation_steps.append(("Migration pattern check", pattern_check))
    
    # Step 2: Verify migration sequence
    sequence_check = verify_migration_sequence()
    validation_steps.append(("Migration sequence check", sequence_check))
    
    # Step 3: Simulate migrations on test database (optional)
    if not args.skip_simulation:
        try:
            create_db = create_test_database()
            if create_db:
                simulation_check = simulate_migrations()
                validation_steps.append(("Migration simulation", simulation_check))
            else:
                validation_steps.append(("Create test database", False))
                simulation_check = False
        except Exception as e:
            logger.error(f"Error during migration simulation: {e}")
            validation_steps.append(("Migration simulation", False))
            simulation_check = False
        finally:
            cleanup_test_database()
    else:
        logger.info("Skipping migration simulation")
        simulation_check = True
    
    # Print summary
    logger.info("\nValidation Summary:")
    logger.info("=" * 50)
    all_passed = True
    
    for step, result in validation_steps:
        status = "PASSED" if result else "FAILED"
        logger.info(f"{step}: {status}")
        all_passed = all_passed and result
    
    logger.info("=" * 50)
    
    if all_passed:
        logger.info("All validation checks passed. Migrations are ready to apply.")
        return 0
    else:
        logger.error("Validation failed. Fix issues before applying migrations.")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        logger.info("Validation aborted by user")
        cleanup_test_database()
        sys.exit(130)
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        cleanup_test_database()
        sys.exit(1)