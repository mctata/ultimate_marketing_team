"""
Simplified API Gateway - minimal version with just health endpoint
for performance optimization
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
import uuid
import os
import sys

from src.core.settings import settings
from src.core.logging import setup_logging, get_logger

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

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} in {settings.ENV} environment")
    logger.info("Application startup complete")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"Shutting down {settings.APP_NAME}")
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
from src.api.routers import health
from src.api import templates  # Import template router
from src.api import seed_templates  # Import seed templates router

# Add health router for basic functionality
app.include_router(health.router, prefix=f"{settings.API_PREFIX}/health", tags=["Health"])

# Include template routers
app.include_router(templates.router, prefix=f"{settings.API_PREFIX}/templates", tags=["Templates"])
app.include_router(seed_templates.router, prefix=f"{settings.API_PREFIX}/seed-templates", tags=["Templates"])

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
        "status": "online"
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