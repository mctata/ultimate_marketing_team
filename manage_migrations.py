#!/usr/bin/env python
"""
Migration management script for the Ultimate Marketing Team

This script provides an easy way to manage database migrations:
1. Create new migrations with or without autogeneration
2. Apply migrations to upgrade the database
3. Downgrade the database if needed
4. View migration history

Usage:
    python manage_migrations.py create --message "Add new tables" --autogenerate
    python manage_migrations.py upgrade [revision]
    python manage_migrations.py downgrade <revision>
    python manage_migrations.py history
    python manage_migrations.py current
"""

import os
import sys
import argparse
import subprocess
import time
import socket
from datetime import datetime
from pathlib import Path
import re

# Ensure the project root is in the Python path
project_root = Path(__file__).resolve().parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))
    
# Try to import database utilities
try:
    from src.core.database import SCHEMA_NAME, get_engine
except ImportError:
    # Default schema name if import fails
    SCHEMA_NAME = "umt"
    
    def get_engine():
        """Fallback method to get a database engine if the import fails."""
        from sqlalchemy import create_engine
        db_url = os.environ.get("DATABASE_URL")
        if not db_url:
            print("ERROR: DATABASE_URL environment variable not set")
            sys.exit(1)
        return create_engine(db_url)

def log_migration_operation(version, status, description=None, error_message=None, duration_ms=None):
    """Log migration operation to the migration_history table.
    
    Args:
        version (str): Migration version
        status (str): Migration status (OK, FAILED, IN_PROGRESS)
        description (str, optional): Migration description
        error_message (str, optional): Error message if failed
        duration_ms (int, optional): Operation duration in milliseconds
    """
    try:
        from sqlalchemy import text
        
        # Check if the table exists before logging
        engine = get_engine()
        with engine.connect() as conn:
            # Check if the migration_history table exists
            query = text(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables "
                f"WHERE table_schema = '{SCHEMA_NAME}' AND table_name = 'migration_history')"
            )
            result = conn.execute(query)
            table_exists = result.scalar()
            
            if not table_exists:
                print("Migration history table does not exist, skipping logging")
                return
            
            # Get current user and hostname
            user = os.environ.get("USER", "unknown")
            hostname = socket.gethostname()
            environment = os.environ.get("ENVIRONMENT", "development")
            
            # Insert the record
            conn.execute(text(
                f"INSERT INTO {SCHEMA_NAME}.migration_history "
                f"(version, applied_at, description, status, duration_ms, error_message, user, environment) "
                f"VALUES (:version, :applied_at, :description, :status, :duration_ms, :error_message, :user, :environment)"
            ), {
                "version": version,
                "applied_at": datetime.utcnow(),
                "description": description,
                "status": status,
                "duration_ms": duration_ms,
                "error_message": error_message,
                "user": f"{user}@{hostname}",
                "environment": environment
            })
            conn.commit()
            print(f"Migration operation logged: {version} ({status})")
    except Exception as e:
        print(f"Error logging migration operation: {e}")


def extract_revision_from_output(output):
    """Extract revision ID from alembic command output.
    
    Args:
        output (str): Command output
        
    Returns:
        str: Revision ID or None if not found
    """
    if not output:
        return None
        
    # For upgrade/downgrade commands
    match = re.search(r"Upgrade|Downgrade to ([0-9a-f]+)", output)
    if match:
        return match.group(1)
        
    # For revision creation
    match = re.search(r"Generating .*?/([0-9a-f]+)_", output)
    if match:
        return match.group(1)
        
    # For current command
    match = re.search(r"Current revision\(s\): ([0-9a-f]+)", output)
    if match:
        return match.group(1)
        
    return None


