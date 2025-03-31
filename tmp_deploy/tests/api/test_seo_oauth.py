"""
Tests for the Google Search Console OAuth2 integration in the SEO API endpoints.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
import os
import json
from datetime import datetime, timedelta

from src.api.main import app
from src.core import seo_settings
from src.api.routers.seo import router as seo_router
from src.agents.integrations.analytics.search_console import GoogleSearchConsoleIntegration

client = TestClient(app)

@pytest.fixture
def mock_user():
    """Mock authenticated user."""
    return {"id": 1, "username": "testuser", "email": "test@example.com"}

@pytest.fixture
def mock_oauth_response():
    """Mock OAuth response."""
    return {
        "auth_url": "https://accounts.google.com/o/oauth2/auth?client_id=test_client_id&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fapi%2Fseo%2Foauth2callback&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fwebmasters.readonly&access_type=offline&prompt=consent",
        "state": "test_state_12345"
    }

@pytest.fixture
def mock_token_data():
    """Mock token data for authentication."""
    return {
        "token": "test_token",
        "refresh_token": "test_refresh_token",
        "token_uri": "https://oauth2.googleapis.com/token",
        "client_id": "test_client_id",
        "client_secret": "test_client_secret",
        "scopes": ["https://www.googleapis.com/auth/webmasters.readonly"],
        "expiry": (datetime.now() + timedelta(hours=1)).isoformat()
    }

def test_initiate_oauth_flow(mock_user):
    """Test initiating the OAuth flow."""
    # Mock the search_console_service.initializeGoogleAuth method
    with patch('src.api.routers.seo.GoogleSearchConsoleIntegration') as MockIntegration:
        mock_instance = AsyncMock()
        mock_instance.authenticate.return_value = {
            "auth_url": "https://accounts.google.com/o/oauth2/auth?test_params",
            "state": "test_state_12345"
        }
        MockIntegration.return_value = mock_instance
        
        # Mock the get_current_user dependency
        with patch('src.api.routers.seo.get_current_user', return_value=mock_user):
            # Test the endpoint
            response = client.get("/seo/auth/google/init?brand_id=123")
            
            # Assertions
            assert response.status_code == 200
            data = response.json()
            assert "auth_url" in data
            assert "state" in data
            assert data["auth_url"].startswith("https://accounts.google.com/o/oauth2/auth")
            
            # Verify the integration was created correctly
            MockIntegration.assert_called_once_with(brand_id=123, site_url=None)
            mock_instance.authenticate.assert_called_once()

def test_oauth_callback(mock_user, mock_token_data):
    """Test processing the OAuth callback."""
    # Mock the integration
    with patch('src.api.routers.seo.GoogleSearchConsoleIntegration') as MockIntegration:
        mock_instance = AsyncMock()
        mock_instance.process_oauth_callback.return_value = {
            "status": "success", 
            "message": "Authentication successful"
        }
        MockIntegration.return_value = mock_instance
        
        # Mock the get_current_user dependency
        with patch('src.api.routers.seo.get_current_user', return_value=mock_user):
            # Test the endpoint
            response = client.post(
                "/seo/auth/google/callback",
                json={
                    "code": "test_auth_code",
                    "state": "test_state_12345",
                    "brand_id": 123
                }
            )
            
            # Assertions
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert "Authentication successful" in data["message"]
            
            # Verify the integration was created and used correctly
            MockIntegration.assert_called_once_with(brand_id=123, site_url=None)
            mock_instance.process_oauth_callback.assert_called_once_with(
                "test_auth_code", "test_state_12345"
            )

def test_check_authorization_status(mock_user):
    """Test checking the authorization status."""
    # Create a test token file
    test_brand_id = 888
    token_path = seo_settings.TOKEN_DIR / f"gsc_token_{test_brand_id}.json"
    
    # Mock token data
    token_data = {
        "token": "test_token",
        "refresh_token": "test_refresh_token",
        "token_uri": "https://oauth2.googleapis.com/token",
        "client_id": "test_client_id",
        "client_secret": "test_client_secret",
        "scopes": ["https://www.googleapis.com/auth/webmasters.readonly"],
        "expiry": (datetime.now() + timedelta(hours=1)).isoformat()
    }
    
    try:
        # Create the token file for testing
        os.makedirs(seo_settings.TOKEN_DIR, exist_ok=True)
        with open(token_path, "w") as f:
            json.dump(token_data, f)
        
        # Mock the get_current_user dependency
        with patch('src.api.routers.seo.get_current_user', return_value=mock_user):
            # Test the endpoint with existing token
            response = client.get(f"/seo/auth/status?brand_id={test_brand_id}")
            
            # Assertions for existing token
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert data["is_authorized"] == True
            assert data["brand_id"] == test_brand_id
            
            # Test with non-existent token
            response = client.get("/seo/auth/status?brand_id=999")
            
            # Assertions for non-existent token
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert data["is_authorized"] == False
            assert data["brand_id"] == 999
    finally:
        # Clean up test token file
        if token_path.exists():
            token_path.unlink()

def test_search_performance_with_authorization(mock_user, mock_token_data):
    """Test getting search performance data with authorization."""
    # Mock the search_console_service
    with patch('src.api.routers.seo.search_console_service.get_search_performance') as mock_get_perf:
        mock_get_perf.return_value = {
            "status": "success",
            "data": [
                {"query": "test query", "clicks": 100, "impressions": 1000, "ctr": 0.1, "position": 5.0}
            ]
        }
        
        # Mock the get_current_user dependency
        with patch('src.api.routers.seo.get_current_user', return_value=mock_user):
            # Test the endpoint
            response = client.get("/seo/search-performance?brand_id=123&start_date=2025-03-01&end_date=2025-03-26&dimension=query")
            
            # Assertions
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert len(data["data"]) == 1
            assert data["data"][0]["query"] == "test query"
            
            # Verify service was called correctly
            mock_get_perf.assert_called_once_with(
                brand_id=123,
                start_date="2025-03-01",
                end_date="2025-03-26",
                dimension="query"
            )

def test_error_handling_in_oauth_flow(mock_user):
    """Test error handling in the OAuth flow."""
    # Mock the integration with an error
    with patch('src.api.routers.seo.GoogleSearchConsoleIntegration') as MockIntegration:
        mock_instance = AsyncMock()
        mock_instance.authenticate.side_effect = ValueError("Invalid client configuration")
        MockIntegration.return_value = mock_instance
        
        # Mock the get_current_user dependency
        with patch('src.api.routers.seo.get_current_user', return_value=mock_user):
            # Test the endpoint
            response = client.get("/seo/auth/google/init?brand_id=123")
            
            # Should return 500 with error message
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
            assert "Invalid client configuration" in data["detail"]

def test_error_handling_in_oauth_callback(mock_user):
    """Test error handling in the OAuth callback."""
    # Mock the integration with an error
    with patch('src.api.routers.seo.GoogleSearchConsoleIntegration') as MockIntegration:
        mock_instance = AsyncMock()
        mock_instance.process_oauth_callback.side_effect = Exception("Invalid auth code")
        MockIntegration.return_value = mock_instance
        
        # Mock the get_current_user dependency
        with patch('src.api.routers.seo.get_current_user', return_value=mock_user):
            # Test the endpoint
            response = client.post(
                "/seo/auth/google/callback",
                json={
                    "code": "invalid_code",
                    "state": "test_state",
                    "brand_id": 123
                }
            )
            
            # Should return 500 with error message
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
            assert "Invalid auth code" in data["detail"]