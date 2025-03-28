# Logging Improvements

This document outlines the logging improvements made to the Ultimate Marketing Team project.

## Central Logging Utility

A central logging utility module has been created at `scripts/utilities/logging_utils.py` to standardize logging across all scripts. This module provides:

1. Consistent log file naming with timestamps
2. Both file and console logging
3. Centralized log directory management
4. Specialized loggers for subprocess output
5. Utility functions for common logging patterns

## Key Functions

- `setup_logger(component_name)`: Creates a logger with file and console handlers
- `get_component_logger(__file__)`: Creates a logger named after the current file
- `log_command_execution()`: Logs command execution with output and return code
- `log_database_operation()`: Logs database operations with standardized formatting
- `get_logs_dir()`: Gets the absolute path to the logs directory

## Updated Scripts

The following scripts have been updated to use the central logging utility:

1. `scripts/database/backup_database.py`
2. `scripts/database/check_migration_patterns.py`
3. `scripts/deployment/deploy.py`
4. `scripts/monitoring/check_api_health.py`

## Scripts To Be Updated

The following scripts still need to be updated to use the central logging utility:

1. `scripts/database/direct_db_users.py`
2. `scripts/database/pre_migration_check.py`
3. `scripts/notifications/notify_migration_status.py`
4. `scripts/monitoring/monitor_search_console_api.py`
5. `scripts/seeding/seed_database.py`
6. `scripts/testing/create_test_user.py`
7. `scripts/testing/create_test_users.py`

## Usage Example

```python
from scripts.utilities.logging_utils import setup_logger, log_command_execution

# Create a logger
logger = setup_logger("my_component")
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

## Next Steps

1. Update the remaining scripts to use the central logging utility
2. Implement log rotation for log files
3. Add a utility to clean up old log files
4. Consider adding a log viewer utility
5. Update CI/CD pipeline to archive logs as artifacts