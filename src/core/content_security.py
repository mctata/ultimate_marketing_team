"""
Content security features for validating, sanitizing, and securing uploaded content.
"""

import os
import mimetypes
import tempfile
import hashlib
import logging
from typing import Dict, Any, Optional, List, Tuple, BinaryIO, Union
from enum import Enum

from fastapi import UploadFile, HTTPException
import magic
import av
from PIL import Image, ImageOps
import bleach
from pydantic import BaseModel
import clamd
from cryptography.fernet import Fernet

from src.core.settings import settings
from src.core.security import encrypt_sensitive_data, decrypt_sensitive_data

# Configure logger
logger = logging.getLogger(__name__)

class ContentType(str, Enum):
    """Types of content that can be processed."""
    IMAGE = "image"
    DOCUMENT = "document"
    VIDEO = "video"
    AUDIO = "audio"
    HTML = "html"
    MARKDOWN = "markdown"
    TEXT = "text"
    UNKNOWN = "unknown"


class ContentValidationResult(BaseModel):
    """Result of content validation."""
    is_valid: bool
    content_type: ContentType
    mime_type: str
    file_size: int
    detected_issues: List[str] = []
    sanitized_content: Optional[str] = None
    metadata: Dict[str, Any] = {}
    hash: Optional[str] = None


def detect_content_type(file_content: bytes, filename: str) -> Tuple[ContentType, str]:
    """
    Detect the content type from file content and name.
    
    Args:
        file_content: The file content as bytes
        filename: The filename
        
    Returns:
        Tuple of (ContentType, mime_type)
    """
    # Use python-magic to detect mime type from content
    mime = magic.Magic(mime=True)
    mime_type = mime.from_buffer(file_content)
    
    # Determine content type based on mime type
    if mime_type.startswith("image/"):
        return ContentType.IMAGE, mime_type
    elif mime_type.startswith("video/"):
        return ContentType.VIDEO, mime_type
    elif mime_type.startswith("audio/"):
        return ContentType.AUDIO, mime_type
    elif mime_type in ["application/pdf", "application/msword", 
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                      "application/vnd.ms-excel",
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]:
        return ContentType.DOCUMENT, mime_type
    elif mime_type in ["text/html", "application/xhtml+xml"]:
        return ContentType.HTML, mime_type
    elif mime_type == "text/markdown":
        return ContentType.MARKDOWN, mime_type
    elif mime_type.startswith("text/"):
        return ContentType.TEXT, mime_type
    else:
        return ContentType.UNKNOWN, mime_type


def validate_file_upload(upload_file: UploadFile) -> ContentValidationResult:
    """
    Validate an uploaded file for security and conformance to allowed types.
    
    Args:
        upload_file: The uploaded file object
        
    Returns:
        ContentValidationResult with validation details
        
    Raises:
        HTTPException: If the file is invalid or potentially dangerous
    """
    # Read file content
    file_content = upload_file.file.read()
    file_size = len(file_content)
    
    # Reset file position for further processing
    upload_file.file.seek(0)
    
    # Check file size
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE_MB} MB"
        )
    
    # Detect content type
    content_type, mime_type = detect_content_type(file_content, upload_file.filename)
    
    # Verify against allowed types
    if mime_type not in settings.ALLOWED_UPLOAD_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"File type {mime_type} not allowed"
        )
    
    # Calculate file hash
    file_hash = hashlib.sha256(file_content).hexdigest()
    
    # Initialize validation result
    result = ContentValidationResult(
        is_valid=True,
        content_type=content_type,
        mime_type=mime_type,
        file_size=file_size,
        hash=file_hash
    )
    
    # Add content-specific validation
    issues = []
    metadata = {}
    
    if content_type == ContentType.IMAGE:
        # Validate image
        try:
            with Image.open(upload_file.file) as img:
                # Get image metadata
                metadata = {
                    "width": img.width,
                    "height": img.height,
                    "format": img.format,
                    "mode": img.mode
                }
                
                # Check for excessively large dimensions
                if img.width > 8000 or img.height > 8000:
                    issues.append("Image dimensions exceed maximum allowed")
        except Exception as e:
            issues.append(f"Invalid image file: {str(e)}")
            result.is_valid = False
        
        # Reset file position
        upload_file.file.seek(0)
    
    elif content_type == ContentType.VIDEO:
        # Validate video
        try:
            with tempfile.NamedTemporaryFile(delete=False) as temp:
                temp.write(file_content)
                temp_path = temp.name
            
            # Use PyAV to check video file
            container = av.open(temp_path)
            
            # Get video metadata
            metadata = {
                "format": container.format.name,
                "duration": float(container.duration) / av.time_base if container.duration else None,
                "streams": len(container.streams),
                "video_streams": len([s for s in container.streams if s.type == 'video']),
                "audio_streams": len([s for s in container.streams if s.type == 'audio'])
            }
            
            # Check if file is actually a video
            if len([s for s in container.streams if s.type == 'video']) == 0:
                issues.append("File contains no video streams")
                
            # Clean up
            container.close()
            os.unlink(temp_path)
        
        except Exception as e:
            issues.append(f"Invalid video file: {str(e)}")
            # Don't immediately invalidate - could be a format that PyAV doesn't handle
            if "temp_path" in locals():
                try:
                    os.unlink(temp_path)
                except:
                    pass
    
    # If malware scanning is enabled, scan the file
    if settings.MALWARE_SCAN_ENABLED:
        try:
            # Write file to temporary location for scanning
            with tempfile.NamedTemporaryFile(delete=False) as temp:
                temp.write(file_content)
                temp_path = temp.name
            
            # Connect to ClamAV daemon
            cd = clamd.ClamdNetworkSocket()
            
            # Scan the file
            scan_result = cd.scan(temp_path)
            
            # Clean up temp file
            os.unlink(temp_path)
            
            # Check if malware was found
            if scan_result and scan_result[temp_path][0] == 'FOUND':
                threat = scan_result[temp_path][1]
                issues.append(f"Malware detected: {threat}")
                result.is_valid = False
        
        except Exception as e:
            logger.warning(f"Malware scanning failed: {str(e)}")
            # Continue without malware scanning if it fails
            pass
    
    # Update the validation result
    result.detected_issues = issues
    result.metadata = metadata
    
    if issues and not result.is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid content: {', '.join(issues)}"
        )
    
    return result


