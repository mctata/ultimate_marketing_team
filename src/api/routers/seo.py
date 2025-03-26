"""
SEO API Endpoints

This module provides endpoints for Google Search Console data, SEO validation,
and structured data generation.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
import logging
from datetime import datetime, date

from src.core.security import get_current_user
from src.services.search_console_service import search_console_service
from src.services.seo_validation_service import seo_validation_service
from src.services.structured_data_service import structured_data_service
from src.services.ranking_performance_analyzer import ranking_performance_analyzer

# Configure logging
logger = logging.getLogger(__name__)

# Define API models
class KeywordAnalysisRequest(BaseModel):
    """Request model for keyword analysis."""
    keywords: List[str] = Field(..., description="List of keywords to analyze", min_items=1)
    content_id: Optional[int] = Field(None, description="Optional content ID for context")

class ContentSEOValidationRequest(BaseModel):
    """Request model for SEO validation."""
    content_text: str = Field(..., description="Content text to validate")
    content_type: str = Field(..., description="Type of content (blog_post, landing_page, etc.)")
    title: str = Field(..., description="Content title")
    primary_keyword: str = Field(..., description="Primary target keyword")
    secondary_keywords: Optional[List[str]] = Field(None, description="Secondary target keywords")
    url: Optional[str] = Field(None, description="URL where content will be published")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class StructuredDataRequest(BaseModel):
    """Request model for structured data generation."""
    content_text: str = Field(..., description="Content text to generate structured data for")
    schema_type: str = Field(..., description="Type of schema to generate (Article, BlogPosting, FAQ, HowTo)")
    metadata: Dict[str, Any] = Field(..., description="Metadata for structured data generation")

class ContentUpdateRequest(BaseModel):
    """Request model for content update recommendations."""
    content_text: str = Field(..., description="Content text to analyze")
    content_id: int = Field(..., description="Content identifier")
    content_age_days: Optional[int] = Field(None, description="Age of content in days")
    url: Optional[str] = Field(None, description="URL where content is published")

# Define router
router = APIRouter(
    prefix="/seo",
    tags=["seo"],
    responses={404: {"description": "Not found"}},
)

@router.get("/search-performance")
async def get_search_performance(
    brand_id: int,
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    dimension: str = Query("query", description="Dimension to analyze (query, page, device, country)"),
    user=Depends(get_current_user)
):
    """
    Get search performance data from Google Search Console.
    
    Args:
        brand_id: Brand identifier
        start_date: Start date for data range
        end_date: End date for data range
        dimension: Dimension to analyze
        user: The authenticated user
        
    Returns:
        Search performance data
    """
    try:
        result = search_console_service.get_search_performance(
            brand_id=brand_id,
            start_date=start_date,
            end_date=end_date,
            dimension=dimension
        )
        return result
    except Exception as e:
        logger.error(f"Error retrieving search performance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving search performance: {str(e)}")

@router.get("/content/{content_id}/search-data")
async def get_content_search_data(
    content_id: int = Path(..., description="Content identifier"),
    brand_id: int = Query(..., description="Brand identifier"),
    user=Depends(get_current_user)
):
    """
    Get comprehensive search data for a specific content item.
    
    Args:
        content_id: Content identifier
        brand_id: Brand identifier
        user: The authenticated user
        
    Returns:
        Comprehensive search data for the content
    """
    try:
        result = search_console_service.get_content_search_data(
            brand_id=brand_id,
            content_id=content_id
        )
        return result
    except Exception as e:
        logger.error(f"Error retrieving content search data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving content search data: {str(e)}")

@router.get("/content/{content_id}/keyword-opportunities")
async def get_keyword_opportunities(
    content_id: int = Path(..., description="Content identifier"),
    brand_id: int = Query(..., description="Brand identifier"),
    user=Depends(get_current_user)
):
    """
    Analyze keyword opportunities for a specific content item.
    
    Args:
        content_id: Content identifier
        brand_id: Brand identifier
        user: The authenticated user
        
    Returns:
        Keyword opportunity analysis
    """
    try:
        result = search_console_service.analyze_keyword_opportunities(
            brand_id=brand_id,
            content_id=content_id
        )
        return result
    except Exception as e:
        logger.error(f"Error analyzing keyword opportunities: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing keyword opportunities: {str(e)}")

@router.post("/analyze-search-intent")
async def analyze_search_intent(
    request: KeywordAnalysisRequest,
    user=Depends(get_current_user)
):
    """
    Analyze search intent for a list of keywords.
    
    Args:
        request: Keyword analysis request
        user: The authenticated user
        
    Returns:
        Search intent analysis for each keyword
    """
    try:
        result = await seo_validation_service.analyze_search_intent_for_keywords(
            request.keywords
        )
        return {
            "status": "success",
            "keyword_analysis": result
        }
    except Exception as e:
        logger.error(f"Error analyzing search intent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing search intent: {str(e)}")

@router.post("/validate-content")
async def validate_content_seo(
    request: ContentSEOValidationRequest,
    user=Depends(get_current_user)
):
    """
    Validate content for SEO best practices.
    
    Args:
        request: Content SEO validation request
        user: The authenticated user
        
    Returns:
        SEO validation results
    """
    try:
        result = await seo_validation_service.validate_content_seo(
            content_text=request.content_text,
            content_type=request.content_type,
            primary_keyword=request.primary_keyword,
            secondary_keywords=request.secondary_keywords,
            title=request.title,
            url=request.url,
            metadata=request.metadata
        )
        return result
    except Exception as e:
        logger.error(f"Error validating content SEO: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error validating content SEO: {str(e)}")

@router.post("/structured-data")
async def generate_structured_data(
    request: StructuredDataRequest,
    user=Depends(get_current_user)
):
    """
    Generate structured data markup for content.
    
    Args:
        request: Structured data generation request
        user: The authenticated user
        
    Returns:
        Generated structured data markup
    """
    try:
        # Select the appropriate generation method based on schema type
        if request.schema_type.lower() == "article":
            result = await structured_data_service.generate_article_schema(
                request.content_text, 
                request.metadata
            )
        elif request.schema_type.lower() == "blogposting":
            result = await structured_data_service.generate_blogposting_schema(
                request.content_text, 
                request.metadata
            )
        elif request.schema_type.lower() == "faq":
            result = await structured_data_service.generate_faq_schema(
                request.content_text, 
                request.metadata
            )
        elif request.schema_type.lower() == "howto":
            result = await structured_data_service.generate_howto_schema(
                request.content_text, 
                request.metadata
            )
        elif request.schema_type.lower() == "product":
            result = await structured_data_service.generate_product_schema(
                request.metadata
            )
        else:
            return {
                "status": "error",
                "message": f"Unsupported schema type: {request.schema_type}"
            }
        
        return result
    except Exception as e:
        logger.error(f"Error generating structured data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating structured data: {str(e)}")

@router.post("/detect-schema-type")
async def detect_schema_type(
    content: Dict[str, str] = Body(..., description="Content with text and title"),
    user=Depends(get_current_user)
):
    """
    Detect the best schema type for given content.
    
    Args:
        content: Dictionary with content text and title
        user: The authenticated user
        
    Returns:
        Recommended schema type and confidence score
    """
    try:
        result = await structured_data_service.detect_schema_type(
            content_text=content.get("text", ""),
            title=content.get("title", "")
        )
        return result
    except Exception as e:
        logger.error(f"Error detecting schema type: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error detecting schema type: {str(e)}")

@router.get("/indexation-status")
async def get_indexation_status(
    brand_id: int,
    url: str = Query(..., description="URL to check indexation status for"),
    user=Depends(get_current_user)
):
    """
    Get indexation status for a specific URL.
    
    Args:
        brand_id: Brand identifier
        url: URL to check
        user: The authenticated user
        
    Returns:
        Indexation status for the URL
    """
    try:
        integration = search_console_service.get_integration(brand_id)
        result = integration.get_indexation_status(url)
        return result
    except Exception as e:
        logger.error(f"Error checking indexation status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking indexation status: {str(e)}")

@router.get("/mobile-usability")
async def get_mobile_usability(
    brand_id: int,
    url: str = Query(..., description="URL to check mobile usability for"),
    user=Depends(get_current_user)
):
    """
    Get mobile usability status for a specific URL.
    
    Args:
        brand_id: Brand identifier
        url: URL to check
        user: The authenticated user
        
    Returns:
        Mobile usability status for the URL
    """
    try:
        integration = search_console_service.get_integration(brand_id)
        result = integration.get_mobile_usability(url)
        return result
    except Exception as e:
        logger.error(f"Error checking mobile usability: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking mobile usability: {str(e)}")

@router.get("/content/{content_id}/declining-rankings")
async def get_declining_rankings(
    content_id: int = Path(..., description="Content identifier"),
    brand_id: int = Query(..., description="Brand identifier"),
    user=Depends(get_current_user)
):
    """
    Detect keywords with declining rankings for a specific content.
    
    Args:
        content_id: Content identifier
        brand_id: Brand identifier
        user: The authenticated user
        
    Returns:
        List of keywords with declining rankings and performance metrics
    """
    try:
        result = await ranking_performance_analyzer.detect_declining_rankings(
            brand_id=brand_id,
            content_id=content_id
        )
        return result
    except Exception as e:
        logger.error(f"Error detecting declining rankings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error detecting declining rankings: {str(e)}")

@router.post("/content/analyze-performance")
async def analyze_content_performance(
    request: ContentUpdateRequest,
    brand_id: int = Query(..., description="Brand identifier"),
    user=Depends(get_current_user)
):
    """
    Perform comprehensive analysis of content search performance and suggest updates.
    
    Args:
        request: Content update request
        brand_id: Brand identifier
        user: The authenticated user
        
    Returns:
        Performance analysis and update recommendations
    """
    try:
        result = await ranking_performance_analyzer.analyze_content_performance(
            brand_id=brand_id,
            content_id=request.content_id,
            content_text=request.content_text
        )
        return result
    except Exception as e:
        logger.error(f"Error analyzing content performance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing content performance: {str(e)}")

@router.post("/content/update-recommendations")
async def get_content_update_recommendations(
    request: ContentUpdateRequest,
    brand_id: int = Query(..., description="Brand identifier"),
    user=Depends(get_current_user)
):
    """
    Generate specific recommendations for updating content based on ranking performance.
    
    Args:
        request: Content update request
        brand_id: Brand identifier
        user: The authenticated user
        
    Returns:
        Content update recommendations
    """
    try:
        # First get declining keywords
        declining_data = await ranking_performance_analyzer.detect_declining_rankings(
            brand_id=brand_id,
            content_id=request.content_id
        )
        
        if declining_data["status"] != "success":
            return declining_data
        
        # Extract underperforming keywords
        underperforming_keywords = [kw["query"] for kw in declining_data.get("declining_keywords", [])]
        
        # Generate recommendations
        result = await ranking_performance_analyzer.generate_content_update_recommendations(
            content_id=request.content_id,
            content_text=request.content_text,
            underperforming_keywords=underperforming_keywords,
            url=request.url
        )
        return result
    except Exception as e:
        logger.error(f"Error generating update recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating update recommendations: {str(e)}")

@router.get("/content/{content_id}/update-schedule")
async def get_content_update_schedule(
    content_id: int = Path(..., description="Content identifier"),
    brand_id: int = Query(..., description="Brand identifier"),
    content_age_days: int = Query(..., description="Age of content in days"),
    user=Depends(get_current_user)
):
    """
    Suggest an optimal update schedule based on ranking performance and content age.
    
    Args:
        content_id: Content identifier
        brand_id: Brand identifier
        content_age_days: Age of the content in days
        user: The authenticated user
        
    Returns:
        Update schedule recommendations
    """
    try:
        result = await ranking_performance_analyzer.suggest_content_update_schedule(
            brand_id=brand_id,
            content_id=content_id,
            content_age_days=content_age_days
        )
        return result
    except Exception as e:
        logger.error(f"Error suggesting update schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error suggesting update schedule: {str(e)}")