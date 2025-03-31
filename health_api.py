from fastapi import FastAPI
import uvicorn
import time
import os

app = FastAPI()

@app.get("/")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "service": "health-api", 
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "staging")
    }

@app.get("/ping")
async def ping():
    return "pong"

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
