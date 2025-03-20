from fastapi import FastAPI, Depends, HTTPException, Request, status, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
import time
import uuid

from src.ultimate_marketing_team.core.settings import settings
from src.ultimate_marketing_team.core.logging import setup_logging
from src.ultimate_marketing_team.core.cache import rate_limiter
from src.ultimate_marketing_team.api.websocket import websocket_endpoint
from src.ultimate_marketing_team.core.websocket_bridge import start_websocket_bridge, stop_websocket_bridge

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
from src.ultimate_marketing_team.api.routers import auth, brands, projects, content, competitors, ads

# Add routers to app
app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["Authentication"])
app.include_router(brands.router, prefix=f"{settings.API_PREFIX}/brands", tags=["Brands"])
app.include_router(projects.router, prefix=f"{settings.API_PREFIX}/projects", tags=["Projects"])
app.include_router(content.router, prefix=f"{settings.API_PREFIX}/content", tags=["Content"])
app.include_router(competitors.router, prefix=f"{settings.API_PREFIX}/competitors", tags=["Competitors"])
app.include_router(ads.router, prefix=f"{settings.API_PREFIX}/ads", tags=["Advertising"])

# Add WebSocket endpoint
app.add_websocket_route(f"{settings.API_PREFIX}/ws", websocket_endpoint)

# Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for internal paths
    if request.url.path.startswith("/api/internal"):
        return await call_next(request)
    
    # Get client IP
    client_ip = request.client.host
    
    # Check rate limit (100 requests per minute by default)
    if rate_limiter.is_rate_limited(
        key=client_ip, 
        max_requests=settings.RATE_LIMIT_MAX_REQUESTS, 
        window_seconds=settings.RATE_LIMIT_WINDOW_MS // 1000
    ):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Rate limit exceeded"}
        )
    
    # Process the request
    response = await call_next(request)
    return response

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
