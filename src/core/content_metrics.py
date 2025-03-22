"""
Content Metrics Service for tracking and analyzing content performance data

This module provides functionality for:
1. Storing and retrieving content performance metrics
2. Calculating engagement and conversion metrics
3. Generating content performance predictions
4. Creating and managing analytics reports and dashboards
"""

import asyncio
import json
from typing import Dict, List, Optional, Union, Any, Tuple
from datetime import datetime, timedelta, date
import pandas as pd
import numpy as np
from sqlalchemy import func, select, and_, desc, cast, extract, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy.sql import expression
from sqlalchemy.dialects.postgresql import insert, jsonb

from loguru import logger
from src.core.database import get_db
from src.models.system import (
    ContentMetric, ContentAttributionPath, CustomDashboard, 
    AnalyticsReport, ContentPredictionModel, ContentPerformancePrediction
)

# Lock for synchronizing operations
METRICS_UPDATE_LOCK = asyncio.Lock()

class ContentMetricsService:
    """Service for tracking and analyzing content performance metrics."""
    
    @staticmethod
    async def record_content_metric(
        content_id: int,
        date: datetime,
        platform: str,
        metrics: Dict[str, Union[int, float, Dict]]
    ) -> None:
        """Record content metrics for a specific date and platform.
        
        Args:
            content_id: ID of the content
            date: Date of the metrics
            platform: Platform where content was published (website, facebook, etc.)
            metrics: Dict containing metrics to record
        """
        try:
            # Normalize date to start of day
            normalized_date = date.replace(hour=0, minute=0, second=0, microsecond=0)
            
            with get_db() as session:
                # Check if a record for this content, date, and platform exists
                stmt = select(ContentMetric).where(
                    and_(
                        ContentMetric.content_id == content_id,
                        ContentMetric.date == normalized_date,
                        ContentMetric.platform == platform
                    )
                )
                result = session.execute(stmt)
                metric = result.scalars().first()
                
                if metric:
                    # Update existing record
                    for key, value in metrics.items():
                        if hasattr(metric, key):
                            setattr(metric, key, value)
                    metric.updated_at = datetime.utcnow()
                else:
                    # Create new record
                    metric_data = {
                        'content_id': content_id,
                        'date': normalized_date,
                        'platform': platform,
                        'updated_at': datetime.utcnow()
                    }
                    # Add metrics from the provided dict
                    for key, value in metrics.items():
                        if key not in metric_data and key != 'id':
                            metric_data[key] = value
                    
                    new_metric = ContentMetric(**metric_data)
                    session.add(new_metric)
                
                session.commit()
                
        except Exception as e:
            logger.error(f"Error recording content metric: {str(e)}")
    
    @staticmethod
    async def get_content_metrics(
        content_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        platform: Optional[str] = None,
        metrics: Optional[List[str]] = None
    ) -> List[Dict]:
        """Get content metrics for specified filters.
        
        Args:
            content_id: Optional content ID filter
            start_date: Optional start date filter
            end_date: Optional end date filter
            platform: Optional platform filter
            metrics: Optional list of specific metrics to return
            
        Returns:
            List of content metrics
        """
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=30)).date()
        if not end_date:
            end_date = datetime.utcnow().date()
            
        filters = [
            ContentMetric.date >= start_date,
            ContentMetric.date <= end_date
        ]
        
        if content_id:
            filters.append(ContentMetric.content_id == content_id)
            
        if platform:
            filters.append(ContentMetric.platform == platform)
            
        try:
            with get_db() as session:
                stmt = select(ContentMetric).where(
                    and_(*filters)
                ).order_by(ContentMetric.date, ContentMetric.platform)
                
                result = session.execute(stmt)
                metric_records = result.scalars().all()
                
                # Convert to dictionaries
                metrics_list = []
                for metric in metric_records:
                    metric_dict = {
                        'id': metric.id,
                        'content_id': metric.content_id,
                        'date': metric.date.strftime('%Y-%m-%d'),
                        'platform': metric.platform,
                        'views': metric.views,
                        'unique_visitors': metric.unique_visitors,
                        'likes': metric.likes,
                        'shares': metric.shares,
                        'comments': metric.comments,
                        'clicks': metric.clicks,
                        'click_through_rate': metric.click_through_rate,
                        'avg_time_on_page': metric.avg_time_on_page,
                        'bounce_rate': metric.bounce_rate,
                        'scroll_depth': metric.scroll_depth,
                        'conversions': metric.conversions,
                        'conversion_rate': metric.conversion_rate,
                        'leads_generated': metric.leads_generated,
                        'revenue_generated': metric.revenue_generated / 100,  # Convert cents to dollars
                        'serp_position': metric.serp_position,
                        'organic_traffic': metric.organic_traffic,
                        'backlinks': metric.backlinks,
                    }
                    
                    # Include raw data if available
                    if metric.demographics:
                        metric_dict['demographics'] = metric.demographics
                    if metric.sources:
                        metric_dict['sources'] = metric.sources
                    if metric.devices:
                        metric_dict['devices'] = metric.devices
                        
                    # Filter to only requested metrics if specified
                    if metrics:
                        metric_dict = {k: v for k, v in metric_dict.items() 
                                      if k in metrics or k in ['id', 'content_id', 'date', 'platform']}
                        
                    metrics_list.append(metric_dict)
                    
                return metrics_list
                
        except Exception as e:
            logger.error(f"Error getting content metrics: {str(e)}")
            return []
    
    @staticmethod
    async def get_content_performance_summary(
        content_ids: Optional[List[int]] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        group_by: Optional[str] = None  # none, daily, weekly, monthly
    ) -> Dict:
        """Get aggregated performance summary for content.
        
        Args:
            content_ids: Optional list of content IDs to filter
            start_date: Optional start date
            end_date: Optional end date
            group_by: Optional time grouping (daily, weekly, monthly)
            
        Returns:
            Dict with aggregated metrics
        """
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=30)).date()
        if not end_date:
            end_date = datetime.utcnow().date()
            
        filters = [
            ContentMetric.date >= start_date,
            ContentMetric.date <= end_date
        ]
        
        if content_ids:
            filters.append(ContentMetric.content_id.in_(content_ids))
            
        # Define grouping expression based on group_by parameter
        group_expr = None
        if group_by == 'daily':
            group_expr = ContentMetric.date
        elif group_by == 'weekly':
            # Group by week using date_trunc
            group_expr = func.date_trunc('week', ContentMetric.date).label('week')
        elif group_by == 'monthly':
            # Group by month using date_trunc
            group_expr = func.date_trunc('month', ContentMetric.date).label('month')
            
        try:
            with get_db() as session:
                # Different query based on whether we're grouping by time
                if group_by and group_expr:
                    stmt = select(
                        group_expr.label('period'),
                        func.sum(ContentMetric.views).label('total_views'),
                        func.sum(ContentMetric.unique_visitors).label('total_unique_visitors'),
                        func.sum(ContentMetric.likes).label('total_likes'),
                        func.sum(ContentMetric.shares).label('total_shares'),
                        func.sum(ContentMetric.comments).label('total_comments'),
                        func.sum(ContentMetric.clicks).label('total_clicks'),
                        func.avg(ContentMetric.click_through_rate).label('avg_ctr'),
                        func.avg(ContentMetric.avg_time_on_page).label('avg_time'),
                        func.avg(ContentMetric.bounce_rate).label('avg_bounce_rate'),
                        func.sum(ContentMetric.conversions).label('total_conversions'),
                        func.avg(ContentMetric.conversion_rate).label('avg_conversion_rate'),
                        func.sum(ContentMetric.revenue_generated).label('total_revenue')
                    ).where(
                        and_(*filters)
                    ).group_by(
                        group_expr
                    ).order_by(group_expr)
                    
                    result = session.execute(stmt)
                    time_series = []
                    
                    for row in result:
                        period = row.period.strftime('%Y-%m-%d') if row.period else None
                        time_series.append({
                            'period': period,
                            'views': row.total_views,
                            'unique_visitors': row.total_unique_visitors,
                            'likes': row.total_likes,
                            'shares': row.total_shares,
                            'comments': row.total_comments,
                            'clicks': row.total_clicks,
                            'click_through_rate': row.avg_ctr,
                            'avg_time_on_page': row.avg_time,
                            'bounce_rate': row.avg_bounce_rate,
                            'conversions': row.total_conversions,
                            'conversion_rate': row.avg_conversion_rate,
                            'revenue': row.total_revenue / 100  # Convert cents to dollars
                        })
                        
                    return {'time_series': time_series}
                
                else:
                    # Aggregate query without time grouping
                    stmt = select(
                        func.sum(ContentMetric.views).label('total_views'),
                        func.sum(ContentMetric.unique_visitors).label('total_unique_visitors'),
                        func.sum(ContentMetric.likes).label('total_likes'),
                        func.sum(ContentMetric.shares).label('total_shares'),
                        func.sum(ContentMetric.comments).label('total_comments'),
                        func.sum(ContentMetric.clicks).label('total_clicks'),
                        func.avg(ContentMetric.click_through_rate).label('avg_ctr'),
                        func.avg(ContentMetric.avg_time_on_page).label('avg_time'),
                        func.avg(ContentMetric.bounce_rate).label('avg_bounce_rate'),
                        func.sum(ContentMetric.conversions).label('total_conversions'),
                        func.avg(ContentMetric.conversion_rate).label('avg_conversion_rate'),
                        func.sum(ContentMetric.revenue_generated).label('total_revenue'),
                        func.count(ContentMetric.content_id.distinct()).label('content_count')
                    ).where(
                        and_(*filters)
                    )
                    
                    result = session.execute(stmt)
                    row = result.first()
                    
                    if row:
                        return {
                            'summary': {
                                'total_views': row.total_views or 0,
                                'total_unique_visitors': row.total_unique_visitors or 0,
                                'total_likes': row.total_likes or 0,
                                'total_shares': row.total_shares or 0,
                                'total_comments': row.total_comments or 0,
                                'total_clicks': row.total_clicks or 0,
                                'avg_click_through_rate': row.avg_ctr or 0,
                                'avg_time_on_page': row.avg_time or 0,
                                'avg_bounce_rate': row.avg_bounce_rate or 0,
                                'total_conversions': row.total_conversions or 0,
                                'avg_conversion_rate': row.avg_conversion_rate or 0,
                                'total_revenue': (row.total_revenue or 0) / 100,  # Convert cents to dollars
                                'content_count': row.content_count or 0
                            }
                        }
                    return {'summary': {}}
                
        except Exception as e:
            logger.error(f"Error getting content performance summary: {str(e)}")
            return {}
    
    @staticmethod
    async def get_top_performing_content(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        metric: str = 'views',  # views, conversions, revenue, etc.
        limit: int = 10,
        content_type: Optional[str] = None
    ) -> List[Dict]:
        """Get top performing content based on a specific metric.
        
        Args:
            start_date: Optional start date
            end_date: Optional end date
            metric: Metric to rank by
            limit: Maximum number of results
            content_type: Optional content type filter
            
        Returns:
            List of top performing content
        """
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=30)).date()
        if not end_date:
            end_date = datetime.utcnow().date()
            
        # Valid metrics for ranking
        valid_metrics = {
            'views': func.sum(ContentMetric.views),
            'unique_visitors': func.sum(ContentMetric.unique_visitors),
            'engagement': func.sum(ContentMetric.likes + ContentMetric.shares + ContentMetric.comments),
            'clicks': func.sum(ContentMetric.clicks),
            'ctr': func.avg(ContentMetric.click_through_rate),
            'time_on_page': func.avg(ContentMetric.avg_time_on_page),
            'bounce_rate': func.avg(ContentMetric.bounce_rate),
            'conversions': func.sum(ContentMetric.conversions),
            'conversion_rate': func.avg(ContentMetric.conversion_rate),
            'revenue': func.sum(ContentMetric.revenue_generated)
        }
        
        # Use views as default if invalid metric provided
        if metric not in valid_metrics:
            metric = 'views'
            
        # Special sort order for metrics where lower is better
        reverse_sort = metric in ['bounce_rate']
            
        try:
            with get_db() as session:
                # Build query to get top content
                stmt = select(
                    ContentMetric.content_id,
                    valid_metrics[metric].label('metric_value'),
                    func.sum(ContentMetric.views).label('total_views'),
                    func.sum(ContentMetric.conversions).label('total_conversions'),
                    func.sum(ContentMetric.revenue_generated).label('total_revenue')
                ).where(
                    and_(
                        ContentMetric.date >= start_date,
                        ContentMetric.date <= end_date
                    )
                ).group_by(
                    ContentMetric.content_id
                ).order_by(
                    desc('metric_value') if not reverse_sort else 'metric_value'
                ).limit(limit)
                
                result = session.execute(stmt)
                top_content = []
                
                for row in result:
                    # You would normally join with content table 
                    # to get title, type, etc., but using placeholder for now
                    top_content.append({
                        'content_id': row.content_id,
                        f'{metric}_value': row.metric_value,
                        'views': row.total_views,
                        'conversions': row.total_conversions,
                        'revenue': row.total_revenue / 100,  # Convert cents to dollars
                    })
                    
                return top_content
                
        except Exception as e:
            logger.error(f"Error getting top performing content: {str(e)}")
            return []
    
    @staticmethod
    async def get_content_comparison(
        content_ids: List[int],
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        metrics: Optional[List[str]] = None
    ) -> Dict:
        """Compare performance metrics for specified content.
        
        Args:
            content_ids: List of content IDs to compare
            start_date: Optional start date
            end_date: Optional end date
            metrics: Optional list of metrics to compare
            
        Returns:
            Dict with comparison data
        """
        if not content_ids:
            return {'comparison': []}
            
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=30)).date()
        if not end_date:
            end_date = datetime.utcnow().date()
            
        # Default metrics if not specified
        if not metrics:
            metrics = ['views', 'unique_visitors', 'likes', 'shares', 'comments', 
                      'clicks', 'click_through_rate', 'conversions', 'conversion_rate', 'revenue_generated']
            
        try:
            with get_db() as session:
                comparison_data = []
                
                for content_id in content_ids:
                    # Get metrics for this content
                    stmt = select(
                        func.sum(ContentMetric.views).label('total_views'),
                        func.sum(ContentMetric.unique_visitors).label('total_unique_visitors'),
                        func.sum(ContentMetric.likes).label('total_likes'),
                        func.sum(ContentMetric.shares).label('total_shares'),
                        func.sum(ContentMetric.comments).label('total_comments'),
                        func.sum(ContentMetric.clicks).label('total_clicks'),
                        func.avg(ContentMetric.click_through_rate).label('avg_ctr'),
                        func.avg(ContentMetric.avg_time_on_page).label('avg_time'),
                        func.avg(ContentMetric.bounce_rate).label('avg_bounce_rate'),
                        func.sum(ContentMetric.conversions).label('total_conversions'),
                        func.avg(ContentMetric.conversion_rate).label('avg_conversion_rate'),
                        func.sum(ContentMetric.revenue_generated).label('total_revenue')
                    ).where(
                        and_(
                            ContentMetric.content_id == content_id,
                            ContentMetric.date >= start_date,
                            ContentMetric.date <= end_date
                        )
                    )
                    
                    result = session.execute(stmt)
                    row = result.first()
                    
                    if row:
                        content_data = {
                            'content_id': content_id,
                            'metrics': {
                                'views': row.total_views or 0,
                                'unique_visitors': row.total_unique_visitors or 0,
                                'likes': row.total_likes or 0,
                                'shares': row.total_shares or 0,
                                'comments': row.total_comments or 0,
                                'clicks': row.total_clicks or 0,
                                'click_through_rate': row.avg_ctr or 0,
                                'avg_time_on_page': row.avg_time or 0,
                                'bounce_rate': row.avg_bounce_rate or 0,
                                'conversions': row.total_conversions or 0,
                                'conversion_rate': row.avg_conversion_rate or 0,
                                'revenue': (row.total_revenue or 0) / 100  # Convert cents to dollars
                            }
                        }
                        
                        # Filter to only requested metrics
                        if metrics:
                            content_data['metrics'] = {k: v for k, v in content_data['metrics'].items() if k in metrics}
                            
                        comparison_data.append(content_data)
                    
                return {'comparison': comparison_data}
                
        except Exception as e:
            logger.error(f"Error getting content comparison: {str(e)}")
            return {'comparison': []}
    
    @staticmethod
    async def get_content_attribution(
        content_id: Optional[int] = None, 
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        attribution_model: str = 'last_touch'  # first_touch, last_touch, linear, position_based
    ) -> Dict:
        """Get attribution data for content conversions.
        
        Args:
            content_id: Optional content ID filter
            start_date: Optional start date
            end_date: Optional end date
            attribution_model: Attribution model to use
            
        Returns:
            Dict with attribution data
        """
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=30)).date()
        if not end_date:
            end_date = datetime.utcnow().date()
            
        filters = [
            ContentAttributionPath.conversion_date >= start_date,
            ContentAttributionPath.conversion_date <= end_date
        ]
        
        if content_id:
            # Find paths that include this content ID
            filters.append(
                or_(
                    ContentAttributionPath.first_touch_content_id == content_id,
                    ContentAttributionPath.last_touch_content_id == content_id,
                    ContentAttributionPath.path.op('?')('$.*.content_id').cast(Integer) == content_id
                )
            )
            
        try:
            with get_db() as session:
                # Get attribution paths
                stmt = select(ContentAttributionPath).where(
                    and_(*filters)
                ).order_by(desc(ContentAttributionPath.conversion_date))
                
                result = session.execute(stmt)
                paths = result.scalars().all()
                
                # Process paths based on attribution model
                attribution_data = {
                    'model': attribution_model,
                    'total_conversions': len(paths),
                    'total_value': sum(path.conversion_value for path in paths) / 100,  # Convert cents to dollars
                    'content_attribution': {}
                }
                
                for path in paths:
                    # Calculate attribution based on model
                    if attribution_model == 'first_touch' and path.first_touch_content_id:
                        content_id = path.first_touch_content_id
                        attribution_value = path.conversion_value
                    elif attribution_model == 'last_touch' and path.last_touch_content_id:
                        content_id = path.last_touch_content_id
                        attribution_value = path.conversion_value
                    elif attribution_model == 'linear' and path.path:
                        # Equal attribution across all touchpoints
                        touchpoints = path.path
                        attribution_share = path.conversion_value / len(touchpoints)
                        
                        for point in touchpoints:
                            point_content_id = point.get('content_id')
                            if point_content_id:
                                if point_content_id not in attribution_data['content_attribution']:
                                    attribution_data['content_attribution'][point_content_id] = {
                                        'attributed_conversions': 0,
                                        'attributed_value': 0
                                    }
                                attribution_data['content_attribution'][point_content_id]['attributed_conversions'] += 1 / len(touchpoints)
                                attribution_data['content_attribution'][point_content_id]['attributed_value'] += attribution_share
                        
                        # Skip the rest of the loop since we've handled linear attribution
                        continue
                    elif attribution_model == 'position_based' and path.path:
                        # 40% to first, 40% to last, 20% distributed to middle
                        touchpoints = path.path
                        if len(touchpoints) <= 2:
                            # With only 1-2 touchpoints, split equally
                            attribution_share = path.conversion_value / len(touchpoints)
                            weight = 1.0 / len(touchpoints)
                        else:
                            # Apply position-based weights
                            first_last_share = 0.4 * path.conversion_value
                            middle_total_share = 0.2 * path.conversion_value
                            middle_share = middle_total_share / (len(touchpoints) - 2) if len(touchpoints) > 2 else 0
                            
                            for idx, point in enumerate(touchpoints):
                                point_content_id = point.get('content_id')
                                if point_content_id:
                                    if point_content_id not in attribution_data['content_attribution']:
                                        attribution_data['content_attribution'][point_content_id] = {
                                            'attributed_conversions': 0,
                                            'attributed_value': 0
                                        }
                                    
                                    # Apply appropriate weight based on position
                                    if idx == 0:  # First touch
                                        attribution_data['content_attribution'][point_content_id]['attributed_conversions'] += 0.4
                                        attribution_data['content_attribution'][point_content_id]['attributed_value'] += first_last_share
                                    elif idx == len(touchpoints) - 1:  # Last touch
                                        attribution_data['content_attribution'][point_content_id]['attributed_conversions'] += 0.4
                                        attribution_data['content_attribution'][point_content_id]['attributed_value'] += first_last_share
                                    else:  # Middle touch
                                        middle_weight = 0.2 / (len(touchpoints) - 2)
                                        attribution_data['content_attribution'][point_content_id]['attributed_conversions'] += middle_weight
                                        attribution_data['content_attribution'][point_content_id]['attributed_value'] += middle_share
                            
                            # Skip the rest of the loop since we've handled position-based attribution
                            continue
                    else:
                        # Fall back to last touch if model not supported or no data
                        content_id = path.last_touch_content_id
                        attribution_value = path.conversion_value if content_id else 0
                    
                    # Add to attribution data for simple models (first/last touch)
                    if content_id:
                        if content_id not in attribution_data['content_attribution']:
                            attribution_data['content_attribution'][content_id] = {
                                'attributed_conversions': 0,
                                'attributed_value': 0
                            }
                        attribution_data['content_attribution'][content_id]['attributed_conversions'] += 1
                        attribution_data['content_attribution'][content_id]['attributed_value'] += attribution_value
                
                # Convert cents to dollars for all content attribution values
                for content_id in attribution_data['content_attribution']:
                    attribution_data['content_attribution'][content_id]['attributed_value'] /= 100
                
                # Convert dict to list for easier consumption
                attribution_list = []
                for content_id, data in attribution_data['content_attribution'].items():
                    attribution_list.append({
                        'content_id': content_id,
                        'attributed_conversions': data['attributed_conversions'],
                        'attributed_value': data['attributed_value']
                    })
                
                # Sort by attributed value descending
                attribution_list.sort(key=lambda x: x['attributed_value'], reverse=True)
                attribution_data['content_attribution'] = attribution_list
                
                return attribution_data
                
        except Exception as e:
            logger.error(f"Error getting content attribution: {str(e)}")
            return {
                'model': attribution_model,
                'total_conversions': 0,
                'total_value': 0,
                'content_attribution': []
            }
    
    @staticmethod
    async def create_custom_dashboard(
        user_id: int,
        name: str,
        description: Optional[str] = None,
        layout: Dict = None,
        widgets: List[Dict] = None,
        is_default: bool = False,
        role_id: Optional[int] = None
    ) -> Dict:
        """Create a new custom dashboard.
        
        Args:
            user_id: User ID
            name: Dashboard name
            description: Optional dashboard description
            layout: Dashboard layout configuration
            widgets: List of widget configurations
            is_default: Whether this is the default dashboard for the user
            role_id: Optional role ID for role-specific dashboards
            
        Returns:
            Dict with created dashboard data
        """
        try:
            # Provide default layout and widgets if not provided
            if layout is None:
                layout = {"columns": 12, "rowHeight": 50, "compactType": "vertical"}
                
            if widgets is None:
                widgets = []
                
            with get_db() as session:
                # If setting as default, unset any existing defaults for this user
                if is_default:
                    update_stmt = update(CustomDashboard).where(
                        and_(
                            CustomDashboard.user_id == user_id,
                            CustomDashboard.is_default == True
                        )
                    ).values(is_default=False)
                    session.execute(update_stmt)
                
                # Create new dashboard
                dashboard = CustomDashboard(
                    user_id=user_id,
                    name=name,
                    description=description,
                    layout=layout,
                    widgets=widgets,
                    is_default=is_default,
                    role_id=role_id,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                session.add(dashboard)
                session.commit()
                session.refresh(dashboard)
                
                return {
                    'id': dashboard.id,
                    'user_id': dashboard.user_id,
                    'name': dashboard.name,
                    'description': dashboard.description,
                    'layout': dashboard.layout,
                    'widgets': dashboard.widgets,
                    'is_default': dashboard.is_default,
                    'role_id': dashboard.role_id,
                    'created_at': dashboard.created_at.isoformat() if dashboard.created_at else None
                }
                
        except Exception as e:
            logger.error(f"Error creating custom dashboard: {str(e)}")
            return {}
    
    @staticmethod
    async def get_custom_dashboards(
        user_id: int,
        dashboard_id: Optional[int] = None,
        include_role_dashboards: bool = True
    ) -> List[Dict]:
        """Get custom dashboards for a user.
        
        Args:
            user_id: User ID
            dashboard_id: Optional dashboard ID to get a specific dashboard
            include_role_dashboards: Whether to include dashboards assigned to user's roles
            
        Returns:
            List of dashboard configurations
        """
        try:
            with get_db() as session:
                filters = []
                
                if dashboard_id:
                    # Get specific dashboard
                    filters.append(CustomDashboard.id == dashboard_id)
                else:
                    # Get user's dashboards
                    filters.append(CustomDashboard.user_id == user_id)
                    
                    # Include role dashboards if requested
                    if include_role_dashboards:
                        # Get user's roles
                        roles_query = select(user_roles.c.role_id).where(
                            user_roles.c.user_id == user_id
                        )
                        role_result = session.execute(roles_query)
                        role_ids = [row[0] for row in role_result]
                        
                        if role_ids:
                            filters = [
                                or_(
                                    CustomDashboard.user_id == user_id,
                                    CustomDashboard.role_id.in_(role_ids)
                                )
                            ]
                
                stmt = select(CustomDashboard).where(
                    and_(*filters)
                ).order_by(
                    desc(CustomDashboard.is_default),
                    CustomDashboard.name
                )
                
                result = session.execute(stmt)
                dashboards = result.scalars().all()
                
                # Convert to list of dicts
                dashboard_list = []
                for dashboard in dashboards:
                    dashboard_list.append({
                        'id': dashboard.id,
                        'user_id': dashboard.user_id,
                        'name': dashboard.name,
                        'description': dashboard.description,
                        'layout': dashboard.layout,
                        'widgets': dashboard.widgets,
                        'is_default': dashboard.is_default,
                        'role_id': dashboard.role_id,
                        'created_at': dashboard.created_at.isoformat() if dashboard.created_at else None,
                        'updated_at': dashboard.updated_at.isoformat() if dashboard.updated_at else None
                    })
                
                return dashboard_list
                
        except Exception as e:
            logger.error(f"Error getting custom dashboards: {str(e)}")
            return []
    
    @staticmethod
    async def update_custom_dashboard(
        dashboard_id: int,
        user_id: int,
        updates: Dict
    ) -> Dict:
        """Update a custom dashboard.
        
        Args:
            dashboard_id: Dashboard ID
            user_id: User ID (for authorization)
            updates: Dict of fields to update
            
        Returns:
            Dict with updated dashboard data
        """
        try:
            with get_db() as session:
                # Get dashboard
                stmt = select(CustomDashboard).where(
                    and_(
                        CustomDashboard.id == dashboard_id,
                        CustomDashboard.user_id == user_id
                    )
                )
                result = session.execute(stmt)
                dashboard = result.scalars().first()
                
                if not dashboard:
                    return {'error': 'Dashboard not found or access denied'}
                
                # Handle setting as default
                if updates.get('is_default'):
                    # Unset any existing defaults for this user
                    update_stmt = update(CustomDashboard).where(
                        and_(
                            CustomDashboard.user_id == user_id,
                            CustomDashboard.is_default == True,
                            CustomDashboard.id != dashboard_id
                        )
                    ).values(is_default=False)
                    session.execute(update_stmt)
                
                # Update allowed fields
                allowed_fields = ['name', 'description', 'layout', 'widgets', 'is_default', 'role_id']
                for field in allowed_fields:
                    if field in updates:
                        setattr(dashboard, field, updates[field])
                
                dashboard.updated_at = datetime.utcnow()
                session.commit()
                session.refresh(dashboard)
                
                return {
                    'id': dashboard.id,
                    'user_id': dashboard.user_id,
                    'name': dashboard.name,
                    'description': dashboard.description,
                    'layout': dashboard.layout,
                    'widgets': dashboard.widgets,
                    'is_default': dashboard.is_default,
                    'role_id': dashboard.role_id,
                    'created_at': dashboard.created_at.isoformat() if dashboard.created_at else None,
                    'updated_at': dashboard.updated_at.isoformat() if dashboard.updated_at else None
                }
                
        except Exception as e:
            logger.error(f"Error updating custom dashboard: {str(e)}")
            return {'error': str(e)}
    
    @staticmethod
    async def create_analytics_report(
        user_id: int,
        name: str,
        report_type: str,
        config: Dict,
        description: Optional[str] = None,
        template_id: Optional[str] = None,
        schedule_type: Optional[str] = None,
        schedule_config: Optional[Dict] = None,
        recipients: Optional[List[str]] = None
    ) -> Dict:
        """Create a new analytics report.
        
        Args:
            user_id: User ID creating the report
            name: Report name
            report_type: Type of report
            config: Report configuration
            description: Optional report description
            template_id: Optional template identifier
            schedule_type: Optional scheduling type (none, daily, weekly, monthly)
            schedule_config: Optional scheduling configuration
            recipients: Optional list of email recipients
            
        Returns:
            Dict with created report data
        """
        try:
            with get_db() as session:
                report = AnalyticsReport(
                    name=name,
                    description=description,
                    created_by=user_id,
                    report_type=report_type,
                    template_id=template_id,
                    config=config,
                    schedule_type=schedule_type,
                    schedule_config=schedule_config,
                    recipients=recipients,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                session.add(report)
                session.commit()
                session.refresh(report)
                
                return {
                    'id': report.id,
                    'name': report.name,
                    'description': report.description,
                    'created_by': report.created_by,
                    'report_type': report.report_type,
                    'template_id': report.template_id,
                    'config': report.config,
                    'schedule_type': report.schedule_type,
                    'schedule_config': report.schedule_config,
                    'recipients': report.recipients,
                    'last_generated': report.last_generated.isoformat() if report.last_generated else None,
                    'file_path': report.file_path,
                    'file_type': report.file_type,
                    'created_at': report.created_at.isoformat() if report.created_at else None
                }
                
        except Exception as e:
            logger.error(f"Error creating analytics report: {str(e)}")
            return {'error': str(e)}
    
    @staticmethod
    async def get_analytics_reports(
        user_id: int,
        report_id: Optional[int] = None,
        report_type: Optional[str] = None
    ) -> List[Dict]:
        """Get analytics reports for a user.
        
        Args:
            user_id: User ID
            report_id: Optional report ID to get a specific report
            report_type: Optional report type filter
            
        Returns:
            List of reports
        """
        try:
            with get_db() as session:
                filters = [AnalyticsReport.created_by == user_id]
                
                if report_id:
                    filters.append(AnalyticsReport.id == report_id)
                    
                if report_type:
                    filters.append(AnalyticsReport.report_type == report_type)
                    
                stmt = select(AnalyticsReport).where(
                    and_(*filters)
                ).order_by(
                    AnalyticsReport.name
                )
                
                result = session.execute(stmt)
                reports = result.scalars().all()
                
                # Convert to list of dicts
                report_list = []
                for report in reports:
                    report_list.append({
                        'id': report.id,
                        'name': report.name,
                        'description': report.description,
                        'created_by': report.created_by,
                        'report_type': report.report_type,
                        'template_id': report.template_id,
                        'config': report.config,
                        'schedule_type': report.schedule_type,
                        'schedule_config': report.schedule_config,
                        'recipients': report.recipients,
                        'last_generated': report.last_generated.isoformat() if report.last_generated else None,
                        'file_path': report.file_path,
                        'file_type': report.file_type,
                        'created_at': report.created_at.isoformat() if report.created_at else None,
                        'updated_at': report.updated_at.isoformat() if report.updated_at else None
                    })
                
                return report_list
                
        except Exception as e:
            logger.error(f"Error getting analytics reports: {str(e)}")
            return []
    
    @staticmethod
    async def predict_content_performance(
        content_id: int,
        content_data: Dict,
        target_metric: str = 'views',
        prediction_horizon: int = 30  # days
    ) -> Dict:
        """Predict future performance for content.
        
        Args:
            content_id: Content ID
            content_data: Content metadata and features
            target_metric: Target metric to predict
            prediction_horizon: Number of days to predict into the future
            
        Returns:
            Dict with prediction results
        """
        try:
            # Ensure content_id is included in content_data
            content_data['content_id'] = content_id
            
            # Import here to avoid circular imports
            from src.core.content_prediction_models import content_prediction_service
            
            # Find the most appropriate prediction model for this metric
            model = await content_prediction_service.get_model_by_metric(target_metric)
            
            if not model:
                return {
                    'error': f'No prediction model available for {target_metric}'
                }
            
            # Generate prediction using the model
            prediction_result = await content_prediction_service.predict(
                model_id=model['id'],
                content_data=content_data,
                prediction_horizon=prediction_horizon
            )
            
            return prediction_result
                
        except Exception as e:
            logger.error(f"Error predicting content performance: {str(e)}")
            return {'error': str(e)}

# Create metrics service instance
content_metrics_service = ContentMetricsService()