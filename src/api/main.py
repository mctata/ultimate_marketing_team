from fastapi import FastAPI, Depends, HTTPException, Request, status, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
import time
import uuid
import traceback
import json
import asyncio

from src.core.settings import settings
from src.core.logging import (
    setup_logging, get_logger, set_context, 
    log_request, log_exception, log_health_check, 
    trace_id_var, request_id_var
)
from src.core.cache import rate_limiter
from src.api.websocket import websocket_endpoint
from src.core.websocket_bridge import start_websocket_bridge, stop_websocket_bridge

# Setup logging
setup_logging()
logger = get_logger(component="api")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} in {settings.ENV} environment")
    
    # Start WebSocket bridge
    await start_websocket_bridge()
    
    # Start budget monitoring service
    from src.core.budget_monitor import start_budget_monitor
    await start_budget_monitor()
    
    # Initialize monitoring services
    from src.core.monitoring import setup_monitoring
    await setup_monitoring()
    
    logger.info("Application startup complete")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"Shutting down {settings.APP_NAME}")
    
    # Stop WebSocket bridge
    await stop_websocket_bridge()
    
    # Shutdown monitoring services
    from src.core.monitoring import shutdown_monitoring
    await shutdown_monitoring()
    
    logger.info("Application shutdown complete")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from src.api.routers import auth, brands, content, metrics, content_generation, content_analytics, content_recommendations, content_collaboration, user_preferences, health, compliance, developer

# Add routers to app
app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["Authentication"])
app.include_router(brands.router, prefix=f"{settings.API_PREFIX}/brands", tags=["Brands"])
app.include_router(content.router, prefix=f"{settings.API_PREFIX}/content", tags=["Content"])
app.include_router(metrics.router, prefix=f"{settings.API_PREFIX}/metrics", tags=["Metrics"])
app.include_router(content_generation.router, prefix=f"{settings.API_PREFIX}/content-generation", tags=["Content Generation"])
app.include_router(content_analytics.router, prefix=f"{settings.API_PREFIX}/content-analytics", tags=["Content Analytics"])
app.include_router(content_recommendations.router, prefix=f"{settings.API_PREFIX}/content-recommendations", tags=["Content Recommendations"])
app.include_router(content_collaboration.router, prefix=f"{settings.API_PREFIX}/content-collaboration", tags=["Content Collaboration"])
app.include_router(user_preferences.router, prefix=f"{settings.API_PREFIX}/user-preferences", tags=["User Preferences"])
app.include_router(compliance.router, tags=["Compliance"])  # Using router-defined prefix
app.include_router(developer.router, prefix=f"{settings.API_PREFIX}/developer", tags=["Developer"])
app.include_router(health.router, prefix=f"{settings.API_PREFIX}/health", tags=["Health"])

# Add WebSocket endpoint
app.add_api_websocket_route(f"{settings.API_PREFIX}/ws", websocket_endpoint)

# Tracing and Request ID middleware (must be first to capture all subsequent middleware)
@app.middleware("http")
async def tracing_middleware(request: Request, call_next):
    # Create new request ID and trace ID
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    trace_id = request.headers.get("X-Trace-ID") or str(uuid.uuid4())
    
    # Set context for the entire request
    set_context(request_id=request_id, trace_id=trace_id, component="api")
    
    # Store in request state for access in endpoint handlers
    request.state.request_id = request_id
    request.state.trace_id = trace_id
    
    # Attempt to extract user ID if authorized
    user_id = None
    try:
        # This is a simplified example - in practice, you'd extract from JWT or session
        if "Authorization" in request.headers:
            # TODO: Extract actual user ID from auth token
            pass
    except Exception:
        pass
    
    if user_id:
        request.state.user_id = user_id
        set_context(user_id=user_id)
    
    # Process the request
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        
        # Add trace and request IDs to response headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Trace-ID"] = trace_id
        
        # Log the request
        log_request(
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=process_time,
            user_id=getattr(request.state, "user_id", None),
            ip_address=request.client.host,
            user_agent=request.headers.get("User-Agent"),
            params=dict(request.query_params)
        )
        
        return response
    except Exception as exc:
        process_time = (time.time() - start_time) * 1000
        log_exception(exc, {
            "method": request.method,
            "path": request.url.path,
            "duration_ms": process_time,
            "user_id": getattr(request.state, "user_id", None),
            "ip_address": request.client.host,
        })
        raise

