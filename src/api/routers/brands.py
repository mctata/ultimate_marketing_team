from fastapi import APIRouter, HTTPException, Depends, status, Query, Path, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field, HttpUrl, conint
from datetime import datetime, date
import json
from urllib.parse import urlparse

from src.ultimate_marketing_team.api.routers.auth import oauth2_scheme, get_current_user
from src.ultimate_marketing_team.core.messaging import RabbitMQClient
from src.ultimate_marketing_team.core.database import get_db
from src.ultimate_marketing_team.models.project import Brand, Project, ProjectType

router = APIRouter()
mq_client = RabbitMQClient()

# Pydantic Models
class BrandBase(BaseModel):
    name: str
    website_url: Optional[HttpUrl] = None
    description: Optional[str] = None

class BrandCreate(BrandBase):
    logo_url: Optional[HttpUrl] = None
    guidelines: Optional[Dict[str, Any]] = None

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    website_url: Optional[HttpUrl] = None
    description: Optional[str] = None
    logo_url: Optional[HttpUrl] = None

class BrandGuidelines(BaseModel):
    voice: Optional[str] = None
    tone: Optional[str] = None
    color_palette: Optional[List[str]] = None
    typography: Optional[Dict[str, Any]] = None
    imagery_style: Optional[str] = None
    target_audience: Optional[Dict[str, Any]] = None

class Brand(BaseModel):
    id: int
    name: str
    website_url: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class BrandDetail(Brand):
    guidelines: Optional[Dict[str, Any]] = None

class ProjectTypeBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectType(ProjectTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    project_type_id: int
    due_date: Optional[datetime] = None

class ProjectCreate(ProjectBase):
    brand_id: int

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    project_type_id: Optional[int] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None

class Project(ProjectBase):
    id: int
    brand_id: int
    status: str
    created_by: Optional[int] = None
    assigned_to: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    project_type_name: Optional[str] = None

    class Config:
        orm_mode = True

# Agent communication function
async def send_agent_task(task_type: str, task_data: Dict[str, Any], wait_for_response: bool = True) -> Dict[str, Any]:
    """Send a task to the Brand & Project Management Agent."""
    try:
        # Prepare task message
        task = {
            "task_type": task_type,
            **task_data
        }
        
        if wait_for_response:
            # Generate unique response queue
            import uuid
            response_queue = f"response_api_{uuid.uuid4()}"
            mq_client.declare_queue(response_queue)
            task["response_queue"] = response_queue
            
            # Send task
            mq_client.publish_direct("brand_project_agent_queue", task)
            
            # Wait for response
            import asyncio
            from concurrent.futures import ThreadPoolExecutor
            
            # Create a future to store the result
            loop = asyncio.get_event_loop()
            result_future = loop.create_future()
            
            def consume_response():
                # This function runs in a separate thread
                result = None
                try:
                    # Consume one message from the response queue
                    def callback(message):
                        nonlocal result
                        result = message
                        return False  # Stop consuming after first message
                    
                    mq_client.consume_one(response_queue, callback, timeout=30)
                except Exception as e:
                    result = {"status": "error", "error": f"Error receiving response: {str(e)}"}
                
                # Set the result in the future
                loop.call_soon_threadsafe(result_future.set_result, result)
            
            # Run the consumption in a thread pool
            with ThreadPoolExecutor() as executor:
                executor.submit(consume_response)
            
            # Wait for the result
            result = await result_future
            
            # Delete the response queue
            mq_client.delete_queue(response_queue)
            
            if not result:
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Timeout waiting for agent response"
                )
            
            return result
        else:
            # Send task without waiting for response
            mq_client.publish_direct("brand_project_agent_queue", task)
            return {"status": "sent"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error communicating with agent: {str(e)}"
        )

