#!/usr/bin/env python
"""
Deployment Script

This script handles the deployment process for different environments.
It includes:
1. Database backup
2. Database migration
3. Service deployment
4. Health checks
5. Rollback if needed
"""

import argparse
import os
import sys
import time
import json
import subprocess
from datetime import datetime

# Environment constants
ENV_DEVELOPMENT = "development"
ENV_STAGING = "staging"
ENV_PRODUCTION = "production"

# Default configuration
DEFAULT_CONFIG = {
    "services": ["api-gateway", "frontend", "auth-agent", "brand-agent", 
                 "content-strategy-agent", "content-creation-agent", "content-ad-agent"],
    "health_check_retries": 5,
    "health_check_delay": 3,
    "enable_backup": True,
    "enable_rollback": True,
    "notification_email": None,
    "slack_webhook": None
}

# Configuration by environment
ENV_CONFIG = {
    ENV_DEVELOPMENT: {
        "docker_compose_file": "docker-compose.yml",
        "aws_profile": "umt-dev",
        "aws_region": "us-east-1",
        "s3_backup_bucket": "umt-dev-backups",
        "health_check_url": "http://localhost:8000/api/health",
        "verification_timeout": 60
    },
    ENV_STAGING: {
        "docker_compose_file": "docker-compose.staging.yml",
        "aws_profile": "umt-staging",
        "aws_region": "us-east-1",
        "s3_backup_bucket": "umt-staging-backups",
        "health_check_url": "https://staging-api.ultimatemarketing.com/api/health",
        "verification_timeout": 120,
        "notification_email": "team@ultimatemarketing.com",
        "slack_webhook": "https://hooks.slack.com/services/STAGING_WEBHOOK"
    },
    ENV_PRODUCTION: {
        "docker_compose_file": "docker-compose.production.yml",
        "aws_profile": "umt-production",
        "aws_region": "us-west-2",
        "s3_backup_bucket": "umt-production-backups",
        "health_check_url": "https://api.ultimatemarketing.com/api/health",
        "verification_timeout": 180,
        "notification_email": "ops@ultimatemarketing.com",
        "slack_webhook": "https://hooks.slack.com/services/PRODUCTION_WEBHOOK",
        "approval_required": True
    }
}


