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

# S3 bucket for database backups
DEFAULT_S3_BUCKET = "umt-database-backups"


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
    
    try:
        print(f"Creating database backup: {backup_path}")
        process = subprocess.run(command, env=env, check=True, capture_output=True, text=True)
        
        if os.path.exists(backup_path):
            backup_size = os.path.getsize(backup_path) / (1024 * 1024)  # Size in MB
            print(f"Backup created successfully: {backup_path} ({backup_size:.2f} MB)")
            return backup_path
        else:
            print("ERROR: Backup file not created")
            print(f"Command output: {process.stdout}")
            print(f"Command error: {process.stderr}")
            return None
    except subprocess.CalledProcessError as e:
        print(f"ERROR: Database backup failed: {e}")
        print(f"Command output: {e.stdout}")
        print(f"Command error: {e.stderr}")
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
    
    try:
        print(f"Uploading backup to S3: s3://{bucket_name}/{s3_key}")
        process = subprocess.run(command, check=True, capture_output=True, text=True)
        print("Backup uploaded successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"ERROR: S3 upload failed: {e}")
        print(f"Command output: {e.stdout}")
        print(f"Command error: {e.stderr}")
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
        sys.exit(1)
    
    # Upload to S3 if requested
    if args.upload_to_s3:
        s3_key = f"{args.environment}/{backup_name}"
        if not upload_to_s3(backup_path, args.s3_bucket, s3_key):
            sys.exit(1)
    
    print("Database backup completed successfully")
    sys.exit(0)


if __name__ == "__main__":
    main()