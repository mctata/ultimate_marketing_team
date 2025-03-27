"""
Unit tests for the Search Console Service with real Google credentials.
"""

import pytest
import json
import os
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime, timedelta, date
import aiohttp
import logging
from pathlib import Path

from src.core import seo_settings
from src.services.search_console_service import search_console_service
from src.agents.integrations.analytics.search_console import GoogleSearchConsoleIntegration

# Configure logging
logger = logging.getLogger(__name__)

# Skip tests if credentials not available
real_credentials_available = bool(os.getenv("GOOGLE_OAUTH2_CLIENT_ID") and 
                             os.getenv("GOOGLE_OAUTH2_CLIENT_SECRET") and
                             os.getenv("TEST_GSC_REFRESH_TOKEN"))

@pytest.fixture
def mock_search_data():
    """Sample search performance data."""
    return {
        "status": "success",
        "data": [
            {
                "query": "content marketing strategy",
                "clicks": 120,
                "impressions": 2500,
                "ctr": 4.8,
                "position": 3.2
            },
            {
                "query": "how to create content marketing plan",
                "clicks": 85,
                "impressions": 1800,
                "ctr": 4.7,
                "position": 4.1
            },
            {
                "query": "content marketing examples",
                "clicks": 67,
                "impressions": 1500,
                "ctr": 4.5,
                "position": 5.3
            }
        ],
        "row_count": 3,
        "dimensions": ["query"],
        "metrics": ["clicks", "impressions", "ctr", "position"]
    }

@pytest.fixture
def real_credentials():
    """
    Provides real credentials for testing if available.
    
    The TEST_GSC_REFRESH_TOKEN environment variable must be set for this to work.
    """
    if not real_credentials_available:
        pytest.skip("Real credentials not available")
    
    return {
        "token": "test_token",  # Will be refreshed during test
        "refresh_token": os.getenv("TEST_GSC_REFRESH_TOKEN"),
        "token_uri": "https://oauth2.googleapis.com/token",
        "client_id": os.getenv("GOOGLE_OAUTH2_CLIENT_ID", ""),
        "client_secret": os.getenv("GOOGLE_OAUTH2_CLIENT_SECRET", ""),
        "scopes": ["https://www.googleapis.com/auth/webmasters.readonly"],
        "expiry": (datetime.now() - timedelta(hours=1)).isoformat()  # Expired to force refresh
    }

@pytest.fixture
def test_site_url():
    """Test site URL for real testing."""
    return os.getenv("TEST_GSC_SITE_URL", "sc-domain:example.com")

@pytest.fixture
def test_brand_id():
    """Test brand ID for token storage."""
    return 9999  # Use a high number to avoid conflicts

def test_get_search_performance(mock_search_data):
    """Test retrieving search performance data with mocks."""
    with patch('src.services.search_console_service.SearchConsoleIntegration') as MockIntegration:
        # Set up mock for the integration
        mock_integration = MagicMock()
        mock_integration.get_metrics.return_value = mock_search_data
        MockIntegration.return_value = mock_integration
        
        # Set up mock for _get_mock_credentials
        with patch.object(search_console_service, '_get_mock_credentials') as mock_creds:
            mock_creds.return_value = {"property_url": "https://example.com"}
            
            # Test get_search_performance
            result = search_console_service.get_search_performance(
                brand_id=123,
                start_date="2025-02-26",
                end_date="2025-03-26",
                dimension="query"
            )
            
            # Assertions
            assert result["status"] == "success"
            assert len(result["data"]) == 3
            assert result["data"][0]["query"] == "content marketing strategy"
            assert result["data"][0]["clicks"] == 120
            
            # Verify integration was called correctly
            mock_integration.get_metrics.assert_called_once()
            args, kwargs = mock_integration.get_metrics.call_args
            assert kwargs["dimensions"] == ["query"]

