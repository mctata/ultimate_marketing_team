"""Unit tests for the webhook manager."""

import pytest
import json
import hmac
import hashlib
import time
from unittest.mock import patch, MagicMock, call
import requests

from src.agents.integrations.developer.webhook_manager import WebhookManager
from src.models.integration import Webhook
from src.core.exceptions import WebhookError


class TestWebhookManager:
    """Test suite for the webhook manager."""

    @pytest.fixture
    def db_session(self):
        """Mock database session for testing."""
        session = MagicMock()
        session.query.return_value.filter.return_value.first.return_value = None
        return session

    @pytest.fixture
    def config(self):
        """Sample configuration for testing."""
        return {
            "secret_key": "test_webhook_secret",
            "default_timeout": 5,
            "max_retries": 3,
            "retry_delay": 1
        }

    @pytest.fixture
    def webhook_manager(self, db_session, config):
        """Create a webhook manager instance for testing."""
        return WebhookManager(db_session, config)

    @pytest.fixture
    def sample_webhook(self):
        """Sample webhook data for testing."""
        return Webhook(
            id=1,
            url="https://example.com/webhook",
            event_types=["content.created", "content.updated"],
            active=True,
            created_by="test_user",
            secret="webhook_secret",
            headers={"X-Custom-Header": "test_value"}
        )

    @pytest.fixture
    def sample_payload(self):
        """Sample webhook payload for testing."""
        return {
            "event_type": "content.created",
            "timestamp": int(time.time()),
            "data": {
                "content_id": "123",
                "title": "Test Content",
                "status": "published"
            }
        }

    def test_register_webhook(self, webhook_manager, db_session):
        """Test registering a new webhook."""
        webhook_data = {
            "url": "https://example.com/webhook",
            "event_types": ["content.created", "content.updated"],
            "headers": {"X-Custom-Header": "test_value"},
            "description": "Test webhook"
        }
        user_id = "test_user"
        
        new_webhook = MagicMock()
        new_webhook.id = 1
        new_webhook.secret = "generated_secret"
        db_session.add.return_value = None
        
        with patch('src.agents.integrations.developer.webhook_manager.Webhook', return_value=new_webhook):
            with patch('src.agents.integrations.developer.webhook_manager.secrets.token_hex', return_value="generated_secret"):
                result = webhook_manager.register_webhook(webhook_data, user_id)
        
        assert result["success"] is True
        assert result["webhook_id"] == 1
        assert result["secret"] == "generated_secret"
        assert "Webhook registered successfully" in result["message"]
        db_session.add.assert_called_once()
        db_session.commit.assert_called_once()

    def test_register_webhook_invalid_url(self, webhook_manager):
        """Test registering a webhook with an invalid URL."""
        webhook_data = {
            "url": "invalid-url",
            "event_types": ["content.created"]
        }
        user_id = "test_user"
        
        result = webhook_manager.register_webhook(webhook_data, user_id)
        
        assert result["success"] is False
        assert "Invalid webhook URL" in result["message"]

    def test_register_webhook_duplicate(self, webhook_manager, db_session):
        """Test registering a duplicate webhook."""
        webhook_data = {
            "url": "https://example.com/webhook",
            "event_types": ["content.created"]
        }
        user_id = "test_user"
        
        # Make the query return an existing webhook
        existing_webhook = MagicMock()
        db_session.query.return_value.filter.return_value.first.return_value = existing_webhook
        
        result = webhook_manager.register_webhook(webhook_data, user_id)
        
        assert result["success"] is False
        assert "Webhook already exists for this URL and user" in result["message"]

    def test_generate_signature(self, webhook_manager, sample_payload):
        """Test generating a webhook signature."""
        secret = "webhook_secret"
        payload_str = json.dumps(sample_payload)
        
        signature = webhook_manager.generate_signature(payload_str, secret)
        
        # Verify the signature manually
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            payload_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        assert signature == expected_signature

    @patch('src.agents.integrations.developer.webhook_manager.requests.post')
    def test_trigger_webhook_success(self, mock_post, webhook_manager, sample_webhook, sample_payload):
        """Test triggering a webhook successfully."""
        # Set up the mock response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "OK"
        mock_post.return_value = mock_response
        
        # Make the query return our sample webhook
        webhook_manager.db_session.query.return_value.filter.return_value.all.return_value = [sample_webhook]
        
        result = webhook_manager.trigger_webhook("content.created", sample_payload)
        
        assert result["success"] is True
        assert result["delivered"] == 1
        assert result["failed"] == 0
        
        # Verify the request was made correctly
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        
        # Check URL
        assert call_args[0][0] == sample_webhook.url
        
        # Check headers
        headers = call_args[1]["headers"]
        assert headers["X-Custom-Header"] == "test_value"
        assert "X-Webhook-Signature" in headers
        assert "Content-Type" in headers
        
        # Check payload
        assert json.loads(call_args[1]["data"]) == sample_payload
        
        # Check timeout
        assert call_args[1]["timeout"] == webhook_manager.default_timeout

    @patch('src.agents.integrations.developer.webhook_manager.requests.post')
    def test_trigger_webhook_failure(self, mock_post, webhook_manager, sample_webhook, sample_payload):
        """Test triggering a webhook with a failure."""
        # Set up the mock response to simulate a failure
        mock_post.side_effect = requests.exceptions.RequestException("Connection error")
        
        # Make the query return our sample webhook
        webhook_manager.db_session.query.return_value.filter.return_value.all.return_value = [sample_webhook]
        
        result = webhook_manager.trigger_webhook("content.created", sample_payload)
        
        assert result["success"] is True  # Overall operation succeeded
        assert result["delivered"] == 0
        assert result["failed"] == 1
        assert len(result["failures"]) == 1
        assert "Connection error" in result["failures"][0]["error"]

    @patch('src.agents.integrations.developer.webhook_manager.requests.post')
    def test_trigger_webhook_with_retries(self, mock_post, webhook_manager, sample_webhook, sample_payload):
        """Test webhook retries on failure."""
        # First call fails, subsequent calls succeed
        mock_response_success = MagicMock()
        mock_response_success.status_code = 200
        mock_post.side_effect = [
            requests.exceptions.RequestException("Temporary error"),
            mock_response_success
        ]
        
        # Make the query return our sample webhook
        webhook_manager.db_session.query.return_value.filter.return_value.all.return_value = [sample_webhook]
        
        # Set retries to 1 for faster testing
        webhook_manager.max_retries = 1
        webhook_manager.retry_delay = 0.1
        
        result = webhook_manager.trigger_webhook("content.created", sample_payload)
        
        assert result["success"] is True
        assert result["delivered"] == 1
        assert result["failed"] == 0
        
        # Verify that post was called twice (initial + 1 retry)
        assert mock_post.call_count == 2

    def test_get_webhooks_by_event(self, webhook_manager, sample_webhook):
        """Test retrieving webhooks by event type."""
        # Make the query return our sample webhook
        webhook_manager.db_session.query.return_value.filter.return_value.all.return_value = [sample_webhook]
        
        webhooks = webhook_manager.get_webhooks_by_event("content.created")
        
        assert len(webhooks) == 1
        assert webhooks[0] == sample_webhook
        
        # Test with an event type not registered
        webhook_manager.db_session.query.return_value.filter.return_value.all.return_value = []
        
        webhooks = webhook_manager.get_webhooks_by_event("content.deleted")
        
        assert len(webhooks) == 0

    def test_deactivate_webhook(self, webhook_manager, db_session, sample_webhook):
        """Test deactivating a webhook."""
        # Make the query return our sample webhook
        db_session.query.return_value.filter.return_value.first.return_value = sample_webhook
        
        result = webhook_manager.deactivate_webhook(1, "test_user")
        
        assert result["success"] is True
        assert "Webhook deactivated successfully" in result["message"]
        assert sample_webhook.active is False
        db_session.commit.assert_called_once()

    def test_deactivate_webhook_not_found(self, webhook_manager, db_session):
        """Test deactivating a non-existent webhook."""
        # Make the query return None
        db_session.query.return_value.filter.return_value.first.return_value = None
        
        result = webhook_manager.deactivate_webhook(999, "test_user")
        
        assert result["success"] is False
        assert "Webhook not found" in result["message"]
        db_session.commit.assert_not_called()

    def test_deactivate_webhook_unauthorized(self, webhook_manager, db_session, sample_webhook):
        """Test deactivating a webhook by an unauthorized user."""
        # Make the query return our sample webhook
        db_session.query.return_value.filter.return_value.first.return_value = sample_webhook
        
        result = webhook_manager.deactivate_webhook(1, "different_user")
        
        assert result["success"] is False
        assert "Unauthorized" in result["message"]
        assert sample_webhook.active is True  # Unchanged
        db_session.commit.assert_not_called()

    @patch('src.agents.integrations.developer.webhook_manager.logging')
    def test_logging(self, mock_logging, webhook_manager, sample_webhook, sample_payload):
        """Test that operations are properly logged."""
        # Make the query return our sample webhook
        webhook_manager.db_session.query.return_value.filter.return_value.all.return_value = [sample_webhook]
        
        # Mock the deliver_webhook method
        with patch.object(webhook_manager, 'deliver_webhook', return_value=True):
            webhook_manager.trigger_webhook("content.created", sample_payload)
        
        # Verify logging occurred
        assert mock_logging.info.call_count >= 1
        # Verify the event type is in the log message
        assert any("content.created" in str(call_args) for call_args in mock_logging.info.call_args_list)