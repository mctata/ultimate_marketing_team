"""Pinterest Integration Module.

This module provides integration with the Pinterest API for content publishing
and performance tracking with specific optimization for Pinterest's Pin format.
"""

import logging
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime
import time
import json
import re
import io
from urllib.parse import urljoin

from src.agents.integrations.social_integration import SocialMediaIntegration, IntegrationError

logger = logging.getLogger(__name__)

class PinterestIntegration(SocialMediaIntegration):
    """Pinterest social media integration using the Pinterest API."""
    
    def __init__(self, credentials: Dict[str, Any]):
        """Initialize the Pinterest integration.
        
        Args:
            credentials: Pinterest authentication credentials
        """
        super().__init__("pinterest", credentials)
        self.api_url = "https://api.pinterest.com/v5"
        self.business_account_id = credentials.get('business_account_id')
        self.ad_account_id = credentials.get('ad_account_id')
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers for Pinterest API calls.
        
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
        
        return headers
    
    def _refresh_token_if_needed(self) -> bool:
        """Refresh the access token if it's expired.
        
        Returns:
            True if token was refreshed successfully, False otherwise
        """
        if not self.refresh_token:
            return False
        
        # In a real implementation, check token expiry
        # This is a simplified implementation
        try:
            # Test current token
            test_response = requests.get(
                f"{self.api_url}/user_account",
                headers=self._get_headers()
            )
            
            # If token is valid, no need to refresh
            if test_response.status_code == 200:
                return True
            
            # Try to refresh token
            client_id = self.credentials.get("client_id")
            client_secret = self.credentials.get("client_secret")
            
            if not client_id or not client_secret:
                return False
            
            refresh_data = {
                "grant_type": "refresh_token",
                "refresh_token": self.refresh_token,
                "client_id": client_id,
                "client_secret": client_secret
            }
            
            refresh_response = requests.post(
                "https://api.pinterest.com/v5/oauth/token",
                data=refresh_data
            )
            
            if refresh_response.status_code == 200:
                token_data = refresh_response.json()
                self.access_token = token_data.get("access_token")
                self.refresh_token = token_data.get("refresh_token")
                return True
        except Exception as e:
            logger.error(f"Error refreshing Pinterest token: {e}")
        
        return False
    
    def _get_boards(self) -> List[Dict[str, Any]]:
        """Get available Pinterest boards.
        
        Returns:
            List of Pinterest boards
        """
        try:
            response = requests.get(
                f"{self.api_url}/boards",
                headers=self._get_headers(),
                params={"page_size": 100}
            )
            
            if response.status_code != 200:
                logger.error(f"Error getting Pinterest boards: {response.status_code} - {response.text}")
                return []
            
            result = response.json()
            return result.get("items", [])
        except Exception as e:
            logger.error(f"Error getting Pinterest boards: {e}")
            return []
    
    def _get_or_create_board(self, board_name: str) -> Optional[str]:
        """Get an existing board or create a new one.
        
        Args:
            board_name: Name of the board to find or create
            
        Returns:
            Board ID if found or created, None on failure
        """
        # First, try to find existing board
        boards = self._get_boards()
        for board in boards:
            if board.get("name", "").lower() == board_name.lower():
                return board.get("id")
        
        # Create new board if not found
        try:
            create_data = {
                "name": board_name,
                "description": f"Board for {board_name} content"
            }
            
            create_response = requests.post(
                f"{self.api_url}/boards",
                headers=self._get_headers(),
                json=create_data
            )
            
            if create_response.status_code in (200, 201):
                result = create_response.json()
                return result.get("id")
        except Exception as e:
            logger.error(f"Error creating Pinterest board: {e}")
        
        return None
    
    def post_content(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Post content to Pinterest.
        
        Args:
            content_data: Content data including image_url, title, description, etc.
            
        Returns:
            Dict containing posting result
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token'])
        if credentials_check:
            return credentials_check
        
        # Refresh token if needed
        self._refresh_token_if_needed()
        
        def execute_request():
            # Pinterest requires an image or media
            if not content_data.get("image_url") and not content_data.get("media_url"):
                return self.format_error_response(
                    "Pinterest pins require an image or media URL"
                )
            
            # Get board ID
            board_name = content_data.get("board_name", "General")
            board_id = content_data.get("board_id")
            
            if not board_id:
                board_id = self._get_or_create_board(board_name)
                
            if not board_id:
                return self.format_error_response(
                    f"Failed to find or create board '{board_name}'"
                )
            
            # Prepare pin creation data
            pin_data = {
                "board_id": board_id,
                "title": content_data.get("title", ""),
                "description": content_data.get("content", ""),
                "alt_text": content_data.get("alt_text", "")
            }
            
            # Add link if available
            if content_data.get("link_url"):
                pin_data["link"] = content_data["link_url"]
            
            # Add image
            if content_data.get("image_url"):
                pin_data["media_source"] = {
                    "source_type": "image_url",
                    "url": content_data["image_url"]
                }
            elif content_data.get("media_url"):
                pin_data["media_source"] = {
                    "source_type": "image_url",
                    "url": content_data["media_url"]
                }
            
            # Create the pin
            response = requests.post(
                f"{self.api_url}/pins",
                headers=self._get_headers(),
                json=pin_data
            )
            
            if response.status_code not in (200, 201):
                raise IntegrationError(f"Pinterest API Error: {response.status_code} - {response.text}")
            
            pin_result = response.json()
            pin_id = pin_result.get("id")
            
            # Get the pin URL
            pin_url = f"https://www.pinterest.com/pin/{pin_id}/"
            
            return self.format_success_response(
                platform_content_id=pin_id,
                publish_time=datetime.now().isoformat(),
                url=pin_url,
                board_id=board_id,
                board_name=board_name
            )
        
        return self.safe_request(
            execute_request,
            "Error posting to Pinterest"
        )
    
    def schedule_content(self, content_data: Dict[str, Any], publish_time: str) -> Dict[str, Any]:
        """Schedule content for future posting on Pinterest.
        
        Note: Pinterest's standard API doesn't support scheduling.
        For business accounts, we can use the Pinterest Ads API for scheduling.
        
        Args:
            content_data: Content data including image_url, title, description, etc.
            publish_time: ISO format datetime for scheduled publishing
            
        Returns:
            Dict containing scheduling result
        """
        # Check for business and ad account
        if not self.business_account_id or not self.ad_account_id:
            # Return info for internal scheduler to handle
            return self.format_success_response(
                platform="pinterest",
                content_data=content_data,
                scheduled_time=publish_time,
                message="Content scheduled for publication via internal scheduler",
                note="Pinterest standard API doesn't support native scheduling, this content will be stored and published at the requested time"
            )
        
        # Check required credentials
        credentials_check = self.check_credentials(['access_token'])
        if credentials_check:
            return credentials_check
        
        # Refresh token if needed
        self._refresh_token_if_needed()
        
        def execute_request():
            # Pinterest requires an image or media
            if not content_data.get("image_url") and not content_data.get("media_url"):
                return self.format_error_response(
                    "Pinterest pins require an image or media URL"
                )
            
            # Get board ID
            board_name = content_data.get("board_name", "General")
            board_id = content_data.get("board_id")
            
            if not board_id:
                board_id = self._get_or_create_board(board_name)
                
            if not board_id:
                return self.format_error_response(
                    f"Failed to find or create board '{board_name}'"
                )
            
            # Convert ISO datetime to Pinterest format (YYYY-MM-DDTHH:MM:SS+0000)
            scheduled_datetime = datetime.fromisoformat(publish_time.replace('Z', '+00:00'))
            pin_scheduled_time = scheduled_datetime.strftime("%Y-%m-%dT%H:%M:%S+0000")
            
            # Prepare scheduled pin creation data
            pin_data = {
                "ad_account_id": self.ad_account_id,
                "pin_object": {
                    "board_id": board_id,
                    "title": content_data.get("title", ""),
                    "description": content_data.get("content", ""),
                    "alt_text": content_data.get("alt_text", "")
                },
                "publish_time": pin_scheduled_time
            }
            
            # Add link if available
            if content_data.get("link_url"):
                pin_data["pin_object"]["link"] = content_data["link_url"]
            
            # Add image
            if content_data.get("image_url"):
                pin_data["pin_object"]["media_source"] = {
                    "source_type": "image_url",
                    "url": content_data["image_url"]
                }
            elif content_data.get("media_url"):
                pin_data["pin_object"]["media_source"] = {
                    "source_type": "image_url",
                    "url": content_data["media_url"]
                }
            
            # Create the scheduled pin
            response = requests.post(
                f"{self.api_url}/ad_accounts/{self.ad_account_id}/scheduled_pins",
                headers=self._get_headers(),
                json=pin_data
            )
            
            if response.status_code not in (200, 201):
                # If scheduling fails (or not available), fall back to internal scheduler
                return self.format_success_response(
                    platform="pinterest",
                    content_data=content_data,
                    scheduled_time=publish_time,
                    message="Content scheduled for publication via internal scheduler",
                    note="Pinterest scheduling failed, falling back to internal scheduler"
                )
            
            scheduled_pin_result = response.json()
            scheduled_pin_id = scheduled_pin_result.get("id")
            
            return self.format_success_response(
                platform_content_id=scheduled_pin_id,
                scheduled_time=publish_time,
                board_id=board_id,
                board_name=board_name,
                status="scheduled"
            )
        
        return self.safe_request(
            execute_request,
            "Error scheduling Pinterest pin"
        )
    
    def get_content_status(self, content_id: str) -> Dict[str, Any]:
        """Get Pinterest pin status.
        
        Args:
            content_id: Pinterest pin ID
            
        Returns:
            Dict containing pin status information
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token'])
        if credentials_check:
            return credentials_check
        
        # Refresh token if needed
        self._refresh_token_if_needed()
        
        def execute_request():
            # Get pin details
            response = requests.get(
                f"{self.api_url}/pins/{content_id}",
                headers=self._get_headers()
            )
            
            if response.status_code != 200:
                raise IntegrationError(f"Pinterest API Error: {response.status_code} - {response.text}")
            
            pin_data = response.json()
            
            # Get pin analytics if it's a business account
            metrics = {}
            if self.business_account_id:
                try:
                    # Last 7 days analytics
                    analytics_response = requests.get(
                        f"{self.api_url}/pins/{content_id}/analytics",
                        headers=self._get_headers(),
                        params={
                            "start_date": (datetime.now() - datetime.timedelta(days=7)).strftime("%Y-%m-%d"),
                            "end_date": datetime.now().strftime("%Y-%m-%d"),
                            "metric_types": "IMPRESSION,SAVE,PIN_CLICK",
                            "app_types": "ALL"
                        }
                    )
                    
                    if analytics_response.status_code == 200:
                        analytics_data = analytics_response.json()
                        metrics = {
                            "impressions": sum(item.get("value", 0) for item in analytics_data.get("IMPRESSION", [])),
                            "saves": sum(item.get("value", 0) for item in analytics_data.get("SAVE", [])),
                            "clicks": sum(item.get("value", 0) for item in analytics_data.get("PIN_CLICK", []))
                        }
                except Exception as e:
                    logger.warning(f"Error getting Pinterest pin analytics: {e}")
            
            # Construct pin URL
            pin_url = f"https://www.pinterest.com/pin/{content_id}/"
            
            return self.format_success_response(
                platform_content_id=content_id,
                content_status="published",
                publish_time=pin_data.get("created_at"),
                url=pin_url,
                board_id=pin_data.get("board_id"),
                title=pin_data.get("title"),
                description=pin_data.get("description"),
                link=pin_data.get("link"),
                media_type=pin_data.get("media", {}).get("media_type"),
                metrics=metrics
            )
        
        return self.safe_request(
            execute_request,
            "Error getting Pinterest pin status"
        )
    
    def delete_content(self, content_id: str) -> Dict[str, Any]:
        """Delete Pinterest pin.
        
        Args:
            content_id: Pinterest pin ID
            
        Returns:
            Dict containing deletion result
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token'])
        if credentials_check:
            return credentials_check
        
        # Refresh token if needed
        self._refresh_token_if_needed()
        
        def execute_request():
            response = requests.delete(
                f"{self.api_url}/pins/{content_id}",
                headers=self._get_headers()
            )
            
            if response.status_code not in (200, 204):
                raise IntegrationError(f"Pinterest API Error: {response.status_code} - {response.text}")
            
            return self.format_success_response(
                platform_content_id=content_id,
                message="Pin deleted successfully"
            )
        
        return self.safe_request(
            execute_request,
            "Error deleting Pinterest pin"
        )
    
    def create_board(self, board_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new Pinterest board.
        
        Args:
            board_data: Board data including name, description, etc.
            
        Returns:
            Dict containing board creation result
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token'])
        if credentials_check:
            return credentials_check
        
        # Refresh token if needed
        self._refresh_token_if_needed()
        
        def execute_request():
            # Check required fields
            if "name" not in board_data:
                return self.format_error_response("Board name is required")
            
            create_data = {
                "name": board_data["name"],
                "description": board_data.get("description", "")
            }
            
            # Add privacy setting if provided
            if "privacy" in board_data:
                create_data["privacy"] = board_data["privacy"]
            
            response = requests.post(
                f"{self.api_url}/boards",
                headers=self._get_headers(),
                json=create_data
            )
            
            if response.status_code not in (200, 201):
                raise IntegrationError(f"Pinterest API Error: {response.status_code} - {response.text}")
            
            board_result = response.json()
            board_id = board_result.get("id")
            
            # Construct board URL
            board_url = f"https://www.pinterest.com/boards/{board_id}/"
            
            return self.format_success_response(
                platform_content_id=board_id,
                name=board_result.get("name"),
                url=board_url,
                created_at=datetime.now().isoformat()
            )
        
        return self.safe_request(
            execute_request,
            "Error creating Pinterest board"
        )
    
    def get_pin_performance(self, content_id: str, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """Get detailed Pinterest pin performance metrics.
        
        Args:
            content_id: Pinterest pin ID
            start_date: Optional start date in YYYY-MM-DD format
            end_date: Optional end date in YYYY-MM-DD format
            
        Returns:
            Dict containing pin performance metrics
        """
        # Check required credentials
        credentials_check = self.check_credentials(['access_token'])
        if credentials_check:
            return credentials_check
        
        # Check for business account
        if not self.business_account_id:
            return self.format_error_response(
                "Business account ID is required for pin performance metrics"
            )
        
        # Refresh token if needed
        self._refresh_token_if_needed()
        
        def execute_request():
            # Default to last 30 days if dates not provided
            if not start_date:
                start_date = (datetime.now() - datetime.timedelta(days=30)).strftime("%Y-%m-%d")
            
            if not end_date:
                end_date = datetime.now().strftime("%Y-%m-%d")
            
            # Get pin analytics
            analytics_response = requests.get(
                f"{self.api_url}/pins/{content_id}/analytics",
                headers=self._get_headers(),
                params={
                    "start_date": start_date,
                    "end_date": end_date,
                    "metric_types": "IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK,VIDEO_VIEW,ENGAGEMENT",
                    "app_types": "ALL"
                }
            )
            
            if analytics_response.status_code != 200:
                raise IntegrationError(f"Pinterest API Error: {analytics_response.status_code} - {analytics_response.text}")
            
            analytics_data = analytics_response.json()
            
            # Process metrics by date
            metrics_by_date = {}
            for metric_type, metrics in analytics_data.items():
                for item in metrics:
                    date = item.get("date")
                    value = item.get("value", 0)
                    
                    if date not in metrics_by_date:
                        metrics_by_date[date] = {}
                    
                    metrics_by_date[date][metric_type.lower()] = value
            
            # Calculate totals
            totals = {
                "impressions": sum(item.get("value", 0) for item in analytics_data.get("IMPRESSION", [])),
                "saves": sum(item.get("value", 0) for item in analytics_data.get("SAVE", [])),
                "pin_clicks": sum(item.get("value", 0) for item in analytics_data.get("PIN_CLICK", [])),
                "outbound_clicks": sum(item.get("value", 0) for item in analytics_data.get("OUTBOUND_CLICK", [])),
                "video_views": sum(item.get("value", 0) for item in analytics_data.get("VIDEO_VIEW", [])),
                "engagements": sum(item.get("value", 0) for item in analytics_data.get("ENGAGEMENT", []))
            }
            
            # Calculate engagement rate
            if totals["impressions"] > 0:
                totals["engagement_rate"] = (totals["engagements"] / totals["impressions"]) * 100
            else:
                totals["engagement_rate"] = 0
                
            # Calculate save rate
            if totals["impressions"] > 0:
                totals["save_rate"] = (totals["saves"] / totals["impressions"]) * 100
            else:
                totals["save_rate"] = 0
            
            return self.format_success_response(
                platform_content_id=content_id,
                start_date=start_date,
                end_date=end_date,
                metrics_by_date=metrics_by_date,
                totals=totals
            )
        
        return self.safe_request(
            execute_request,
            "Error getting Pinterest pin performance"
        )
    
    def check_health(self) -> Dict[str, Any]:
        """Check Pinterest API health.
        
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
        
        # Refresh token if needed
        token_refreshed = self._refresh_token_if_needed()
        
        try:
            response, response_time = self.measure_response_time(
                requests.get,
                f"{self.api_url}/user_account",
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                user_data = response.json()
                return {
                    "status": "healthy",
                    "platform": self.platform,
                    "response_time_ms": response_time,
                    "details": "API is responding normally",
                    "token_refreshed": token_refreshed,
                    "username": user_data.get("username"),
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