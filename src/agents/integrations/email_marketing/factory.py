"""Email Marketing Integration Factory Module.

This module provides a factory for creating email marketing integrations
based on platform name.
"""

import logging
from typing import Dict, Any

from src.agents.integrations.email_marketing.base import EmailMarketingIntegration
from src.agents.integrations.email_marketing.mailchimp import MailchimpIntegration
from src.agents.integrations.email_marketing.hubspot import HubSpotIntegration

logger = logging.getLogger(__name__)

class EmailMarketingIntegrationFactory:
    """Factory for creating email marketing integrations based on platform name."""
    
    @staticmethod
    def get_integration(platform: str, credentials: Dict[str, Any]) -> EmailMarketingIntegration:
        """Get an appropriate email marketing integration based on the platform name.
        
        Args:
            platform: The platform name (mailchimp, hubspot, etc.)
            credentials: Authentication credentials for the platform
            
        Returns:
            An instance of an EmailMarketingIntegration subclass
            
        Raises:
            ValueError: If the platform is unsupported
        """
        platform = platform.lower()
        
        if platform == "mailchimp":
            return MailchimpIntegration(credentials)
        elif platform in ("hubspot", "hub_spot"):
            return HubSpotIntegration(credentials)
        else:
            raise ValueError(f"Unsupported email marketing platform: {platform}")