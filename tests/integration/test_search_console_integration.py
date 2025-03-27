"""
Integration test for Google Search Console API integration.

This test simulates the entire OAuth2 flow and API usage for the Google Search Console integration.
It requires real credentials to be set in environment variables to run properly.

Environment variables needed:
- GOOGLE_OAUTH2_CLIENT_ID
- GOOGLE_OAUTH2_CLIENT_SECRET
- TEST_GSC_REFRESH_TOKEN (for bypassing the manual OAuth2 flow)
- TEST_GSC_SITE_URL (the site URL to test with)

Run with:
pytest tests/integration/test_search_console_integration.py -v --env=dev
"""

import pytest
import os
import json
import logging
from pathlib import Path
from datetime import datetime, timedelta
import aiohttp
import asyncio
from fastapi.testclient import TestClient

from src.api.main import app
from src.core import seo_settings
from src.agents.integrations.analytics.search_console import GoogleSearchConsoleIntegration
from src.services.search_console_service import search_console_service

# Configure logging
logger = logging.getLogger(__name__)

# Skip all tests if credentials not available
real_credentials_available = bool(os.getenv("GOOGLE_OAUTH2_CLIENT_ID") and 
                             os.getenv("GOOGLE_OAUTH2_CLIENT_SECRET") and
                             os.getenv("TEST_GSC_REFRESH_TOKEN"))

pytestmark = pytest.mark.skipif(not real_credentials_available, 
                                reason="Real credentials not available")

@pytest.fixture
def client():
    """Return a TestClient for testing the FastAPI app."""
    return TestClient(app)

@pytest.fixture
def test_brand_id():
    """Test brand ID for token storage."""
    return 9998  # Use a unique number to avoid conflicts

@pytest.fixture
def test_site_url():
    """Test site URL for testing."""
    return os.getenv("TEST_GSC_SITE_URL", "sc-domain:example.com")

@pytest.fixture
def real_credentials():
    """
    Provides real credentials for testing.
    
    This bypasses the need for manual OAuth2 flow by using a pre-authorized refresh token.
    """
    return {
        "token": "expired_token",  # Will be refreshed
        "refresh_token": os.getenv("TEST_GSC_REFRESH_TOKEN"),
        "token_uri": "https://oauth2.googleapis.com/token",
        "client_id": os.getenv("GOOGLE_OAUTH2_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_OAUTH2_CLIENT_SECRET"),
        "scopes": ["https://www.googleapis.com/auth/webmasters.readonly"],
        "expiry": (datetime.now() - timedelta(hours=1)).isoformat()  # Force refresh
    }

@pytest.fixture
def mock_user():
    """Mock authenticated user."""
    return {"id": 1, "username": "testuser", "email": "test@example.com"}

@pytest.fixture(autouse=True)
def setup_and_teardown(test_brand_id, real_credentials):
    """Set up the test environment and clean up afterward."""
    # Prepare credentials
    token_path = seo_settings.get_token_path(test_brand_id)
    
    # Create the credentials file
    with open(token_path, "w") as f:
        json.dump(real_credentials, f)
    
    yield
    
    # Clean up: remove test token file
    if token_path.exists():
        token_path.unlink()

@pytest.mark.asyncio
async def test_token_refresh_flow(test_brand_id, test_site_url):
    """Test the token refresh flow with real credentials."""
    # Create integration instance
    integration = GoogleSearchConsoleIntegration(
        brand_id=test_brand_id,
        site_url=test_site_url
    )
    
    # Verify credentials are loaded
    assert integration.credentials is not None
    
    # Get authentication headers (should trigger a refresh)
    headers = await integration._get_headers()
    
    # Verify headers
    assert "Authorization" in headers
    assert headers["Authorization"].startswith("Bearer ")
    assert headers["Content-Type"] == "application/json"
    
    # Verify the token file was updated
    updated_token = seo_settings.load_token(test_brand_id)
    assert updated_token is not None
    
    # Verify the expiry was updated
    old_expiry = datetime.fromisoformat(real_credentials["expiry"])
    new_expiry = datetime.fromisoformat(updated_token["expiry"])
    assert new_expiry > old_expiry
    assert new_expiry > datetime.now()
    
    # Log success
    logger.info(f"Token refreshed successfully. New expiry: {new_expiry}")

@pytest.mark.asyncio
async def test_search_performance_api(test_brand_id, test_site_url):
    """Test retrieving search performance data with real credentials."""
    # Create integration instance
    integration = GoogleSearchConsoleIntegration(
        brand_id=test_brand_id,
        site_url=test_site_url
    )
    
    # Calculate date range for last 30 days
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)
    end_date_str = end_date.strftime("%Y-%m-%d")
    start_date_str = start_date.strftime("%Y-%m-%d")
    
    # Get search performance data
    result = await integration.get_search_performance(
        start_date=start_date_str,
        end_date=end_date_str,
        dimensions=["query"],
        row_limit=10
    )
    
    # Verify successful retrieval
    assert "rows" in result
    
    # Log number of rows received
    logger.info(f"Retrieved {len(result.get('rows', []))} rows of search data")
    
    # If rows are present, validate the structure
    if result.get("rows", []):
        first_row = result["rows"][0]
        assert "keys" in first_row
        assert "clicks" in first_row
        assert "impressions" in first_row
        assert "ctr" in first_row
        assert "position" in first_row
        
        # Log example data
        logger.info(f"Example search data: {first_row}")

