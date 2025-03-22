"""Instagram Integration Module.

This module provides integration with Instagram via the Facebook Graph API,
with specific optimizations for image posting and performance tracking.
"""

import logging
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime
import time
import json
import re
import io
from PIL import Image

from src.agents.integrations.social_integration import SocialMediaIntegration, IntegrationError

logger = logging.getLogger(__name__)

class InstagramIntegration(SocialMediaIntegration):
    """Instagram social media integration using the Facebook Graph API."""
    
    def __init__(self, credentials: Dict[str, Any]):
        """Initialize the Instagram integration.
        
        Args:
            credentials: Instagram authentication credentials (via Facebook)
        """
        super().__init__("instagram", credentials)
        self.api_version = "v18.0"  # Use latest stable version
        self.api_url = f"https://graph.facebook.com/{self.api_version}"
        self.business_account_id = credentials.get('instagram_business_account_id')
    
    def _get_instagram_business_account(self) -> Optional[str]:
        """Get Instagram business account ID if not already provided.
        
        Returns:
            Instagram business account ID if found, None otherwise
        """
        if self.business_account_id:
            return self.business_account_id
            
        # Check required credentials
        if not self.access_token or not self.account_id:
            return None
        
        # Try to get the Instagram business account ID
        try:
            response = requests.get(
                f"{self.api_url}/{self.account_id}",
                params={
                    "access_token": self.access_token,
                    "fields": "instagram_business_account"
                }
            )
            
            if response.status_code == 200:
                page_data = response.json()
                if "instagram_business_account" in page_data:
                    self.business_account_id = page_data["instagram_business_account"]["id"]
                    return self.business_account_id
        except Exception as e:
            logger.error(f"Error getting Instagram business account: {e}")
        
        return None
    
    def _optimize_image(self, image_url: str) -> Dict[str, Any]:
        """Optimize image for Instagram posting.
        
        Args:
            image_url: URL of the image to optimize
            
        Returns:
            Dict containing optimized image information or error
        """
        try:
            # Download the image
            response = requests.get(image_url, stream=True)
            if response.status_code != 200:
                return {"status": "error", "message": f"Failed to download image: {response.status_code}"}
            
            # Open the image with PIL
            img = Image.open(io.BytesIO(response.content))
            
            # Check if image size is within Instagram's requirements
            width, height = img.size
            
            # Determine if aspect ratio is within Instagram's recommendations
            # Instagram prefers between 4:5 and 1.91:1
            aspect_ratio = width / height
            is_valid_ratio = 0.8 <= aspect_ratio <= 1.91
            
            # Resize if needed for optimal Instagram display
            if not is_valid_ratio:
                if aspect_ratio < 0.8:
                    # Too tall, crop to 4:5
                    new_height = int(width / 0.8)
                    top = (height - new_height) // 2
                    img = img.crop((0, top, width, top + new_height))
                elif aspect_ratio > 1.91:
                    # Too wide, crop to 1.91:1
                    new_width = int(height * 1.91)
                    left = (width - new_width) // 2
                    img = img.crop((left, 0, left + new_width, height))
                
                # Get new dimensions
                width, height = img.size
            
            # Ensure the resolution is high enough for Instagram
            min_width = 320
            min_height = 320
            
            if width < min_width or height < min_height:
                # Scale up small images
                scale = max(min_width / width, min_height / height)
                new_width = int(width * scale)
                new_height = int(height * scale)
                img = img.resize((new_width, new_height), Image.LANCZOS)
            
            # Buffer for returning image data
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=95, optimize=True)
            buffer.seek(0)
            
            return {
                "status": "success",
                "image_data": buffer,
                "aspect_ratio": aspect_ratio,
                "dimensions": img.size,
                "resized": width != img.size[0] or height != img.size[1]
            }
        except Exception as e:
            logger.error(f"Error optimizing image: {e}")
            return {"status": "error", "message": str(e)}
    
    def post_content(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Post content to Instagram.
        
        Args:
            content_data: Content data including caption, image_url, etc.
            
        Returns:
            Dict containing posting result
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token'])
        if credentials_check:
            return credentials_check
        
        # Ensure we have an Instagram business account ID
        business_account_id = self._get_instagram_business_account()
        if not business_account_id:
            return self.format_error_response(
                "Missing Instagram business account ID. Make sure the Facebook page is linked to an Instagram business account."
            )
        
        def execute_request():
            # Instagram requires an image or video
            if not content_data.get("image_url") and not content_data.get("video_url"):
                return self.format_error_response(
                    "Instagram posts require an image or video URL"
                )
            
            caption = content_data.get("content", "")
            
            # Process hashtags effectively
            if content_data.get("hashtags"):
                if isinstance(content_data["hashtags"], list):
                    hashtags_text = " ".join([f"#{tag}" if not tag.startswith('#') else tag for tag in content_data["hashtags"]])
                else:
                    hashtags_text = content_data["hashtags"]
                
                caption = f"{caption}\n\n{hashtags_text}"
            
            # For image posts
            if content_data.get("image_url"):
                # First, upload the image to Facebook
                
                # Option 1: Direct URL for Facebook to use
                # This works if the image is publicly accessible
                image_url = content_data["image_url"]
                
                # Option 2: Optimize and process the image locally
                # Use this if the image needs optimization
                if content_data.get("optimize_image", True):
                    optimization_result = self._optimize_image(image_url)
                    if optimization_result["status"] == "error":
                        return self.format_error_response(f"Image optimization failed: {optimization_result['message']}")
                    
                    # Use image data stream instead of URL
                    # This requires uploading the image to Facebook first
                    # For simplicity, we'll still use the URL in this implementation
                
                # Create container for Instagram media
                container_response = requests.post(
                    f"{self.api_url}/{business_account_id}/media",
                    params={
                        "access_token": self.access_token,
                        "image_url": image_url,
                        "caption": caption
                    }
                )
                
                if container_response.status_code != 200:
                    raise IntegrationError(f"Instagram API Error: {container_response.status_code} - {container_response.text}")
                
                container_id = container_response.json().get("id")
                
                # Publish the container as an Instagram post
                publish_response = requests.post(
                    f"{self.api_url}/{business_account_id}/media_publish",
                    params={
                        "access_token": self.access_token,
                        "creation_id": container_id
                    }
                )
                
                if publish_response.status_code != 200:
                    raise IntegrationError(f"Instagram API Error: {publish_response.status_code} - {publish_response.text}")
                
                post_id = publish_response.json().get("id")
                
                # Get the permalink URL for the post
                media_response = requests.get(
                    f"{self.api_url}/{post_id}",
                    params={
                        "access_token": self.access_token,
                        "fields": "permalink"
                    }
                )
                
                permalink = None
                if media_response.status_code == 200:
                    permalink = media_response.json().get("permalink")
                
                return self.format_success_response(
                    platform_content_id=post_id,
                    publish_time=datetime.now().isoformat(),
                    url=permalink
                )
            
            # For video posts
            if content_data.get("video_url"):
                # Upload video to Facebook
                video_url = content_data["video_url"]
                
                # Create container for Instagram media
                container_response = requests.post(
                    f"{self.api_url}/{business_account_id}/media",
                    params={
                        "access_token": self.access_token,
                        "media_type": "VIDEO",
                        "video_url": video_url,
                        "caption": caption
                    }
                )
                
                if container_response.status_code != 200:
                    raise IntegrationError(f"Instagram API Error: {container_response.status_code} - {container_response.text}")
                
                container_id = container_response.json().get("id")
                
                # Check container status until it's ready
                max_attempts = 10
                attempts = 0
                container_status = "IN_PROGRESS"
                
                while container_status == "IN_PROGRESS" and attempts < max_attempts:
                    attempts += 1
                    time.sleep(5)  # Wait 5 seconds between status checks
                    
                    status_response = requests.get(
                        f"{self.api_url}/{container_id}",
                        params={
                            "access_token": self.access_token,
                            "fields": "status_code"
                        }
                    )
                    
                    if status_response.status_code != 200:
                        raise IntegrationError(f"Instagram API Error: {status_response.status_code} - {status_response.text}")
                    
                    container_status = status_response.json().get("status_code")
                    
                    if container_status == "FINISHED":
                        break
                    elif container_status == "ERROR":
                        error_info = status_response.json()
                        return self.format_error_response(
                            f"Instagram video processing failed: {error_info.get('error_message', 'Unknown error')}"
                        )
                
                if container_status != "FINISHED":
                    return self.format_error_response(
                        "Instagram video processing timeout or error"
                    )
                
                # Publish the container as an Instagram post
                publish_response = requests.post(
                    f"{self.api_url}/{business_account_id}/media_publish",
                    params={
                        "access_token": self.access_token,
                        "creation_id": container_id
                    }
                )
                
                if publish_response.status_code != 200:
                    raise IntegrationError(f"Instagram API Error: {publish_response.status_code} - {publish_response.text}")
                
                post_id = publish_response.json().get("id")
                
                # Get the permalink URL for the post
                media_response = requests.get(
                    f"{self.api_url}/{post_id}",
                    params={
                        "access_token": self.access_token,
                        "fields": "permalink"
                    }
                )
                
                permalink = None
                if media_response.status_code == 200:
                    permalink = media_response.json().get("permalink")
                
                return self.format_success_response(
                    platform_content_id=post_id,
                    publish_time=datetime.now().isoformat(),
                    url=permalink
                )
        
        return self.safe_request(
            execute_request,
            "Error posting to Instagram"
        )
    
    def schedule_content(self, content_data: Dict[str, Any], publish_time: str) -> Dict[str, Any]:
        """Schedule content for future posting on Instagram.
        
        Note: Instagram doesn't directly support scheduling via API,
        so this would create the media container but not publish.
        
        Args:
            content_data: Content data including caption, image_url, etc.
            publish_time: ISO format datetime for scheduled publishing
            
        Returns:
            Dict containing scheduling result
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token'])
        if credentials_check:
            return credentials_check
        
        # Ensure we have an Instagram business account ID
        business_account_id = self._get_instagram_business_account()
        if not business_account_id:
            return self.format_error_response(
                "Missing Instagram business account ID. Make sure the Facebook page is linked to an Instagram business account."
            )
        
        def execute_request():
            # Instagram requires an image or video
            if not content_data.get("image_url") and not content_data.get("video_url"):
                return self.format_error_response(
                    "Instagram posts require an image or video URL"
                )
            
            caption = content_data.get("content", "")
            
            # Process hashtags effectively
            if content_data.get("hashtags"):
                if isinstance(content_data["hashtags"], list):
                    hashtags_text = " ".join([f"#{tag}" if not tag.startswith('#') else tag for tag in content_data["hashtags"]])
                else:
                    hashtags_text = content_data["hashtags"]
                
                caption = f"{caption}\n\n{hashtags_text}"
            
            # Create a media container but don't publish yet
            container_params = {
                "access_token": self.access_token,
                "caption": caption
            }
            
            if content_data.get("image_url"):
                container_params["image_url"] = content_data["image_url"]
            elif content_data.get("video_url"):
                container_params["media_type"] = "VIDEO"
                container_params["video_url"] = content_data["video_url"]
            
            container_response = requests.post(
                f"{self.api_url}/{business_account_id}/media",
                params=container_params
            )
            
            if container_response.status_code != 200:
                raise IntegrationError(f"Instagram API Error: {container_response.status_code} - {container_response.text}")
            
            container_id = container_response.json().get("id")
            
            # For video, we need to wait for processing to complete
            if content_data.get("video_url"):
                max_attempts = 10
                attempts = 0
                container_status = "IN_PROGRESS"
                
                while container_status == "IN_PROGRESS" and attempts < max_attempts:
                    attempts += 1
                    time.sleep(5)  # Wait 5 seconds between status checks
                    
                    status_response = requests.get(
                        f"{self.api_url}/{container_id}",
                        params={
                            "access_token": self.access_token,
                            "fields": "status_code"
                        }
                    )
                    
                    if status_response.status_code != 200:
                        raise IntegrationError(f"Instagram API Error: {status_response.status_code} - {status_response.text}")
                    
                    container_status = status_response.json().get("status_code")
                    
                    if container_status == "FINISHED":
                        break
                    elif container_status == "ERROR":
                        error_info = status_response.json()
                        return self.format_error_response(
                            f"Instagram video processing failed: {error_info.get('error_message', 'Unknown error')}"
                        )
                
                if container_status != "FINISHED":
                    return self.format_error_response(
                        "Instagram video processing timeout or error"
                    )
            
            # Return the container ID to be published later
            return self.format_success_response(
                platform_content_id=container_id,
                scheduled_time=publish_time,
                content_type="container",
                message="Media container created successfully, will be published at the scheduled time",
                status="scheduled"
            )
        
        return self.safe_request(
            execute_request,
            "Error scheduling Instagram post"
        )
    
    def get_content_status(self, content_id: str) -> Dict[str, Any]:
        """Get Instagram post status.
        
        Args:
            content_id: Instagram media ID
            
        Returns:
            Dict containing post status information
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token'])
        if credentials_check:
            return credentials_check
        
        def execute_request():
            # Get media insights
            response = requests.get(
                f"{self.api_url}/{content_id}",
                params={
                    "access_token": self.access_token,
                    "fields": "id,caption,permalink,timestamp,media_type,thumbnail_url,media_url,like_count,comments_count,insights.metric(engagement,impressions,reach,saved)"
                }
            )
            
            if response.status_code != 200:
                raise IntegrationError(f"Instagram API Error: {response.status_code} - {response.text}")
            
            media_data = response.json()
            
            # Extract insights
            insights = {}
            if "insights" in media_data and "data" in media_data["insights"]:
                for metric in media_data["insights"]["data"]:
                    if "values" in metric and len(metric["values"]) > 0:
                        insights[metric["name"]] = metric["values"][0]["value"]
            
            # Add additional metrics
            if "like_count" in media_data:
                insights["likes"] = media_data["like_count"]
            
            if "comments_count" in media_data:
                insights["comments"] = media_data["comments_count"]
            
            return self.format_success_response(
                platform_content_id=content_id,
                content_status="published",
                publish_time=media_data.get("timestamp"),
                url=media_data.get("permalink"),
                media_type=media_data.get("media_type"),
                metrics=insights
            )
        
        return self.safe_request(
            execute_request,
            "Error getting Instagram post status"
        )
    
    def delete_content(self, content_id: str) -> Dict[str, Any]:
        """Delete Instagram post.
        
        Args:
            content_id: Instagram media ID
            
        Returns:
            Dict containing deletion result
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token'])
        if credentials_check:
            return credentials_check
        
        def execute_request():
            response = requests.delete(
                f"{self.api_url}/{content_id}",
                params={
                    "access_token": self.access_token
                }
            )
            
            if response.status_code in (200, 204):
                return self.format_success_response(
                    platform_content_id=content_id,
                    message="Post deleted successfully"
                )
            else:
                raise IntegrationError(f"Instagram API Error: {response.status_code} - {response.text}")
        
        return self.safe_request(
            execute_request,
            "Error deleting Instagram post"
        )
    
    def check_health(self) -> Dict[str, Any]:
        """Check Instagram API health.
        
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
        
        # Ensure we have an Instagram business account ID
        business_account_id = self._get_instagram_business_account()
        if not business_account_id:
            return {
                "status": "unhealthy",
                "platform": self.platform,
                "error": "Missing Instagram business account ID",
                "timestamp": datetime.now().isoformat()
            }
        
        try:
            response, response_time = self.measure_response_time(
                requests.get,
                f"{self.api_url}/{business_account_id}",
                params={
                    "access_token": self.access_token,
                    "fields": "id,username"
                }
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