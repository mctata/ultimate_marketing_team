"""LinkedIn Integration Module.

This module provides enhanced integration with LinkedIn's company pages,
supporting content publishing, scheduling, and performance tracking.
"""

import logging
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime
import time
import json
import re
import io

from src.agents.integrations.social_integration import SocialMediaIntegration, IntegrationError

logger = logging.getLogger(__name__)

class LinkedInCompanyIntegration(SocialMediaIntegration):
    """LinkedIn company page integration using the LinkedIn API."""
    
    def __init__(self, credentials: Dict[str, Any]):
        """Initialize the LinkedIn company integration.
        
        Args:
            credentials: LinkedIn authentication credentials
        """
        super().__init__("linkedin", credentials)
        self.api_url = "https://api.linkedin.com/v2"
        self.organization_id = credentials.get('organization_id')
        self.company_id = credentials.get('company_id')
        self.page_id = credentials.get('page_id') or self.organization_id or self.company_id
    
    def _get_organization_urn(self) -> Optional[str]:
        """Get LinkedIn organization URN.
        
        Returns:
            LinkedIn organization URN if found, None otherwise
        """
        if not self.page_id:
            return None
        
        # If it's already in URN format, return it
        if self.page_id.startswith("urn:li:organization:"):
            return self.page_id
        
        # Otherwise, convert it to URN format
        return f"urn:li:organization:{self.page_id}"
    
    def _create_image_share(self, image_url: str, title: Optional[str] = None) -> Optional[str]:
        """Upload and register an image for sharing on LinkedIn.
        
        Args:
            image_url: URL of the image to upload
            title: Optional title for the image
            
        Returns:
            LinkedIn image asset URN if successful, None otherwise
        """
        try:
            # Download the image
            response = requests.get(image_url, stream=True)
            if response.status_code != 200:
                logger.error(f"Failed to download image: {response.status_code}")
                return None
            
            # Get image data
            image_data = response.content
            
            # Step 1: Register the image upload
            register_headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            register_data = {
                "registerUploadRequest": {
                    "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                    "owner": self._get_organization_urn(),
                    "serviceRelationships": [
                        {
                            "relationshipType": "OWNER",
                            "identifier": "urn:li:userGeneratedContent"
                        }
                    ]
                }
            }
            
            register_response = requests.post(
                f"{self.api_url}/assets?action=registerUpload",
                headers=register_headers,
                json=register_data
            )
            
            if register_response.status_code != 200:
                logger.error(f"Failed to register image upload: {register_response.status_code} - {register_response.text}")
                return None
            
            register_data = register_response.json()
            
            # Extract upload URL and asset URN
            if "value" not in register_data or "uploadMechanism" not in register_data["value"]:
                logger.error("Invalid response from LinkedIn image registration")
                return None
            
            upload_url = register_data["value"]["uploadMechanism"]["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]["uploadUrl"]
            asset_urn = register_data["value"]["asset"]
            
            # Step 2: Upload the image
            upload_headers = {
                "Authorization": f"Bearer {self.access_token}"
            }
            
            upload_response = requests.put(
                upload_url,
                headers=upload_headers,
                data=image_data
            )
            
            if upload_response.status_code not in (200, 201):
                logger.error(f"Failed to upload image: {upload_response.status_code} - {upload_response.text}")
                return None
            
            return asset_urn
        except Exception as e:
            logger.error(f"Error creating image share: {e}")
            return None
    
    def _create_article_share(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create an article share on LinkedIn.
        
        Args:
            content_data: Content data including text, title, link_url, etc.
            
        Returns:
            Dict containing the article share data
        """
        article_share = {
            "shareCommentary": {
                "text": content_data.get("content", "")
            },
            "shareMediaCategory": "ARTICLE",
            "media": [
                {
                    "status": "READY",
                    "originalUrl": content_data["link_url"]
                }
            ]
        }
        
        # Add title if provided
        if content_data.get("title"):
            article_share["media"][0]["title"] = {
                "text": content_data["title"]
            }
        
        # Add description if provided
        if content_data.get("description") or content_data.get("meta_description"):
            description = content_data.get("description") or content_data.get("meta_description")
            article_share["media"][0]["description"] = {
                "text": description
            }
        
        # Add thumbnail if provided
        if content_data.get("image_url"):
            image_urn = self._create_image_share(content_data["image_url"])
            if image_urn:
                article_share["media"][0]["thumbnails"] = [
                    {
                        "image": image_urn
                    }
                ]
        
        return article_share
    
    def _create_image_share_content(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create an image share on LinkedIn.
        
        Args:
            content_data: Content data including text, image_url, etc.
            
        Returns:
            Dict containing the image share data
        """
        # Upload the image
        image_urn = self._create_image_share(content_data["image_url"], content_data.get("title"))
        if not image_urn:
            raise IntegrationError("Failed to upload image to LinkedIn")
        
        image_share = {
            "shareCommentary": {
                "text": content_data.get("content", "")
            },
            "shareMediaCategory": "IMAGE",
            "media": [
                {
                    "status": "READY",
                    "media": image_urn
                }
            ]
        }
        
        # Add title if provided
        if content_data.get("title"):
            image_share["media"][0]["title"] = {
                "text": content_data["title"]
            }
        
        # Add description if provided
        if content_data.get("description") or content_data.get("meta_description"):
            description = content_data.get("description") or content_data.get("meta_description")
            image_share["media"][0]["description"] = {
                "text": description
            }
        
        return image_share
    
    def post_content(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Post content to LinkedIn company page.
        
        Args:
            content_data: Content data including text, image_url, link_url, etc.
            
        Returns:
            Dict containing posting result
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token'])
        if credentials_check:
            return credentials_check
        
        # Ensure we have an organization ID
        if not self._get_organization_urn():
            return self.format_error_response(
                "Missing LinkedIn organization ID. Please provide organization_id, company_id, or page_id in credentials."
            )
        
        def execute_request():
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            organization_urn = self._get_organization_urn()
            
            # Prepare share content based on what's provided
            if content_data.get("link_url"):
                # Article share
                share_content = self._create_article_share(content_data)
            elif content_data.get("image_url"):
                # Image share
                share_content = self._create_image_share_content(content_data)
            else:
                # Text-only share
                share_content = {
                    "shareCommentary": {
                        "text": content_data.get("content", "")
                    },
                    "shareMediaCategory": "NONE"
                }
            
            # Prepare post data
            post_data = {
                "author": organization_urn,
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": share_content
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }
            
            # Send the request
            response = requests.post(
                f"{self.api_url}/ugcPosts",
                headers=headers,
                json=post_data
            )
            
            if response.status_code in (200, 201):
                post_id = response.headers.get('x-restli-id') or response.json().get("id")
                
                # Try to get the post URL
                post_url = None
                try:
                    # Extract organization ID from URN
                    org_id = organization_urn.split(':')[-1]
                    post_url = f"https://www.linkedin.com/company/{org_id}/posts/{post_id.split(':')[-1]}"
                except:
                    pass
                
                return self.format_success_response(
                    platform_content_id=post_id,
                    publish_time=datetime.now().isoformat(),
                    url=post_url
                )
            else:
                raise IntegrationError(f"LinkedIn API Error: {response.status_code} - {response.text}")
        
        return self.safe_request(
            execute_request,
            "Error posting to LinkedIn company page"
        )
    
    def schedule_content(self, content_data: Dict[str, Any], publish_time: str) -> Dict[str, Any]:
        """Schedule content for future posting on LinkedIn.
        
        Note: LinkedIn's API doesn't directly support scheduling, so we
        return information for the scheduler to handle it internally.
        
        Args:
            content_data: Content data including text, image_url, link_url, etc.
            publish_time: ISO format datetime for scheduled publishing
            
        Returns:
            Dict containing scheduling result
        """
        # LinkedIn doesn't support native scheduling via API,
        # so we'll return scheduling metadata for internal scheduler
        return self.format_success_response(
            platform="linkedin",
            organization_id=self.page_id,
            content_data=content_data,
            scheduled_time=publish_time,
            message="Content scheduled for publication via internal scheduler",
            note="LinkedIn API doesn't support native scheduling, this content will be stored and published at the requested time"
        )
    
    def get_content_status(self, content_id: str) -> Dict[str, Any]:
        """Get LinkedIn post status.
        
        Args:
            content_id: LinkedIn post ID (URN)
            
        Returns:
            Dict containing post status information
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token'])
        if credentials_check:
            return credentials_check
        
        def execute_request():
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            # Get post details
            post_response = requests.get(
                f"{self.api_url}/ugcPosts/{content_id}",
                headers=headers
            )
            
            if post_response.status_code != 200:
                raise IntegrationError(f"LinkedIn API Error: {post_response.status_code} - {post_response.text}")
            
            post_data = post_response.json()
            
            # Try to get social metrics
            metrics = {}
            try:
                metrics_response = requests.get(
                    f"{self.api_url}/socialActions/{content_id}",
                    headers=headers
                )
                
                if metrics_response.status_code == 200:
                    metrics_data = metrics_response.json()
                    
                    if "results" in metrics_data and content_id in metrics_data["results"]:
                        action_data = metrics_data["results"][content_id]
                        
                        if "commentSummary" in action_data:
                            metrics["comments"] = action_data["commentSummary"]["count"]
                        
                        if "likeSummary" in action_data:
                            metrics["likes"] = action_data["likeSummary"]["count"]
                            
                        if "sharesSummary" in action_data:
                            metrics["shares"] = action_data["sharesSummary"]["count"]
            except Exception as e:
                logger.warning(f"Error getting LinkedIn post metrics: {e}")
            
            # Get post URL
            post_url = None
            try:
                # Extract organization and post ID from URN
                parts = content_id.split(':')
                if len(parts) >= 4:
                    org_urn = post_data.get("author", "")
                    org_id = org_urn.split(':')[-1]
                    post_id = parts[-1]
                    post_url = f"https://www.linkedin.com/company/{org_id}/posts/{post_id}"
            except:
                pass
            
            return self.format_success_response(
                platform_content_id=content_id,
                content_status="published",
                publish_time=post_data.get("created", {}).get("time"),
                url=post_url,
                metrics=metrics
            )
        
        return self.safe_request(
            execute_request,
            "Error getting LinkedIn post status"
        )
    
    def delete_content(self, content_id: str) -> Dict[str, Any]:
        """Delete LinkedIn post.
        
        Args:
            content_id: LinkedIn post ID (URN)
            
        Returns:
            Dict containing deletion result
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token'])
        if credentials_check:
            return credentials_check
        
        def execute_request():
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            response = requests.delete(
                f"{self.api_url}/ugcPosts/{content_id}",
                headers=headers
            )
            
            if response.status_code in (200, 204):
                return self.format_success_response(
                    platform_content_id=content_id,
                    message="Post deleted successfully"
                )
            else:
                raise IntegrationError(f"LinkedIn API Error: {response.status_code} - {response.text}")
        
        return self.safe_request(
            execute_request,
            "Error deleting LinkedIn post"
        )
    
    def get_company_page_info(self) -> Dict[str, Any]:
        """Get LinkedIn company page information.
        
        Returns:
            Dict containing company page information
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token'])
        if credentials_check:
            return credentials_check
        
        # Ensure we have an organization ID
        if not self._get_organization_urn():
            return self.format_error_response(
                "Missing LinkedIn organization ID. Please provide organization_id, company_id, or page_id in credentials."
            )
        
        def execute_request():
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            organization_id = self._get_organization_urn().split(':')[-1]
            
            response = requests.get(
                f"{self.api_url}/organizations/{organization_id}",
                headers=headers
            )
            
            if response.status_code != 200:
                raise IntegrationError(f"LinkedIn API Error: {response.status_code} - {response.text}")
            
            org_data = response.json()
            
            # Try to get follower statistics
            follower_count = None
            try:
                follower_response = requests.get(
                    f"{self.api_url}/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity={self._get_organization_urn()}",
                    headers=headers
                )
                
                if follower_response.status_code == 200:
                    follower_data = follower_response.json()
                    if "elements" in follower_data and len(follower_data["elements"]) > 0:
                        follower_count = follower_data["elements"][0].get("totalFollowerCount")
            except Exception as e:
                logger.warning(f"Error getting LinkedIn follower statistics: {e}")
            
            page_info = {
                "id": organization_id,
                "urn": self._get_organization_urn(),
                "name": org_data.get("localizedName"),
                "description": org_data.get("localizedDescription"),
                "website": org_data.get("localizedWebsite"),
                "industry": org_data.get("localizedIndustry"),
                "logo_url": org_data.get("logoV2", {}).get("original", ""),
                "follower_count": follower_count
            }
            
            return self.format_success_response(
                platform_content_id=organization_id,
                page_info=page_info,
                url=f"https://www.linkedin.com/company/{organization_id}"
            )
        
        return self.safe_request(
            execute_request,
            "Error getting LinkedIn company page information"
        )
    
    def get_page_analytics(self, time_range: str = "MONTH") -> Dict[str, Any]:
        """Get LinkedIn company page analytics.
        
        Args:
            time_range: Time range for analytics (DAY, WEEK, MONTH, YEAR)
            
        Returns:
            Dict containing company page analytics
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token'])
        if credentials_check:
            return credentials_check
        
        # Ensure we have an organization ID
        if not self._get_organization_urn():
            return self.format_error_response(
                "Missing LinkedIn organization ID. Please provide organization_id, company_id, or page_id in credentials."
            )
        
        def execute_request():
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            # Get page statistics
            stats_response = requests.get(
                f"{self.api_url}/organizationPageStatistics?q=organization&organization={self._get_organization_urn()}&timeIntervals.timeGranularityType={time_range}&timeIntervals.timeRange.start=0",
                headers=headers
            )
            
            if stats_response.status_code != 200:
                raise IntegrationError(f"LinkedIn API Error: {stats_response.status_code} - {stats_response.text}")
            
            stats_data = stats_response.json()
            
            # Format analytics data
            analytics = {}
            if "elements" in stats_data and len(stats_data["elements"]) > 0:
                page_stats = stats_data["elements"][0]
                
                # Total page views
                if "totalPageStatistics" in page_stats:
                    analytics["total_page_views"] = page_stats["totalPageStatistics"].get("views", {}).get("pageViews")
                
                # Total page clicks
                if "totalPageStatistics" in page_stats:
                    analytics["total_page_clicks"] = page_stats["totalPageStatistics"].get("clicks", {}).get("totalClicks")
                
                # Visitor demographics
                if "pageVisitsByIndustry" in page_stats:
                    analytics["visitors_by_industry"] = [
                        {"industry": item.get("industry"), "count": item.get("pageViews")}
                        for item in page_stats.get("pageVisitsByIndustry", {}).get("elements", [])
                    ]
                
                if "pageVisitsByRegion" in page_stats:
                    analytics["visitors_by_region"] = [
                        {"region": item.get("region"), "count": item.get("pageViews")}
                        for item in page_stats.get("pageVisitsByRegion", {}).get("elements", [])
                    ]
                
                if "pageVisitsByFunction" in page_stats:
                    analytics["visitors_by_function"] = [
                        {"function": item.get("function"), "count": item.get("pageViews")}
                        for item in page_stats.get("pageVisitsByFunction", {}).get("elements", [])
                    ]
            
            # Get follower statistics
            try:
                follower_response = requests.get(
                    f"{self.api_url}/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity={self._get_organization_urn()}",
                    headers=headers
                )
                
                if follower_response.status_code == 200:
                    follower_data = follower_response.json()
                    if "elements" in follower_data and len(follower_data["elements"]) > 0:
                        follower_stats = follower_data["elements"][0]
                        analytics["total_followers"] = follower_stats.get("totalFollowerCount")
                        analytics["follower_gain"] = follower_stats.get("followerGains", {}).get("organicFollowerGain")
                        
                        # Follower demographics
                        if "followerCountsByIndustry" in follower_stats:
                            analytics["followers_by_industry"] = [
                                {"industry": item.get("industry"), "count": item.get("followerCounts", {}).get("organicFollowerCount")}
                                for item in follower_stats.get("followerCountsByIndustry", {}).get("elements", [])
                            ]
                        
                        if "followerCountsByRegion" in follower_stats:
                            analytics["followers_by_region"] = [
                                {"region": item.get("region"), "count": item.get("followerCounts", {}).get("organicFollowerCount")}
                                for item in follower_stats.get("followerCountsByRegion", {}).get("elements", [])
                            ]
                        
                        if "followerCountsBySeniority" in follower_stats:
                            analytics["followers_by_seniority"] = [
                                {"seniority": item.get("seniority"), "count": item.get("followerCounts", {}).get("organicFollowerCount")}
                                for item in follower_stats.get("followerCountsBySeniority", {}).get("elements", [])
                            ]
            except Exception as e:
                logger.warning(f"Error getting LinkedIn follower analytics: {e}")
            
            return self.format_success_response(
                platform_content_id=self._get_organization_urn(),
                time_range=time_range,
                analytics=analytics
            )
        
        return self.safe_request(
            execute_request,
            "Error getting LinkedIn company page analytics"
        )
    
    def check_health(self) -> Dict[str, Any]:
        """Check LinkedIn API health.
        
        Returns:
            Dict containing health status information
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token'])
        if credentials_check:
            return {
                "status": "unhealthy",
                "platform": self.platform,
                "error": "Missing access token",
                "timestamp": datetime.now().isoformat()
            }
        
        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            response, response_time = self.measure_response_time(
                requests.get,
                f"{self.api_url}/me",
                headers=headers
            )
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "platform": self.platform,
                    "response_time_ms": response_time,
                    "details": "API is responding normally",
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "status": "unhealthy",
                    "platform": self.platform,
                    "response_time_ms": response_time,
                    "error": f"API Error: {response.status_code}",
                    "details": response.text,
                    "timestamp": datetime.now().isoformat()
                }
        except Exception as e:
            logger.error(f"Error checking {self.platform} API health: {e}")
            return {
                "status": "unhealthy",
                "platform": self.platform,
                "error": str(e),
                "details": "Exception while checking API health",
                "timestamp": datetime.now().isoformat()
            }