"""
Test cases for the Google Search Console integration
"""
import pytest
import json
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime, timedelta

from src.core import seo_settings
from src.agents.integrations.analytics.search_console import GoogleSearchConsoleIntegration


@pytest.fixture
def mock_credentials():
    """Mock OAuth2 credentials"""
    return {
        "token": "mock_token",
        "refresh_token": "mock_refresh_token",
        "token_uri": "https://oauth2.googleapis.com/token",
        "client_id": "mock_client_id",
        "client_secret": "mock_client_secret",
        "scopes": ["https://www.googleapis.com/auth/webmasters.readonly"],
        "expiry": (datetime.now() + timedelta(hours=1)).isoformat()
    }

@pytest.fixture
def mock_site_url():
    """Mock site URL for testing"""
    return "https://example.com"

@pytest.fixture
def mock_brand_id():
    """Mock brand ID for testing"""
    return 12345

@pytest.fixture
def gsc_integration(mock_brand_id, mock_site_url):
    """Create a GSC integration for testing"""
    integration = GoogleSearchConsoleIntegration(
        brand_id=mock_brand_id,
        site_url=mock_site_url
    )
    return integration

@pytest.mark.asyncio
async def test_authenticate(gsc_integration):
    """Test OAuth2 authentication flow initialization"""
    with patch.object(seo_settings, 'GOOGLE_OAUTH2_CLIENT_ID', 'test_client_id'), \
         patch.object(seo_settings, 'GOOGLE_OAUTH2_CLIENT_SECRET', 'test_client_secret'), \
         patch.object(seo_settings, 'GOOGLE_OAUTH2_REDIRECT_URI', 'https://example.com/callback'), \
         patch('google_auth_oauthlib.flow.InstalledAppFlow.from_client_config') as mock_flow_from_config, \
         patch('google_auth_oauthlib.flow.InstalledAppFlow.authorization_url') as mock_auth_url:
        
        # Setup mocks
        mock_flow_instance = MagicMock()
        mock_flow_from_config.return_value = mock_flow_instance
        mock_auth_url.return_value = ('https://accounts.google.com/o/oauth2/auth?test=1', 'test_state')
        
        # Call the method
        result = await gsc_integration.authenticate()
        
        # Verify results
        assert 'auth_url' in result
        assert 'state' in result
        assert result['auth_url'] == 'https://accounts.google.com/o/oauth2/auth?test=1'
        assert result['state'] == 'test_state'
        
        # Verify the flow was created correctly
        mock_flow_from_config.assert_called_once()
        config_arg = mock_flow_from_config.call_args[0][0]
        assert config_arg['web']['client_id'] == 'test_client_id'
        assert config_arg['web']['client_secret'] == 'test_client_secret'
        assert 'https://example.com/callback' in config_arg['web']['redirect_uris']

@pytest.mark.asyncio
async def test_process_oauth_callback(gsc_integration, mock_brand_id):
    """Test OAuth2 callback processing"""
    with patch.object(seo_settings, 'GOOGLE_OAUTH2_CLIENT_ID', 'test_client_id'), \
         patch.object(seo_settings, 'GOOGLE_OAUTH2_CLIENT_SECRET', 'test_client_secret'), \
         patch.object(seo_settings, 'GOOGLE_OAUTH2_REDIRECT_URI', 'https://example.com/callback'), \
         patch('google_auth_oauthlib.flow.InstalledAppFlow.from_client_config') as mock_flow_from_config, \
         patch.object(seo_settings, 'save_token') as mock_save_token:
        
        # Setup mocks
        mock_flow_instance = MagicMock()
        mock_flow_from_config.return_value = mock_flow_instance
        mock_flow_instance.fetch_token.return_value = {"access_token": "test_token"}
        mock_flow_instance.credentials = MagicMock()
        mock_flow_instance.credentials.to_json.return_value = '{"token": "test_token"}'
        
        # Call the method
        result = await gsc_integration.process_oauth_callback('test_code', 'test_state')
        
        # Verify results
        assert result['status'] == 'success'
        assert 'Authentication successful' in result['message']
        
        # Verify token was saved
        mock_save_token.assert_called_once_with(mock_brand_id, {"token": "test_token"})

