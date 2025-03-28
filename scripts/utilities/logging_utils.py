#!/usr/bin/env python3
"""
Central logging utility module for the Ultimate Marketing Team project.

This module provides standardized logging functions that can be imported
and used by all scripts in the project to ensure consistent logging
patterns and output formats.
"""

import os
import sys
import logging
from datetime import datetime
from typing import Optional, Union, Dict, Any


def get_logs_dir() -> str:
    """
    Get the absolute path to the logs directory.
    
    Returns:
        str: Absolute path to the logs directory
    """
    # Navigate up to project root from the utilities directory
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    logs_dir = os.path.join(project_root, 'logs')
    return logs_dir


def setup_logger(
    component_name: str,
    log_level: int = logging.INFO,
    include_timestamp: bool = True,
    log_to_console: bool = True,
    log_format: str = '%(asctime)s - %(levelname)s - %(message)s'
) -> logging.Logger:
    """
    Set up a logger with both file and console handlers.
    
    Args:
        component_name: Name of the component (used for the log file name)
        log_level: Logging level (default: logging.INFO)
        include_timestamp: Whether to include timestamp in log filename (default: True)
        log_to_console: Whether to log to console as well as file (default: True)
        log_format: Format string for log messages
        
    Returns:
        logging.Logger: Configured logger object
    """
    # Create logs directory if it doesn't exist
    logs_dir = get_logs_dir()
    os.makedirs(logs_dir, exist_ok=True)
    
    # Generate log filename
    if include_timestamp:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = os.path.join(logs_dir, f'{component_name}_{timestamp}.log')
    else:
        log_file = os.path.join(logs_dir, f'{component_name}.log')
    
    # Create logger
    logger = logging.getLogger(component_name)
    logger.setLevel(log_level)
    
    # Remove existing handlers if any
    if logger.handlers:
        logger.handlers.clear()
    
    # Create file handler
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(log_level)
    file_handler.setFormatter(logging.Formatter(log_format))
    logger.addHandler(file_handler)
    
    # Add console handler if requested
    if log_to_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(log_level)
        console_handler.setFormatter(logging.Formatter(log_format))
        logger.addHandler(console_handler)
    
    return logger


def setup_subprocess_logger(component_name: str, log_level: int = logging.INFO) -> logging.Logger:
    """
    Set up a logger specifically formatted for capturing subprocess output.
    
    Args:
        component_name: Name of the component
        log_level: Logging level
        
    Returns:
        logging.Logger: Configured logger for subprocess output
    """
    logger = setup_logger(
        component_name=f"{component_name}_subprocess",
        log_level=log_level,
        log_format='%(message)s'  # Simpler format for subprocess output
    )
    return logger


def log_command_execution(
    logger: logging.Logger, 
    command: str, 
    output: str, 
    return_code: int,
    error_output: Optional[str] = None
) -> None:
    """
    Log the execution of a command with its output and return code.
    
    Args:
        logger: Logger instance
        command: The command that was executed
        output: Standard output from the command
        return_code: Return code from the command
        error_output: Standard error output (if any)
    """
    logger.info(f"Executing command: {command}")
    
    if return_code == 0:
        logger.info(f"Command succeeded with return code: {return_code}")
        if output:
            logger.info(f"Command output:\n{output}")
    else:
        logger.error(f"Command failed with return code: {return_code}")
        if error_output:
            logger.error(f"Error output:\n{error_output}")
        if output:
            logger.info(f"Standard output:\n{output}")


def log_database_operation(
    logger: logging.Logger,
    operation: str,
    table: str,
    details: Optional[Dict[str, Any]] = None,
    success: bool = True
) -> None:
    """
    Log a database operation with standardized format.
    
    Args:
        logger: Logger instance
        operation: Operation type (e.g., 'INSERT', 'UPDATE', 'DELETE', 'QUERY')
        table: The database table involved
        details: Optional details about the operation
        success: Whether the operation was successful
    """
    status = "SUCCESS" if success else "FAILED"
    log_msg = f"DB {operation} on {table} - {status}"
    
    if details:
        detail_str = ", ".join(f"{k}={v}" for k, v in details.items())
        log_msg += f" - Details: {detail_str}"
    
    if success:
        logger.info(log_msg)
    else:
        logger.error(log_msg)


def get_component_logger(component_path: str, log_level: int = logging.INFO) -> logging.Logger:
    """
    Get a logger based on the component's file path.
    Automatically extracts component name from the file path.
    
    Args:
        component_path: Path to the component (usually __file__)
        log_level: Logging level
        
    Returns:
        logging.Logger: Configured logger
    """
    # Extract component name from file path (strip extension and directory)
    component_name = os.path.splitext(os.path.basename(component_path))[0]
    return setup_logger(component_name, log_level)


# Example usage in docstring
if __name__ == "__main__":
    # Example 1: Basic logger setup
    logger = setup_logger("example")
    logger.info("This is an info message")
    logger.error("This is an error message")
    
    # Example 2: Component-based logger
    component_logger = get_component_logger(__file__)
    component_logger.info("Logging from the logging_utils module itself")
    
    # Example 3: Database operation logging
    db_logger = setup_logger("database_operations")
    log_database_operation(
        db_logger, 
        "INSERT", 
        "users", 
        {"user_id": 123, "username": "example_user"},
        True
    )
    
    print("Examples completed. Check the logs directory for output files.")