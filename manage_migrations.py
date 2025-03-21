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
from pathlib import Path

# Ensure the project root is in the Python path
project_root = Path(__file__).resolve().parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

def run_alembic_command(command, check=True):
    """Run an Alembic command and print its output"""
    full_command = f"alembic {command}"
    print(f"Running: {full_command}")
    
    try:
        result = subprocess.run(
            full_command, 
            shell=True, 
            check=check, 
            capture_output=True,
            text=True
        )
        print(result.stdout)
        if result.stderr:
            print(f"Errors:\n{result.stderr}", file=sys.stderr)
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {full_command}", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        return False

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