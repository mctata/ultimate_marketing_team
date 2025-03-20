from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
import uuid
import os
from datetime import datetime
import shutil
from PIL import Image
import io

from core.security import get_current_user
from models.content import ContentModel
from models.integration import Integration
import logging

# Configure logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/content",
    tags=["content"],
    responses={404: {"description": "Not found"}},
)

# In a production environment, you'd store images in a cloud storage service
# This is a simplified example using local filesystem storage
UPLOAD_DIR = "uploads/images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/")
async def get_content(
    user=Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    content_type: Optional[str] = None,
    brand_id: Optional[str] = None,
    status: Optional[str] = None,
) -> List[ContentModel]:
    """
    Get a list of content items with optional filtering.
    
    Args:
        user: The authenticated user
        skip: Number of items to skip for pagination
        limit: Maximum number of items to return
        content_type: Optional filter by content type
        brand_id: Optional filter by brand ID
        status: Optional filter by content status
        
    Returns:
        List of content items
    """
    # Implement database query logic here
    # This is a stub implementation
    return []

@router.get("/{content_id}")
async def get_content_by_id(
    content_id: str,
    user=Depends(get_current_user)
) -> ContentModel:
    """
    Get a specific content item by ID.
    
    Args:
        content_id: The ID of the content to retrieve
        user: The authenticated user
        
    Returns:
        The requested content item
    """
    # Implement database query logic here
    # This is a stub implementation
    return {
        "id": content_id,
        "title": "Example Content",
        "content_type": "article",
        "status": "draft",
        "brand_id": "brand123",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "content": {
            "body": "This is example content.",
            "meta": {}
        }
    }

@router.post("/")
async def create_content(
    content: ContentModel,
    user=Depends(get_current_user)
) -> ContentModel:
    """
    Create a new content item.
    
    Args:
        content: The content data to create
        user: The authenticated user
        
    Returns:
        The created content item
    """
    # Implement database create logic here
    # This is a stub implementation
    content.id = str(uuid.uuid4())
    content.created_at = datetime.now().isoformat()
    content.updated_at = datetime.now().isoformat()
    return content

@router.put("/{content_id}")
async def update_content(
    content_id: str,
    content: ContentModel,
    user=Depends(get_current_user)
) -> ContentModel:
    """
    Update an existing content item.
    
    Args:
        content_id: The ID of the content to update
        content: The updated content data
        user: The authenticated user
        
    Returns:
        The updated content item
    """
    # Implement database update logic here
    # This is a stub implementation
    content.updated_at = datetime.now().isoformat()
    return content

@router.delete("/{content_id}")
async def delete_content(
    content_id: str,
    user=Depends(get_current_user)
) -> JSONResponse:
    """
    Delete a content item.
    
    Args:
        content_id: The ID of the content to delete
        user: The authenticated user
        
    Returns:
        Confirmation of deletion
    """
    # Implement database delete logic here
    # This is a stub implementation
    return JSONResponse(content={"message": f"Content {content_id} deleted"})

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    width: Optional[int] = Query(None, description="Resize image to this width"),
    height: Optional[int] = Query(None, description="Resize image to this height"),
    quality: int = Query(85, description="JPEG quality (1-100)")
) -> Dict[str, Any]:
    """
    Upload an image file and optionally process it.
    
    Args:
        file: The image file to upload
        user: The authenticated user
        width: Optional width to resize the image to
        height: Optional height to resize the image to
        quality: JPEG quality (1-100)
        
    Returns:
        Image details including URL
    """
    try:
        # Validate file type
        allowed_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Invalid file format. Allowed formats: JPG, PNG, GIF, WebP")
        
        # Create a unique filename
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Process the image if resizing is requested
        if width or height:
            # Read the image into memory
            contents = await file.read()
            image = Image.open(io.BytesIO(contents))
            
            # Calculate new dimensions while maintaining aspect ratio
            if width and height:
                # Resize to exact dimensions
                resized_img = image.resize((width, height), Image.LANCZOS)
            elif width:
                # Maintain aspect ratio with given width
                wpercent = width / float(image.size[0])
                hsize = int(float(image.size[1]) * float(wpercent))
                resized_img = image.resize((width, hsize), Image.LANCZOS)
            elif height:
                # Maintain aspect ratio with given height
                hpercent = height / float(image.size[1])
                wsize = int(float(image.size[0]) * float(hpercent))
                resized_img = image.resize((wsize, height), Image.LANCZOS)
            
            # Save the processed image
            if file_ext.lower() in ['.jpg', '.jpeg']:
                resized_img.save(file_path, "JPEG", quality=quality)
            elif file_ext.lower() == '.png':
                resized_img.save(file_path, "PNG", optimize=True)
            elif file_ext.lower() == '.gif':
                resized_img.save(file_path, "GIF")
            elif file_ext.lower() == '.webp':
                resized_img.save(file_path, "WEBP", quality=quality)
        else:
            # Save the original file without processing
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        
        # In a production app, you'd return a URL to a cloud storage service
        # Here we just return a local path for demonstration
        image_url = f"/uploads/images/{unique_filename}"
        
        return {
            "url": image_url,
            "filename": unique_filename,
            "original_filename": file.filename,
            "content_type": file.content_type,
            "size": os.path.getsize(file_path),
            "width": width,
            "height": height
        }
    
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")

@router.delete("/images/{image_id}")
async def delete_image(
    image_id: str,
    user=Depends(get_current_user)
) -> JSONResponse:
    """
    Delete an uploaded image.
    
    Args:
        image_id: The ID/filename of the image to delete
        user: The authenticated user
        
    Returns:
        Confirmation of deletion
    """
    try:
        # Validate filename to prevent path traversal attacks
        if "/" in image_id or "\\" in image_id:
            raise HTTPException(status_code=400, detail="Invalid image ID")
            
        # Check if the file exists
        file_path = os.path.join(UPLOAD_DIR, image_id)
        if not os.path.isfile(file_path):
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Delete the file
        os.remove(file_path)
        
        return JSONResponse(content={"message": f"Image {image_id} deleted"})
    
    except Exception as e:
        logger.error(f"Error deleting image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting image: {str(e)}")