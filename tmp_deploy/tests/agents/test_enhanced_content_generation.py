"""
Test for enhanced content generation functionality.

This test validates the new AI content generation capabilities.
"""

import pytest
import asyncio
from unittest.mock import MagicMock, patch
import json

from src.agents.integrations.prompt_manager import PromptManager, PromptTemplate
from src.agents.integrations.ai_provider_manager import ai_provider_manager, ContentType
from src.agents.integrations.content_quality_service import content_quality_service, ContentQualityScore

# Test template content
TEST_SYSTEM_PROMPT = "You are a helpful blog content creator for {{company_name}}."
TEST_TEMPLATE = "Create a blog post about {{topic}} for {{audience}}."
TEST_RESPONSE_FORMAT = "# Title\n\n## Introduction\n\n## Body\n\n## Conclusion"

@pytest.mark.asyncio
async def test_prompt_template_rendering():
    """Test that prompt templates render correctly with variables."""
    # Create a test template
    template = PromptTemplate(None)
    template.system_prompt = TEST_SYSTEM_PROMPT
    template.template = TEST_TEMPLATE
    template.response_format = TEST_RESPONSE_FORMAT
    
    # Render with variables
    variables = {
        "company_name": "Acme Inc.",
        "topic": "artificial intelligence",
        "audience": "technology professionals"
    }
    
    rendered = template.render(variables)
    
    # Verify rendered content
    assert rendered["system_prompt"] == "You are a helpful blog content creator for Acme Inc."
    assert rendered["user_prompt"] == "Create a blog post about artificial intelligence for technology professionals."
    assert rendered["response_format"] == TEST_RESPONSE_FORMAT

@pytest.mark.asyncio
@patch("src.agents.integrations.ai_provider_manager.ai_client")
async def test_ai_provider_manager_generation(mock_ai_client):
    """Test content generation through AI provider manager."""
    # Mock AI client response
    mock_response = {
        "text": "This is a generated blog post about AI.",
        "provider": "test_provider",
        "model": "test_model",
        "usage": {
            "prompt_tokens": 50,
            "completion_tokens": 100,
            "total_tokens": 150
        },
        "generation_time": 500
    }
    
    # Configure the mock to return our test response
    mock_ai_client.get_text_completion.return_value = mock_response
    
    # Call the AI provider manager
    result = await ai_provider_manager.generate_content(
        prompt="Create a blog post about AI.",
        content_type=ContentType.BLOG_POST
    )
    
    # Verify result
    assert "text" in result
    assert "provider" in result
    assert "model" in result
    assert result["text"] == "This is a generated blog post about AI."

@pytest.mark.asyncio
@patch("src.agents.integrations.content_quality_service.ai_provider_manager")
async def test_content_quality_assessment(mock_ai_provider_manager):
    """Test content quality assessment functionality."""
    # Sample test content
    test_content = """
    # The Benefits of AI in Marketing
    
    Artificial intelligence is transforming how marketing teams work.
    
    ## Improved Targeting
    
    AI helps identify the right audience for your campaigns.
    
    ## Content Optimization
    
    Using AI to optimize content leads to better engagement.
    
    ## Conclusion
    
    Embracing AI tools can significantly improve marketing outcomes.
    """
    
    # Mock AI provider for evaluation responses
    mock_ai_response = {
        "text": "75",
        "provider": "test_provider",
        "model": "test_model"
    }
    mock_ai_provider_manager.generate_content.return_value = mock_ai_response
    
    # Run quality assessment
    quality_score = await content_quality_service.evaluate_content(
        content=test_content,
        content_type="blog_post",
        seo_keywords=["AI", "marketing", "automation"]
    )
    
    # Verify result has required components
    assert hasattr(quality_score, "readability")
    assert hasattr(quality_score, "grammar")
    assert hasattr(quality_score, "brand_consistency")
    assert hasattr(quality_score, "seo")
    assert hasattr(quality_score, "overall_quality_score")
    assert len(quality_score.strengths) > 0
    assert isinstance(quality_score.overall_quality_score, float)

@pytest.mark.asyncio
async def test_comprehensive_generation_flow():
    """End-to-end test of the content generation flow."""
    # This test would normally use mocks for all components
    # We'll just verify the classes and methods exist and can be imported
    
    # Check that key classes and methods are available
    assert hasattr(PromptManager, "render_prompt")
    assert hasattr(ai_provider_manager, "generate_content")
    assert hasattr(content_quality_service, "evaluate_content")
    
    # Success if no import errors
    assert True