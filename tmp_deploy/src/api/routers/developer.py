"""Developer API Router.

This module provides API endpoints for the developer platform, including
webhooks, API keys, and plugin management.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, validator

from fastapi import APIRouter, Depends, HTTPException, Security, Header, Query, Path
from fastapi.security.api_key import APIKeyHeader

from src.agents.integrations.developer.webhook_manager import WebhookManager
from src.agents.integrations.developer.api_key_manager import ApiKeyManager
from src.agents.integrations.developer.plugin_manager import PluginManager

from src.core.security import get_current_user, get_current_brand
from src.models.user import User
from src.models.brand import Brand

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/api/v1/developer", tags=["Developer"])

# Initialize managers
webhook_manager = WebhookManager()
api_key_manager = ApiKeyManager()
plugin_manager = PluginManager()

# API key security
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

# ---------- Pydantic Models for API Validation ----------

class WebhookCreate(BaseModel):
    """Model for creating a webhook."""
    name: str = Field(..., min_length=1, max_length=100)
    url: str = Field(..., min_length=5, max_length=255)
    events: List[str] = Field(..., min_items=1)
    format: Optional[str] = Field("json", pattern="^(json|xml)$")
    secret_key: Optional[str] = Field(None, min_length=8, max_length=64)

    @validator("url")
    def validate_url(cls, v):
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v

class WebhookUpdate(BaseModel):
    """Model for updating a webhook."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    url: Optional[str] = Field(None, min_length=5, max_length=255)
    events: Optional[List[str]] = Field(None, min_items=1)
    format: Optional[str] = Field(None, pattern="^(json|xml)$")
    secret_key: Optional[str] = Field(None, min_length=8, max_length=64)
    is_active: Optional[bool] = None

    @validator("url")
    def validate_url(cls, v):
        if v and not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v

class ApiKeyCreate(BaseModel):
    """Model for creating an API key."""
    key_name: str = Field(..., min_length=1, max_length=100)
    scopes: Optional[List[str]] = None
    rate_limit: Optional[int] = Field(60, ge=1, le=1000)
    expires_at: Optional[str] = None

class ApiKeyUpdate(BaseModel):
    """Model for updating an API key."""
    key_name: Optional[str] = Field(None, min_length=1, max_length=100)
    scopes: Optional[List[str]] = None
    rate_limit: Optional[int] = Field(None, ge=1, le=1000)
    is_active: Optional[bool] = None
    expires_at: Optional[str] = None

# ---------- Webhook Endpoints ----------

@router.get("/webhooks", response_model=List[Dict[str, Any]])
async def list_webhooks(
    brand: Brand = Depends(get_current_brand),
    user: User = Depends(get_current_user)
):
    """List webhooks for the current brand."""
    webhooks = await webhook_manager.get_webhooks_for_brand(brand.id)
    return webhooks

@router.post("/webhooks", response_model=Dict[str, Any])
async def create_webhook(
    webhook_data: WebhookCreate,
    brand: Brand = Depends(get_current_brand),
    user: User = Depends(get_current_user)
):
    """Create a new webhook."""
    result = await webhook_manager.create_webhook(brand.id, webhook_data.dict(), user.id)
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

@router.get("/webhooks/{webhook_id}", response_model=Dict[str, Any])
async def get_webhook(
    webhook_id: int = Path(..., gt=0),
    brand: Brand = Depends(get_current_brand),
    user: User = Depends(get_current_user)
):
    """Get a specific webhook."""
    webhooks = await webhook_manager.get_webhooks_for_brand(brand.id)
    
    for webhook in webhooks:
        if webhook["id"] == webhook_id:
            return webhook
    
    raise HTTPException(status_code=404, detail="Webhook not found")

@router.put("/webhooks/{webhook_id}", response_model=Dict[str, Any])
async def update_webhook(
    webhook_data: WebhookUpdate,
    webhook_id: int = Path(..., gt=0),
    brand: Brand = Depends(get_current_brand),
    user: User = Depends(get_current_user)
):
    """Update a webhook."""
    # Verify webhook exists and belongs to this brand
    webhooks = await webhook_manager.get_webhooks_for_brand(brand.id)
    webhook_exists = any(webhook["id"] == webhook_id for webhook in webhooks)
    
    if not webhook_exists:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    result = await webhook_manager.update_webhook(webhook_id, webhook_data.dict(exclude_unset=True))
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

@router.delete("/webhooks/{webhook_id}", response_model=Dict[str, Any])
async def delete_webhook(
    webhook_id: int = Path(..., gt=0),
    brand: Brand = Depends(get_current_brand),
    user: User = Depends(get_current_user)
):
    """Delete a webhook."""
    # Verify webhook exists and belongs to this brand
    webhooks = await webhook_manager.get_webhooks_for_brand(brand.id)
    webhook_exists = any(webhook["id"] == webhook_id for webhook in webhooks)
    
    if not webhook_exists:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    result = await webhook_manager.delete_webhook(webhook_id)
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

@router.get("/webhooks/events", response_model=List[str])
async def list_webhook_events(
    user: User = Depends(get_current_user)
):
    """List available webhook event types."""
    return webhook_manager.supported_event_types

# ---------- API Key Endpoints ----------

@router.get("/api-keys", response_model=List[Dict[str, Any]])
async def list_api_keys(
    brand: Brand = Depends(get_current_brand),
    user: User = Depends(get_current_user)
):
    """List API keys for the current brand."""
    api_keys = await api_key_manager.get_api_keys_for_brand(brand.id)
    return api_keys

@router.post("/api-keys", response_model=Dict[str, Any])
async def create_api_key(
    key_data: ApiKeyCreate,
    brand: Brand = Depends(get_current_brand),
    user: User = Depends(get_current_user)
):
    """Create a new API key."""
    result = await api_key_manager.create_api_key(brand.id, key_data.dict(), user.id)
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

@router.get("/api-keys/{key_id}", response_model=Dict[str, Any])
async def get_api_key(
    key_id: int = Path(..., gt=0),
    brand: Brand = Depends(get_current_brand),
    user: User = Depends(get_current_user)
):
    """Get a specific API key."""
    api_keys = await api_key_manager.get_api_keys_for_brand(brand.id)
    
    for key in api_keys:
        if key["id"] == key_id:
            return key
    
    raise HTTPException(status_code=404, detail="API key not found")

@router.put("/api-keys/{key_id}", response_model=Dict[str, Any])
async def update_api_key(
    key_data: ApiKeyUpdate,
    key_id: int = Path(..., gt=0),
    brand: Brand = Depends(get_current_brand),
    user: User = Depends(get_current_user)
):
    """Update an API key."""
    # Verify API key exists and belongs to this brand
    api_keys = await api_key_manager.get_api_keys_for_brand(brand.id)
    key_exists = any(key["id"] == key_id for key in api_keys)
    
    if not key_exists:
        raise HTTPException(status_code=404, detail="API key not found")
    
    result = await api_key_manager.update_api_key(key_id, key_data.dict(exclude_unset=True))
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

@router.delete("/api-keys/{key_id}", response_model=Dict[str, Any])
async def delete_api_key(
    key_id: int = Path(..., gt=0),
    brand: Brand = Depends(get_current_brand),
    user: User = Depends(get_current_user)
):
    """Delete an API key."""
    # Verify API key exists and belongs to this brand
    api_keys = await api_key_manager.get_api_keys_for_brand(brand.id)
    key_exists = any(key["id"] == key_id for key in api_keys)
    
    if not key_exists:
        raise HTTPException(status_code=404, detail="API key not found")
    
    result = await api_key_manager.delete_api_key(key_id)
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

@router.get("/api-keys/scopes", response_model=List[str])
async def list_api_key_scopes(
    user: User = Depends(get_current_user)
):
    """List available API key scopes."""
    return api_key_manager.supported_scopes

# ---------- Plugin Management Endpoints ----------

@router.get("/plugins", response_model=List[Dict[str, Any]])
async def list_plugins(
    user: User = Depends(get_current_user)
):
    """List available plugins."""
    return plugin_manager.discover_plugins()

@router.get("/plugins/loaded", response_model=List[Dict[str, Any]])
async def list_loaded_plugins(
    user: User = Depends(get_current_user)
):
    """List loaded plugins."""
    return plugin_manager.get_loaded_plugins()

@router.post("/plugins/{plugin_id}/load", response_model=Dict[str, Any])
async def load_plugin(
    plugin_id: str = Path(..., min_length=1),
    user: User = Depends(get_current_user)
):
    """Load a plugin."""
    result = plugin_manager.load_plugin(plugin_id)
    
    if result is None:
        raise HTTPException(status_code=400, detail=f"Failed to load plugin: {plugin_id}")
    
    return result

@router.post("/plugins/{plugin_id}/unload", response_model=Dict[str, Any])
async def unload_plugin(
    plugin_id: str = Path(..., min_length=1),
    user: User = Depends(get_current_user)
):
    """Unload a plugin."""
    result = plugin_manager.unload_plugin(plugin_id)
    
    if not result:
        raise HTTPException(status_code=400, detail=f"Failed to unload plugin: {plugin_id}")
    
    return {"status": "success", "message": f"Plugin {plugin_id} unloaded successfully"}

@router.post("/plugins/{plugin_id}/enable", response_model=Dict[str, Any])
async def enable_plugin(
    plugin_id: str = Path(..., min_length=1),
    user: User = Depends(get_current_user)
):
    """Enable a plugin."""
    result = plugin_manager.enable_plugin(plugin_id)
    
    if not result:
        raise HTTPException(status_code=400, detail=f"Failed to enable plugin: {plugin_id}")
    
    return {"status": "success", "message": f"Plugin {plugin_id} enabled successfully"}

@router.post("/plugins/{plugin_id}/disable", response_model=Dict[str, Any])
async def disable_plugin(
    plugin_id: str = Path(..., min_length=1),
    user: User = Depends(get_current_user)
):
    """Disable a plugin."""
    result = plugin_manager.disable_plugin(plugin_id)
    
    if not result:
        raise HTTPException(status_code=400, detail=f"Failed to disable plugin: {plugin_id}")
    
    return {"status": "success", "message": f"Plugin {plugin_id} disabled successfully"}

@router.get("/plugins/hooks", response_model=Dict[str, List[str]])
async def list_available_hooks(
    user: User = Depends(get_current_user)
):
    """List available plugin hooks."""
    return plugin_manager.get_available_hooks()

# ---------- Authentication via API Key ----------

async def get_brand_from_api_key(
    api_key: str = Security(api_key_header)
):
    """Get the brand associated with an API key."""
    if not api_key:
        return None
    
    # Validate API key
    validation_result = await api_key_manager.validate_api_key(api_key)
    
    if validation_result["status"] != "success":
        return None
    
    # Check rate limit
    rate_limit_result = await api_key_manager.check_rate_limit(api_key)
    
    if rate_limit_result["status"] != "success":
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Retry after {rate_limit_result.get('reset_after', 60)} seconds",
            headers={"Retry-After": str(rate_limit_result.get("reset_after", 60))}
        )
    
    # Get brand ID from validation result
    brand_id = validation_result.get("brand_id")
    
    if not brand_id:
        return None
    
    # Return brand ID
    return {"id": brand_id}