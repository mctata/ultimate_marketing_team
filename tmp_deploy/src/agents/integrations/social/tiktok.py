"""TikTok Integration Module.

This module provides integration with the TikTok API for content publishing
and performance tracking.
"""

import logging
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime
import time
import json
import re
import io
import hashlib
import hmac
import base64
import urllib.parse

from src.agents.integrations.social_integration import SocialMediaIntegration, IntegrationError

logger = logging.getLogger(__name__)

class TikTokIntegration(SocialMediaIntegration):
    """TikTok social media integration using the TikTok API."""
    
    def __init__(self, credentials: Dict[str, Any]):
        """Initialize the TikTok integration.
        
        Args:
            credentials: TikTok authentication credentials
        """
        super().__init__("tiktok", credentials)
        self.api_url = "https://open.tiktokapis.com/v2"
        self.business_id = credentials.get('business_id')
        self.app_id = credentials.get('app_id')
        self.app_secret = credentials.get('app_secret')
    
    def _get_headers(self, path: str, params: Dict[str, Any] = None) -> Dict[str, str]:
        """Get request headers for TikTok API calls with signature.
        
        Args:
            path: API path to sign
            params: Query parameters for the request
            
        Returns:
            Dict containing headers for the request
        """
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # Add authentication token
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        # Add app ID
        if self.app_id:
            headers["X-TikTok-App-ID"] = str(self.app_id)
        
        # Add request timestamp
        timestamp = str(int(time.time()))
        headers["X-TikTok-Timestamp"] = timestamp
        
        # Generate signature if we have the app secret
        if self.app_secret:
            # Prepare request signature
            nonce = hashlib.md5(str(time.time()).encode()).hexdigest()
            headers["X-TikTok-Nonce"] = nonce
            
            # Create signature string
            signature_string = timestamp + nonce + path
            
            # Add query parameters to signature if provided
            if params:
                params_string = "&".join([f"{k}={v}" for k, v in sorted(params.items())])
                signature_string += "?" + params_string
            
            # Sign the request
            signature = hmac.new(
                self.app_secret.encode(),
                msg=signature_string.encode(),
                digestmod=hashlib.sha256
            ).hexdigest()
            
            headers["X-TikTok-Signature"] = signature
        
        return headers
    
    def _refresh_token_if_needed(self) -> bool:
        """Refresh the access token if it's expired.
        
        Returns:
            True if token was refreshed successfully, False otherwise
        """
        if not self.refresh_token:
            return False
        
        # Check if we need to refresh (ideally would check expiry, but simplified implementation)
        try:
            # Verify current token
            test_response = requests.get(
                f"{self.api_url}/business/info/",
                headers=self._get_headers("/business/info/")
            )
            
            # If token is valid, no need to refresh
            if test_response.status_code == 200:
                return True
            
            # Token might be expired, try to refresh
            refresh_params = {
                "client_key": self.app_id,
                "client_secret": self.app_secret,
                "grant_type": "refresh_token",
                "refresh_token": self.refresh_token
            }
            
            refresh_response = requests.post(
                "https://open-api.tiktok.com/oauth/refresh_token/",
                json=refresh_params
            )
            
            if refresh_response.status_code == 200:
                refresh_data = refresh_response.json()
                if refresh_data.get("data", {}).get("access_token"):
                    self.access_token = refresh_data["data"]["access_token"]
                    self.refresh_token = refresh_data["data"]["refresh_token"]
                    return True
        except Exception as e:
            logger.error(f"Error refreshing TikTok access token: {e}")
        
        return False
    
    def post_content(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Post content to TikTok.
        
        Args:
            content_data: Content data including video_url, description, etc.
            
        Returns:
            Dict containing posting result
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token', 'business_id'])
        if credentials_check:
            return credentials_check
        
        # Refresh token if needed
        self._refresh_token_if_needed()
        
        def execute_request():
            # TikTok requires a video
            if not content_data.get("video_url"):
                return self.format_error_response(
                    "TikTok posts require a video URL"
                )
            
            # Get video duration and format if available
            video_duration = content_data.get("video_duration", 60)  # Default 60 seconds
            
            # Get video upload info
            upload_params = {
                "business_id": self.business_id
            }
            
            upload_headers = self._get_headers("/video/upload/", upload_params)
            
            upload_info_response = requests.get(
                f"{self.api_url}/video/upload/",
                headers=upload_headers,
                params=upload_params
            )
            
            if upload_info_response.status_code != 200:
                raise IntegrationError(f"TikTok API Error: {upload_info_response.status_code} - {upload_info_response.text}")
            
            upload_info = upload_info_response.json()
            
            if upload_info.get("code") != 0 or "data" not in upload_info:
                raise IntegrationError(f"TikTok API Error: {upload_info.get('message', 'Unknown error')}")
            
            upload_url = upload_info["data"].get("upload_url")
            upload_token = upload_info["data"].get("upload_token")
            
            if not upload_url or not upload_token:
                raise IntegrationError("Failed to get TikTok upload URL and token")
            
            # Download the video
            video_response = requests.get(content_data["video_url"], stream=True)
            if video_response.status_code != 200:
                raise IntegrationError(f"Failed to download video: {video_response.status_code}")
            
            video_data = video_response.content
            
            # Upload the video
            upload_response = requests.post(
                upload_url,
                files={"video": video_data},
                data={"upload_token": upload_token}
            )
            
            if upload_response.status_code not in (200, 201):
                raise IntegrationError(f"TikTok video upload error: {upload_response.status_code} - {upload_response.text}")
            
            upload_result = upload_response.json()
            
            if upload_result.get("code") != 0:
                raise IntegrationError(f"TikTok video upload error: {upload_result.get('message', 'Unknown error')}")
            
            # Create post with the uploaded video
            post_params = {
                "business_id": self.business_id
            }
            
            post_data = {
                "video_id": upload_result["data"]["video_id"],
                "post_info": {
                    "title": content_data.get("content", ""),
                    "privacy_level": content_data.get("privacy_level", "PUBLIC"),
                    "disable_comment": content_data.get("disable_comments", False),
                    "disable_duet": content_data.get("disable_duet", False),
                    "disable_stitch": content_data.get("disable_stitch", False)
                }
            }
            
            # Add hashtags if provided
            if content_data.get("hashtags"):
                if isinstance(content_data["hashtags"], list):
                    post_data["post_info"]["tags"] = [
                        {"name": tag.replace("#", "")} for tag in content_data["hashtags"]
                    ]
            
            post_headers = self._get_headers("/post/publish/video/", post_params)
            
            post_response = requests.post(
                f"{self.api_url}/post/publish/video/",
                headers=post_headers,
                params=post_params,
                json=post_data
            )
            
            if post_response.status_code != 200:
                raise IntegrationError(f"TikTok API Error: {post_response.status_code} - {post_response.text}")
            
            post_result = post_response.json()
            
            if post_result.get("code") != 0:
                raise IntegrationError(f"TikTok post error: {post_result.get('message', 'Unknown error')}")
            
            # Get the post ID
            post_id = post_result["data"].get("post_id")
            
            return self.format_success_response(
                platform_content_id=post_id,
                publish_time=datetime.now().isoformat(),
                message="TikTok video published successfully",
                url=f"https://www.tiktok.com/@{self.business_id}/video/{post_id}" if post_id else None
            )
        
        return self.safe_request(
            execute_request,
            "Error posting to TikTok"
        )
    
    def schedule_content(self, content_data: Dict[str, Any], publish_time: str) -> Dict[str, Any]:
        """Schedule content for future posting on TikTok.
        
        Args:
            content_data: Content data including video_url, description, etc.
            publish_time: ISO format datetime for scheduled publishing
            
        Returns:
            Dict containing scheduling result
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token', 'business_id'])
        if credentials_check:
            return credentials_check
        
        # Refresh token if needed
        self._refresh_token_if_needed()
        
        def execute_request():
            # TikTok requires a video
            if not content_data.get("video_url"):
                return self.format_error_response(
                    "TikTok posts require a video URL"
                )
            
            # Get video upload info
            upload_params = {
                "business_id": self.business_id
            }
            
            upload_headers = self._get_headers("/video/upload/", upload_params)
            
            upload_info_response = requests.get(
                f"{self.api_url}/video/upload/",
                headers=upload_headers,
                params=upload_params
            )
            
            if upload_info_response.status_code != 200:
                raise IntegrationError(f"TikTok API Error: {upload_info_response.status_code} - {upload_info_response.text}")
            
            upload_info = upload_info_response.json()
            
            if upload_info.get("code") != 0 or "data" not in upload_info:
                raise IntegrationError(f"TikTok API Error: {upload_info.get('message', 'Unknown error')}")
            
            upload_url = upload_info["data"].get("upload_url")
            upload_token = upload_info["data"].get("upload_token")
            
            if not upload_url or not upload_token:
                raise IntegrationError("Failed to get TikTok upload URL and token")
            
            # Download the video
            video_response = requests.get(content_data["video_url"], stream=True)
            if video_response.status_code != 200:
                raise IntegrationError(f"Failed to download video: {video_response.status_code}")
            
            video_data = video_response.content
            
            # Upload the video
            upload_response = requests.post(
                upload_url,
                files={"video": video_data},
                data={"upload_token": upload_token}
            )
            
            if upload_response.status_code not in (200, 201):
                raise IntegrationError(f"TikTok video upload error: {upload_response.status_code} - {upload_response.text}")
            
            upload_result = upload_response.json()
            
            if upload_result.get("code") != 0:
                raise IntegrationError(f"TikTok video upload error: {upload_result.get('message', 'Unknown error')}")
            
            # Create scheduled post with the uploaded video
            post_params = {
                "business_id": self.business_id
            }
            
            # Convert ISO datetime to Unix timestamp
            publish_datetime = datetime.fromisoformat(publish_time.replace('Z', '+00:00'))
            scheduled_publish_time = int(publish_datetime.timestamp())
            
            post_data = {
                "video_id": upload_result["data"]["video_id"],
                "post_info": {
                    "title": content_data.get("content", ""),
                    "privacy_level": content_data.get("privacy_level", "PUBLIC"),
                    "disable_comment": content_data.get("disable_comments", False),
                    "disable_duet": content_data.get("disable_duet", False),
                    "disable_stitch": content_data.get("disable_stitch", False),
                    "schedule_time": scheduled_publish_time
                }
            }
            
            # Add hashtags if provided
            if content_data.get("hashtags"):
                if isinstance(content_data["hashtags"], list):
                    post_data["post_info"]["tags"] = [
                        {"name": tag.replace("#", "")} for tag in content_data["hashtags"]
                    ]
            
            post_headers = self._get_headers("/post/publish/video/schedule/", post_params)
            
            post_response = requests.post(
                f"{self.api_url}/post/publish/video/schedule/",
                headers=post_headers,
                params=post_params,
                json=post_data
            )
            
            if post_response.status_code != 200:
                raise IntegrationError(f"TikTok API Error: {post_response.status_code} - {post_response.text}")
            
            post_result = post_response.json()
            
            if post_result.get("code") != 0:
                raise IntegrationError(f"TikTok post scheduling error: {post_result.get('message', 'Unknown error')}")
            
            # Get the scheduled post ID
            post_id = post_result["data"].get("post_id")
            
            return self.format_success_response(
                platform_content_id=post_id,
                scheduled_time=publish_time,
                message="TikTok video scheduled successfully",
                status="scheduled"
            )
        
        return self.safe_request(
            execute_request,
            "Error scheduling TikTok post"
        )
    
    def get_content_status(self, content_id: str) -> Dict[str, Any]:
        """Get TikTok post status.
        
        Args:
            content_id: TikTok post ID
            
        Returns:
            Dict containing post status information
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token', 'business_id'])
        if credentials_check:
            return credentials_check
        
        # Refresh token if needed
        self._refresh_token_if_needed()
        
        def execute_request():
            # Get post details
            params = {
                "business_id": self.business_id,
                "post_ids": [content_id]
            }
            
            headers = self._get_headers("/post/info/query/", params)
            
            response = requests.get(
                f"{self.api_url}/post/info/query/",
                headers=headers,
                params=params
            )
            
            if response.status_code != 200:
                raise IntegrationError(f"TikTok API Error: {response.status_code} - {response.text}")
            
            result = response.json()
            
            if result.get("code") != 0:
                raise IntegrationError(f"TikTok API Error: {result.get('message', 'Unknown error')}")
            
            if "data" not in result or "posts" not in result["data"] or len(result["data"]["posts"]) == 0:
                raise IntegrationError("Post not found")
            
            post_data = result["data"]["posts"][0]
            
            # Get post metrics
            metrics_params = {
                "business_id": self.business_id,
                "post_ids": [content_id],
                "metrics": ["likes", "comments", "shares", "views", "reach", "video_views"]
            }
            
            metrics_headers = self._get_headers("/post/metrics/", metrics_params)
            
            metrics_response = requests.get(
                f"{self.api_url}/post/metrics/",
                headers=metrics_headers,
                params=metrics_params
            )
            
            metrics = {}
            if metrics_response.status_code == 200:
                metrics_result = metrics_response.json()
                if metrics_result.get("code") == 0 and "data" in metrics_result and "metrics" in metrics_result["data"]:
                    metrics = metrics_result["data"]["metrics"].get(content_id, {})
            
            # Determine post URL
            post_url = f"https://www.tiktok.com/@{post_data.get('creator_name', self.business_id)}/video/{content_id}"
            
            return self.format_success_response(
                platform_content_id=content_id,
                content_status=post_data.get("status", "published"),
                publish_time=post_data.get("create_time"),
                url=post_url,
                title=post_data.get("title"),
                metrics=metrics
            )
        
        return self.safe_request(
            execute_request,
            "Error getting TikTok post status"
        )
    
    def delete_content(self, content_id: str) -> Dict[str, Any]:
        """Delete TikTok post.
        
        Args:
            content_id: TikTok post ID
            
        Returns:
            Dict containing deletion result
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token', 'business_id'])
        if credentials_check:
            return credentials_check
        
        # Refresh token if needed
        self._refresh_token_if_needed()
        
        def execute_request():
            params = {
                "business_id": self.business_id,
                "post_id": content_id
            }
            
            headers = self._get_headers("/post/delete/", params)
            
            response = requests.post(
                f"{self.api_url}/post/delete/",
                headers=headers,
                params=params
            )
            
            if response.status_code != 200:
                raise IntegrationError(f"TikTok API Error: {response.status_code} - {response.text}")
            
            result = response.json()
            
            if result.get("code") != 0:
                raise IntegrationError(f"TikTok API Error: {result.get('message', 'Unknown error')}")
            
            return self.format_success_response(
                platform_content_id=content_id,
                message="Post deleted successfully"
            )
        
        return self.safe_request(
            execute_request,
            "Error deleting TikTok post"
        )
    
    def get_account_stats(self) -> Dict[str, Any]:
        """Get TikTok account statistics.
        
        Returns:
            Dict containing account statistics
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token', 'business_id'])
        if credentials_check:
            return credentials_check
        
        # Refresh token if needed
        self._refresh_token_if_needed()
        
        def execute_request():
            # Get business account info
            info_params = {
                "business_id": self.business_id
            }
            
            info_headers = self._get_headers("/business/info/", info_params)
            
            info_response = requests.get(
                f"{self.api_url}/business/info/",
                headers=info_headers,
                params=info_params
            )
            
            if info_response.status_code != 200:
                raise IntegrationError(f"TikTok API Error: {info_response.status_code} - {info_response.text}")
            
            info_result = info_response.json()
            
            if info_result.get("code") != 0:
                raise IntegrationError(f"TikTok API Error: {info_result.get('message', 'Unknown error')}")
            
            business_info = info_result.get("data", {})
            
            # Get account metrics
            metrics_params = {
                "business_id": self.business_id,
                "metrics": ["followers", "profile_views", "videos_posted"]
            }
            
            metrics_headers = self._get_headers("/business/metrics/", metrics_params)
            
            metrics_response = requests.get(
                f"{self.api_url}/business/metrics/",
                headers=metrics_headers,
                params=metrics_params
            )
            
            metrics = {}
            if metrics_response.status_code == 200:
                metrics_result = metrics_response.json()
                if metrics_result.get("code") == 0 and "data" in metrics_result:
                    metrics = metrics_result["data"]
            
            # Combine business info and metrics
            account_stats = {
                "id": self.business_id,
                "username": business_info.get("username"),
                "display_name": business_info.get("display_name"),
                "profile_image": business_info.get("profile_image"),
                "followers_count": metrics.get("followers", {}).get("value", 0),
                "profile_views": metrics.get("profile_views", {}).get("value", 0),
                "videos_posted": metrics.get("videos_posted", {}).get("value", 0)
            }
            
            return self.format_success_response(
                platform_content_id=self.business_id,
                account_stats=account_stats,
                url=f"https://www.tiktok.com/@{business_info.get('username', self.business_id)}"
            )
        
        return self.safe_request(
            execute_request,
            "Error getting TikTok account statistics"
        )
    
    def check_health(self) -> Dict[str, Any]:
        """Check TikTok API health.
        
        Returns:
            Dict containing health status information
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token', 'business_id'])
        if credentials_check:
            return {
                "status": "unhealthy",
                "platform": self.platform,
                "error": "Missing required credentials",
                "timestamp": datetime.now().isoformat()
            }
        
        # Refresh token if needed
        token_refreshed = self._refresh_token_if_needed()
        
        try:
            # Get business account info as a health check
            info_params = {
                "business_id": self.business_id
            }
            
            info_headers = self._get_headers("/business/info/", info_params)
            
            response, response_time = self.measure_response_time(
                requests.get,
                f"{self.api_url}/business/info/",
                headers=info_headers,
                params=info_params
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("code") == 0:
                    return {
                        "status": "healthy",
                        "platform": self.platform,
                        "response_time_ms": response_time,
                        "details": "API is responding normally",
                        "token_refreshed": token_refreshed,
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    return {
                        "status": "unhealthy",
                        "platform": self.platform,
                        "response_time_ms": response_time,
                        "error": result.get("message", "Unknown error"),
                        "code": result.get("code"),
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