from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
import uuid
import os
from datetime import datetime
import shutil
import io

from src.core.security import get_current_user
import logging
from pydantic import BaseModel, Field
from typing import Dict, Optional as OptionalType

# Define a Pydantic model for ContentModel
class ContentModel(BaseModel):
    id: OptionalType[str] = None
    title: str
    content: str
    content_type: str = Field(..., description="Type of content (blog, social, ad, etc.)")
    platform: OptionalType[str] = None
    status: str = "draft"
    metadata: OptionalType[Dict] = None
    created_at: OptionalType[str] = None
    updated_at: OptionalType[str] = None
    
    class Config:
        from_attributes = True

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
    focal_point: Optional[str] = Form(None, description="Focal point coordinates (x,y) as JSON string")
) -> Dict[str, Any]:
    """
    Upload an image file with focal point information.
    
    Args:
        file: The image file to upload
        user: The authenticated user
        width: Optional width to resize the image to
        height: Optional height to resize the image to
        focal_point: Optional JSON string with focal point coordinates {x: 50, y: 50} (percentages)
        
    Returns:
        Image details including URL
    """
    try:
        # Validate file type
        allowed_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Invalid file format. Allowed formats: JPG, PNG, GIF, WebP")
        
        # Parse focal point if provided
        fp_data = {"x": 50, "y": 50}  # Default center
        if focal_point:
            try:
                import json
                parsed_fp = json.loads(focal_point)
                if isinstance(parsed_fp, dict) and 'x' in parsed_fp and 'y' in parsed_fp:
                    fp_data = {
                        'x': max(0, min(100, float(parsed_fp['x']))),
                        'y': max(0, min(100, float(parsed_fp['y'])))
                    }
            except Exception as e:
                logger.warning(f"Could not parse focal point data: {str(e)}")
        
        # Create a unique filename with UUID to avoid collisions
        image_id = str(uuid.uuid4())
        unique_filename = f"{image_id}{file_ext}"
        
        # For demo purposes, we'll create an upload directory if it doesn't exist
        upload_dir = "/tmp/uploads/images"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save the uploaded file directly
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Return simplified response
        image_url = f"/uploads/images/{unique_filename}"
        
        return {
            "success": True,
            "image_id": image_id,
            "url": image_url,
            "filename": unique_filename,
            "original_filename": file.filename,
            "content_type": file.content_type,
            "size": file_size,
            "focal_point": fp_data,
            "message": "Image uploaded successfully. Image processing is disabled in this demo version."
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
    Delete an uploaded image and all its variants.
    
    Args:
        image_id: The ID of the image to delete
        user: The authenticated user
        
    Returns:
        Confirmation of deletion
    """
    try:
        # Validate image_id to prevent path traversal attacks
        if "/" in image_id or "\\" in image_id:
            raise HTTPException(status_code=400, detail="Invalid image ID")
        
        # Define upload directory
        upload_dir = "/tmp/uploads/images"
        
        # Find all files matching the image_id pattern
        deleted_files = []
        
        # Check if directory exists
        if os.path.exists(upload_dir):
            for filename in os.listdir(upload_dir):
                # Match both the original file and any variants (image_id_variant.ext)
                if filename.startswith(image_id):
                    file_path = os.path.join(upload_dir, filename)
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                        deleted_files.append(filename)
        
        if not deleted_files:
            raise HTTPException(status_code=404, detail="Image not found")
        
        return JSONResponse(content={
            "success": True,
            "message": f"Image {image_id} and its variants deleted",
            "deleted_files": deleted_files
        })
    
    except Exception as e:
        logger.error(f"Error deleting image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting image: {str(e)}")

@router.put("/images/{image_id}/focal-point")
async def update_focal_point(
    image_id: str,
    focal_point: Dict[str, float],
    user=Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update the focal point for an existing image and regenerate all variants.
    
    Args:
        image_id: The ID of the image to update
        focal_point: Object containing x, y coordinates as percentages (0-100)
        user: The authenticated user
        
    Returns:
        Updated image details including regenerated variants
    """
    try:
        # Validate focal point
        if 'x' not in focal_point or 'y' not in focal_point:
            raise HTTPException(status_code=400, detail="Focal point must contain x and y coordinates")
            
        # Ensure values are within valid range
        x = max(0, min(100, float(focal_point['x'])))
        y = max(0, min(100, float(focal_point['y'])))
        
        # Validate image_id to prevent path traversal attacks
        if "/" in image_id or "\\" in image_id:
            raise HTTPException(status_code=400, detail="Invalid image ID")
        
        # Find the original image file
        original_file = None
        file_ext = None
        
        for filename in os.listdir(UPLOAD_DIR):
            if filename.startswith(image_id) and '_' not in filename:
                original_file = filename
                file_ext = os.path.splitext(filename)[1]
                break
                
        if not original_file:
            raise HTTPException(status_code=404, detail="Original image not found")
            
        # Load the original image
        original_path = os.path.join(UPLOAD_DIR, original_file)
        try:
            with Image.open(original_path) as image:
                original_width, original_height = image.size
                
                # Remove existing variants 
                for filename in os.listdir(UPLOAD_DIR):
                    if filename.startswith(image_id) and '_' in filename:
                        variant_path = os.path.join(UPLOAD_DIR, filename)
                        if os.path.isfile(variant_path):
                            os.remove(variant_path)
                
                # Generate new variants with updated focal point
                variants = {}
                sizes = {
                    "facebook": (1200, 628),  # Facebook/Instagram feed
                    "instagram_square": (1080, 1080),  # Instagram square
                    "story": (1080, 1920),  # Instagram/Facebook story
                    "twitter": (1200, 675),  # Twitter feed
                    "linkedin": (1200, 627),  # LinkedIn feed
                    "thumbnail": (400, 400),  # General thumbnail
                }
                
                for name, (target_width, target_height) in sizes.items():
                    variant_filename = f"{image_id}_{name}{file_ext}"
                    variant_path = os.path.join(UPLOAD_DIR, variant_filename)
                    
                    # Create a copy to avoid modifying the original
                    img_copy = image.copy()
                    
                    # Calculate target dimensions maintaining aspect ratio
                    original_aspect = original_width / original_height
                    target_aspect = target_width / target_height
                    
                    # Determine crop box based on focal point
                    # Convert focal point percentages to pixel coordinates
                    fx = (x / 100) * original_width
                    fy = (y / 100) * original_height
                    
                    if original_aspect > target_aspect:  # Original is wider
                        # Calculate height-based crop width
                        crop_height = original_height
                        crop_width = crop_height * target_aspect
                        
                        # Adjust left position based on focal point
                        left = max(0, min(fx - (crop_width / 2), original_width - crop_width))
                        top = 0
                    else:  # Original is taller
                        # Calculate width-based crop height
                        crop_width = original_width
                        crop_height = crop_width / target_aspect
                        
                        # Adjust top position based on focal point
                        top = max(0, min(fy - (crop_height / 2), original_height - crop_height))
                        left = 0
                        
                    # Crop the image based on calculated dimensions
                    right = left + crop_width
                    bottom = top + crop_height
                    img_copy = img_copy.crop((int(left), int(top), int(right), int(bottom)))
                    
                    # Resize to target dimensions
                    img_copy = img_copy.resize((target_width, target_height), Image.LANCZOS)
                    
                    # Optimize and save
                    quality = 85  # Default quality
                    if file_ext.lower() in ['.jpg', '.jpeg']:
                        img_copy.save(variant_path, "JPEG", quality=quality, optimize=True)
                    elif file_ext.lower() == '.png':
                        img_copy.save(variant_path, "PNG", optimize=True)
                    elif file_ext.lower() == '.gif':
                        img_copy.save(variant_path, "GIF")
                    elif file_ext.lower() == '.webp':
                        img_copy.save(variant_path, "WEBP", quality=quality)
                        
                    # Add to variants
                    variants[name] = f"/uploads/images/{variant_filename}"
                
                # Return updated image information
                return {
                    "success": True,
                    "image_id": image_id,
                    "url": f"/uploads/images/{original_file}",
                    "width": original_width,
                    "height": original_height,
                    "focal_point": {"x": x, "y": y},
                    "variants": variants
                }
                
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
    
    except Exception as e:
        logger.error(f"Error updating focal point: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating focal point: {str(e)}")