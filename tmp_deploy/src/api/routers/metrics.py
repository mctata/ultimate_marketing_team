"""
API router for metrics and analytics endpoints.

Provides endpoints for:
1. API usage metrics
2. UX analytics
3. Feature usage metrics
4. AI assistant metrics
5. WebSocket performance metrics
6. A/B testing configuration and results
7. User journey metrics and reporting
"""

from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from src.core.api_metrics import metrics_service, ux_analytics_service
from fastapi.security import OAuth2PasswordBearer
from src.core.security import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

# Mock implementations of security functions
async def get_current_active_user(token: str = Depends(oauth2_scheme)):
    """Get the current authenticated user."""
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Return a mock user object
    return {"id": 1, "email": user_id, "is_active": True}

def get_current_user_with_permission(resource: str, action: str):
    """Dependency that checks if the current user has the required permissions."""
    async def check_permissions(token: str = Depends(oauth2_scheme)):
        user_id = verify_token(token)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Return a mock user object - in production, would check permissions
        return 1  # Return user ID
    
    return check_permissions

router = APIRouter(
    prefix="/metrics",
    tags=["metrics"],
    dependencies=[Depends(get_current_active_user)]
)

# Pydantic models for request/response validation

class UserInteractionEventCreate(BaseModel):
    session_id: str
    event_type: str
    event_category: str
    event_action: str
    event_label: Optional[str] = None
    element_id: Optional[str] = None
    page_path: Optional[str] = None
    content_id: Optional[int] = None
    value: Optional[float] = None
    metadata: Optional[Dict] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    screen_size: Optional[str] = None

class AIAssistantUsageCreate(BaseModel):
    suggestion_type: str
    action: str
    variant: Optional[str] = None
    response_time_ms: Optional[int] = None
    suggestion_length: Optional[int] = None

class WebSocketMetricsCreate(BaseModel):
    metric_type: str
    connections: Optional[int] = None
    peak_connections: Optional[int] = None
    avg_connections: Optional[float] = None
    connection_errors: Optional[int] = None
    messages_sent: Optional[int] = None
    messages_received: Optional[int] = None
    bytes_sent: Optional[int] = None
    bytes_received: Optional[int] = None
    avg_latency_ms: Optional[float] = None
    p95_latency_ms: Optional[float] = None
    p99_latency_ms: Optional[float] = None

class UserJourneyCreate(BaseModel):
    session_id: str
    path: List[Dict]
    entry_page: str
    exit_page: str
    start_time: datetime
    end_time: datetime
    entry_source: Optional[str] = None
    device_type: Optional[str] = None
    completed_task: bool = False
    conversion_type: Optional[str] = None

class ABTestVariantCreate(BaseModel):
    test_id: str
    name: str
    feature_area: str
    config: Dict
    is_control: bool = False
    description: Optional[str] = None
    traffic_percentage: float = 50.0
    user_segment: Optional[str] = None

class ABTestConclude(BaseModel):
    test_id: str
    winner_variant_id: Optional[int] = None
    metrics: Optional[Dict] = None