@pytest.mark.asyncio
async def test_content_search_performance(test_brand_id, test_site_url):
    """Test retrieving content search performance data with real credentials."""
    # Create integration instance
    integration = GoogleSearchConsoleIntegration(
        brand_id=test_brand_id,
        site_url=test_site_url
    )
    
    # Test with the root path
    page_path = "/"
    
    # Get content search performance
    result = await integration.get_content_search_performance(
        page_path=page_path,
        days=28
    )
    
    # Verify result structure
    assert "page_url" in result
    assert "date_range" in result
    assert "total_clicks" in result
    assert "total_impressions" in result
    assert "average_ctr" in result
    assert "average_position" in result
    assert "trends" in result
    assert "top_queries" in result
    assert "devices" in result
    
    # Log overview of the data
    logger.info(f"Content Performance for {result['page_url']}:")
    logger.info(f"  Clicks: {result['total_clicks']}")
    logger.info(f"  Impressions: {result['total_impressions']}")
    logger.info(f"  Position: {result['average_position']}")
    logger.info(f"  Top queries: {len(result['top_queries'])}")

@pytest.mark.asyncio
async def test_keyword_opportunities(test_brand_id, test_site_url):
    """Test retrieving keyword opportunities with real credentials."""
    # Create integration instance
    integration = GoogleSearchConsoleIntegration(
        brand_id=test_brand_id,
        site_url=test_site_url
    )
    
    # Get keyword opportunities
    result = await integration.get_keyword_opportunities(days=90)
    
    # Verify result structure
    assert "site_url" in result
    assert "date_range" in result
    assert "opportunities" in result
    
    # Log keyword opportunities
    logger.info(f"Found {len(result['opportunities'])} keyword opportunities")
    if result['opportunities']:
        # Log example opportunity
        example = result['opportunities'][0]
        logger.info(f"Example opportunity: {example['keyword']} ({example['opportunity_type']})")
        logger.info(f"  Current ranking: {example.get('current_ranking')}")
        logger.info(f"  Search volume: {example.get('search_volume')}")
        logger.info(f"  Opportunity score: {example.get('opportunity_score')}")

def test_check_authorization_endpoint(client, mock_user, test_brand_id):
    """Test the authorization status endpoint."""
    # Mock authentication
    client.app.dependency_overrides = {}  # Reset overrides
    
    # Add authentication bypass
    from src.api.routers.seo import get_current_user
    client.app.dependency_overrides[get_current_user] = lambda: mock_user
    
    # Call the authorization status endpoint
    response = client.get(f"/seo/auth/status?brand_id={test_brand_id}")
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["is_authorized"] is True
    assert data["brand_id"] == test_brand_id
    assert "expiration_time" in data

def test_search_performance_endpoint(client, mock_user, test_brand_id):
    """Test the search performance endpoint."""
    # Add authentication bypass
    from src.api.routers.seo import get_current_user
    client.app.dependency_overrides[get_current_user] = lambda: mock_user
    
    # Calculate date range for last 30 days
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)
    end_date_str = end_date.strftime("%Y-%m-%d")
    start_date_str = start_date.strftime("%Y-%m-%d")
    
    # Call the search performance endpoint
    response = client.get(
        f"/seo/search-performance?brand_id={test_brand_id}&start_date={start_date_str}&end_date={end_date_str}&dimension=query"
    )
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "data" in data

def test_content_search_data_endpoint(client, mock_user, test_brand_id):
    """Test the content search data endpoint."""
    # Add authentication bypass
    from src.api.routers.seo import get_current_user
    client.app.dependency_overrides[get_current_user] = lambda: mock_user
    
    # Use mock content ID for testing
    content_id = 12345
    
    # Call the content search data endpoint
    response = client.get(
        f"/seo/content/{content_id}/search-data?brand_id={test_brand_id}"
    )
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

def test_keyword_opportunities_endpoint(client, mock_user, test_brand_id):
    """Test the keyword opportunities endpoint."""
    # Add authentication bypass
    from src.api.routers.seo import get_current_user
    client.app.dependency_overrides[get_current_user] = lambda: mock_user
    
    # Use mock content ID for testing
    content_id = 12345
    
    # Call the keyword opportunities endpoint
    response = client.get(
        f"/seo/content/{content_id}/keyword-opportunities?brand_id={test_brand_id}"
    )
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "opportunities" in data

def test_content_seo_validation_endpoint(client, mock_user):
    """Test the content SEO validation endpoint."""
    # Add authentication bypass
    from src.api.routers.seo import get_current_user
    client.app.dependency_overrides[get_current_user] = lambda: mock_user
    
    # Create test content
    content = {
        "content_text": "This is a test article about marketing automation for testing the SEO validation API.",
        "content_type": "blog_post",
        "title": "Test SEO Validation",
        "primary_keyword": "marketing automation",
        "secondary_keywords": ["marketing strategy", "automation tools"],
        "url": "https://example.com/test-seo-validation"
    }
    
    # Call the validation endpoint
    response = client.post(
        "/seo/validate-content",
        json=content
    )
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "overall_score" in data
    assert "title_validation" in data
    assert "keyword_validation" in data