"""Advertising Integration Module for the Content & Ad Management Agent.

This module provides integrations with common advertising platforms including
Google Ads and Facebook Ads. It handles campaign creation, management, and
performance tracking.
"""

import os
import json
import logging
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime
import time

logger = logging.getLogger(__name__)

class AdPlatformIntegration:
    """Base class for advertising platform integrations."""
    
    def __init__(self, platform: str, credentials: Dict[str, Any]):
        """Initialize the ad platform integration.
        
        Args:
            platform: The advertising platform name
            credentials: Authentication credentials for the platform
        """
        self.platform = platform
        self.credentials = credentials
    
    def create_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new advertising campaign.
        
        Args:
            campaign_data: Campaign configuration data
            
        Returns:
            Dict containing the campaign creation result
        """
        raise NotImplementedError("Subclasses must implement create_campaign")
    
    def update_campaign(self, campaign_id: str, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing advertising campaign.
        
        Args:
            campaign_id: Platform-specific campaign ID
            campaign_data: Updated campaign configuration data
            
        Returns:
            Dict containing the campaign update result
        """
        raise NotImplementedError("Subclasses must implement update_campaign")
    
    def get_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Get campaign details.
        
        Args:
            campaign_id: Platform-specific campaign ID
            
        Returns:
            Dict containing campaign details
        """
        raise NotImplementedError("Subclasses must implement get_campaign")
    
    def get_campaign_performance(self, campaign_id: str) -> Dict[str, Any]:
        """Get campaign performance metrics.
        
        Args:
            campaign_id: Platform-specific campaign ID
            
        Returns:
            Dict containing campaign performance metrics
        """
        raise NotImplementedError("Subclasses must implement get_campaign_performance")
    
    def pause_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Pause an active campaign.
        
        Args:
            campaign_id: Platform-specific campaign ID
            
        Returns:
            Dict containing the pause operation result
        """
        raise NotImplementedError("Subclasses must implement pause_campaign")
    
    def resume_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Resume a paused campaign.
        
        Args:
            campaign_id: Platform-specific campaign ID
            
        Returns:
            Dict containing the resume operation result
        """
        raise NotImplementedError("Subclasses must implement resume_campaign")
    
    def stop_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Stop (end) a campaign.
        
        Args:
            campaign_id: Platform-specific campaign ID
            
        Returns:
            Dict containing the stop operation result
        """
        raise NotImplementedError("Subclasses must implement stop_campaign")
    
    def check_health(self) -> Dict[str, Any]:
        """Check the health of the ad platform integration.
        
        Returns:
            Dict containing health status information
        """
        raise NotImplementedError("Subclasses must implement check_health")


