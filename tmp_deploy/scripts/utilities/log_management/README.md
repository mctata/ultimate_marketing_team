# Log Management Utilities

This directory contains utilities for managing log files in the Ultimate Marketing Team project.

## Overview

The log management utilities work with the centralized logging system to handle log rotation, cleanup, and configuration. These utilities help prevent excessive disk space usage and manage log retention policies.

## Available Utilities

### Log Cleanup

The `log_cleanup.py` utility deletes log files older than a specified number of days.

```bash
# Basic usage (deletes logs older than 30 days)
python log_cleanup.py

# Delete logs older than 7 days
python log_cleanup.py --days 7

# Delete logs for a specific component
python log_cleanup.py --component database_operations

# Preview which files would be deleted without actually removing them
python log_cleanup.py --dry-run
```

### Log Rotation Configuration

The `log_rotation_config.py` utility lets you customize log rotation settings for different components.

```bash
# Show all rotation settings
python log_rotation_config.py show

# Show settings for a specific component
python log_rotation_config.py show --component api_metrics

# Set rotation settings for a component
python log_rotation_config.py set --component database_operations --max-size 20 --backup-count 10 --max-age 60

# Reset all settings to defaults
python log_rotation_config.py reset
```

### Log Rotation Demonstration

The `demo_log_rotation.py` utility demonstrates log rotation by generating log messages that trigger rotation.

```bash
# Run the demo
python demo_log_rotation.py
```

## Integration with cron

For production environments, the log cleanup utility should be scheduled to run periodically using cron:

```
# Daily cleanup at 2:00 AM, deleting logs older than 30 days
0 2 * * * cd /path/to/project && python -m scripts.utilities.log_management.log_cleanup --days 30
```

## Further Reading

For more information about the logging system and log rotation, see:

- [LOGGING_SYSTEM.md](../../../docs/LOGGING_SYSTEM.md) - Core logging system documentation
- [LOG_ROTATION.md](../../../docs/LOG_ROTATION.md) - Log rotation and management documentation