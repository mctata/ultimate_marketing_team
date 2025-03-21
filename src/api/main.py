from fastapi import FastAPI, Depends, HTTPException, Request, status, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
import time
import uuid

from src.core.settings import settings
from src.core.logging import setup_logging
from src.core.cache import rate_limiter
from src.api.websocket import websocket_endpoint
from src.core.websocket_bridge import start_websocket_bridge, stop_websocket_bridge

# Setup logging
setup_logging()

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
    # Start WebSocket bridge
    await start_websocket_bridge()
    
    # Start budget monitoring service
    from src.core.budget_monitor import start_budget_monitor
    await start_budget_monitor()

@app.on_event("shutdown")
async def shutdown_event():
    # Stop WebSocket bridge
    await stop_websocket_bridge()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from src.api.routers import auth, brands, content, metrics

# Add routers to app
app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["Authentication"])
app.include_router(brands.router, prefix=f"{settings.API_PREFIX}/brands", tags=["Brands"])
app.include_router(content.router, prefix=f"{settings.API_PREFIX}/content", tags=["Content"])
app.include_router(metrics.router, prefix=f"{settings.API_PREFIX}/metrics", tags=["Metrics"])

# Add WebSocket endpoint
app.add_api_websocket_route(f"{settings.API_PREFIX}/ws", websocket_endpoint)

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

# Request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    # Process the request
    response = await call_next(request)
    
    # Add request ID to response headers
    response.headers["X-Request-ID"] = request_id
    return response

# Performance tracking middleware
if settings.PERFORMANCE_TRACKING_ENABLED:
    @app.middleware("http")
    async def performance_middleware(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Add processing time to response headers
        response.headers["X-Process-Time"] = str(process_time)
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

# Health check endpoint
@app.get("/api/health")
async def health_check() -> Dict[str, Any]:
    """API health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": settings.APP_VERSION,
        "environment": settings.ENV
    }

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )
