#!/usr/bin/env python3
"""
Monitor log directory size for the Ultimate Marketing Team project.

This script checks the size of the logs directory and sends alerts
if it exceeds specified thresholds.
"""

import os
import sys
import argparse
import smtplib
from email.message import EmailMessage
from datetime import datetime

# Add project root to path
script_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
project_root = os.path.dirname(script_dir)
sys.path.insert(0, project_root)

from scripts.utilities.logging_utils import setup_logger, get_logs_dir, find_log_files

def get_directory_size(directory):
    """
    Calculate the total size of a directory in bytes.
    
    Args:
        directory: Path to the directory
        
    Returns:
        int: Total size in bytes
    """
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(directory):
        for filename in filenames:
            file_path = os.path.join(dirpath, filename)
            if not os.path.islink(file_path):
                total_size += os.path.getsize(file_path)
    return total_size

def format_size(size_bytes):
    """
    Format size in bytes to human-readable format.
    
    Args:
        size_bytes: Size in bytes
        
    Returns:
        str: Human-readable size (e.g., "2.5 MB")
    """
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} PB"

def get_component_sizes():
    """
    Get sizes of log files grouped by component.
    
    Returns:
        dict: Dictionary of component names and their total log size
    """
    logs_dir = get_logs_dir()
    component_sizes = {}
    
    for file_path in find_log_files():
        file_name = os.path.basename(file_path)
        component_name = file_name.split('_')[0]
        
        if component_name not in component_sizes:
            component_sizes[component_name] = 0
        
        component_sizes[component_name] += os.path.getsize(file_path)
    
    return component_sizes

def send_email_alert(recipient, subject, body):
    """
    Send email alert about log directory size.
    
    Args:
        recipient: Email recipient
        subject: Email subject
        body: Email body text
    """
    # This is a placeholder - in a real implementation, you would configure
    # this with actual SMTP settings from environment variables or config
    smtp_server = os.environ.get('SMTP_SERVER', 'localhost')
    smtp_port = int(os.environ.get('SMTP_PORT', 25))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    sender = os.environ.get('ALERT_SENDER', 'alerts@example.com')
    
    msg = EmailMessage()
    msg.set_content(body)
    msg['Subject'] = subject
    msg['From'] = sender
    msg['To'] = recipient
    
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        if smtp_user and smtp_password:
            server.starttls()
            server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

def main():
    """
    Main function to monitor log directory size.
    """
    parser = argparse.ArgumentParser(description='Monitor log directory size')
    parser.add_argument(
        '--warning', 
        type=float, 
        default=100, 
        help='Warning threshold in MB (default: 100MB)'
    )
    parser.add_argument(
        '--critical', 
        type=float, 
        default=500, 
        help='Critical threshold in MB (default: 500MB)'
    )
    parser.add_argument(
        '--email', 
        type=str, 
        help='Email address for alerts'
    )
    
    args = parser.parse_args()
    
    logger = setup_logger("log_monitor")
    logger.info("Log directory size monitoring started")
    
    logs_dir = get_logs_dir()
    total_size_bytes = get_directory_size(logs_dir)
    total_size_mb = total_size_bytes / (1024 * 1024)
    
    logger.info(f"Log directory size: {format_size(total_size_bytes)}")
    
    # Get sizes by component
    component_sizes = get_component_sizes()
    largest_components = sorted(
        component_sizes.items(), 
        key=lambda x: x[1], 
        reverse=True
    )[:5]  # Top 5 largest components
    
    for component, size in largest_components:
        logger.info(f"Component '{component}' log size: {format_size(size)}")
    
    # Check thresholds
    if total_size_mb >= args.critical:
        level = "CRITICAL"
        logger.critical(
            f"Log directory size ({format_size(total_size_bytes)}) "
            f"exceeds critical threshold ({args.critical} MB)"
        )
    elif total_size_mb >= args.warning:
        level = "WARNING"
        logger.warning(
            f"Log directory size ({format_size(total_size_bytes)}) "
            f"exceeds warning threshold ({args.warning} MB)"
        )
    else:
        level = "OK"
        logger.info(
            f"Log directory size ({format_size(total_size_bytes)}) "
            f"is below warning threshold ({args.warning} MB)"
        )
    
    # Send email alert if threshold exceeded and email provided
    if args.email and level in ["WARNING", "CRITICAL"]:
        subject = f"[{level}] Ultimate Marketing Team Log Size Alert"
        body = f"""
Log Directory Size Alert

Status: {level}
Size: {format_size(total_size_bytes)}
Threshold: {args.warning} MB (Warning) / {args.critical} MB (Critical)
Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Top 5 largest components:
"""
        
        for component, size in largest_components:
            body += f"- {component}: {format_size(size)}\n"
        
        body += """
Recommended actions:
1. Run the log cleanup utility with a shorter retention period:
   python -m scripts.utilities.log_management.log_cleanup --days 7
   
2. Review component-specific log rotation settings:
   python -m scripts.utilities.log_management.log_rotation_config show
   
3. Increase disk space or adjust rotation settings for large components.
"""
        
        logger.info(f"Sending alert email to {args.email}")
        send_email_alert(args.email, subject, body)
    
    logger.info("Log directory size monitoring completed")
    
    # Return exit code based on status
    if level == "CRITICAL":
        return 2
    elif level == "WARNING":
        return 1
    else:
        return 0

if __name__ == "__main__":
    sys.exit(main())