# Enhanced rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    from src.core.rate_limiting import rate_limiter, RateLimitCategory
    import re
    
    # Skip rate limiting for internal paths
    if request.url.path.startswith("/api/internal"):
        return await call_next(request)
    
    # Get client IP
    client_ip = request.client.host
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Use the first IP in the list (client's real IP)
        client_ip = forwarded_for.split(",")[0].strip()
    
    # Determine the rate limit category based on the path
    category = RateLimitCategory.DEFAULT
    path = request.url.path
    
    # Security-related endpoints
    if re.match(r"^/api/v\d+/auth", path) or path.endswith("/password") or "login" in path or "logout" in path:
        category = RateLimitCategory.SECURITY
    # Public endpoints
    elif path.startswith("/public/") or path == "/api/health" or path == "/":
        category = RateLimitCategory.PUBLIC
    # Frontend app endpoints
    elif "X-App-Client" in request.headers and request.headers["X-App-Client"] == "frontend":
        category = RateLimitCategory.FRONTEND
    # Sensitive endpoints
    elif re.match(r"^/api/v\d+/(admin|users|settings|billing)", path):
        category = RateLimitCategory.SENSITIVE
    
    # Check if circuit breaker is tripped
    rate_limiter.check_and_update_circuit_breaker()
    
    # Check rate limit
    allowed, context = rate_limiter.allow_request(
        key=client_ip,
        category=category,
        endpoint=path,
        headers=dict(request.headers),
        ip_address=client_ip
    )
    
    if not allowed:
        retry_after = context.get("retry_after", 60)
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            headers={"Retry-After": str(retry_after)},
            content={"detail": context.get("reason", "Rate limit exceeded")}
        )
    
    # Process the request
    try:
        response = await call_next(request)
        
        # Add rate limit headers to response
        response.headers["X-RateLimit-Limit"] = str(context.get("limit", 0))
        response.headers["X-RateLimit-Remaining"] = str(context.get("remaining", 0))
        response.headers["X-RateLimit-Reset"] = str(context.get("reset", 0))
        
        # Record successful request for circuit breaker
        if response.status_code < 500:
            rate_limiter.record_request_result(success=True)
        else:
            rate_limiter.record_request_result(success=False)
            
        return response
    except Exception as e:
        # Record failed request for circuit breaker
        rate_limiter.record_request_result(success=False)
        raise

# Performance tracking middleware
if settings.PERFORMANCE_TRACKING_ENABLED:
    @app.middleware("http")
    async def performance_middleware(request: Request, call_next):
        start_time = time.time()
        
        # Extract path template for better metrics grouping
        path_template = request.url.path
        
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Add processing time to response headers
        response.headers["X-Process-Time"] = str(process_time)
        
        # Record metric if slower than threshold (20ms)
        if process_time > 0.02:
            # Send to monitoring system
            from src.core.monitoring import record_http_latency
            asyncio.create_task(
                record_http_latency(
                    method=request.method,
                    path=path_template,
                    duration_ms=process_time * 1000,
                    status_code=response.status_code
                )
            )
            
        return response

# Root endpoint
@app.get("/")
async def root() -> Dict[str, str]:
    """API root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online"
    }

# Basic Health check endpoint - use /api/v1/health/* for detailed checks
@app.get("/api/health")
async def health_check() -> Dict[str, Any]:
    """API basic health check endpoint."""
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

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # Log client errors at warning level
    log_data = {
        "status_code": exc.status_code,
        "detail": exc.detail,
        "path": request.url.path,
        "method": request.method,
    }
    get_logger(**log_data).warning(f"HTTP {exc.status_code}: {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    # Log uncaught exceptions with traceback
    error_id = str(uuid.uuid4())
    
    log_data = {
        "error_id": error_id,
        "path": request.url.path,
        "method": request.method,
        "exception_type": type(exc).__name__,
    }
    
    # Add traceback
    tb = traceback.format_exc()
    log_data["traceback"] = tb
    
    # Log the error
    get_logger(**log_data).error(f"Uncaught exception: {str(exc)}")
    
    # Record exception in monitoring
    try:
        from src.core.monitoring import record_exception
        asyncio.create_task(
            record_exception(
                exception_type=type(exc).__name__,
                message=str(exc),
                traceback=tb,
                path=request.url.path,
                method=request.method,
            )
        )
    except Exception:
        pass
    
    # Return standardized error response
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error", "error_id": error_id}
    )