@pytest.mark.asyncio
async def test_get_search_performance(gsc_integration, mock_site_url):
    """Test getting search performance data"""
    # Patch required methods
    with patch.object(gsc_integration, '_get_headers', new_callable=AsyncMock) as mock_get_headers, \
         patch('aiohttp.ClientSession.post') as mock_post:
        
        # Setup mock response
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json.return_value = {
            "rows": [
                {"keys": ["test query"], "clicks": 100, "impressions": 1000, "ctr": 0.1, "position": 1.5}
            ]
        }
        mock_post.return_value.__aenter__.return_value = mock_response
        mock_get_headers.return_value = {"Authorization": "Bearer test_token"}
        
        # Set credentials attribute to avoid fallback to mock data
        gsc_integration.credentials = MagicMock()
        gsc_integration.credentials.expired = False
        
        # Call the method
        result = await gsc_integration.get_search_performance(
            start_date="2025-01-01",
            end_date="2025-01-31",
            dimensions=["query"],
            row_limit=10
        )
        
        # Verify the result
        assert "rows" in result
        assert len(result["rows"]) == 1
        assert result["rows"][0]["keys"][0] == "test query"
        assert result["rows"][0]["clicks"] == 100
        assert result["rows"][0]["impressions"] == 1000
        
        # Verify the API call
        mock_post.assert_called_once()
        request_url = mock_post.call_args[0][0]
        assert mock_site_url in request_url
        assert "searchAnalytics/query" in request_url
        
        # Verify request payload
        request_data = mock_post.call_args[1]["json"]
        assert request_data["startDate"] == "2025-01-01"
        assert request_data["endDate"] == "2025-01-31"
        assert request_data["dimensions"] == ["query"]
        assert request_data["rowLimit"] == 10

@pytest.mark.asyncio
async def test_get_content_search_performance(gsc_integration, mock_site_url):
    """Test getting search performance for a specific content page"""
    # Patch the get_search_performance method
    with patch.object(gsc_integration, 'get_search_performance', new_callable=AsyncMock) as mock_get_performance:
        
        # Setup mock responses for the 4 calls
        mock_get_performance.side_effect = [
            # Overall data
            {"rows": [{"clicks": 100, "impressions": 1000, "ctr": 0.1, "position": 2.5}]},
            # Trend data
            {"rows": [
                {"keys": ["2025-01-01"], "clicks": 10, "impressions": 100, "ctr": 0.1, "position": 3.0},
                {"keys": ["2025-01-02"], "clicks": 15, "impressions": 120, "ctr": 0.125, "position": 2.8}
            ]},
            # Query data
            {"rows": [
                {"keys": ["test query 1"], "clicks": 50, "impressions": 500, "ctr": 0.1, "position": 2.0},
                {"keys": ["test query 2"], "clicks": 30, "impressions": 400, "ctr": 0.075, "position": 3.0}
            ]},
            # Device data
            {"rows": [
                {"keys": ["MOBILE"], "clicks": 60, "impressions": 600, "ctr": 0.1, "position": 2.6},
                {"keys": ["DESKTOP"], "clicks": 40, "impressions": 400, "ctr": 0.1, "position": 2.4}
            ]}
        ]
        
        # Call the method
        result = await gsc_integration.get_content_search_performance(
            page_path="/test-page",
            days=28
        )
        
        # Verify the basic structure of the result
        assert "page_url" in result
        assert "date_range" in result
        assert "total_clicks" in result
        assert "total_impressions" in result
        assert "average_ctr" in result
        assert "average_position" in result
        assert "trends" in result
        assert "top_queries" in result
        assert "devices" in result
        
        # Verify the data
        assert result["total_clicks"] == 100
        assert result["total_impressions"] == 1000
        assert result["average_ctr"] == 0.1
        assert result["average_position"] == 2.5
        
        # Verify the trend data
        assert len(result["trends"]["dates"]) == 2
        assert result["trends"]["dates"][0] == "2025-01-01"
        assert result["trends"]["clicks"][0] == 10
        
        # Verify the query data
        assert len(result["top_queries"]) == 2
        assert result["top_queries"][0]["keys"][0] == "test query 1"
        
        # Verify the device data
        assert "MOBILE" in result["devices"]
        assert "DESKTOP" in result["devices"]
        assert "TABLET" in result["devices"]  # Should be added with zeros if missing
        assert result["devices"]["MOBILE"]["clicks"] == 60
        assert result["devices"]["DESKTOP"]["impressions"] == 400

