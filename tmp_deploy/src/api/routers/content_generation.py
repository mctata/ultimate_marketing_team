"""
Content Generation API

This module provides endpoints for AI-driven content generation using various providers
and templates, with quality assessment and optimization capabilities.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
import uuid
import json
import asyncio
import logging
from datetime import datetime

from src.core.security import get_current_user
# Mock implementations for development
from enum import Enum

class ContentType(str, Enum):
    """Types of content that can be generated."""
    BLOG_POST = "blog_post"
    SOCIAL_POST = "social_post"
    EMAIL = "email"
    AD_COPY = "ad_copy"
    PRODUCT_DESCRIPTION = "product_description"
    LANDING_PAGE = "landing_page"
    
class LanguageType(str, Enum):
    """Supported languages for content generation."""
    ENGLISH = "en"
    SPANISH = "es"
    FRENCH = "fr"
    GERMAN = "de"
    ITALIAN = "it"
    
class IndustryType(str, Enum):
    """Industry types for content targeting."""
    TECHNOLOGY = "technology"
    HEALTHCARE = "healthcare"
    FINANCE = "finance"
    EDUCATION = "education"
    RETAIL = "retail"
    TRAVEL = "travel"
    FOOD = "food"

class MockAIProviderManager:
    """Mock AI Provider Manager for development."""
    async def generate_content(self, **kwargs):
        """Mock content generation."""
        return {"text": "Mock generated content", "success": True}
        
    async def batch_generate_content(self, requests, **kwargs):
        """Mock batch content generation."""
        return [{"text": "Mock generated content", "success": True} for _ in requests]

# Create mock instances
ai_provider_manager = MockAIProviderManager()

class MockPromptManager:
    """Mock Prompt Manager for development."""
    def __init__(self, templates_dir=None, analytics_dir=None):
        """Mock initialization."""
        self.templates_dir = templates_dir or "/templates"
        self.analytics_dir = analytics_dir or "/analytics"
        
    def get_template(self, template_name):
        """Mock template retrieval."""
        return "Mock template for {template_name}"
        
    def format_template(self, template_name, **kwargs):
        """Mock template formatting."""
        return f"Formatted template for {template_name}"

# Create mock class
PromptManager = MockPromptManager
# Mock content quality service
class MockContentQualityService:
    """Mock Content Quality Service for development."""
    async def evaluate_content(self, content, **kwargs):
        """Mock content evaluation."""
        return {"score": 0.85, "feedback": "Mock quality evaluation"}
        
    async def optimize_content(self, content, **kwargs):
        """Mock content optimization."""
        return {"optimized_content": content, "improvements": ["Mock improvement"]}

# Create mock instance
content_quality_service = MockContentQualityService()

# Import actual service modules
from src.core.rate_limiting import rate_limiter
from src.core.cache import cache
from src.core.logging import log_api_usage_sync

# Configure logging
logger = logging.getLogger(__name__)

# Initialize prompt manager
prompt_manager = PromptManager(
    templates_dir="/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/src/agents/config/prompts/templates",
    analytics_dir="/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/src/agents/config/prompts/analytics"
)

# Define models for API
class GenerationRequest(BaseModel):
    """Content generation request model."""
    content_type: str = Field(..., description="Type of content to generate (blog_post, social_media, email, etc.)")
    template_id: Optional[str] = Field(None, description="Optional template ID to use")
    variables: Dict[str, Any] = Field(..., description="Variables to use in template")
    language: str = Field("english", description="Target language for generation")
    industry: str = Field("general", description="Industry vertical for content")
    model_preferences: Optional[Dict[str, Any]] = Field(None, description="Optional AI model preferences")
    quality_assessment: bool = Field(True, description="Whether to include quality assessment")
    brand_id: Optional[int] = Field(None, description="Optional brand ID for guidelines")
    seo_keywords: Optional[List[str]] = Field(None, description="Optional SEO keywords")
    batch_id: Optional[str] = Field(None, description="Optional batch ID for grouped requests")
    
class BatchGenerationRequest(BaseModel):
    """Batch content generation request."""
    requests: List[GenerationRequest] = Field(..., description="List of generation requests")
    concurrency_limit: int = Field(5, description="Maximum concurrent generations")
    
class ContentVariation(BaseModel):
    """Content variation model."""
    variation_id: str = Field(..., description="Unique ID for this variation")
    content: str = Field(..., description="Generated content")
    quality_score: Optional[float] = Field(None, description="Optional quality score (0-1)")
    quality_assessment: Optional[Dict[str, Any]] = Field(None, description="Detailed quality assessment")
    strengths: Optional[List[str]] = Field(None, description="Content strengths")
    improvement_areas: Optional[List[str]] = Field(None, description="Areas for improvement")
    
class GenerationResponse(BaseModel):
    """Content generation response model."""
    request_id: str = Field(..., description="Unique request identifier")
    content_type: str = Field(..., description="Type of content generated")
    variations: List[ContentVariation] = Field(..., description="Generated content variations")
    template_id: Optional[str] = Field(None, description="Template ID used")
    template_version: Optional[str] = Field(None, description="Template version used")
    provider: str = Field(..., description="AI provider used")
    model: str = Field(..., description="AI model used")
    generation_time_ms: int = Field(..., description="Generation time in milliseconds")
    total_time_ms: int = Field(..., description="Total processing time in milliseconds")

class TaskStatus(BaseModel):
    """Task status model."""
    task_id: str = Field(..., description="Task identifier")
    status: str = Field(..., description="Task status (pending, processing, completed, failed)")
    progress: Optional[float] = Field(None, description="Optional progress percentage")
    result: Optional[Dict[str, Any]] = Field(None, description="Task result if completed")
    error: Optional[str] = Field(None, description="Error message if failed")
    
class BrandGuidelines(BaseModel):
    """Brand guidelines model."""
    brand_id: int = Field(..., description="Brand identifier")
    name: str = Field(..., description="Brand name")
    voice: Dict[str, Any] = Field(..., description="Brand voice attributes")
    tone: Dict[str, Any] = Field(..., description="Brand tone characteristics")
    terminology: Dict[str, Any] = Field(..., description="Brand terminology preferences")
    messaging: Optional[Dict[str, Any]] = Field(None, description="Brand messaging framework")
    
class PromptTemplate(BaseModel):
    """Prompt template model."""
    template_id: str = Field(..., description="Template identifier")
    system_prompt: str = Field(..., description="System prompt template")
    user_prompt: str = Field(..., description="User prompt template")
    response_format: Optional[str] = Field(None, description="Expected response format")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Template metadata")
    versions: List[Dict[str, Any]] = Field(..., description="Template versions")
    performance: Optional[Dict[str, Any]] = Field(None, description="Template performance data")

# Define Router
router = APIRouter(
    prefix="/content-generation",
    tags=["content-generation"],
    responses={404: {"description": "Not found"}},
)

# Create in-memory task store
# In production, use a persistent store like Redis
TASK_STORE = {}

@router.post("/generate", response_model=Union[GenerationResponse, TaskStatus])
async def generate_content(
    request: GenerationRequest,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
    async_mode: bool = Query(False, description="Run generation asynchronously")
):
    """
    Generate content using AI with templates and quality assessment.
    
    Args:
        request: Content generation request
        background_tasks: FastAPI background tasks
        user: The authenticated user
        async_mode: Whether to run generation asynchronously
        
    Returns:
        Generated content or task status if async
    """
    # Apply rate limiting
    rate_limit_key = f"content_gen:{user.id}"
    if not rate_limiter.check_rate_limit(rate_limit_key, max_requests=20, period=60):
        raise HTTPException(status_code=429, detail="Rate limit exceeded for content generation")
    
    # Generate request ID
    request_id = str(uuid.uuid4())
    
    # Log request
    log_api_usage_sync(
        endpoint="content_generation",
        user_id=user.id,
        request_data={
            "content_type": request.content_type,
            "template_id": request.template_id,
            "language": request.language,
            "industry": request.industry,
            "has_brand_id": request.brand_id is not None,
            "has_seo": request.seo_keywords is not None
        }
    )
    
    # If async mode, create task and return task ID
    if async_mode:
        task_id = f"content_gen_{request_id}"
        TASK_STORE[task_id] = {
            "status": "pending",
            "progress": 0,
            "start_time": datetime.now().isoformat(),
            "user_id": user.id,
            "request_data": request.dict()
        }
        
        # Start generation in background
        background_tasks.add_task(
            _generate_content_async,
            task_id=task_id,
            request=request,
            user_id=user.id
        )
        
        return TaskStatus(
            task_id=task_id,
            status="pending",
            progress=0
        )
    
    # If synchronous mode, generate content immediately
    try:
        result = await _generate_content(request, user.id)
        return result
    except Exception as e:
        logger.error(f"Content generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")

@router.post("/batch", response_model=Dict[str, Any])
async def batch_generate_content(
    request: BatchGenerationRequest,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user)
):
    """
    Generate multiple content pieces in batch.
    
    Args:
        request: Batch generation request
        background_tasks: FastAPI background tasks
        user: The authenticated user
        
    Returns:
        Dictionary with batch task ID and status
    """
    # Apply rate limiting
    rate_limit_key = f"content_batch:{user.id}"
    if not rate_limiter.check_rate_limit(rate_limit_key, max_requests=5, period=3600):
        raise HTTPException(status_code=429, detail="Rate limit exceeded for batch generation")
    
    # Generate batch ID
    batch_id = str(uuid.uuid4())
    
    # Create task for batch
    task_id = f"batch_{batch_id}"
    TASK_STORE[task_id] = {
        "status": "pending",
        "progress": 0,
        "start_time": datetime.now().isoformat(),
        "user_id": user.id,
        "request_count": len(request.requests),
        "completed_count": 0,
        "results": {}
    }
    
    # Start batch processing in background
    background_tasks.add_task(
        _process_batch,
        task_id=task_id,
        batch_id=batch_id,
        requests=request.requests,
        concurrency_limit=request.concurrency_limit,
        user_id=user.id
    )
    
    return {
        "batch_id": batch_id,
        "task_id": task_id,
        "status": "pending",
        "request_count": len(request.requests)
    }

@router.get("/tasks/{task_id}", response_model=TaskStatus)
async def get_task_status(
    task_id: str,
    user=Depends(get_current_user)
):
    """
    Get status of a content generation task.
    
    Args:
        task_id: Task identifier
        user: The authenticated user
        
    Returns:
        Task status
    """
    if task_id not in TASK_STORE:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_data = TASK_STORE[task_id]
    
    # Verify ownership
    if task_data.get("user_id") != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    status = TaskStatus(
        task_id=task_id,
        status=task_data.get("status", "unknown"),
        progress=task_data.get("progress", 0)
    )
    
    # Include result if completed
    if task_data.get("status") == "completed" and "result" in task_data:
        status.result = task_data["result"]
    
    # Include error if failed
    if task_data.get("status") == "failed" and "error" in task_data:
        status.error = task_data["error"]
    
    return status

@router.get("/templates", response_model=List[Dict[str, Any]])
async def list_templates(
    user=Depends(get_current_user),
    content_type: Optional[str] = None
):
    """
    Get available content templates.
    
    Args:
        user: The authenticated user
        content_type: Optional filter by content type
        
    Returns:
        List of available templates
    """
    templates = []
    
    # Get templates from prompt manager
    for template_id, template in prompt_manager.templates.items():
        # Filter by content type if specified
        template_content_type = template.metadata.get("content_type", "")
        if content_type and template_content_type != content_type:
            continue
            
        # Get versions
        versions = template.versioning.list_versions()
        
        # Get performance data
        performance = template.get_performance() if hasattr(template, "get_performance") else None
        
        templates.append({
            "template_id": template_id,
            "content_type": template_content_type,
            "description": template.metadata.get("description", ""),
            "version_count": len(versions),
            "latest_version": versions[0].get("version_id") if versions else None,
            "usage_count": performance.get("usage_count", 0) if performance else 0
        })
    
    return templates

@router.get("/templates/{template_id}", response_model=PromptTemplate)
async def get_template_details(
    template_id: str,
    user=Depends(get_current_user),
    version_id: Optional[str] = None
):
    """
    Get details of a specific template.
    
    Args:
        template_id: Template identifier
        user: The authenticated user
        version_id: Optional specific version ID
        
    Returns:
        Template details
    """
    template = prompt_manager.get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Load specific version if requested
    if version_id:
        success = template.load_version(version_id)
        if not success:
            raise HTTPException(status_code=404, detail="Template version not found")
    
    # Get versions
    versions = template.versioning.list_versions()
    
    # Get performance data
    performance = template.get_performance() if hasattr(template, "get_performance") else None
    
    return PromptTemplate(
        template_id=template_id,
        system_prompt=template.system_prompt,
        user_prompt=template.template,
        response_format=template.response_format,
        metadata=template.metadata,
        versions=versions,
        performance=performance
    )

@router.post("/templates/{template_id}/render", response_model=Dict[str, str])
async def render_template(
    template_id: str,
    variables: Dict[str, Any],
    user=Depends(get_current_user),
    system_variables: Optional[Dict[str, Any]] = None,
    version_id: Optional[str] = None
):
    """
    Render a template with the given variables.
    
    Args:
        template_id: Template identifier
        variables: Variables to use in template
        user: The authenticated user
        system_variables: Optional separate variables for system prompt
        version_id: Optional specific version ID
        
    Returns:
        Rendered template
    """
    template = prompt_manager.get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Load specific version if requested
    if version_id:
        success = template.load_version(version_id)
        if not success:
            raise HTTPException(status_code=404, detail="Template version not found")
    
    # Render template
    try:
        rendered = template.render(variables, system_variables)
        return rendered
    except Exception as e:
        logger.error(f"Template rendering error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Template rendering failed: {str(e)}")

@router.get("/quality-assessment/{content_id}", response_model=Dict[str, Any])
async def get_content_quality(
    content_id: str,
    user=Depends(get_current_user),
    content: Optional[str] = None,
    content_type: str = "blog_post",
    brand_id: Optional[int] = None,
    seo_keywords: Optional[str] = None
):
    """
    Get quality assessment for content.
    
    Args:
        content_id: Content identifier or reference
        user: The authenticated user
        content: Optional content text
        content_type: Content type
        brand_id: Optional brand ID
        seo_keywords: Optional comma-separated SEO keywords
        
    Returns:
        Quality assessment results
    """
    # Check if we have the content text
    if not content:
        # Try to get from the content store
        # This is a placeholder - in production, fetch from database
        raise HTTPException(status_code=400, detail="Content text is required")
    
    # Parse SEO keywords if provided
    keywords_list = None
    if seo_keywords:
        keywords_list = [k.strip() for k in seo_keywords.split(",")]
    
    # Get quality assessment
    try:
        quality = await content_quality_service.evaluate_content(
            content=content,
            content_type=content_type,
            brand_id=brand_id,
            seo_keywords=keywords_list
        )
        
        # Convert to dict for response
        quality_dict = {
            "content_id": quality.content_id,
            "content_type": quality.content_type,
            "overall_quality_score": quality.overall_quality_score,
            "strengths": quality.strengths,
            "improvement_areas": quality.improvement_areas,
            "revision_recommendations": quality.revision_recommendations,
            "readability": {
                "flesch_reading_ease": quality.readability.flesch_reading_ease,
                "flesch_kincaid_grade": quality.readability.flesch_kincaid_grade,
                "average_sentence_length": quality.readability.average_sentence_length,
                "complex_word_percentage": quality.readability.complex_word_percentage
            },
            "grammar": {
                "grammar_errors": quality.grammar.grammar_errors,
                "spelling_errors": quality.grammar.spelling_errors,
                "passive_voice_percentage": quality.grammar.passive_voice_percentage,
                "adverb_percentage": quality.grammar.adverb_percentage
            },
            "brand_consistency": {
                "tone_consistency_score": quality.brand_consistency.tone_consistency_score,
                "voice_consistency_score": quality.brand_consistency.voice_consistency_score,
                "overall_brand_consistency": quality.brand_consistency.overall_brand_consistency
            }
        }
        
        # Include SEO metrics if available
        if quality.seo:
            quality_dict["seo"] = {
                "primary_keyword_density": quality.seo.primary_keyword_density,
                "primary_keyword_in_title": quality.seo.primary_keyword_in_title,
                "primary_keyword_in_first_paragraph": quality.seo.primary_keyword_in_first_paragraph,
                "overall_seo_score": quality.seo.overall_seo_score
            }
        
        return quality_dict
        
    except Exception as e:
        logger.error(f"Quality assessment error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Quality assessment failed: {str(e)}")

async def _generate_content(request: GenerationRequest, user_id: int) -> GenerationResponse:
    """
    Generate content based on request.
    
    Args:
        request: Content generation request
        user_id: User identifier
        
    Returns:
        Generation response
    """
    start_time = datetime.now()
    
    # Determine template to use
    template_id = request.template_id
    if not template_id:
        # Map content type to default template
        content_type_to_template = {
            "blog_post": "blog_post_prompt",
            "social_media": "social_media_prompt",
            "email": "email_prompt",
            "landing_page": "landing_page_prompt"
        }
        template_id = content_type_to_template.get(request.content_type, "blog_post_prompt")
    
    # Get template from manager
    template = prompt_manager.get_template(template_id)
    if not template:
        raise ValueError(f"Template not found: {template_id}")
    
    # Get latest template version
    template_version = template.versioning.get_latest_version()
    
    # Map content type to enum
    content_type_map = {
        "blog_post": ContentType.BLOG_POST,
        "social_media": ContentType.SOCIAL_MEDIA,
        "email": ContentType.EMAIL,
        "landing_page": ContentType.LANDING_PAGE,
        "ad_copy": ContentType.AD_COPY,
        "product_description": ContentType.PRODUCT_DESCRIPTION
    }
    mapped_content_type = content_type_map.get(request.content_type, ContentType.GENERAL)
    
    # Map language to enum
    language_map = {
        "english": LanguageType.ENGLISH,
        "spanish": LanguageType.SPANISH,
        "french": LanguageType.FRENCH,
        "german": LanguageType.GERMAN,
        "portuguese": LanguageType.PORTUGUESE
    }
    mapped_language = language_map.get(request.language.lower(), LanguageType.ENGLISH)
    
    # Map industry to enum
    industry_map = {
        "technology": IndustryType.TECHNOLOGY,
        "healthcare": IndustryType.HEALTHCARE,
        "finance": IndustryType.FINANCE,
        "retail": IndustryType.RETAIL,
        "food": IndustryType.FOOD
    }
    mapped_industry = industry_map.get(request.industry.lower(), IndustryType.GENERAL)
    
    # Extract model preferences
    model_prefs = request.model_preferences or {}
    preferred_provider = model_prefs.get("provider")
    preferred_model = model_prefs.get("model")
    cost_tier = model_prefs.get("cost_tier", "standard")
    
    # Render template with variables
    rendered = template.render(request.variables)
    
    # Generate content
    try:
        generation_result = await ai_provider_manager.generate_content(
            prompt=rendered["user_prompt"],
            system_prompt=rendered["system_prompt"],
            content_type=mapped_content_type,
            language=mapped_language,
            industry=mapped_industry,
            cost_tier=cost_tier,
            preferred_provider=preferred_provider,
            preferred_model=preferred_model,
            max_tokens=model_prefs.get("max_tokens", 2000),
            temperature=model_prefs.get("temperature", 0.7),
            use_cache=True
        )
    except Exception as e:
        logger.error(f"Content generation error: {str(e)}")
        raise ValueError(f"Content generation failed: {str(e)}")
    
    # Extract generated content
    content_text = generation_result.get("text", "")
    
    # Create variation
    variation_id = str(uuid.uuid4())
    variation = ContentVariation(
        variation_id=variation_id,
        content=content_text,
        quality_score=None,  # Will be populated later if quality assessment is enabled
        quality_assessment=None,
        strengths=None,
        improvement_areas=None
    )
    
    # Perform quality assessment if enabled
    if request.quality_assessment:
        try:
            # Get brand guidelines if brand_id specified
            brand_guidelines = None
            
            # Evaluate content quality
            quality = await content_quality_service.evaluate_content(
                content=content_text,
                content_type=request.content_type,
                brand_id=request.brand_id,
                brand_guidelines=brand_guidelines,
                seo_keywords=request.seo_keywords,
                language=request.language
            )
            
            # Add quality assessment to variation
            variation.quality_score = quality.overall_quality_score
            variation.quality_assessment = {
                "readability": {
                    "flesch_reading_ease": quality.readability.flesch_reading_ease,
                    "flesch_kincaid_grade": quality.readability.flesch_kincaid_grade,
                    "average_sentence_length": quality.readability.average_sentence_length,
                    "complex_word_percentage": quality.readability.complex_word_percentage
                },
                "grammar": {
                    "grammar_errors": quality.grammar.grammar_errors,
                    "spelling_errors": quality.grammar.spelling_errors,
                    "passive_voice_percentage": quality.grammar.passive_voice_percentage,
                    "adverb_percentage": quality.grammar.adverb_percentage
                },
                "brand_consistency": {
                    "tone_consistency_score": quality.brand_consistency.tone_consistency_score,
                    "voice_consistency_score": quality.brand_consistency.voice_consistency_score,
                    "overall_brand_consistency": quality.brand_consistency.overall_brand_consistency
                }
            }
            
            # Add SEO metrics if available
            if quality.seo:
                variation.quality_assessment["seo"] = {
                    "primary_keyword_density": quality.seo.primary_keyword_density,
                    "primary_keyword_in_title": quality.seo.primary_keyword_in_title,
                    "primary_keyword_in_first_paragraph": quality.seo.primary_keyword_in_first_paragraph,
                    "overall_seo_score": quality.seo.overall_seo_score
                }
            
            variation.strengths = quality.strengths
            variation.improvement_areas = quality.improvement_areas
            
        except Exception as e:
            logger.error(f"Quality assessment error: {str(e)}")
            # Continue without quality assessment
    
    # Record template usage for analytics
    try:
        # Calculate basic performance metrics
        performance_metrics = {
            "length": len(content_text),
            "generation_time_ms": generation_result.get("generation_time", 0)
        }
        
        # Include quality metrics if available
        if variation.quality_score is not None:
            performance_metrics["quality_score"] = variation.quality_score
        
        template.record_usage(
            version_id=template_version,
            model=generation_result.get("model", "unknown"),
            variables=request.variables,
            performance_metrics=performance_metrics
        )
    except Exception as e:
        logger.warning(f"Error recording template usage: {str(e)}")
    
    # Calculate timings
    end_time = datetime.now()
    generation_time_ms = generation_result.get("generation_time", 0)
    total_time_ms = int((end_time - start_time).total_seconds() * 1000)
    
    # Create response
    response = GenerationResponse(
        request_id=str(uuid.uuid4()),
        content_type=request.content_type,
        variations=[variation],
        template_id=template_id,
        template_version=template_version,
        provider=generation_result.get("provider", "unknown"),
        model=generation_result.get("model", "unknown"),
        generation_time_ms=generation_time_ms,
        total_time_ms=total_time_ms
    )
    
    return response

async def _generate_content_async(task_id: str, request: GenerationRequest, user_id: int):
    """
    Generate content asynchronously.
    
    Args:
        task_id: Task identifier
        request: Content generation request
        user_id: User identifier
    """
    # Update task status
    TASK_STORE[task_id]["status"] = "processing"
    TASK_STORE[task_id]["progress"] = 10
    
    try:
        # Generate content
        result = await _generate_content(request, user_id)
        
        # Update task with result
        TASK_STORE[task_id]["status"] = "completed"
        TASK_STORE[task_id]["progress"] = 100
        TASK_STORE[task_id]["result"] = result.dict()
        TASK_STORE[task_id]["completion_time"] = datetime.now().isoformat()
        
    except Exception as e:
        # Update task with error
        TASK_STORE[task_id]["status"] = "failed"
        TASK_STORE[task_id]["error"] = str(e)
        TASK_STORE[task_id]["completion_time"] = datetime.now().isoformat()
        logger.error(f"Async content generation failed: {str(e)}")

async def _process_batch(task_id: str, batch_id: str, requests: List[GenerationRequest], 
                       concurrency_limit: int, user_id: int):
    """
    Process batch of content generation requests.
    
    Args:
        task_id: Task identifier
        batch_id: Batch identifier
        requests: List of generation requests
        concurrency_limit: Maximum concurrent generations
        user_id: User identifier
    """
    # Update task status
    TASK_STORE[task_id]["status"] = "processing"
    TASK_STORE[task_id]["progress"] = 0
    
    # Add batch ID to each request
    for request in requests:
        request.batch_id = batch_id
    
    # Process requests with limited concurrency
    semaphore = asyncio.Semaphore(concurrency_limit)
    request_count = len(requests)
    completed_count = 0
    results = {}
    
    async def process_request(req: GenerationRequest, index: int):
        nonlocal completed_count
        async with semaphore:
            try:
                # Generate content
                result = await _generate_content(req, user_id)
                
                # Store result
                results[f"request_{index}"] = result.dict()
                
                # Update progress
                completed_count += 1
                TASK_STORE[task_id]["completed_count"] = completed_count
                TASK_STORE[task_id]["progress"] = int((completed_count / request_count) * 100)
                TASK_STORE[task_id]["results"] = results
                
            except Exception as e:
                logger.error(f"Batch request {index} failed: {str(e)}")
                results[f"request_{index}"] = {"error": str(e)}
                completed_count += 1
    
    # Create tasks for all requests
    tasks = [process_request(req, i) for i, req in enumerate(requests)]
    
    try:
        # Run all tasks
        await asyncio.gather(*tasks)
        
        # Update task status
        TASK_STORE[task_id]["status"] = "completed"
        TASK_STORE[task_id]["progress"] = 100
        TASK_STORE[task_id]["completion_time"] = datetime.now().isoformat()
        
    except Exception as e:
        # Update task with error
        TASK_STORE[task_id]["status"] = "failed"
        TASK_STORE[task_id]["error"] = str(e)
        TASK_STORE[task_id]["completion_time"] = datetime.now().isoformat()
        logger.error(f"Batch processing failed: {str(e)}")