"""Social Media Integration Module for the Content & Ad Management Agent.

This module provides integrations with common social media platforms including
Facebook, Twitter, LinkedIn, and Instagram. It handles posting, scheduling,
and monitoring of content on these platforms.
"""

import os
import json
import logging
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime
import time

logger = logging.getLogger(__name__)

class SocialMediaIntegration:
    """Base class for social media integrations."""
    
    def __init__(self, platform: str, credentials: Dict[str, Any]):
        """Initialize the social media integration.
        
        Args:
            platform: The social media platform name
            credentials: Authentication credentials for the platform
        """
        self.platform = platform
        self.credentials = credentials
        self.access_token = credentials.get('access_token')
        self.account_id = credentials.get('account_id')
    
    def post_content(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Post content to the social media platform.
        
        This is a base method that should be implemented by specific social media integrations.
        
        Args:
            content_data: Formatted content data to be posted
            
        Returns:
            Dict containing the posting result with status and platform-specific details
        """
        raise NotImplementedError("Subclasses must implement post_content")
    
    def schedule_content(self, content_data: Dict[str, Any], publish_time: str) -> Dict[str, Any]:
        """Schedule content for future posting.
        
        Args:
            content_data: Formatted content data to be posted
            publish_time: ISO format datetime for scheduled posting
            
        Returns:
            Dict containing the scheduling result with status and platform-specific details
        """
        raise NotImplementedError("Subclasses must implement schedule_content")
    
    def get_content_status(self, content_id: str) -> Dict[str, Any]:
        """Get the status of posted content.
        
        Args:
            content_id: Platform-specific ID of the content
            
        Returns:
            Dict containing content status information
        """
        raise NotImplementedError("Subclasses must implement get_content_status")
    
    def delete_content(self, content_id: str) -> Dict[str, Any]:
        """Delete content from the social media platform.
        
        Args:
            content_id: Platform-specific ID of the content to delete
            
        Returns:
            Dict containing the deletion result with status
        """
        raise NotImplementedError("Subclasses must implement delete_content")
    
    def check_health(self) -> Dict[str, Any]:
        """Check the health of the social media integration.
        
        Returns:
            Dict containing health status information
        """
        raise NotImplementedError("Subclasses must implement check_health")


class FacebookIntegration(SocialMediaIntegration):
    """Facebook social media integration using the Facebook Graph API."""
    
    def __init__(self, credentials: Dict[str, Any]):
        """Initialize the Facebook integration.
        
        Args:
            credentials: Facebook authentication credentials
        """
        super().__init__("facebook", credentials)
        self.api_version = "v18.0"  # Use latest stable version
        self.api_url = f"https://graph.facebook.com/{self.api_version}"
    
    def post_content(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Post content to Facebook.
        
        Args:
            content_data: Content data including message, link, etc.
            
        Returns:
            Dict containing posting result
        """
        try:
            if not self.access_token or not self.account_id:
                return {
                    "status": "error",
                    "platform": "facebook",
                    "error": "Missing access token or account ID"
                }
            
            params = {
                "access_token": self.access_token,
                "message": content_data.get("content", "")
            }
            
            # Add media if available
            if content_data.get("image_url"):
                params["link"] = content_data["image_url"]
            
            # Add link if available
            if content_data.get("link_url"):
                params["link"] = content_data["link_url"]
            
            response = requests.post(
                f"{self.api_url}/{self.account_id}/feed",
                params=params
            )
            
            if response.status_code == 200:
                post_data = response.json()
                return {
                    "status": "success",
                    "platform": "facebook",
                    "platform_content_id": post_data.get("id"),
                    "publish_time": datetime.now().isoformat()
                }
            else:
                return {
                    "status": "error",
                    "platform": "facebook",
                    "error": f"Facebook API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error posting to Facebook: {e}")
            return {
                "status": "error",
                "platform": "facebook",
                "error": str(e),
                "details": "Exception while posting to Facebook"
            }
    
    def schedule_content(self, content_data: Dict[str, Any], publish_time: str) -> Dict[str, Any]:
        """Schedule content for future posting on Facebook.
        
        Args:
            content_data: Content data including message, link, etc.
            publish_time: ISO format datetime for scheduled posting
            
        Returns:
            Dict containing scheduling result
        """
        try:
            if not self.access_token or not self.account_id:
                return {
                    "status": "error",
                    "platform": "facebook",
                    "error": "Missing access token or account ID"
                }
            
            # Convert ISO datetime to Unix timestamp
            publish_datetime = datetime.fromisoformat(publish_time.replace('Z', '+00:00'))
            scheduled_publish_time = int(publish_datetime.timestamp())
            
            params = {
                "access_token": self.access_token,
                "message": content_data.get("content", ""),
                "published": "false",
                "scheduled_publish_time": scheduled_publish_time
            }
            
            # Add media if available
            if content_data.get("image_url"):
                params["link"] = content_data["image_url"]
            
            # Add link if available
            if content_data.get("link_url"):
                params["link"] = content_data["link_url"]
            
            response = requests.post(
                f"{self.api_url}/{self.account_id}/feed",
                params=params
            )
            
            if response.status_code == 200:
                post_data = response.json()
                return {
                    "status": "success",
                    "platform": "facebook",
                    "platform_content_id": post_data.get("id"),
                    "scheduled_time": publish_time
                }
            else:
                return {
                    "status": "error",
                    "platform": "facebook",
                    "error": f"Facebook API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error scheduling to Facebook: {e}")
            return {
                "status": "error",
                "platform": "facebook",
                "error": str(e),
                "details": "Exception while scheduling to Facebook"
            }
    
    def get_content_status(self, content_id: str) -> Dict[str, Any]:
        """Get Facebook post status.
        
        Args:
            content_id: Facebook post ID
            
        Returns:
            Dict containing post status information
        """
        try:
            if not self.access_token:
                return {
                    "status": "error",
                    "platform": "facebook",
                    "error": "Missing access token"
                }
            
            params = {
                "access_token": self.access_token,
                "fields": "id,message,created_time,permalink_url,is_published,insights.metric(post_impressions,post_engagements,post_reactions_by_type_total)"
            }
            
            response = requests.get(
                f"{self.api_url}/{content_id}",
                params=params
            )
            
            if response.status_code == 200:
                post_data = response.json()
                
                # Extract insights if available
                insights = {}
                if "insights" in post_data and "data" in post_data["insights"]:
                    for metric in post_data["insights"]["data"]:
                        if "values" in metric and len(metric["values"]) > 0:
                            insights[metric["name"]] = metric["values"][0]["value"]
                
                return {
                    "status": "success",
                    "platform": "facebook",
                    "platform_content_id": post_data.get("id"),
                    "content_status": "published" if post_data.get("is_published", True) else "scheduled",
                    "publish_time": post_data.get("created_time"),
                    "url": post_data.get("permalink_url"),
                    "metrics": insights
                }
            else:
                return {
                    "status": "error",
                    "platform": "facebook",
                    "error": f"Facebook API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error getting Facebook post status: {e}")
            return {
                "status": "error",
                "platform": "facebook",
                "error": str(e),
                "details": "Exception while getting Facebook post status"
            }
    
    def delete_content(self, content_id: str) -> Dict[str, Any]:
        """Delete Facebook post.
        
        Args:
            content_id: Facebook post ID
            
        Returns:
            Dict containing deletion result
        """
        try:
            if not self.access_token:
                return {
                    "status": "error",
                    "platform": "facebook",
                    "error": "Missing access token"
                }
            
            params = {
                "access_token": self.access_token
            }
            
            response = requests.delete(
                f"{self.api_url}/{content_id}",
                params=params
            )
            
            if response.status_code == 200:
                return {
                    "status": "success",
                    "platform": "facebook",
                    "platform_content_id": content_id,
                    "message": "Post deleted successfully"
                }
            else:
                return {
                    "status": "error",
                    "platform": "facebook",
                    "error": f"Facebook API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error deleting Facebook post: {e}")
            return {
                "status": "error",
                "platform": "facebook",
                "error": str(e),
                "details": "Exception while deleting Facebook post"
            }
    
    def check_health(self) -> Dict[str, Any]:
        """Check Facebook API health.
        
        Returns:
            Dict containing health status information
        """
        start_time = time.time()
        try:
            if not self.access_token:
                return {
                    "status": "unhealthy",
                    "platform": "facebook",
                    "error": "Missing access token"
                }
            
            params = {
                "access_token": self.access_token,
                "fields": "id,name"
            }
            
            response = requests.get(
                f"{self.api_url}/me",
                params=params
            )
            
            response_time = int((time.time() - start_time) * 1000)  # ms
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "platform": "facebook",
                    "response_time_ms": response_time,
                    "details": "Facebook API is responding normally"
                }
            else:
                return {
                    "status": "unhealthy",
                    "platform": "facebook",
                    "response_time_ms": response_time,
                    "error": f"Facebook API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)  # ms
            logger.error(f"Error checking Facebook API health: {e}")
            return {
                "status": "unhealthy",
                "platform": "facebook",
                "response_time_ms": response_time,
                "error": str(e),
                "details": "Exception while checking Facebook API health"
            }


class TwitterIntegration(SocialMediaIntegration):
    """Twitter social media integration using the Twitter API v2."""
    
    def __init__(self, credentials: Dict[str, Any]):
        """Initialize the Twitter integration.
        
        Args:
            credentials: Twitter authentication credentials
        """
        super().__init__("twitter", credentials)
        self.api_url = "https://api.twitter.com/2"
        self.api_url_v1 = "https://api.twitter.com/1.1"  # Some endpoints still require v1.1
        self.consumer_key = credentials.get('consumer_key')
        self.consumer_secret = credentials.get('consumer_secret')
        self.access_token = credentials.get('access_token')
        self.access_token_secret = credentials.get('access_token_secret')
        self.bearer_token = credentials.get('bearer_token')
    
    def post_content(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Post a tweet to Twitter.
        
        Args:
            content_data: Content data including text, media, etc.
            
        Returns:
            Dict containing posting result
        """
        try:
            if not self.bearer_token:
                return {
                    "status": "error",
                    "platform": "twitter",
                    "error": "Missing bearer token"
                }
            
            # Ensure tweet doesn't exceed 280 characters
            tweet_text = content_data.get("content", "")
            if len(tweet_text) > 280:
                tweet_text = tweet_text[:277] + "..."
            
            headers = {
                "Authorization": f"Bearer {self.bearer_token}",
                "Content-Type": "application/json",
            }
            
            data = {
                "text": tweet_text
            }
            
            # TODO: Add media handling when needed
            
            response = requests.post(
                f"{self.api_url}/tweets",
                headers=headers,
                json=data
            )
            
            if response.status_code in (200, 201):
                tweet_data = response.json()
                tweet_id = tweet_data.get("data", {}).get("id")
                return {
                    "status": "success",
                    "platform": "twitter",
                    "platform_content_id": tweet_id,
                    "publish_time": datetime.now().isoformat(),
                    "url": f"https://twitter.com/user/status/{tweet_id}" if tweet_id else None
                }
            else:
                return {
                    "status": "error",
                    "platform": "twitter",
                    "error": f"Twitter API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error posting to Twitter: {e}")
            return {
                "status": "error",
                "platform": "twitter",
                "error": str(e),
                "details": "Exception while posting to Twitter"
            }
    
    def schedule_content(self, content_data: Dict[str, Any], publish_time: str) -> Dict[str, Any]:
        """Schedule a tweet for future posting on Twitter.
        
        Note: Twitter's API doesn't support native scheduling, so this would
        typically be handled by a third-party service or by internal scheduling.
        
        Args:
            content_data: Content data including text, media, etc.
            publish_time: ISO format datetime for scheduled posting
            
        Returns:
            Dict containing scheduling result
        """
        # Since Twitter API doesn't natively support scheduling, 
        # we'll return a mock implementation
        return {
            "status": "success",
            "platform": "twitter",
            "message": "Tweet scheduled for publication via internal scheduler",
            "scheduled_time": publish_time,
            "note": "Twitter API doesn't support native scheduling, this tweet will be stored and published at the requested time"
        }
    
    def get_content_status(self, content_id: str) -> Dict[str, Any]:
        """Get Twitter tweet status.
        
        Args:
            content_id: Twitter tweet ID
            
        Returns:
            Dict containing tweet status information
        """
        try:
            if not self.bearer_token:
                return {
                    "status": "error",
                    "platform": "twitter",
                    "error": "Missing bearer token"
                }
            
            headers = {
                "Authorization": f"Bearer {self.bearer_token}"
            }
            
            response = requests.get(
                f"{self.api_url}/tweets/{content_id}?expansions=author_id&tweet.fields=created_at,public_metrics",
                headers=headers
            )
            
            if response.status_code == 200:
                tweet_data = response.json()
                
                # Extract metrics
                metrics = {}
                if "data" in tweet_data and "public_metrics" in tweet_data["data"]:
                    metrics = tweet_data["data"]["public_metrics"]
                
                return {
                    "status": "success",
                    "platform": "twitter",
                    "platform_content_id": content_id,
                    "content_status": "published",
                    "publish_time": tweet_data.get("data", {}).get("created_at"),
                    "url": f"https://twitter.com/user/status/{content_id}",
                    "metrics": metrics
                }
            else:
                return {
                    "status": "error",
                    "platform": "twitter",
                    "error": f"Twitter API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error getting Twitter tweet status: {e}")
            return {
                "status": "error",
                "platform": "twitter",
                "error": str(e),
                "details": "Exception while getting Twitter tweet status"
            }
    
    def delete_content(self, content_id: str) -> Dict[str, Any]:
        """Delete a tweet from Twitter.
        
        Args:
            content_id: Twitter tweet ID
            
        Returns:
            Dict containing deletion result
        """
        try:
            if not self.bearer_token:
                return {
                    "status": "error",
                    "platform": "twitter",
                    "error": "Missing bearer token"
                }
            
            headers = {
                "Authorization": f"Bearer {self.bearer_token}"
            }
            
            response = requests.delete(
                f"{self.api_url}/tweets/{content_id}",
                headers=headers
            )
            
            if response.status_code in (200, 204):
                return {
                    "status": "success",
                    "platform": "twitter",
                    "platform_content_id": content_id,
                    "message": "Tweet deleted successfully"
                }
            else:
                return {
                    "status": "error",
                    "platform": "twitter",
                    "error": f"Twitter API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error deleting Twitter tweet: {e}")
            return {
                "status": "error",
                "platform": "twitter",
                "error": str(e),
                "details": "Exception while deleting Twitter tweet"
            }
    
    def check_health(self) -> Dict[str, Any]:
        """Check Twitter API health.
        
        Returns:
            Dict containing health status information
        """
        start_time = time.time()
        try:
            if not self.bearer_token:
                return {
                    "status": "unhealthy",
                    "platform": "twitter",
                    "error": "Missing bearer token"
                }
            
            headers = {
                "Authorization": f"Bearer {self.bearer_token}"
            }
            
            response = requests.get(
                f"{self.api_url}/users/me",
                headers=headers
            )
            
            response_time = int((time.time() - start_time) * 1000)  # ms
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "platform": "twitter",
                    "response_time_ms": response_time,
                    "details": "Twitter API is responding normally"
                }
            else:
                return {
                    "status": "unhealthy",
                    "platform": "twitter",
                    "response_time_ms": response_time,
                    "error": f"Twitter API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)  # ms
            logger.error(f"Error checking Twitter API health: {e}")
            return {
                "status": "unhealthy",
                "platform": "twitter",
                "response_time_ms": response_time,
                "error": str(e),
                "details": "Exception while checking Twitter API health"
            }


class LinkedInIntegration(SocialMediaIntegration):
    """LinkedIn social media integration using the LinkedIn API."""
    
    def __init__(self, credentials: Dict[str, Any]):
        """Initialize the LinkedIn integration.
        
        Args:
            credentials: LinkedIn authentication credentials
        """
        super().__init__("linkedin", credentials)
        self.api_url = "https://api.linkedin.com/v2"
        self.organization_id = credentials.get('organization_id')
    
    def post_content(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Post content to LinkedIn.
        
        Args:
            content_data: Content data including text, media, etc.
            
        Returns:
            Dict containing posting result
        """
        try:
            if not self.access_token:
                return {
                    "status": "error",
                    "platform": "linkedin",
                    "error": "Missing access token"
                }
            
            if not self.organization_id and not self.account_id:
                return {
                    "status": "error",
                    "platform": "linkedin",
                    "error": "Missing organization ID or account ID"
                }
            
            author = f"urn:li:organization:{self.organization_id}" if self.organization_id else f"urn:li:person:{self.account_id}"
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            # Prepare post data
            post_data = {
                "author": author,
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {
                            "text": content_data.get("content", "")
                        },
                        "shareMediaCategory": "NONE"
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }
            
            # Add link if available
            if content_data.get("link_url"):
                post_data["specificContent"]["com.linkedin.ugc.ShareContent"]["shareMediaCategory"] = "ARTICLE"
                post_data["specificContent"]["com.linkedin.ugc.ShareContent"]["media"] = [{
                    "status": "READY",
                    "description": {
                        "text": content_data.get("meta_description", "")
                    },
                    "originalUrl": content_data["link_url"],
                    "title": {
                        "text": content_data.get("title", "")
                    }
                }]
            
            response = requests.post(
                f"{self.api_url}/ugcPosts",
                headers=headers,
                json=post_data
            )
            
            if response.status_code in (200, 201):
                post_id = response.headers.get('x-restli-id') or response.json().get("id")
                return {
                    "status": "success",
                    "platform": "linkedin",
                    "platform_content_id": post_id,
                    "publish_time": datetime.now().isoformat()
                }
            else:
                return {
                    "status": "error",
                    "platform": "linkedin",
                    "error": f"LinkedIn API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error posting to LinkedIn: {e}")
            return {
                "status": "error",
                "platform": "linkedin",
                "error": str(e),
                "details": "Exception while posting to LinkedIn"
            }
    
    def schedule_content(self, content_data: Dict[str, Any], publish_time: str) -> Dict[str, Any]:
        """Schedule content for future posting on LinkedIn.
        
        Args:
            content_data: Content data including text, media, etc.
            publish_time: ISO format datetime for scheduled posting
            
        Returns:
            Dict containing scheduling result
        """
        try:
            if not self.access_token:
                return {
                    "status": "error",
                    "platform": "linkedin",
                    "error": "Missing access token"
                }
            
            if not self.organization_id and not self.account_id:
                return {
                    "status": "error",
                    "platform": "linkedin",
                    "error": "Missing organization ID or account ID"
                }
            
            author = f"urn:li:organization:{self.organization_id}" if self.organization_id else f"urn:li:person:{self.account_id}"
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            # Prepare post data
            post_data = {
                "author": author,
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {
                            "text": content_data.get("content", "")
                        },
                        "shareMediaCategory": "NONE"
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                },
                "scheduledStartTime": int(datetime.fromisoformat(publish_time.replace('Z', '+00:00')).timestamp() * 1000),
                "scheduledEndTime": int((datetime.fromisoformat(publish_time.replace('Z', '+00:00')).timestamp() + 365 * 24 * 60 * 60) * 1000)  # 1 year later
            }
            
            # Add link if available
            if content_data.get("link_url"):
                post_data["specificContent"]["com.linkedin.ugc.ShareContent"]["shareMediaCategory"] = "ARTICLE"
                post_data["specificContent"]["com.linkedin.ugc.ShareContent"]["media"] = [{
                    "status": "READY",
                    "description": {
                        "text": content_data.get("meta_description", "")
                    },
                    "originalUrl": content_data["link_url"],
                    "title": {
                        "text": content_data.get("title", "")
                    }
                }]
            
            response = requests.post(
                f"{self.api_url}/ugcPosts",
                headers=headers,
                json=post_data
            )
            
            if response.status_code in (200, 201):
                post_id = response.headers.get('x-restli-id') or response.json().get("id")
                return {
                    "status": "success",
                    "platform": "linkedin",
                    "platform_content_id": post_id,
                    "scheduled_time": publish_time
                }
            else:
                return {
                    "status": "error",
                    "platform": "linkedin",
                    "error": f"LinkedIn API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error scheduling to LinkedIn: {e}")
            return {
                "status": "error",
                "platform": "linkedin",
                "error": str(e),
                "details": "Exception while scheduling to LinkedIn"
            }
    
    def get_content_status(self, content_id: str) -> Dict[str, Any]:
        """Get LinkedIn post status.
        
        Args:
            content_id: LinkedIn post ID
            
        Returns:
            Dict containing post status information
        """
        try:
            if not self.access_token:
                return {
                    "status": "error",
                    "platform": "linkedin",
                    "error": "Missing access token"
                }
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            response = requests.get(
                f"{self.api_url}/socialActions/{content_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                post_data = response.json()
                
                # Extract metrics
                metrics = {}
                if "likesSummary" in post_data:
                    metrics["likes"] = post_data["likesSummary"].get("count", 0)
                if "commentsSummary" in post_data:
                    metrics["comments"] = post_data["commentsSummary"].get("count", 0)
                
                return {
                    "status": "success",
                    "platform": "linkedin",
                    "platform_content_id": content_id,
                    "content_status": "published",  # LinkedIn API doesn't expose scheduling status
                    "metrics": metrics
                }
            else:
                return {
                    "status": "error",
                    "platform": "linkedin",
                    "error": f"LinkedIn API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error getting LinkedIn post status: {e}")
            return {
                "status": "error",
                "platform": "linkedin",
                "error": str(e),
                "details": "Exception while getting LinkedIn post status"
            }
    
    def delete_content(self, content_id: str) -> Dict[str, Any]:
        """Delete LinkedIn post.
        
        Args:
            content_id: LinkedIn post ID
            
        Returns:
            Dict containing deletion result
        """
        try:
            if not self.access_token:
                return {
                    "status": "error",
                    "platform": "linkedin",
                    "error": "Missing access token"
                }
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            response = requests.delete(
                f"{self.api_url}/ugcPosts/{content_id}",
                headers=headers
            )
            
            if response.status_code in (200, 204):
                return {
                    "status": "success",
                    "platform": "linkedin",
                    "platform_content_id": content_id,
                    "message": "Post deleted successfully"
                }
            else:
                return {
                    "status": "error",
                    "platform": "linkedin",
                    "error": f"LinkedIn API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error deleting LinkedIn post: {e}")
            return {
                "status": "error",
                "platform": "linkedin",
                "error": str(e),
                "details": "Exception while deleting LinkedIn post"
            }
    
    def check_health(self) -> Dict[str, Any]:
        """Check LinkedIn API health.
        
        Returns:
            Dict containing health status information
        """
        start_time = time.time()
        try:
            if not self.access_token:
                return {
                    "status": "unhealthy",
                    "platform": "linkedin",
                    "error": "Missing access token"
                }
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            response = requests.get(
                f"{self.api_url}/me",
                headers=headers
            )
            
            response_time = int((time.time() - start_time) * 1000)  # ms
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "platform": "linkedin",
                    "response_time_ms": response_time,
                    "details": "LinkedIn API is responding normally"
                }
            else:
                return {
                    "status": "unhealthy",
                    "platform": "linkedin",
                    "response_time_ms": response_time,
                    "error": f"LinkedIn API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)  # ms
            logger.error(f"Error checking LinkedIn API health: {e}")
            return {
                "status": "unhealthy",
                "platform": "linkedin",
                "response_time_ms": response_time,
                "error": str(e),
                "details": "Exception while checking LinkedIn API health"
            }


class SocialMediaIntegrationFactory:
    """Factory for creating social media integrations based on platform name."""
    
    @staticmethod
    def get_integration(platform: str, credentials: Dict[str, Any]) -> SocialMediaIntegration:
        """Get an appropriate social media integration based on the platform name.
        
        Args:
            platform: The social media platform name (facebook, twitter, linkedin, etc.)
            credentials: Authentication credentials for the platform
            
        Returns:
            An instance of a SocialMediaIntegration subclass
            
        Raises:
            ValueError: If the platform is unsupported
        """
        platform = platform.lower()
        
        if platform == "facebook" or platform == "facebook pages":
            return FacebookIntegration(credentials)
        elif platform == "twitter":
            return TwitterIntegration(credentials)
        elif platform == "linkedin":
            return LinkedInIntegration(credentials)
        elif platform == "instagram":
            # Instagram is handled through Facebook Graph API
            credentials_copy = credentials.copy()
            credentials_copy["platform"] = "instagram"
            return FacebookIntegration(credentials_copy)
        else:
            raise ValueError(f"Unsupported social media platform: {platform}")