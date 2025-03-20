"""Integration Manager for the Content & Ad Management Agent.

This module provides a centralized interface for managing integrations with
various platforms, including CMS, social media, and advertising platforms.
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from src.core.database import get_db
from src.models.integration import SocialAccount, CMSAccount, AdAccount, IntegrationHealth
from src.agents.integrations.cms_integration import CMSIntegrationFactory
from src.agents.integrations.social_integration import SocialMediaIntegrationFactory
from src.agents.integrations.ad_integration import AdPlatformIntegrationFactory

logger = logging.getLogger(__name__)

class IntegrationManager:
    """Manages integrations with external platforms."""
    
    def __init__(self, cache=None):
        """Initialize the integration manager.
        
        Args:
            cache: Optional cache instance for storing integration data
        """
        self.cache = cache
        self.cache_ttl = 3600  # 1 hour
        self.cache_prefix = "integration_credentials"
    
    def _get_social_account_credentials(self, brand_id: Any, platform: str) -> Optional[Dict[str, Any]]:
        """Get social media account credentials for a brand.
        
        Args:
            brand_id: The brand ID
            platform: The social media platform
            
        Returns:
            Dict containing credentials if found, None otherwise
        """
        # Try to get from cache first
        cache_key = f"{self.cache_prefix}:social:{brand_id}:{platform}"
        if self.cache:
            cached_creds = self.cache.get(cache_key)
            if cached_creds:
                try:
                    return json.loads(cached_creds)
                except Exception:
                    pass
        
        # If not in cache or cache failed, get from database
        try:
            with get_db() as db:
                account = db.query(SocialAccount).filter(
                    SocialAccount.brand_id == brand_id,
                    SocialAccount.platform.ilike(f"%{platform}%")
                ).first()
                
                if account:
                    credentials = {
                        "platform": account.platform,
                        "account_id": account.account_id,
                        "account_name": account.account_name,
                        "access_token": account.access_token,
                        # Add other fields as needed, with proper decryption if implemented
                    }
                    
                    # Store in cache
                    if self.cache:
                        self.cache.set(cache_key, json.dumps(credentials), ex=self.cache_ttl)
                    
                    return credentials
                
                return None
        except Exception as e:
            logger.error(f"Error getting social account credentials: {e}")
            return None
    
    def _get_cms_account_credentials(self, brand_id: Any, platform: str) -> Optional[Dict[str, Any]]:
        """Get CMS account credentials for a brand.
        
        Args:
            brand_id: The brand ID
            platform: The CMS platform
            
        Returns:
            Dict containing credentials if found, None otherwise
        """
        # Try to get from cache first
        cache_key = f"{self.cache_prefix}:cms:{brand_id}:{platform}"
        if self.cache:
            cached_creds = self.cache.get(cache_key)
            if cached_creds:
                try:
                    return json.loads(cached_creds)
                except Exception:
                    pass
        
        # If not in cache or cache failed, get from database
        try:
            with get_db() as db:
                account = db.query(CMSAccount).filter(
                    CMSAccount.brand_id == brand_id,
                    CMSAccount.platform.ilike(f"%{platform}%")
                ).first()
                
                if account:
                    credentials = {
                        "platform": account.platform,
                        "site_url": account.site_url,
                        "api_key": account.api_key,
                        "api_secret": account.api_secret,
                        "username": account.username,
                        "password": account.password,
                        # Add other fields as needed, with proper decryption if implemented
                    }
                    
                    # Store in cache
                    if self.cache:
                        self.cache.set(cache_key, json.dumps(credentials), ex=self.cache_ttl)
                    
                    return credentials
                
                return None
        except Exception as e:
            logger.error(f"Error getting CMS account credentials: {e}")
            return None
    
    def _get_ad_account_credentials(self, brand_id: Any, platform: str) -> Optional[Dict[str, Any]]:
        """Get ad platform account credentials for a brand.
        
        Args:
            brand_id: The brand ID
            platform: The ad platform
            
        Returns:
            Dict containing credentials if found, None otherwise
        """
        # Try to get from cache first
        cache_key = f"{self.cache_prefix}:ad:{brand_id}:{platform}"
        if self.cache:
            cached_creds = self.cache.get(cache_key)
            if cached_creds:
                try:
                    return json.loads(cached_creds)
                except Exception:
                    pass
        
        # If not in cache or cache failed, get from database
        try:
            with get_db() as db:
                account = db.query(AdAccount).filter(
                    AdAccount.brand_id == brand_id,
                    AdAccount.platform.ilike(f"%{platform}%")
                ).first()
                
                if account:
                    credentials = {
                        "platform": account.platform,
                        "account_id": account.account_id,
                        "access_token": account.access_token,
                        "refresh_token": account.refresh_token,
                        "developer_token": account.developer_token,
                        "client_id": account.client_id,
                        "client_secret": account.client_secret,
                        # Add other fields as needed, with proper decryption if implemented
                    }
                    
                    # Store in cache
                    if self.cache:
                        self.cache.set(cache_key, json.dumps(credentials), ex=self.cache_ttl)
                    
                    return credentials
                
                return None
        except Exception as e:
            logger.error(f"Error getting ad account credentials: {e}")
            return None
    
    def _record_integration_health(self, integration_type: str, integration_id: int, 
                                  status: str, response_time_ms: int = None, 
                                  error_message: str = None, details: Dict[str, Any] = None):
        """Record integration health status in the database.
        
        Args:
            integration_type: Type of integration (social, cms, ad)
            integration_id: ID of the integration in the database
            status: Health status (healthy, unhealthy, degraded)
            response_time_ms: Response time in milliseconds
            error_message: Error message if status is unhealthy
            details: Additional details about the health check
        """
        try:
            with get_db() as db:
                health_record = IntegrationHealth(
                    integration_type=integration_type,
                    integration_id=integration_id,
                    status=status,
                    response_time_ms=response_time_ms,
                    error_message=error_message,
                    details=details
                )
                db.add(health_record)
                db.commit()
        except Exception as e:
            logger.error(f"Error recording integration health: {e}")
    
    def get_cms_integration(self, brand_id: Any, platform: str):
        """Get a CMS integration instance for a brand.
        
        Args:
            brand_id: The brand ID
            platform: The CMS platform
            
        Returns:
            CMS integration instance if credentials are found, None otherwise
        """
        credentials = self._get_cms_account_credentials(brand_id, platform)
        if not credentials:
            logger.warning(f"No credentials found for CMS platform {platform} for brand {brand_id}")
            return None
        
        try:
            return CMSIntegrationFactory.get_integration(platform, credentials)
        except ValueError as e:
            logger.error(f"Error creating CMS integration: {e}")
            return None
    
    def get_social_integration(self, brand_id: Any, platform: str):
        """Get a social media integration instance for a brand.
        
        Args:
            brand_id: The brand ID
            platform: The social media platform
            
        Returns:
            Social media integration instance if credentials are found, None otherwise
        """
        credentials = self._get_social_account_credentials(brand_id, platform)
        if not credentials:
            logger.warning(f"No credentials found for social platform {platform} for brand {brand_id}")
            return None
        
        try:
            return SocialMediaIntegrationFactory.get_integration(platform, credentials)
        except ValueError as e:
            logger.error(f"Error creating social media integration: {e}")
            return None
    
    def get_ad_integration(self, brand_id: Any, platform: str):
        """Get an ad platform integration instance for a brand.
        
        Args:
            brand_id: The brand ID
            platform: The ad platform
            
        Returns:
            Ad platform integration instance if credentials are found, None otherwise
        """
        credentials = self._get_ad_account_credentials(brand_id, platform)
        if not credentials:
            logger.warning(f"No credentials found for ad platform {platform} for brand {brand_id}")
            return None
        
        try:
            return AdPlatformIntegrationFactory.get_integration(platform, credentials)
        except ValueError as e:
            logger.error(f"Error creating ad platform integration: {e}")
            return None
    
    def check_all_integrations_health(self, brand_id: Any) -> Dict[str, Any]:
        """Check the health of all integrations for a brand.
        
        Args:
            brand_id: The brand ID
            
        Returns:
            Dict containing health status for all integrations
        """
        results = {
            "social": {},
            "cms": {},
            "ad": {}
        }
        
        try:
            # Check social integrations
            with get_db() as db:
                social_accounts = db.query(SocialAccount).filter(
                    SocialAccount.brand_id == brand_id
                ).all()
                
                for account in social_accounts:
                    integration = self.get_social_integration(brand_id, account.platform)
                    if integration:
                        health_result = integration.check_health()
                        results["social"][account.platform] = health_result
                        
                        # Record health status
                        self._record_integration_health(
                            integration_type="social",
                            integration_id=account.id,
                            status=health_result.get("status"),
                            response_time_ms=health_result.get("response_time_ms"),
                            error_message=health_result.get("error"),
                            details=health_result
                        )
                        
                        # Update account health status
                        account.health_status = health_result.get("status")
                        account.last_health_check = datetime.now()
                
                # Check CMS integrations
                cms_accounts = db.query(CMSAccount).filter(
                    CMSAccount.brand_id == brand_id
                ).all()
                
                for account in cms_accounts:
                    integration = self.get_cms_integration(brand_id, account.platform)
                    if integration:
                        health_result = integration.check_health()
                        results["cms"][account.platform] = health_result
                        
                        # Record health status
                        self._record_integration_health(
                            integration_type="cms",
                            integration_id=account.id,
                            status=health_result.get("status"),
                            response_time_ms=health_result.get("response_time_ms"),
                            error_message=health_result.get("error"),
                            details=health_result
                        )
                        
                        # Update account health status
                        account.health_status = health_result.get("status")
                        account.last_health_check = datetime.now()
                
                # Check ad integrations
                ad_accounts = db.query(AdAccount).filter(
                    AdAccount.brand_id == brand_id
                ).all()
                
                for account in ad_accounts:
                    integration = self.get_ad_integration(brand_id, account.platform)
                    if integration:
                        health_result = integration.check_health()
                        results["ad"][account.platform] = health_result
                        
                        # Record health status
                        self._record_integration_health(
                            integration_type="ad",
                            integration_id=account.id,
                            status=health_result.get("status"),
                            response_time_ms=health_result.get("response_time_ms"),
                            error_message=health_result.get("error"),
                            details=health_result
                        )
                        
                        # Update account health status
                        account.health_status = health_result.get("status")
                        account.last_health_check = datetime.now()
                
                # Commit all health status updates
                db.commit()
        
        except Exception as e:
            logger.error(f"Error checking integrations health: {e}")
        
        return results
    
    def publish_to_social(self, brand_id: Any, platforms: List[str], content_data: Dict[str, Any], 
                         publish_time: Optional[str] = None) -> Dict[str, Any]:
        """Publish content to social media platforms.
        
        Args:
            brand_id: The brand ID
            platforms: List of social media platforms to publish to
            content_data: Content data to publish
            publish_time: Optional ISO format datetime for scheduled publishing
            
        Returns:
            Dict containing publishing results for each platform
        """
        results = {}
        
        for platform in platforms:
            integration = self.get_social_integration(brand_id, platform)
            if not integration:
                results[platform] = {
                    "status": "error",
                    "platform": platform,
                    "error": f"No integration available for {platform}"
                }
                continue
            
            try:
                # If publish time is provided, schedule the post
                if publish_time:
                    result = integration.schedule_content(content_data, publish_time)
                else:
                    result = integration.post_content(content_data)
                
                results[platform] = result
            except Exception as e:
                logger.error(f"Error publishing to {platform}: {e}")
                results[platform] = {
                    "status": "error",
                    "platform": platform,
                    "error": str(e),
                    "details": "Exception during publication"
                }
        
        return results
    
    def publish_to_cms(self, brand_id: Any, platforms: List[str], content_data: Dict[str, Any], 
                      publish_time: Optional[str] = None) -> Dict[str, Any]:
        """Publish content to CMS platforms.
        
        Args:
            brand_id: The brand ID
            platforms: List of CMS platforms to publish to
            content_data: Content data to publish
            publish_time: Optional ISO format datetime for scheduled publishing
            
        Returns:
            Dict containing publishing results for each platform
        """
        results = {}
        
        for platform in platforms:
            integration = self.get_cms_integration(brand_id, platform)
            if not integration:
                results[platform] = {
                    "status": "error",
                    "platform": platform,
                    "error": f"No integration available for {platform}"
                }
                continue
            
            try:
                # If publish time is provided, schedule the post
                if publish_time:
                    result = integration.schedule_content(content_data, publish_time)
                else:
                    result = integration.publish_content(content_data)
                
                results[platform] = result
            except Exception as e:
                logger.error(f"Error publishing to {platform}: {e}")
                results[platform] = {
                    "status": "error",
                    "platform": platform,
                    "error": str(e),
                    "details": "Exception during publication"
                }
        
        return results
    
    def create_ad_campaign(self, brand_id: Any, platforms: List[str], campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create ad campaigns on multiple platforms.
        
        Args:
            brand_id: The brand ID
            platforms: List of ad platforms to create campaigns on
            campaign_data: Campaign configuration data
            
        Returns:
            Dict containing creation results for each platform
        """
        results = {}
        
        for platform in platforms:
            integration = self.get_ad_integration(brand_id, platform)
            if not integration:
                results[platform] = {
                    "status": "error",
                    "platform": platform,
                    "error": f"No integration available for {platform}"
                }
                continue
            
            try:
                result = integration.create_campaign(campaign_data)
                results[platform] = result
            except Exception as e:
                logger.error(f"Error creating campaign on {platform}: {e}")
                results[platform] = {
                    "status": "error",
                    "platform": platform,
                    "error": str(e),
                    "details": "Exception during campaign creation"
                }
        
        return results