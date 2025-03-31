from fastapi import FastAPI, HTTPException
import time
import os
import socket
import psutil
import json
from datetime import datetime, timezone

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
        "environment": os.getenv("ENVIRONMENT", "staging")
    }

@app.get("/sys")
async def system_health():
    """
    System health information including CPU, memory, and disk usage.
    """
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "datetime": datetime.now(timezone.utc).isoformat(),
        "hostname": socket.gethostname(),
        "ip": socket.gethostbyname(socket.gethostname()),
        "cpu_percent": psutil.cpu_percent(),
        "memory": {
            "total": psutil.virtual_memory().total,
            "available": psutil.virtual_memory().available,
            "percent": psutil.virtual_memory().percent
        },
        "disk": {
            "total": psutil.disk_usage('/').total,
            "used": psutil.disk_usage('/').used,
            "free": psutil.disk_usage('/').free,
            "percent": psutil.disk_usage('/').percent
        }
    }

@app.get("/docker")
async def docker_health():
    """
    Information about Docker environment and containers.
    """
    docker_info = {
        "status": "healthy",
        "timestamp": time.time()
    }
    
    # Add Docker environment variables
    docker_info["docker_environment"] = {
        k: v for k, v in os.environ.items() 
        if k.startswith(("DOCKER", "COMPOSE"))
    }
    
    # Get Docker container ID if running in Docker
    try:
        with open('/proc/self/cgroup', 'r') as f:
            docker_info["container_id"] = f.readline().split('/')[-1].strip()
    except (FileNotFoundError, IndexError):
        docker_info["container_id"] = "Not running in Docker"
    
    return docker_info

@app.get("/env")
async def env_info():
    """
    Information about environment variables (excluding secrets).
    """
    # Filter out sensitive information from environment variables
    safe_env = {}
    sensitive_keys = ['password', 'secret', 'key', 'token', 'credential']
    
    for k, v in os.environ.items():
        # Skip environment variables that might contain sensitive information
        if any(secret in k.lower() for secret in sensitive_keys):
            safe_env[k] = '***REDACTED***'
        else:
            safe_env[k] = v
    
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "environment": os.getenv("ENVIRONMENT", "staging"),
        "environment_variables": safe_env
    }

@app.get("/network")
async def network_health():
    """
    Network health check including connectivity tests.
    """
    network_info = {
        "status": "healthy",
        "timestamp": time.time(),
        "hostname": socket.gethostname(),
        "interfaces": {}
    }
    
    # Get network interfaces
    try:
        network_info["interfaces"] = {
            iface: {
                "address": info[0].address,
                "netmask": info[0].netmask,
                "family": str(info[0].family)
            }
            for iface, info in psutil.net_if_addrs().items()
            if info[0].family == socket.AF_INET
        }
    except (AttributeError, IndexError):
        network_info["interfaces"] = "Could not retrieve network interfaces"
    
    # Check connectivity to key services
    services_to_check = [
        {"name": "api-gateway", "host": "api-gateway", "port": 8000},
        {"name": "postgres-proxy", "host": "postgres-proxy", "port": 5432},
        {"name": "redis", "host": "redis", "port": 6379},
        {"name": "rabbitmq", "host": "rabbitmq", "port": 5672}
    ]
    
    network_info["connectivity"] = {}
    for service in services_to_check:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((service["host"], service["port"]))
            network_info["connectivity"][service["name"]] = result == 0
            sock.close()
        except (socket.error, socket.gaierror):
            network_info["connectivity"][service["name"]] = False
    
    return network_info

@app.get("/ping")
async def ping():
    """
    Simple ping endpoint for load balancer health checks.
    """
    return "pong"

@app.get("/ready")
async def readiness():
    """
    Readiness check endpoint for Kubernetes probes.
    """
    return {"status": "ready", "timestamp": time.time()}

@app.get("/live")
async def liveness():
    """
    Liveness check endpoint for Kubernetes probes.
    """
    return {"status": "alive", "timestamp": time.time()}