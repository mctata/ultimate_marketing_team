"""
Base Analytics Integration

This module provides a base class for all analytics integrations.
"""

import logging
from typing import Dict, List, Any, Optional
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

class BaseAnalyticsIntegration(ABC):
    """Base class for all analytics integrations."""
    
    def __init__(self, name: str):
        """
        Initialize the analytics integration.
        
        Args:
            name: Name of the integration
        """
        self.name = name
        logger.info(f"Initializing {name} analytics integration")
        
    @abstractmethod
    async def get_search_performance(self, **kwargs) -> Dict[str, Any]:
        """
        Get search performance metrics.
        
        Returns:
            Dictionary with search performance data
        """
        pass