"""Google Analytics 4 Integration Module.

This module provides integration with Google Analytics 4 (GA4) for
retrieving metrics, reports, and insights.
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import time
import re

import requests
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest, DateRange, Dimension, Metric, 
    Filter, FilterExpression, OrderBy, RunRealtimeReportRequest
)
from google.oauth2.service_account import Credentials
from google.oauth2 import credentials
from google.auth.transport.requests import Request
from google.auth.exceptions import RefreshError

from src.agents.integrations.analytics.base import AnalyticsIntegration, IntegrationError

logger = logging.getLogger(__name__)

class GoogleAnalytics4Integration(AnalyticsIntegration):
    """Google Analytics 4 integration using the GA4 Data API."""
    
    def __init__(self, credentials: Dict[str, Any]):
        """Initialize the Google Analytics 4 integration.
        
        Args:
            credentials: Google Analytics 4 authentication credentials
        """
        super().__init__("google_analytics", credentials)
        self.client = None
        self.oauth_credentials = None
        self.service_account_json = credentials.get('service_account_json')
        self.client_id = credentials.get('client_id')
        self.client_secret = credentials.get('client_secret')
        self._initialize_client()
    
    def _initialize_client(self) -> None:
        """Initialize the Google Analytics Data API client.
        
        This method tries different authentication methods:
        1. Service account JSON if available
        2. OAuth2 credentials if available
        """
        try:
            # Try service account authentication first
            if self.service_account_json:
                # If provided as a string, convert to dict
                if isinstance(self.service_account_json, str):
                    try:
                        service_account_info = json.loads(self.service_account_json)
                    except json.JSONDecodeError:
                        # Assume it's a file path
                        with open(self.service_account_json, "r") as f:
                            service_account_info = json.load(f)
                else:
                    service_account_info = self.service_account_json
                
                # Create credentials from service account info
                service_account_creds = Credentials.from_service_account_info(
                    service_account_info,
                    scopes=["https://www.googleapis.com/auth/analytics.readonly"]
                )
                
                self.client = BetaAnalyticsDataClient(credentials=service_account_creds)
                return
            
            # Try OAuth2 authentication if service account not available
            if self.access_token:
                # Check if token is expired and needs refresh
                if self.refresh_token and self.client_id and self.client_secret:
                    self.oauth_credentials = credentials.Credentials(
                        token=self.access_token,
                        refresh_token=self.refresh_token,
                        token_uri="https://oauth2.googleapis.com/token",
                        client_id=self.client_id,
                        client_secret=self.client_secret,
                        scopes=["https://www.googleapis.com/auth/analytics.readonly"]
                    )
                    
                    # Refresh token if expired
                    if not self.oauth_credentials.valid:
                        self.oauth_credentials.refresh(Request())
                        # Update access token in our state
                        self.access_token = self.oauth_credentials.token
                    
                    self.client = BetaAnalyticsDataClient(credentials=self.oauth_credentials)
                    return
                else:
                    # Simple access token without refresh capability
                    self.oauth_credentials = credentials.Credentials(
                        token=self.access_token,
                        scopes=["https://www.googleapis.com/auth/analytics.readonly"]
                    )
                    
                    self.client = BetaAnalyticsDataClient(credentials=self.oauth_credentials)
                    return
            
            # If no authentication method worked, raise an error
            raise IntegrationError("No valid authentication credentials provided for Google Analytics")
            
        except Exception as e:
            logger.error(f"Error initializing Google Analytics client: {e}")
            raise IntegrationError(f"Failed to initialize Google Analytics client: {str(e)}")
    
    def _validate_property_id(self) -> None:
        """Validate that property ID is available and in the correct format."""
        if not self.property_id:
            raise IntegrationError("Property ID is required for Google Analytics 4")
        
        # Ensure property ID format (should start with "properties/")
        if not self.property_id.startswith("properties/"):
            self.property_id = f"properties/{self.property_id}"
    
    def _create_date_range(self, start_date: str, end_date: str) -> DateRange:
        """Create a DateRange object for GA4 queries.
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            
        Returns:
            DateRange object for GA4 queries
        """
        return DateRange(start_date=start_date, end_date=end_date)
    
    def _create_dimensions(self, dimensions: List[str]) -> List[Dimension]:
        """Create a list of Dimension objects for GA4 queries.
        
        Args:
            dimensions: List of dimension names
            
        Returns:
            List of Dimension objects for GA4 queries
        """
        return [Dimension(name=dim) for dim in dimensions]
    
    def _create_metrics(self, metrics: List[str]) -> List[Metric]:
        """Create a list of Metric objects for GA4 queries.
        
        Args:
            metrics: List of metric names
            
        Returns:
            List of Metric objects for GA4 queries
        """
        return [Metric(name=metric) for metric in metrics]
    
    def _create_filter_expression(self, filters: Dict[str, Any]) -> FilterExpression:
        """Create a FilterExpression object for GA4 queries.
        
        Args:
            filters: Dictionary of filter definitions
            
        Returns:
            FilterExpression object for GA4 queries
        """
        # This is a simplified implementation
        # A full implementation would handle complex filter expressions
        if "dimension_name" in filters and "value" in filters:
            filter_value = filters["value"]
            dimension_filter = Filter(
                field_name=filters["dimension_name"],
                string_filter=Filter.StringFilter(
                    value=str(filter_value),
                    match_type=Filter.StringFilter.MatchType.EXACT
                )
            )
            return FilterExpression(filter=dimension_filter)
        
        # If not a simple filter, return None
        return None
    
    def get_metrics(self, start_date: str, end_date: str, metrics: List[str], 
                  dimensions: Optional[List[str]] = None, 
                  filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Get metrics from Google Analytics 4.
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            metrics: List of metrics to retrieve
            dimensions: Optional list of dimensions to segment by
            filters: Optional filters to apply
            
        Returns:
            Dict containing metrics data
        """
        # Check required credentials
        if not self.client:
            self._initialize_client()
        
        # Validate property ID
        self._validate_property_id()
        
        def execute_request():
            # Create the base report request
            request = RunReportRequest(
                property=self.property_id,
                date_ranges=[self._create_date_range(start_date, end_date)],
                metrics=self._create_metrics(metrics)
            )
            
            # Add dimensions if provided
            if dimensions:
                request.dimensions = self._create_dimensions(dimensions)
            
            # Add filters if provided
            if filters:
                filter_expr = self._create_filter_expression(filters)
                if filter_expr:
                    request.dimension_filter = filter_expr
            
            # Execute the report request
            response = self.client.run_report(request)
            
            # Process and format the response
            result = {
                "report_data": []
            }
            
            # Extract dimension and metric headers
            dim_headers = [header.name for header in response.dimension_headers]
            metric_headers = [header.name for header in response.metric_headers]
            
            # Process rows
            for row in response.rows:
                row_data = {}
                
                # Add dimensions
                for i, dimension_value in enumerate(row.dimension_values):
                    row_data[dim_headers[i]] = dimension_value.value
                
                # Add metrics
                for i, metric_value in enumerate(row.metric_values):
                    row_data[metric_headers[i]] = metric_value.value
                
                result["report_data"].append(row_data)
            
            # Add metadata
            result["row_count"] = len(response.rows)
            result["start_date"] = start_date
            result["end_date"] = end_date
            
            return self.format_success_response(**result)
        
        return self.safe_request(
            execute_request,
            "Error retrieving Google Analytics metrics"
        )
    
    def get_realtime_metrics(self, metrics: List[str], 
                           dimensions: Optional[List[str]] = None) -> Dict[str, Any]:
        """Get real-time metrics from Google Analytics 4.
        
        Args:
            metrics: List of metrics to retrieve
            dimensions: Optional list of dimensions to segment by
            
        Returns:
            Dict containing real-time metrics data
        """
        # Check required credentials
        if not self.client:
            self._initialize_client()
        
        # Validate property ID
        self._validate_property_id()
        
        def execute_request():
            # Create the base realtime report request
            request = RunRealtimeReportRequest(
                property=self.property_id,
                metrics=self._create_metrics(metrics)
            )
            
            # Add dimensions if provided
            if dimensions:
                request.dimensions = self._create_dimensions(dimensions)
            
            # Execute the report request
            response = self.client.run_realtime_report(request)
            
            # Process and format the response
            result = {
                "report_data": []
            }
            
            # Extract dimension and metric headers
            dim_headers = [header.name for header in response.dimension_headers]
            metric_headers = [header.name for header in response.metric_headers]
            
            # Process rows
            for row in response.rows:
                row_data = {}
                
                # Add dimensions
                for i, dimension_value in enumerate(row.dimension_values):
                    row_data[dim_headers[i]] = dimension_value.value
                
                # Add metrics
                for i, metric_value in enumerate(row.metric_values):
                    row_data[metric_headers[i]] = metric_value.value
                
                result["report_data"].append(row_data)
            
            # Add metadata
            result["row_count"] = len(response.rows)
            result["timestamp"] = datetime.now().isoformat()
            
            return self.format_success_response(**result)
        
        return self.safe_request(
            execute_request,
            "Error retrieving Google Analytics real-time metrics"
        )
    
    def get_top_pages(self, start_date: str, end_date: str, 
                    limit: int = 10) -> Dict[str, Any]:
        """Get top pages by views from Google Analytics 4.
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            limit: Maximum number of pages to return
            
        Returns:
            Dict containing top pages data
        """
        # Check required credentials
        if not self.client:
            self._initialize_client()
        
        # Validate property ID
        self._validate_property_id()
        
        def execute_request():
            # Create the report request for top pages
            request = RunReportRequest(
                property=self.property_id,
                date_ranges=[self._create_date_range(start_date, end_date)],
                dimensions=[Dimension(name="pagePath")],
                metrics=[
                    Metric(name="screenPageViews"),
                    Metric(name="averageSessionDuration"),
                    Metric(name="bounceRate")
                ],
                limit=limit,
                order_bys=[OrderBy(
                    metric=OrderBy.MetricOrderBy(metric_name="screenPageViews"),
                    desc=True
                )]
            )
            
            # Execute the report request
            response = self.client.run_report(request)
            
            # Process and format the response
            top_pages = []
            
            for row in response.rows:
                page_data = {
                    "page_path": row.dimension_values[0].value,
                    "views": row.metric_values[0].value,
                    "avg_session_duration": row.metric_values[1].value,
                    "bounce_rate": row.metric_values[2].value
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
            "Error retrieving Google Analytics top pages"
        )
    
    def get_user_demographics(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """Get user demographics data from Google Analytics 4.
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            
        Returns:
            Dict containing user demographics data
        """
        # Check required credentials
        if not self.client:
            self._initialize_client()
        
        # Validate property ID
        self._validate_property_id()
        
        def execute_request():
            # Define demographic dimensions to query
            demographic_dimensions = ["country", "deviceCategory", "browser"]
            demographics = {}
            
            # Run a report for each demographic dimension
            for dimension in demographic_dimensions:
                request = RunReportRequest(
                    property=self.property_id,
                    date_ranges=[self._create_date_range(start_date, end_date)],
                    dimensions=[Dimension(name=dimension)],
                    metrics=[Metric(name="activeUsers")],
                    order_bys=[OrderBy(
                        metric=OrderBy.MetricOrderBy(metric_name="activeUsers"),
                        desc=True
                    )]
                )
                
                response = self.client.run_report(request)
                
                dimension_data = []
                for row in response.rows:
                    dimension_data.append({
                        "value": row.dimension_values[0].value,
                        "users": row.metric_values[0].value
                    })
                
                demographics[dimension] = dimension_data
            
            return self.format_success_response(
                demographics=demographics,
                start_date=start_date,
                end_date=end_date
            )
        
        return self.safe_request(
            execute_request,
            "Error retrieving Google Analytics user demographics"
        )
    
    def get_traffic_sources(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """Get traffic sources data from Google Analytics 4.
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            
        Returns:
            Dict containing traffic sources data
        """
        # Check required credentials
        if not self.client:
            self._initialize_client()
        
        # Validate property ID
        self._validate_property_id()
        
        def execute_request():
            # Create the report request for traffic sources
            request = RunReportRequest(
                property=self.property_id,
                date_ranges=[self._create_date_range(start_date, end_date)],
                dimensions=[
                    Dimension(name="sessionSource"),
                    Dimension(name="sessionMedium")
                ],
                metrics=[
                    Metric(name="sessions"),
                    Metric(name="conversions"),
                    Metric(name="engagementRate")
                ],
                order_bys=[OrderBy(
                    metric=OrderBy.MetricOrderBy(metric_name="sessions"),
                    desc=True
                )]
            )
            
            # Execute the report request
            response = self.client.run_report(request)
            
            # Process and format the response
            traffic_sources = []
            
            for row in response.rows:
                source_data = {
                    "source": row.dimension_values[0].value,
                    "medium": row.dimension_values[1].value,
                    "sessions": row.metric_values[0].value,
                    "conversions": row.metric_values[1].value,
                    "engagement_rate": row.metric_values[2].value
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
            "Error retrieving Google Analytics traffic sources"
        )
    
    def get_custom_report(self, report_config: Dict[str, Any]) -> Dict[str, Any]:
        """Run a custom report with flexible configuration in Google Analytics 4.
        
        Args:
            report_config: Report configuration data including:
                - start_date: Start date in YYYY-MM-DD format
                - end_date: End date in YYYY-MM-DD format
                - metrics: List of metrics to retrieve
                - dimensions: Optional list of dimensions to segment by
                - filters: Optional filters to apply
                - limit: Optional maximum number of rows to return
                - offset: Optional offset for pagination
                - order_by: Optional ordering configuration
            
        Returns:
            Dict containing custom report data
        """
        # Check required credentials
        if not self.client:
            self._initialize_client()
        
        # Validate property ID
        self._validate_property_id()
        
        def execute_request():
            # Extract configuration parameters
            start_date = report_config.get("start_date", (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"))
            end_date = report_config.get("end_date", datetime.now().strftime("%Y-%m-%d"))
            metrics = report_config.get("metrics", ["activeUsers"])
            dimensions = report_config.get("dimensions", [])
            filters = report_config.get("filters")
            limit = report_config.get("limit")
            offset = report_config.get("offset")
            
            # Create the base report request
            request = RunReportRequest(
                property=self.property_id,
                date_ranges=[self._create_date_range(start_date, end_date)],
                metrics=self._create_metrics(metrics)
            )
            
            # Add dimensions if provided
            if dimensions:
                request.dimensions = self._create_dimensions(dimensions)
            
            # Add filters if provided
            if filters:
                filter_expr = self._create_filter_expression(filters)
                if filter_expr:
                    request.dimension_filter = filter_expr
            
            # Add limit if provided
            if limit:
                request.limit = int(limit)
            
            # Add offset if provided
            if offset:
                request.offset = int(offset)
            
            # Add ordering if provided
            order_by_config = report_config.get("order_by")
            if order_by_config:
                order_by_items = []
                
                for item in order_by_config if isinstance(order_by_config, list) else [order_by_config]:
                    field_name = item.get("field_name")
                    desc = item.get("desc", False)
                    
                    if field_name:
                        # Check if it's a metric or dimension
                        if field_name in metrics:
                            order_by_items.append(OrderBy(
                                metric=OrderBy.MetricOrderBy(metric_name=field_name),
                                desc=desc
                            ))
                        elif field_name in dimensions:
                            order_by_items.append(OrderBy(
                                dimension=OrderBy.DimensionOrderBy(dimension_name=field_name),
                                desc=desc
                            ))
                
                if order_by_items:
                    request.order_bys = order_by_items
            
            # Execute the report request
            response = self.client.run_report(request)
            
            # Process and format the response
            result = {
                "report_data": []
            }
            
            # Extract dimension and metric headers
            dim_headers = [header.name for header in response.dimension_headers]
            metric_headers = [header.name for header in response.metric_headers]
            
            # Process rows
            for row in response.rows:
                row_data = {}
                
                # Add dimensions
                for i, dimension_value in enumerate(row.dimension_values):
                    row_data[dim_headers[i]] = dimension_value.value
                
                # Add metrics
                for i, metric_value in enumerate(row.metric_values):
                    row_data[metric_headers[i]] = metric_value.value
                
                result["report_data"].append(row_data)
            
            # Add metadata
            result["row_count"] = len(response.rows)
            result["start_date"] = start_date
            result["end_date"] = end_date
            result["total_rows"] = response.row_count
            
            return self.format_success_response(**result)
        
        return self.safe_request(
            execute_request,
            "Error running custom Google Analytics report"
        )
    
    def check_health(self) -> Dict[str, Any]:
        """Check Google Analytics 4 API health.
        
        Returns:
            Dict containing health status information
        """
        try:
            # Re-initialize client if needed
            if not self.client:
                self._initialize_client()
            
            # Validate property ID
            self._validate_property_id()
            
            # Try a simple request
            start_time = time.time()
            request = RunReportRequest(
                property=self.property_id,
                date_ranges=[self._create_date_range(
                    (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
                    datetime.now().strftime("%Y-%m-%d")
                )],
                metrics=[Metric(name="activeUsers")],
                limit=1
            )
            
            response = self.client.run_report(request)
            end_time = time.time()
            
            response_time_ms = int((end_time - start_time) * 1000)
            
            return {
                "status": "healthy",
                "platform": self.platform,
                "response_time_ms": response_time_ms,
                "details": "API is responding normally",
                "timestamp": datetime.now().isoformat()
            }
        except RefreshError:
            return {
                "status": "unhealthy",
                "platform": self.platform,
                "error": "OAuth token refresh failed",
                "details": "Authentication token needs to be renewed",
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