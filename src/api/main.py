"""
Simplified API Gateway - minimal version with just health endpoint
for performance optimization
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
import uuid

from src.core.settings import settings
from src.core.logging import setup_logging, get_logger

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

# Import routers (simplified for optimization)
from src.api.routers import health

# Add only health router for bare minimum functionality
app.include_router(health.router, prefix=f"{settings.API_PREFIX}/health", tags=["Health"])

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