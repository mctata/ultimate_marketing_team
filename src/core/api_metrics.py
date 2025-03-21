"""
API Metrics Service for tracking and analyzing AI API usage

This module provides functionality for:
1. Storing API usage data in the database
2. Aggregating daily usage metrics
3. Calculating cost projections and budget status
4. Monitoring error rates and performance metrics
"""

import asyncio
import json
import time
from typing import Dict, List, Optional, Tuple, Union
from datetime import datetime, timedelta, date
from sqlalchemy import func, select, and_, desc, extract, cast
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import expression
from sqlalchemy.dialects.postgresql import insert

from loguru import logger
from src.core.database import get_db
from src.core.settings import settings
from src.models.system import AIAPIUsage, DailyCostSummary

# Lock for synchronizing daily summary updates
SUMMARY_UPDATE_LOCK = asyncio.Lock()

class MetricsService:
    """Service for tracking and analyzing API usage metrics."""
    
    @staticmethod
    async def record_api_usage(
        provider: str,
        model: str,
        tokens_in: int,
        tokens_out: int,
        duration_ms: int,
        cost_usd: float,
        endpoint: str,
        cached: bool = False,
        success: bool = True,
        error_type: Optional[str] = None,
        agent_type: Optional[str] = None,
        task_id: Optional[str] = None
    ) -> None:
        """Record a single API usage event to the database.
        
        Args:
            provider: API provider (openai, anthropic, etc.)
            model: Model name (gpt-4, claude-3-opus, etc.)
            tokens_in: Input token count
            tokens_out: Output token count
            duration_ms: Request duration in milliseconds
            cost_usd: Estimated cost in USD
            endpoint: API endpoint used (completion, chat, embeddings, etc.)
            cached: Whether the response was served from cache
            success: Whether the request succeeded
            error_type: Error type if the request failed
            agent_type: Type of agent that made the request
            task_id: Associated task ID
        """
        try:
            # Convert cost from dollars to cents for storage
            cost_cents = int(cost_usd * 100)
            
            # Create new usage record
            usage = AIAPIUsage(
                provider=provider,
                model=model,
                tokens_in=tokens_in,
                tokens_out=tokens_out,
                total_tokens=tokens_in + tokens_out,
                duration_ms=duration_ms,
                cost_usd=cost_cents,
                endpoint=endpoint,
                cached=cached,
                success=success,
                error_type=error_type,
                agent_type=agent_type,
                task_id=task_id,
                created_at=datetime.utcnow()
            )
            
            # Save to database
            with get_db() as session:
                session.add(usage)
                session.commit()
                
            # Update daily summary (non-blocking)
            asyncio.create_task(
                MetricsService.update_daily_summary(
                    provider=provider,
                    model=model,
                    tokens=tokens_in + tokens_out,
                    cost_usd=cost_usd,
                    cached=cached,
                    success=success
                )
            )
            
        except Exception as e:
            logger.error(f"Error recording API usage: {str(e)}")
    
    @staticmethod
    async def update_daily_summary(
        provider: str,
        model: str,
        tokens: int,
        cost_usd: float,
        cached: bool,
        success: bool
    ) -> None:
        """Update the daily cost summary for a provider and model.
        
        Args:
            provider: API provider
            model: Model name
            tokens: Total tokens used
            cost_usd: Cost in USD
            cached: Whether the request was cached
            success: Whether the request succeeded
        """
        try:
            # Convert cost from dollars to cents for storage
            cost_cents = int(cost_usd * 100)
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Acquire lock to prevent race conditions during updates
            with get_db() as session:
                # Check if an entry for today already exists
                stmt = select(DailyCostSummary).where(
                    and_(
                        DailyCostSummary.date == today,
                        DailyCostSummary.provider == provider,
                        DailyCostSummary.model == model
                    )
                )
                result = session.execute(stmt)
                summary = result.scalars().first()
                    
                if summary:
                    # Update existing summary
                    summary.total_requests += 1
                    summary.cached_requests += 1 if cached else 0
                    summary.failed_requests += 1 if not success else 0
                    summary.total_tokens += tokens
                    summary.cost_usd += cost_cents
                    summary.updated_at = datetime.utcnow()
                else:
                    # Create new summary
                    summary = DailyCostSummary(
                        date=today,
                        provider=provider,
                        model=model,
                        total_requests=1,
                        cached_requests=1 if cached else 0,
                        failed_requests=1 if not success else 0,
                        total_tokens=tokens,
                        cost_usd=cost_cents,
                        updated_at=datetime.utcnow()
                    )
                    session.add(summary)
                
                session.commit()
                    
        except Exception as e:
            logger.error(f"Error updating daily summary: {str(e)}")
    
    @staticmethod
    async def get_daily_costs(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        provider: Optional[str] = None
    ) -> List[Dict]:
        """Get daily costs for the specified date range.
        
        Args:
            start_date: Start date (defaults to 7 days ago)
            end_date: End date (defaults to today)
            provider: Filter by provider (optional)
            
        Returns:
            List of daily cost summaries
        """
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=7)).date()
        if not end_date:
            end_date = datetime.utcnow().date()
            
        filters = [
            DailyCostSummary.date >= start_date,
            DailyCostSummary.date <= end_date
        ]
        
        if provider:
            filters.append(DailyCostSummary.provider == provider)
        
        try:
            with get_db() as session:
                stmt = select(DailyCostSummary).where(
                    and_(*filters)
                ).order_by(DailyCostSummary.date, DailyCostSummary.provider, DailyCostSummary.model)
                
                result = session.execute(stmt)
                summaries = result.scalars().all()
                
                # Convert to dictionaries with formatted costs
                return [
                    {
                        "date": summary.date.strftime("%Y-%m-%d"),
                        "provider": summary.provider,
                        "model": summary.model,
                        "total_requests": summary.total_requests,
                        "cached_requests": summary.cached_requests,
                        "failed_requests": summary.failed_requests,
                        "total_tokens": summary.total_tokens,
                        "cost_usd": summary.cost_usd / 100,  # Convert cents to dollars
                        "cache_hit_ratio": (summary.cached_requests / summary.total_requests 
                                           if summary.total_requests > 0 else 0),
                        "error_rate": (summary.failed_requests / summary.total_requests 
                                      if summary.total_requests > 0 else 0),
                    }
                    for summary in summaries
                ]
                
        except Exception as e:
            logger.error(f"Error getting daily costs: {str(e)}")
            return []
    
    @staticmethod
    async def get_provider_costs(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, float]:
        """Get total costs by provider for the specified date range.
        
        Args:
            start_date: Start date (defaults to start of current month)
            end_date: End date (defaults to today)
            
        Returns:
            Dictionary mapping provider to total cost
        """
        if not start_date:
            today = datetime.utcnow()
            start_date = date(today.year, today.month, 1)
        if not end_date:
            end_date = datetime.utcnow().date()
            
        try:
            with get_db() as session:
                stmt = select(
                    DailyCostSummary.provider,
                    func.sum(DailyCostSummary.cost_usd).label('total_cost')
                ).where(
                    and_(
                        DailyCostSummary.date >= start_date,
                        DailyCostSummary.date <= end_date
                    )
                ).group_by(DailyCostSummary.provider)
                
                result = session.execute(stmt)
                provider_costs = result.all()
                
                # Convert to dictionary and convert cents to dollars
                return {
                    provider: cost / 100
                    for provider, cost in provider_costs
                }
                
        except Exception as e:
            logger.error(f"Error getting provider costs: {str(e)}")
            return {}
    
    @staticmethod
    async def get_model_costs(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        provider: Optional[str] = None
    ) -> List[Dict[str, Union[str, float, int]]]:
        """Get costs broken down by model for the specified date range.
        
        Args:
            start_date: Start date (defaults to start of current month)
            end_date: End date (defaults to today)
            provider: Filter by provider (optional)
            
        Returns:
            List of dictionaries with model cost breakdowns
        """
        if not start_date:
            today = datetime.utcnow()
            start_date = date(today.year, today.month, 1)
        if not end_date:
            end_date = datetime.utcnow().date()
            
        filters = [
            DailyCostSummary.date >= start_date,
            DailyCostSummary.date <= end_date
        ]
        
        if provider:
            filters.append(DailyCostSummary.provider == provider)
            
        try:
            with get_db() as session:
                stmt = select(
                    DailyCostSummary.provider,
                    DailyCostSummary.model,
                    func.sum(DailyCostSummary.total_tokens).label('tokens'),
                    func.sum(DailyCostSummary.cost_usd).label('cost'),
                    func.sum(DailyCostSummary.total_requests).label('requests'),
                    func.sum(DailyCostSummary.cached_requests).label('cached')
                ).where(
                    and_(*filters)
                ).group_by(
                    DailyCostSummary.provider,
                    DailyCostSummary.model
                ).order_by(
                    desc('cost')
                )
                
                result = session.execute(stmt)
                model_costs = result.all()
                
                # Convert to dictionaries with formatted values
                return [
                    {
                        "provider": provider,
                        "model": model,
                        "tokens": tokens,
                        "cost_usd": cost / 100,  # Convert cents to dollars
                        "requests": requests,
                        "cached_requests": cached,
                        "cache_hit_ratio": cached / requests if requests > 0 else 0,
                        "cost_per_1k_tokens": (cost / tokens) * 10 if tokens > 0 else 0  # Cost per 1k tokens
                    }
                    for provider, model, tokens, cost, requests, cached in model_costs
                ]
                
        except Exception as e:
            logger.error(f"Error getting model costs: {str(e)}")
            return []
    
    @staticmethod
    async def get_budget_status() -> Dict[str, Dict[str, Union[float, bool]]]:
        """Get the current budget status for each provider.
        
        Returns:
            Dictionary mapping provider to budget status
        """
        try:
            # Get today's date
            today = datetime.utcnow().date()
            month_start = date(today.year, today.month, 1)
            
            # Get costs for current month
            provider_costs = await MetricsService.get_provider_costs(
                start_date=month_start,
                end_date=today
            )
            
            # Get budget limits from settings
            budget_limits = {
                "openai": settings.OPENAI_DAILY_BUDGET_USD * 30,  # Monthly budget
                "anthropic": settings.ANTHROPIC_DAILY_BUDGET_USD * 30  # Monthly budget
            }
            
            # Calculate days in current month
            next_month = today.month + 1 if today.month < 12 else 1
            next_month_year = today.year if today.month < 12 else today.year + 1
            month_end = date(next_month_year, next_month, 1) - timedelta(days=1)
            days_in_month = month_end.day
            
            # Calculate expected end-of-month costs based on current spend rate
            days_elapsed = (today - month_start).days + 1
            projected_costs = {}
            
            for provider, cost in provider_costs.items():
                if days_elapsed > 0:
                    daily_avg = cost / days_elapsed
                    remaining_days = days_in_month - days_elapsed
                    projected_month_end = cost + (daily_avg * remaining_days)
                else:
                    projected_month_end = cost
                
                budget = budget_limits.get(provider, float('inf'))
                projected_costs[provider] = {
                    "current_spend": cost,
                    "monthly_budget": budget,
                    "budget_percent": (cost / budget) * 100 if budget > 0 else 0,
                    "projected_month_end": projected_month_end,
                    "projected_percent": (projected_month_end / budget) * 100 if budget > 0 else 0,
                    "estimated_overage": max(0, projected_month_end - budget),
                    "warning_level": "high" if projected_month_end > budget else 
                                     "medium" if projected_month_end > budget * 0.8 else 
                                     "low"
                }
            
            return projected_costs
                
        except Exception as e:
            logger.error(f"Error getting budget status: {str(e)}")
            return {}
            
    @staticmethod
    async def get_cache_metrics(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, float]:
        """Get cache performance metrics.
        
        Args:
            start_date: Start date (defaults to 7 days ago)
            end_date: End date (defaults to today)
            
        Returns:
            Dictionary with cache metrics
        """
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=7)).date()
        if not end_date:
            end_date = datetime.utcnow().date()
            
        try:
            with get_db() as session:
                # Get total requests and cached requests
                stmt = select(
                    func.sum(DailyCostSummary.total_requests).label('total'),
                    func.sum(DailyCostSummary.cached_requests).label('cached'),
                    func.sum(DailyCostSummary.cost_usd).label('total_cost')
                ).where(
                    and_(
                        DailyCostSummary.date >= start_date,
                        DailyCostSummary.date <= end_date
                    )
                )
                
                result = session.execute(stmt)
                totals = result.one()
                total_requests, cached_requests, total_cost = totals
                
                # Calculate cache metrics
                if not total_requests:
                    return {
                        "cache_hit_ratio": 0,
                        "estimated_savings": 0,
                        "total_requests": 0,
                        "cached_requests": 0
                    }
                    
                cache_hit_ratio = cached_requests / total_requests
                
                # Estimate savings based on cache hit ratio
                # Assumes cached requests would have cost the same as non-cached ones
                avg_cost_per_request = (total_cost / (total_requests - cached_requests)) if (total_requests - cached_requests) > 0 else 0
                estimated_savings = cached_requests * avg_cost_per_request / 100  # Convert cents to dollars
                
                return {
                    "cache_hit_ratio": cache_hit_ratio,
                    "estimated_savings": estimated_savings,
                    "total_requests": total_requests,
                    "cached_requests": cached_requests
                }
                
        except Exception as e:
            logger.error(f"Error getting cache metrics: {str(e)}")
            return {
                "cache_hit_ratio": 0,
                "estimated_savings": 0,
                "total_requests": 0,
                "cached_requests": 0
            }
    
    @staticmethod
    async def get_error_rates(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Dict[str, float]]:
        """Get error rates by provider.
        
        Args:
            start_date: Start date (defaults to 7 days ago)
            end_date: End date (defaults to today)
            
        Returns:
            Dictionary mapping provider to error rate info
        """
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=7)).date()
        if not end_date:
            end_date = datetime.utcnow().date()
            
        try:
            with get_db() as session:
                # Get total requests and failed requests by provider
                stmt = select(
                    DailyCostSummary.provider,
                    func.sum(DailyCostSummary.total_requests).label('total'),
                    func.sum(DailyCostSummary.failed_requests).label('failed')
                ).where(
                    and_(
                        DailyCostSummary.date >= start_date,
                        DailyCostSummary.date <= end_date
                    )
                ).group_by(DailyCostSummary.provider)
                
                result = session.execute(stmt)
                provider_errors = result.all()
                
                # Calculate error rates by provider
                return {
                    provider: {
                        "error_rate": failed / total if total > 0 else 0,
                        "total_requests": total,
                        "failed_requests": failed
                    }
                    for provider, total, failed in provider_errors
                }
                
        except Exception as e:
            logger.error(f"Error getting error rates: {str(e)}")
            return {}
            
    @staticmethod
    async def get_agent_usage(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict[str, Union[str, int, float]]]:
        """Get API usage broken down by agent type.
        
        Args:
            start_date: Start date (defaults to 7 days ago)
            end_date: End date (defaults to today)
            
        Returns:
            List of dictionaries with agent usage metrics
        """
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=7)).date()
        if not end_date:
            end_date = datetime.utcnow().date()
            
        try:
            with get_db() as session:
                # Get usage by agent type
                stmt = select(
                    AIAPIUsage.agent_type,
                    func.count().label('request_count'),
                    func.sum(AIAPIUsage.total_tokens).label('total_tokens'),
                    func.sum(AIAPIUsage.cost_usd).label('total_cost')
                ).where(
                    and_(
                        AIAPIUsage.created_at >= start_date,
                        AIAPIUsage.created_at <= end_date + timedelta(days=1),  # Include end date
                        AIAPIUsage.agent_type != None  # Only include records with agent_type
                    )
                ).group_by(AIAPIUsage.agent_type)
                
                result = session.execute(stmt)
                agent_usage = result.all()
                
                # Format results
                return [
                    {
                        "agent_type": agent_type,
                        "request_count": request_count,
                        "total_tokens": total_tokens,
                        "cost_usd": total_cost / 100,  # Convert cents to dollars
                        "avg_tokens_per_request": total_tokens / request_count if request_count > 0 else 0
                    }
                    for agent_type, request_count, total_tokens, total_cost in agent_usage
                    if agent_type  # Filter out None values
                ]
                
        except Exception as e:
            logger.error(f"Error getting agent usage: {str(e)}")
            return []

# Create metrics service instance
metrics_service = MetricsService()