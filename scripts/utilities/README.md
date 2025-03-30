# Utilities

This directory contains utility scripts and modules that are used across the Ultimate Marketing Team project.

## Directory Structure

- **codebase/**: Scripts for codebase management and modification
- **log_management/**: Utilities for log rotation, cleanup, and monitoring

## Logging Utils

The `logging_utils.py` module provides standardized logging functions that can be imported and used by all scripts in the project to ensure consistent logging patterns and output formats.

### Key Features

- Centralized log directory management
- Consistent log file naming with timestamps
- Both file and console logging
- Specialized loggers for subprocess output
- Utility functions for common logging patterns (database operations, command execution)
- Type hints for better IDE support

### Usage Examples

#### Basic Logger Setup

```python
from scripts.utilities.logging_utils import setup_logger

# Create a logger for your component
logger = setup_logger("my_component")
logger.info("This is an information message")
logger.error("This is an error message")
```

#### Component-Based Logger (Automatically Named)

```python
from scripts.utilities.logging_utils import get_component_logger

# Creates a logger named after the current file
logger = get_component_logger(__file__)
logger.info("Log message from this component")
```

#### Database Operation Logging

```python
from scripts.utilities.logging_utils import setup_logger, log_database_operation

logger = setup_logger("database_operations")

# Log a successful database operation
log_database_operation(
    logger,
    operation="INSERT",
    table="users",
    details={"user_id": 123, "username": "new_user"},
    success=True
)

# Log a failed database operation
log_database_operation(
    logger,
    operation="UPDATE",
    table="profiles",
    details={"user_id": 456, "field": "email"},
    success=False
)
```

#### Command Execution Logging

```python
import subprocess
from scripts.utilities.logging_utils import setup_logger, log_command_execution

logger = setup_logger("deployment")

# Execute a command and log results
command = "docker-compose up -d"
process = subprocess.Popen(
    command, 
    shell=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    universal_newlines=True
)
stdout, stderr = process.communicate()
return_code = process.returncode

# Log the command execution
log_command_execution(
    logger,
    command=command,
    output=stdout,
    return_code=return_code,
    error_output=stderr
)
```

### Configuration Options

The `setup_logger` function accepts several parameters to customize the logger behavior:

- `component_name`: Name of the component (used for the log file name)
- `log_level`: Logging level (default: `logging.INFO`)
- `include_timestamp`: Whether to include timestamp in log filename (default: `True`)
- `log_to_console`: Whether to log to console as well as file (default: `True`)
- `log_format`: Format string for log messages (default: `'%(asctime)s - %(levelname)s - %(message)s'`)