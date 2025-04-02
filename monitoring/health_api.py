from fastapi import FastAPI
import uvicorn
import time
import os
import requests

app = FastAPI()

@app.get("/")
async def health_check():
    # Check API Gateway health if configured
    api_gateway_status = "unknown"
    api_gateway_host = os.getenv("API_GATEWAY_HOST", "localhost")
    api_gateway_url = f"http://{api_gateway_host}:8000/health"
    
    try:
        # Use a short timeout to avoid blocking
        response = requests.get(api_gateway_url, timeout=2)
        if response.status_code == 200:
            api_gateway_status = "healthy"
        else:
            api_gateway_status = f"unhealthy (status code: {response.status_code})"
    except requests.exceptions.RequestException:
        api_gateway_status = "unavailable"
    
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "service": "health-api",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "staging"),
        "api_gateway": api_gateway_status
    }

@app.get("/ping")
async def ping():
    return "pong"

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
