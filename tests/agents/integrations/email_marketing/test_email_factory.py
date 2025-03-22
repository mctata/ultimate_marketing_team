"""Unit tests for the email marketing integration factory."""

import pytest
from unittest.mock import patch, MagicMock

from src.agents.integrations.email_marketing.factory import EmailMarketingIntegrationFactory
from src.agents.integrations.email_marketing.mailchimp import MailchimpIntegration
from src.agents.integrations.email_marketing.hubspot import HubspotIntegration
from src.agents.integrations.email_marketing.base import EmailMarketingIntegration


class TestEmailMarketingIntegrationFactory:
    """Test suite for the EmailMarketingIntegrationFactory."""

    @pytest.fixture
    def credentials(self):
        """Sample credentials for testing."""
        return {"api_key": "test_key", "api_secret": "test_secret"}

    def test_mailchimp_integration_creation(self, credentials):
        """Test creating a Mailchimp integration."""
        for platform in ["mailchimp", "Mailchimp", "mc"]:
            integration = EmailMarketingIntegrationFactory.get_integration(platform, credentials)
            assert isinstance(integration, MailchimpIntegration)
            assert integration.platform.lower() == "mailchimp"
            assert integration.credentials == credentials

    def test_hubspot_integration_creation(self, credentials):
        """Test creating a HubSpot integration."""
        for platform in ["hubspot", "HubSpot", "hub"]:
            integration = EmailMarketingIntegrationFactory.get_integration(platform, credentials)
            assert isinstance(integration, HubspotIntegration)
            assert integration.platform.lower() == "hubspot"
            assert integration.credentials == credentials

    def test_unsupported_platform(self, credentials):
        """Test error handling for unsupported platforms."""
        with pytest.raises(ValueError) as excinfo:
            EmailMarketingIntegrationFactory.get_integration("unsupported_platform", credentials)
        assert "Unsupported email marketing platform: unsupported_platform" in str(excinfo.value)

    @patch('src.agents.integrations.email_marketing.mailchimp.MailchimpIntegration')
    def test_factory_passes_credentials_correctly(self, mock_mailchimp, credentials):
        """Test that credentials are correctly passed to the integration."""
        mock_instance = MagicMock()
        mock_mailchimp.return_value = mock_instance
        
        integration = EmailMarketingIntegrationFactory.get_integration("mailchimp", credentials)
        
        # Verify the integration was constructed with the correct credentials
        mock_mailchimp.assert_called_once_with(credentials)
        assert integration == mock_instance