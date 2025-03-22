"""
Content Analytics Router

Endpoints for content performance metrics, analytics, and reporting
"""

from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Union, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Body, Path
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from src.core.content_metrics import content_metrics_service
from src.core.database import get_db
from src.core.security import get_current_user_with_permissions

# Define Pydantic models for request/response validation
class ContentMetricCreate(BaseModel):
    content_id: int
    date: date
    platform: str
    metrics: Dict[str, Union[int, float, Dict]]

class MetricValue(BaseModel):
    metric: str
    value: float

class ContentMetricResponse(BaseModel):
    id: int
    content_id: int
    date: str
    platform: str
    views: int = 0
    unique_visitors: int = 0
    likes: int = 0
    shares: int = 0
    comments: int = 0
    clicks: int = 0
    click_through_rate: float = 0
    avg_time_on_page: int = 0
    bounce_rate: float = 0
    scroll_depth: float = 0
    conversions: int = 0
    conversion_rate: float = 0
    leads_generated: int = 0
    revenue_generated: float = 0
    serp_position: Optional[float] = None
    organic_traffic: int = 0
    backlinks: int = 0
    demographics: Optional[Dict] = None
    sources: Optional[Dict] = None
    devices: Optional[Dict] = None

class PerformanceSummary(BaseModel):
    total_views: int = 0
    total_unique_visitors: int = 0
    total_likes: int = 0
    total_shares: int = 0
    total_comments: int = 0
    total_clicks: int = 0
    avg_click_through_rate: float = 0
    avg_time_on_page: float = 0
    avg_bounce_rate: float = 0
    total_conversions: int = 0
    avg_conversion_rate: float = 0
    total_revenue: float = 0
    content_count: int = 0

class TimeSeriesPoint(BaseModel):
    period: str
    views: int = 0
    unique_visitors: int = 0
    likes: int = 0
    shares: int = 0
    comments: int = 0
    clicks: int = 0
    click_through_rate: float = 0
    avg_time_on_page: float = 0
    bounce_rate: float = 0
    conversions: int = 0
    conversion_rate: float = 0
    revenue: float = 0

class PerformanceSummaryResponse(BaseModel):
    summary: Optional[PerformanceSummary] = None
    time_series: Optional[List[TimeSeriesPoint]] = None

class TopPerformingContent(BaseModel):
    content_id: int
    views: int = 0
    conversions: int = 0
    revenue: float = 0
    metric_value: float = 0

class ContentComparison(BaseModel):
    content_id: int
    metrics: Dict[str, float]

class ContentComparisonResponse(BaseModel):
    comparison: List[ContentComparison]

class AttributionData(BaseModel):
    content_id: int
    attributed_conversions: float
    attributed_value: float

class ContentAttributionResponse(BaseModel):
    model: str
    total_conversions: int = 0
    total_value: float = 0
    content_attribution: List[AttributionData]

class DashboardWidget(BaseModel):
    id: str
    widget_type: str
    title: str
    settings: Dict[str, Any]
    i: Optional[str] = None
    x: int = 0
    y: int = 0
    w: int = 3
    h: int = 2
    min_w: Optional[int] = None
    max_w: Optional[int] = None
    min_h: Optional[int] = None
    max_h: Optional[int] = None
    static: bool = False

class DashboardLayout(BaseModel):
    columns: int = 12
    row_height: int = 50
    compact_type: str = "vertical"
    is_draggable: bool = True
    is_resizable: bool = True
    is_bounded: bool = False
    prevent_collision: bool = False

class CustomDashboardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    layout: Optional[DashboardLayout] = None
    widgets: List[DashboardWidget] = []
    is_default: bool = False
    role_id: Optional[int] = None

class CustomDashboardResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    layout: Dict[str, Any]
    widgets: List[Dict[str, Any]]
    is_default: bool
    role_id: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class CustomDashboardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    layout: Optional[Dict[str, Any]] = None
    widgets: Optional[List[Dict[str, Any]]] = None
    is_default: Optional[bool] = None
    role_id: Optional[int] = None

class AnalyticsReportConfig(BaseModel):
    date_range: Dict[str, Any]
    metrics: List[str]
    filters: Optional[Dict[str, Any]] = None
    grouping: Optional[str] = None
    charts: Optional[List[Dict[str, Any]]] = None
    comparisons: Optional[List[int]] = None

