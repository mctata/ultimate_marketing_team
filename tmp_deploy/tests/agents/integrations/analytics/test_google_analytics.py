"""Unit tests for the Google Analytics integration."""

import pytest
import json
import responses
from unittest.mock import patch, MagicMock, call
import datetime

from src.agents.integrations.analytics.google_analytics import GoogleAnalyticsIntegration
from src.core.exceptions import IntegrationError


class TestGoogleAnalyticsIntegration:
    """Test suite for the Google Analytics integration."""

    @pytest.fixture
    def credentials(self):
        """Sample credentials for testing."""
        return {
            "view_id": "12345678",
            "client_email": "test-service-account@project.iam.gserviceaccount.com",
            "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEtest\n-----END PRIVATE KEY-----\n",
            "property_id": "properties/1234567"
        }

    @pytest.fixture
    def integration(self, credentials):
        """Create a Google Analytics integration instance for testing."""
        return GoogleAnalyticsIntegration(credentials)

    @pytest.fixture
    def report_request(self):
        """Sample report request for testing."""
        return {
            "date_range": {
                "start_date": "2023-01-01",
                "end_date": "2023-01-31"
            },
            "metrics": ["pageviews", "sessions", "users"],
            "dimensions": ["date", "deviceCategory"],
            "page_path": "/blog",
            "segment": "mobile_traffic"
        }

    @pytest.fixture
    def mock_ga_report_response(self):
        """Sample GA4 API response for testing."""
        return {
            "kind": "analyticsData#runReport",
            "rows": [
                {
                    "dimensionValues": [
                        {"value": "20230101"},
                        {"value": "mobile"}
                    ],
                    "metricValues": [
                        {"value": "120"},
                        {"value": "45"},
                        {"value": "32"}
                    ]
                },
                {
                    "dimensionValues": [
                        {"value": "20230102"},
                        {"value": "desktop"}
                    ],
                    "metricValues": [
                        {"value": "250"},
                        {"value": "80"},
                        {"value": "65"}
                    ]
                }
            ],
            "dimensionHeaders": [
                {"name": "date"},
                {"name": "deviceCategory"}
            ],
            "metricHeaders": [
                {"name": "pageviews"},
                {"name": "sessions"},
                {"name": "users"}
            ],
            "rowCount": 2,
            "metadata": {
                "currencyCode": "USD",
                "timeZone": "America/Los_Angeles"
            }
        }

    def test_initialization(self, credentials, integration):
        """Test proper initialization of the integration."""
        assert integration.platform == "google_analytics"
        assert integration.credentials == credentials
        assert integration.property_id == credentials["property_id"]
        assert hasattr(integration, 'initialize_client')

    @patch('src.agents.integrations.analytics.google_analytics.build')
    def test_initialize_client(self, mock_build, integration):
        """Test initialization of the GA4 client."""
        mock_client = MagicMock()
        mock_build.return_value = mock_client
        
        integration.initialize_client()
        
        # Verify the Google API client was built with correct parameters
        mock_build.assert_called_once()
        assert mock_build.call_args[0][0] == "analyticsdata"
        assert mock_build.call_args[0][1] == "v1beta"
        
        # Verify the client was stored
        assert integration.client == mock_client

    @responses.activate
    @patch('src.agents.integrations.analytics.google_analytics.GoogleAnalyticsIntegration.initialize_client')
    def test_check_health_success(self, mock_initialize, integration):
        """Test the health check with a successful response."""
        # Mock the client methods
        mock_client = MagicMock()
        mock_properties = MagicMock()
        mock_properties.get.return_value.execute.return_value = {"displayName": "Test Property"}
        mock_client.properties.return_value = mock_properties
        integration.client = mock_client
        
        health_status = integration.check_health()
        
        assert health_status["status"] == "ok"
        assert "response_time" in health_status
        assert health_status["message"] == "Google Analytics API connection successful"
        assert "Test Property" in health_status["details"]

    @patch('src.agents.integrations.analytics.google_analytics.GoogleAnalyticsIntegration.initialize_client')
    def test_check_health_failure(self, mock_initialize, integration):
        """Test the health check with a failed response."""
        # Mock initialization to raise an exception
        mock_initialize.side_effect = Exception("Invalid credentials")
        
        health_status = integration.check_health()
        
        assert health_status["status"] == "error"
        assert "response_time" in health_status
        assert "Invalid credentials" in health_status["message"]

    @patch('src.agents.integrations.analytics.google_analytics.GoogleAnalyticsIntegration.initialize_client')
    def test_get_report_success(self, mock_initialize, integration, report_request, mock_ga_report_response):
        """Test retrieving a GA4 report successfully."""
        # Mock the client methods
        mock_client = MagicMock()
        mock_reports = MagicMock()
        mock_reports.runReport.return_value.execute.return_value = mock_ga_report_response
        mock_client.properties.return_value = mock_reports
        integration.client = mock_client
        
        result = integration.get_report(report_request)
        
        assert result["success"] is True
        assert result["message"] == "Report retrieved successfully"
        assert len(result["data"]["rows"]) == 2
        
        # Verify data transformation
        transformed_rows = result["data"]["rows"]
        assert transformed_rows[0]["date"] == "20230101"
        assert transformed_rows[0]["deviceCategory"] == "mobile"
        assert transformed_rows[0]["pageviews"] == "120"
        assert transformed_rows[0]["sessions"] == "45"
        assert transformed_rows[0]["users"] == "32"

    @patch('src.agents.integrations.analytics.google_analytics.GoogleAnalyticsIntegration.initialize_client')
    def test_get_report_failure(self, mock_initialize, integration, report_request):
        """Test retrieving a GA4 report with a failure."""
        # Mock the client methods to raise an exception
        mock_client = MagicMock()
        mock_reports = MagicMock()
        mock_reports.runReport.return_value.execute.side_effect = Exception("Invalid dimension")
        mock_client.properties.return_value = mock_reports
        integration.client = mock_client
        
        result = integration.get_report(report_request)
        
        assert result["success"] is False
        assert "Invalid dimension" in result["message"]
        assert "error" in result

    @patch('src.agents.integrations.analytics.google_analytics.GoogleAnalyticsIntegration.initialize_client')
    def test_get_realtime_data(self, mock_initialize, integration):
        """Test retrieving realtime data from GA4."""
        # Mock the client methods
        mock_client = MagicMock()
        mock_reports = MagicMock()
        
        realtime_response = {
            "rows": [
                {
                    "dimensionValues": [
                        {"value": "/home"}
                    ],
                    "metricValues": [
                        {"value": "45"}
                    ]
                },
                {
                    "dimensionValues": [
                        {"value": "/products"}
                    ],
                    "metricValues": [
                        {"value": "32"}
                    ]
                }
            ],
            "dimensionHeaders": [
                {"name": "pagePath"}
            ],
            "metricHeaders": [
                {"name": "activeUsers"}
            ]
        }
        
        mock_reports.runRealtimeReport.return_value.execute.return_value = realtime_response
        mock_client.properties.return_value = mock_reports
        integration.client = mock_client
        
        result = integration.get_realtime_data({
            "metrics": ["activeUsers"],
            "dimensions": ["pagePath"]
        })
        
        assert result["success"] is True
        assert result["message"] == "Realtime data retrieved successfully"
        assert len(result["data"]["rows"]) == 2
        assert result["data"]["rows"][0]["pagePath"] == "/home"
        assert result["data"]["rows"][0]["activeUsers"] == "45"

    @patch('src.agents.integrations.analytics.google_analytics.GoogleAnalyticsIntegration.initialize_client')
    def test_validate_request(self, mock_initialize, integration, report_request):
        """Test validation of report requests."""
        # Valid request should pass
        integration.validate_request(report_request)
        
        # Test with invalid metrics
        invalid_request = report_request.copy()
        invalid_request["metrics"] = "not_a_list"
        
        with pytest.raises(ValueError) as excinfo:
            integration.validate_request(invalid_request)
        assert "Metrics must be a list" in str(excinfo.value)
        
        # Test with invalid date range
        invalid_request = report_request.copy()
        invalid_request["date_range"] = {
            "start_date": "not-a-date",
            "end_date": "2023-01-31"
        }
        
        with pytest.raises(ValueError) as excinfo:
            integration.validate_request(invalid_request)
        assert "Invalid date format" in str(excinfo.value)

    @patch('src.agents.integrations.analytics.google_analytics.logging')
    @patch('src.agents.integrations.analytics.google_analytics.GoogleAnalyticsIntegration.initialize_client')
    def test_logging(self, mock_initialize, mock_logging, integration, report_request, mock_ga_report_response):
        """Test that operations are properly logged."""
        # Mock the client methods
        mock_client = MagicMock()
        mock_reports = MagicMock()
        mock_reports.runReport.return_value.execute.return_value = mock_ga_report_response
        mock_client.properties.return_value = mock_reports
        integration.client = mock_client
        
        integration.get_report(report_request)
        
        # Verify logging occurred
        assert mock_logging.info.call_count >= 1
        assert any("google_analytics" in str(call_args) for call_args in mock_logging.info.call_args_list)
        
    @patch('src.agents.integrations.analytics.google_analytics.GoogleAnalyticsIntegration.initialize_client')
    def test_format_data_for_response(self, mock_initialize, integration, mock_ga_report_response):
        """Test the correct formatting of GA4 API responses to a more usable format."""
        formatted_data = integration.format_data_for_response(mock_ga_report_response)
        
        assert "rows" in formatted_data
        assert "dimensionHeaders" in formatted_data
        assert "metricHeaders" in formatted_data
        
        # Check row transformation
        rows = formatted_data["rows"]
        assert len(rows) == 2
        assert rows[0]["date"] == "20230101"
        assert rows[0]["deviceCategory"] == "mobile"
        assert rows[0]["pageviews"] == "120"
        assert rows[0]["sessions"] == "45"
        assert rows[0]["users"] == "32"
        
        assert rows[1]["date"] == "20230102"
        assert rows[1]["deviceCategory"] == "desktop"
        assert rows[1]["pageviews"] == "250"
        assert rows[1]["sessions"] == "80"
        assert rows[1]["users"] == "65"