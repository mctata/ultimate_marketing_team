"""
Content Recommendations Router

Endpoints for content recommendation and similarity analysis
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Body, Path
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field

from src.core.content_recommendations import content_recommendation_service
from src.core.database import get_db
from src.core.security import get_current_user_with_permissions

# Define Pydantic models for request/response
class ContentFeature(BaseModel):
    content_id: int
    title: Optional[str] = None
    description: Optional[str] = None
    content_type: Optional[str] = None
    tags: Optional[str] = None
    word_count: Optional[int] = None
    has_image: Optional[bool] = None
    publish_time: Optional[int] = None
    category: Optional[str] = None
    author: Optional[str] = None
    created_at: Optional[str] = None

class ClusteringRequest(BaseModel):
    content_features: List[ContentFeature]
    n_clusters: int = 5
    feature_fields: Optional[List[str]] = None
    text_fields: Optional[List[str]] = None

class ClusteringResponse(BaseModel):
    content_ids: List[int]
    clusters: List[int]
    cluster_centers: List[List[float]]
    similarity_matrix: List[List[float]]
    content_by_cluster: Dict[str, List[Dict[str, Any]]]

class SimilarContent(BaseModel):
    content_id: int
    similarity: float

class SimilarContentResponse(BaseModel):
    reference_content_id: int
    similar_content: List[SimilarContent]

class TopPerformingRequest(BaseModel):
    content_id: int
    content_features: List[ContentFeature]
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_results: int = 5
    performance_metric: str = 'views'

class TopPerformingRecommendation(BaseModel):
    content_id: int
    similarity: float
    score: float
    metric_value: float

class TopPerformingResponse(BaseModel):
    reference_content_id: int
    performance_metric: str
    recommendations: List[TopPerformingRecommendation]

class UserRecommendationsRequest(BaseModel):
    user_identifier: str
    content_features: List[ContentFeature]
    max_results: int = 5
    include_viewed: bool = False
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class UserRecommendationsResponse(BaseModel):
    user_identifier: str
    reference_content_id: int
    user_history_count: int
    recommendations: List[SimilarContent]

# Create router
router = APIRouter(
    prefix="/content-recommendations",
    tags=["content-recommendations"],
    dependencies=[Depends(get_current_user_with_permissions(["content:view"]))],
)

@router.post("/cluster", response_model=ClusteringResponse)
async def cluster_content(
    request: ClusteringRequest
):
    """Cluster content based on features and text similarity."""
    # Convert Pydantic models to dicts
    content_features = [feature.dict(exclude_unset=True) for feature in request.content_features]
    
    result = await content_recommendation_service.cluster_similar_content(
        content_features=content_features,
        n_clusters=request.n_clusters,
        feature_fields=request.feature_fields,
        text_fields=request.text_fields
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

@router.post("/similar", response_model=SimilarContentResponse)
async def get_similar_content(
    content_id: int = Query(..., description="Reference content ID"),
    content_features: List[ContentFeature] = Body(..., description="List of content items with features"),
    max_results: int = Query(5, ge=1, le=20, description="Maximum number of results"),
    min_similarity: float = Query(0.5, ge=0.0, le=1.0, description="Minimum similarity threshold")
):
    """Get content similar to the specified reference content."""
    # Convert Pydantic models to dicts
    content_features_dict = [feature.dict(exclude_unset=True) for feature in content_features]
    
    result = await content_recommendation_service.get_similar_content(
        content_id=content_id,
        content_features=content_features_dict,
        max_results=max_results,
        min_similarity=min_similarity
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

@router.post("/top-performing", response_model=TopPerformingResponse)
async def get_top_performing_similar_content(
    request: TopPerformingRequest
):
    """Get similar content that has performed well."""
    # Convert Pydantic models to dicts
    content_features = [feature.dict(exclude_unset=True) for feature in request.content_features]
    
    result = await content_recommendation_service.get_top_performing_similar_content(
        content_id=request.content_id,
        content_features=content_features,
        start_date=request.start_date,
        end_date=request.end_date,
        max_results=request.max_results,
        performance_metric=request.performance_metric
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

@router.post("/user", response_model=UserRecommendationsResponse)
async def get_recommendations_for_user(
    request: UserRecommendationsRequest
):
    """Get content recommendations for a specific user based on their history."""
    # Convert Pydantic models to dicts
    content_features = [feature.dict(exclude_unset=True) for feature in request.content_features]
    
    result = await content_recommendation_service.get_recommendations_for_user(
        user_identifier=request.user_identifier,
        content_features=content_features,
        max_results=request.max_results,
        include_viewed=request.include_viewed,
        start_date=request.start_date,
        end_date=request.end_date
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result