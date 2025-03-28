# Utility Scripts

This directory contains utility scripts for various project operations, now organized by category.

## Directory Structure

- `/deploy/`: Deployment scripts
  - `deploy_staging.sh`: Script for deploying to staging environment
  - `quick_deploy.sh`: Simplified deployment script for manual deployment
- `/database/`: Database-related scripts
  - `backup_database.py`: Database backup script
  - `check_migration_patterns.py`: Migration pattern verification script
  - `direct_db_users.py`: Database user management script
  - `monitor_migrations.py`: Migration monitoring script
  - `pre_migration_check.py`: Pre-migration verification script
- `/migrations/`: Database migration scripts
  - `manage_migrations.py`: Helper script for managing Alembic migrations
- `/monitoring/`: Monitoring and health check scripts
  - `check_api_health.py`: API health check script
  - `get_docker_metrics.sh`: Docker metrics collection script
  - `monitor_search_console_api.py`: Search Console API monitoring script
- `/notifications/`: Notification scripts
  - `notify_deploy_status.py`: Deployment status notification script
  - `notify_migration_status.py`: Migration status notification script
  - `notify_test_status.py`: Test status notification script
- `/compliance/`: Compliance-related scripts
  - `export_user_data.py`: User data export script
  - `retention.sh`: Data retention shell script
  - `run_data_retention.py`: Data retention Python script
  - `run_compliance_tests.py`: Compliance testing script
  - `seed_compliance_data.sql`: Seed data for compliance testing
- `/seeding/`: Seeding scripts
  - `seed_database.py`: Database seeding script
  - `seed_templates.py`: Template seeding script
- `/testing/`: Testing utilities
  - `create_test_user.py`: Test user creation script
  - `create_test_users.py`: Multiple test user creation script
  - `test_calendar_websocket.py`: Calendar websocket testing script
  - `run_tests.py`: Test runner script
  - `/api/`: API testing scripts
    - `test_api.py`: General API testing script
    - `test_templates_api.py`: Templates API testing script
- `/utils/`: Utility scripts
  - `fix_imports.py`: Import fixer utility
  - `update_models.py`: Model update utility
- `/utilities/`: Misc utility scripts
  - `docker_create_users.sh`: Docker user creation script
  - `exporters.sh`: Data export utilities
  - `generate_api_docs.py`: API documentation generation script
  - `/log_management/`: Logging utilities
    - `demo_log_rotation.py`: Log rotation demo script
    - `log_cleanup.py`: Log cleanup utility
    - `log_rotation_config.py`: Log rotation configuration
    - `monitor_log_size.py`: Log size monitoring utility
- `/performance/`: Performance measurement scripts
  - `measure_docker_performance.sh`: Docker performance measurement script
- `run.py`: General purpose runner script

## Usage Guidelines

1. Make all scripts executable (`chmod +x`)
2. Include help information for all scripts (`--help`)
3. Add proper error handling and logging to all scripts
4. Follow the pattern of existing scripts for new additions