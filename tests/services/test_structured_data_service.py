"""
Unit tests for the Structured Data Service.
"""

import pytest
import json
from unittest.mock import patch, MagicMock

from src.services.structured_data_service import structured_data_service

@pytest.fixture
def sample_content():
    """Sample content for testing."""
    return """
    # How to Create a Content Marketing Strategy
    
    Content marketing is an essential part of digital marketing in 2025. This guide will help you create 
    an effective content marketing strategy for your business.
    
    ## Step 1: Define Your Goals
    
    Start by identifying what you want to achieve with your content marketing efforts. Common goals include:
    - Increasing brand awareness
    - Generating leads
    - Boosting conversions
    - Improving customer retention
    
    ## Step 2: Know Your Audience
    
    Research your target audience to understand their needs, preferences, and pain points.
    
    ## Step 3: Conduct a Content Audit
    
    Evaluate your existing content to identify gaps and opportunities.
    """

@pytest.fixture
def sample_faq_content():
    """Sample FAQ content for testing."""
    return """
    # Frequently Asked Questions About Content Marketing
    
    ## What is content marketing?
    Content marketing is a strategic approach focused on creating valuable content to attract and retain a clearly defined audience.
    
    ## Why is content marketing important?
    Content marketing builds trust with your audience, improves conversions, and helps you connect with customers.
    
    ## How do I measure content marketing success?
    You can measure content marketing success through metrics like traffic, engagement, conversion rates, and ROI.
    """

@pytest.mark.asyncio
async def test_generate_article_schema(sample_content):
    """Test article schema generation."""
    meta_data = {
        "title": "How to Create a Content Marketing Strategy",
        "description": "Learn how to create an effective content marketing strategy in 2025",
        "url": "https://example.com/content-marketing-strategy",
        "author_name": "John Doe",
        "publisher_name": "Marketing Experts Inc.",
        "publisher_logo_url": "https://example.com/logo.png",
        "image_url": "https://example.com/images/content-marketing.jpg",
        "date_published": "2025-03-26",
        "keywords": ["content marketing", "marketing strategy", "digital marketing"]
    }
    
    with patch('src.services.structured_data_service._validate_markup') as mock_validate:
        # Mock validation
        mock_validate.return_value = {"is_valid": True, "issues": []}
        
        # Test schema generation
        result = await structured_data_service.generate_article_schema(sample_content, meta_data)
        
        # Assertions
        assert result["status"] == "success"
        assert result["schema_type"] == "Article"
        assert "markup" in result
        
        # Verify markup structure
        markup = result["markup"]
        assert markup["@type"] == "Article"
        assert markup["headline"] == meta_data["title"]
        assert markup["author"]["name"] == meta_data["author_name"]
        assert markup["publisher"]["name"] == meta_data["publisher_name"]

@pytest.mark.asyncio
async def test_generate_blogposting_schema(sample_content):
    """Test blog posting schema generation."""
    meta_data = {
        "title": "How to Create a Content Marketing Strategy",
        "description": "Learn how to create an effective content marketing strategy in 2025",
        "url": "https://example.com/blog/content-marketing-strategy",
        "author_name": "John Doe",
        "publisher_name": "Marketing Experts Inc.",
        "date_published": "2025-03-26",
        "category": "Digital Marketing"
    }
    
    with patch('src.services.structured_data_service._validate_markup') as mock_validate:
        # Mock validation
        mock_validate.return_value = {"is_valid": True, "issues": []}
        
        # Test schema generation
        result = await structured_data_service.generate_blogposting_schema(sample_content, meta_data)
        
        # Assertions
        assert result["status"] == "success"
        assert result["schema_type"] == "BlogPosting"
        assert "markup" in result
        
        # Verify markup structure
        markup = result["markup"]
        assert markup["@type"] == "BlogPosting"
        assert markup["headline"] == meta_data["title"]
        assert "articleSection" in markup
        assert markup["articleSection"] == meta_data["category"]
        assert "wordCount" in markup

