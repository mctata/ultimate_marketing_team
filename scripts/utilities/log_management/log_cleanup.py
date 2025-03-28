#!/usr/bin/env python3
"""
Log cleanup utility script for the Ultimate Marketing Team project.

This script uses the logging_utils module to clean up old log files based
on their age, helping manage disk space usage.
"""

import os
import sys
import argparse
from datetime import datetime

# Add project root to path
script_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
project_root = os.path.dirname(script_dir)
sys.path.insert(0, project_root)

from scripts.utilities.logging_utils import (
    setup_logger, 
    cleanup_old_logs, 
    find_log_files
)

def main():
    """
    Main function to execute log cleanup operations.
    """
    parser = argparse.ArgumentParser(description='Clean up old log files')
    parser.add_argument(
        '--days', 
        type=int, 
        default=30, 
        help='Remove logs older than this many days (default: 30)'
    )
    parser.add_argument(
        '--component', 
        type=str, 
        default="*", 
        help='Only clean logs for a specific component (default: all components)'
    )
    parser.add_argument(
        '--dry-run', 
        action='store_true', 
        help='Only show which files would be deleted without actually removing them'
    )
    
    args = parser.parse_args()
    
    logger = setup_logger("log_cleanup")
    logger.info(f"Log cleanup started with parameters: days={args.days}, component={args.component}")
    
    if args.dry_run:
        # In dry run mode, just find and list the files that would be deleted
        log_files = find_log_files(args.component)
        total_files = len(log_files)
        logger.info(f"Found {total_files} log files matching pattern '{args.component}'")
        
        from scripts.utilities.logging_utils import parse_log_timestamp
        from datetime import timedelta
        
        cutoff_date = datetime.now() - timedelta(days=args.days)
        would_be_deleted = []
        
        for log_file in log_files:
            # Skip log files that have no timestamp in their name
            if "_" not in os.path.basename(log_file):
                continue
                
            # Try to parse timestamp from filename
            timestamp = parse_log_timestamp(log_file)
            if timestamp and timestamp < cutoff_date:
                would_be_deleted.append(log_file)
        
        logger.info(f"DRY RUN: Would delete {len(would_be_deleted)} files older than {args.days} days")
        for file in would_be_deleted:
            logger.info(f"Would delete: {file}")
    else:
        # Actually delete the old log files
        deleted_count = cleanup_old_logs(
            max_age_days=args.days,
            component_pattern=args.component
        )
        logger.info(f"Successfully deleted {deleted_count} log files older than {args.days} days")
    
    logger.info("Log cleanup completed")

if __name__ == "__main__":
    main()