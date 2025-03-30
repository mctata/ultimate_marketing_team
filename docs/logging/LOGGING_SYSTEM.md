# Ultimate Marketing Team Logging System

This document describes the centralized logging system implemented in the Ultimate Marketing Team project. The system provides standardized logging functionality across all components of the application, ensuring consistent log formats, security practices, and error handling.

## Table of Contents

1. [Overview](#overview)
2. [Core Logging Components](#core-logging-components)
3. [Utilities for Scripts](#utilities-for-scripts)
4. [Best Practices](#best-practices)
5. [Log File Organization](#log-file-organization)
6. [Security Considerations](#security-considerations)
7. [Examples](#examples)

## Overview

The logging system consists of two main components:
1. **Core Logging Module** (`src/core/logging.py`): Provides advanced logging functionality for the main application components.
2. **Script Logging Utilities** (`scripts/utilities/logging_utils.py`): Provides simplified logging utilities specifically for scripts.

## Core Logging Components

The `src/core/logging.py` module provides the following key features:

- **Structured JSON Logging**: Produces JSON-formatted logs suitable for ELK stack processing
- **Context Variables**: Maintains request, trace, and user context across async operations
- **Specialized Logging**: Separate logging for slow queries, API usage, health checks, etc.
- **Masked Sensitive Data**: Automatic filtering of sensitive parameters in request logs
- **Distributed Tracing**: Support for trace IDs and span context

## Utilities for Scripts

The `scripts/utilities/logging_utils.py` module provides simplified utilities for scripts:

### Key Functions

#### `setup_logger(component_name, log_level=logging.INFO, ...)`
Creates a configured logger with file and console handlers, with automatic log rotation.

```python
from scripts.utilities.logging_utils import setup_logger

# Create a logger for your script with default rotation settings (10MB max size, 5 backup files)
logger = setup_logger("my_script")
logger.info("Script started")

# Create a logger with custom rotation settings
logger = setup_logger(
    "my_script",
    max_size_mb=5,      # 5MB max file size
    backup_count=3      # Keep 3 backup files
)
```

#### `log_command_execution(logger, command, output, return_code, error_output=None)`
Standardized logging for commands, API calls, and shell operations.

```python
# Example of logging a subprocess command
result = subprocess.run(["ls", "-la"], capture_output=True, text=True)
log_command_execution(
    logger,
    "ls -la",
    result.stdout,
    result.returncode,
    result.stderr if result.returncode != 0 else None
)
```

#### `log_database_operation(logger, operation, table, details=None, success=True)`
Standardized logging for database operations.

```python
# Example of logging a database operation
try:
    # Insert user into database
    cursor.execute("INSERT INTO users (username, email) VALUES (%s, %s)", 
                  ("john_doe", "john@example.com"))
    log_database_operation(
        logger,
        "INSERT",
        "users",
        {"username": "john_doe", "email": "john@example.com"},
        True
    )
except Exception as e:
    log_database_operation(
        logger,
        "INSERT",
        "users",
        {"username": "john_doe", "error": str(e)},
        False
    )
    raise
```

## Best Practices

1. **Always Use the Centralized Utility**: Don't use Python's default logging directly.
2. **Mask Sensitive Information**: Never log passwords, tokens, or keys in full.
3. **Use Appropriate Log Levels**:
   - `DEBUG`: Detailed debugging information
   - `INFO`: Confirmation that things are working as expected
   - `WARNING`: Something unexpected happened, but the application still works
   - `ERROR`: More serious problems, some functionality is unavailable
   - `CRITICAL`: Very serious errors, application may be unable to continue
4. **Include Context**: Log relevant context to make logs useful for debugging.
5. **Structured Error Handling**: Use try/except with consistent error logging patterns.

## Log File Organization

Logs are stored in the `logs/` directory at the project root:

- **API Server Logs**: JSON-formatted logs from the main application
- **Script Logs**: Individual log files for each script, named as `<script_name>_<timestamp>.log`
- **Specialized Logs**: Separate files for slow queries, API usage, errors, and health checks
- **Rotated Logs**: Backup log files with extensions like `.log.1`, `.log.2`, etc.

For detailed information about log rotation and retention, see [LOG_ROTATION.md](LOG_ROTATION.md).

## Security Considerations

- **Credential Masking**: All credentials are masked in logs (passwords, API keys, tokens)
- **PII Protection**: Personally identifiable information is partially masked
- **Database Queries**: Sensitive query parameters are masked in logs
- **Access Control**: Log files should have appropriate file system permissions

## Examples

### Example 1: Basic Script Logging

```python
#!/usr/bin/env python
import os
import sys

# Add the project root to the Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(script_dir))
sys.path.insert(0, project_root)

from scripts.utilities.logging_utils import setup_logger

# Set up logger
logger = setup_logger("my_script")

def main():
    logger.info("Starting script")
    try:
        # Script operations here
        logger.info("Operation completed successfully")
    except Exception as e:
        logger.exception(f"Error during script execution: {str(e)}")
        sys.exit(1)
    
    logger.info("Script completed successfully")

if __name__ == "__main__":
    main()
```

### Example 2: Database Operation Logging

```python
from scripts.utilities.logging_utils import setup_logger, log_database_operation
import psycopg2

# Set up logger
logger = setup_logger("database_script")

def connect_to_database(connection_string):
    # Mask password in connection string for logging
    masked_conn_string = connection_string.replace(
        connection_string.split("password=")[1].split(" ")[0],
        "******"
    )
    logger.info(f"Connecting to database: {masked_conn_string}")
    
    try:
        conn = psycopg2.connect(connection_string)
        logger.info("Database connection established")
        return conn
    except Exception as e:
        logger.exception(f"Failed to connect to database: {str(e)}")
        raise

def query_users(conn, role):
    logger.info(f"Querying users with role: {role}")
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT username, email FROM users WHERE role = %s", (role,))
        results = cursor.fetchall()
        
        log_database_operation(
            logger,
            "SELECT",
            "users",
            {"role": role, "count": len(results)},
            True
        )
        
        return results
    except Exception as e:
        log_database_operation(
            logger,
            "SELECT",
            "users",
            {"role": role, "error": str(e)},
            False
        )
        raise
```

### Example 3: API/Command Execution Logging

```python
import requests
from scripts.utilities.logging_utils import setup_logger, log_command_execution

# Set up logger
logger = setup_logger("api_script")

def call_api(url, api_key, payload):
    # Mask API key for logging
    masked_api_key = api_key[:4] + "****" + api_key[-4:] if len(api_key) > 8 else "****"
    logger.info(f"Calling API at {url} with masked key: {masked_api_key}")
    
    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        response = requests.post(url, json=payload, headers=headers)
        
        # Log the API call using the command execution logger
        log_command_execution(
            logger,
            f"POST {url}",
            f"Status code: {response.status_code}, Response length: {len(response.text)}",
            0 if response.status_code < 400 else 1,
            response.text if response.status_code >= 400 else None
        )
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.exception(f"API request failed: {str(e)}")
        raise
```