"""
Ultimate Marketing Team API Gateway with enhanced security features
"""

import time
import uuid
import os
import sys
from typing import Callable, List

from fastapi import FastAPI, Request, WebSocket, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from src.core.settings import settings
from src.core.logging import setup_logging, get_logger
from src.core.security import csrf_protection, jwt_manager

# Add current directory to path to help with imports
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

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

# Custom security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https://*; "
            "connect-src 'self' https://api.openai.com https://api.anthropic.com; "
            "frame-src 'self'; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "frame-ancestors 'self'; "
            "block-all-mixed-content; "
            "upgrade-insecure-requests;"
        )
        
        # Other security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Feature Policy / Permissions Policy
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        )
        
        return response

# Rate limiting middleware
class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Middleware to implement rate limiting."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        # Use Redis or in-memory store for rate limiting counters
        self.rate_limit_store = {}  # Replace with Redis in production
    
    async def dispatch(self, request: Request, call_next):
        # Extract client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Skip rate limiting for trusted IPs
        trusted_ips = os.getenv("TRUSTED_IPS", "127.0.0.1,::1").split(",")
        if client_ip in trusted_ips:
            return await call_next(request)
        
        # Check if IP is already blocked
        if self._is_ip_blocked(client_ip):
            return Response(
                content="Too many requests. Please try again later.",
                status_code=429
            )
        
        # Get current count for this IP
        current_time = int(time.time())
        window_start = current_time - (settings.RATE_LIMIT_WINDOW_MS // 1000)
        
        # Clean up old entries
        if client_ip in self.rate_limit_store:
            self.rate_limit_store[client_ip] = [
                timestamp for timestamp in self.rate_limit_store[client_ip]
                if timestamp > window_start
            ]
        else:
            self.rate_limit_store[client_ip] = []
        
        # Check if rate limit exceeded
        if len(self.rate_limit_store[client_ip]) >= settings.RATE_LIMIT_MAX_REQUESTS:
            return Response(
                content="Too many requests. Please try again later.",
                status_code=429,
                headers={"Retry-After": str(settings.RATE_LIMIT_WINDOW_MS // 1000)}
            )
        
        # Add current timestamp to the store
        self.rate_limit_store[client_ip].append(current_time)
        
        # Process the request
        return await call_next(request)
    
    def _is_ip_blocked(self, ip: str) -> bool:
        """Check if an IP is blocked."""
        # In a real implementation, this would check a database or cache
        return False

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} in {settings.ENV} environment")
    
    # Initialize JWT manager with database connection
    from src.core.database import get_db
    db = next(get_db())
    try:
        jwt_manager.initialize(db)
        logger.info("JWT manager initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize JWT manager: {str(e)}")
    
    logger.info("Application startup complete")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"Shutting down {settings.APP_NAME}")
    # Also shut down any WebSocket managers
    from src.api.websocket import manager as general_ws_manager
    from src.api.content_calendar_websocket import calendar_manager
    await general_ws_manager.shutdown()
    logger.info("Application shutdown complete")

# Configure CORS with more restrictive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Add security middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitingMiddleware)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["*"] if settings.ENV == "development" else settings.CORS_ORIGINS + ["localhost"]
)

# Add CSRF protection middleware
@app.middleware("http")
async def csrf_middleware(request: Request, call_next):
    return await csrf_protection.csrf_protect_middleware(request, call_next)

# Import routers
from src.api.routers import health
from src.api import templates  # Import template router
from src.api import seed_templates  # Import seed templates router
from src.api.routers import content_calendar  # Import content calendar router
from src.api.websocket import websocket_endpoint
from src.api.content_calendar_websocket import calendar_websocket_endpoint

# Add health router for basic functionality
app.include_router(health.router, prefix=f"{settings.API_PREFIX}/health", tags=["Health"])

# Include template routers
app.include_router(templates.router, prefix=f"{settings.API_PREFIX}/templates", tags=["Templates"])
app.include_router(seed_templates.router, prefix=f"{settings.API_PREFIX}/seed-templates", tags=["Templates"])

# Include content calendar router
app.include_router(content_calendar.router, prefix=f"{settings.API_PREFIX}/calendar", tags=["Content Calendar"])

# Add CSRF token endpoint
@app.get(f"{settings.API_PREFIX}/csrf-token", tags=["Security"])
async def get_csrf_token(request: Request):
    """Get a new CSRF token for forms."""
    token = csrf_protection.generate_token()
    response = {"token": token}
    return response

# Add WebSocket endpoints
app.add_websocket_route("/ws", websocket_endpoint)
app.add_websocket_route("/ws/calendar", calendar_websocket_endpoint)

# Create a direct endpoint for templates testing
@app.get("/api/v1/templates/categories-test", tags=["Templates"])
async def templates_categories_test():
    return {"status": "ok", "message": "Templates categories endpoint is working"}

# Root endpoint
@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "debug": True,
        "message": "API server is running with updated endpoint"
    }

# Basic Health check endpoint
@app.get("/api/health")
async def health_check():
    """API basic health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": settings.APP_VERSION,
        "environment": settings.ENV
    }

@app.get("/api/debug/routes")
async def debug_routes():
    """Debug endpoint to list all registered routes"""
    routes = []
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            routes.append({
                "path": route.path,
                "name": route.name,
                "methods": list(route.methods)
            })
    return {
        "routes": sorted(routes, key=lambda x: x["path"]),
        "count": len(routes)
    }

@app.get("/api/debug/router-status")
async def router_status():
    """Debug endpoint to check if routers were included correctly"""
    return {
        "app_routes_count": len(app.routes),
        "imported_routers": {
            "health": True,
            "templates": True if templates.router.routes else False,
            "seed_templates": True if seed_templates.router.routes else False
        },
        "api_prefix": settings.API_PREFIX,
        "environment": settings.ENV,
        "mounted_paths": {
            "health": f"{settings.API_PREFIX}/health",
            "templates": f"{settings.API_PREFIX}/templates",
            "seed_templates": f"{settings.API_PREFIX}/seed-templates",
        }
    }

@app.get("/api/v1/test-templates")
async def test_templates():
    """Direct test endpoint for templates"""
    return {
        "status": "ok",
        "message": "Direct templates test endpoint is working",
        "timestamp": time.time()
    }

@app.get("/api/templates-test")
async def templates_test_page(request: Request):
    """Test page for template API endpoints"""
    # List of endpoints to test
    endpoints = [
        "/",
        "/api/health",
        "/api/debug/routes",
        "/api/debug/router-status",
        "/api/v1/templates/test",
        "/api/v1/templates/categories",
        "/api/v1/templates/industries",
        "/api/v1/templates/formats",
        "/api/v1/templates",
        "/api/v1/templates/popular",
        "/api/v1/templates/recommended",
        "/api/v1/seed-templates/test",
        "/api/v1/seed-templates/check",
    ]
    
    # Create simple HTML with links
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Template API Test</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            h1 {{ color: #333; }}
            ul {{ list-style-type: none; padding: 0; }}
            li {{ margin: 10px 0; }}
            a {{ color: #0066cc; text-decoration: none; }}
            a:hover {{ text-decoration: underline; }}
        </style>
    </head>
    <body>
        <h1>Template API Test Links</h1>
        <p>Click on the links below to test API endpoints. Non-authenticated endpoints should work directly, authenticated ones will return 401.</p>
        <ul>
    """
    
    # Add links for each endpoint
    for endpoint in endpoints:
        html_content += f'<li><a href="{endpoint}" target="_blank">{endpoint}</a></li>\n'
    
    html_content += """
        </ul>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)