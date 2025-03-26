"""
Tests for SEO API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
import json
from unittest.mock import patch, MagicMock

from src.api.main import app

client = TestClient(app)

@pytest.fixture
def mock_auth():
    """Mock authentication for testing."""
    with patch("src.core.security.get_current_user") as mock:
        mock.return_value = {"id": 1, "email": "test@example.com", "role": "admin"}
        yield mock

@pytest.fixture
def valid_seo_validation_payload():
    """Valid payload for SEO validation endpoint."""
    return {
        "content_text": "This is sample content for testing SEO validation.",
        "content_type": "blog_post",
        "title": "Test SEO Validation",
        "primary_keyword": "seo validation",
        "secondary_keywords": ["seo testing", "content validation"],
        "url": "https://example.com/test-seo-validation"
    }

@pytest.fixture
def valid_structured_data_payload():
    """Valid payload for structured data generation endpoint."""
    return {
        "content_text": "This is sample content for testing structured data generation.",
        "schema_type": "BlogPosting",
        "metadata": {
            "title": "Test Blog Post",
            "description": "This is a test blog post for structured data generation.",
            "author": {
                "name": "Test Author",
                "url": "https://example.com/author"
            },
            "publisher": {
                "name": "Test Publisher",
                "logo": "https://example.com/logo.png"
            },
            "datePublished": "2025-03-25T10:00:00Z",
            "featuredImage": "https://example.com/image.jpg",
            "url": "https://example.com/test-blog-post"
        }
    }

@pytest.mark.asyncio
async def test_validate_content_seo(mock_auth, valid_seo_validation_payload):
    """Test content SEO validation endpoint."""
    with patch("src.services.seo_validation_service.seo_validation_service.validate_content_seo") as mock_validate:
        # Mock the validation service
        mock_validate.return_value = {
            "status": "success",
            "overall_score": 85,
            "title_validation": {
                "score": 90,
                "issues": [],
                "suggestions": ["Consider adding a power word to the title"],
                "title_length": 40,
                "has_primary_keyword": True
            }
        }
        
        # Make request
        response = client.post(
            "/api/v1/seo/validate-content",
            json=valid_seo_validation_payload,
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assert response
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert "overall_score" in response.json()
        assert "title_validation" in response.json()

@pytest.mark.asyncio
async def test_generate_structured_data(mock_auth, valid_structured_data_payload):
    """Test structured data generation endpoint."""
    with patch("src.services.structured_data_service.structured_data_service.generate_blogposting_schema") as mock_generate:
        # Mock the structured data service
        mock_generate.return_value = {
            "status": "success",
            "schema_type": "BlogPosting",
            "json_ld": {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": "Test Blog Post"
            },
            "json_ld_script": '<script type="application/ld+json">{"@context":"https://schema.org","@type":"BlogPosting","headline":"Test Blog Post"}</script>'
        }
        
        # Make request
        response = client.post(
            "/api/v1/seo/structured-data",
            json=valid_structured_data_payload,
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assert response
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert response.json()["schema_type"] == "BlogPosting"
        assert "@context" in response.json()["json_ld"]
        assert "json_ld_script" in response.json()

@pytest.mark.asyncio
async def test_get_search_performance(mock_auth):
    """Test search performance endpoint."""
    with patch("src.services.search_console_service.search_console_service.get_search_performance") as mock_performance:
        # Mock the search console service
        mock_performance.return_value = {
            "status": "success",
            "data": [
                {"query": "test keyword", "clicks": 100, "impressions": 1000, "ctr": 0.1, "position": 5.0}
            ],
            "metadata": {
                "brand_id": 1,
                "start_date": "2025-03-01",
                "end_date": "2025-03-25",
                "dimension": "query"
            }
        }
        
        # Make request
        response = client.get(
            "/api/v1/seo/search-performance?brand_id=1&start_date=2025-03-01&end_date=2025-03-25&dimension=query",
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assert response
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert "data" in response.json()
        assert len(response.json()["data"]) > 0