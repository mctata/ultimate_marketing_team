"""Social Media Integration Factory Module.

This module provides a factory for creating social media integrations
based on platform name, with support for all major social platforms.
"""

import logging
from typing import Dict, Any

from src.agents.integrations.social_integration import SocialMediaIntegration
from src.agents.integrations.social_integration import FacebookIntegration, TwitterIntegration, LinkedInIntegration
from src.agents.integrations.social.instagram import InstagramIntegration
from src.agents.integrations.social.linkedin import LinkedInCompanyIntegration
from src.agents.integrations.social.tiktok import TikTokIntegration
from src.agents.integrations.social.pinterest import PinterestIntegration

logger = logging.getLogger(__name__)

class EnhancedSocialMediaIntegrationFactory:
    """Factory for creating social media integrations based on platform name.
    
    This is an enhanced version of the original SocialMediaIntegrationFactory
    with support for more platforms and specialized integrations.
    """
    
    @staticmethod
    def get_integration(platform: str, credentials: Dict[str, Any]) -> SocialMediaIntegration:
        """Get an appropriate social media integration based on the platform name.
        
        Args:
            platform: The social media platform name (facebook, twitter, instagram, etc.)
            credentials: Authentication credentials for the platform
            
        Returns:
            An instance of a SocialMediaIntegration subclass
            
        Raises:
            ValueError: If the platform is unsupported
        """
        platform = platform.lower()
        
        if platform in ["facebook", "facebook pages", "fb"]:
            return FacebookIntegration(credentials)
        elif platform in ["twitter", "x", "tweet"]:
            return TwitterIntegration(credentials)
        elif platform == "linkedin":
            # For personal profiles use the standard LinkedIn integration
            if credentials.get("profile_type", "").lower() == "personal":
                return LinkedInIntegration(credentials)
            # For company pages use the enhanced LinkedIn Company integration
            else:
                return LinkedInCompanyIntegration(credentials)
        elif platform in ["instagram", "ig"]:
            return InstagramIntegration(credentials)
        elif platform in ["tiktok", "tik tok", "tt"]:
            return TikTokIntegration(credentials)
        elif platform in ["pinterest", "pin"]:
            return PinterestIntegration(credentials)
        else:
            raise ValueError(f"Unsupported social media platform: {platform}")