def run_alembic_command(command, check=True):
    """Run an Alembic command and print its output
    
    Args:
        command (str): Alembic command to run
        check (bool): Whether to check return code
        
    Returns:
        bool: True if successful, False otherwise
    """
    full_command = f"alembic {command}"
    print(f"Running: {full_command}")
    
    start_time = time.time()
    success = False
    output = ""
    error = ""
    revision = None
    
    try:
        result = subprocess.run(
            full_command, 
            shell=True, 
            check=check, 
            capture_output=True,
            text=True
        )
        output = result.stdout
        error = result.stderr
        print(output)
        
        if error:
            print(f"Errors:\n{error}", file=sys.stderr)
        
        success = result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {full_command}", file=sys.stderr)
        if hasattr(e, 'stderr'):
            print(e.stderr, file=sys.stderr)
            error = e.stderr
        success = False
    
    # Calculate duration
    duration_ms = int((time.time() - start_time) * 1000)
    
    # Extract revision from command output
    revision = extract_revision_from_output(output)
    
    # Log the operation if it's an upgrade, downgrade, or revision command
    if any(cmd in command for cmd in ["upgrade", "downgrade", "revision"]) and revision:
        status = "OK" if success else "FAILED"
        log_migration_operation(
            version=revision,
            status=status,
            description=command,
            error_message=error if not success else None,
            duration_ms=duration_ms
        )
    
    return success

def create_migration(args):
    """Create a new migration"""
    message = args.message or "Update database schema"
    autogenerate = "--autogenerate" if args.autogenerate else ""
    return run_alembic_command(f"revision {autogenerate} -m \"{message}\"")

def upgrade_database(args):
    """Upgrade the database to a specific revision"""
    revision = args.revision or "head"
    return run_alembic_command(f"upgrade {revision}")

def downgrade_database(args):
    """Downgrade the database to a specific revision"""
    revision = args.revision or "base"
    if not revision:
        print("Error: You must specify a revision to downgrade to", file=sys.stderr)
        return False
    
    # Confirm downgrade
    if not args.yes:
        confirm = input(f"Are you sure you want to downgrade to revision {revision}? [y/N] ")
        if confirm.lower() not in ('y', 'yes'):
            print("Downgrade cancelled.")
            return False
    
    return run_alembic_command(f"downgrade {revision}")

def show_history(args):
    """Show migration history"""
    verbose = "-v" if args.verbose else ""
    return run_alembic_command(f"history {verbose}")

def show_current(args):
    """Show the current migration"""
    verbose = "-v" if args.verbose else ""
    return run_alembic_command(f"current {verbose}")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="UMT Database Migration Manager")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Create migration command
    create_parser = subparsers.add_parser("create", help="Create a new migration")
    create_parser.add_argument("-m", "--message", help="Migration message")
    create_parser.add_argument("-a", "--autogenerate", action="store_true", 
                              help="Autogenerate migration based on model changes")
    create_parser.set_defaults(func=create_migration)
    
    # Upgrade command
    upgrade_parser = subparsers.add_parser("upgrade", help="Upgrade the database")
    upgrade_parser.add_argument("revision", nargs="?", default="head", 
                              help="Revision to upgrade to (default: head)")
    upgrade_parser.set_defaults(func=upgrade_database)
    
    # Downgrade command
    downgrade_parser = subparsers.add_parser("downgrade", help="Downgrade the database")
    downgrade_parser.add_argument("revision", help="Revision to downgrade to")
    downgrade_parser.add_argument("-y", "--yes", action="store_true",
                                help="Skip confirmation prompt")
    downgrade_parser.set_defaults(func=downgrade_database)
    
    # History command
    history_parser = subparsers.add_parser("history", help="Show migration history")
    history_parser.add_argument("-v", "--verbose", action="store_true", 
                              help="Show detailed history")
    history_parser.set_defaults(func=show_history)
    
    # Current command
    current_parser = subparsers.add_parser("current", help="Show current migration")
    current_parser.add_argument("-v", "--verbose", action="store_true",
                               help="Show detailed information")
    current_parser.set_defaults(func=show_current)
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Run the selected function
    args.func(args)

if __name__ == "__main__":
    main()