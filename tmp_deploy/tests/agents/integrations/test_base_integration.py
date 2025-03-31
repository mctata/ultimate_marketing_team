"""Unit tests for the base_integration module."""

import pytest
import json
from unittest.mock import MagicMock, patch
from datetime import datetime
from typing import Dict, Any

from src.agents.integrations.base_integration import Integration, IntegrationError


class TestIntegration:
    """Test suite for the Integration base class."""

    @pytest.fixture
    def integration(self):
        """Fixture for creating an Integration instance."""
        credentials = {"api_key": "test_key", "client_id": "test_client"}
        return Integration("test_platform", credentials)

    @pytest.fixture
    def mock_integration(self):
        """Fixture for creating an Integration with mocked check_health."""
        credentials = {"api_key": "test_key", "client_id": "test_client"}
        integration = Integration("test_platform", credentials)
        # Override the abstract method for testing
        integration.check_health = MagicMock(return_value={"status": "healthy"})
        return integration

    def test_initialization(self, integration):
        """Test that the integration initializes with correct attributes."""
        assert integration.platform == "test_platform"
        assert integration.credentials == {"api_key": "test_key", "client_id": "test_client"}
        assert integration.initialized_at is not None
        # Check that initialized_at is a valid ISO format string
        assert datetime.fromisoformat(integration.initialized_at) is not None

    def test_format_success_response(self, integration):
        """Test formatting a success response."""
        response = integration.format_success_response(data="test_data", code=200)
        
        assert response["status"] == "success"
        assert response["platform"] == "test_platform"
        assert response["data"] == "test_data"
        assert response["code"] == 200
        assert "timestamp" in response
        # Verify timestamp is in ISO format
        assert datetime.fromisoformat(response["timestamp"]) is not None

    def test_format_error_response(self, integration):
        """Test formatting an error response."""
        response = integration.format_error_response("Test error", {"code": 400})
        
        assert response["status"] == "error"
        assert response["platform"] == "test_platform"
        assert response["error"] == "Test error"
        assert response["details"] == {"code": 400}
        assert "timestamp" in response
        # Verify timestamp is in ISO format
        assert datetime.fromisoformat(response["timestamp"]) is not None

    def test_safe_request_success(self, integration):
        """Test safe_request with a successful function call."""
        test_func = MagicMock(return_value={"result": "success"})
        
        result = integration.safe_request(test_func, "Error occurred", param1="value1")
        
        test_func.assert_called_once_with(param1="value1")
        assert result == {"result": "success"}

    def test_safe_request_error(self, integration):
        """Test safe_request with a function that raises an exception."""
        test_func = MagicMock(side_effect=ValueError("Test exception"))
        
        result = integration.safe_request(test_func, "Error occurred", param1="value1")
        
        test_func.assert_called_once_with(param1="value1")
        assert result["status"] == "error"
        assert "Error occurred: Test exception" in result["error"]
        assert result["platform"] == "test_platform"

    def test_check_credentials_valid(self, integration):
        """Test check_credentials with valid credentials."""
        result = integration.check_credentials(["api_key", "client_id"])
        
        assert result is None

    def test_check_credentials_missing(self, integration):
        """Test check_credentials with missing credentials."""
        result = integration.check_credentials(["api_key", "api_secret"])
        
        assert result is not None
        assert result["status"] == "error"
        assert "Missing required credentials: api_secret" in result["error"]

    def test_check_health_not_implemented(self, integration):
        """Test that check_health raises NotImplementedError."""
        with pytest.raises(NotImplementedError):
            integration.check_health()

    def test_measure_response_time_success(self, integration):
        """Test measuring response time of a successful function."""
        def test_func():
            return "success"
        
        result, response_time = integration.measure_response_time(test_func)
        
        assert result == "success"
        assert isinstance(response_time, int)
        assert response_time >= 0  # Time should be positive

    def test_measure_response_time_error(self, integration):
        """Test measuring response time of a function that raises an exception."""
        def test_func():
            raise ValueError("Test error")
        
        with pytest.raises(ValueError) as excinfo:
            integration.measure_response_time(test_func)
        
        assert "Test error" in str(excinfo.value)

    def test_platform_name_lowercased(self):
        """Test that platform name is converted to lowercase."""
        integration = Integration("TeST_PlAtFoRm", {})
        assert integration.platform == "test_platform"