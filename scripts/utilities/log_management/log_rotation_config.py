#!/usr/bin/env python3
"""
Log rotation configuration utility for the Ultimate Marketing Team project.

This script provides functions to configure log rotation settings for different
components and apply global rotation policies.
"""

import os
import sys
import argparse
import json
from typing import Dict, Any, Optional

# Add project root to path
script_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
project_root = os.path.dirname(script_dir)
sys.path.insert(0, project_root)

from scripts.utilities.logging_utils import setup_logger, get_logs_dir

# Default config path
CONFIG_FILE = os.path.join(get_logs_dir(), "log_rotation_config.json")

# Default rotation settings
DEFAULT_ROTATION_CONFIG = {
    "default": {
        "max_size_mb": 10,
        "backup_count": 5,
        "max_age_days": 30
    },
    # Component-specific overrides
    "components": {
        "database_operations": {
            "max_size_mb": 20,
            "backup_count": 10,
            "max_age_days": 60
        },
        "api_metrics": {
            "max_size_mb": 50,
            "backup_count": 7,
            "max_age_days": 90
        }
    }
}

def get_rotation_config(component_name: str = None) -> Dict[str, Any]:
    """
    Get log rotation configuration for a specific component or the default config.
    
    Args:
        component_name: Optional component name
        
    Returns:
        Dict[str, Any]: Rotation configuration
    """
    config = load_config()
    
    if component_name and component_name in config.get("components", {}):
        return config["components"][component_name]
    
    return config["default"]

def load_config() -> Dict[str, Any]:
    """
    Load the rotation configuration from file or use defaults.
    
    Returns:
        Dict[str, Any]: The loaded configuration
    """
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return DEFAULT_ROTATION_CONFIG
    
    return DEFAULT_ROTATION_CONFIG

def save_config(config: Dict[str, Any]) -> None:
    """
    Save the rotation configuration to file.
    
    Args:
        config: Configuration dictionary to save
    """
    # Ensure logs directory exists
    os.makedirs(get_logs_dir(), exist_ok=True)
    
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=4)

def set_component_config(
    component_name: str,
    max_size_mb: Optional[int] = None,
    backup_count: Optional[int] = None,
    max_age_days: Optional[int] = None
) -> Dict[str, Any]:
    """
    Set configuration for a specific component.
    
    Args:
        component_name: Name of the component
        max_size_mb: Maximum file size in MB
        backup_count: Number of backup files
        max_age_days: Maximum age in days
        
    Returns:
        Dict[str, Any]: Updated component configuration
    """
    config = load_config()
    
    if "components" not in config:
        config["components"] = {}
    
    if component_name not in config["components"]:
        config["components"][component_name] = config["default"].copy()
    
    if max_size_mb is not None:
        config["components"][component_name]["max_size_mb"] = max_size_mb
    
    if backup_count is not None:
        config["components"][component_name]["backup_count"] = backup_count
    
    if max_age_days is not None:
        config["components"][component_name]["max_age_days"] = max_age_days
    
    save_config(config)
    return config["components"][component_name]

def main():
    """
    Main function to execute the log rotation configuration utility.
    """
    parser = argparse.ArgumentParser(description='Configure log rotation settings')
    subparsers = parser.add_subparsers(dest='command', help='Command')
    
    # Show config command
    show_parser = subparsers.add_parser('show', help='Show configuration')
    show_parser.add_argument('--component', type=str, help='Component name')
    
    # Set config command
    set_parser = subparsers.add_parser('set', help='Set configuration')
    set_parser.add_argument('--component', type=str, required=True, help='Component name')
    set_parser.add_argument('--max-size', type=int, help='Maximum file size in MB')
    set_parser.add_argument('--backup-count', type=int, help='Number of backup files')
    set_parser.add_argument('--max-age', type=int, help='Maximum age in days')
    
    # Reset command
    reset_parser = subparsers.add_parser('reset', help='Reset to default configuration')
    
    args = parser.parse_args()
    logger = setup_logger("log_rotation_config")
    
    if args.command == 'show':
        if args.component:
            config = get_rotation_config(args.component)
            logger.info(f"Configuration for component '{args.component}':")
        else:
            config = load_config()
            logger.info("Global log rotation configuration:")
        
        logger.info(json.dumps(config, indent=2))
    
    elif args.command == 'set':
        logger.info(f"Setting configuration for component '{args.component}'")
        updated_config = set_component_config(
            component_name=args.component,
            max_size_mb=args.max_size,
            backup_count=args.backup_count,
            max_age_days=args.max_age
        )
        logger.info(f"Updated configuration: {json.dumps(updated_config, indent=2)}")
    
    elif args.command == 'reset':
        logger.info("Resetting to default configuration")
        save_config(DEFAULT_ROTATION_CONFIG)
        logger.info("Configuration reset successfully")
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main()