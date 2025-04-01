from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import time

# Create FastAPI app
app = FastAPI(
    title="Ultimate Marketing Team API",
    description="API for the Ultimate Marketing Team application",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "staging")
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to the Ultimate Marketing Team API",
        "docs_url": "/docs",
        "environment": os.getenv("ENVIRONMENT", "staging")
    }

# Ping endpoint
@app.get("/ping")
async def ping():
    return "pong"

# Simple mocked API endpoints for demonstration
@app.get("/api/campaigns")
async def get_campaigns():
    return [
        {"id": 1, "name": "Summer Sale", "status": "active", "budget": 5000},
        {"id": 2, "name": "Product Launch", "status": "draft", "budget": 10000},
        {"id": 3, "name": "Holiday Special", "status": "completed", "budget": 7500}
    ]

@app.get("/api/metrics")
async def get_metrics():
    return {
        "campaign_count": 3,
        "active_campaigns": 1,
        "total_budget": 22500,
        "engagement_rate": 3.7,
        "conversion_rate": 2.1
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