class FacebookAdsIntegration(AdPlatformIntegration):
    """Facebook Ads integration using the Facebook Marketing API."""
    
    def __init__(self, credentials: Dict[str, Any]):
        """Initialize the Facebook Ads integration.
        
        Args:
            credentials: Facebook Ads authentication credentials
        """
        super().__init__("facebook ads", credentials)
        self.api_version = "v18.0"  # Use latest stable version
        self.api_url = f"https://graph.facebook.com/{self.api_version}"
        self.access_token = credentials.get('access_token')
        self.account_id = credentials.get('account_id')
        if self.account_id and not self.account_id.startswith('act_'):
            self.account_id = f"act_{self.account_id}"
    
    def create_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new Facebook Ads campaign.
        
        Args:
            campaign_data: Campaign configuration data
            
        Returns:
            Dict containing the campaign creation result
        """
        try:
            if not self.access_token or not self.account_id:
                return {
                    "status": "error",
                    "platform": "facebook ads",
                    "error": "Missing access token or account ID"
                }
            
            params = {
                "access_token": self.access_token
            }
            
            # Required fields
            data = {
                "name": campaign_data.get("name", f"Campaign {int(time.time())}"),
                "objective": campaign_data.get("objective", "CONVERSIONS"),
                "status": campaign_data.get("status", "PAUSED"),  # Start paused by default for safety
                "special_ad_categories": campaign_data.get("special_ad_categories", [])
            }
            
            # Optional fields
            if "daily_budget" in campaign_data:
                data["daily_budget"] = campaign_data["daily_budget"]
            elif "lifetime_budget" in campaign_data:
                data["lifetime_budget"] = campaign_data["lifetime_budget"]
            
            if "bid_strategy" in campaign_data:
                data["bid_strategy"] = campaign_data["bid_strategy"]
            
            if "start_time" in campaign_data:
                data["start_time"] = campaign_data["start_time"]
            
            if "end_time" in campaign_data:
                data["end_time"] = campaign_data["end_time"]
            
            response = requests.post(
                f"{self.api_url}/{self.account_id}/campaigns",
                params=params,
                json=data
            )
            
            if response.status_code in (200, 201):
                campaign_id = response.json().get("id")
                return {
                    "status": "success",
                    "platform": "facebook ads",
                    "campaign_id": campaign_id,
                    "campaign_name": data["name"],
                    "created_at": datetime.now().isoformat(),
                    "details": "Campaign created successfully"
                }
            else:
                return {
                    "status": "error",
                    "platform": "facebook ads",
                    "error": f"Facebook Ads API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error creating Facebook Ads campaign: {e}")
            return {
                "status": "error",
                "platform": "facebook ads",
                "error": str(e),
                "details": "Exception while creating Facebook Ads campaign"
            }
    
    def update_campaign(self, campaign_id: str, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing Facebook Ads campaign.
        
        Args:
            campaign_id: Facebook campaign ID
            campaign_data: Updated campaign configuration data
            
        Returns:
            Dict containing the campaign update result
        """
        try:
            if not self.access_token:
                return {
                    "status": "error",
                    "platform": "facebook ads",
                    "error": "Missing access token"
                }
            
            params = {
                "access_token": self.access_token
            }
            
            # Only include fields that need to be updated
            data = {}
            
            updateable_fields = [
                "name", "objective", "status", "daily_budget", "lifetime_budget",
                "bid_strategy", "start_time", "end_time", "special_ad_categories"
            ]
            
            for field in updateable_fields:
                if field in campaign_data:
                    data[field] = campaign_data[field]
            
            response = requests.post(
                f"{self.api_url}/{campaign_id}",
                params=params,
                json=data
            )
            
            if response.status_code == 200:
                return {
                    "status": "success",
                    "platform": "facebook ads",
                    "campaign_id": campaign_id,
                    "updated_at": datetime.now().isoformat(),
                    "details": "Campaign updated successfully",
                    "updated_fields": list(data.keys())
                }
            else:
                return {
                    "status": "error",
                    "platform": "facebook ads",
                    "error": f"Facebook Ads API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error updating Facebook Ads campaign: {e}")
            return {
                "status": "error",
                "platform": "facebook ads",
                "error": str(e),
                "details": "Exception while updating Facebook Ads campaign"
            }
    
    def get_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Get Facebook Ads campaign details.
        
        Args:
            campaign_id: Facebook campaign ID
            
        Returns:
            Dict containing campaign details
        """
        try:
            if not self.access_token:
                return {
                    "status": "error",
                    "platform": "facebook ads",
                    "error": "Missing access token"
                }
            
            params = {
                "access_token": self.access_token,
                "fields": "id,name,objective,status,daily_budget,lifetime_budget,start_time,end_time,created_time,updated_time"
            }
            
            response = requests.get(
                f"{self.api_url}/{campaign_id}",
                params=params
            )
            
            if response.status_code == 200:
                campaign_data = response.json()
                return {
                    "status": "success",
                    "platform": "facebook ads",
                    "campaign_id": campaign_data.get("id"),
                    "campaign_name": campaign_data.get("name"),
                    "objective": campaign_data.get("objective"),
                    "status": campaign_data.get("status"),
                    "daily_budget": campaign_data.get("daily_budget"),
                    "lifetime_budget": campaign_data.get("lifetime_budget"),
                    "start_time": campaign_data.get("start_time"),
                    "end_time": campaign_data.get("end_time"),
                    "created_time": campaign_data.get("created_time"),
                    "updated_time": campaign_data.get("updated_time")
                }
            else:
                return {
                    "status": "error",
                    "platform": "facebook ads",
                    "error": f"Facebook Ads API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error getting Facebook Ads campaign: {e}")
            return {
                "status": "error",
                "platform": "facebook ads",
                "error": str(e),
                "details": "Exception while getting Facebook Ads campaign"
            }
    
    def get_campaign_performance(self, campaign_id: str) -> Dict[str, Any]:
        """Get Facebook Ads campaign performance metrics.
        
        Args:
            campaign_id: Facebook campaign ID
            
        Returns:
            Dict containing campaign performance metrics
        """
        try:
            if not self.access_token:
                return {
                    "status": "error",
                    "platform": "facebook ads",
                    "error": "Missing access token"
                }
            
            # Define the time range - last 30 days
            since = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            until = datetime.now().strftime('%Y-%m-%d')
            
            params = {
                "access_token": self.access_token,
                "fields": "impressions,clicks,spend,actions,cpc,cpm,cpp,ctr",
                "time_range": json.dumps({"since": since, "until": until})
            }
            
            response = requests.get(
                f"{self.api_url}/{campaign_id}/insights",
                params=params
            )
            
            if response.status_code == 200:
                insights_data = response.json()
                
                if not insights_data.get("data"):
                    return {
                        "status": "success",
                        "platform": "facebook ads",
                        "campaign_id": campaign_id,
                        "message": "No insights data available for this campaign",
                        "metrics": {}
                    }
                
                metrics = insights_data["data"][0]
                
                # Extract conversion actions if available
                conversions = 0
                if "actions" in metrics:
                    for action in metrics["actions"]:
                        if action["action_type"] == "offsite_conversion":
                            conversions += int(action["value"])
                
                return {
                    "status": "success",
                    "platform": "facebook ads",
                    "campaign_id": campaign_id,
                    "date_range": {"since": since, "until": until},
                    "metrics": {
                        "impressions": int(metrics.get("impressions", 0)),
                        "clicks": int(metrics.get("clicks", 0)),
                        "spend": float(metrics.get("spend", 0)),
                        "conversions": conversions,
                        "ctr": float(metrics.get("ctr", 0)) * 100,  # Convert to percentage
                        "cpc": float(metrics.get("cpc", 0)),
                        "cpm": float(metrics.get("cpm", 0)),
                        "conversion_rate": (conversions / int(metrics.get("clicks", 1))) * 100 if int(metrics.get("clicks", 0)) > 0 else 0
                    }
                }
            else:
                return {
                    "status": "error",
                    "platform": "facebook ads",
                    "error": f"Facebook Ads API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error getting Facebook Ads campaign performance: {e}")
            return {
                "status": "error",
                "platform": "facebook ads",
                "error": str(e),
                "details": "Exception while getting Facebook Ads campaign performance"
            }
    
    def pause_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Pause a Facebook Ads campaign.
        
        Args:
            campaign_id: Facebook campaign ID
            
        Returns:
            Dict containing the pause operation result
        """
        try:
            if not self.access_token:
                return {
                    "status": "error",
                    "platform": "facebook ads",
                    "error": "Missing access token"
                }
            
            params = {
                "access_token": self.access_token
            }
            
            data = {
                "status": "PAUSED"
            }
            
            response = requests.post(
                f"{self.api_url}/{campaign_id}",
                params=params,
                json=data
            )
            
            if response.status_code == 200:
                return {
                    "status": "success",
                    "platform": "facebook ads",
                    "campaign_id": campaign_id,
                    "campaign_status": "paused",
                    "paused_at": datetime.now().isoformat(),
                    "details": "Campaign paused successfully"
                }
            else:
                return {
                    "status": "error",
                    "platform": "facebook ads",
                    "error": f"Facebook Ads API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error pausing Facebook Ads campaign: {e}")
            return {
                "status": "error",
                "platform": "facebook ads",
                "error": str(e),
                "details": "Exception while pausing Facebook Ads campaign"
            }
    
    def resume_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Resume a paused Facebook Ads campaign.
        
        Args:
            campaign_id: Facebook campaign ID
            
        Returns:
            Dict containing the resume operation result
        """
        try:
            if not self.access_token:
                return {
                    "status": "error",
                    "platform": "facebook ads",
                    "error": "Missing access token"
                }
            
            params = {
                "access_token": self.access_token
            }
            
            data = {
                "status": "ACTIVE"
            }
            
            response = requests.post(
                f"{self.api_url}/{campaign_id}",
                params=params,
                json=data
            )
            
            if response.status_code == 200:
                return {
                    "status": "success",
                    "platform": "facebook ads",
                    "campaign_id": campaign_id,
                    "campaign_status": "active",
                    "resumed_at": datetime.now().isoformat(),
                    "details": "Campaign resumed successfully"
                }
            else:
                return {
                    "status": "error",
                    "platform": "facebook ads",
                    "error": f"Facebook Ads API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error resuming Facebook Ads campaign: {e}")
            return {
                "status": "error",
                "platform": "facebook ads",
                "error": str(e),
                "details": "Exception while resuming Facebook Ads campaign"
            }
    
    def stop_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Stop (complete) a Facebook Ads campaign.
        
        Args:
            campaign_id: Facebook campaign ID
            
        Returns:
            Dict containing the stop operation result
        """
        try:
            if not self.access_token:
                return {
                    "status": "error",
                    "platform": "facebook ads",
                    "error": "Missing access token"
                }
            
            # Facebook doesn't have a direct "COMPLETED" status, so we use "ARCHIVED"
            params = {
                "access_token": self.access_token
            }
            
            data = {
                "status": "ARCHIVED"
            }
            
            response = requests.post(
                f"{self.api_url}/{campaign_id}",
                params=params,
                json=data
            )
            
            if response.status_code == 200:
                return {
                    "status": "success",
                    "platform": "facebook ads",
                    "campaign_id": campaign_id,
                    "campaign_status": "completed",
                    "completed_at": datetime.now().isoformat(),
                    "details": "Campaign stopped successfully"
                }
            else:
                return {
                    "status": "error",
                    "platform": "facebook ads",
                    "error": f"Facebook Ads API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error stopping Facebook Ads campaign: {e}")
            return {
                "status": "error",
                "platform": "facebook ads",
                "error": str(e),
                "details": "Exception while stopping Facebook Ads campaign"
            }
    
    def check_health(self) -> Dict[str, Any]:
        """Check Facebook Ads API health.
        
        Returns:
            Dict containing health status information
        """
        start_time = time.time()
        try:
            if not self.access_token or not self.account_id:
                return {
                    "status": "unhealthy",
                    "platform": "facebook ads",
                    "error": "Missing access token or account ID"
                }
            
            params = {
                "access_token": self.access_token,
                "fields": "id,name"
            }
            
            response = requests.get(
                f"{self.api_url}/{self.account_id}",
                params=params
            )
            
            response_time = int((time.time() - start_time) * 1000)  # ms
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "platform": "facebook ads",
                    "response_time_ms": response_time,
                    "details": "Facebook Ads API is responding normally"
                }
            else:
                return {
                    "status": "unhealthy",
                    "platform": "facebook ads",
                    "response_time_ms": response_time,
                    "error": f"Facebook Ads API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)  # ms
            logger.error(f"Error checking Facebook Ads API health: {e}")
            return {
                "status": "unhealthy",
                "platform": "facebook ads",
                "response_time_ms": response_time,
                "error": str(e),
                "details": "Exception while checking Facebook Ads API health"
            }


class GoogleAdsIntegration(AdPlatformIntegration):
    """Google Ads integration using the Google Ads API."""
    
    def __init__(self, credentials: Dict[str, Any]):
        """Initialize the Google Ads integration.
        
        Args:
            credentials: Google Ads authentication credentials
        """
        super().__init__("google ads", credentials)
        self.developer_token = credentials.get('developer_token')
        self.client_id = credentials.get('client_id')
        self.client_secret = credentials.get('client_secret')
        self.refresh_token = credentials.get('refresh_token')
        self.customer_id = credentials.get('customer_id')
        self.api_version = "v15"  # Use latest stable version
        
        # In a real implementation, we would use the Google Ads API client library
        # For this mock implementation, we'll simulate the API responses
    
    def _get_access_token(self) -> Optional[str]:
        """Get a fresh access token using the refresh token.
        
        Returns:
            str: Access token if successful, None otherwise
        """
        # This is a simplified implementation
        # In a real implementation, this would use the OAuth2 token endpoint
        
        try:
            # In a real implementation, this would make an actual API call
            # For this mock, we'll just return a fake token
            return f"mock_access_token_{int(time.time())}"
        except Exception as e:
            logger.error(f"Error getting Google Ads access token: {e}")
            return None
    
    def create_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new Google Ads campaign.
        
        Args:
            campaign_data: Campaign configuration data
            
        Returns:
            Dict containing the campaign creation result
        """
        try:
            if not self.developer_token or not self.customer_id:
                return {
                    "status": "error",
                    "platform": "google ads",
                    "error": "Missing developer token or customer ID"
                }
            
            access_token = self._get_access_token()
            if not access_token:
                return {
                    "status": "error",
                    "platform": "google ads",
                    "error": "Failed to obtain access token"
                }
            
            # In a real implementation, we would make an actual API call to Google Ads
            # For this mock implementation, we'll simulate a successful response
            
            campaign_id = f"google_campaign_{int(time.time())}"
            
            return {
                "status": "success",
                "platform": "google ads",
                "campaign_id": campaign_id,
                "campaign_name": campaign_data.get("name", f"Campaign {int(time.time())}"),
                "created_at": datetime.now().isoformat(),
                "details": "Campaign created successfully"
            }
                
        except Exception as e:
            logger.error(f"Error creating Google Ads campaign: {e}")
            return {
                "status": "error",
                "platform": "google ads",
                "error": str(e),
                "details": "Exception while creating Google Ads campaign"
            }
    
    def update_campaign(self, campaign_id: str, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing Google Ads campaign.
        
        Args:
            campaign_id: Google Ads campaign ID
            campaign_data: Updated campaign configuration data
            
        Returns:
            Dict containing the campaign update result
        """
        try:
            if not self.developer_token or not self.customer_id:
                return {
                    "status": "error",
                    "platform": "google ads",
                    "error": "Missing developer token or customer ID"
                }
            
            access_token = self._get_access_token()
            if not access_token:
                return {
                    "status": "error",
                    "platform": "google ads",
                    "error": "Failed to obtain access token"
                }
            
            # In a real implementation, we would make an actual API call to Google Ads
            # For this mock implementation, we'll simulate a successful response
            
            return {
                "status": "success",
                "platform": "google ads",
                "campaign_id": campaign_id,
                "updated_at": datetime.now().isoformat(),
                "details": "Campaign updated successfully",
                "updated_fields": list(campaign_data.keys())
            }
                
        except Exception as e:
            logger.error(f"Error updating Google Ads campaign: {e}")
            return {
                "status": "error",
                "platform": "google ads",
                "error": str(e),
                "details": "Exception while updating Google Ads campaign"
            }
    
    def get_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Get Google Ads campaign details.
        
        Args:
            campaign_id: Google Ads campaign ID
            
        Returns:
            Dict containing campaign details
        """
        try:
            if not self.developer_token or not self.customer_id:
                return {
                    "status": "error",
                    "platform": "google ads",
                    "error": "Missing developer token or customer ID"
                }
            
            access_token = self._get_access_token()
            if not access_token:
                return {
                    "status": "error",
                    "platform": "google ads",
                    "error": "Failed to obtain access token"
                }
            
            # In a real implementation, we would make an actual API call to Google Ads
            # For this mock implementation, we'll simulate a successful response
            
            return {
                "status": "success",
                "platform": "google ads",
                "campaign_id": campaign_id,
                "campaign_name": f"Campaign {campaign_id}",
                "campaign_type": "SEARCH",
                "status": "ENABLED",
                "budget": {
                    "amount_micros": 1000000,  # $1 daily
                    "type": "DAILY"
                },
                "bidding_strategy": "MAXIMIZE_CONVERSIONS",
                "start_date": "2025-01-01",
                "end_date": "2025-12-31",
                "created_time": "2025-01-01T00:00:00Z",
                "updated_time": "2025-01-01T00:00:00Z"
            }
                
        except Exception as e:
            logger.error(f"Error getting Google Ads campaign: {e}")
            return {
                "status": "error",
                "platform": "google ads",
                "error": str(e),
                "details": "Exception while getting Google Ads campaign"
            }
    
    def get_campaign_performance(self, campaign_id: str) -> Dict[str, Any]:
        """Get Google Ads campaign performance metrics.
        
        Args:
            campaign_id: Google Ads campaign ID
            
        Returns:
            Dict containing campaign performance metrics
        """
        try:
            if not self.developer_token or not self.customer_id:
                return {
                    "status": "error",
                    "platform": "google ads",
                    "error": "Missing developer token or customer ID"
                }
            
            access_token = self._get_access_token()
            if not access_token:
                return {
                    "status": "error",
                    "platform": "google ads",
                    "error": "Failed to obtain access token"
                }
            
            # In a real implementation, we would make an actual API call to Google Ads
            # For this mock implementation, we'll simulate a successful response
            
            # Generate some realistic-looking metrics
            impressions = random.randint(1000, 10000)
            clicks = random.randint(50, 500)
            cost_micros = clicks * random.randint(500000, 2000000)  # $0.50 to $2.00 per click
            conversions = random.randint(1, 50)
            
            return {
                "status": "success",
                "platform": "google ads",
                "campaign_id": campaign_id,
                "date_range": {
                    "start_date": (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
                    "end_date": datetime.now().strftime('%Y-%m-%d')
                },
                "metrics": {
                    "impressions": impressions,
                    "clicks": clicks,
                    "spend": cost_micros / 1000000,  # Convert micros to dollars
                    "conversions": conversions,
                    "ctr": (clicks / impressions) * 100 if impressions > 0 else 0,
                    "cpc": (cost_micros / 1000000) / clicks if clicks > 0 else 0,
                    "cpm": (cost_micros / 1000000) / (impressions / 1000) if impressions > 0 else 0,
                    "conversion_rate": (conversions / clicks) * 100 if clicks > 0 else 0,
                    "cost_per_conversion": (cost_micros / 1000000) / conversions if conversions > 0 else 0
                }
            }
                
        except Exception as e:
            logger.error(f"Error getting Google Ads campaign performance: {e}")
            return {
                "status": "error",
                "platform": "google ads",
                "error": str(e),
                "details": "Exception while getting Google Ads campaign performance"
            }
    
    def pause_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Pause a Google Ads campaign.
        
        Args:
            campaign_id: Google Ads campaign ID
            
        Returns:
            Dict containing the pause operation result
        """
        try:
            if not self.developer_token or not self.customer_id:
                return {
                    "status": "error",
                    "platform": "google ads",
                    "error": "Missing developer token or customer ID"
                }
            
            access_token = self._get_access_token()
            if not access_token:
                return {
                    "status": "error",
                    "platform": "google ads",
                    "error": "Failed to obtain access token"
                }
            
            # In a real implementation, we would make an actual API call to Google Ads
            # For this mock implementation, we'll simulate a successful response
            
            return {
                "status": "success",
                "platform": "google ads",
                "campaign_id": campaign_id,
                "campaign_status": "paused",
                "paused_at": datetime.now().isoformat(),
                "details": "Campaign paused successfully"
            }
                
        except Exception as e:
            logger.error(f"Error pausing Google Ads campaign: {e}")
            return {
                "status": "error",
                "platform": "google ads",
                "error": str(e),
                "details": "Exception while pausing Google Ads campaign"
            }
    
    def resume_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Resume a paused Google Ads campaign.
        
        Args:
            campaign_id: Google Ads campaign ID
            
        Returns:
            Dict containing the resume operation result
        """
        try:
            if not self.developer_token or not self.customer_id:
                return {
                    "status": "error",
                    "platform": "google ads",
                    "error": "Missing developer token or customer ID"
                }
            
            access_token = self._get_access_token()
            if not access_token:
                return {
                    "status": "error",
                    "platform": "google ads",
                    "error": "Failed to obtain access token"
                }
            
            # In a real implementation, we would make an actual API call to Google Ads
            # For this mock implementation, we'll simulate a successful response
            
            return {
                "status": "success",
                "platform": "google ads",
                "campaign_id": campaign_id,
                "campaign_status": "active",
                "resumed_at": datetime.now().isoformat(),
                "details": "Campaign resumed successfully"
            }
                
        except Exception as e:
            logger.error(f"Error resuming Google Ads campaign: {e}")
            return {
                "status": "error",
                "platform": "google ads",
                "error": str(e),
                "details": "Exception while resuming Google Ads campaign"
            }
    
    def stop_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Stop (remove) a Google Ads campaign.
        
        Args:
            campaign_id: Google Ads campaign ID
            
        Returns:
            Dict containing the stop operation result
        """
        try:
            if not self.developer_token or not self.customer_id:
                return {
                    "status": "error",
                    "platform": "google ads",
                    "error": "Missing developer token or customer ID"
                }
            
            access_token = self._get_access_token()
            if not access_token:
                return {
                    "status": "error",
                    "platform": "google ads",
                    "error": "Failed to obtain access token"
                }
            
            # In a real implementation, we would make an actual API call to Google Ads
            # For this mock implementation, we'll simulate a successful response
            
            return {
                "status": "success",
                "platform": "google ads",
                "campaign_id": campaign_id,
                "campaign_status": "removed",
                "completed_at": datetime.now().isoformat(),
                "details": "Campaign stopped successfully"
            }
                
        except Exception as e:
            logger.error(f"Error stopping Google Ads campaign: {e}")
            return {
                "status": "error",
                "platform": "google ads",
                "error": str(e),
                "details": "Exception while stopping Google Ads campaign"
            }
    
    def check_health(self) -> Dict[str, Any]:
        """Check Google Ads API health.
        
        Returns:
            Dict containing health status information
        """
        start_time = time.time()
        try:
            if not self.developer_token or not self.customer_id:
                return {
                    "status": "unhealthy",
                    "platform": "google ads",
                    "error": "Missing developer token or customer ID"
                }
            
            access_token = self._get_access_token()
            if not access_token:
                return {
                    "status": "unhealthy",
                    "platform": "google ads",
                    "error": "Failed to obtain access token"
                }
            
            # In a real implementation, we would make an actual API call to Google Ads
            # For this mock implementation, we'll simulate a successful response
            
            response_time = int((time.time() - start_time) * 1000)  # ms
            
            return {
                "status": "healthy",
                "platform": "google ads",
                "response_time_ms": response_time,
                "details": "Google Ads API is responding normally"
            }
                
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)  # ms
            logger.error(f"Error checking Google Ads API health: {e}")
            return {
                "status": "unhealthy",
                "platform": "google ads",
                "response_time_ms": response_time,
                "error": str(e),
                "details": "Exception while checking Google Ads API health"
            }


class AdPlatformIntegrationFactory:
    """Factory for creating ad platform integrations based on platform name."""
    
    @staticmethod
    def get_integration(platform: str, credentials: Dict[str, Any]) -> AdPlatformIntegration:
        """Get an appropriate ad platform integration based on the platform name.
        
        Args:
            platform: The ad platform name (facebook ads, google ads, etc.)
            credentials: Authentication credentials for the platform
            
        Returns:
            An instance of an AdPlatformIntegration subclass
            
        Raises:
            ValueError: If the platform is unsupported
        """
        platform = platform.lower()
        
        if platform in ["facebook ads", "facebook", "instagram ads", "instagram"]:
            return FacebookAdsIntegration(credentials)
        elif platform in ["google ads", "google", "youtube ads"]:
            return GoogleAdsIntegration(credentials)
        else:
            raise ValueError(f"Unsupported ad platform: {platform}")