"""
API Metrics Router

Endpoints for monitoring AI API usage and costs
"""

from datetime import date, datetime, timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.api_metrics import metrics_service
from src.core.database import get_session
from src.core.security import get_current_user_with_permissions

router = APIRouter(
    prefix="/metrics",
    tags=["metrics"],
    dependencies=[Depends(get_current_user_with_permissions(["system:view_metrics"]))],
)

@router.get("/ai/daily-costs")
async def get_daily_costs(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    provider: Optional[str] = None,
):
    """Get daily AI API costs."""
    if not start_date:
        start_date = (datetime.utcnow() - timedelta(days=30)).date()
    if not end_date:
        end_date = datetime.utcnow().date()
    
    return await metrics_service.get_daily_costs(start_date, end_date, provider)

@router.get("/ai/provider-costs")
async def get_provider_costs(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Get total costs by provider."""
    return await metrics_service.get_provider_costs(start_date, end_date)

@router.get("/ai/model-costs")
async def get_model_costs(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    provider: Optional[str] = None,
):
    """Get costs broken down by model."""
    return await metrics_service.get_model_costs(start_date, end_date, provider)

@router.get("/ai/budget-status")
async def get_budget_status():
    """Get the current budget status for each provider."""
    return await metrics_service.get_budget_status()

@router.get("/ai/cache-metrics")
async def get_cache_metrics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Get cache performance metrics."""
    return await metrics_service.get_cache_metrics(start_date, end_date)

@router.get("/ai/error-rates")
async def get_error_rates(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Get error rates by provider."""
    return await metrics_service.get_error_rates(start_date, end_date)

@router.get("/ai/agent-usage")
async def get_agent_usage(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Get API usage broken down by agent type."""
    return await metrics_service.get_agent_usage(start_date, end_date)