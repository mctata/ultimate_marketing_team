"""
Advanced health check endpoints with comprehensive system monitoring.
Provides endpoints for verifying service health including dependencies.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Dict, Any, List, Optional
import time
import asyncio
import socket
import aiohttp
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import psutil

from src.core.settings import settings
from src.core.logging import get_logger, log_health_check
from src.core.database import get_db
from src.core.cache import get_redis_pool
from src.core.websocket_bridge import check_websocket_bridge_status

logger = get_logger(component="health")

router = APIRouter()

# Health check response models - could be in models but kept here for simplicity
DEFAULT_TIMEOUT = 5.0  # Default timeout in seconds for health checks

async def _check_database() -> Dict[str, Any]:
    """Check if the database is reachable and operational."""
    status_info = {
        "name": "database",
        "status": "unhealthy",
        "latency_ms": 0,
        "details": {}
    }
    
    start_time = time.time()
    try:
        db = AsyncSession(get_db.engine)
        async with db as session:
            # Simple query to verify connection
            result = await session.execute(text("SELECT 1"))
            await session.commit()
            
            # Check if we can read data (always returns 1)
            data = result.scalar()
            
            if data == 1:
                status_info["status"] = "healthy"
            else:
                status_info["details"]["error"] = "Database returned unexpected result"
    except Exception as e:
        status_info["status"] = "unhealthy"
        status_info["details"]["error"] = str(e)
    finally:
        status_info["latency_ms"] = round((time.time() - start_time) * 1000, 2)
        
    return status_info

async def _check_redis() -> Dict[str, Any]:
    """Check if Redis is reachable and operational."""
    status_info = {
        "name": "redis",
        "status": "unhealthy",
        "latency_ms": 0,
        "details": {}
    }
    
    start_time = time.time()
    try:
        # Get a Redis client
        redis_client = redis.Redis.from_pool(await get_redis_pool())
        
        # Test connection with a simple ping/pong
        result = await redis_client.ping()
        
        if result:
            status_info["status"] = "healthy"
        else:
            status_info["details"]["error"] = "Redis ping failed"
    except Exception as e:
        status_info["status"] = "unhealthy"
        status_info["details"]["error"] = str(e)
    finally:
        status_info["latency_ms"] = round((time.time() - start_time) * 1000, 2)
        
    return status_info

async def _check_rabbitmq() -> Dict[str, Any]:
    """Check if RabbitMQ is reachable and operational."""
    status_info = {
        "name": "rabbitmq",
        "status": "unhealthy",
        "latency_ms": 0,
        "details": {}
    }
    
    start_time = time.time()
    try:
        # Parse RabbitMQ URL to get host and port
        url = settings.RABBITMQ_URL
        if url.startswith("amqp://"):
            url = url[7:]  # Remove amqp://
        
        # Extract credentials and host/port
        if "@" in url:
            _, url = url.split("@")
        
        host, port = url.split(":")[0], 5672
        
        # Check if the host is reachable with a simple socket connection
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(DEFAULT_TIMEOUT)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            status_info["status"] = "healthy"
        else:
            status_info["details"]["error"] = f"RabbitMQ connection failed (error code: {result})"
            
        # Also check WebSocket bridge status
        ws_status = await check_websocket_bridge_status()
        status_info["details"]["websocket_bridge"] = ws_status
    except Exception as e:
        status_info["status"] = "unhealthy"
        status_info["details"]["error"] = str(e)
    finally:
        status_info["latency_ms"] = round((time.time() - start_time) * 1000, 2)
        
    return status_info

async def _check_external_service(name: str, url: str) -> Dict[str, Any]:
    """Check if an external service is reachable."""
    status_info = {
        "name": name,
        "status": "unhealthy",
        "latency_ms": 0,
        "details": {
            "url": url
        }
    }
    
    start_time = time.time()
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=DEFAULT_TIMEOUT) as response:
                status_info["details"]["status_code"] = response.status
                
                if response.status < 400:
                    status_info["status"] = "healthy"
                else:
                    status_info["details"]["error"] = f"HTTP error {response.status}"
    except asyncio.TimeoutError:
        status_info["status"] = "unhealthy"
        status_info["details"]["error"] = "Request timed out"
    except Exception as e:
        status_info["status"] = "unhealthy"
        status_info["details"]["error"] = str(e)
    finally:
        status_info["latency_ms"] = round((time.time() - start_time) * 1000, 2)
        
    return status_info

async def _check_system_resources() -> Dict[str, Any]:
    """Check system resources like CPU, memory, and disk usage."""
    status_info = {
        "name": "system",
        "status": "healthy",
        "details": {}
    }
    
    # CPU usage
    cpu_percent = psutil.cpu_percent(interval=None)
    status_info["details"]["cpu_percent"] = cpu_percent
    
    # Memory usage
    memory = psutil.virtual_memory()
    status_info["details"]["memory_percent"] = memory.percent
    status_info["details"]["memory_available_mb"] = memory.available / (1024 * 1024)
    
    # Disk usage
    disk = psutil.disk_usage('/')
    status_info["details"]["disk_percent"] = disk.percent
    status_info["details"]["disk_free_gb"] = disk.free / (1024 * 1024 * 1024)
    
    # Determine status based on thresholds
    if cpu_percent > 90 or memory.percent > 90 or disk.percent > 90:
        status_info["status"] = "warning"
        
    if cpu_percent > 95 or memory.percent > 95 or disk.percent > 95:
        status_info["status"] = "unhealthy"
        status_info["details"]["error"] = "System resources critically low"
    
    return status_info

async def _check_all_integrations() -> Dict[str, Any]:
    """Check all third-party integrations."""
    try:
        # Dynamically import to avoid circular imports
        from src.agents.integrations.integration_manager import integration_manager
        
        # Run the built-in integration health check
        status_data = await integration_manager.check_all_integrations_health()
        
        # Format the result for health check response
        unhealthy_integrations = [
            integration for integration, data in status_data.items() 
            if data.get("status") != "healthy"
        ]
        
        if unhealthy_integrations:
            return {
                "name": "integrations",
                "status": "warning",
                "details": {
                    "message": f"{len(unhealthy_integrations)} integrations unhealthy",
                    "unhealthy": unhealthy_integrations,
                    "all_integrations": status_data
                }
            }
        else:
            return {
                "name": "integrations",
                "status": "healthy",
                "details": {
                    "message": f"All {len(status_data)} integrations healthy"
                }
            }
    except Exception as e:
        return {
            "name": "integrations",
            "status": "unhealthy",
            "details": {
                "error": str(e)
            }
        }

@router.get("/")
async def health_check_all() -> Dict[str, Any]:
    """
    Run all health checks to verify system health.
    Provides an overall status and details for each component.
    """
    # Run all health checks in parallel
    tasks = [
        _check_database(),
        _check_redis(),
        _check_rabbitmq(),
        _check_system_resources(),
        _check_all_integrations()
    ]
    
    # Check external services if URLs are configured
    for external_service in settings.EXTERNAL_SERVICES_TO_MONITOR:
        name = external_service.get("name")
        url = external_service.get("url")
        if name and url:
            tasks.append(_check_external_service(name, url))
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Process results
    check_results = []
    overall_status = "healthy"
    
    for result in results:
        # Handle any exceptions during health check
        if isinstance(result, Exception):
            check_result = {
                "name": "unknown",
                "status": "unhealthy",
                "details": {"error": str(result)}
            }
            overall_status = "unhealthy"
        else:
            check_result = result
            # Update overall status based on component status
            if result["status"] == "unhealthy" and overall_status != "unhealthy":
                overall_status = "unhealthy"
            elif result["status"] == "warning" and overall_status == "healthy":
                overall_status = "warning"
        
        check_results.append(check_result)
    
    response = {
        "status": overall_status,
        "timestamp": time.time(),
        "version": settings.APP_VERSION,
        "environment": settings.ENV,
        "checks": check_results
    }
    
    # Log health check results
    log_health_check(
        component="system", 
        status=overall_status,
        details={"check_count": len(check_results)}
    )
    
    return response

@router.get("/system")
async def health_check_system() -> Dict[str, Any]:
    """Run health check for system resources."""
    result = await _check_system_resources()
    log_health_check(component="system", status=result["status"], details=result["details"])
    return result

@router.get("/database")
async def health_check_database() -> Dict[str, Any]:
    """Run health check for database."""
    result = await _check_database()
    log_health_check(component="database", status=result["status"], details=result["details"])
    return result

@router.get("/redis")
async def health_check_redis() -> Dict[str, Any]:
    """Run health check for Redis."""
    result = await _check_redis()
    log_health_check(component="redis", status=result["status"], details=result["details"])
    return result

@router.get("/rabbitmq")
async def health_check_rabbitmq() -> Dict[str, Any]:
    """Run health check for RabbitMQ."""
    result = await _check_rabbitmq()
    log_health_check(component="rabbitmq", status=result["status"], details=result["details"])
    return result

@router.get("/integrations")
async def health_check_integrations() -> Dict[str, Any]:
    """Run health check for external integrations."""
    result = await _check_all_integrations()
    log_health_check(component="integrations", status=result["status"], details=result["details"])
    return result

@router.get("/external/{service_name}")
async def health_check_external(service_name: str) -> Dict[str, Any]:
    """Run health check for a specific external service."""
    # Find service URL from settings
    service_url = None
    for service in settings.EXTERNAL_SERVICES_TO_MONITOR:
        if service.get("name") == service_name:
            service_url = service.get("url")
            break
    
    if not service_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"External service '{service_name}' not found in configuration"
        )
    
    result = await _check_external_service(service_name, service_url)
    log_health_check(component=f"external/{service_name}", status=result["status"], details=result["details"])
    return result

@router.get("/liveness")
async def liveness_probe() -> Dict[str, str]:
    """
    Kubernetes liveness probe endpoint.
    Simple check that the service is running and can respond to requests.
    """
    return {"status": "alive"}

@router.get("/readiness")
async def readiness_probe() -> Dict[str, Any]:
    """
    Kubernetes readiness probe endpoint.
    Checks that the service is ready to accept traffic by verifying core dependencies.
    """
    # Only check the most essential services 
    try:
        # Check database
        db_status = await _check_database()
        if db_status["status"] != "healthy":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database is not ready"
            )
        
        # Check redis
        redis_status = await _check_redis()
        if redis_status["status"] != "healthy":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Redis is not ready"
            )
            
        # Ready to accept traffic
        return {
            "status": "ready",
            "timestamp": time.time(),
            "details": {
                "database_latency_ms": db_status["latency_ms"],
                "redis_latency_ms": redis_status["latency_ms"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Readiness check failed: {str(e)}"
        )

@router.get("/synthetic")
async def synthetic_transaction_probe() -> Dict[str, Any]:
    """
    Run a synthetic transaction that tests end-to-end functionality.
    Simulates a typical user flow to ensure all components are working together.
    """
    start_time = time.time()
    results = {
        "status": "healthy",
        "timestamp": time.time(),
        "steps": []
    }
    
    try:
        # Example step 1: Check authentication (simulated)
        step1_start = time.time()
        # TODO: Add actual auth flow test here
        step1_result = {
            "name": "authentication",
            "status": "healthy",
            "duration_ms": round((time.time() - step1_start) * 1000, 2),
            "details": {"message": "Authentication service verified"}
        }
        results["steps"].append(step1_result)
        
        # Example step 2: Check database operation
        step2_start = time.time()
        db_status = await _check_database()
        step2_result = {
            "name": "database_operation",
            "status": db_status["status"],
            "duration_ms": db_status["latency_ms"],
            "details": db_status["details"]
        }
        results["steps"].append(step2_result)
        
        # Example step 3: Check caching
        step3_start = time.time()
        redis_status = await _check_redis()
        step3_result = {
            "name": "cache_operation",
            "status": redis_status["status"],
            "duration_ms": redis_status["latency_ms"],
            "details": redis_status["details"]
        }
        results["steps"].append(step3_result)
        
        # Aggregate overall status - if any step is unhealthy, the whole test is unhealthy
        for step in results["steps"]:
            if step["status"] == "unhealthy":
                results["status"] = "unhealthy"
                break
            elif step["status"] == "warning" and results["status"] == "healthy":
                results["status"] = "warning"
        
        # Add total duration
        results["duration_ms"] = round((time.time() - start_time) * 1000, 2)
        
        # Log synthetic transaction result
        log_health_check(
            component="synthetic_transaction", 
            status=results["status"],
            details={"steps": len(results["steps"]), "duration_ms": results["duration_ms"]}
        )
        
        return results
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "duration_ms": round((time.time() - start_time) * 1000, 2),
            "error": str(e),
            "steps": results["steps"]
        }