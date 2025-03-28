from fastapi import FastAPI, APIRouter
import uvicorn

app = FastAPI(title="Template API Test")

# Create routers
templates_router = APIRouter(tags=["templates"])
seed_router = APIRouter(tags=["templates"])

# Add test endpoints to templates router
@templates_router.get("/test")
def template_test():
    return {"status": "ok", "message": "Template test endpoint is working"}

@templates_router.get("/categories-test")
def categories_test():
    return {"status": "ok", "message": "Template categories test endpoint is working"}

@templates_router.get("/all-test")
def all_templates_test():
    return {
        "status": "ok",
        "message": "All templates test endpoint is working",
        "templates": [
            {"id": 1, "title": "Test Template 1", "description": "Test description 1"},
            {"id": 2, "title": "Test Template 2", "description": "Test description 2"}
        ]
    }

# Add test endpoints to seed router
@seed_router.get("/test")
def seed_test():
    return {"status": "ok", "message": "Seed templates test endpoint is working"}

@seed_router.get("/check")
def seed_check():
    return {"status": "ok", "message": "Templates check endpoint is working", "exists": True}

# Root endpoint
@app.get("/")
def root():
    return {"status": "online", "message": "Template API Test Server"}

# Debug endpoint to list routes
@app.get("/debug/routes")
def debug_routes():
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

# Mount the routers with the right prefixes
app.include_router(templates_router, prefix="/api/v1/templates")
app.include_router(seed_router, prefix="/api/v1/seed-templates")

if __name__ == "__main__":
    uvicorn.run("test_api:app", host="127.0.0.1", port=8080, reload=True)