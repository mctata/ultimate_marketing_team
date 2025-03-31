"""Unit tests for the Mailchimp integration."""

import pytest
import json
import responses
from unittest.mock import patch, MagicMock, call

from src.agents.integrations.email_marketing.mailchimp import MailchimpIntegration
from src.core.exceptions import IntegrationError


class TestMailchimpIntegration:
    """Test suite for the Mailchimp integration."""

    @pytest.fixture
    def credentials(self):
        """Sample credentials for testing."""
        return {
            "api_key": "test_key-us1",
            "server": "us1"
        }

    @pytest.fixture
    def integration(self, credentials):
        """Create a Mailchimp integration instance for testing."""
        return MailchimpIntegration(credentials)

    @pytest.fixture
    def campaign_data(self):
        """Sample campaign data for testing."""
        return {
            "name": "Test Campaign",
            "subject_line": "Test Subject",
            "from_name": "Test Sender",
            "reply_to": "test@example.com",
            "list_id": "abc123",
            "template_id": "template123",
            "content": {
                "html": "<p>Test content</p>"
            }
        }

    @pytest.fixture
    def list_data(self):
        """Sample list data for testing."""
        return {
            "name": "Test List",
            "contact": {
                "company": "Test Company",
                "address1": "123 Test St",
                "city": "Test City",
                "state": "TS",
                "zip": "12345",
                "country": "US"
            },
            "permission_reminder": "You signed up for updates",
            "campaign_defaults": {
                "from_name": "Test Sender",
                "from_email": "test@example.com",
                "subject": "Test Subject",
                "language": "en"
            },
            "email_type_option": True
        }

    def test_initialization(self, credentials, integration):
        """Test proper initialization of the integration."""
        assert integration.platform == "mailchimp"
        assert integration.credentials == credentials
        assert integration.base_url == "https://us1.api.mailchimp.com/3.0"
        assert integration.headers == {
            "Content-Type": "application/json",
            "Authorization": f"apikey {credentials['api_key']}"
        }

    @responses.activate
    def test_check_health_success(self, integration):
        """Test the health check with a successful response."""
        # Mock the ping endpoint response
        responses.add(
            responses.GET,
            f"{integration.base_url}/ping",
            json={"health_status": "Everything's Chimpy!"},
            status=200
        )

        health_status = integration.check_health()
        assert health_status["status"] == "ok"
        assert "response_time" in health_status
        assert health_status["message"] == "Mailchimp API connection successful"

    @responses.activate
    def test_check_health_failure(self, integration):
        """Test the health check with a failed response."""
        # Mock the ping endpoint response
        responses.add(
            responses.GET,
            f"{integration.base_url}/ping",
            json={"type": "error", "detail": "API key invalid"},
            status=401
        )

        health_status = integration.check_health()
        assert health_status["status"] == "error"
        assert "response_time" in health_status
        assert "API key invalid" in health_status["message"]

    @responses.activate
    def test_create_campaign_success(self, integration, campaign_data):
        """Test creating a campaign successfully."""
        # Mock the campaign creation response
        responses.add(
            responses.POST,
            f"{integration.base_url}/campaigns",
            json={"id": "campaign123", **campaign_data},
            status=200
        )

        # Mock the campaign content update response
        responses.add(
            responses.PUT,
            f"{integration.base_url}/campaigns/campaign123/content",
            json={"html": "<p>Test content</p>"},
            status=200
        )

        result = integration.create_campaign(campaign_data)
        assert result["success"] is True
        assert result["data"]["id"] == "campaign123"
        assert result["message"] == "Campaign created successfully"

    @responses.activate
    def test_create_campaign_failure(self, integration, campaign_data):
        """Test creating a campaign with a failure."""
        # Mock the campaign creation response
        responses.add(
            responses.POST,
            f"{integration.base_url}/campaigns",
            json={"type": "error", "detail": "Invalid list ID"},
            status=400
        )

        result = integration.create_campaign(campaign_data)
        assert result["success"] is False
        assert "Invalid list ID" in result["message"]
        assert result["error"]["detail"] == "Invalid list ID"

    @responses.activate
    def test_send_campaign_success(self, integration):
        """Test sending a campaign successfully."""
        campaign_id = "campaign123"
        
        # Mock the campaign send response
        responses.add(
            responses.POST,
            f"{integration.base_url}/campaigns/{campaign_id}/actions/send",
            json={"status": "sent"},
            status=204
        )

        result = integration.send_campaign(campaign_id)
        assert result["success"] is True
        assert result["message"] == "Campaign sent successfully"

    @responses.activate
    def test_send_campaign_failure(self, integration):
        """Test sending a campaign with a failure."""
        campaign_id = "campaign123"
        
        # Mock the campaign send response
        responses.add(
            responses.POST,
            f"{integration.base_url}/campaigns/{campaign_id}/actions/send",
            json={"type": "error", "detail": "Campaign already sent"},
            status=400
        )

        result = integration.send_campaign(campaign_id)
        assert result["success"] is False
        assert "Campaign already sent" in result["message"]
        assert result["error"]["detail"] == "Campaign already sent"

    @responses.activate
    def test_create_list_success(self, integration, list_data):
        """Test creating a list successfully."""
        # Mock the list creation response
        responses.add(
            responses.POST,
            f"{integration.base_url}/lists",
            json={"id": "list123", **list_data},
            status=200
        )

        result = integration.create_list(list_data)
        assert result["success"] is True
        assert result["data"]["id"] == "list123"
        assert result["message"] == "List created successfully"

    @responses.activate
    def test_add_subscriber_success(self, integration):
        """Test adding a subscriber successfully."""
        list_id = "list123"
        subscriber_data = {
            "email_address": "test@example.com",
            "status": "subscribed",
            "merge_fields": {
                "FNAME": "Test",
                "LNAME": "User"
            }
        }
        
        # Mock the subscriber add response
        responses.add(
            responses.POST,
            f"{integration.base_url}/lists/{list_id}/members",
            json={"id": "member123", **subscriber_data},
            status=200
        )

        result = integration.add_subscriber(list_id, subscriber_data)
        assert result["success"] is True
        assert result["data"]["id"] == "member123"
        assert result["message"] == "Subscriber added successfully"

    @responses.activate
    def test_get_campaign_report_success(self, integration):
        """Test getting a campaign report successfully."""
        campaign_id = "campaign123"
        report_data = {
            "id": campaign_id,
            "emails_sent": 1000,
            "opens": 500,
            "unique_opens": 400,
            "clicks": 200,
            "unique_clicks": 150,
            "unsubscribes": 10,
            "bounce_rate": 0.02
        }
        
        # Mock the report response
        responses.add(
            responses.GET,
            f"{integration.base_url}/reports/{campaign_id}",
            json=report_data,
            status=200
        )

        result = integration.get_campaign_report(campaign_id)
        assert result["success"] is True
        assert result["data"]["id"] == campaign_id
        assert result["data"]["unique_opens"] == 400
        assert result["message"] == "Campaign report retrieved successfully"

    @responses.activate
    def test_exception_handling(self, integration):
        """Test handling of exceptions during API calls."""
        # Mock a connection error
        responses.add(
            responses.GET,
            f"{integration.base_url}/ping",
            body=ConnectionError("Connection refused")
        )

        health_status = integration.check_health()
        assert health_status["status"] == "error"
        assert "Connection error" in health_status["message"]

    @patch('src.agents.integrations.email_marketing.mailchimp.logging')
    def test_logging(self, mock_logging, integration, credentials):
        """Test that operations are properly logged."""
        # Create a mock response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"health_status": "Everything's Chimpy!"}
        
        # Mock the safe_request method to return our mock response
        with patch.object(integration, 'safe_request', return_value=mock_response):
            integration.check_health()
            
        # Verify logging occurred
        assert mock_logging.info.call_count >= 1
        # Check for the platform name in the log message
        assert any("mailchimp" in str(call_args) for call_args in mock_logging.info.call_args_list)