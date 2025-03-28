"""
Unit tests for the Ranking Performance Analyzer Service.
"""

import pytest
import json
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

from src.services.ranking_performance_analyzer import ranking_performance_analyzer


@pytest.fixture
def mock_search_data():
    """Sample search performance data."""
    return {
        "status": "success",
        "url": "https://example.com/blog/content-marketing",
        "search_performance": {
            "monthly": [
                {
                    "query": "content marketing guide",
                    "position": 8.5,
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
                }
            ],
            "quarterly": [
                {
                    "query": "content marketing guide",
                    "position": 9.8,
                    "impressions": 3500,
                    "clicks": 120,
                    "ctr": 3.43
                },
                {
                    "query": "content marketing examples",
                    "position": 15.1,
                    "impressions": 2400,
                    "clicks": 35,
                    "ctr": 1.46
                }
            ]
        }
    }


@pytest.mark.asyncio
async def test_detect_declining_rankings(mock_search_data):
    """Test detecting declining rankings in search performance."""
    with patch("src.services.search_console_service.search_console_service.get_content_search_data") as mock_get_data:
        # Set up mock data
        mock_get_data.return_value = mock_search_data
        
        # Test analysis
        result = await ranking_performance_analyzer.detect_declining_rankings(
            brand_id=123,
            content_id=456
        )
        
        # Assertions
        assert result["status"] == "success"
        assert "declining_keywords" in result
        assert "improving_keywords" in result
        
        # We expect "content marketing guide" to be improving (8.5 vs 9.8, lower is better)
        # and "content marketing examples" to be declining or unchanged
        improving = result["improving_keywords"]
        assert any(kw["query"] == "content marketing guide" for kw in improving)


@pytest.mark.asyncio
async def test_generate_content_update_recommendations():
    """Test generating content update recommendations."""
    with patch("src.services.ranking_performance_analyzer.ai_provider_manager") as mock_ai:
        # Set up mock AI response for recommendations
        mock_ai.generate_content.return_value = {
            "text": json.dumps({
                "recommendations": [
                    "Update the introduction to include more recent statistics",
                    "Add a section addressing the latest industry trends",
                    "Include more real-world examples of successful content marketing strategies"
                ],
                "keyword_recommendations": [
                    "Include the phrase 'content marketing ROI' in a subheading",
                    "Add more context around 'content marketing metrics'"
                ],
                "priority": "medium"
            })
        }
        
        # Test generation of recommendations
        result = await ranking_performance_analyzer.generate_content_update_recommendations(
            content_id=123,
            content_text="This is sample content about content marketing strategies.",
            underperforming_keywords=["content marketing ROI", "content marketing metrics"],
            url="https://example.com/blog/content-marketing"
        )
        
        # Assertions
        assert result["status"] == "success"
        assert "recommendations" in result
        assert len(result["recommendations"]) == 3
        assert "keyword_recommendations" in result
        assert len(result["keyword_recommendations"]) == 2
        assert "priority" in result
        assert result["priority"] == "medium"


@pytest.mark.asyncio
async def test_analyze_content_performance():
    """Test overall content performance analysis."""
    with patch.object(ranking_performance_analyzer, "detect_declining_rankings") as mock_detect:
        # Set up mock for declining rankings detection
        mock_detect.return_value = {
            "status": "success",
            "declining_keywords": [
                {"query": "content marketing ROI", "position_change": 2.5}
            ],
            "improving_keywords": [
                {"query": "content marketing guide", "position_change": -1.3}
            ]
        }
        
        with patch.object(ranking_performance_analyzer, "generate_content_update_recommendations") as mock_recommendations:
            # Set up mock for recommendations
            mock_recommendations.return_value = {
                "status": "success",
                "recommendations": ["Update introduction", "Add more examples"],
                "keyword_recommendations": ["Include 'ROI' in heading"],
                "priority": "medium"
            }
            
            # Test full analysis
            result = await ranking_performance_analyzer.analyze_content_performance(
                brand_id=123,
                content_id=456,
                content_text="Sample content text."
            )
            
            # Assertions
            assert result["status"] == "success"
            assert "performance_summary" in result
            assert "update_recommendations" in result
            assert "performance_data" in result
            
            # Verify methods were called correctly
            mock_detect.assert_called_once_with(brand_id=123, content_id=456)
            assert mock_recommendations.call_count == 1


@pytest.mark.asyncio
async def test_suggest_content_update_schedule():
    """Test suggesting update schedule based on performance."""
    # Test with declining rankings
    with patch.object(ranking_performance_analyzer, "detect_declining_rankings") as mock_detect:
        # Set up mock for significant decline
        mock_detect.return_value = {
            "status": "success",
            "declining_keywords": [
                {"query": "content marketing ROI", "position_change": 5.0},
                {"query": "content marketing metrics", "position_change": 3.2}
            ],
            "improving_keywords": [],
            "net_position_change": 4.1,  # Significant decline
            "traffic_impact": "high"
        }
        
        # Test scheduling with significant decline
        result = await ranking_performance_analyzer.suggest_content_update_schedule(
            brand_id=123,
            content_id=456,
            content_age_days=90
        )
        
        # Assertions for urgent update needed
        assert result["status"] == "success"
        assert result["update_priority"] == "high"
        assert "next_update_recommended_date" in result
        assert "update_frequency_days" in result
        
        # Test with stable or improving rankings
        mock_detect.return_value = {
            "status": "success",
            "declining_keywords": [
                {"query": "content marketing tools", "position_change": 0.5}
            ],
            "improving_keywords": [
                {"query": "content marketing guide", "position_change": -2.3}
            ],
            "net_position_change": -1.8,  # Net improvement
            "traffic_impact": "low"
        }
        
        # Test scheduling with stable performance
        result = await ranking_performance_analyzer.suggest_content_update_schedule(
            brand_id=123,
            content_id=456,
            content_age_days=90
        )
        
        # Assertions for lower priority update
        assert result["status"] == "success"
        assert result["update_priority"] == "low"
        assert result["update_frequency_days"] > 30  # Longer update interval