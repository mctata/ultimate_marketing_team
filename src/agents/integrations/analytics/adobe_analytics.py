"""Adobe Analytics Integration Module.

This module provides integration with Adobe Analytics for
retrieving metrics, reports, and insights.
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
import time
import re
import jwt
import http.client
import urllib.parse

import requests

from src.agents.integrations.analytics.base import AnalyticsIntegration, IntegrationError

logger = logging.getLogger(__name__)

class AdobeAnalyticsIntegration(AnalyticsIntegration):
    """Adobe Analytics integration using the Adobe Analytics API 2.0."""
    
    def __init__(self, credentials: Dict[str, Any]):
        """Initialize the Adobe Analytics integration.
        
        Args:
            credentials: Adobe Analytics authentication credentials
        """
        super().__init__("adobe_analytics", credentials)
        self.client = None
        self.company_id = credentials.get('company_id')
        self.report_suite_id = credentials.get('report_suite_id')
        self.client_id = credentials.get('client_id')
        self.client_secret = credentials.get('client_secret')
        self.technical_account_id = credentials.get('technical_account_id')
        self.organization_id = credentials.get('organization_id')
        self.private_key = credentials.get('private_key')
        self.token_expiry = None
        
        # Initialize token
        self._get_access_token()
    
    def _get_access_token(self) -> str:
        """Get an access token for Adobe Analytics API.
        
        Returns:
            Access token as string
        
        Raises:
            IntegrationError: If authentication fails
        """
        # If we already have a valid token, return it
        if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.access_token
        
        # JWT authentication for Adobe IO
        try:
            if self.client_id and self.technical_account_id and self.organization_id and self.private_key:
                # Create JWT payload
                expiration_time = int(time.time()) + 60 * 60 * 24  # 24 hour expiry
                jwt_payload = {
                    "exp": expiration_time,
                    "iss": self.organization_id,
                    "sub": self.technical_account_id,
                    "https://ims-na1.adobelogin.com/s/ent_analytics_bulk_ingest_sdk": True,
                    "aud": f"https://ims-na1.adobelogin.com/c/{self.client_id}"
                }
                
                # Sign JWT with private key
                try:
                    # If private key is a string, use it directly
                    jwt_token = jwt.encode(
                        jwt_payload,
                        self.private_key,
                        algorithm="RS256"
                    )
                except:
                    # If decoding fails, try loading from file
                    try:
                        with open(self.private_key, "r") as f:
                            private_key_data = f.read()
                        jwt_token = jwt.encode(
                            jwt_payload,
                            private_key_data,
                            algorithm="RS256"
                        )
                    except:
                        # If still fails, it's an error
                        raise IntegrationError("Invalid private key for Adobe Analytics")
                
                # Exchange JWT for access token
                token_data = {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "jwt_token": jwt_token
                }
                
                token_response = requests.post(
                    "https://ims-na1.adobelogin.com/ims/exchange/jwt",
                    data=token_data
                )
                
                if token_response.status_code != 200:
                    raise IntegrationError(f"Adobe API token error: {token_response.status_code} - {token_response.text}")
                
                token_json = token_response.json()
                self.access_token = token_json.get("access_token")
                expires_in = token_json.get("expires_in", 86400)
                self.token_expiry = datetime.now() + timedelta(seconds=expires_in)
                
                return self.access_token
            elif self.access_token:
                # Use existing token if provided
                return self.access_token
            else:
                raise IntegrationError("Missing authentication credentials for Adobe Analytics")
        except Exception as e:
            logger.error(f"Error getting Adobe Analytics access token: {e}")
            raise IntegrationError(f"Authentication failed: {str(e)}")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers for Adobe Analytics API calls.
        
        Returns:
            Dict containing headers for the request
        """
        access_token = self._get_access_token()
        
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {access_token}",
            "x-api-key": self.client_id,
            "x-proxy-global-company-id": self.company_id
        }
        
        return headers
    
    def _validate_required_parameters(self) -> None:
        """Validate that required parameters are available."""
        if not self.company_id:
            raise IntegrationError("Company ID is required for Adobe Analytics")
        
        if not self.report_suite_id:
            raise IntegrationError("Report Suite ID is required for Adobe Analytics")
    
    def get_metrics(self, start_date: str, end_date: str, metrics: List[str], 
                  dimensions: Optional[List[str]] = None, 
                  filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Get metrics from Adobe Analytics.
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            metrics: List of metrics to retrieve
            dimensions: Optional list of dimensions to segment by
            filters: Optional filters to apply
            
        Returns:
            Dict containing metrics data
        """
        # Validate required parameters
        self._validate_required_parameters()
        
        def execute_request():
            # Create the base report request
            request_data = {
                "rsid": self.report_suite_id,
                "globalFilters": {
                    "dateRange": {
                        "startDate": start_date,
                        "endDate": end_date
                    }
                },
                "metricContainer": {
                    "metrics": [{"id": metric} for metric in metrics]
                },
                "dimension": dimensions[0] if dimensions and len(dimensions) > 0 else "dateRange",
                "settings": {
                    "countRepeatInstances": True,
                    "limit": 50,
                    "page": 0,
                    "dimensionSort": "asc"
                }
            }
            
            # Add additional dimensions if provided
            if dimensions and len(dimensions) > 1:
                request_data["metricContainer"]["metricFilters"] = []
                request_data["metricContainer"]["breakdown"] = {
                    "dimensions": [{"id": dim} for dim in dimensions[1:]]
                }
            
            # Add filters if provided
            if filters:
                # This is a simplified implementation
                # Adobe Analytics has complex filtering options
                if "segmentId" in filters:
                    request_data["globalFilters"]["segmentId"] = filters["segmentId"]
            
            # Execute the report request
            response = requests.post(
                f"https://analytics.adobe.io/api/{self.company_id}/reports",
                headers=self._get_headers(),
                json=request_data
            )
            
            if response.status_code != 200:
                raise IntegrationError(f"Adobe Analytics API Error: {response.status_code} - {response.text}")
            
            # Process and format the response
            result = response.json()
            
            # Format the data for consistency across platforms
            formatted_data = {
                "report_data": []
            }
            
            # Extract rows
            for row in result.get("rows", []):
                row_data = {}
                
                # Add dimension value
                dimension_name = dimensions[0] if dimensions and len(dimensions) > 0 else "date"
                row_data[dimension_name] = row.get("value")
                
                # Add metrics
                for i, metric_value in enumerate(row.get("data", [])):
                    row_data[metrics[i]] = metric_value
                
                # Add breakdown dimensions if available
                if "breakdown" in row:
                    for breakdown_item in row.get("breakdown", []):
                        breakdown_row = row_data.copy()
                        
                        # Add breakdown dimension value
                        if dimensions and len(dimensions) > 1:
                            breakdown_row[dimensions[1]] = breakdown_item.get("value")
                        
                        # Add breakdown metrics
                        for i, breakdown_metric in enumerate(breakdown_item.get("data", [])):
                            breakdown_row[metrics[i]] = breakdown_metric
                        
                        formatted_data["report_data"].append(breakdown_row)
                else:
                    formatted_data["report_data"].append(row_data)
            
            # Add metadata
            formatted_data["row_count"] = len(formatted_data["report_data"])
            formatted_data["start_date"] = start_date
            formatted_data["end_date"] = end_date
            
            return self.format_success_response(**formatted_data)
        
        return self.safe_request(
            execute_request,
            "Error retrieving Adobe Analytics metrics"
        )
    
    def get_realtime_metrics(self, metrics: List[str], 
                           dimensions: Optional[List[str]] = None) -> Dict[str, Any]:
        """Get real-time metrics from Adobe Analytics.
        
        Args:
            metrics: List of metrics to retrieve
            dimensions: Optional list of dimensions to segment by
            
        Returns:
            Dict containing real-time metrics data
        """
        # Validate required parameters
        self._validate_required_parameters()
        
        def execute_request():
            # Create the base real-time report request
            request_data = {
                "rsid": self.report_suite_id,
                "globalFilters": [],
                "metricContainer": {
                    "metrics": [{"id": metric} for metric in metrics]
                },
                "dimension": dimensions[0] if dimensions and len(dimensions) > 0 else "pageurl",
                "settings": {
                    "limit": 50,
                    "page": 0,
                    "dimensionSort": "desc"
                }
            }
            
            # Execute the report request
            response = requests.post(
                f"https://analytics.adobe.io/api/{self.company_id}/reports/realtime",
                headers=self._get_headers(),
                json=request_data
            )
            
            if response.status_code != 200:
                raise IntegrationError(f"Adobe Analytics API Error: {response.status_code} - {response.text}")
            
            # Process and format the response
            result = response.json()
            
            # Format the data for consistency across platforms
            formatted_data = {
                "report_data": []
            }
            
            # Extract rows
            for row in result.get("rows", []):
                row_data = {}
                
                # Add dimension value
                dimension_name = dimensions[0] if dimensions and len(dimensions) > 0 else "pageurl"
                row_data[dimension_name] = row.get("value")
                
                # Add metrics
                for i, metric_value in enumerate(row.get("data", [])):
                    row_data[metrics[i]] = metric_value
                
                formatted_data["report_data"].append(row_data)
            
            # Add metadata
            formatted_data["row_count"] = len(formatted_data["report_data"])
            formatted_data["timestamp"] = datetime.now().isoformat()
            
            return self.format_success_response(**formatted_data)
        
        return self.safe_request(
            execute_request,
            "Error retrieving Adobe Analytics real-time metrics"
        )
    
    def get_top_pages(self, start_date: str, end_date: str, 
                    limit: int = 10) -> Dict[str, Any]:
        """Get top pages by views from Adobe Analytics.
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            limit: Maximum number of pages to return
            
        Returns:
            Dict containing top pages data
        """
        # Validate required parameters
        self._validate_required_parameters()
        
        def execute_request():
            # Create the top pages report request
            request_data = {
                "rsid": self.report_suite_id,
                "globalFilters": {
                    "dateRange": {
                        "startDate": start_date,
                        "endDate": end_date
                    }
                },
                "metricContainer": {
                    "metrics": [
                        {"id": "pageviews"},
                        {"id": "timespentpervisit"},
                        {"id": "bouncerate"}
                    ]
                },
                "dimension": "page",
                "settings": {
                    "limit": limit,
                    "page": 0,
                    "dimensionSort": "desc",
                    "countRepeatInstances": True
                }
            }
            
            # Execute the report request
            response = requests.post(
                f"https://analytics.adobe.io/api/{self.company_id}/reports",
                headers=self._get_headers(),
                json=request_data
            )
            
            if response.status_code != 200:
                raise IntegrationError(f"Adobe Analytics API Error: {response.status_code} - {response.text}")
            
            # Process and format the response
            result = response.json()
            
            # Format the data
            top_pages = []
            
            # Extract rows
            for row in result.get("rows", []):
                page_data = {
                    "page_name": row.get("value"),
                    "views": row.get("data", [0])[0],
                    "time_spent": row.get("data", [0, 0])[1],
                    "bounce_rate": row.get("data", [0, 0, 0])[2]
                }
                top_pages.append(page_data)
            
            return self.format_success_response(
                top_pages=top_pages,
                start_date=start_date,
                end_date=end_date,
                total_pages=len(top_pages)
            )
        
        return self.safe_request(
            execute_request,
            "Error retrieving Adobe Analytics top pages"
        )
    
    def get_user_demographics(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """Get user demographics data from Adobe Analytics.
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            
        Returns:
            Dict containing user demographics data
        """
        # Validate required parameters
        self._validate_required_parameters()
        
        def execute_request():
            # Define demographic dimensions to query
            demographic_dimensions = ["geodma", "mobiledevicetype", "browser"]
            demographics = {}
            
            # Run a report for each demographic dimension
            for dimension in demographic_dimensions:
                # Create the demographic report request
                request_data = {
                    "rsid": self.report_suite_id,
                    "globalFilters": {
                        "dateRange": {
                            "startDate": start_date,
                            "endDate": end_date
                        }
                    },
                    "metricContainer": {
                        "metrics": [
                            {"id": "visits"}
                        ]
                    },
                    "dimension": dimension,
                    "settings": {
                        "limit": 10,
                        "page": 0,
                        "dimensionSort": "desc",
                        "countRepeatInstances": True
                    }
                }
                
                # Execute the report request
                response = requests.post(
                    f"https://analytics.adobe.io/api/{self.company_id}/reports",
                    headers=self._get_headers(),
                    json=request_data
                )
                
                if response.status_code != 200:
                    raise IntegrationError(f"Adobe Analytics API Error: {response.status_code} - {response.text}")
                
                # Process and format the response
                result = response.json()
                
                # Format the data
                dimension_data = []
                
                # Extract rows
                for row in result.get("rows", []):
                    dimension_data.append({
                        "value": row.get("value"),
                        "visits": row.get("data", [0])[0]
                    })
                
                demographics[dimension] = dimension_data
            
            return self.format_success_response(
                demographics=demographics,
                start_date=start_date,
                end_date=end_date
            )
        
        return self.safe_request(
            execute_request,
            "Error retrieving Adobe Analytics user demographics"
        )
    
    def get_traffic_sources(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """Get traffic sources data from Adobe Analytics.
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            
        Returns:
            Dict containing traffic sources data
        """
        # Validate required parameters
        self._validate_required_parameters()
        
        def execute_request():
            # Create the traffic sources report request
            request_data = {
                "rsid": self.report_suite_id,
                "globalFilters": {
                    "dateRange": {
                        "startDate": start_date,
                        "endDate": end_date
                    }
                },
                "metricContainer": {
                    "metrics": [
                        {"id": "visits"},
                        {"id": "orders"},
                        {"id": "bouncerate"}
                    ]
                },
                "dimension": "referrer",
                "settings": {
                    "limit": 20,
                    "page": 0,
                    "dimensionSort": "desc",
                    "countRepeatInstances": True
                }
            }
            
            # Execute the report request
            response = requests.post(
                f"https://analytics.adobe.io/api/{self.company_id}/reports",
                headers=self._get_headers(),
                json=request_data
            )
            
            if response.status_code != 200:
                raise IntegrationError(f"Adobe Analytics API Error: {response.status_code} - {response.text}")
            
            # Process and format the response
            result = response.json()
            
            # Format the data
            traffic_sources = []
            
            # Extract rows
            for row in result.get("rows", []):
                source_data = {
                    "source": row.get("value"),
                    "visits": row.get("data", [0])[0],
                    "orders": row.get("data", [0, 0])[1],
                    "bounce_rate": row.get("data", [0, 0, 0])[2]
                }
                traffic_sources.append(source_data)
            
            return self.format_success_response(
                traffic_sources=traffic_sources,
                start_date=start_date,
                end_date=end_date,
                total_sources=len(traffic_sources)
            )
        
        return self.safe_request(
            execute_request,
            "Error retrieving Adobe Analytics traffic sources"
        )
    
    def get_custom_report(self, report_config: Dict[str, Any]) -> Dict[str, Any]:
        """Run a custom report with flexible configuration in Adobe Analytics.
        
        Args:
            report_config: Report configuration data including:
                - start_date: Start date in YYYY-MM-DD format
                - end_date: End date in YYYY-MM-DD format
                - metrics: List of metrics to retrieve
                - dimensions: Optional list of dimensions to segment by
                - filters: Optional filters to apply
                - limit: Optional maximum number of rows to return
                - page: Optional page number for pagination
                - sort_by: Optional sorting configuration
            
        Returns:
            Dict containing custom report data
        """
        # Validate required parameters
        self._validate_required_parameters()
        
        def execute_request():
            # Extract configuration parameters
            start_date = report_config.get("start_date", (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"))
            end_date = report_config.get("end_date", datetime.now().strftime("%Y-%m-%d"))
            metrics = report_config.get("metrics", ["visits"])
            dimensions = report_config.get("dimensions", ["dateRange"])
            filters = report_config.get("filters", {})
            limit = report_config.get("limit", 50)
            page = report_config.get("page", 0)
            sort_by = report_config.get("sort_by", {})
            
            # Create the base report request
            request_data = {
                "rsid": self.report_suite_id,
                "globalFilters": {
                    "dateRange": {
                        "startDate": start_date,
                        "endDate": end_date
                    }
                },
                "metricContainer": {
                    "metrics": [{"id": metric} for metric in metrics]
                },
                "dimension": dimensions[0] if dimensions and len(dimensions) > 0 else "dateRange",
                "settings": {
                    "limit": limit,
                    "page": page,
                    "dimensionSort": sort_by.get("order", "desc"),
                    "countRepeatInstances": True
                }
            }
            
            # Add additional dimensions if provided
            if dimensions and len(dimensions) > 1:
                request_data["metricContainer"]["metricFilters"] = []
                request_data["metricContainer"]["breakdown"] = {
                    "dimensions": [{"id": dim} for dim in dimensions[1:]]
                }
            
            # Add filters if provided
            if "segmentId" in filters:
                request_data["globalFilters"]["segmentId"] = filters["segmentId"]
            
            # Execute the report request
            response = requests.post(
                f"https://analytics.adobe.io/api/{self.company_id}/reports",
                headers=self._get_headers(),
                json=request_data
            )
            
            if response.status_code != 200:
                raise IntegrationError(f"Adobe Analytics API Error: {response.status_code} - {response.text}")
            
            # Process and format the response
            result = response.json()
            
            # Format the data for consistency across platforms
            formatted_data = {
                "report_data": []
            }
            
            # Extract rows
            for row in result.get("rows", []):
                row_data = {}
                
                # Add dimension value
                dimension_name = dimensions[0] if dimensions and len(dimensions) > 0 else "date"
                row_data[dimension_name] = row.get("value")
                
                # Add metrics
                for i, metric_value in enumerate(row.get("data", [])):
                    row_data[metrics[i]] = metric_value
                
                # Add breakdown dimensions if available
                if "breakdown" in row:
                    for breakdown_item in row.get("breakdown", []):
                        breakdown_row = row_data.copy()
                        
                        # Add breakdown dimension value
                        if dimensions and len(dimensions) > 1:
                            breakdown_row[dimensions[1]] = breakdown_item.get("value")
                        
                        # Add breakdown metrics
                        for i, breakdown_metric in enumerate(breakdown_item.get("data", [])):
                            breakdown_row[metrics[i]] = breakdown_metric
                        
                        formatted_data["report_data"].append(breakdown_row)
                else:
                    formatted_data["report_data"].append(row_data)
            
            # Add metadata
            formatted_data["row_count"] = len(formatted_data["report_data"])
            formatted_data["start_date"] = start_date
            formatted_data["end_date"] = end_date
            formatted_data["total_rows"] = result.get("totalPages", 1) * limit
            
            return self.format_success_response(**formatted_data)
        
        return self.safe_request(
            execute_request,
            "Error running custom Adobe Analytics report"
        )
    
    def check_health(self) -> Dict[str, Any]:
        """Check Adobe Analytics API health.
        
        Returns:
            Dict containing health status information
        """
        try:
            # Try to get an access token
            token = self._get_access_token()
            
            # Get company info to verify API access
            start_time = time.time()
            response = requests.get(
                f"https://analytics.adobe.io/api/{self.company_id}/reportSuites",
                headers=self._get_headers(),
                params={"limit": 1}
            )
            end_time = time.time()
            
            response_time_ms = int((end_time - start_time) * 1000)
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "platform": self.platform,
                    "response_time_ms": response_time_ms,
                    "details": "API is responding normally",
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "status": "unhealthy",
                    "platform": self.platform,
                    "response_time_ms": response_time_ms,
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