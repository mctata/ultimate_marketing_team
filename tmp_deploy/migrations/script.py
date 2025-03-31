"""
Migration helper script for the Ultimate Marketing Team

This script helps to automate common migration tasks:
1. Create a new migration
2. Upgrade the database to the latest version
3. Downgrade the database to a previous version
4. Show migration history
"""

import os
import sys
import argparse
import subprocess

def run_command(command):
    """Run a command and print its output"""
    try:
        result = subprocess.check_output(command, shell=True)
        print(result.decode('utf-8'))
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {command}")
        print(e.output.decode('utf-8'))
        return False

def create_migration(args):
    """Create a new migration"""
    message = args.message
    if not message:
        message = input("Enter a message for the migration: ")
    
    autogenerate = "--autogenerate" if args.autogenerate else ""
    command = f"alembic revision {autogenerate} -m \"{message}\""
    return run_command(command)

def upgrade(args):
    """Upgrade the database to a specific revision"""
    revision = args.revision or "head"
    command = f"alembic upgrade {revision}"
    return run_command(command)

def downgrade(args):
    """Downgrade the database to a specific revision"""
    revision = args.revision
    if not revision:
        print("Error: You must specify a revision to downgrade to")
        return False
    
    command = f"alembic downgrade {revision}"
    return run_command(command)

def history(args):
    """Show migration history"""
    command = "alembic history"
    verbose = "-v" if args.verbose else ""
    command = f"{command} {verbose}"
    return run_command(command)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="UMT Database Migration Tool")
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
    upgrade_parser.set_defaults(func=upgrade)
    
    # Downgrade command
    downgrade_parser = subparsers.add_parser("downgrade", help="Downgrade the database")
    downgrade_parser.add_argument("revision", help="Revision to downgrade to")
    downgrade_parser.set_defaults(func=downgrade)
    
    # History command
    history_parser = subparsers.add_parser("history", help="Show migration history")
    history_parser.add_argument("-v", "--verbose", action="store_true", 
                               help="Show detailed history")
    history_parser.set_defaults(func=history)
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Run the selected function
    args.func(args)

if __name__ == "__main__":
    main()