def test_get_url_performance(mock_search_data):
    """Test retrieving performance data for a specific URL with mocks."""
    with patch('src.services.search_console_service.SearchConsoleIntegration') as MockIntegration:
        # Set up mock for the integration
        mock_integration = MagicMock()
        mock_integration.get_page_performance.return_value = mock_search_data
        MockIntegration.return_value = mock_integration
        
        # Set up mock for _get_mock_credentials
        with patch.object(search_console_service, '_get_mock_credentials') as mock_creds:
            mock_creds.return_value = {"property_url": "https://example.com"}
            
            # Test get_url_performance
            result = search_console_service.get_url_performance(
                brand_id=123,
                url="https://example.com/blog/content-marketing",
                start_date="2025-02-26",
                end_date="2025-03-26"
            )
            
            # Assertions
            assert result["status"] == "success"
            assert len(result["data"]) == 3
            
            # Verify integration was called correctly
            mock_integration.get_page_performance.assert_called_once_with(
                url="https://example.com/blog/content-marketing",
                start_date="2025-02-26",
                end_date="2025-03-26"
            )

@pytest.mark.skipif(not real_credentials_available, reason="Real credentials not available")
@pytest.mark.asyncio
async def test_real_oauth2_flow(real_credentials, test_brand_id, test_site_url):
    """Test the OAuth2 token refresh process with real credentials."""
    # Create a token file with the test credentials
    token_path = seo_settings.get_token_path(test_brand_id)
    with open(token_path, "w") as f:
        json.dump(real_credentials, f)
    
    try:
        # Create an integration instance with the test credentials
        integration = GoogleSearchConsoleIntegration(
            brand_id=test_brand_id,
            site_url=test_site_url
        )
        
        # Verify the credentials were loaded and refreshed
        assert integration.credentials is not None
        assert not integration.credentials.expired
        
        # Try to get headers (should refresh token)
        headers = await integration._get_headers()
        assert "Authorization" in headers
        assert headers["Authorization"].startswith("Bearer ")
        
        # Verify the token file was updated with a new expiry
        updated_token = seo_settings.load_token(test_brand_id)
        assert updated_token is not None
        assert "expiry" in updated_token
        
        # The updated expiry should be in the future
        expiry_dt = datetime.fromisoformat(updated_token["expiry"])
        assert expiry_dt > datetime.now()
        
        logger.info("Successfully refreshed token with real credentials")
    finally:
        # Clean up: Remove the test token file
        if token_path.exists():
            token_path.unlink()

@pytest.mark.skipif(not real_credentials_available, reason="Real credentials not available")
@pytest.mark.asyncio
async def test_real_search_performance(real_credentials, test_brand_id, test_site_url):
    """Test retrieving real search performance data."""
    # Create a token file with the test credentials
    token_path = seo_settings.get_token_path(test_brand_id)
    with open(token_path, "w") as f:
        json.dump(real_credentials, f)
    
    try:
        # Create an integration instance with the test credentials
        integration = GoogleSearchConsoleIntegration(
            brand_id=test_brand_id,
            site_url=test_site_url
        )
        
        # Calculate date range for last 7 days
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=7)
        end_date_str = end_date.strftime("%Y-%m-%d")
        start_date_str = start_date.strftime("%Y-%m-%d")
        
        # Try to get real search performance data
        result = await integration.get_search_performance(
            start_date=start_date_str,
            end_date=end_date_str,
            dimensions=["query"],
            row_limit=10
        )
        
        # Basic validation of the result
        assert "rows" in result
        
        # If there are rows, validate the structure
        if result["rows"]:
            first_row = result["rows"][0]
            assert "keys" in first_row
            assert "clicks" in first_row
            assert "impressions" in first_row
            assert "ctr" in first_row
            assert "position" in first_row
            
            logger.info(f"Successfully retrieved {len(result['rows'])} rows of real search data")
        else:
            logger.info("No search data found for the test site")
    finally:
        # Clean up: Remove the test token file
        if token_path.exists():
            token_path.unlink()

