"""Base Integration Module for all external service integrations.

This module provides a common base class and utilities for all integration types,
ensuring consistent error handling, response formatting, and health checking.
"""

import os
import json
import logging
import time
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)

class IntegrationError(Exception):
    """Base exception for all integration errors."""
    pass

class Integration:
    """Base class for all service integrations."""
    
    def __init__(self, platform: str, credentials: Dict[str, Any]):
        """Initialize the integration.
        
        Args:
            platform: The platform name
            credentials: Authentication credentials for the platform
        """
        self.platform = platform.lower()
        self.credentials = credentials
        self.initialized_at = datetime.now().isoformat()
    
    def format_success_response(self, **kwargs) -> Dict[str, Any]:
        """Format a successful response.
        
        Args:
            **kwargs: Response data to include
            
        Returns:
            Dict containing formatted success response
        """
        response = {
            "status": "success",
            "platform": self.platform,
            "timestamp": datetime.now().isoformat()
        }
        response.update(kwargs)
        return response
    
    def format_error_response(self, error_message: str, details: Any = None) -> Dict[str, Any]:
        """Format an error response.
        
        Args:
            error_message: The error message
            details: Additional error details
            
        Returns:
            Dict containing formatted error response
        """
        return {
            "status": "error",
            "platform": self.platform,
            "error": error_message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
    
    def safe_request(self, func, error_message: str, **kwargs) -> Dict[str, Any]:
        """Safely execute a request function with error handling.
        
        Args:
            func: Function to execute
            error_message: Error message prefix to use on failure
            **kwargs: Arguments to pass to the function
            
        Returns:
            Dict containing the response
        """
        try:
            return func(**kwargs)
        except Exception as e:
            logger.error(f"{error_message}: {e}")
            return self.format_error_response(
                error_message=f"{error_message}: {str(e)}",
                details="Exception during request execution"
            )
    
    def check_credentials(self, required_keys: List[str]) -> Optional[Dict[str, Any]]:
        """Check if required credentials are present.
        
        Args:
            required_keys: List of required credential keys
            
        Returns:
            Error response if credentials are missing, None if valid
        """
        missing_keys = [key for key in required_keys if not self.credentials.get(key)]
        
        if missing_keys:
            error_message = f"Missing required credentials: {', '.join(missing_keys)}"
            return self.format_error_response(error_message=error_message)
        
        return None
    
    def check_health(self) -> Dict[str, Any]:
        """Check the health of the integration.
        
        Returns:
            Dict containing health status information
        """
        raise NotImplementedError("Subclasses must implement check_health")
    
    def measure_response_time(self, func, *args, **kwargs) -> tuple:
        """Measure the response time of a function.
        
        Args:
            func: Function to measure
            *args: Positional arguments for the function
            **kwargs: Keyword arguments for the function
            
        Returns:
            Tuple of (response, response_time_ms)
        """
        start_time = time.time()
        try:
            response = func(*args, **kwargs)
            return response, int((time.time() - start_time) * 1000)
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            raise e