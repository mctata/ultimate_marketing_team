"""
Unit tests for ContentRecommendationService
"""

import pytest
import pickle
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock, mock_open

from src.core.content_recommendations import ContentRecommendationService
from src.models.system import ContentMetric, ContentAttributionPath

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
def mock_attribution_paths():
    path1 = MagicMock(spec=ContentAttributionPath)
    path1.user_identifier = "user123"
    path1.conversion_id = "conv456"
    path1.path = [
        {"content_id": 1, "timestamp": datetime.now() - timedelta(days=5), "platform": "website"},
        {"content_id": 2, "timestamp": datetime.now() - timedelta(days=3), "platform": "website"},
        {"content_id": 5, "timestamp": datetime.now() - timedelta(days=1), "platform": "website"}
    ]
    
    path2 = MagicMock(spec=ContentAttributionPath)
    path2.user_identifier = "user123"
    path2.conversion_id = "conv789"
    path2.path = [
        {"content_id": 3, "timestamp": datetime.now() - timedelta(days=4), "platform": "email"},
        {"content_id": 1, "timestamp": datetime.now() - timedelta(days=2), "platform": "website"}
    ]
    
    return [path1, path2]

class TestContentRecommendationService:
    """Test cases for ContentRecommendationService"""

    @pytest.mark.asyncio
    @patch('src.core.content_recommendations.open', new_callable=mock_open)
    @patch('src.core.content_recommendations.pickle.dump')
    async def test_cluster_similar_content(self, mock_pickle_dump, mock_file, sample_content_features):
        """Test clustering content based on features and text"""
        # Call function
        result = await ContentRecommendationService.cluster_similar_content(
            content_features=sample_content_features,
            n_clusters=2,
            feature_fields=['content_type', 'word_count', 'publish_time'],
            text_fields=['title', 'description', 'tags']
        )
        
        # Check that clustering was performed
        assert "content_ids" in result
        assert "clusters" in result
        assert "cluster_centers" in result
        assert "similarity_matrix" in result
        assert "content_by_cluster" in result
        
        # Check that all content IDs are present
        assert len(result["content_ids"]) == 5
        assert set(result["content_ids"]) == {1, 2, 3, 4, 5}
        
        # Check that clusters were created properly
        assert len(result["clusters"]) == 5
        assert len(result["cluster_centers"]) == 2  # As specified in n_clusters
        
        # Check similarity matrix properties
        assert len(result["similarity_matrix"]) == 5
        assert len(result["similarity_matrix"][0]) == 5
        
        # Check that content was grouped by cluster
        assert all(cluster_id in result["content_by_cluster"] for cluster_id in map(str, set(result["clusters"])))
        
        # Check that pickle.dump was called to save the model
        assert mock_pickle_dump.called
        assert mock_file.called

    @pytest.mark.asyncio
    async def test_get_similar_content(self, sample_content_features):
        """Test getting content similar to a reference piece"""
        # Call function
        result = await ContentRecommendationService.get_similar_content(
            content_id=1,  # ML intro article
            content_features=sample_content_features,
            max_results=3,
            min_similarity=0.0  # Set to 0 to ensure we get results
        )
        
        # Check result structure
        assert "reference_content_id" in result
        assert "similar_content" in result
        assert result["reference_content_id"] == 1
        
        # Check that similar content is returned
        assert len(result["similar_content"]) <= 3  # max_results
        assert all("content_id" in item for item in result["similar_content"])
        assert all("similarity" in item for item in result["similar_content"])
        
        # Articles 2 and 5 should be most similar to article 1
        similar_ids = [item["content_id"] for item in result["similar_content"]]
        assert 2 in similar_ids or 5 in similar_ids

    @pytest.mark.asyncio
    @patch('src.core.content_recommendations.get_db')
    async def test_get_top_performing_similar_content(self, mock_get_db, sample_content_features):
        """Test getting similar content sorted by performance"""
        # Setup mock session
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        
        # Mock query result for performance data
        mock_row1 = MagicMock()
        mock_row1.content_id = 2
        mock_row1.metric_value = 2000
        
        mock_row2 = MagicMock()
        mock_row2.content_id = 5
        mock_row2.metric_value = 1000
        
        mock_session.execute.return_value = [mock_row1, mock_row2]
        
        # Call function
        result = await ContentRecommendationService.get_top_performing_similar_content(
            content_id=1,
            content_features=sample_content_features,
            max_results=2,
            performance_metric='views'
        )
        
        # Check result structure
        assert "reference_content_id" in result
        assert "performance_metric" in result
        assert "recommendations" in result
        assert result["reference_content_id"] == 1
        assert result["performance_metric"] == 'views'
        
        # Check recommendations
        assert len(result["recommendations"]) <= 2  # max_results
        assert all("content_id" in item for item in result["recommendations"])
        assert all("similarity" in item for item in result["recommendations"])
        assert all("views_value" in item for item in result["recommendations"])
        assert all("score" in item for item in result["recommendations"])
        
        # Article 2 should be first due to higher metric value
        assert result["recommendations"][0]["content_id"] == 2
        assert result["recommendations"][0]["views_value"] == 2000.0

    @pytest.mark.asyncio
    @patch('src.core.content_recommendations.get_db')
    async def test_get_recommendations_for_user(self, mock_get_db, sample_content_features, mock_attribution_paths):
        """Test getting recommendations for a specific user"""
        # Setup mock session
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        mock_session.execute.return_value.scalars.return_value.all.return_value = mock_attribution_paths
        
        # Call function
        result = await ContentRecommendationService.get_recommendations_for_user(
            user_identifier="user123",
            content_features=sample_content_features,
            max_results=3,
            include_viewed=False
        )
        
        # Check result structure
        assert "user_identifier" in result
        assert "reference_content_id" in result
        assert "user_history_count" in result
        assert "recommendations" in result
        assert result["user_identifier"] == "user123"
        assert result["user_history_count"] == 3  # 3 unique content IDs in history
        
        # Reference content should be content 1 which appears twice in the user's history
        assert result["reference_content_id"] == 1
        
        # Check recommendations
        assert len(result["recommendations"]) <= 3
        assert all("content_id" in item for item in result["recommendations"])
        assert all("similarity" in item for item in result["recommendations"])
        
        # Recommendations should not include already viewed content
        viewed_content_ids = {1, 2, 3, 5}
        for item in result["recommendations"]:
            assert item["content_id"] not in viewed_content_ids
            
    @pytest.mark.asyncio
    @patch('src.core.content_recommendations.get_db')
    async def test_get_recommendations_for_user_with_viewed(self, mock_get_db, sample_content_features, mock_attribution_paths):
        """Test getting recommendations for a user including already viewed content"""
        # Setup mock session
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        mock_session.execute.return_value.scalars.return_value.all.return_value = mock_attribution_paths
        
        # Call function with include_viewed=True
        result = await ContentRecommendationService.get_recommendations_for_user(
            user_identifier="user123",
            content_features=sample_content_features,
            max_results=3,
            include_viewed=True
        )
        
        # Check result structure
        assert "recommendations" in result
        assert len(result["recommendations"]) <= 3
        
        # Now recommendations can include viewed content
        # We expect to see the similar content (2, 5) even though they've been viewed
        recommendation_ids = {item["content_id"] for item in result["recommendations"]}
        assert len(recommendation_ids.intersection({2, 5})) > 0