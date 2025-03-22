"""Analytics Integration Factory Module.

This module provides a factory for creating analytics platform integrations
based on platform name.
"""

import logging
from typing import Dict, Any

from src.agents.integrations.analytics.base import AnalyticsIntegration
from src.agents.integrations.analytics.google_analytics import GoogleAnalytics4Integration
from src.agents.integrations.analytics.adobe_analytics import AdobeAnalyticsIntegration

logger = logging.getLogger(__name__)

class AnalyticsIntegrationFactory:
    """Factory for creating analytics platform integrations based on platform name."""
    
    @staticmethod
    def get_integration(platform: str, credentials: Dict[str, Any]) -> AnalyticsIntegration:
        """Get an appropriate analytics integration based on the platform name.
        
        Args:
            platform: The analytics platform name (google_analytics, adobe_analytics, etc.)
            credentials: Authentication credentials for the platform
            
        Returns:
            An instance of an AnalyticsIntegration subclass
            
        Raises:
            ValueError: If the platform is unsupported
        """
        platform = platform.lower()
        
        if platform in ["google_analytics", "ga", "ga4", "google analytics"]:
            return GoogleAnalytics4Integration(credentials)
        elif platform in ["adobe_analytics", "aa", "adobe analytics"]:
            return AdobeAnalyticsIntegration(credentials)
        else:
            raise ValueError(f"Unsupported analytics platform: {platform}")