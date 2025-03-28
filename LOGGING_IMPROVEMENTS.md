# Logging Improvements

This document outlines the logging improvements made to the Ultimate Marketing Team project.

## Central Logging Utility

A central logging utility module has been created at `scripts/utilities/logging_utils.py` to standardize logging across all scripts. This module provides:

1. Consistent log file naming with timestamps
2. Both file and console logging
3. Centralized log directory management
4. Specialized loggers for subprocess output
5. Utility functions for common logging patterns
6. **NEW**: Automatic log rotation based on file size
7. **NEW**: Cleanup utilities for old log files

## Key Functions

- `setup_logger(component_name)`: Creates a logger with file and console handlers
- `get_component_logger(__file__)`: Creates a logger named after the current file
- `log_command_execution()`: Logs command execution with output and return code
- `log_database_operation()`: Logs database operations with standardized formatting
- `get_logs_dir()`: Gets the absolute path to the logs directory
- **NEW**: `find_log_files()`: Finds log files matching a pattern
- **NEW**: `cleanup_old_logs()`: Deletes log files older than specified days

## Updated Scripts

The following scripts have been updated to use the central logging utility:

1. `scripts/database/backup_database.py`
2. `scripts/database/check_migration_patterns.py`
3. `scripts/deployment/deploy.py`
4. `scripts/monitoring/check_api_health.py`
5. `scripts/notifications/notify_deploy_status.py`
6. `scripts/notifications/notify_test_status.py`
7. `scripts/notifications/notify_migration_status.py`
8. `scripts/database/direct_db_users.py`
9. `scripts/database/pre_migration_check.py`

## Log Rotation and Management

**NEW** Log rotation features have been implemented:

1. **Automatic Size-Based Rotation**: Log files now automatically rotate when they reach a configurable size limit (default: 10MB)
2. **Configurable Backup Count**: The number of backup files to keep is configurable (default: 5)
3. **Age-Based Cleanup**: A utility to delete log files older than a specified number of days
4. **Component-Specific Settings**: Different components can have different rotation and retention settings

## New Utilities

The following new utility scripts have been added:

1. `scripts/utilities/log_management/log_cleanup.py`: Script to clean up old log files
2. `scripts/utilities/log_management/log_rotation_config.py`: Tool to configure rotation settings
3. `scripts/utilities/log_management/demo_log_rotation.py`: Demonstration script for log rotation

## Usage Example

```python
from scripts.utilities.logging_utils import setup_logger, log_command_execution

# Create a logger with rotation settings
logger = setup_logger(
    "my_component",
    max_size_mb=5,      # 5MB max file size
    backup_count=3      # Keep 3 backup files
)
logger.info("Starting process")

# Log command execution
command = "docker-compose up -d"
process = subprocess.run(command, shell=True, capture_output=True, text=True)
log_command_execution(
    logger,
    command,
    process.stdout,
    process.returncode,
    process.stderr
)
```

## Log Cleanup Example

```bash
# Delete logs older than 30 days
python -m scripts.utilities.log_management.log_cleanup

# Delete logs older than 7 days for a specific component
python -m scripts.utilities.log_management.log_cleanup --days 7 --component database_operations
```

## Documentation

Detailed documentation for the logging system is available in:

1. `docs/LOGGING_SYSTEM.md`: Core logging system documentation
2. `docs/LOG_ROTATION.md`: Log rotation and management documentation

## Next Steps

1. ✓ ~~Update the remaining scripts to use the central logging utility~~
2. ✓ ~~Implement log rotation for log files~~
3. ✓ ~~Add a utility to clean up old log files~~
4. Add monitoring for log directory size
5. Update CI/CD pipeline to archive logs as artifacts
6. Add automated testing for logging utilities