@pytest.mark.asyncio
async def test_get_keyword_opportunities(gsc_integration):
    """Test getting keyword opportunities"""
    # Patch the get_search_performance method
    with patch.object(gsc_integration, 'get_search_performance', new_callable=AsyncMock) as mock_get_performance:
        
        # Setup mock responses for the main and recent data calls
        mock_get_performance.side_effect = [
            # Main query data
            {"rows": [
                {"keys": ["seo strategies", "/blog/seo"], "clicks": 20, "impressions": 500, "ctr": 0.04, "position": 15.5},
                {"keys": ["content marketing", "/blog/content"], "clicks": 40, "impressions": 600, "ctr": 0.067, "position": 6.2},
                {"keys": ["low ctr keyword", "/blog/test"], "clicks": 5, "impressions": 300, "ctr": 0.016, "position": 3.5}
            ]},
            # Recent data for trend analysis
            {"rows": [
                {"keys": ["content marketing", "2025-01-01"], "clicks": 3, "impressions": 50, "ctr": 0.06, "position": 8.0},
                {"keys": ["content marketing", "2025-01-02"], "clicks": 4, "impressions": 55, "ctr": 0.07, "position": 7.0},
                {"keys": ["content marketing", "2025-01-03"], "clicks": 5, "impressions": 60, "ctr": 0.08, "position": 6.0}
            ]}
        ]
        
        # Call the method
        result = await gsc_integration.get_keyword_opportunities(days=30)
        
        # Verify the basic structure of the result
        assert "site_url" in result
        assert "date_range" in result
        assert "opportunities" in result
        
        # Verify the data
        assert len(result["opportunities"]) > 0
        
        # Check for proper opportunity identification
        # 1. Ranking improvement (positions 11-30)
        seo_strategies_opp = next((o for o in result["opportunities"] if o["keyword"] == "seo strategies"), None)
        assert seo_strategies_opp is not None
        assert seo_strategies_opp["opportunity_type"] == "ranking_improvement"
        assert seo_strategies_opp["current_ranking"] == 15.5
        
        # 2. CTR improvement (low CTR with good position)
        low_ctr_opp = next((o for o in result["opportunities"] if o["keyword"] == "low ctr keyword"), None)
        assert low_ctr_opp is not None
        assert low_ctr_opp["opportunity_type"] == "ctr_improvement"
        assert low_ctr_opp["current_ranking"] == 3.5
        
        # 3. Top positions opportunity (positions 4-10 with improving trend)
        content_mkt_opp = next((o for o in result["opportunities"] if o["keyword"] == "content marketing"), None)
        assert content_mkt_opp is not None
        assert content_mkt_opp["opportunity_type"] == "top_positions"
        assert content_mkt_opp["current_ranking"] == 6.2
        assert content_mkt_opp["trend_improving"] == True

@pytest.mark.asyncio
async def test_fallback_to_mock_data(gsc_integration):
    """Test fallback to mock data when API fails"""
    # Configure integration to use a valid site_url but no credentials
    gsc_integration.credentials = None
    
    # Call the method - should fall back to mock data
    result = await gsc_integration.get_search_performance(
        start_date="2025-01-01",
        end_date="2025-01-31",
        dimensions=["query"]
    )
    
    # Verify we got mock data
    assert "rows" in result
    assert len(result["rows"]) > 0
    # Typical mock data keywords
    expected_keywords = ["marketing automation", "email marketing tools", "best marketing platform"]
    found_keywords = [row["keys"][0] for row in result["rows"] if "query" in dimensions]
    assert any(kw in found_keywords for kw in expected_keywords)