# Utility Scripts

This directory contains utility scripts for various project operations.

## Directory Structure

- `/deploy/`: Deployment scripts
  - `deploy_staging.sh`: Script for deploying to staging environment
- `/backup_database.py`: Database backup script
- `/check_api_health.py`: API health check script
- `/check_migration_patterns.py`: Migration pattern verification script
- `/create_test_user.py`: Test user creation script
- `/deploy.py`: Main deployment script
- `/export_user_data.py`: User data export script
- `/generate_api_docs.py`: API documentation generation script
- `/monitor_migrations.py`: Migration monitoring script
- `/notify_deploy_status.py`: Deployment status notification script
- `/pre_migration_check.py`: Pre-migration verification script
- `/run_data_retention.py`: Data retention script
- `/seed_database.py`: Database seeding script
- `/seed_templates.py`: Template seeding script

## Usage Guidelines

1. Make all scripts executable (`chmod +x`)
2. Include help information for all scripts (`--help`)
3. Add proper error handling and logging to all scripts
4. Follow the pattern of existing scripts for new additions