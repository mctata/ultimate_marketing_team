"""
Simple health check endpoint for monitoring system status.
Optimized for reduced dependencies and performance.
"""

from fastapi import APIRouter
from typing import Dict, Any
import time

from src.core.settings import settings
from src.core.logging import get_logger, log_health_check

logger = get_logger(component="health")

router = APIRouter()

@router.get("/")
async def health_check() -> Dict[str, Any]:
    """
    Simple health check endpoint optimized for performance.
    """
    status_data = {
        "status": "healthy",
        "timestamp": time.time(),
        "version": settings.APP_VERSION,
        "environment": settings.ENV
    }
    
    # Log the health check
    log_health_check(
        component="api",
        status="healthy",
        details={"endpoint": "/api/health"}
    )
    
    return status_data

@router.get("/liveness")
async def liveness_probe() -> Dict[str, str]:
    """
    Kubernetes liveness probe endpoint.
    Simple check that the service is running and can respond to requests.
    """
    return {"status": "alive"}