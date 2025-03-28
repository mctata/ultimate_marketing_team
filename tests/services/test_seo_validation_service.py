"""
Unit tests for the SEO Validation Service.
"""

import pytest
import json
from unittest.mock import patch, MagicMock

from src.services.seo_validation_service import seo_validation_service

@pytest.fixture
def sample_content():
    """Sample content for testing."""
    return """
    # Ultimate Guide to Content Marketing
    
    Content marketing is a strategic approach to creating valuable content that attracts and engages your target audience.
    
    ## Benefits of Content Marketing
    
    1. Increased brand awareness
    2. Higher engagement rates
    3. Better SEO performance
    
    ## How to Create an Effective Content Strategy
    
    Start by identifying your target audience and their needs. Then, develop content that addresses those needs while
    aligning with your brand's goals and values.
    """

@pytest.mark.asyncio
async def test_validate_content_seo_basic():
    """Test basic SEO validation functionality."""
    content = "This is a sample article about content marketing strategies for businesses in 2025."
    
    with patch('src.services.seo_validation_service.ai_provider_manager') as mock_ai:
        # Mock AI responses
        mock_ai.generate_content.return_value = {"text": '{"alignment_score": 7, "strengths": ["Good keyword usage"], "weaknesses": ["Missing detailed examples"], "suggestion": "Add more examples"}'}
        
        # Test validation
        result = await seo_validation_service.validate_content_seo(
            content_text=content,
            content_type="blog_post",
            primary_keyword="content marketing",
            secondary_keywords=["marketing strategy", "business marketing"]
        )
        
        # Assertions
        assert result["status"] == "success"
        assert "overall_score" in result
        assert "seo_checks" in result
        assert "improvement_recommendations" in result
        
        # Verify AI was called the expected number of times
        assert mock_ai.generate_content.call_count >= 3

@pytest.mark.asyncio
async def test_search_intent_analysis():
    """Test search intent analysis functionality."""
    with patch('src.services.seo_validation_service.ai_provider_manager') as mock_ai:
        # Mock AI responses for intent detection
        mock_ai.generate_content.return_value = {"text": "informational"}
        
        # Test intent detection
        intent = await seo_validation_service._detect_search_intent("how to create content marketing strategy")
        
        # Assertions
        assert intent == "informational"
        
        # Test with commercial intent
        mock_ai.generate_content.return_value = {"text": "commercial"}
        intent = await seo_validation_service._detect_search_intent("best content marketing tools")
        assert intent == "commercial"

@pytest.mark.asyncio
async def test_analyze_search_intent_for_keywords():
    """Test analyzing search intent for multiple keywords."""
    keywords = ["content marketing guide", "best marketing tools", "content marketing roi"]
    
    with patch('src.services.seo_validation_service._detect_search_intent') as mock_detect:
        # Set up mock return values for different keywords
        mock_detect.side_effect = ["informational", "commercial", "commercial"]
        
        # Test analysis
        results = await seo_validation_service.analyze_search_intent_for_keywords(keywords)
        
        # Assertions
        assert len(results) == 3
        assert "content marketing guide" in results
        assert results["content marketing guide"]["intent"] == "informational"
        assert "best marketing tools" in results
        assert results["best marketing tools"]["intent"] == "commercial"
        assert "content_suggestions" in results["content marketing guide"]

@pytest.mark.asyncio
async def test_helpful_content_assessment(sample_content):
    """Test helpful content assessment functionality."""
    with patch('src.services.seo_validation_service.ai_provider_manager') as mock_ai:
        # Mock AI responses
        mock_ai.generate_content.return_value = {"text": '{"overall_score": 8, "criteria_scores": {"people_first": 8, "expertise": 7, "primary_focus": 9, "substantial_value": 8, "question_answered": 8}, "strengths": ["Well-structured content", "Clear explanations"], "weaknesses": ["Could use more examples"], "suggestions": ["Add specific examples", "Include more data points"]}'}
        
        # Test assessment
        result = await seo_validation_service._assess_helpful_content(
            content_text=sample_content,
            keyword="content marketing"
        )
        
        # Assertions
        assert result["status"] == "success"
        assert result["overall_score"] == 8
        assert "strengths" in result
        assert "weaknesses" in result
        assert "suggestions" in result
        assert len(result["suggestions"]) == 2

@pytest.mark.asyncio
async def test_eeat_signals_check(sample_content):
    """Test E-E-A-T signals check functionality."""
    with patch('src.services.seo_validation_service.ai_provider_manager') as mock_ai:
        # Mock AI responses
        mock_ai.generate_content.return_value = {"text": '{"experience_score": 7, "expertise_score": 8, "authoritativeness_score": 6, "trustworthiness_score": 7, "overall_score": 7, "strengths": ["Expert tone", "Clear explanations"], "weaknesses": ["Few citations", "Limited data"], "suggestions": ["Add author credentials", "Cite authoritative sources"]}'}
        
        # Test assessment
        result = await seo_validation_service._check_eeat_signals(
            content_text=sample_content,
            content_type="blog_post"
        )
        
        # Assertions
        assert result["status"] == "success"
        assert result["overall_score"] == 7
        assert "strengths" in result
        assert "weaknesses" in result
        assert "suggestions" in result
        assert result["experience_score"] == 7
        assert result["expertise_score"] == 8
        assert result["authoritativeness_score"] == 6
        assert result["trustworthiness_score"] == 7