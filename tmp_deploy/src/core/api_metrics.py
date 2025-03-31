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
from src.models.system import (
    AIAPIUsage, 
    DailyCostSummary, 
    UserInteractionEvent,
    FeatureUsageMetric,
    AIAssistantUsageMetric,
    WebSocketMetric,
    UserJourneyPath,
    UXABTestVariant
)

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


class UXAnalyticsService:
    """Service for tracking and analyzing UX and feature usage metrics."""
    
    @staticmethod
    async def record_user_interaction(
        session_id: str,
        event_type: str,
        event_category: str,
        event_action: str,
        event_label: Optional[str] = None,
        element_id: Optional[str] = None,
        page_path: Optional[str] = None,
        user_id: Optional[int] = None,
        content_id: Optional[int] = None,
        value: Optional[float] = None,
        metadata: Optional[Dict] = None,
        device_type: Optional[str] = None,
        browser: Optional[str] = None,
        os: Optional[str] = None,
        screen_size: Optional[str] = None,
    ) -> None:
        """Record a single user interaction event.
        
        Args:
            session_id: Unique session identifier
            event_type: Type of event (click, view, feature_use, etc.)
            event_category: Category of event (collaboration, ai_suggestion, editor, etc.)
            event_action: Specific action taken (accept_suggestion, share_cursor, etc.)
            event_label: Additional context for the event
            element_id: UI element identifier
            page_path: Page where event occurred
            user_id: User ID if authenticated
            content_id: Associated content ID if applicable
            value: Numeric value if applicable (e.g., time spent)
            metadata: Additional event metadata as dictionary
            device_type: Device type (desktop, mobile, tablet)
            browser: Browser name
            os: Operating system
            screen_size: Screen size/resolution
        """
        try:
            # Create new event record
            event = UserInteractionEvent(
                session_id=session_id,
                event_type=event_type,
                event_category=event_category,
                event_action=event_action,
                event_label=event_label,
                element_id=element_id,
                page_path=page_path,
                user_id=user_id,
                content_id=content_id,
                value=value,
                metadata=metadata,
                device_type=device_type,
                browser=browser,
                os=os,
                screen_size=screen_size,
                created_at=datetime.utcnow()
            )
            
            # Save to database
            with get_db() as session:
                session.add(event)
                session.commit()
                
            # Update aggregated metrics asynchronously
            if event_category and event_type == "feature_use":
                asyncio.create_task(
                    UXAnalyticsService.update_feature_usage_metrics(
                        feature_id=event_action,
                        feature_category=event_category,
                        user_id=user_id,
                        duration_sec=value if value else 0,
                        was_successful="error" not in (metadata or {})
                    )
                )
                
        except Exception as e:
            logger.error(f"Error recording user interaction: {str(e)}")
    
    @staticmethod
    async def update_feature_usage_metrics(
        feature_id: str,
        feature_category: str,
        user_id: Optional[int] = None,
        duration_sec: float = 0,
        was_successful: bool = True,
        variant: Optional[str] = None,
        led_to_conversion: bool = False,
    ) -> None:
        """Update aggregated feature usage metrics.
        
        Args:
            feature_id: Unique feature identifier
            feature_category: Feature category
            user_id: User ID if available
            duration_sec: Time spent using the feature in seconds
            was_successful: Whether the feature use was successful
            variant: A/B test variant if applicable
            led_to_conversion: Whether this usage led to a conversion
        """
        try:
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            with get_db() as session:
                # Check if an entry for today already exists
                stmt = select(FeatureUsageMetric).where(
                    and_(
                        FeatureUsageMetric.date == today,
                        FeatureUsageMetric.feature_id == feature_id,
                        FeatureUsageMetric.variant == variant if variant else FeatureUsageMetric.variant.is_(None)
                    )
                )
                result = session.execute(stmt)
                metric = result.scalars().first()
                
                if metric:
                    # Update existing metric
                    metric.total_uses += 1
                    
                    # Update unique users if user_id is provided
                    if user_id:
                        # Check if this is a new unique user for today
                        # This is simplified; in practice you'd track unique users in a separate table
                        # or use a more sophisticated approach
                        pass
                    
                    # Update duration metrics
                    if duration_sec > 0:
                        new_avg = ((metric.avg_duration_sec * (metric.total_uses - 1)) + duration_sec) / metric.total_uses
                        metric.avg_duration_sec = new_avg
                    
                    # Update success/error metrics
                    if was_successful:
                        metric.completion_rate = ((metric.completion_rate * (metric.total_uses - 1)) + 1) / metric.total_uses
                    else:
                        metric.error_rate = ((metric.error_rate * (metric.total_uses - 1)) + 1) / metric.total_uses
                    
                    # Update conversion rate if applicable
                    if led_to_conversion:
                        metric.conversion_rate = ((metric.conversion_rate * (metric.total_uses - 1)) + 1) / metric.total_uses
                    
                    metric.updated_at = datetime.utcnow()
                    
                else:
                    # Create new metric
                    metric = FeatureUsageMetric(
                        feature_id=feature_id,
                        feature_category=feature_category,
                        date=today,
                        unique_users=1 if user_id else 0,
                        total_uses=1,
                        avg_duration_sec=duration_sec,
                        completion_rate=1.0 if was_successful else 0.0,
                        error_rate=0.0 if was_successful else 1.0,
                        variant=variant,
                        conversion_rate=1.0 if led_to_conversion else 0.0,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    session.add(metric)
                
                session.commit()
                
        except Exception as e:
            logger.error(f"Error updating feature usage metrics: {str(e)}")
    
    @staticmethod
    async def record_ai_assistant_usage(
        suggestion_type: str,
        action: str,
        variant: Optional[str] = None,
        response_time_ms: Optional[int] = None,
        suggestion_length: Optional[int] = None,
    ) -> None:
        """Record AI writing assistant usage.
        
        Args:
            suggestion_type: Type of suggestion (completion, rephrasing, grammar, etc.)
            action: Action taken (generated, viewed, accepted, rejected, modified)
            variant: A/B test variant if applicable
            response_time_ms: Response time in milliseconds if applicable
            suggestion_length: Length of suggestion in characters if applicable
        """
        try:
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            with get_db() as session:
                # Check if an entry for today already exists
                stmt = select(AIAssistantUsageMetric).where(
                    and_(
                        AIAssistantUsageMetric.date == today,
                        AIAssistantUsageMetric.suggestion_type == suggestion_type,
                        AIAssistantUsageMetric.variant == variant if variant else AIAssistantUsageMetric.variant.is_(None)
                    )
                )
                result = session.execute(stmt)
                metric = result.scalars().first()
                
                if metric:
                    # Update existing metric based on action
                    if action == "generated":
                        metric.suggestions_generated += 1
                        if response_time_ms:
                            # Update average response time
                            new_avg = ((metric.avg_response_time_ms * (metric.suggestions_generated - 1)) + response_time_ms) / metric.suggestions_generated
                            metric.avg_response_time_ms = new_avg
                        if suggestion_length:
                            # Update average suggestion length
                            new_avg = ((metric.avg_suggestion_length * (metric.suggestions_generated - 1)) + suggestion_length) / metric.suggestions_generated
                            metric.avg_suggestion_length = new_avg
                    elif action == "viewed":
                        metric.suggestions_viewed += 1
                    elif action == "accepted":
                        metric.suggestions_accepted += 1
                        # Update acceptance rate
                        if metric.suggestions_viewed > 0:
                            metric.acceptance_rate = metric.suggestions_accepted / metric.suggestions_viewed
                    elif action == "rejected":
                        metric.suggestions_rejected += 1
                    elif action == "modified":
                        metric.suggestions_modified += 1
                    
                    metric.updated_at = datetime.utcnow()
                    
                else:
                    # Create new metric
                    metric_data = {
                        "date": today,
                        "suggestion_type": suggestion_type,
                        "suggestions_generated": 1 if action == "generated" else 0,
                        "suggestions_viewed": 1 if action == "viewed" else 0,
                        "suggestions_accepted": 1 if action == "accepted" else 0,
                        "suggestions_rejected": 1 if action == "rejected" else 0,
                        "suggestions_modified": 1 if action == "modified" else 0,
                        "acceptance_rate": 1.0 if action == "accepted" else 0.0,
                        "avg_response_time_ms": response_time_ms if action == "generated" and response_time_ms else 0,
                        "avg_suggestion_length": suggestion_length if action == "generated" and suggestion_length else 0,
                        "variant": variant,
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                    
                    metric = AIAssistantUsageMetric(**metric_data)
                    session.add(metric)
                
                session.commit()
                
        except Exception as e:
            logger.error(f"Error recording AI assistant usage: {str(e)}")
    
    @staticmethod
    async def record_websocket_metrics(
        metric_type: str,
        connections: Optional[int] = None,
        peak_connections: Optional[int] = None,
        avg_connections: Optional[float] = None,
        connection_errors: Optional[int] = None,
        messages_sent: Optional[int] = None,
        messages_received: Optional[int] = None,
        bytes_sent: Optional[int] = None,
        bytes_received: Optional[int] = None,
        avg_latency_ms: Optional[float] = None,
        p95_latency_ms: Optional[float] = None,
        p99_latency_ms: Optional[float] = None,
    ) -> None:
        """Record WebSocket connection metrics.
        
        Args:
            metric_type: Type of metric (connections, messages, latency, etc.)
            connections: Total connections if applicable
            peak_connections: Peak concurrent connections if applicable
            avg_connections: Average concurrent connections if applicable
            connection_errors: Number of connection errors if applicable
            messages_sent: Number of messages sent if applicable
            messages_received: Number of messages received if applicable
            bytes_sent: Number of bytes sent if applicable
            bytes_received: Number of bytes received if applicable
            avg_latency_ms: Average message latency in milliseconds if applicable
            p95_latency_ms: 95th percentile message latency in milliseconds if applicable
            p99_latency_ms: 99th percentile message latency in milliseconds if applicable
        """
        try:
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            with get_db() as session:
                # Check if an entry for today already exists
                stmt = select(WebSocketMetric).where(
                    and_(
                        WebSocketMetric.date == today,
                        WebSocketMetric.metric_type == metric_type
                    )
                )
                result = session.execute(stmt)
                metric = result.scalars().first()
                
                if metric:
                    # Update existing metric
                    if connections is not None:
                        metric.total_connections += connections
                    if peak_connections is not None:
                        metric.peak_concurrent_connections = max(metric.peak_concurrent_connections, peak_connections)
                    if avg_connections is not None:
                        metric.avg_concurrent_connections = avg_connections
                    if connection_errors is not None:
                        metric.connection_errors += connection_errors
                    if messages_sent is not None:
                        metric.messages_sent += messages_sent
                    if messages_received is not None:
                        metric.messages_received += messages_received
                    if bytes_sent is not None:
                        metric.bytes_sent += bytes_sent
                    if bytes_received is not None:
                        metric.bytes_received += bytes_received
                    if avg_latency_ms is not None:
                        metric.avg_message_latency_ms = avg_latency_ms
                    if p95_latency_ms is not None:
                        metric.p95_message_latency_ms = p95_latency_ms
                    if p99_latency_ms is not None:
                        metric.p99_message_latency_ms = p99_latency_ms
                    
                    metric.updated_at = datetime.utcnow()
                    
                else:
                    # Create new metric
                    metric = WebSocketMetric(
                        date=today,
                        metric_type=metric_type,
                        peak_concurrent_connections=peak_connections or 0,
                        avg_concurrent_connections=avg_connections or 0,
                        total_connections=connections or 0,
                        connection_errors=connection_errors or 0,
                        messages_sent=messages_sent or 0,
                        messages_received=messages_received or 0,
                        bytes_sent=bytes_sent or 0,
                        bytes_received=bytes_received or 0,
                        avg_message_latency_ms=avg_latency_ms or 0,
                        p95_message_latency_ms=p95_latency_ms or 0,
                        p99_message_latency_ms=p99_latency_ms or 0,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    session.add(metric)
                
                session.commit()
                
        except Exception as e:
            logger.error(f"Error recording WebSocket metrics: {str(e)}")
    
    @staticmethod
    async def record_user_journey(
        session_id: str,
        path: List[Dict],
        entry_page: str,
        exit_page: str,
        start_time: datetime,
        end_time: datetime,
        user_id: Optional[int] = None,
        entry_source: Optional[str] = None,
        device_type: Optional[str] = None,
        completed_task: bool = False,
        conversion_type: Optional[str] = None,
    ) -> None:
        """Record a complete user journey through the application.
        
        Args:
            session_id: Unique session identifier
            path: List of page visits with timestamps and durations
            entry_page: First page accessed
            exit_page: Last page accessed
            start_time: Start time of the session
            end_time: End time of the session
            user_id: User ID if authenticated
            entry_source: Source of the visit (direct, referral, email, etc.)
            device_type: Device type (desktop, mobile, tablet)
            completed_task: Whether the user completed a primary task
            conversion_type: Type of conversion if applicable
        """
        try:
            # Calculate total duration in seconds
            total_duration_sec = int((end_time - start_time).total_seconds())
            
            # Create new journey record
            journey = UserJourneyPath(
                session_id=session_id,
                path=path,
                entry_page=entry_page,
                exit_page=exit_page,
                start_time=start_time,
                end_time=end_time,
                total_duration_sec=total_duration_sec,
                user_id=user_id,
                entry_source=entry_source,
                device_type=device_type,
                completed_task=completed_task,
                conversion_type=conversion_type,
                created_at=datetime.utcnow()
            )
            
            # Save to database
            with get_db() as session:
                session.add(journey)
                session.commit()
                
        except Exception as e:
            logger.error(f"Error recording user journey: {str(e)}")
    
    @staticmethod
    async def create_ab_test_variant(
        test_id: str,
        name: str,
        feature_area: str,
        config: Dict,
        is_control: bool = False,
        description: Optional[str] = None,
        traffic_percentage: float = 50.0,
        user_segment: Optional[str] = None,
    ) -> Optional[int]:
        """Create a new A/B test variant.
        
        Args:
            test_id: Unique test identifier
            name: Variant name
            feature_area: Area being tested
            config: Variant configuration as dictionary
            is_control: Whether this is the control variant
            description: Variant description
            traffic_percentage: Percentage of traffic allocated to this variant
            user_segment: Target user segment if applicable
            
        Returns:
            Variant ID if successful, None otherwise
        """
        try:
            # Create new variant
            variant = UXABTestVariant(
                test_id=test_id,
                name=name,
                description=description,
                feature_area=feature_area,
                config=config,
                is_control=is_control,
                start_date=datetime.utcnow(),
                traffic_percentage=traffic_percentage,
                user_segment=user_segment,
                status="active",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            # Save to database
            with get_db() as session:
                session.add(variant)
                session.commit()
                session.refresh(variant)
                return variant.id
                
        except Exception as e:
            logger.error(f"Error creating A/B test variant: {str(e)}")
            return None
    
    @staticmethod
    async def conclude_ab_test(
        test_id: str,
        winner_variant_id: Optional[int] = None,
        metrics: Optional[Dict] = None,
    ) -> bool:
        """Conclude an A/B test and record results.
        
        Args:
            test_id: Test identifier
            winner_variant_id: ID of the winning variant if any
            metrics: Test result metrics
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with get_db() as session:
                # Get all variants for this test
                stmt = select(UXABTestVariant).where(UXABTestVariant.test_id == test_id)
                result = session.execute(stmt)
                variants = result.scalars().all()
                
                if not variants:
                    logger.error(f"No variants found for test ID: {test_id}")
                    return False
                
                # Update all variants
                for variant in variants:
                    variant.status = "concluded"
                    variant.end_date = datetime.utcnow()
                    variant.updated_at = datetime.utcnow()
                    
                    if metrics:
                        variant.metrics = metrics
                    
                    if winner_variant_id and variant.id == winner_variant_id:
                        variant.winner = True
                    else:
                        variant.winner = False
                
                session.commit()
                return True
                
        except Exception as e:
            logger.error(f"Error concluding A/B test: {str(e)}")
            return False
    
    @staticmethod
    async def get_feature_usage_metrics(
        feature_category: Optional[str] = None,
        feature_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        variant: Optional[str] = None,
    ) -> List[Dict]:
        """Get feature usage metrics for the specified filters.
        
        Args:
            feature_category: Filter by feature category
            feature_id: Filter by specific feature
            start_date: Start date (defaults to 7 days ago)
            end_date: End date (defaults to today)
            variant: Filter by A/B test variant
            
        Returns:
            List of feature usage metrics
        """
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=7)).date()
        if not end_date:
            end_date = datetime.utcnow().date()
            
        filters = [
            FeatureUsageMetric.date >= start_date,
            FeatureUsageMetric.date <= end_date
        ]
        
        if feature_category:
            filters.append(FeatureUsageMetric.feature_category == feature_category)
        if feature_id:
            filters.append(FeatureUsageMetric.feature_id == feature_id)
        if variant:
            filters.append(FeatureUsageMetric.variant == variant)
        
        try:
            with get_db() as session:
                stmt = select(FeatureUsageMetric).where(
                    and_(*filters)
                ).order_by(FeatureUsageMetric.date, FeatureUsageMetric.feature_category, FeatureUsageMetric.feature_id)
                
                result = session.execute(stmt)
                metrics = result.scalars().all()
                
                # Convert to dictionaries
                return [
                    {
                        "date": metric.date.strftime("%Y-%m-%d"),
                        "feature_id": metric.feature_id,
                        "feature_category": metric.feature_category,
                        "unique_users": metric.unique_users,
                        "total_uses": metric.total_uses,
                        "avg_duration_sec": metric.avg_duration_sec,
                        "completion_rate": metric.completion_rate,
                        "error_rate": metric.error_rate,
                        "satisfaction_score": metric.satisfaction_score,
                        "conversion_rate": metric.conversion_rate,
                        "variant": metric.variant
                    }
                    for metric in metrics
                ]
                
        except Exception as e:
            logger.error(f"Error getting feature usage metrics: {str(e)}")
            return []
    
    @staticmethod
    async def get_ai_assistant_metrics(
        suggestion_type: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        variant: Optional[str] = None,
    ) -> List[Dict]:
        """Get AI writing assistant usage metrics.
        
        Args:
            suggestion_type: Filter by suggestion type
            start_date: Start date (defaults to 7 days ago)
            end_date: End date (defaults to today)
            variant: Filter by A/B test variant
            
        Returns:
            List of AI assistant usage metrics
        """
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=7)).date()
        if not end_date:
            end_date = datetime.utcnow().date()
            
        filters = [
            AIAssistantUsageMetric.date >= start_date,
            AIAssistantUsageMetric.date <= end_date
        ]
        
        if suggestion_type:
            filters.append(AIAssistantUsageMetric.suggestion_type == suggestion_type)
        if variant:
            filters.append(AIAssistantUsageMetric.variant == variant)
        
        try:
            with get_db() as session:
                stmt = select(AIAssistantUsageMetric).where(
                    and_(*filters)
                ).order_by(AIAssistantUsageMetric.date, AIAssistantUsageMetric.suggestion_type)
                
                result = session.execute(stmt)
                metrics = result.scalars().all()
                
                # Convert to dictionaries
                return [
                    {
                        "date": metric.date.strftime("%Y-%m-%d"),
                        "suggestion_type": metric.suggestion_type,
                        "suggestions_generated": metric.suggestions_generated,
                        "suggestions_viewed": metric.suggestions_viewed,
                        "suggestions_accepted": metric.suggestions_accepted,
                        "suggestions_rejected": metric.suggestions_rejected,
                        "suggestions_modified": metric.suggestions_modified,
                        "acceptance_rate": metric.acceptance_rate,
                        "avg_response_time_ms": metric.avg_response_time_ms,
                        "avg_suggestion_length": metric.avg_suggestion_length,
                        "variant": metric.variant
                    }
                    for metric in metrics
                ]
                
        except Exception as e:
            logger.error(f"Error getting AI assistant metrics: {str(e)}")
            return []
    
    @staticmethod
    async def get_websocket_metrics(
        metric_type: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict]:
        """Get WebSocket connection metrics.
        
        Args:
            metric_type: Filter by metric type
            start_date: Start date (defaults to 7 days ago)
            end_date: End date (defaults to today)
            
        Returns:
            List of WebSocket metrics
        """
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=7)).date()
        if not end_date:
            end_date = datetime.utcnow().date()
            
        filters = [
            WebSocketMetric.date >= start_date,
            WebSocketMetric.date <= end_date
        ]
        
        if metric_type:
            filters.append(WebSocketMetric.metric_type == metric_type)
        
        try:
            with get_db() as session:
                stmt = select(WebSocketMetric).where(
                    and_(*filters)
                ).order_by(WebSocketMetric.date, WebSocketMetric.metric_type)
                
                result = session.execute(stmt)
                metrics = result.scalars().all()
                
                # Convert to dictionaries
                return [
                    {
                        "date": metric.date.strftime("%Y-%m-%d"),
                        "metric_type": metric.metric_type,
                        "peak_concurrent_connections": metric.peak_concurrent_connections,
                        "avg_concurrent_connections": metric.avg_concurrent_connections,
                        "total_connections": metric.total_connections,
                        "connection_errors": metric.connection_errors,
                        "messages_sent": metric.messages_sent,
                        "messages_received": metric.messages_received,
                        "bytes_sent": metric.bytes_sent,
                        "bytes_received": metric.bytes_received,
                        "avg_message_latency_ms": metric.avg_message_latency_ms,
                        "p95_message_latency_ms": metric.p95_message_latency_ms,
                        "p99_message_latency_ms": metric.p99_message_latency_ms
                    }
                    for metric in metrics
                ]
                
        except Exception as e:
            logger.error(f"Error getting WebSocket metrics: {str(e)}")
            return []
    
    @staticmethod
    async def get_user_journey_metrics(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        entry_page: Optional[str] = None,
        conversion_type: Optional[str] = None,
    ) -> Dict:
        """Get aggregated user journey metrics.
        
        Args:
            start_date: Start date (defaults to 7 days ago)
            end_date: End date (defaults to today)
            entry_page: Filter by entry page
            conversion_type: Filter by conversion type
            
        Returns:
            Dictionary with user journey metrics
        """
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=7)).date()
        if not end_date:
            end_date = datetime.utcnow().date()
            
        filters = [
            UserJourneyPath.start_time >= start_date,
            UserJourneyPath.start_time <= end_date + timedelta(days=1)  # Include end date
        ]
        
        if entry_page:
            filters.append(UserJourneyPath.entry_page == entry_page)
        if conversion_type:
            filters.append(UserJourneyPath.conversion_type == conversion_type)
        
        try:
            with get_db() as session:
                # Get journey counts
                count_stmt = select(func.count()).where(and_(*filters))
                total_journeys = session.execute(count_stmt).scalar()
                
                # Get completed task count
                completed_stmt = select(func.count()).where(
                    and_(*filters, UserJourneyPath.completed_task == True)
                )
                completed_tasks = session.execute(completed_stmt).scalar()
                
                # Get average duration
                duration_stmt = select(func.avg(UserJourneyPath.total_duration_sec)).where(and_(*filters))
                avg_duration = session.execute(duration_stmt).scalar() or 0
                
                # Get most common entry pages
                entry_stmt = select(
                    UserJourneyPath.entry_page,
                    func.count().label('count')
                ).where(
                    and_(*filters)
                ).group_by(
                    UserJourneyPath.entry_page
                ).order_by(
                    desc('count')
                ).limit(5)
                
                entry_results = session.execute(entry_stmt).all()
                top_entry_pages = [
                    {"page": page, "count": count}
                    for page, count in entry_results
                ]
                
                # Get most common exit pages
                exit_stmt = select(
                    UserJourneyPath.exit_page,
                    func.count().label('count')
                ).where(
                    and_(*filters)
                ).group_by(
                    UserJourneyPath.exit_page
                ).order_by(
                    desc('count')
                ).limit(5)
                
                exit_results = session.execute(exit_stmt).all()
                top_exit_pages = [
                    {"page": page, "count": count}
                    for page, count in exit_results
                ]
                
                # Get device breakdown
                device_stmt = select(
                    UserJourneyPath.device_type,
                    func.count().label('count')
                ).where(
                    and_(*filters)
                ).group_by(
                    UserJourneyPath.device_type
                )
                
                device_results = session.execute(device_stmt).all()
                device_breakdown = [
                    {"device": device or "unknown", "count": count}
                    for device, count in device_results
                ]
                
                # Return aggregated metrics
                return {
                    "total_journeys": total_journeys,
                    "completed_tasks": completed_tasks,
                    "completion_rate": completed_tasks / total_journeys if total_journeys > 0 else 0,
                    "avg_duration_sec": avg_duration,
                    "top_entry_pages": top_entry_pages,
                    "top_exit_pages": top_exit_pages,
                    "device_breakdown": device_breakdown
                }
                
        except Exception as e:
            logger.error(f"Error getting user journey metrics: {str(e)}")
            return {
                "total_journeys": 0,
                "completed_tasks": 0,
                "completion_rate": 0,
                "avg_duration_sec": 0,
                "top_entry_pages": [],
                "top_exit_pages": [],
                "device_breakdown": []
            }
    
    @staticmethod
    async def get_ab_test_results(
        test_id: Optional[str] = None,
        feature_area: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Dict]:
        """Get A/B test results.
        
        Args:
            test_id: Filter by test ID
            feature_area: Filter by feature area
            status: Filter by status (active, paused, concluded)
            
        Returns:
            List of A/B test variants with results
        """
        filters = []
        
        if test_id:
            filters.append(UXABTestVariant.test_id == test_id)
        if feature_area:
            filters.append(UXABTestVariant.feature_area == feature_area)
        if status:
            filters.append(UXABTestVariant.status == status)
        
        try:
            with get_db() as session:
                stmt = select(UXABTestVariant)
                
                if filters:
                    stmt = stmt.where(and_(*filters))
                    
                stmt = stmt.order_by(UXABTestVariant.test_id, UXABTestVariant.name)
                
                result = session.execute(stmt)
                variants = result.scalars().all()
                
                # Convert to dictionaries
                return [
                    {
                        "id": variant.id,
                        "test_id": variant.test_id,
                        "name": variant.name,
                        "description": variant.description,
                        "feature_area": variant.feature_area,
                        "is_control": variant.is_control,
                        "start_date": variant.start_date.strftime("%Y-%m-%d"),
                        "end_date": variant.end_date.strftime("%Y-%m-%d") if variant.end_date else None,
                        "traffic_percentage": variant.traffic_percentage,
                        "user_segment": variant.user_segment,
                        "status": variant.status,
                        "winner": variant.winner,
                        "metrics": variant.metrics
                    }
                    for variant in variants
                ]
                
        except Exception as e:
            logger.error(f"Error getting A/B test results: {str(e)}")
            return []


# Create UX analytics service instance
ux_analytics_service = UXAnalyticsService()