def sanitize_html(html_content: str) -> str:
    """
    Sanitize HTML content by removing potentially dangerous tags and attributes.
    
    Args:
        html_content: The HTML content to sanitize
        
    Returns:
        Sanitized HTML content
    """
    # Define allowed tags and attributes
    allowed_tags = [
        'a', 'abbr', 'acronym', 'b', 'blockquote', 'br', 'code', 'div', 'em',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'ol',
        'p', 'pre', 'span', 'strong', 'table', 'tbody', 'td', 'th', 'thead',
        'tr', 'ul'
    ]
    
    allowed_attributes = {
        'a': ['href', 'title', 'rel', 'target'],
        'abbr': ['title'],
        'acronym': ['title'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
        'div': ['class'],
        'p': ['class'],
        'span': ['class'],
        'table': ['class'],
        'td': ['class', 'colspan', 'rowspan'],
        'th': ['class', 'colspan', 'rowspan', 'scope']
    }
    
    # Additional protocols for URLs
    allowed_protocols = ['http', 'https', 'mailto']
    
    # Sanitize the HTML
    sanitized = bleach.clean(
        html_content,
        tags=allowed_tags,
        attributes=allowed_attributes,
        protocols=allowed_protocols,
        strip=True
    )
    
    return sanitized


def encrypt_sensitive_content(content: str) -> Dict[str, str]:
    """
    Encrypt sensitive content using Fernet symmetric encryption.
    
    Args:
        content: The content to encrypt
        
    Returns:
        Dict containing encrypted_content and encryption_salt
    """
    encrypted_content, salt = encrypt_sensitive_data(content)
    
    return {
        "encrypted_content": encrypted_content,
        "encryption_salt": salt
    }


def decrypt_sensitive_content(encrypted_data: Dict[str, str]) -> str:
    """
    Decrypt sensitive content.
    
    Args:
        encrypted_data: Dict containing encrypted_content and encryption_salt
        
    Returns:
        Decrypted content
    """
    return decrypt_sensitive_data(
        encrypted_data.get("encrypted_content", ""),
        encrypted_data.get("encryption_salt", "")
    )


def is_file_potentially_dangerous(filename: str, content_type: ContentType) -> bool:
    """
    Check if a file is potentially dangerous based on its extension and content type.
    
    Args:
        filename: The filename to check
        content_type: The detected content type
        
    Returns:
        True if the file is potentially dangerous, False otherwise
    """
    # List of dangerous extensions
    dangerous_extensions = [
        '.exe', '.dll', '.bat', '.sh', '.js', '.vbs', '.ps1', '.py',
        '.php', '.pl', '.rb', '.jar', '.command', '.app'
    ]
    
    # Check file extension
    _, ext = os.path.splitext(filename.lower())
    if ext in dangerous_extensions:
        return True
    
    # Check for content type/extension mismatch
    expected_ext_map = {
        ContentType.IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'],
        ContentType.DOCUMENT: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
        ContentType.VIDEO: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'],
        ContentType.AUDIO: ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a'],
    }
    
    # If we have expected extensions for this content type, check for a mismatch
    if content_type in expected_ext_map and ext not in expected_ext_map[content_type.value]:
        return True
    
    return False


def generate_safe_filename(original_filename: str, content_hash: str) -> str:
    """
    Generate a safe filename based on the original and a content hash.
    
    Args:
        original_filename: The original filename
        content_hash: The content hash
        
    Returns:
        A safe filename
    """
    # Get file extension
    _, ext = os.path.splitext(original_filename)
    
    # Create a safe base filename, stripping any potentially problematic characters
    base_filename = "".join(c for c in os.path.splitext(original_filename)[0] 
                         if c.isalnum() or c in '-_.')
    
    # Use the first 8 characters of the hash
    short_hash = content_hash[:8]
    
    # Create the new filename
    safe_filename = f"{base_filename}_{short_hash}{ext}"
    
    return safe_filename


class DRMOptions(BaseModel):
    """Options for digital rights management."""
    watermark_text: Optional[str] = None
    watermark_opacity: float = 0.3
    restrict_downloads: bool = False
    expiry_date: Optional[str] = None
    max_views: Optional[int] = None
    allowed_domains: List[str] = []
    allowed_ips: List[str] = []


def apply_image_watermark(image_data: bytes, watermark_text: str, opacity: float = 0.3) -> bytes:
    """
    Apply a watermark to an image.
    
    Args:
        image_data: Image data as bytes
        watermark_text: Text to use as watermark
        opacity: Watermark opacity (0.0-1.0)
        
    Returns:
        Watermarked image as bytes
    """
    try:
        from io import BytesIO
        from PIL import Image, ImageDraw, ImageFont, ImageEnhance
        
        # Open the image
        img = Image.open(BytesIO(image_data))
        
        # Create a transparent overlay for the watermark
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        
        # Get a drawing context for the overlay
        draw = ImageDraw.Draw(overlay)
        
        # Calculate font size based on image dimensions
        width, height = img.size
        font_size = int(min(width, height) / 20)  # Adjust divisor as needed
        
        try:
            # Try to use a default font
            font = ImageFont.truetype("Arial", font_size)
        except IOError:
            # Fallback to default font
            font = ImageFont.load_default()
        
        # Calculate text size
        text_width, text_height = draw.textsize(watermark_text, font=font)
        
        # Position the text diagonally
        position = ((width - text_width) // 2, (height - text_height) // 2)
        
        # Draw the watermark
        draw.text(position, watermark_text, fill=(255, 255, 255, int(255 * opacity)), font=font)
        
        # Rotate the overlay for a diagonal watermark
        overlay = overlay.rotate(30, expand=False)
        
        # Composite the overlay onto the original image
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        watermarked = Image.alpha_composite(img, overlay)
        
        # Convert back to original format if needed
        if img.mode != 'RGBA':
            watermarked = watermarked.convert(img.mode)
        
        # Save the watermarked image to bytes
        buffer = BytesIO()
        watermarked.save(buffer, format=img.format)
        
        return buffer.getvalue()
    
    except Exception as e:
        logger.error(f"Error applying watermark: {str(e)}")
        return image_data  # Return original if watermarking fails


def apply_drm(
    content_data: bytes,
    content_type: ContentType,
    options: DRMOptions
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Apply digital rights management to content.
    
    Args:
        content_data: The content data as bytes
        content_type: The type of content
        options: DRM options
        
    Returns:
        Tuple of (protected_content, drm_metadata)
    """
    drm_metadata = {
        "has_drm": True,
        "drm_type": [],
    }
    
    # Apply appropriate DRM based on content type
    if content_type == ContentType.IMAGE and options.watermark_text:
        content_data = apply_image_watermark(
            content_data, 
            options.watermark_text, 
            options.watermark_opacity
        )
        drm_metadata["drm_type"].append("watermark")
    
    # Add additional metadata for download restrictions
    if options.restrict_downloads:
        drm_metadata["restrict_downloads"] = True
        drm_metadata["drm_type"].append("download_restriction")
    
    # Add expiry date if provided
    if options.expiry_date:
        drm_metadata["expiry_date"] = options.expiry_date
        drm_metadata["drm_type"].append("expiry")
    
    # Add view limit if provided
    if options.max_views:
        drm_metadata["max_views"] = options.max_views
        drm_metadata["drm_type"].append("view_limit")
    
    # Add domain restrictions if provided
    if options.allowed_domains:
        drm_metadata["allowed_domains"] = options.allowed_domains
        drm_metadata["drm_type"].append("domain_restriction")
    
    # Add IP restrictions if provided
    if options.allowed_ips:
        drm_metadata["allowed_ips"] = options.allowed_ips
        drm_metadata["drm_type"].append("ip_restriction")
    
    return content_data, drm_metadata