def log_message(message, level="INFO"):
    """Log a message with timestamp.
    
    Args:
        message (str): Message to log
        level (str): Log level
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")


def send_notification(subject, message, config):
    """Send notification via email and/or Slack.
    
    Args:
        subject (str): Notification subject
        message (str): Notification message
        config (dict): Configuration dictionary
        
    Returns:
        bool: True if successful, False otherwise
    """
    success = True
    
    # Send email if configured
    if config.get("notification_email"):
        log_message(f"Sending email notification to {config['notification_email']}")
        # In a real implementation, this would send an actual email
        log_message(f"Email Subject: {subject}")
        log_message(f"Email Body: {message}")
    
    # Send Slack message if configured
    if config.get("slack_webhook"):
        log_message(f"Sending Slack notification")
        # In a real implementation, this would send a message to Slack
        log_message(f"Slack Message: {subject} - {message}")
    
    return success


def run_backup(environment, config):
    """Run database backup.
    
    Args:
        environment (str): Environment name
        config (dict): Configuration dictionary
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not config.get("enable_backup", True):
        log_message("Database backup skipped (disabled in config)")
        return True
    
    log_message(f"Starting database backup for {environment} environment")
    
    backup_cmd = [
        "python", "scripts/backup_database.py",
        "--environment", environment,
        "--output-dir", "./backups"
    ]
    
    if config.get("s3_backup_bucket"):
        backup_cmd.extend(["--upload-to-s3", "--s3-bucket", config["s3_backup_bucket"]])
    
    try:
        process = subprocess.run(backup_cmd, check=True, capture_output=True, text=True)
        log_message("Database backup completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        log_message(f"Database backup failed: {e}", "ERROR")
        log_message(f"Command output: {e.stdout}", "ERROR")
        log_message(f"Command error: {e.stderr}", "ERROR")
        return False


def run_migrations(environment, config):
    """Run database migrations.
    
    Args:
        environment (str): Environment name
        config (dict): Configuration dictionary
        
    Returns:
        tuple: (success, version)
            success (bool): True if successful, False otherwise
            version (str): Migration version if successful, None otherwise
    """
    log_message(f"Starting database migrations for {environment} environment")
    
    # First check current version
    monitor_cmd = [
        "python", "scripts/monitor_migrations.py",
        "--output", "json",
        "--database-url", os.environ.get("DATABASE_URL")
    ]
    
    try:
        process = subprocess.run(monitor_cmd, check=True, capture_output=True, text=True)
        pre_migration_status = json.loads(process.stdout)
        pre_version = pre_migration_status.get("current_version")
        log_message(f"Current migration version: {pre_version}")
    except Exception as e:
        log_message(f"Failed to check current migration version: {e}", "ERROR")
        return False, None
    
    # Run migrations
    docker_compose_file = config.get("docker_compose_file", "docker-compose.yml")
    migration_cmd = [
        "docker-compose", "-f", docker_compose_file, "up", "-d", "migrations"
    ]
    
    try:
        log_message("Running migrations")
        process = subprocess.run(migration_cmd, check=True, capture_output=True, text=True)
        
        # Wait for migrations to complete
        log_message("Waiting for migrations to complete")
        time.sleep(10)  # Give migrations time to start
        
        # Check migration status
        process = subprocess.run(monitor_cmd, check=True, capture_output=True, text=True)
        post_migration_status = json.loads(process.stdout)
        
        if post_migration_status.get("status") == "OK":
            post_version = post_migration_status.get("current_version")
            log_message(f"Migrations completed successfully. New version: {post_version}")
            return True, post_version
        elif post_migration_status.get("status") == "IN_PROGRESS":
            log_message("Migrations still in progress, continuing to wait", "WARNING")
            
            # Wait up to 2 minutes for migrations to complete
            start_time = time.time()
            while time.time() - start_time < 120:
                time.sleep(10)
                process = subprocess.run(monitor_cmd, check=True, capture_output=True, text=True)
                status = json.loads(process.stdout)
                
                if status.get("status") == "OK":
                    post_version = status.get("current_version")
                    log_message(f"Migrations completed successfully. New version: {post_version}")
                    return True, post_version
                elif status.get("status") != "IN_PROGRESS":
                    log_message(f"Migration failed: {status.get('message')}", "ERROR")
                    return False, None
            
            log_message("Migrations timed out", "ERROR")
            return False, None
        else:
            log_message(f"Migration failed: {post_migration_status.get('message')}", "ERROR")
            return False, None
    except subprocess.CalledProcessError as e:
        log_message(f"Migration command failed: {e}", "ERROR")
        log_message(f"Command output: {e.stdout}", "ERROR")
        log_message(f"Command error: {e.stderr}", "ERROR")
        return False, None


def deploy_services(environment, config, services=None):
    """Deploy services.
    
    Args:
        environment (str): Environment name
        config (dict): Configuration dictionary
        services (list): List of services to deploy, None for all
        
    Returns:
        bool: True if successful, False otherwise
    """
    log_message(f"Deploying services for {environment} environment")
    
    docker_compose_file = config.get("docker_compose_file", "docker-compose.yml")
    
    if services is None:
        services = config.get("services", DEFAULT_CONFIG["services"])
    
    log_message(f"Deploying services: {', '.join(services)}")
    
    deploy_cmd = [
        "docker-compose", "-f", docker_compose_file, "up", "-d"
    ] + services
    
    try:
        process = subprocess.run(deploy_cmd, check=True, capture_output=True, text=True)
        log_message("Services deployed successfully")
        return True
    except subprocess.CalledProcessError as e:
        log_message(f"Service deployment failed: {e}", "ERROR")
        log_message(f"Command output: {e.stdout}", "ERROR")
        log_message(f"Command error: {e.stderr}", "ERROR")
        return False


def check_health(config):
    """Check service health.
    
    Args:
        config (dict): Configuration dictionary
        
    Returns:
        bool: True if healthy, False otherwise
    """
    log_message("Checking service health")
    
    health_check_url = config.get("health_check_url")
    retries = config.get("health_check_retries", DEFAULT_CONFIG["health_check_retries"])
    delay = config.get("health_check_delay", DEFAULT_CONFIG["health_check_delay"])
    
    if not health_check_url:
        log_message("No health check URL configured, skipping health check", "WARNING")
        return True
    
    health_check_cmd = [
        "python", "scripts/check_api_health.py",
        "--url", health_check_url,
        "--retries", str(retries),
        "--delay", str(delay)
    ]
    
    try:
        process = subprocess.run(health_check_cmd, check=True, capture_output=True, text=True)
        log_message("Health check passed")
        return True
    except subprocess.CalledProcessError as e:
        log_message(f"Health check failed: {e}", "ERROR")
        log_message(f"Command output: {e.stdout}", "ERROR")
        log_message(f"Command error: {e.stderr}", "ERROR")
        return False


def rollback_migration(environment, config, target_version):
    """Rollback migration to target version.
    
    Args:
        environment (str): Environment name
        config (dict): Configuration dictionary
        target_version (str): Target migration version
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not config.get("enable_rollback", True):
        log_message("Migration rollback skipped (disabled in config)", "WARNING")
        return True
    
    log_message(f"Rolling back migration to version {target_version}")
    
    # Use alembic directly for rollback
    rollback_cmd = [
        "docker-compose", "-f", config.get("docker_compose_file", "docker-compose.yml"),
        "run", "--rm", "migrations",
        "alembic", "downgrade", target_version
    ]
    
    try:
        process = subprocess.run(rollback_cmd, check=True, capture_output=True, text=True)
        log_message(f"Migration rolled back successfully to version {target_version}")
        return True
    except subprocess.CalledProcessError as e:
        log_message(f"Migration rollback failed: {e}", "ERROR")
        log_message(f"Command output: {e.stdout}", "ERROR")
        log_message(f"Command error: {e.stderr}", "ERROR")
        return False


def request_deployment_approval(environment, config):
    """Request approval for deployment to production.
    
    Args:
        environment (str): Environment name
        config (dict): Configuration dictionary
        
    Returns:
        bool: True if approved, False otherwise
    """
    if environment != ENV_PRODUCTION:
        return True
    
    if not config.get("approval_required", False):
        return True
    
    log_message("Requesting approval for production deployment")
    
    # In a real implementation, this would integrate with a ticketing system
    # or send emails to approvers. For this example, we'll simulate approval.
    
    # Send notification about pending approval
    if config.get("notification_email") or config.get("slack_webhook"):
        subject = "APPROVAL REQUIRED: Production Deployment"
        message = (
            "A production deployment is pending approval.\n"
            f"Requested at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"Environment: {environment}\n"
            "Please review and approve this deployment."
        )
        send_notification(subject, message, config)
    
    # For the simulation, we'll immediately approve
    log_message("Production deployment approved (simulation)")
    return True


def deploy(environment, services=None, skip_migrations=False, skip_backup=False, db_only=False):
    """Run the deployment process.
    
    Args:
        environment (str): Environment name
        services (list): List of services to deploy, None for all
        skip_migrations (bool): Skip database migrations
        skip_backup (bool): Skip database backup
        db_only (bool): Only run database migration
        
    Returns:
        bool: True if deployment successful, False otherwise
    """
    log_message(f"Starting deployment for {environment} environment")
    
    # Merge default config with environment-specific config
    config = {**DEFAULT_CONFIG, **(ENV_CONFIG.get(environment, {}))}
    
    if skip_backup:
        config["enable_backup"] = False
    
    # Request approval for production deployment
    if not request_deployment_approval(environment, config):
        log_message("Deployment not approved, aborting", "ERROR")
        return False
    
    # 1. Database backup
    if not skip_backup and not run_backup(environment, config):
        log_message("Database backup failed, aborting deployment", "ERROR")
        send_notification(
            f"[{environment.upper()}] Deployment Failed",
            "Database backup failed, deployment aborted",
            config
        )
        return False
    
    # 2. Database migration
    pre_migration_version = None
    if not skip_migrations:
        migration_success, new_version = run_migrations(environment, config)
        if not migration_success:
            log_message("Database migration failed, aborting deployment", "ERROR")
            send_notification(
                f"[{environment.upper()}] Deployment Failed",
                "Database migration failed, deployment aborted",
                config
            )
            return False
    
    # Stop here if db_only flag is set
    if db_only:
        log_message("Database operations completed successfully")
        send_notification(
            f"[{environment.upper()}] Database Update Successful",
            "Database operations completed successfully",
            config
        )
        return True
    
    # 3. Service deployment
    if not deploy_services(environment, config, services):
        log_message("Service deployment failed", "ERROR")
        
        if not skip_migrations and pre_migration_version:
            log_message("Attempting to rollback database migration")
            if rollback_migration(environment, config, pre_migration_version):
                log_message("Database migration rolled back successfully")
            else:
                log_message("Database migration rollback failed", "ERROR")
        
        send_notification(
            f"[{environment.upper()}] Deployment Failed",
            "Service deployment failed, see logs for details",
            config
        )
        
        return False
    
    # 4. Health check
    verification_timeout = config.get("verification_timeout", 60)
    log_message(f"Waiting {verification_timeout} seconds for services to start")
    time.sleep(verification_timeout)
    
    if not check_health(config):
        log_message("Health check failed, attempting rollback", "ERROR")
        
        # 5. Rollback if needed
        if not skip_migrations and pre_migration_version:
            log_message("Attempting to rollback database migration")
            if rollback_migration(environment, config, pre_migration_version):
                log_message("Database migration rolled back successfully")
            else:
                log_message("Database migration rollback failed", "ERROR")
        
        send_notification(
            f"[{environment.upper()}] Deployment Failed",
            "Health check failed after deployment, services may be down",
            config
        )
        
        return False
    
    # 6. Success notification
    log_message(f"Deployment to {environment} completed successfully")
    send_notification(
        f"[{environment.upper()}] Deployment Successful",
        f"Deployment to {environment} completed successfully",
        config
    )
    
    return True


def main():
    parser = argparse.ArgumentParser(description='Deployment Tool')
    parser.add_argument('--environment', choices=[ENV_DEVELOPMENT, ENV_STAGING, ENV_PRODUCTION],
                      default=ENV_DEVELOPMENT, help='Target environment')
    parser.add_argument('--services', nargs='+', 
                      help='Specific services to deploy (space-separated)')
    parser.add_argument('--skip-migrations', action='store_true',
                      help='Skip database migrations')
    parser.add_argument('--skip-backup', action='store_true',
                      help='Skip database backup')
    parser.add_argument('--db-only', action='store_true',
                      help='Only run database migrations, skip service deployment')
    
    args = parser.parse_args()
    
    success = deploy(
        args.environment,
        args.services,
        args.skip_migrations,
        args.skip_backup,
        args.db_only
    )
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()