class AnalyticsReportCreate(BaseModel):
    name: str
    report_type: str
    config: AnalyticsReportConfig
    description: Optional[str] = None
    template_id: Optional[str] = None
    schedule_type: Optional[str] = None
    schedule_config: Optional[Dict[str, Any]] = None
    recipients: Optional[List[str]] = None

class AnalyticsReportResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_by: int
    report_type: str
    template_id: Optional[str] = None
    config: Dict[str, Any]
    schedule_type: Optional[str] = None
    schedule_config: Optional[Dict[str, Any]] = None
    recipients: Optional[List[str]] = None
    last_generated: Optional[str] = None
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ContentPredictionRequest(BaseModel):
    content_id: int
    content_data: Dict[str, Any]
    target_metric: str = "views"
    prediction_horizon: int = 30

class ContentPredictionResponse(BaseModel):
    content_id: int
    target_metric: str
    prediction_date: str
    predicted_value: float
    confidence_interval_lower: float
    confidence_interval_upper: float
    model: Dict[str, Any]

# Create router
router = APIRouter(
    prefix="/content-analytics",
    tags=["content-analytics"],
    dependencies=[Depends(get_current_user_with_permissions(["content:view"]))],
)

# Content Metrics Endpoints
@router.post("/metrics", response_model=Dict[str, str])
async def record_content_metric(
    metric_data: ContentMetricCreate
):
    """Record content performance metrics."""
    await content_metrics_service.record_content_metric(
        content_id=metric_data.content_id,
        date=metric_data.date,
        platform=metric_data.platform,
        metrics=metric_data.metrics
    )
    return {"status": "success"}

@router.get("/metrics", response_model=List[ContentMetricResponse])
async def get_content_metrics(
    content_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    platform: Optional[str] = None,
    metrics: Optional[str] = Query(None, description="Comma-separated list of metrics to include")
):
    """Get content metrics filtered by various parameters."""
    metrics_list = metrics.split(",") if metrics else None
    return await content_metrics_service.get_content_metrics(
        content_id=content_id,
        start_date=start_date,
        end_date=end_date,
        platform=platform,
        metrics=metrics_list
    )