@pytest.mark.asyncio
async def test_generate_faq_schema(sample_faq_content):
    """Test FAQ schema generation."""
    meta_data = {
        "title": "Content Marketing FAQs",
        "description": "Frequently asked questions about content marketing",
        "url": "https://example.com/faqs/content-marketing",
    }
    
    with patch('src.services.structured_data_service._extract_faq_items') as mock_extract:
        # Mock FAQ extraction
        mock_extract.return_value = [
            {"question": "What is content marketing?", "answer": "Content marketing is a strategic approach..."},
            {"question": "Why is content marketing important?", "answer": "Content marketing builds trust..."},
            {"question": "How do I measure content marketing success?", "answer": "You can measure content marketing success..."}
        ]
        
        with patch('src.services.structured_data_service._validate_markup') as mock_validate:
            # Mock validation
            mock_validate.return_value = {"is_valid": True, "issues": []}
            
            # Test schema generation
            result = await structured_data_service.generate_faq_schema(sample_faq_content, meta_data)
            
            # Assertions
            assert result["status"] == "success"
            assert result["schema_type"] == "FAQPage"
            assert "markup" in result
            
            # Verify markup structure
            markup = result["markup"]
            assert markup["@type"] == "FAQPage"
            assert "mainEntity" in markup
            assert len(markup["mainEntity"]) == 3
            assert markup["mainEntity"][0]["@type"] == "Question"
            assert "acceptedAnswer" in markup["mainEntity"][0]

@pytest.mark.asyncio
async def test_generate_howto_schema(sample_content):
    """Test HowTo schema generation."""
    meta_data = {
        "title": "How to Create a Content Marketing Strategy",
        "description": "Step-by-step guide to creating an effective content marketing strategy",
        "url": "https://example.com/how-to/content-marketing-strategy",
        "image_url": "https://example.com/images/content-marketing.jpg",
        "total_time": "PT2H",  # 2 hours in ISO 8601 duration format
        "steps": [
            {"name": "Define Your Goals", "text": "Start by identifying what you want to achieve..."},
            {"name": "Know Your Audience", "text": "Research your target audience to understand..."},
            {"name": "Conduct a Content Audit", "text": "Evaluate your existing content to identify..."}
        ]
    }
    
    with patch('src.services.structured_data_service._validate_markup') as mock_validate:
        # Mock validation
        mock_validate.return_value = {"is_valid": True, "issues": []}
        
        # Test schema generation
        result = await structured_data_service.generate_howto_schema(sample_content, meta_data)
        
        # Assertions
        assert result["status"] == "success"
        assert result["schema_type"] == "HowTo"
        assert "markup" in result
        
        # Verify markup structure
        markup = result["markup"]
        assert markup["@type"] == "HowTo"
        assert markup["name"] == meta_data["title"]
        assert "step" in markup
        assert len(markup["step"]) == 3
        assert markup["step"][0]["@type"] == "HowToStep"
        assert markup["totalTime"] == meta_data["total_time"]

@pytest.mark.asyncio
async def test_extract_howto_steps():
    """Test extraction of HowTo steps from content."""
    content = """
    # How to Make a Cake
    
    Follow these simple steps to bake a delicious cake.
    
    ## Step 1: Gather Ingredients
    
    You'll need flour, sugar, eggs, and butter.
    
    ## Step 2: Mix Ingredients
    
    Combine all ingredients in a large bowl and mix thoroughly.
    
    ## Step 3: Bake
    
    Preheat the oven to 350°F and bake for 30 minutes.
    """
    
    with patch('src.services.structured_data_service.ai_provider_manager') as mock_ai:
        # We won't use AI for this test as the regex should catch the steps
        mock_ai.generate_content.return_value = {"text": "[]"}
        
        # Test step extraction
        steps = await structured_data_service._extract_howto_steps(content, {})
        
        # Assertions
        assert len(steps) == 3
        assert steps[0]["name"] == "Gather Ingredients"
        assert "flour" in steps[0]["text"]
        assert steps[1]["name"] == "Mix Ingredients"
        assert steps[2]["name"] == "Bake"