"""
Ultimate Marketing Team API Gateway - Simplified version for staging
"""

import time
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Create FastAPI app with minimal configuration
app = FastAPI(
    title="Ultimate Marketing Team",
    description="API Gateway for the Ultimate Marketing Team",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
)

# Root endpoint
@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "name": "Ultimate Marketing Team",
        "version": "0.1.0",
        "status": "online",
        "message": "API server is running - fixed context manager",
        "environment": os.environ.get("ENVIRONMENT", "staging")
    }

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """API basic health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "0.1.0",
        "environment": os.environ.get("ENVIRONMENT", "staging"),
        "message": "Fixed context manager usage in startup"
    }

# Database health check - simplified version
@app.get("/api/health/db")
async def db_health_check():
    """
    Check database connectivity.
    This is a simplified version that doesn't actually connect to the database.
    """
    return {
        "status": "simulated_connection",
        "timestamp": time.time(),
        "message": "This is a simplified version for staging - fixed context manager",
        "database_url": "Redacted for security"
    }