class DateRangeParams(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None


# API Usage Metrics Endpoints

@router.get("/api-usage/daily")
async def get_daily_api_costs(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    provider: Optional[str] = None
):
    """Get daily API usage costs."""
    return await metrics_service.get_daily_costs(
        start_date=start_date,
        end_date=end_date,
        provider=provider
    )

@router.get("/api-usage/by-provider")
async def get_provider_costs(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get API usage costs broken down by provider."""
    return await metrics_service.get_provider_costs(
        start_date=start_date,
        end_date=end_date
    )

@router.get("/api-usage/by-model")
async def get_model_costs(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    provider: Optional[str] = None
):
    """Get API usage costs broken down by model."""
    return await metrics_service.get_model_costs(
        start_date=start_date,
        end_date=end_date,
        provider=provider
    )

@router.get("/api-usage/budget-status")
async def get_budget_status():
    """Get current budget status and projections for API usage."""
    return await metrics_service.get_budget_status()

@router.get("/api-usage/cache")
async def get_cache_metrics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get cache performance metrics for API usage."""
    return await metrics_service.get_cache_metrics(
        start_date=start_date,
        end_date=end_date
    )

@router.get("/api-usage/errors")
async def get_error_rates(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get error rates for API usage by provider."""
    return await metrics_service.get_error_rates(
        start_date=start_date,
        end_date=end_date
    )

@router.get("/api-usage/by-agent")
async def get_agent_usage(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get API usage broken down by agent type."""
    return await metrics_service.get_agent_usage(
        start_date=start_date,
        end_date=end_date
    )


# UX Analytics Endpoints

@router.post("/ux/interactions")
async def record_user_interaction(event: UserInteractionEventCreate, user_id: Optional[int] = Depends(get_current_user_with_permission("metrics", "create"))):
    """Record a user interaction event for UX analytics."""
    await ux_analytics_service.record_user_interaction(
        session_id=event.session_id,
        event_type=event.event_type,
        event_category=event.event_category,
        event_action=event.event_action,
        event_label=event.event_label,
        element_id=event.element_id,
        page_path=event.page_path,
        user_id=user_id,
        content_id=event.content_id,
        value=event.value,
        metadata=event.metadata,
        device_type=event.device_type,
        browser=event.browser,
        os=event.os,
        screen_size=event.screen_size
    )
    return {"status": "success"}

@router.get("/ux/feature-usage")
async def get_feature_usage_metrics(
    feature_category: Optional[str] = None,
    feature_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    variant: Optional[str] = None
):
    """Get feature usage metrics for UX analysis."""
    return await ux_analytics_service.get_feature_usage_metrics(
        feature_category=feature_category,
        feature_id=feature_id,
        start_date=start_date,
        end_date=end_date,
        variant=variant
    )

@router.post("/ux/ai-assistant")
async def record_ai_assistant_usage(usage: AIAssistantUsageCreate):
    """Record AI writing assistant usage for analytics."""
    await ux_analytics_service.record_ai_assistant_usage(
        suggestion_type=usage.suggestion_type,
        action=usage.action,
        variant=usage.variant,
        response_time_ms=usage.response_time_ms,
        suggestion_length=usage.suggestion_length
    )
    return {"status": "success"}

@router.get("/ux/ai-assistant")
async def get_ai_assistant_metrics(
    suggestion_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    variant: Optional[str] = None
):
    """Get AI writing assistant usage metrics."""
    return await ux_analytics_service.get_ai_assistant_metrics(
        suggestion_type=suggestion_type,
        start_date=start_date,
        end_date=end_date,
        variant=variant
    )

@router.post("/ux/websocket-metrics")
async def record_websocket_metrics(metrics: WebSocketMetricsCreate):
    """Record WebSocket connection metrics."""
    await ux_analytics_service.record_websocket_metrics(
        metric_type=metrics.metric_type,
        connections=metrics.connections,
        peak_connections=metrics.peak_connections,
        avg_connections=metrics.avg_connections,
        connection_errors=metrics.connection_errors,
        messages_sent=metrics.messages_sent,
        messages_received=metrics.messages_received,
        bytes_sent=metrics.bytes_sent,
        bytes_received=metrics.bytes_received,
        avg_latency_ms=metrics.avg_latency_ms,
        p95_latency_ms=metrics.p95_latency_ms,
        p99_latency_ms=metrics.p99_latency_ms
    )
    return {"status": "success"}

@router.get("/ux/websocket-metrics")
async def get_websocket_metrics(
    metric_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get WebSocket connection metrics."""
    return await ux_analytics_service.get_websocket_metrics(
        metric_type=metric_type,
        start_date=start_date,
        end_date=end_date
    )

@router.post("/ux/journeys")
async def record_user_journey(journey: UserJourneyCreate, user_id: Optional[int] = Depends(get_current_user_with_permission("metrics", "create"))):
    """Record a complete user journey through the application."""
    await ux_analytics_service.record_user_journey(
        session_id=journey.session_id,
        path=journey.path,
        entry_page=journey.entry_page,
        exit_page=journey.exit_page,
        start_time=journey.start_time,
        end_time=journey.end_time,
        user_id=user_id,
        entry_source=journey.entry_source,
        device_type=journey.device_type,
        completed_task=journey.completed_task,
        conversion_type=journey.conversion_type
    )
    return {"status": "success"}

@router.get("/ux/journeys")
async def get_user_journey_metrics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    entry_page: Optional[str] = None,
    conversion_type: Optional[str] = None
):
    """Get aggregated user journey metrics."""
    return await ux_analytics_service.get_user_journey_metrics(
        start_date=start_date,
        end_date=end_date,
        entry_page=entry_page,
        conversion_type=conversion_type
    )

@router.post("/ux/ab-test")
async def create_ab_test_variant(variant: ABTestVariantCreate, user_id: int = Depends(get_current_user_with_permission("metrics", "create"))):
    """Create a new A/B test variant."""
    variant_id = await ux_analytics_service.create_ab_test_variant(
        test_id=variant.test_id,
        name=variant.name,
        feature_area=variant.feature_area,
        config=variant.config,
        is_control=variant.is_control,
        description=variant.description,
        traffic_percentage=variant.traffic_percentage,
        user_segment=variant.user_segment
    )
    
    if not variant_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create A/B test variant"
        )
    
    return {"variant_id": variant_id}

@router.post("/ux/ab-test/conclude")
async def conclude_ab_test(test_data: ABTestConclude, user_id: int = Depends(get_current_user_with_permission("metrics", "update"))):
    """Conclude an A/B test and record results."""
    success = await ux_analytics_service.conclude_ab_test(
        test_id=test_data.test_id,
        winner_variant_id=test_data.winner_variant_id,
        metrics=test_data.metrics
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"A/B test with ID {test_data.test_id} not found or could not be concluded"
        )
    
    return {"status": "success"}

@router.get("/ux/ab-test")
async def get_ab_test_results(
    test_id: Optional[str] = None,
    feature_area: Optional[str] = None,
    status: Optional[str] = None
):
    """Get A/B test results."""
    return await ux_analytics_service.get_ab_test_results(
        test_id=test_id,
        feature_area=feature_area,
        status=status
    )

# Dashboard Data Endpoints

@router.get("/dashboard/collaborative-features")
async def get_collaborative_features_dashboard(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get comprehensive dashboard data for collaborative feature usage."""
    if not start_date:
        start_date = (datetime.utcnow() - timedelta(days=30)).date()
    if not end_date:
        end_date = datetime.utcnow().date()
    
    # Get feature usage metrics for collaboration features
    feature_usage = await ux_analytics_service.get_feature_usage_metrics(
        feature_category="collaboration",
        start_date=start_date,
        end_date=end_date
    )
    
    # Get WebSocket metrics for collaboration
    websocket_metrics = await ux_analytics_service.get_websocket_metrics(
        start_date=start_date,
        end_date=end_date
    )
    
    # Group features by feature_id and calculate trends
    feature_summary = {}
    for metric in feature_usage:
        feature_id = metric["feature_id"]
        if feature_id not in feature_summary:
            feature_summary[feature_id] = {
                "feature_id": feature_id,
                "total_uses": 0,
                "avg_duration_sec": 0,
                "completion_rate": 0,
                "error_rate": 0,
                "days_with_data": 0
            }
        
        summary = feature_summary[feature_id]
        summary["total_uses"] += metric["total_uses"]
        summary["days_with_data"] += 1
        summary["avg_duration_sec"] = ((summary["avg_duration_sec"] * (summary["days_with_data"] - 1)) + 
                                      metric["avg_duration_sec"]) / summary["days_with_data"]
        summary["completion_rate"] = ((summary["completion_rate"] * (summary["days_with_data"] - 1)) + 
                                     metric["completion_rate"]) / summary["days_with_data"]
        summary["error_rate"] = ((summary["error_rate"] * (summary["days_with_data"] - 1)) + 
                                metric["error_rate"]) / summary["days_with_data"]
    
    # Return dashboard data
    return {
        "feature_usage_by_day": feature_usage,
        "feature_summary": list(feature_summary.values()),
        "websocket_metrics": websocket_metrics,
        "date_range": {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "days": (end_date - start_date).days + 1
        }
    }

@router.get("/dashboard/ai-assistant")
async def get_ai_assistant_dashboard(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get comprehensive dashboard data for AI assistant usage."""
    if not start_date:
        start_date = (datetime.utcnow() - timedelta(days=30)).date()
    if not end_date:
        end_date = datetime.utcnow().date()
    
    # Get AI assistant metrics
    ai_metrics = await ux_analytics_service.get_ai_assistant_metrics(
        start_date=start_date,
        end_date=end_date
    )
    
    # Get API usage metrics for AI assistants
    api_costs = await metrics_service.get_model_costs(
        start_date=start_date,
        end_date=end_date
    )
    
    # Group metrics by suggestion type
    suggestion_summary = {}
    for metric in ai_metrics:
        suggestion_type = metric["suggestion_type"]
        if suggestion_type not in suggestion_summary:
            suggestion_summary[suggestion_type] = {
                "suggestion_type": suggestion_type,
                "total_generated": 0,
                "total_accepted": 0,
                "acceptance_rate": 0,
                "avg_response_time_ms": 0,
                "count": 0
            }
        
        summary = suggestion_summary[suggestion_type]
        summary["total_generated"] += metric["suggestions_generated"]
        summary["total_accepted"] += metric["suggestions_accepted"]
        summary["count"] += 1
        
        if metric["suggestions_viewed"] > 0:
            new_acceptance = metric["suggestions_accepted"] / metric["suggestions_viewed"]
            summary["acceptance_rate"] = ((summary["acceptance_rate"] * (summary["count"] - 1)) + 
                                         new_acceptance) / summary["count"]
        
        summary["avg_response_time_ms"] = ((summary["avg_response_time_ms"] * (summary["count"] - 1)) + 
                                          metric["avg_response_time_ms"]) / summary["count"]
    
    # Return dashboard data
    return {
        "metrics_by_day": ai_metrics,
        "suggestion_summary": list(suggestion_summary.values()),
        "api_costs": api_costs,
        "date_range": {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "days": (end_date - start_date).days + 1
        }
    }

@router.get("/dashboard/user-journeys")
async def get_user_journey_dashboard(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get comprehensive dashboard data for user journeys."""
    if not start_date:
        start_date = (datetime.utcnow() - timedelta(days=30)).date()
    if not end_date:
        end_date = datetime.utcnow().date()
    
    # Get user journey metrics
    journey_metrics = await ux_analytics_service.get_user_journey_metrics(
        start_date=start_date,
        end_date=end_date
    )
    
    # Return dashboard data
    return {
        "journey_metrics": journey_metrics,
        "date_range": {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "days": (end_date - start_date).days + 1
        }
    }

@router.get("/dashboard/ab-tests")
async def get_ab_tests_dashboard(
    feature_area: Optional[str] = None,
    status: Optional[str] = None
):
    """Get comprehensive dashboard data for A/B tests."""
    # Get A/B test results
    ab_tests = await ux_analytics_service.get_ab_test_results(
        feature_area=feature_area,
        status=status
    )
    
    # Group tests by test_id
    grouped_tests = {}
    for variant in ab_tests:
        test_id = variant["test_id"]
        if test_id not in grouped_tests:
            grouped_tests[test_id] = {
                "test_id": test_id,
                "feature_area": variant["feature_area"],
                "status": variant["status"],
                "start_date": variant["start_date"],
                "end_date": variant["end_date"],
                "variants": []
            }
        
        grouped_tests[test_id]["variants"].append(variant)
    
    # Return dashboard data
    return {
        "tests": list(grouped_tests.values())
    }