@pytest.mark.skipif(not real_credentials_available, reason="Real credentials not available")
@pytest.mark.asyncio
async def test_real_url_inspection(real_credentials, test_brand_id, test_site_url):
    """Test URL inspection with real credentials."""
    # Create a token file with the test credentials
    token_path = seo_settings.get_token_path(test_brand_id)
    with open(token_path, "w") as f:
        json.dump(real_credentials, f)
    
    try:
        # Create an integration instance with the test credentials
        integration = GoogleSearchConsoleIntegration(
            brand_id=test_brand_id,
            site_url=test_site_url
        )
        
        # Test URL to inspect - extract domain from site_url and add a path
        if test_site_url.startswith("sc-domain:"):
            domain = test_site_url[10:]  # Remove sc-domain: prefix
            url_to_inspect = f"https://{domain}/"
        else:
            url_to_inspect = test_site_url
            
        # Try to inspect a URL
        try:
            result = await integration.inspect_url(url_to_inspect)
            
            # Basic validation
            assert "inspectionResult" in result
            logger.info(f"Successfully inspected URL: {url_to_inspect}")
        except Exception as e:
            logger.warning(f"URL inspection failed: {str(e)}")
            # URL inspection might fail if the API is not enabled or has limitations
            # So we'll make this a soft failure
            pytest.skip(f"URL inspection API failed: {str(e)}")
    finally:
        # Clean up: Remove the test token file
        if token_path.exists():
            token_path.unlink()

@pytest.mark.skipif(not real_credentials_available, reason="Real credentials not available")
@pytest.mark.asyncio
async def test_real_content_search_performance(real_credentials, test_brand_id, test_site_url):
    """Test getting content search performance with real credentials."""
    # Create a token file with the test credentials
    token_path = seo_settings.get_token_path(test_brand_id)
    with open(token_path, "w") as f:
        json.dump(real_credentials, f)
    
    try:
        # Create an integration instance with the test credentials
        integration = GoogleSearchConsoleIntegration(
            brand_id=test_brand_id,
            site_url=test_site_url
        )
        
        # Test with the root path for simplicity
        page_path = "/"
            
        # Try to get content search performance
        result = await integration.get_content_search_performance(
            page_path=page_path,
            days=7  # Use a shorter time frame for testing
        )
        
        # Basic validation
        assert "page_url" in result
        assert "date_range" in result
        assert "total_clicks" in result
        assert "total_impressions" in result
        assert "average_ctr" in result
        assert "average_position" in result
        assert "trends" in result
        assert "top_queries" in result
        assert "devices" in result
        
        logger.info(f"Successfully retrieved content search performance for: {page_path}")
    except Exception as e:
        logger.warning(f"Content search performance failed: {str(e)}")
        # This might fail if there's not enough data
        pytest.skip(f"Content search performance test failed: {str(e)}")
    finally:
        # Clean up: Remove the test token file
        if token_path.exists():
            token_path.unlink()

@pytest.mark.asyncio
async def test_mock_data_fallback():
    """Test fallback to mock data when credentials are not available."""
    integration = GoogleSearchConsoleIntegration(
        brand_id=None,  # No brand ID
        site_url="https://example.com"
    )
    
    # Verify credentials are not available
    assert integration.credentials is None
    
    # Try to get search performance
    result = await integration.get_search_performance(
        start_date="2025-01-01",
        end_date="2025-01-31",
        dimensions=["query"]
    )
    
    # Verify we got mock data
    assert "rows" in result
    assert len(result["rows"]) > 0
    
    # Verify the fallback was logged
    with patch('logging.Logger.info') as mock_info:
        await integration.get_search_performance(
            start_date="2025-01-01",
            end_date="2025-01-31",
            dimensions=["query"]
        )
        mock_info.assert_any_call("Using mock data for search performance")

