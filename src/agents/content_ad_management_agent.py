from typing import Dict, Any, List, Optional
from loguru import logger
import json
import time
import random
import os
from datetime import datetime, timedelta
import threading

from src.agents.base_agent import BaseAgent
from src.agents.integrations.integration_manager import IntegrationManager
from src.core.database import get_db
from src.models.content import ContentPerformance
from src.models.advertising import AdPerformance

class ContentAdManagementAgent(BaseAgent):
    """Agent responsible for content publishing and ad campaign management.
    
    This agent handles content distribution across multiple platforms, manages
    ad campaigns, monitors engagement metrics, and applies predictive analytics
    to optimize performance. It provides real-time monitoring, automated
    optimization, and comprehensive reporting.
    """
    
    def __init__(self, agent_id: str, name: str, **kwargs):
        super().__init__(agent_id, name)
        self.enable_content_publishing = kwargs.get("enable_content_publishing", True)
        self.enable_ad_management = kwargs.get("enable_ad_management", True)
        self.enable_engagement_monitoring = kwargs.get("enable_engagement_monitoring", True)
        self.enable_predictive_analytics = kwargs.get("enable_predictive_analytics", True)
        self.enable_audit_trails = kwargs.get("enable_audit_trails", True)
        
        # Monitoring configuration
        self.monitoring_interval = kwargs.get("monitoring_interval", 3600)  # Default: 1 hour
        self.engagement_cache_prefix = "engagement_metrics"
        self.campaign_cache_prefix = "ad_campaign"
        
        # Initialize integration manager
        self.integration_manager = IntegrationManager(cache=self.cache)
        
        # Start engagement monitoring if enabled
        if self.enable_engagement_monitoring:
            self._start_engagement_monitoring()
    
    def _initialize(self):
        super()._initialize()
        
        # Register task handlers
        self.register_task_handler("content_publishing_task", self.handle_content_publishing)
        self.register_task_handler("ad_campaign_management_task", self.handle_ad_campaign_management)
        self.register_task_handler("engagement_monitoring_task", self.handle_engagement_monitoring)
        self.register_task_handler("predictive_analytics_task", self.handle_predictive_analytics)
        
        # Register event handlers
        self.register_event_handler("content_test_completed", self._handle_content_test_completed)
    
    def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process a generic task assigned to this agent."""
        task_type = task.get("task_type")
        logger.warning(f"Using generic task processing for task type: {task_type}")
        
        # Return error for unhandled task types
        return {
            "status": "error",
            "error": f"Unhandled task type: {task_type}"
        }
    
    def handle_content_publishing(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle content publishing to various platforms."""
        brand_id = task.get("brand_id")
        project_id = task.get("project_id")
        content_id = task.get("content_id")
        content_data = task.get("content_data", {})
        platforms = task.get("platforms", [])
        scheduling_preferences = task.get("scheduling_preferences", {})
        user_id = task.get("user_id")
        
        # Check if content publishing is enabled
        if not self.enable_content_publishing:
            return {
                "status": "error",
                "error": "Content publishing is not enabled"
            }
        
        # Log the publishing request
        logger.info(f"Publishing content for brand: {brand_id}, project: {project_id}, to platforms: {platforms}")
        
        if not content_data:
            return {
                "status": "error",
                "error": "No content data provided for publishing"
            }
        
        if not platforms:
            return {
                "status": "error",
                "error": "No publishing platforms specified"
            }
        
        # Publish to each platform
        publishing_results = {}
        overall_status = "success"
        
        for platform in platforms:
            try:
                # Get platform credentials
                platform_credentials = self._get_platform_credentials(brand_id, platform)
                
                if not platform_credentials:
                    publishing_results[platform] = {
                        "status": "error",
                        "error": f"No credentials found for platform: {platform}"
                    }
                    overall_status = "partial"
                    continue
                
                # Determine publishing time based on scheduling preferences
                publish_time = self._determine_publish_time(platform, scheduling_preferences)
                
                # Format content for the specific platform
                formatted_content = self._format_content_for_platform(content_data, platform)
                
                # Publish to platform
                platform_result = self._publish_to_platform(
                    platform,
                    formatted_content,
                    platform_credentials,
                    publish_time
                )
                
                publishing_results[platform] = platform_result
                
                # Update overall status if any platform failed
                if platform_result["status"] != "success":
                    overall_status = "partial"
                
                # Record successful publication
                if platform_result["status"] == "success":
                    self._record_content_publication(
                        content_id,
                        platform,
                        platform_result.get("platform_content_id"),
                        publish_time,
                        formatted_content
                    )
            except Exception as e:
                logger.error(f"Error publishing to {platform}: {e}")
                publishing_results[platform] = {
                    "status": "error",
                    "error": str(e)
                }
                overall_status = "partial"
        
        # Record audit trail if enabled
        if self.enable_audit_trails:
            self._record_audit_trail(
                action="content_published",
                user_id=user_id,
                details={
                    "brand_id": brand_id,
                    "project_id": project_id,
                    "content_id": content_id,
                    "platforms": platforms,
                    "overall_status": overall_status
                }
            )
        
        # Broadcast content published event
        self.broadcast_event({
            "event_type": "content_published",
            "content_id": content_id,
            "brand_id": brand_id,
            "project_id": project_id,
            "platforms": platforms,
            "overall_status": overall_status
        })
        
        return {
            "status": overall_status,
            "message": f"Content publishing completed with status: {overall_status}",
            "content_id": content_id,
            "platform_results": publishing_results
        }
    
    def _get_platform_credentials(self, brand_id: Any, platform: str) -> Dict[str, Any]:
        """Get credentials for a specific platform.
        
        Args:
            brand_id: The brand ID
            platform: The platform name
        
        Returns:
            Dict containing credentials for the platform
        """
        platform_type = self._get_platform_type(platform)
        
        if platform_type == "cms":
            return self.integration_manager._get_cms_account_credentials(brand_id, platform) or {}
        elif platform_type == "social":
            return self.integration_manager._get_social_account_credentials(brand_id, platform) or {}
        elif platform_type == "email":
            # TODO: Implement email platform credentials retrieval
            # Mock implementation for testing
            return {
                "api_key": f"mock_email_api_key_{platform}_{brand_id}",
                "list_id": f"mock_email_list_{platform}_{brand_id}"
            }
        else:
            logger.warning(f"Unknown platform type: {platform}")
            return {}
            
    def _get_platform_type(self, platform: str) -> str:
        """Determine the type of platform.
        
        Args:
            platform: The platform name
            
        Returns:
            String indicating the platform type (cms, social, ad, email)
        """
        platform = platform.lower()
        
        if platform in ["wordpress", "drupal", "shopify"]:
            return "cms"
        elif platform in ["linkedin", "twitter", "facebook", "instagram"]:
            return "social"
        elif platform in ["facebook ads", "google ads", "linkedin ads"]:
            return "ad"
        elif platform in ["mailchimp", "sendinblue", "klaviyo"]:
            return "email"
        else:
            return "unknown"
    
    def _determine_publish_time(self, platform: str, scheduling_preferences: Dict[str, Any]) -> str:
        """Determine the optimal publishing time based on preferences."""
        # TODO: Implement actual publish time determination based on analytics
        # Mock implementation for testing
        
        # Get preferred times from preferences if available
        platform_preferences = scheduling_preferences.get(platform, {})
        preferred_day = platform_preferences.get("day")
        preferred_time = platform_preferences.get("time")
        
        # If specific preferences are provided, use them
        if preferred_day and preferred_time:
            # Calculate next occurrence of the preferred day/time
            now = datetime.now()
            days_map = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6}
            target_day = days_map.get(preferred_day.lower(), 0)
            days_until_target = (target_day - now.weekday()) % 7
            
            # Parse the preferred time
            hour, minute = map(int, preferred_time.split(":"))
            
            # Calculate the target datetime
            target_date = now + timedelta(days=days_until_target)
            target_datetime = datetime(
                target_date.year, target_date.month, target_date.day, hour, minute
            )
            
            # If target time is in the past, publish now
            if target_datetime < now:
                return now.isoformat()
            
            return target_datetime.isoformat()
        
        # Default platform-specific optimal times based on general best practices
        if platform.lower() in ["linkedin"]:
            # LinkedIn: Weekday mornings
            return (datetime.now() + timedelta(hours=1)).isoformat()
        elif platform.lower() in ["facebook", "instagram"]:
            # Facebook/Instagram: Afternoons
            return (datetime.now() + timedelta(hours=3)).isoformat()
        elif platform.lower() in ["twitter"]:
            # Twitter: Throughout the day
            return (datetime.now() + timedelta(minutes=30)).isoformat()
        elif platform.lower() in ["wordpress", "drupal", "shopify"]:
            # CMS: Immediate
            return datetime.now().isoformat()
        else:
            # Default: Immediate
            return datetime.now().isoformat()
    
    def _format_content_for_platform(self, content_data: Dict[str, Any], platform: str) -> Dict[str, Any]:
        """Format content appropriately for each publishing platform."""
        # TODO: Implement actual content formatting for different platforms
        # Mock implementation for testing
        
        formatted_content = content_data.copy()
        
        # Add platform-specific formatting
        if platform.lower() in ["wordpress", "drupal", "shopify"]:
            # CMS platforms
            formatted_content["formatted_type"] = "cms"
            formatted_content["seo_title"] = formatted_content.get("title", "")
            formatted_content["seo_description"] = formatted_content.get("meta_description", "")
            formatted_content["slug"] = formatted_content.get("title", "").lower().replace(" ", "-")
            formatted_content["featured_image"] = formatted_content.get("featured_image", "")
        elif platform.lower() in ["linkedin", "twitter", "facebook", "instagram"]:
            # Social platforms
            formatted_content["formatted_type"] = "social"
            
            # Truncate content for character limits
            if platform.lower() == "twitter":
                text = formatted_content.get("content", "")
                if len(text) > 280:
                    formatted_content["content"] = text[:277] + "..."
            
            # Add hashtags for social platforms
            if "hashtags" not in formatted_content and "keywords" in formatted_content:
                formatted_content["hashtags"] = [f"#{keyword.replace(' ', '')}" for keyword in formatted_content.get("keywords", [])]
        elif platform.lower() in ["mailchimp", "sendinblue", "klaviyo"]:
            # Email platforms
            formatted_content["formatted_type"] = "email"
            formatted_content["from_name"] = "Your Brand Name"
            formatted_content["reply_to"] = "noreply@example.com"
            formatted_content["subject_line"] = formatted_content.get("title", "")
            formatted_content["preview_text"] = formatted_content.get("meta_description", "")
        
        return formatted_content
    
    def _publish_to_platform(self, platform: str, content: Dict[str, Any], 
                          credentials: Dict[str, Any], publish_time: str) -> Dict[str, Any]:
        """Publish content to a specific platform.
        
        Args:
            platform: The platform name
            content: Formatted content data to publish
            credentials: Platform credentials
            publish_time: ISO format datetime for publishing
            
        Returns:
            Dict containing the publishing result
        """
        platform_type = self._get_platform_type(platform)
        brand_id = content.get("brand_id")
        
        logger.info(f"Publishing to {platform} (type: {platform_type}) at {publish_time}")
        
        # Check if current time is within 5 minutes of publish time
        now = datetime.now()
        try:
            publish_datetime = datetime.fromisoformat(publish_time.replace('Z', '+00:00'))
            time_diff = (publish_datetime - now).total_seconds()
            is_immediate = abs(time_diff) < 300  # Within 5 minutes
        except Exception:
            is_immediate = True  # Default to immediate if we can't parse the time
        
        try:
            if platform_type == "social":
                integration = self.integration_manager.get_social_integration(brand_id, platform)
                if not integration:
                    return {
                        "status": "error",
                        "platform": platform,
                        "error": f"Failed to get integration for {platform}"
                    }
                
                if is_immediate:
                    return integration.post_content(content)
                else:
                    return integration.schedule_content(content, publish_time)
                
            elif platform_type == "cms":
                integration = self.integration_manager.get_cms_integration(brand_id, platform)
                if not integration:
                    return {
                        "status": "error",
                        "platform": platform,
                        "error": f"Failed to get integration for {platform}"
                    }
                
                if is_immediate:
                    return integration.publish_content(content)
                else:
                    return integration.schedule_content(content, publish_time)
                
            elif platform_type == "email":
                # TODO: Implement email platform publishing
                # Mock implementation for testing
                platform_content_id = f"{platform.lower()}_content_{int(time.time())}"
                
                # Simulate success with 90% probability
                if random.random() < 0.9:
                    return {
                        "status": "success",
                        "platform": platform,
                        "platform_content_id": platform_content_id,
                        "publish_time": publish_time,
                        "details": f"Email campaign scheduled for {publish_time}" if not is_immediate else "Email campaign sent"
                    }
                else:
                    return {
                        "status": "error",
                        "platform": platform,
                        "error": f"Mock API error for {platform}",
                        "details": "Rate limit exceeded or authentication failed"
                    }
            else:
                return {
                    "status": "error",
                    "platform": platform,
                    "error": f"Unknown platform type: {platform_type}"
                }
                
        except Exception as e:
            logger.error(f"Error publishing to {platform}: {e}")
            return {
                "status": "error",
                "platform": platform,
                "error": str(e),
                "details": "Exception while publishing to platform"
            }
    
    def _record_content_publication(self, content_id: Any, platform: str, 
                                  platform_content_id: str, publish_time: str,
                                  content_data: Dict[str, Any]):
        """Record content publication details.
        
        Args:
            content_id: Content ID in our system
            platform: The platform name
            platform_content_id: Platform-specific content ID
            publish_time: ISO format datetime for publishing
            content_data: Published content data
            
        Returns:
            None
        """
        # Try to store in database first
        try:
            project_id = content_data.get("project_id")
            platform_url = content_data.get("url", f"https://example.com/{platform}/{platform_content_id}")
            
            with get_db() as db:
                # Create initial performance record
                performance = ContentPerformance(
                    project_id=project_id,
                    content_draft_id=content_id,
                    date=datetime.now(),
                    platform=platform,
                    views=0,
                    engagements=0,
                    shares=0,
                    comments=0,
                    likes=0,
                    clicks=0
                )
                db.add(performance)
                db.commit()
                logger.info(f"Recorded publication of content {content_id} to {platform} with ID {platform_content_id}")
        except Exception as e:
            logger.error(f"Error recording content publication in database: {e}")
        
        # Also store in cache for quick access during monitoring
        try:
            cache_key = f"{self.engagement_cache_prefix}:{content_id}:{platform}"
            publication_data = {
                "content_id": content_id,
                "platform": platform,
                "platform_content_id": platform_content_id,
                "publish_time": publish_time,
                "url": content_data.get("url", f"https://example.com/{platform}/{platform_content_id}"),
                "last_checked": None,
                "metrics": {}
            }
            self.cache.set(cache_key, json.dumps(publication_data))
        except Exception as e:
            logger.error(f"Error recording content publication in cache: {e}")
    
    def handle_ad_campaign_management(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle ad campaign management."""
        brand_id = task.get("brand_id")
        project_id = task.get("project_id")
        content_id = task.get("content_id")
        campaign_action = task.get("campaign_action", "create")  # create, update, pause, resume, stop
        campaign_data = task.get("campaign_data", {})
        ad_platforms = task.get("ad_platforms", [])
        user_id = task.get("user_id")
        
        # Check if ad management is enabled
        if not self.enable_ad_management:
            return {
                "status": "error",
                "error": "Ad campaign management is not enabled"
            }
        
        # Log the campaign request
        logger.info(f"{campaign_action.title()} ad campaign for brand: {brand_id}, content: {content_id}, platforms: {ad_platforms}")
        
        if not ad_platforms:
            return {
                "status": "error",
                "error": "No ad platforms specified"
            }
        
        # Process campaign on each platform
        campaign_results = {}
        overall_status = "success"
        
        for platform in ad_platforms:
            try:
                # Get platform ad account credentials
                platform_credentials = self._get_ad_platform_credentials(brand_id, platform)
                
                if not platform_credentials:
                    campaign_results[platform] = {
                        "status": "error",
                        "error": f"No ad account credentials found for platform: {platform}"
                    }
                    overall_status = "partial"
                    continue
                
                # Perform the requested campaign action
                if campaign_action == "create":
                    result = self._create_ad_campaign(platform, campaign_data, platform_credentials)
                elif campaign_action == "update":
                    result = self._update_ad_campaign(platform, campaign_data, platform_credentials)
                elif campaign_action == "pause":
                    result = self._pause_ad_campaign(platform, campaign_data.get("campaign_id"), platform_credentials)
                elif campaign_action == "resume":
                    result = self._resume_ad_campaign(platform, campaign_data.get("campaign_id"), platform_credentials)
                elif campaign_action == "stop":
                    result = self._stop_ad_campaign(platform, campaign_data.get("campaign_id"), platform_credentials)
                else:
                    result = {
                        "status": "error",
                        "error": f"Unknown campaign action: {campaign_action}"
                    }
                
                campaign_results[platform] = result
                
                # Update overall status if any platform failed
                if result["status"] != "success":
                    overall_status = "partial"
                
                # Record successful campaign action
                if result["status"] == "success" and campaign_action == "create":
                    self._record_ad_campaign(
                        content_id,
                        platform,
                        result.get("campaign_id"),
                        campaign_data,
                        result
                    )
            except Exception as e:
                logger.error(f"Error managing campaign on {platform}: {e}")
                campaign_results[platform] = {
                    "status": "error",
                    "error": str(e)
                }
                overall_status = "partial"
        
        # Record audit trail if enabled
        if self.enable_audit_trails:
            self._record_audit_trail(
                action=f"campaign_{campaign_action}d",
                user_id=user_id,
                details={
                    "brand_id": brand_id,
                    "project_id": project_id,
                    "content_id": content_id,
                    "ad_platforms": ad_platforms,
                    "overall_status": overall_status
                }
            )
        
        # Broadcast campaign event
        self.broadcast_event({
            "event_type": f"ad_campaign_{campaign_action}d",
            "content_id": content_id,
            "brand_id": brand_id,
            "project_id": project_id,
            "ad_platforms": ad_platforms,
            "overall_status": overall_status
        })
        
        return {
            "status": overall_status,
            "message": f"Campaign {campaign_action} completed with status: {overall_status}",
            "content_id": content_id,
            "platform_results": campaign_results
        }
    
    def _get_ad_platform_credentials(self, brand_id: Any, platform: str) -> Dict[str, Any]:
        """Get ad platform credentials for a specific platform.
        
        Args:
            brand_id: The brand ID
            platform: The ad platform name
            
        Returns:
            Dict containing credentials for the ad platform
        """
        return self.integration_manager._get_ad_account_credentials(brand_id, platform) or {}
    
    def _create_ad_campaign(self, platform: str, campaign_data: Dict[str, Any],
                          credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Create an ad campaign on a specific platform.
        
        Args:
            platform: The ad platform name
            campaign_data: Campaign configuration data
            credentials: Platform credentials
            
        Returns:
            Dict containing the campaign creation result
        """
        brand_id = campaign_data.get("brand_id")
        logger.info(f"Creating campaign on {platform}")
        
        try:
            # Format campaign data for specific platform
            formatted_data = self._format_campaign_for_platform(platform, campaign_data)
            
            integration = self.integration_manager.get_ad_integration(brand_id, platform)
            if not integration:
                return {
                    "status": "error",
                    "platform": platform,
                    "error": f"Failed to get integration for {platform}"
                }
            
            return integration.create_campaign(formatted_data)
            
        except Exception as e:
            logger.error(f"Error creating campaign on {platform}: {e}")
            return {
                "status": "error",
                "platform": platform,
                "error": str(e),
                "details": "Exception while creating ad campaign"
            }
    
    def _format_campaign_for_platform(self, platform: str, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Format campaign data appropriately for each ad platform."""
        # TODO: Implement actual campaign data formatting for different platforms
        # Mock implementation for testing
        
        formatted_data = campaign_data.copy()
        
        # Add platform-specific formatting
        if platform.lower() in ["facebook ads", "facebook", "instagram ads", "instagram"]:
            # Facebook/Instagram specific fields
            if "objective" not in formatted_data:
                formatted_data["objective"] = "TRAFFIC"
            if "optimization_goal" not in formatted_data:
                formatted_data["optimization_goal"] = "LINK_CLICKS"
        elif platform.lower() in ["google ads", "google"]:
            # Google Ads specific fields
            if "campaign_type" not in formatted_data:
                formatted_data["campaign_type"] = "SEARCH"
            if "bidding_strategy" not in formatted_data:
                formatted_data["bidding_strategy"] = "MAXIMIZE_CONVERSIONS"
        
        # Ensure common required fields are present
        if "name" not in formatted_data:
            formatted_data["name"] = f"Campaign {int(time.time())}"
        if "budget" not in formatted_data:
            formatted_data["budget"] = {"amount": 100.00, "period": "daily"}
        if "start_date" not in formatted_data:
            formatted_data["start_date"] = datetime.now().isoformat()
        if "end_date" not in formatted_data:
            formatted_data["end_date"] = (datetime.now() + timedelta(days=30)).isoformat()
        
        return formatted_data
    
    def _update_ad_campaign(self, platform: str, campaign_data: Dict[str, Any],
                          credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing ad campaign on a specific platform.
        
        Args:
            platform: The ad platform name
            campaign_data: Updated campaign configuration data
            credentials: Platform credentials
            
        Returns:
            Dict containing the campaign update result
        """
        brand_id = campaign_data.get("brand_id")
        campaign_id = campaign_data.get("campaign_id")
        logger.info(f"Updating campaign on {platform}: {campaign_id}")
        
        try:
            integration = self.integration_manager.get_ad_integration(brand_id, platform)
            if not integration:
                return {
                    "status": "error",
                    "platform": platform,
                    "error": f"Failed to get integration for {platform}"
                }
            
            return integration.update_campaign(campaign_id, campaign_data)
            
        except Exception as e:
            logger.error(f"Error updating campaign on {platform}: {e}")
            return {
                "status": "error",
                "platform": platform,
                "error": str(e),
                "details": "Exception while updating ad campaign"
            }
    
    def _pause_ad_campaign(self, platform: str, campaign_id: str,
                         credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Pause an ad campaign on a specific platform.
        
        Args:
            platform: The ad platform name
            campaign_id: Platform-specific campaign ID
            credentials: Platform credentials
            
        Returns:
            Dict containing the pause operation result
        """
        # Extract brand_id from credentials
        brand_id = credentials.get("brand_id")
        logger.info(f"Pausing campaign on {platform}: {campaign_id}")
        
        try:
            integration = self.integration_manager.get_ad_integration(brand_id, platform)
            if not integration:
                return {
                    "status": "error",
                    "platform": platform,
                    "error": f"Failed to get integration for {platform}"
                }
            
            return integration.pause_campaign(campaign_id)
            
        except Exception as e:
            logger.error(f"Error pausing campaign on {platform}: {e}")
            return {
                "status": "error",
                "platform": platform,
                "error": str(e),
                "details": "Exception while pausing ad campaign"
            }
    
    def _resume_ad_campaign(self, platform: str, campaign_id: str,
                          credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Resume a paused ad campaign on a specific platform.
        
        Args:
            platform: The ad platform name
            campaign_id: Platform-specific campaign ID
            credentials: Platform credentials
            
        Returns:
            Dict containing the resume operation result
        """
        # Extract brand_id from credentials
        brand_id = credentials.get("brand_id")
        logger.info(f"Resuming campaign on {platform}: {campaign_id}")
        
        try:
            integration = self.integration_manager.get_ad_integration(brand_id, platform)
            if not integration:
                return {
                    "status": "error",
                    "platform": platform,
                    "error": f"Failed to get integration for {platform}"
                }
            
            return integration.resume_campaign(campaign_id)
            
        except Exception as e:
            logger.error(f"Error resuming campaign on {platform}: {e}")
            return {
                "status": "error",
                "platform": platform,
                "error": str(e),
                "details": "Exception while resuming ad campaign"
            }
    
    def _stop_ad_campaign(self, platform: str, campaign_id: str,
                        credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Stop (complete) an ad campaign on a specific platform.
        
        Args:
            platform: The ad platform name
            campaign_id: Platform-specific campaign ID
            credentials: Platform credentials
            
        Returns:
            Dict containing the stop operation result
        """
        # Extract brand_id from credentials
        brand_id = credentials.get("brand_id")
        logger.info(f"Stopping campaign on {platform}: {campaign_id}")
        
        try:
            integration = self.integration_manager.get_ad_integration(brand_id, platform)
            if not integration:
                return {
                    "status": "error",
                    "platform": platform,
                    "error": f"Failed to get integration for {platform}"
                }
            
            return integration.stop_campaign(campaign_id)
            
        except Exception as e:
            logger.error(f"Error stopping campaign on {platform}: {e}")
            return {
                "status": "error",
                "platform": platform,
                "error": str(e),
                "details": "Exception while stopping ad campaign"
            }
    
    def _record_ad_campaign(self, content_id: Any, platform: str, campaign_id: str,
                          campaign_data: Dict[str, Any], result: Dict[str, Any]):
        """Record ad campaign details.
        
        Args:
            content_id: Content ID in our system
            platform: The ad platform name
            campaign_id: Platform-specific campaign ID
            campaign_data: Campaign configuration data
            result: Result from campaign creation API
            
        Returns:
            None
        """
        # Try to store in database first
        try:
            brand_id = campaign_data.get("brand_id")
            project_id = campaign_data.get("project_id")
            
            with get_db() as db:
                # First, find the ad account ID
                from src.models.integration import AdAccount
                ad_account = db.query(AdAccount).filter(
                    AdAccount.brand_id == brand_id,
                    AdAccount.platform.ilike(f"%{platform}%")
                ).first()
                
                if ad_account:
                    # Create ad campaign record
                    from src.models.advertising import AdCampaign
                    campaign = AdCampaign(
                        brand_id=brand_id,
                        ad_account_id=ad_account.id,
                        platform=platform,
                        campaign_name=result.get("campaign_name", "Unnamed Campaign"),
                        campaign_objective=campaign_data.get("objective"),
                        budget=float(campaign_data.get("budget", {}).get("amount", 0)),
                        start_date=datetime.fromisoformat(campaign_data.get("start_date")) if campaign_data.get("start_date") else None,
                        end_date=datetime.fromisoformat(campaign_data.get("end_date")) if campaign_data.get("end_date") else None,
                        status="active",
                        platform_campaign_id=campaign_id
                    )
                    db.add(campaign)
                    db.commit()
                    
                    # Create initial performance record
                    from src.models.advertising import AdPerformance
                    performance = AdPerformance(
                        ad_campaign_id=campaign.id,
                        date=datetime.now(),
                        impressions=0,
                        clicks=0,
                        spend=0,
                        conversions=0
                    )
                    db.add(performance)
                    db.commit()
                    
                    logger.info(f"Recorded campaign for content {content_id} on {platform} with ID {campaign_id}")
                else:
                    logger.warning(f"Could not find ad account for brand {brand_id} and platform {platform}")
        except Exception as e:
            logger.error(f"Error recording ad campaign in database: {e}")
        
        # Also store in cache for quick access during monitoring
        try:
            cache_key = f"{self.campaign_cache_prefix}:{content_id}:{platform}:{campaign_id}"
            campaign_record = {
                "content_id": content_id,
                "platform": platform,
                "campaign_id": campaign_id,
                "campaign_name": result.get("campaign_name", "Unnamed Campaign"),
                "created_at": result.get("created_at", datetime.now().isoformat()),
                "status": result.get("status", "active"),
                "budget": campaign_data.get("budget"),
                "start_date": campaign_data.get("start_date"),
                "end_date": campaign_data.get("end_date"),
                "targeting": campaign_data.get("targeting"),
                "last_checked": None,
                "metrics": {}
            }
            self.cache.set(cache_key, json.dumps(campaign_record))
        except Exception as e:
            logger.error(f"Error recording ad campaign in cache: {e}")
    
    def _start_engagement_monitoring(self):
        """Start background monitoring of engagement metrics."""
        def monitor_engagement():
            while self.is_running:
                try:
                    self.handle_engagement_monitoring({
                        "task_type": "engagement_monitoring_task",
                        "check_all": True
                    })
                except Exception as e:
                    logger.error(f"Error in engagement monitoring: {e}")
                
                # Sleep until next check interval
                time.sleep(self.monitoring_interval)
        
        # Start monitoring in a separate thread
        threading.Thread(target=monitor_engagement, daemon=True).start()
        logger.info(f"Started engagement monitoring (interval: {self.monitoring_interval}s)")
    
    def handle_engagement_monitoring(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle monitoring of engagement metrics for content and campaigns."""
        content_id = task.get("content_id")
        brand_id = task.get("brand_id")
        check_all = task.get("check_all", False)
        user_id = task.get("user_id")
        
        # Check if engagement monitoring is enabled
        if not self.enable_engagement_monitoring:
            return {
                "status": "error",
                "error": "Engagement monitoring is not enabled"
            }
        
        # Log the monitoring request
        logger.info(f"Monitoring engagement for content: {content_id}, check_all: {check_all}")
        
        # Results container
        monitoring_results = {
            "content_engagement": {},
            "campaign_performance": {}
        }
        
        # Monitor specific content or all content
        if check_all:
            # TODO: Retrieve all active content and campaigns from database
            # Mock implementation for testing
            content_items = [
                {"id": "content_1", "brand_id": "brand_1", "platforms": ["wordpress", "linkedin", "twitter"]},
                {"id": "content_2", "brand_id": "brand_2", "platforms": ["facebook", "instagram"]},
                {"id": "content_3", "brand_id": "brand_1", "platforms": ["wordpress"]}
            ]
            
            # Check engagement for each content item
            for item in content_items:
                # Skip if brand filter is provided and doesn't match
                if brand_id and item["brand_id"] != brand_id:
                    continue
                
                content_results = self._check_content_engagement(item["id"], item["platforms"])
                monitoring_results["content_engagement"][item["id"]] = content_results
                
                # Check associated campaigns
                campaign_results = self._check_campaign_performance(item["id"])
                if campaign_results:
                    monitoring_results["campaign_performance"][item["id"]] = campaign_results
        elif content_id:
            # Check specific content
            # TODO: Retrieve content platforms from database
            # Mock implementation for testing
            platforms = ["wordpress", "linkedin", "twitter", "facebook"]
            
            # Check engagement for the content
            content_results = self._check_content_engagement(content_id, platforms)
            monitoring_results["content_engagement"][content_id] = content_results
            
            # Check associated campaigns
            campaign_results = self._check_campaign_performance(content_id)
            if campaign_results:
                monitoring_results["campaign_performance"][content_id] = campaign_results
        else:
            return {
                "status": "error",
                "error": "Either content_id or check_all must be provided"
            }
        
        # Process alerts and insights
        alerts = self._process_engagement_alerts(monitoring_results)
        insights = self._extract_engagement_insights(monitoring_results)
        
        # Record audit trail if enabled and not an automated check
        if self.enable_audit_trails and user_id:
            self._record_audit_trail(
                action="engagement_monitored",
                user_id=user_id,
                details={
                    "content_id": content_id,
                    "brand_id": brand_id,
                    "check_all": check_all,
                    "alert_count": len(alerts)
                }
            )
        
        # Broadcast alerts if significant issues found
        if alerts:
            self.broadcast_event({
                "event_type": "engagement_alerts",
                "content_id": content_id,
                "brand_id": brand_id,
                "alerts": alerts
            })
        
        return {
            "status": "success",
            "message": "Engagement monitoring completed",
            "results": monitoring_results,
            "alerts": alerts,
            "insights": insights
        }
    
    def _check_content_engagement(self, content_id: str, platforms: List[str]) -> Dict[str, Any]:
        """Check engagement metrics for content across platforms.
        
        Args:
            content_id: Content ID in our system
            platforms: List of platforms to check engagement for
            
        Returns:
            Dict containing engagement metrics for each platform
        """
        logger.info(f"Checking engagement for content {content_id} on platforms: {platforms}")
        
        platform_results = {}
        
        # Try to get brand_id from cache
        brand_id = None
        for platform in platforms:
            cache_key = f"{self.engagement_cache_prefix}:{content_id}:{platform}"
            existing_data_json = self.cache.get(cache_key)
            if existing_data_json:
                try:
                    existing_data = json.loads(existing_data_json)
                    if "brand_id" in existing_data:
                        brand_id = existing_data["brand_id"]
                        break
                except:
                    pass
        
        for platform in platforms:
            try:
                platform_type = self._get_platform_type(platform)
                cache_key = f"{self.engagement_cache_prefix}:{content_id}:{platform}"
                existing_data_json = self.cache.get(cache_key)
                existing_data = {}
                
                if existing_data_json:
                    try:
                        existing_data = json.loads(existing_data_json)
                    except json.JSONDecodeError:
                        logger.error(f"Failed to decode existing metrics for content {content_id} on {platform}")
                
                # Get platform-specific content ID
                platform_content_id = existing_data.get("platform_content_id")
                
                if not platform_content_id:
                    logger.warning(f"No platform content ID found for content {content_id} on {platform}")
                    platform_results[platform] = {
                        "status": "error",
                        "error": "No platform content ID found"
                    }
                    continue
                
                # Different handling based on platform type
                metrics = {}
                
                if platform_type == "social" and brand_id:
                    # Use social media integration to get metrics
                    integration = self.integration_manager.get_social_integration(brand_id, platform)
                    
                    if integration:
                        result = integration.get_content_status(platform_content_id)
                        
                        if result.get("status") == "success" and "metrics" in result:
                            metrics = result["metrics"]
                            # Also add standard metrics that might not be in the platform result
                            if "impressions" not in metrics and "views" in metrics:
                                metrics["impressions"] = metrics["views"]
                            if "engagement_rate" not in metrics and "impressions" in metrics and "engagements" in metrics:
                                if metrics["impressions"] > 0:
                                    metrics["engagement_rate"] = (metrics["engagements"] / metrics["impressions"]) * 100
                    else:
                        # Fallback to mock data for social
                        metrics = {
                            "impressions": random.randint(500, 50000),
                            "engagements": random.randint(50, 5000),
                            "clicks": random.randint(20, 2000),
                            "shares": random.randint(5, 500),
                            "comments": random.randint(1, 200),
                            "likes": random.randint(20, 2000),
                            "engagement_rate": round(random.uniform(0.5, 8.0), 2),
                        }
                        
                elif platform_type == "cms" and brand_id:
                    # Use CMS integration to get metrics
                    integration = self.integration_manager.get_cms_integration(brand_id, platform)
                    
                    if integration:
                        result = integration.get_content_status(platform_content_id)
                        
                        if result.get("status") == "success":
                            # Most CMS platforms don't provide direct engagement metrics through API
                            # In a real implementation, this would use web analytics integration
                            metrics = {
                                "page_views": random.randint(100, 5000),
                                "unique_visitors": random.randint(80, 3000),
                                "average_time_on_page": f"{random.randint(1, 10)}:{random.randint(10, 59)}",
                                "bounce_rate": round(random.uniform(40, 90), 1)
                            }
                    else:
                        # Fallback to mock data for CMS
                        metrics = {
                            "page_views": random.randint(100, 5000),
                            "unique_visitors": random.randint(80, 3000),
                            "average_time_on_page": f"{random.randint(1, 10)}:{random.randint(10, 59)}",
                            "bounce_rate": round(random.uniform(40, 90), 1)
                        }
                else:
                    # Fallback to mock data for unknown platforms
                    metrics = {
                        "views": random.randint(100, 1000),
                        "interactions": random.randint(10, 100)
                    }
                
                # Try to record in database
                try:
                    with get_db() as db:
                        # Update performance record
                        from src.models.content import ContentPerformance
                        performance = db.query(ContentPerformance).filter(
                            ContentPerformance.content_draft_id == content_id,
                            ContentPerformance.platform == platform
                        ).first()
                        
                        if performance:
                            # Update with latest metrics
                            if "views" in metrics:
                                performance.views = metrics["views"]
                            elif "impressions" in metrics:
                                performance.views = metrics["impressions"]
                                
                            if "engagements" in metrics:
                                performance.engagements = metrics["engagements"]
                            elif "interactions" in metrics:
                                performance.engagements = metrics["interactions"]
                                
                            if "shares" in metrics:
                                performance.shares = metrics["shares"]
                            if "comments" in metrics:
                                performance.comments = metrics["comments"]
                            if "likes" in metrics:
                                performance.likes = metrics["likes"]
                            if "clicks" in metrics:
                                performance.clicks = metrics["clicks"]
                                
                            db.commit()
                except Exception as e:
                    logger.error(f"Error updating engagement metrics in database: {e}")
                
                # Update metrics in cache
                if existing_data_json:
                    try:
                        # Calculate delta from previous metrics
                        previous_metrics = existing_data.get("metrics", {})
                        deltas = {}
                        
                        for key, value in metrics.items():
                            if key in previous_metrics and isinstance(value, (int, float)) and isinstance(previous_metrics[key], (int, float)):
                                deltas[key] = value - previous_metrics[key]
                        
                        # Update with new metrics
                        existing_data["metrics"] = metrics
                        existing_data["previous_metrics"] = previous_metrics
                        existing_data["metric_deltas"] = deltas
                        existing_data["last_checked"] = datetime.now().isoformat()
                        
                        self.cache.set(cache_key, json.dumps(existing_data))
                        
                        # Include deltas in results
                        platform_results[platform] = {
                            "metrics": metrics,
                            "deltas": deltas,
                            "last_checked": existing_data["last_checked"]
                        }
                    except Exception as e:
                        logger.error(f"Error updating metrics in cache: {e}")
                        platform_results[platform] = {"metrics": metrics}
                else:
                    platform_results[platform] = {"metrics": metrics}
                    
            except Exception as e:
                logger.error(f"Error checking engagement for content {content_id} on {platform}: {e}")
                platform_results[platform] = {
                    "status": "error",
                    "error": str(e)
                }
        
        return platform_results
    
    def _check_campaign_performance(self, content_id: str) -> Dict[str, Any]:
        """Check performance metrics for campaigns associated with content.
        
        Args:
            content_id: Content ID in our system
            
        Returns:
            Dict containing performance metrics for each campaign
        """
        logger.info(f"Checking campaign performance for content {content_id}")
        
        campaign_results = {}
        brand_id = None
        
        # Try to get campaigns from database
        try:
            with get_db() as db:
                # First, find the campaigns associated with the content
                # In a real implementation, this would be properly linked in the database
                # For this mock implementation, we'll use the cache to find campaigns
                
                # Check cache for information
                cache_keys = []
                for key in self.cache.keys(f"{self.campaign_cache_prefix}:{content_id}:*"):
                    cache_keys.append(key)
                
                if cache_keys:
                    for cache_key in cache_keys:
                        existing_data_json = self.cache.get(cache_key)
                        if existing_data_json:
                            try:
                                existing_data = json.loads(existing_data_json)
                                platform = existing_data.get("platform")
                                campaign_id = existing_data.get("campaign_id")
                                brand_id = existing_data.get("brand_id")
                                
                                if platform and campaign_id:
                                    # Get performance metrics
                                    integration = None
                                    
                                    if brand_id:
                                        integration = self.integration_manager.get_ad_integration(brand_id, platform)
                                    
                                    if integration:
                                        # Use the integration to get performance metrics
                                        result = integration.get_campaign_performance(campaign_id)
                                        
                                        if result.get("status") == "success" and "metrics" in result:
                                            metrics = result["metrics"]
                                        else:
                                            # Fallback to mock metrics
                                            metrics = self._generate_mock_campaign_metrics()
                                    else:
                                        # Fallback to mock metrics
                                        metrics = self._generate_mock_campaign_metrics()
                                    
                                    # Update performance in database
                                    self._update_campaign_performance_in_db(campaign_id, metrics)
                                    
                                    # Calculate delta from previous metrics
                                    previous_metrics = existing_data.get("metrics", {})
                                    deltas = {}
                                    
                                    for key, value in metrics.items():
                                        if key in previous_metrics and isinstance(value, (int, float)) and isinstance(previous_metrics[key], (int, float)):
                                            deltas[key] = value - previous_metrics[key]
                                    
                                    # Update with new metrics
                                    existing_data["metrics"] = metrics
                                    existing_data["previous_metrics"] = previous_metrics
                                    existing_data["metric_deltas"] = deltas
                                    existing_data["last_checked"] = datetime.now().isoformat()
                                    
                                    self.cache.set(cache_key, json.dumps(existing_data))
                                    
                                    # Include deltas in results
                                    campaign_results[campaign_id] = {
                                        "platform": platform,
                                        "metrics": metrics,
                                        "deltas": deltas,
                                        "last_checked": existing_data["last_checked"],
                                        "campaign_name": existing_data.get("campaign_name", "Unnamed Campaign"),
                                        "status": existing_data.get("status", "active")
                                    }
                            except Exception as e:
                                logger.error(f"Error processing campaign cache data: {e}")
                else:
                    # If no campaigns found in cache, create some mock data for demonstration
                    # In a real implementation, we would query the database for campaigns
                    campaigns = [
                        {"platform": "facebook ads", "campaign_id": f"fb_campaign_{random.randint(1000, 9999)}"},
                        {"platform": "google ads", "campaign_id": f"google_campaign_{random.randint(1000, 9999)}"}
                    ]
                    
                    for campaign in campaigns:
                        platform = campaign["platform"]
                        campaign_id = campaign["campaign_id"]
                        
                        # Generate mock metrics
                        metrics = self._generate_mock_campaign_metrics()
                        
                        # Create cache entry
                        cache_key = f"{self.campaign_cache_prefix}:{content_id}:{platform}:{campaign_id}"
                        campaign_data = {
                            "content_id": content_id,
                            "platform": platform,
                            "campaign_id": campaign_id,
                            "campaign_name": f"Campaign {campaign_id}",
                            "status": "active",
                            "metrics": metrics,
                            "last_checked": datetime.now().isoformat()
                        }
                        
                        self.cache.set(cache_key, json.dumps(campaign_data))
                        
                        # Add to results
                        campaign_results[campaign_id] = {
                            "platform": platform,
                            "metrics": metrics,
                            "campaign_name": campaign_data["campaign_name"],
                            "status": campaign_data["status"]
                        }
                    
        except Exception as e:
            logger.error(f"Error checking campaign performance: {e}")
        
        return campaign_results
        
    def _generate_mock_campaign_metrics(self) -> Dict[str, Any]:
        """Generate mock campaign performance metrics.
        
        Returns:
            Dict containing mock performance metrics
        """
        impressions = random.randint(1000, 100000)
        clicks = random.randint(50, 5000)
        spend = round(random.uniform(50, 1000), 2)
        conversions = random.randint(1, 200)
        
        return {
            "impressions": impressions,
            "clicks": clicks,
            "spend": spend,
            "conversions": conversions,
            "ctr": round((clicks / impressions) * 100, 2) if impressions > 0 else 0,
            "cpc": round(spend / clicks, 2) if clicks > 0 else 0,
            "conversion_rate": round((conversions / clicks) * 100, 2) if clicks > 0 else 0,
            "roas": round(random.uniform(1.0, 10.0), 2),  # Return on ad spend
            "cost_per_conversion": round(spend / conversions, 2) if conversions > 0 else 0
        }
        
    def _update_campaign_performance_in_db(self, campaign_id: str, metrics: Dict[str, Any]):
        """Update campaign performance metrics in the database.
        
        Args:
            campaign_id: Campaign ID
            metrics: Performance metrics to update
            
        Returns:
            None
        """
        try:
            with get_db() as db:
                # First, find the campaign in the database
                from src.models.advertising import AdCampaign, AdPerformance
                campaign = db.query(AdCampaign).filter(
                    AdCampaign.platform_campaign_id == campaign_id
                ).first()
                
                if campaign:
                    # Create or update performance record
                    performance = db.query(AdPerformance).filter(
                        AdPerformance.ad_campaign_id == campaign.id,
                        AdPerformance.date == datetime.now().date()
                    ).first()
                    
                    if not performance:
                        # Create new performance record
                        performance = AdPerformance(
                            ad_campaign_id=campaign.id,
                            date=datetime.now().date()
                        )
                        db.add(performance)
                    
                    # Update metrics
                    performance.impressions = metrics.get("impressions", 0)
                    performance.clicks = metrics.get("clicks", 0)
                    performance.spend = metrics.get("spend", 0)
                    performance.conversions = metrics.get("conversions", 0)
                    performance.ctr = metrics.get("ctr", 0)
                    performance.cpc = metrics.get("cpc", 0)
                    performance.cpa = metrics.get("cost_per_conversion", 0)
                    performance.roas = metrics.get("roas", 0)
                    
                    db.commit()
        except Exception as e:
            logger.error(f"Error updating campaign performance in database: {e}")
    
    def _process_engagement_alerts(self, monitoring_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process engagement data to identify issues requiring attention."""
        alerts = []
        
        # Process content engagement alerts
        for content_id, content_data in monitoring_results.get("content_engagement", {}).items():
            for platform, platform_data in content_data.items():
                metrics = platform_data.get("metrics", {})
                deltas = platform_data.get("deltas", {})
                
                # Alert on significant drops in engagement
                if platform.lower() in ["linkedin", "facebook", "twitter", "instagram"]:
                    if "engagement_rate" in metrics and metrics["engagement_rate"] < 1.0:
                        alerts.append({
                            "level": "warning",
                            "content_id": content_id,
                            "platform": platform,
                            "type": "low_engagement",
                            "message": f"Low engagement rate ({metrics['engagement_rate']}%) on {platform}",
                            "metrics": {"engagement_rate": metrics["engagement_rate"]}
                        })
                    
                    if "deltas" in platform_data and "engagement_rate" in deltas and deltas["engagement_rate"] < -1.0:
                        alerts.append({
                            "level": "warning",
                            "content_id": content_id,
                            "platform": platform,
                            "type": "declining_engagement",
                            "message": f"Declining engagement rate ({deltas['engagement_rate']}%) on {platform}",
                            "metrics": {"engagement_delta": deltas["engagement_rate"]}
                        })
                
                # Alert on CMS performance issues
                if platform.lower() in ["wordpress", "drupal", "shopify"]:
                    if "bounce_rate" in metrics and metrics["bounce_rate"] > 80:
                        alerts.append({
                            "level": "warning",
                            "content_id": content_id,
                            "platform": platform,
                            "type": "high_bounce_rate",
                            "message": f"High bounce rate ({metrics['bounce_rate']}%) on {platform}",
                            "metrics": {"bounce_rate": metrics["bounce_rate"]}
                        })
        
        # Process campaign performance alerts
        for content_id, campaigns in monitoring_results.get("campaign_performance", {}).items():
            for campaign_id, campaign_data in campaigns.items():
                metrics = campaign_data.get("metrics", {})
                
                # Alert on poor campaign performance
                if "ctr" in metrics and metrics["ctr"] < 1.0:
                    alerts.append({
                        "level": "warning",
                        "content_id": content_id,
                        "campaign_id": campaign_id,
                        "platform": campaign_data.get("platform"),
                        "type": "low_ctr",
                        "message": f"Low click-through rate ({metrics['ctr']}%) for campaign",
                        "metrics": {"ctr": metrics["ctr"]}
                    })
                
                if "conversion_rate" in metrics and metrics["conversion_rate"] < 1.0:
                    alerts.append({
                        "level": "warning",
                        "content_id": content_id,
                        "campaign_id": campaign_id,
                        "platform": campaign_data.get("platform"),
                        "type": "low_conversion",
                        "message": f"Low conversion rate ({metrics['conversion_rate']}%) for campaign",
                        "metrics": {"conversion_rate": metrics["conversion_rate"]}
                    })
                
                if "roas" in metrics and metrics["roas"] < 1.0:
                    alerts.append({
                        "level": "critical",
                        "content_id": content_id,
                        "campaign_id": campaign_id,
                        "platform": campaign_data.get("platform"),
                        "type": "negative_roi",
                        "message": f"Negative ROI (ROAS: {metrics['roas']}) for campaign",
                        "metrics": {"roas": metrics["roas"]}
                    })
        
        return alerts
    
    def _extract_engagement_insights(self, monitoring_results: Dict[str, Any]) -> Dict[str, Any]:
        """Extract actionable insights from engagement data."""
        insights = {
            "top_performing_content": [],
            "platform_performance": {},
            "audience_insights": {},
            "recommendations": []
        }
        
        # Extract top performing content
        content_performance = {}
        
        for content_id, content_data in monitoring_results.get("content_engagement", {}).items():
            # Calculate an overall engagement score
            engagement_score = 0
            platform_count = 0
            
            for platform, platform_data in content_data.items():
                metrics = platform_data.get("metrics", {})
                
                if platform.lower() in ["linkedin", "facebook", "twitter", "instagram"]:
                    if "engagement_rate" in metrics:
                        engagement_score += metrics["engagement_rate"]
                        platform_count += 1
                elif platform.lower() in ["wordpress", "drupal", "shopify"]:
                    # Convert time on page to seconds for scoring
                    if "average_time_on_page" in metrics:
                        try:
                            minutes, seconds = metrics["average_time_on_page"].split(":")
                            time_seconds = int(minutes) * 60 + int(seconds)
                            engagement_score += min(10, time_seconds / 30)  # Cap at 10
                            platform_count += 1
                        except (ValueError, IndexError):
                            pass
            
            # Calculate average score
            if platform_count > 0:
                avg_score = engagement_score / platform_count
                content_performance[content_id] = avg_score
        
        # Get top 3 performing content
        top_content = sorted(content_performance.items(), key=lambda x: x[1], reverse=True)[:3]
        insights["top_performing_content"] = [
            {"content_id": content_id, "engagement_score": round(score, 2)}
            for content_id, score in top_content
        ]
        
        # Extract platform performance
        platforms = set()
        for content_data in monitoring_results.get("content_engagement", {}).values():
            platforms.update(content_data.keys())
        
        for platform in platforms:
            platform_metrics = []
            
            for content_data in monitoring_results.get("content_engagement", {}).values():
                if platform in content_data:
                    metrics = content_data[platform].get("metrics", {})
                    if metrics:
                        platform_metrics.append(metrics)
            
            if platform_metrics:
                # Calculate averages for common metrics
                avg_metrics = {}
                
                if platform.lower() in ["linkedin", "facebook", "twitter", "instagram"]:
                    metrics_to_avg = ["impressions", "engagement_rate", "clicks", "shares"]
                    for metric in metrics_to_avg:
                        values = [m[metric] for m in platform_metrics if metric in m and isinstance(m[metric], (int, float))]
                        if values:
                            avg_metrics[f"avg_{metric}"] = sum(values) / len(values)
                
                insights["platform_performance"][platform] = avg_metrics
        
        # Extract audience insights
        demographics = {"age_groups": {}, "gender": {}}
        
        for content_data in monitoring_results.get("content_engagement", {}).values():
            for platform_data in content_data.values():
                metrics = platform_data.get("metrics", {})
                
                if "audience_demographics" in metrics:
                    audience = metrics["audience_demographics"]
                    
                    if "age_groups" in audience:
                        for age, percentage in audience["age_groups"].items():
                            if age in demographics["age_groups"]:
                                demographics["age_groups"][age].append(percentage)
                            else:
                                demographics["age_groups"][age] = [percentage]
                    
                    if "gender" in audience:
                        for gender, percentage in audience["gender"].items():
                            if gender in demographics["gender"]:
                                demographics["gender"][gender].append(percentage)
                            else:
                                demographics["gender"][gender] = [percentage]
        
        # Calculate average demographics
        avg_demographics = {"age_groups": {}, "gender": {}}
        
        for age, percentages in demographics["age_groups"].items():
            avg_demographics["age_groups"][age] = sum(percentages) / len(percentages)
        
        for gender, percentages in demographics["gender"].items():
            avg_demographics["gender"][gender] = sum(percentages) / len(percentages)
        
        insights["audience_insights"] = avg_demographics
        
        # Generate recommendations
        recommendations = []
        
        # Platform-specific recommendations
        low_performing_platforms = []
        for platform, metrics in insights["platform_performance"].items():
            if "avg_engagement_rate" in metrics and metrics["avg_engagement_rate"] < 2.0:
                low_performing_platforms.append(platform)
        
        if low_performing_platforms:
            recommendations.append({
                "type": "platform_optimization",
                "message": f"Optimize content for {', '.join(low_performing_platforms)} to improve engagement",
                "details": "Consider format adjustments or more platform-specific content"
            })
        
        # Audience-based recommendations
        if "age_groups" in avg_demographics and avg_demographics["age_groups"]:
            top_age = max(avg_demographics["age_groups"].items(), key=lambda x: x[1])[0]
            recommendations.append({
                "type": "audience_targeting",
                "message": f"Create more content targeted at {top_age} age group",
                "details": f"This demographic represents your highest engagement at {avg_demographics['age_groups'][top_age]:.1f}%"
            })
        
        # Campaign-based recommendations
        campaign_data = monitoring_results.get("campaign_performance", {})
        if campaign_data:
            low_ctr_campaigns = []
            for content_id, campaigns in campaign_data.items():
                for campaign_id, campaign_info in campaigns.items():
                    metrics = campaign_info.get("metrics", {})
                    if "ctr" in metrics and metrics["ctr"] < 1.0:
                        low_ctr_campaigns.append(campaign_id)
            
            if low_ctr_campaigns:
                recommendations.append({
                    "type": "ad_creative_review",
                    "message": "Review ad creatives for campaigns with low CTR",
                    "details": f"Consider testing new headlines, images, or offers for {len(low_ctr_campaigns)} campaigns"
                })
        
        insights["recommendations"] = recommendations
        
        return insights
    
    def _handle_content_test_completed(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Handle content test completion events."""
        test_id = event.get("test_id")
        project_id = event.get("project_id")
        winning_variation = event.get("winning_variation")
        
        logger.info(f"Received content test completion for project: {project_id}, winner: {winning_variation}")
        
        # In a real implementation, we might:
        # 1. Update the content to use the winning variation
        # 2. Adjust ad campaigns to use the winning variation
        # 3. Notify relevant users about the test results
        
        # For now, just return acknowledgment
        return {
            "status": "processed",
            "test_id": test_id,
            "project_id": project_id
        }
    
    def handle_predictive_analytics(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle predictive analytics for content and campaigns."""
        brand_id = task.get("brand_id")
        content_ids = task.get("content_ids", [])
        prediction_type = task.get("prediction_type", "all")  # all, engagement, conversion, roi
        time_horizon = task.get("time_horizon", 30)  # Days to project forward
        user_id = task.get("user_id")
        
        # Check if predictive analytics is enabled
        if not self.enable_predictive_analytics:
            return {
                "status": "error",
                "error": "Predictive analytics is not enabled"
            }
        
        # Log the analytics request
        logger.info(f"Generating predictive analytics for brand: {brand_id}, prediction type: {prediction_type}")
        
        if not content_ids and not brand_id:
            return {
                "status": "error",
                "error": "Either brand_id or content_ids must be provided"
            }
        
        # If no specific content IDs provided, get all content for the brand
        if not content_ids and brand_id:
            # TODO: Get all content IDs for the brand from database
            # Mock implementation for testing
            content_ids = [f"content_{i}" for i in range(1, 4)]
        
        # Generate predictions for each content
        predictions = {}
        for content_id in content_ids:
            # Get historical data for the content
            historical_data = self._get_content_historical_data(content_id)
            
            # Generate predictions
            content_predictions = {}
            
            if prediction_type in ["all", "engagement"]:
                engagement_prediction = self._predict_engagement_metrics(content_id, historical_data, time_horizon)
                content_predictions["engagement"] = engagement_prediction
            
            if prediction_type in ["all", "conversion"]:
                conversion_prediction = self._predict_conversion_metrics(content_id, historical_data, time_horizon)
                content_predictions["conversion"] = conversion_prediction
            
            if prediction_type in ["all", "roi"]:
                roi_prediction = self._predict_roi_metrics(content_id, historical_data, time_horizon)
                content_predictions["roi"] = roi_prediction
            
            predictions[content_id] = content_predictions
        
        # Generate strategic recommendations based on predictions
        recommendations = self._generate_predictive_recommendations(predictions, brand_id)
        
        # Record audit trail if enabled
        if self.enable_audit_trails:
            self._record_audit_trail(
                action="predictive_analytics",
                user_id=user_id,
                details={
                    "brand_id": brand_id,
                    "content_count": len(content_ids),
                    "prediction_type": prediction_type,
                    "time_horizon": time_horizon
                }
            )
        
        return {
            "status": "success",
            "message": f"Generated predictive analytics for {len(content_ids)} content items",
            "brand_id": brand_id,
            "time_horizon": f"{time_horizon} days",
            "predictions": predictions,
            "recommendations": recommendations
        }
    
    def _get_content_historical_data(self, content_id: str) -> Dict[str, Any]:
        """Get historical performance data for content."""
        # TODO: Implement actual historical data retrieval from database
        # Mock implementation for testing
        
        # Generate 30 days of mock historical data
        now = datetime.now()
        dates = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(30)]
        
        # Engagement metrics
        engagement_data = {}
        base_impressions = random.randint(500, 5000)
        base_engagement_rate = random.uniform(1.0, 5.0)
        trend_direction = random.choice([-1, 1])  # Declining or improving trend
        
        for date in dates:
            day_index = dates.index(date)
            trend_factor = 1 + (trend_direction * day_index * 0.01)  # +/- 1% change per day
            
            # Add some randomness
            daily_variance = random.uniform(0.8, 1.2)
            
            impressions = int(base_impressions * trend_factor * daily_variance)
            engagement_rate = base_engagement_rate * trend_factor * daily_variance
            
            engagement_data[date] = {
                "impressions": impressions,
                "engagements": int(impressions * engagement_rate / 100),
                "engagement_rate": round(engagement_rate, 2)
            }
        
        # Conversion metrics
        conversion_data = {}
        base_conversion_rate = random.uniform(1.0, 3.0)
        
        for date in dates:
            day_index = dates.index(date)
            trend_factor = 1 + (trend_direction * day_index * 0.005)  # +/- 0.5% change per day
            
            # Add some randomness
            daily_variance = random.uniform(0.9, 1.1)
            
            impressions = engagement_data[date]["impressions"]
            clicks = int(impressions * random.uniform(0.02, 0.08) * daily_variance)
            conversion_rate = base_conversion_rate * trend_factor * daily_variance
            conversions = int(clicks * conversion_rate / 100)
            
            conversion_data[date] = {
                "clicks": clicks,
                "conversions": conversions,
                "conversion_rate": round(conversion_rate, 2)
            }
        
        # ROI metrics
        roi_data = {}
        base_cost = random.uniform(50, 200)
        base_revenue_per_conversion = random.uniform(50, 300)
        
        for date in dates:
            day_index = dates.index(date)
            trend_factor = 1 + (trend_direction * day_index * 0.003)  # +/- 0.3% change per day
            
            # Add some randomness
            daily_variance = random.uniform(0.95, 1.05)
            
            conversions = conversion_data[date]["conversions"]
            cost = base_cost * daily_variance
            revenue = conversions * base_revenue_per_conversion * trend_factor * daily_variance
            roi = (revenue - cost) / cost * 100 if cost > 0 else 0
            
            roi_data[date] = {
                "cost": round(cost, 2),
                "revenue": round(revenue, 2),
                "roi": round(roi, 2)
            }
        
        return {
            "engagement": engagement_data,
            "conversion": conversion_data,
            "roi": roi_data
        }
    
    def _predict_engagement_metrics(self, content_id: str, historical_data: Dict[str, Any],
                                  time_horizon: int) -> Dict[str, Any]:
        """Predict future engagement metrics based on historical data."""
        # TODO: Implement actual prediction algorithm
        # Mock implementation for testing
        
        engagement_history = historical_data.get("engagement", {})
        if not engagement_history:
            return {"error": "Insufficient historical data"}
        
        # Extract time series data
        dates = sorted(engagement_history.keys())
        impressions = [engagement_history[date]["impressions"] for date in dates]
        engagements = [engagement_history[date]["engagements"] for date in dates]
        rates = [engagement_history[date]["engagement_rate"] for date in dates]
        
        # Simple trend analysis (linear regression would be used in a real implementation)
        if len(impressions) >= 2:
            impression_change = (impressions[-1] - impressions[0]) / len(impressions)
            engagement_change = (engagements[-1] - engagements[0]) / len(engagements)
            rate_change = (rates[-1] - rates[0]) / len(rates)
        else:
            impression_change = 0
            engagement_change = 0
            rate_change = 0
        
        # Generate predictions
        prediction_dates = [(datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(1, time_horizon + 1)]
        
        predicted_metrics = {}
        last_impression = impressions[-1]
        last_engagement = engagements[-1]
        last_rate = rates[-1]
        
        for date in prediction_dates:
            day_index = prediction_dates.index(date) + 1
            
            # Predict with trend and some randomness
            variance = random.uniform(0.9, 1.1)
            predicted_impression = max(0, int((last_impression + impression_change * day_index) * variance))
            predicted_rate = max(0, (last_rate + rate_change * day_index) * variance)
            predicted_engagement = max(0, int((last_engagement + engagement_change * day_index) * variance))
            
            predicted_metrics[date] = {
                "impressions": predicted_impression,
                "engagements": predicted_engagement,
                "engagement_rate": round(predicted_rate, 2)
            }
        
        # Generate confidence intervals and trend analysis
        avg_rate = sum(rates) / len(rates)
        rate_std_dev = (sum((x - avg_rate) ** 2 for x in rates) / len(rates)) ** 0.5
        
        trend_direction = "increasing" if rate_change > 0 else "decreasing" if rate_change < 0 else "stable"
        confidence_level = "high" if rate_std_dev < 0.5 else "medium" if rate_std_dev < 1.0 else "low"
        
        return {
            "predicted_metrics": predicted_metrics,
            "trend": {
                "direction": trend_direction,
                "rate_of_change": round(rate_change * 30, 2),  # Monthly change
                "confidence": confidence_level
            },
            "summary": {
                "current_engagement_rate": round(last_rate, 2),
                "predicted_engagement_rate": round(predicted_metrics[prediction_dates[-1]]["engagement_rate"], 2),
                "percent_change": round((predicted_metrics[prediction_dates[-1]]["engagement_rate"] - last_rate) / last_rate * 100, 2) if last_rate > 0 else 0
            }
        }
    
    def _predict_conversion_metrics(self, content_id: str, historical_data: Dict[str, Any],
                                  time_horizon: int) -> Dict[str, Any]:
        """Predict future conversion metrics based on historical data."""
        # TODO: Implement actual prediction algorithm
        # Mock implementation for testing
        
        conversion_history = historical_data.get("conversion", {})
        if not conversion_history:
            return {"error": "Insufficient historical data"}
        
        # Extract time series data
        dates = sorted(conversion_history.keys())
        clicks = [conversion_history[date]["clicks"] for date in dates]
        conversions = [conversion_history[date]["conversions"] for date in dates]
        rates = [conversion_history[date]["conversion_rate"] for date in dates]
        
        # Simple trend analysis
        if len(clicks) >= 2:
            click_change = (clicks[-1] - clicks[0]) / len(clicks)
            conversion_change = (conversions[-1] - conversions[0]) / len(conversions)
            rate_change = (rates[-1] - rates[0]) / len(rates)
        else:
            click_change = 0
            conversion_change = 0
            rate_change = 0
        
        # Generate predictions
        prediction_dates = [(datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(1, time_horizon + 1)]
        
        predicted_metrics = {}
        last_click = clicks[-1]
        last_conversion = conversions[-1]
        last_rate = rates[-1]
        
        for date in prediction_dates:
            day_index = prediction_dates.index(date) + 1
            
            # Predict with trend and some randomness
            variance = random.uniform(0.9, 1.1)
            predicted_click = max(0, int((last_click + click_change * day_index) * variance))
            predicted_rate = max(0, (last_rate + rate_change * day_index) * variance)
            predicted_conversion = max(0, int((last_conversion + conversion_change * day_index) * variance))
            
            predicted_metrics[date] = {
                "clicks": predicted_click,
                "conversions": predicted_conversion,
                "conversion_rate": round(predicted_rate, 2)
            }
        
        # Generate confidence intervals and trend analysis
        avg_rate = sum(rates) / len(rates)
        rate_std_dev = (sum((x - avg_rate) ** 2 for x in rates) / len(rates)) ** 0.5
        
        trend_direction = "increasing" if rate_change > 0 else "decreasing" if rate_change < 0 else "stable"
        confidence_level = "high" if rate_std_dev < 0.5 else "medium" if rate_std_dev < 1.0 else "low"
        
        # Predict total conversions over time horizon
        total_predicted_conversions = sum(predicted_metrics[date]["conversions"] for date in prediction_dates)
        
        return {
            "predicted_metrics": predicted_metrics,
            "trend": {
                "direction": trend_direction,
                "rate_of_change": round(rate_change * 30, 2),  # Monthly change
                "confidence": confidence_level
            },
            "summary": {
                "current_conversion_rate": round(last_rate, 2),
                "predicted_conversion_rate": round(predicted_metrics[prediction_dates[-1]]["conversion_rate"], 2),
                "total_predicted_conversions": total_predicted_conversions,
                "percent_change": round((predicted_metrics[prediction_dates[-1]]["conversion_rate"] - last_rate) / last_rate * 100, 2) if last_rate > 0 else 0
            }
        }
    
    def _predict_roi_metrics(self, content_id: str, historical_data: Dict[str, Any],
                           time_horizon: int) -> Dict[str, Any]:
        """Predict future ROI metrics based on historical data."""
        # TODO: Implement actual prediction algorithm
        # Mock implementation for testing
        
        roi_history = historical_data.get("roi", {})
        if not roi_history:
            return {"error": "Insufficient historical data"}
        
        # Extract time series data
        dates = sorted(roi_history.keys())
        costs = [roi_history[date]["cost"] for date in dates]
        revenues = [roi_history[date]["revenue"] for date in dates]
        rois = [roi_history[date]["roi"] for date in dates]
        
        # Simple trend analysis
        if len(costs) >= 2:
            cost_change = (costs[-1] - costs[0]) / len(costs)
            revenue_change = (revenues[-1] - revenues[0]) / len(revenues)
            roi_change = (rois[-1] - rois[0]) / len(rois)
        else:
            cost_change = 0
            revenue_change = 0
            roi_change = 0
        
        # Generate predictions
        prediction_dates = [(datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(1, time_horizon + 1)]
        
        predicted_metrics = {}
        last_cost = costs[-1]
        last_revenue = revenues[-1]
        last_roi = rois[-1]
        
        for date in prediction_dates:
            day_index = prediction_dates.index(date) + 1
            
            # Predict with trend and some randomness
            variance = random.uniform(0.95, 1.05)
            predicted_cost = max(0, (last_cost + cost_change * day_index) * variance)
            predicted_revenue = max(0, (last_revenue + revenue_change * day_index) * variance)
            predicted_roi = (predicted_revenue - predicted_cost) / predicted_cost * 100 if predicted_cost > 0 else 0
            
            predicted_metrics[date] = {
                "cost": round(predicted_cost, 2),
                "revenue": round(predicted_revenue, 2),
                "roi": round(predicted_roi, 2)
            }
        
        # Generate confidence intervals and trend analysis
        avg_roi = sum(rois) / len(rois)
        roi_std_dev = (sum((x - avg_roi) ** 2 for x in rois) / len(rois)) ** 0.5
        
        trend_direction = "increasing" if roi_change > 0 else "decreasing" if roi_change < 0 else "stable"
        confidence_level = "high" if roi_std_dev < 10 else "medium" if roi_std_dev < 20 else "low"
        
        # Calculate cumulative metrics
        total_predicted_cost = sum(predicted_metrics[date]["cost"] for date in prediction_dates)
        total_predicted_revenue = sum(predicted_metrics[date]["revenue"] for date in prediction_dates)
        overall_predicted_roi = (total_predicted_revenue - total_predicted_cost) / total_predicted_cost * 100 if total_predicted_cost > 0 else 0
        
        return {
            "predicted_metrics": predicted_metrics,
            "trend": {
                "direction": trend_direction,
                "rate_of_change": round(roi_change * 30, 2),  # Monthly change
                "confidence": confidence_level
            },
            "summary": {
                "current_roi": round(last_roi, 2),
                "predicted_roi": round(predicted_metrics[prediction_dates[-1]]["roi"], 2),
                "cumulative_cost": round(total_predicted_cost, 2),
                "cumulative_revenue": round(total_predicted_revenue, 2),
                "overall_roi": round(overall_predicted_roi, 2),
                "percent_change": round((predicted_metrics[prediction_dates[-1]]["roi"] - last_roi) / last_roi * 100, 2) if last_roi > 0 else 0
            }
        }
    
    def _generate_predictive_recommendations(self, predictions: Dict[str, Dict[str, Any]], 
                                          brand_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Generate strategic recommendations based on predictive analytics."""
        recommendations = []
        
        # Analyze content performance predictions
        declining_engagement = []
        high_conversion = []
        negative_roi = []
        
        for content_id, prediction in predictions.items():
            # Check engagement trends
            if "engagement" in prediction and "trend" in prediction["engagement"]:
                engagement_trend = prediction["engagement"]["trend"]
                if engagement_trend["direction"] == "decreasing" and engagement_trend["confidence"] != "low":
                    declining_engagement.append({
                        "content_id": content_id,
                        "rate_of_change": engagement_trend["rate_of_change"]
                    })
            
            # Check conversion performance
            if "conversion" in prediction and "summary" in prediction["conversion"]:
                conversion_summary = prediction["conversion"]["summary"]
                if conversion_summary.get("predicted_conversion_rate", 0) > 5.0:  # Good conversion rate
                    high_conversion.append({
                        "content_id": content_id,
                        "predicted_rate": conversion_summary["predicted_conversion_rate"]
                    })
            
            # Check ROI trends
            if "roi" in prediction and "summary" in prediction["roi"]:
                roi_summary = prediction["roi"]["summary"]
                if roi_summary.get("overall_roi", 0) < 0:  # Negative ROI
                    negative_roi.append({
                        "content_id": content_id,
                        "predicted_roi": roi_summary["overall_roi"]
                    })
        
        # Generate content-specific recommendations
        if declining_engagement:
            recommendations.append({
                "type": "content_refresh",
                "priority": "high",
                "message": f"Refresh content for {len(declining_engagement)} items with declining engagement",
                "details": "Update headlines, visuals, or add new content sections to reinvigorate engagement"
            })
        
        if high_conversion:
            recommendations.append({
                "type": "content_amplification",
                "priority": "high",
                "message": f"Increase promotion for {len(high_conversion)} high-converting content items",
                "details": "Allocate additional budget to these high-performing items to maximize conversion volume"
            })
        
        if negative_roi:
            recommendations.append({
                "type": "campaign_optimization",
                "priority": "critical",
                "message": f"Pause or optimize campaigns for {len(negative_roi)} items with negative ROI",
                "details": "Reduce spend, test new targeting, or improve landing pages to improve campaign efficiency"
            })
        
        # Overall strategy recommendations
        all_engagement_trends = [
            prediction.get("engagement", {}).get("trend", {}).get("direction") 
            for prediction in predictions.values() 
            if "engagement" in prediction and "trend" in prediction["engagement"]
        ]
        
        if all_engagement_trends and all_engagement_trends.count("decreasing") > len(all_engagement_trends) / 2:
            recommendations.append({
                "type": "content_strategy_pivot",
                "priority": "medium",
                "message": "Consider a content strategy pivot due to declining engagement trends",
                "details": "Test new content formats, topics, or distribution channels to revitalize audience interest"
            })
        
        # Channel-specific recommendations
        recommendations.append({
            "type": "channel_optimization",
            "priority": "medium",
            "message": "Optimize channel mix based on predicted performance",
            "details": "Shift budget allocation to higher-performing channels and content types"
        })
        
        # Add recommendations timeframe
        for recommendation in recommendations:
            recommendation["timeframe"] = "30 days"
        
        return recommendations
    
    def _record_audit_trail(self, action: str, user_id: Any, details: Dict[str, Any]):
        """Record an audit trail entry."""
        # TODO: Implement actual audit trail recording in database
        logger.info(f"AUDIT: {action} by user {user_id} - {details}")