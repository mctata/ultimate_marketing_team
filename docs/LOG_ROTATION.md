# Log Rotation System

This document describes the log rotation system implemented in the Ultimate Marketing Team project. The system ensures that log files are properly managed to prevent excessive disk space usage while maintaining historical log data for troubleshooting and analysis.

## Overview

The log rotation system consists of three main components:

1. **Core Rotation Functionality** in `scripts/utilities/logging_utils.py`: Built-in log rotation using Python's `RotatingFileHandler`.
2. **Log Cleanup Utility** in `scripts/utilities/log_management/log_cleanup.py`: Script to clean up old log files based on age.
3. **Log Rotation Configuration** in `scripts/utilities/log_management/log_rotation_config.py`: Tool to customize rotation settings for different components.

## Core Log Rotation

The core logging utility has been enhanced to use Python's `RotatingFileHandler` for automatic log rotation based on file size. Key features include:

- Size-based rotation: Configurable maximum file size (default: 10MB)
- Backup file count: Configurable number of backup files to keep (default: 5)
- Timestamped filenames: Log files include timestamps in their names for easier tracking
- Component-specific settings: Different components can have different rotation settings

## Log Cleanup Utility

The log cleanup utility provides age-based cleanup of log files. Key features include:

- Age-based deletion: Remove logs older than a specified number of days
- Component targeting: Clean up logs for specific components only
- Dry run mode: Preview which files would be deleted without actually removing them
- Command-line interface: Easy to use in scripts or scheduled tasks

### Usage Examples

```bash
# Delete logs older than 30 days (default)
python -m scripts.utilities.log_management.log_cleanup

# Delete logs older than 7 days
python -m scripts.utilities.log_management.log_cleanup --days 7

# Delete logs for a specific component
python -m scripts.utilities.log_management.log_cleanup --component database_operations

# Preview which files would be deleted without actually deleting them
python -m scripts.utilities.log_management.log_cleanup --dry-run
```

## Log Rotation Configuration

The log rotation configuration utility allows customizing rotation settings for different components. Key features include:

- Component-specific settings: Configure rotation parameters per component
- Global defaults: Set default rotation settings for all components
- Configuration persistence: Settings are saved to a JSON file
- Command-line interface: Easy to view and modify settings

### Usage Examples

```bash
# Show all rotation settings
python -m scripts.utilities.log_management.log_rotation_config show

# Show settings for a specific component
python -m scripts.utilities.log_management.log_rotation_config show --component api_metrics

# Set rotation settings for a component
python -m scripts.utilities.log_management.log_rotation_config set --component database_operations --max-size 20 --backup-count 10 --max-age 60

# Reset all settings to defaults
python -m scripts.utilities.log_management.log_rotation_config reset
```

## Implementation in Code

To use log rotation in your code, simply use the standard logging setup functions with the new rotation parameters:

```python
from scripts.utilities.logging_utils import setup_logger

# Basic usage with defaults (10MB max size, 5 backup files)
logger = setup_logger("my_component")

# Custom rotation settings
logger = setup_logger(
    "my_component",
    max_size_mb=5,     # 5MB max file size
    backup_count=3     # Keep 3 backup files
)
```

## Integration with cron/systemd

For production environments, the log cleanup utility should be scheduled to run periodically.

### Example cron job (daily cleanup)

```
0 2 * * * cd /path/to/project && python -m scripts.utilities.log_management.log_cleanup --days 30
```

### Example systemd timer (daily cleanup)

Create a service file `/etc/systemd/system/umt-log-cleanup.service`:

```ini
[Unit]
Description=Ultimate Marketing Team Log Cleanup
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/python3 -m scripts.utilities.log_management.log_cleanup --days 30
WorkingDirectory=/path/to/project

[Install]
WantedBy=multi-user.target
```

Create a timer file `/etc/systemd/system/umt-log-cleanup.timer`:

```ini
[Unit]
Description=Run Ultimate Marketing Team Log Cleanup daily

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start the timer:

```bash
systemctl enable umt-log-cleanup.timer
systemctl start umt-log-cleanup.timer
```

## Best Practices

1. **Component-Specific Settings**: Configure larger log sizes for critical components like database operations and API metrics.
2. **Retention Policies**: Define appropriate retention periods based on data importance and compliance requirements.
3. **Monitoring**: Regularly monitor log directory size to ensure rotation is working correctly.
4. **Backup**: Consider backing up important logs before cleanup operations.
5. **Permissions**: Ensure log directories have appropriate filesystem permissions.