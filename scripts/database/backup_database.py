#!/usr/bin/env python
"""
Database Backup Script

This script creates a backup of the PostgreSQL database before migrations.
It's used in the CI/CD pipeline to ensure data safety.
"""

import argparse
import os
import subprocess
import sys
from datetime import datetime

# Import the logging utility
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from scripts.utilities.logging_utils import setup_logger, log_command_execution

# S3 bucket for database backups
DEFAULT_S3_BUCKET = "umt-database-backups"

# Set up logger
logger = setup_logger("database_backup")


def create_backup(db_name, db_user, db_password, db_host, db_port, output_dir, backup_name=None):
    """Create a PostgreSQL database backup.
    
    Args:
        db_name (str): Database name
        db_user (str): Database user
        db_password (str): Database password
        db_host (str): Database host
        db_port (str): Database port
        output_dir (str): Directory to store backup
        backup_name (str): Custom backup filename
        
    Returns:
        str: Path to backup file
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate backup filename
    if not backup_name:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{db_name}_{timestamp}.sql"
    
    backup_path = os.path.join(output_dir, backup_name)
    
    # Set environment variable for password
    env = os.environ.copy()
    env["PGPASSWORD"] = db_password
    
    # Build the pg_dump command
    command = [
        "pg_dump",
        "-h", db_host,
        "-p", db_port,
        "-U", db_user,
        "-d", db_name,
        "-f", backup_path
    ]
    
    # Convert command array to string for logging (masking password)
    command_str = " ".join(command)
    
    try:
        logger.info(f"Creating database backup: {backup_path}")
        process = subprocess.run(command, env=env, check=True, capture_output=True, text=True)
        
        if os.path.exists(backup_path):
            backup_size = os.path.getsize(backup_path) / (1024 * 1024)  # Size in MB
            logger.info(f"Backup created successfully: {backup_path} ({backup_size:.2f} MB)")
            return backup_path
        else:
            logger.error("Backup file not created")
            log_command_execution(
                logger,
                command_str,
                process.stdout,
                1,  # Simulating error code since file doesn't exist
                process.stderr
            )
            return None
    except subprocess.CalledProcessError as e:
        logger.error(f"Database backup failed: {e}")
        log_command_execution(
            logger,
            command_str,
            e.stdout,
            e.returncode,
            e.stderr
        )
        return None


def upload_to_s3(file_path, bucket_name, s3_key=None):
    """Upload backup file to S3.
    
    Args:
        file_path (str): Path to backup file
        bucket_name (str): S3 bucket name
        s3_key (str): S3 object key
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not s3_key:
        s3_key = os.path.basename(file_path)
    
    command = [
        "aws", "s3", "cp",
        file_path,
        f"s3://{bucket_name}/{s3_key}"
    ]
    command_str = " ".join(command)
    
    try:
        logger.info(f"Uploading backup to S3: s3://{bucket_name}/{s3_key}")
        process = subprocess.run(command, check=True, capture_output=True, text=True)
        logger.info("Backup uploaded successfully")
        log_command_execution(
            logger,
            command_str,
            process.stdout,
            process.returncode,
            ""
        )
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"S3 upload failed: {e}")
        log_command_execution(
            logger,
            command_str,
            e.stdout,
            e.returncode,
            e.stderr
        )
        return False


def main():
    parser = argparse.ArgumentParser(description='Database Backup Tool')
    parser.add_argument('--db-name', default=os.environ.get('POSTGRES_DB', 'ultimatemarketing'),
                      help='Database name')
    parser.add_argument('--db-user', default=os.environ.get('POSTGRES_USER', 'postgres'),
                      help='Database user')
    parser.add_argument('--db-password', default=os.environ.get('POSTGRES_PASSWORD', 'postgres'),
                      help='Database password')
    parser.add_argument('--db-host', default=os.environ.get('POSTGRES_HOST', 'localhost'),
                      help='Database host')
    parser.add_argument('--db-port', default=os.environ.get('POSTGRES_PORT', '5432'),
                      help='Database port')
    parser.add_argument('--output-dir', default='./logs/backups',
                      help='Directory to store backup')
    parser.add_argument('--upload-to-s3', action='store_true',
                      help='Upload backup to S3')
    parser.add_argument('--s3-bucket', default=os.environ.get('S3_BACKUP_BUCKET', DEFAULT_S3_BUCKET),
                      help='S3 bucket name')
    parser.add_argument('--environment', default=os.environ.get('ENVIRONMENT', 'development'),
                      help='Environment name (development, staging, production)')
    
    args = parser.parse_args()
    
    logger.info(f"Starting database backup for {args.db_name} in {args.environment} environment")
    
    # Create backup filename with environment
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"{args.db_name}_{args.environment}_{timestamp}.sql"
    
    # Create backup
    backup_path = create_backup(
        args.db_name,
        args.db_user,
        args.db_password,
        args.db_host,
        args.db_port,
        args.output_dir,
        backup_name
    )
    
    if not backup_path:
        logger.error("Database backup failed, exiting with error code 1")
        sys.exit(1)
    
    # Upload to S3 if requested
    if args.upload_to_s3:
        s3_key = f"{args.environment}/{backup_name}"
        if not upload_to_s3(backup_path, args.s3_bucket, s3_key):
            logger.error("S3 upload failed, exiting with error code 1")
            sys.exit(1)
    
    logger.info("Database backup completed successfully")
    sys.exit(0)


if __name__ == "__main__":
    main()