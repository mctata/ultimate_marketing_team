"""Unit tests for the integration_utils module."""

import pytest
import json
import os
import hashlib
from unittest.mock import MagicMock, patch, mock_open
from datetime import datetime

from src.agents.integrations.integration_utils import (
    load_integration_config,
    generate_cache_key,
    sanitize_credentials,
    get_datetime_from_iso
)


class TestIntegrationUtils:
    """Test suite for the integration utilities module."""

    @patch('os.path.join')
    @patch('yaml.safe_load')
    def test_load_integration_config_success(self, mock_yaml_load, mock_path_join):
        """Test loading integration config successfully."""
        mock_path_join.return_value = '/fake/path/to/integrations.yaml'
        mock_config = {'integrations': {'social': {'platforms': ['facebook', 'twitter']}}}
        mock_yaml_load.return_value = mock_config
        
        with patch('builtins.open', mock_open()) as mock_file:
            result = load_integration_config()
        
        mock_file.assert_called_once_with('/fake/path/to/integrations.yaml', 'r')
        assert result == mock_config

    @patch('os.path.join')
    @patch('logging.getLogger')
    def test_load_integration_config_error(self, mock_logger, mock_path_join):
        """Test loading integration config with an error."""
        mock_logger.return_value = MagicMock()
        mock_path_join.return_value = '/fake/path/to/integrations.yaml'
        
        with patch('builtins.open', mock_open()) as mock_file:
            mock_file.side_effect = FileNotFoundError("File not found")
            result = load_integration_config()
        
        mock_logger.return_value.error.assert_called_once()
        assert result == {}

    def test_generate_cache_key(self):
        """Test generating a cache key."""
        integration_type = "social"
        platform = "facebook"
        action = "post"
        data = {
            "message": "Test post",
            "image_url": "https://example.com/image.jpg",
            "api_key": "secret_key",
            "access_token": "secret_token"
        }
        
        # Calculate expected hash manually
        safe_data = {
            "message": "Test post",
            "image_url": "https://example.com/image.jpg"
        }
        key_base = f"social:facebook:post:{json.dumps(safe_data, sort_keys=True)}"
        expected_hash = hashlib.md5(key_base.encode()).hexdigest()
        expected_key = f"integration:social:facebook:post:{expected_hash}"
        
        result = generate_cache_key(integration_type, platform, action, data)
        
        assert result == expected_key

    def test_generate_cache_key_with_empty_data(self):
        """Test generating a cache key with empty data."""
        result = generate_cache_key("ai", "openai", "completion", {})
        
        # Calculate expected hash manually
        key_base = "ai:openai:completion:{}"
        expected_hash = hashlib.md5(key_base.encode()).hexdigest()
        expected_key = f"integration:ai:openai:completion:{expected_hash}"
        
        assert result == expected_key

    def test_sanitize_credentials(self):
        """Test sanitizing credentials in a data dictionary."""
        data = {
            "message": "Test message",
            "api_key": "secret_api_key",
            "client_id": "client123",
            "client_secret": "secret123",
            "access_token": "token123",
            "refresh_token": "refresh123",
            "username": "testuser",
            "password": "password123",
            "developer_token": "dev123",
            "api_secret": "apisecret123",
            "other_field": "not_sensitive"
        }
        
        result = sanitize_credentials(data)
        
        # Original data should not be modified
        assert data["api_key"] == "secret_api_key"
        assert data["access_token"] == "token123"
        
        # Sensitive fields should be masked in result
        assert result["api_key"] == "********"
        assert result["client_id"] == "********"
        assert result["client_secret"] == "********"
        assert result["access_token"] == "********"
        assert result["refresh_token"] == "********"
        assert result["username"] == "********"
        assert result["password"] == "********"
        assert result["developer_token"] == "********"
        assert result["api_secret"] == "********"
        
        # Non-sensitive fields should remain unchanged
        assert result["message"] == "Test message"
        assert result["other_field"] == "not_sensitive"

    def test_get_datetime_from_iso_valid(self):
        """Test converting a valid ISO datetime string to datetime object."""
        # Test with Z timezone
        result1 = get_datetime_from_iso("2023-01-01T12:30:45Z")
        assert isinstance(result1, datetime)
        assert result1.year == 2023
        assert result1.month == 1
        assert result1.day == 1
        assert result1.hour == 12
        assert result1.minute == 30
        assert result1.second == 45
        
        # Test with explicit timezone
        result2 = get_datetime_from_iso("2023-02-15T08:45:30+00:00")
        assert isinstance(result2, datetime)
        assert result2.year == 2023
        assert result2.month == 2
        assert result2.day == 15
        assert result2.hour == 8
        assert result2.minute == 45
        assert result2.second == 30

    def test_get_datetime_from_iso_none(self):
        """Test converting None to datetime object."""
        result = get_datetime_from_iso(None)
        assert result is None

    def test_get_datetime_from_iso_empty(self):
        """Test converting empty string to datetime object."""
        result = get_datetime_from_iso("")
        assert result is None

    @patch('logging.getLogger')
    def test_get_datetime_from_iso_invalid(self, mock_logger):
        """Test converting invalid ISO datetime string."""
        mock_logger.return_value = MagicMock()
        
        result = get_datetime_from_iso("not-a-datetime")
        
        assert result is None
        mock_logger.return_value.warning.assert_called_once()