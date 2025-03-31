
from fastapi import FastAPI
import time

app = FastAPI()

@app.get("/")
async def health_check():
    """
    Simple health check endpoint optimized for performance.
    """
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "service": "health-api",
        "version": "1.0.0",
        "environment": "staging"
    }