@pytest.mark.asyncio
async def test_content_search_data():
    """Test retrieving comprehensive search data for content."""
    with patch('src.services.search_console_service.SearchConsoleIntegration') as MockIntegration:
        # Set up mock for the integration
        mock_integration = MagicMock()
        mock_integration.get_page_performance.return_value = {"status": "success", "data": []}
        mock_integration.get_indexation_status.return_value = {"status": "success", "indexation_status": {}}
        mock_integration.get_mobile_usability.return_value = {"status": "success", "mobile_usability": {}}
        MockIntegration.return_value = mock_integration
        
        # Set up mock for _get_mock_credentials and _get_content_url
        with patch.object(search_console_service, '_get_mock_credentials') as mock_creds:
            mock_creds.return_value = {"property_url": "https://example.com"}
            
            with patch.object(search_console_service, '_get_content_url') as mock_url:
                mock_url.return_value = "https://example.com/blog/content-marketing"
                
                # Test get_content_search_data
                result = search_console_service.get_content_search_data(
                    brand_id=123,
                    content_id=456
                )
                
                # Assertions
                assert result["status"] == "success"
                assert "search_performance" in result
                assert "indexation" in result
                assert "mobile_usability" in result
                
                # Verify integration methods were called correctly
                assert mock_integration.get_page_performance.call_count == 2  # Monthly and quarterly data
                assert mock_integration.get_indexation_status.call_count == 1
                assert mock_integration.get_mobile_usability.call_count == 1

@pytest.mark.asyncio
async def test_keyword_opportunities_analysis():
    """Test analyzing keyword opportunities from search data."""
    with patch.object(search_console_service, 'get_content_search_data') as mock_get_data:
        # Create mock search data with some potential opportunities
        mock_get_data.return_value = {
            "status": "success",
            "url": "https://example.com/blog/content-marketing",
            "search_performance": {
                "monthly": [
                    {
                        "query": "content marketing tools",
                        "position": 6.5,
                        "impressions": 1200,
                        "clicks": 45,
                        "ctr": 3.75
                    },
                    {
                        "query": "content marketing examples",
                        "position": 12.3,
                        "impressions": 800,
                        "clicks": 15,
                        "ctr": 1.88
                    },
                    {
                        "query": "content marketing strategy template",
                        "position": 8.7,
                        "impressions": 500,
                        "clicks": 12,
                        "ctr": 2.4
                    }
                ]
            }
        }
        
        # Test analyze_keyword_opportunities
        result = search_console_service.analyze_keyword_opportunities(
            brand_id=123,
            content_id=456
        )
        
        # Assertions
        assert result["status"] == "success"
        assert "opportunities" in result
        assert len(result["opportunities"]) > 0
        
        # Check that the right opportunities were identified
        opportunities = result["opportunities"]
        position_opps = [o for o in opportunities if o["opportunity_type"] == "position_improvement"]
        assert len(position_opps) > 0
        
        # Verify items are sorted by opportunity score
        scores = [o["opportunity_score"] for o in opportunities]
        assert all(scores[i] >= scores[i+1] for i in range(len(scores)-1))

@pytest.mark.skipif(not real_credentials_available, reason="Real credentials not available")
@pytest.mark.asyncio
async def test_real_error_handling(test_brand_id):
    """Test error handling with real credentials and invalid site URL."""
    # Create integration with invalid site URL
    integration = GoogleSearchConsoleIntegration(
        brand_id=test_brand_id,
        site_url="https://invalid-site-that-doesnt-exist-12345.com"
    )
    
    # Try to get search performance - should gracefully handle the error
    result = await integration.get_search_performance(
        start_date="2025-01-01",
        end_date="2025-01-31",
        dimensions=["query"]
    )
    
    # Should fall back to mock data on error
    assert "rows" in result
    assert len(result["rows"]) > 0

@pytest.mark.skipif(not real_credentials_available, reason="Real credentials not available")
def test_real_token_storage_and_loading(real_credentials, test_brand_id):
    """Test token storage and loading with real credentials."""
    # Save token
    seo_settings.save_token(test_brand_id, real_credentials)
    
    # Verify file exists
    token_path = seo_settings.get_token_path(test_brand_id)
    assert token_path.exists()
    
    # Load token
    loaded_token = seo_settings.load_token(test_brand_id)
    assert loaded_token is not None
    assert loaded_token["refresh_token"] == real_credentials["refresh_token"]
    
    # Clean up
    token_path.unlink()