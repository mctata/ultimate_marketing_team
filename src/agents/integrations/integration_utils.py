"""Integration Utilities Module.

This module provides utility functions used across different integration types.
"""

import os
import json
import logging
import time
import hashlib
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import yaml

logger = logging.getLogger(__name__)

def load_integration_config():
    """Load integration configuration from YAML file.
    
    Returns:
        Dict containing integration configuration
    """
    config_path = os.path.join(os.path.dirname(__file__), '../config/integrations.yaml')
    try:
        with open(config_path, 'r') as file:
            return yaml.safe_load(file)
    except Exception as e:
        logger.error(f"Error loading integration config: {e}")
        return {}

def generate_cache_key(integration_type: str, platform: str, action: str, data: Dict[str, Any]) -> str:
    """Generate a unique cache key for integration requests.
    
    Args:
        integration_type: Type of integration (social, cms, ad, ai)
        platform: Platform name
        action: Action being performed
        data: Request data
        
    Returns:
        A unique cache key
    """
    # Extract parameters that affect the output, excluding credentials
    safe_data = {k: v for k, v in data.items() if k not in [
        'access_token', 'api_key', 'api_secret', 'username', 'password',
        'client_id', 'client_secret', 'refresh_token', 'developer_token'
    ]}
    
    # Create a string representation of the request
    key_base = f"{integration_type}:{platform}:{action}:{json.dumps(safe_data, sort_keys=True)}"
    
    # Hash the key to ensure reasonable length
    key_hash = hashlib.md5(key_base.encode()).hexdigest()
    
    return f"integration:{integration_type}:{platform}:{action}:{key_hash}"

def sanitize_credentials(data: Dict[str, Any]) -> Dict[str, Any]:
    """Remove sensitive information from a data dictionary.
    
    Args:
        data: Dictionary that may contain credentials
        
    Returns:
        Sanitized dictionary
    """
    sensitive_keys = [
        'access_token', 'api_key', 'api_secret', 'username', 'password',
        'client_id', 'client_secret', 'refresh_token', 'developer_token'
    ]
    
    result = data.copy()
    for key in sensitive_keys:
        if key in result:
            result[key] = "********"
    
    return result

def get_datetime_from_iso(iso_string: Optional[str]) -> Optional[datetime]:
    """Convert ISO datetime string to datetime object.
    
    Args:
        iso_string: ISO format datetime string
        
    Returns:
        Datetime object or None if conversion fails
    """
    if not iso_string:
        return None
    
    try:
        # Handle both with and without timezone info
        return datetime.fromisoformat(iso_string.replace('Z', '+00:00'))
    except Exception as e:
        logger.warning(f"Error converting ISO datetime: {e}")
        return None