@router.get("/performance", response_model=PerformanceSummaryResponse)
async def get_content_performance_summary(
    content_ids: Optional[str] = Query(None, description="Comma-separated list of content IDs"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    group_by: Optional[str] = Query(None, description="Time grouping: daily, weekly, monthly")
):
    """Get aggregated performance summary for content."""
    content_id_list = [int(id) for id in content_ids.split(",")] if content_ids else None
    return await content_metrics_service.get_content_performance_summary(
        content_ids=content_id_list,
        start_date=start_date,
        end_date=end_date,
        group_by=group_by
    )

@router.get("/top-performing", response_model=List[TopPerformingContent])
async def get_top_performing_content(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    metric: str = Query("views", description="Metric to rank by: views, conversions, revenue, etc."),
    limit: int = Query(10, ge=1, le=100),
    content_type: Optional[str] = None
):
    """Get top performing content based on a specific metric."""
    return await content_metrics_service.get_top_performing_content(
        start_date=start_date,
        end_date=end_date,
        metric=metric,
        limit=limit,
        content_type=content_type
    )

@router.get("/comparison", response_model=ContentComparisonResponse)
async def get_content_comparison(
    content_ids: str = Query(..., description="Comma-separated list of content IDs to compare"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    metrics: Optional[str] = Query(None, description="Comma-separated list of metrics to include")
):
    """Compare performance metrics for specified content."""
    content_id_list = [int(id) for id in content_ids.split(",")]
    metrics_list = metrics.split(",") if metrics else None
    return await content_metrics_service.get_content_comparison(
        content_ids=content_id_list,
        start_date=start_date,
        end_date=end_date,
        metrics=metrics_list
    )

@router.get("/attribution", response_model=ContentAttributionResponse)
async def get_content_attribution(
    content_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    attribution_model: str = Query("last_touch", description="Attribution model: first_touch, last_touch, linear, position_based")
):
    """Get attribution data for content conversions."""
    return await content_metrics_service.get_content_attribution(
        content_id=content_id,
        start_date=start_date,
        end_date=end_date,
        attribution_model=attribution_model
    )

# Custom Dashboards Endpoints
@router.post("/dashboards", response_model=CustomDashboardResponse)
async def create_custom_dashboard(
    dashboard: CustomDashboardCreate,
    current_user=Depends(get_current_user_with_permissions(["analytics:create_dashboard"]))
):
    """Create a new custom dashboard."""
    return await content_metrics_service.create_custom_dashboard(
        user_id=current_user.id,
        name=dashboard.name,
        description=dashboard.description,
        layout=dashboard.layout.dict() if dashboard.layout else None,
        widgets=[w.dict() for w in dashboard.widgets] if dashboard.widgets else None,
        is_default=dashboard.is_default,
        role_id=dashboard.role_id
    )

@router.get("/dashboards", response_model=List[CustomDashboardResponse])
async def get_custom_dashboards(
    dashboard_id: Optional[int] = None,
    include_role_dashboards: bool = Query(True),
    current_user=Depends(get_current_user_with_permissions(["analytics:view"]))
):
    """Get custom dashboards for the current user."""
    return await content_metrics_service.get_custom_dashboards(
        user_id=current_user.id,
        dashboard_id=dashboard_id,
        include_role_dashboards=include_role_dashboards
    )

@router.put("/dashboards/{dashboard_id}", response_model=CustomDashboardResponse)
async def update_custom_dashboard(
    dashboard_id: int = Path(..., description="Dashboard ID"),
    updates: CustomDashboardUpdate = Body(...),
    current_user=Depends(get_current_user_with_permissions(["analytics:edit_dashboard"]))
):
    """Update a custom dashboard."""
    result = await content_metrics_service.update_custom_dashboard(
        dashboard_id=dashboard_id,
        user_id=current_user.id,
        updates=updates.dict(exclude_unset=True)
    )
    if 'error' in result:
        raise HTTPException(status_code=404, detail=result['error'])
    return result

# Analytics Reports Endpoints
@router.post("/reports", response_model=AnalyticsReportResponse)
async def create_analytics_report(
    report: AnalyticsReportCreate,
    current_user=Depends(get_current_user_with_permissions(["analytics:create_report"]))
):
    """Create a new analytics report."""
    result = await content_metrics_service.create_analytics_report(
        user_id=current_user.id,
        name=report.name,
        report_type=report.report_type,
        config=report.config.dict(),
        description=report.description,
        template_id=report.template_id,
        schedule_type=report.schedule_type,
        schedule_config=report.schedule_config,
        recipients=report.recipients
    )
    if 'error' in result:
        raise HTTPException(status_code=400, detail=result['error'])
    return result

@router.get("/reports", response_model=List[AnalyticsReportResponse])
async def get_analytics_reports(
    report_id: Optional[int] = None,
    report_type: Optional[str] = None,
    current_user=Depends(get_current_user_with_permissions(["analytics:view"]))
):
    """Get analytics reports for the current user."""
    return await content_metrics_service.get_analytics_reports(
        user_id=current_user.id,
        report_id=report_id,
        report_type=report_type
    )

@router.post("/generate-report/{report_id}", response_model=Dict[str, str])
async def generate_analytics_report(
    report_id: int,
    file_type: str = Query("pdf", description="File type: pdf, csv, html, pptx"),
    current_user=Depends(get_current_user_with_permissions(["analytics:create_report"]))
):
    """Generate an analytics report on demand."""
    # This would call a background task to generate the report
    # For now, return a placeholder response
    return {"status": "Report generation started", "report_id": str(report_id)}

# Predictions Endpoints
@router.post("/predict", response_model=ContentPredictionResponse)
async def predict_content_performance(
    prediction_request: ContentPredictionRequest,
    current_user=Depends(get_current_user_with_permissions(["content:predict"]))
):
    """Predict future performance for content."""
    result = await content_metrics_service.predict_content_performance(
        content_id=prediction_request.content_id,
        content_data=prediction_request.content_data,
        target_metric=prediction_request.target_metric,
        prediction_horizon=prediction_request.prediction_horizon
    )
    if 'error' in result:
        raise HTTPException(status_code=400, detail=result['error'])
    return result