"""
Budget Monitoring Service

This module provides functionality to monitor AI API usage and send alerts
when approaching budget thresholds.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from loguru import logger

from src.core.api_metrics import metrics_service
from src.core.settings import settings
from src.models.system import Notification, User

alert_cooldown = {}  # Track when alerts were last sent


async def check_budget_thresholds():
    """Check if usage is approaching budget thresholds and send alerts if needed."""
    try:
        # Get current budget status
        budget_status = await metrics_service.get_budget_status()
        
        for provider, status in budget_status.items():
            # Check if we're approaching the budget
            warning_threshold = 0.8  # 80% of budget
            critical_threshold = 0.95  # 95% of budget
            
            budget_percent = status['budget_percent'] / 100
            projected_percent = status['projected_percent'] / 100
            
            # Initialize alert level
            alert_level = None
            message = None
            
            # Check for critical threshold (current spend)
            if budget_percent >= critical_threshold:
                alert_level = "critical"
                message = (
                    f"{provider.upper()} API CRITICAL: {status['budget_percent']:.1f}% of monthly "
                    f"budget (${status['monthly_budget']:.2f}) has been used. "
                    f"Current spend: ${status['current_spend']:.2f}"
                )
            # Check for warning threshold (current spend)
            elif budget_percent >= warning_threshold:
                alert_level = "warning"
                message = (
                    f"{provider.upper()} API WARNING: {status['budget_percent']:.1f}% of monthly "
                    f"budget (${status['monthly_budget']:.2f}) has been used. "
                    f"Current spend: ${status['current_spend']:.2f}"
                )
            # Check for projected overage
            elif projected_percent >= 1.0 and status['warning_level'] == 'high':
                alert_level = "warning"
                message = (
                    f"{provider.upper()} API WARNING: At current usage rates, you are projected "
                    f"to exceed your monthly budget of ${status['monthly_budget']:.2f}. "
                    f"Projected end-of-month cost: ${status['projected_month_end']:.2f}"
                )
            
            # Send alert if threshold exceeded and cooldown period has passed
            if alert_level and should_send_alert(provider, alert_level):
                await send_budget_alert(provider, message, alert_level)
                update_alert_cooldown(provider, alert_level)
    
    except Exception as e:
        logger.error(f"Error checking budget thresholds: {str(e)}")


def should_send_alert(provider: str, level: str) -> bool:
    """Check if an alert should be sent based on cooldown periods.
    
    Args:
        provider: API provider
        level: Alert level (warning, critical)
        
    Returns:
        Whether the alert should be sent
    """
    now = datetime.utcnow()
    key = f"{provider}_{level}"
    
    # Get cooldown periods in hours
    cooldown_periods = {
        "warning": 24,  # 24 hours for warnings
        "critical": 6,  # 6 hours for critical alerts
    }
    
    # Check if we're in the cooldown period
    if key in alert_cooldown:
        last_sent = alert_cooldown[key]
        cooldown = cooldown_periods.get(level, 24)
        if now < last_sent + timedelta(hours=cooldown):
            return False
    
    return True


def update_alert_cooldown(provider: str, level: str) -> None:
    """Update the alert cooldown timestamp.
    
    Args:
        provider: API provider
        level: Alert level (warning, critical)
    """
    key = f"{provider}_{level}"
    alert_cooldown[key] = datetime.utcnow()


async def send_budget_alert(provider: str, message: str, level: str) -> None:
    """Send a budget alert notification.
    
    Args:
        provider: API provider
        message: Alert message
        level: Alert level (warning, critical)
    """
    try:
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy.future import select
        from src.core.database import get_session
        
        # Create a notification for all admin users
        async with get_session() as session:
            # Find admin users
            result = await session.execute(
                select(User).where(User.is_superuser == True)
            )
            admin_users = result.scalars().all()
            
            # Create notifications
            for user in admin_users:
                notification = Notification(
                    user_id=user.id,
                    title=f"AI Budget {level.upper()} - {provider.upper()}",
                    message=message,
                    is_read=False,
                    notification_type="system",
                    related_entity_type="ai_budget",
                    created_at=datetime.utcnow()
                )
                session.add(notification)
            
            await session.commit()
            
            logger.warning(f"Budget alert sent: {message}")
    
    except Exception as e:
        logger.error(f"Error sending budget alert: {str(e)}")


async def check_rate_limit_adjustments() -> None:
    """Check if there are any adaptive rate limit adjustments and log them."""
    try:
        # Add code to check rate limit adjustments
        pass
    except Exception as e:
        logger.error(f"Error checking rate limit adjustments: {str(e)}")


async def budget_monitor_task():
    """Background task to monitor budget and usage."""
    while True:
        try:
            # Check budget thresholds
            await check_budget_thresholds()
            
            # Check rate limit adjustments
            await check_rate_limit_adjustments()
            
            # Run once per hour
            await asyncio.sleep(3600)
        except Exception as e:
            logger.error(f"Error in budget monitor task: {str(e)}")
            await asyncio.sleep(3600)  # Sleep even if there's an error


async def start_budget_monitor():
    """Start the budget monitoring background task."""
    asyncio.create_task(budget_monitor_task())
    logger.info("Budget monitoring service started")