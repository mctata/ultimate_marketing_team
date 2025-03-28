# Implement Log Rotation System

This PR implements a comprehensive log rotation system for the Ultimate Marketing Team project. The system ensures that log files are properly managed to prevent excessive disk space usage while maintaining historical log data for troubleshooting and analysis.

## Changes Made

1. **Enhanced Logging Utility**:
   - Added size-based log rotation using Python's `RotatingFileHandler`
   - Configurable maximum file size (default: 10MB)
   - Configurable number of backup files (default: 5)

2. **Log Management Utilities**:
   - Added log cleanup utility to delete logs older than a specified age
   - Added log rotation configuration utility for component-specific settings
   - Created demonstration script to showcase rotation functionality

3. **Documentation**:
   - Added comprehensive documentation in `docs/LOG_ROTATION.md`
   - Updated existing `docs/LOGGING_SYSTEM.md` to reference log rotation
   - Updated `LOGGING_IMPROVEMENTS.md` with new features

4. **Tests**:
   - Added unit tests for log rotation features

## Benefits

- **Prevents Disk Space Issues**: Automatically manages log file sizes
- **Customizable Retention**: Different components can have different retention policies
- **Easy Maintenance**: Includes utilities for cleaning up old log files
- **Configurable**: Settings can be adjusted per component or globally

## Implementation Details

The implementation uses Python's built-in `RotatingFileHandler` for size-based rotation and adds custom functions for age-based cleanup. Configuration settings are stored in JSON format for persistence.

### Core Features

- **Automatic Size-Based Rotation**: Log files automatically rotate when they reach their size limit
- **Backup File Management**: Maintains a configurable number of backup files
- **Age-Based Cleanup**: Scheduled cleanup of old log files
- **Component-Specific Settings**: Different settings for different components

## Testing

Comprehensive unit tests have been added to verify:
- Log rotation occurs correctly when size limits are reached
- Log cleanup correctly identifies and removes old log files
- Configuration settings are properly applied

## Documentation

- [`docs/LOG_ROTATION.md`](docs/LOG_ROTATION.md): Detailed documentation of the log rotation system
- [`scripts/utilities/log_management/README.md`](scripts/utilities/log_management/README.md): Usage guide for log management utilities

## How to Use

```python
# Basic usage with default rotation settings
logger = setup_logger("my_component")

# Custom rotation settings
logger = setup_logger(
    "my_component",
    max_size_mb=5,      # 5MB max file size
    backup_count=3      # Keep 3 backup files
)
```

To clean up old log files:
```bash
python -m scripts.utilities.log_management.log_cleanup --days 30
```