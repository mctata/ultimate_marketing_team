"""
Integration tests for content recommendations workflow.

Tests the end-to-end flow from clustering content
to generating recommendations for users.
"""

import pytest
import json
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from unittest.mock import patch, MagicMock, AsyncMock

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete

from src.api.main import app
from src.core.content_recommendations import ContentRecommendationService
from src.models.system import ContentAttributionPath

# Test client
client = TestClient(app)

# Sample content data for testing
@pytest.fixture
def sample_content_features():
    return [
        {
            "content_id": 1,
            "title": "Introduction to Machine Learning",
            "description": "Learn the basics of machine learning and AI",
            "content_type": "blog",
            "tags": "machine learning, AI, technology",
            "word_count": 1500,
            "has_image": True,
            "publish_time": 9
        },
        {
            "content_id": 2,
            "title": "Advanced Machine Learning Techniques",
            "description": "Explore advanced concepts in machine learning",
            "content_type": "blog",
            "tags": "machine learning, deep learning, neural networks",
            "word_count": 2000,
            "has_image": True,
            "publish_time": 10
        },
        {
            "content_id": 3,
            "title": "Marketing Automation Guide",
            "description": "How to implement marketing automation",
            "content_type": "guide",
            "tags": "marketing, automation, email",
            "word_count": 3000,
            "has_image": True,
            "publish_time": 11
        },
        {
            "content_id": 4,
            "title": "Social Media Marketing Tips",
            "description": "Tips for effective social media marketing",
            "content_type": "social",
            "tags": "marketing, social media, facebook, twitter",
            "word_count": 800,
            "has_image": True,
            "publish_time": 14
        },
        {
            "content_id": 5,
            "title": "Introduction to Neural Networks",
            "description": "Learn the basics of neural networks",
            "content_type": "blog",
            "tags": "machine learning, neural networks, AI",
            "word_count": 1800,
            "has_image": True,
            "publish_time": 9
        }
    ]

@pytest.fixture
def mock_auth():
    """Mock authentication for API endpoints."""
    patcher = patch('src.core.security.get_current_user_with_permissions')
    mock_get_user = patcher.start()
    
    # Mock user
    user = MagicMock()
    user.id = 999
    user.username = "testuser"
    user.email = "test@example.com"
    user.is_active = True
    
    mock_get_user.return_value = lambda: user
    yield mock_get_user
    patcher.stop()

@pytest.fixture
def attribution_path_data():
    return {
        "user_identifier": "test_user_123",
        "conversion_id": "test_conversion_456",
        "conversion_type": "purchase",
        "conversion_value": 10000,  # $100.00 in cents
        "path": [
            {"content_id": 1, "timestamp": (datetime.now() - timedelta(hours=5)).isoformat(), "platform": "facebook"},
            {"content_id": 2, "timestamp": (datetime.now() - timedelta(hours=3)).isoformat(), "platform": "website"},
            {"content_id": 3, "timestamp": (datetime.now() - timedelta(hours=1)).isoformat(), "platform": "website"}
        ],
        "first_touch_content_id": 1,
        "last_touch_content_id": 3,
        "conversion_date": datetime.now()
    }

@pytest.fixture(autouse=True)
def cleanup_test_data():
    """Clean up test data after each test."""
    yield
    
    # Use raw SQL delete to clean up test data
    from src.core.database import get_db
    with get_db() as session:
        # Delete test attribution paths
        session.execute(delete(ContentAttributionPath).where(
            ContentAttributionPath.user_identifier == "test_user_123"
        ))
        session.commit()

@pytest.mark.asyncio
async def test_recommendations_workflow(sample_content_features, attribution_path_data, mock_auth):
    """Test the complete content recommendations workflow."""
    from src.core.content_metrics import ContentMetricsService
    
    # Step 1: Record user content interaction via attribution path
    await ContentMetricsService.record_attribution_path(**attribution_path_data)
    
    # Step 2: Cluster content
    response = client.post(
        "/content-recommendations/cluster",
        json={
            "content_features": sample_content_features,
            "n_clusters": 2
        }
    )
    assert response.status_code == 200
    clustering = response.json()
    assert "content_ids" in clustering
    assert "clusters" in clustering
    assert "similarity_matrix" in clustering
    
    # Step 3: Get similar content
    response = client.post(
        "/content-recommendations/similar",
        params={"content_id": 1, "max_results": 3, "min_similarity": 0.1},
        json=sample_content_features
    )
    assert response.status_code == 200
    similar = response.json()
    assert similar["reference_content_id"] == 1
    assert "similar_content" in similar
    assert len(similar["similar_content"]) <= 3
    
    # Step 4: Get recommendations for user
    # Mock DB query to return our test attribution path
    with patch('src.core.content_recommendations.get_db') as mock_get_db:
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        
        # Create mock attribution path objects
        mock_path = MagicMock(spec=ContentAttributionPath)
        mock_path.user_identifier = attribution_path_data["user_identifier"]
        mock_path.path = attribution_path_data["path"]
        
        # Set up mock query results
        mock_session.execute.return_value.scalars.return_value.all.return_value = [mock_path]
        
        response = client.post(
            "/content-recommendations/user",
            json={
                "user_identifier": "test_user_123",
                "content_features": sample_content_features,
                "max_results": 2,
                "include_viewed": False
            }
        )
        
        assert response.status_code == 200
        user_recommendations = response.json()
        assert user_recommendations["user_identifier"] == "test_user_123"
        assert "recommendations" in user_recommendations
        
        # We should get recommendations that don't include content IDs 1, 2, 3
        # (which the user has already interacted with)
        for rec in user_recommendations["recommendations"]:
            assert rec["content_id"] not in [1, 2, 3]
    
    # Step 5: Get top performing similar content
    # Mock DB query to return performance data
    with patch('src.core.content_recommendations.get_db') as mock_get_db:
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        
        # Mock rows for content metric query
        mock_row1 = MagicMock()
        mock_row1.content_id = 4
        mock_row1.metric_value = 2000
        
        mock_row2 = MagicMock()
        mock_row2.content_id = 5
        mock_row2.metric_value = 1500
        
        # Set up mock query results
        mock_session.execute.return_value = [mock_row1, mock_row2]
        
        response = client.post(
            "/content-recommendations/top-performing",
            json={
                "content_id": 1,
                "content_features": sample_content_features,
                "max_results": 2,
                "performance_metric": "views"
            }
        )
        
        assert response.status_code == 200
        top_performing = response.json()
        assert top_performing["reference_content_id"] == 1
        assert top_performing["performance_metric"] == "views"
        assert "recommendations" in top_performing
        
        # First recommendation should be content ID 4 (highest views)
        if top_performing["recommendations"]:
            assert top_performing["recommendations"][0]["content_id"] == 4