# Brand Endpoints
@router.post("/", response_model=BrandDetail, status_code=status.HTTP_201_CREATED)
async def create_brand(brand: BrandCreate, current_user = Depends(get_current_user)):
    """Create a new brand."""
    
    # Normalize and validate website URL
    website_url = None
    if brand.website_url:
        website_url = str(brand.website_url)
        parsed_url = urlparse(website_url)
        if not parsed_url.scheme:
            website_url = f"https://{website_url}"
    
    # Prepare task data
    task_data = {
        "company_name": brand.name,
        "website_url": website_url,
        "brand_guidelines": brand.guidelines or {},
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("onboard_brand", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to create brand")
        )
    
    # Return brand data
    brand_data = result.get("brand_data", {})
    brand_id = result.get("brand_id")
    
    return {
        "id": brand_id,
        "name": brand_data.get("name"),
        "website_url": brand_data.get("website_url"),
        "description": brand_data.get("description"),
        "logo_url": brand_data.get("logo_url"),
        "guidelines": brand_data.get("brand_guidelines"),
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

@router.get("/", response_model=List[Brand])
async def get_brands(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    """Get all brands for the current user."""
    try:
        with get_db() as db:
            brands = db.query(Brand).offset(skip).limit(limit).all()
            return brands
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve brands: {str(e)}"
        )

@router.get("/{brand_id}", response_model=BrandDetail)
async def get_brand(brand_id: int = Path(...), current_user = Depends(get_current_user)):
    """Get a specific brand by ID."""
    
    # Prepare task data
    task_data = {
        "brand_id": brand_id,
        "include_guidelines": True,
        "include_projects": False,
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("get_brand_info", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("error", f"Brand with ID {brand_id} not found")
        )
    
    # Return brand data
    return result.get("brand")

@router.put("/{brand_id}", response_model=Brand)
async def update_brand(
    updates: BrandUpdate,
    brand_id: int = Path(...),
    current_user = Depends(get_current_user)
):
    """Update a specific brand."""
    
    # Prepare update dictionary (only include non-None fields)
    update_dict = {}
    if updates.name is not None:
        update_dict["name"] = updates.name
    if updates.website_url is not None:
        update_dict["website_url"] = str(updates.website_url)
    if updates.description is not None:
        update_dict["description"] = updates.description
    if updates.logo_url is not None:
        update_dict["logo_url"] = str(updates.logo_url)
    
    # Prepare task data
    task_data = {
        "brand_id": brand_id,
        "updates": update_dict,
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("update_brand", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", f"Failed to update brand with ID {brand_id}")
        )
    
    # Return updated brand data
    return result.get("brand_data")

@router.put("/{brand_id}/guidelines", response_model=Dict[str, Any])
async def update_brand_guidelines(
    guidelines: Dict[str, Any],
    brand_id: int = Path(...),
    current_user = Depends(get_current_user)
):
    """Update guidelines for a specific brand."""
    
    # Prepare task data
    task_data = {
        "brand_id": brand_id,
        "updates": {"guidelines": guidelines},
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("update_brand", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", f"Failed to update brand guidelines for brand with ID {brand_id}")
        )
    
    # Return updated guidelines
    return guidelines

# Project Types Endpoints
@router.get("/project-types", response_model=List[ProjectType])
async def get_project_types(current_user = Depends(get_current_user)):
    """Get all available project types."""
    
    # Prepare task data
    task_data = {
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("get_project_types", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("error", "Failed to retrieve project types")
        )
    
    # Return project types
    return result.get("project_types", [])

@router.post("/project-types", response_model=ProjectType, status_code=status.HTTP_201_CREATED)
async def create_project_type(
    project_type: ProjectTypeBase,
    current_user = Depends(get_current_user)
):
    """Create a new project type."""
    
    # Prepare task data
    task_data = {
        "name": project_type.name,
        "description": project_type.description,
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("create_project_type", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to create project type")
        )
    
    # Return created project type
    return result.get("project_type")

# Project Endpoints
@router.post("/{brand_id}/projects", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    brand_id: int = Path(...),
    current_user = Depends(get_current_user)
):
    """Create a new project for a brand."""
    
    # Ensure brand_id in path matches brand_id in body
    if project.brand_id != brand_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brand ID in path does not match brand ID in request body"
        )
    
    # Prepare task data
    task_data = {
        "brand_id": brand_id,
        "project_type_id": project.project_type_id,
        "name": project.name,
        "description": project.description,
        "user_id": current_user.id,
        "due_date": project.due_date.isoformat() if project.due_date else None
    }
    
    # Send task to agent
    result = await send_agent_task("create_project", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to create project")
        )
    
    # Return created project
    project_data = result.get("project_data", {})
    
    return {
        "id": result.get("project_id"),
        "name": project_data.get("name"),
        "description": project_data.get("description"),
        "brand_id": project_data.get("brand_id"),
        "project_type_id": project_data.get("project_type_id"),
        "project_type_name": project_data.get("project_type_name"),
        "status": project_data.get("status"),
        "created_by": project_data.get("created_by"),
        "assigned_to": project_data.get("assigned_to"),
        "due_date": project_data.get("due_date"),
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

@router.get("/{brand_id}/projects", response_model=List[Project])
async def get_brand_projects(
    brand_id: int = Path(...),
    status: Optional[str] = Query(None),
    project_type_id: Optional[int] = Query(None),
    current_user = Depends(get_current_user)
):
    """Get all projects for a brand with optional filters."""
    
    # Prepare task data
    task_data = {
        "brand_id": brand_id,
        "user_id": current_user.id
    }
    
    # Add optional filters
    if status:
        task_data["status"] = status
    if project_type_id:
        task_data["project_type_id"] = project_type_id
    
    # Send task to agent
    result = await send_agent_task("get_brand_projects", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("error", f"Failed to retrieve projects for brand with ID {brand_id}")
        )
    
    # Return projects
    projects = result.get("projects", [])
    
    # Add datetime objects for created_at and updated_at
    now = datetime.now()
    for project in projects:
        project["created_at"] = now
        project["updated_at"] = now
    
    return projects

@router.get("/{brand_id}/projects/{project_id}", response_model=Project)
async def get_project(
    brand_id: int = Path(...),
    project_id: int = Path(...),
    current_user = Depends(get_current_user)
):
    """Get a specific project for a brand."""
    
    # Prepare task data
    task_data = {
        "project_id": project_id,
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("get_project_info", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("error", f"Project with ID {project_id} not found")
        )
    
    # Return project
    project = result.get("project", {})
    
    # Verify project belongs to the specified brand
    if project.get("brand_id") != brand_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} does not belong to brand with ID {brand_id}"
        )
    
    return project

@router.put("/{brand_id}/projects/{project_id}", response_model=Project)
async def update_project(
    updates: ProjectUpdate,
    brand_id: int = Path(...),
    project_id: int = Path(...),
    current_user = Depends(get_current_user)
):
    """Update a specific project for a brand."""
    
    # Prepare update dictionary (only include non-None fields)
    update_dict = {}
    if updates.name is not None:
        update_dict["name"] = updates.name
    if updates.description is not None:
        update_dict["description"] = updates.description
    if updates.project_type_id is not None:
        update_dict["project_type_id"] = updates.project_type_id
    if updates.status is not None:
        update_dict["status"] = updates.status
    if updates.due_date is not None:
        update_dict["due_date"] = updates.due_date.isoformat()
    
    # Prepare task data
    task_data = {
        "project_id": project_id,
        "updates": update_dict,
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("update_project", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", f"Failed to update project with ID {project_id}")
        )
    
    # Get updated project
    project_data = result.get("project_data", {})
    
    # Verify project belongs to the specified brand
    if project_data.get("brand_id") != brand_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project with ID {project_id} does not belong to brand with ID {brand_id}"
        )
    
    return project_data

@router.post("/{brand_id}/projects/{project_id}/assign", response_model=Dict[str, Any])
async def assign_project(
    assign_data: Dict[str, Any],
    brand_id: int = Path(...),
    project_id: int = Path(...),
    current_user = Depends(get_current_user)
):
    """Assign a project to a user."""
    
    # Validate assigned_to is provided
    if "assigned_to" not in assign_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="assigned_to field is required"
        )
    
    # Prepare task data
    task_data = {
        "project_id": project_id,
        "assigned_to": assign_data["assigned_to"],
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("assign_project", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", f"Failed to assign project with ID {project_id}")
        )
    
    return {
        "project_id": result.get("project_id"),
        "assigned_to": result.get("assigned_to"),
        "message": result.get("message")
    }
