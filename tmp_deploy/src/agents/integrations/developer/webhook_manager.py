"""Webhook Management Module.

This module provides functionality for managing webhooks, including
creation, validation, triggering, and monitoring.
"""

import os
import json
import logging
import hashlib
import hmac
import base64
import time
from typing import Dict, Any, Optional, List
from datetime import datetime

import requests
from sqlalchemy.exc import SQLAlchemyError

from src.core.database import get_db
from src.models.integration import Webhook

logger = logging.getLogger(__name__)

class WebhookManager:
    """Manager for webhook operations."""
    
    def __init__(self, cache=None):
        """Initialize the webhook manager.
        
        Args:
            cache: Optional cache instance for storing webhook data
        """
        self.cache = cache
        self.cache_ttl = 3600  # 1 hour
        self.cache_prefix = "webhook"
        
        # Default event types that can trigger webhooks
        self.supported_event_types = [
            "content.created",
            "content.updated",
            "content.published",
            "content.deleted",
            "campaign.created",
            "campaign.started",
            "campaign.completed",
            "project.created",
            "project.updated",
            "project.completed",
            "user.created",
            "user.updated",
            "analysis.completed",
            "report.generated",
            "integration.connected",
            "integration.disconnected",
            "integration.error"
        ]
    
    async def get_webhooks_for_brand(self, brand_id: Any) -> List[Dict[str, Any]]:
        """Get all webhooks for a brand.
        
        Args:
            brand_id: The brand ID
            
        Returns:
            List of webhooks
        """
        # Check cache first
        cache_key = f"{self.cache_prefix}:brand:{brand_id}"
        if self.cache:
            cached_webhooks = self.cache.get(cache_key)
            if cached_webhooks:
                try:
                    return json.loads(cached_webhooks)
                except Exception as e:
                    logger.error(f"Error parsing cached webhooks: {e}")
        
        # If not in cache, get from database
        try:
            with get_db() as db:
                webhooks = db.query(Webhook).filter(
                    Webhook.brand_id == brand_id,
                    Webhook.is_active == True
                ).all()
                
                webhook_list = []
                for webhook in webhooks:
                    webhook_list.append({
                        "id": webhook.id,
                        "name": webhook.name,
                        "url": webhook.url,
                        "events": webhook.events,
                        "format": webhook.format,
                        "created_by": webhook.created_by,
                        "created_at": webhook.created_at.isoformat() if webhook.created_at else None,
                        "updated_at": webhook.updated_at.isoformat() if webhook.updated_at else None
                    })
                
                # Update cache
                if self.cache:
                    self.cache.set(cache_key, json.dumps(webhook_list), ex=self.cache_ttl)
                
                return webhook_list
        except Exception as e:
            logger.error(f"Error getting webhooks for brand {brand_id}: {e}")
            return []
    
    async def get_webhooks_for_event(self, brand_id: Any, event_type: str) -> List[Dict[str, Any]]:
        """Get webhooks for a specific event type.
        
        Args:
            brand_id: The brand ID
            event_type: The event type to filter by
            
        Returns:
            List of webhooks that should be triggered for this event type
        """
        try:
            # Get all webhooks for the brand
            webhooks = await self.get_webhooks_for_brand(brand_id)
            
            # Filter webhooks by event type
            matching_webhooks = []
            for webhook in webhooks:
                events = webhook.get("events", [])
                
                # Check if event type matches any of the webhook's subscribed events
                if event_type in events or "*" in events:
                    matching_webhooks.append(webhook)
            
            return matching_webhooks
        except Exception as e:
            logger.error(f"Error getting webhooks for event {event_type} (brand {brand_id}): {e}")
            return []
    
    async def create_webhook(self, brand_id: Any, webhook_data: Dict[str, Any], created_by: Any) -> Dict[str, Any]:
        """Create a new webhook.
        
        Args:
            brand_id: The brand ID
            webhook_data: Webhook configuration data
            created_by: User ID of the creator
            
        Returns:
            Dict containing the creation result
        """
        # Validate required fields
        if "name" not in webhook_data:
            return {"status": "error", "message": "Webhook name is required"}
        
        if "url" not in webhook_data:
            return {"status": "error", "message": "Webhook URL is required"}
        
        if "events" not in webhook_data or not webhook_data["events"]:
            return {"status": "error", "message": "At least one event type is required"}
        
        # Validate event types
        for event in webhook_data["events"]:
            if event != "*" and event not in self.supported_event_types:
                return {
                    "status": "error", 
                    "message": f"Unsupported event type: {event}",
                    "supported_events": self.supported_event_types
                }
        
        # Create webhook in database
        try:
            with get_db() as db:
                # Create webhook object
                webhook = Webhook(
                    brand_id=brand_id,
                    name=webhook_data["name"],
                    url=webhook_data["url"],
                    events=webhook_data["events"],
                    format=webhook_data.get("format", "json"),
                    secret_key=webhook_data.get("secret_key"),
                    # TODO: Hash and salt the secret key if provided
                    is_active=True,
                    created_by=created_by
                )
                
                db.add(webhook)
                db.commit()
                db.refresh(webhook)
                
                # Invalidate cache
                cache_key = f"{self.cache_prefix}:brand:{brand_id}"
                if self.cache:
                    self.cache.delete(cache_key)
                
                # Return webhook data
                return {
                    "status": "success",
                    "message": "Webhook created successfully",
                    "webhook": {
                        "id": webhook.id,
                        "name": webhook.name,
                        "url": webhook.url,
                        "events": webhook.events,
                        "format": webhook.format,
                        "created_by": webhook.created_by,
                        "created_at": webhook.created_at.isoformat() if webhook.created_at else None
                    }
                }
        except SQLAlchemyError as e:
            logger.error(f"Database error creating webhook: {e}")
            return {"status": "error", "message": f"Database error: {str(e)}"}
        except Exception as e:
            logger.error(f"Error creating webhook: {e}")
            return {"status": "error", "message": f"Error creating webhook: {str(e)}"}
    
    async def update_webhook(self, webhook_id: Any, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing webhook.
        
        Args:
            webhook_id: The webhook ID
            webhook_data: Updated webhook configuration data
            
        Returns:
            Dict containing the update result
        """
        try:
            with get_db() as db:
                # Get existing webhook
                webhook = db.query(Webhook).filter(Webhook.id == webhook_id).first()
                
                if not webhook:
                    return {"status": "error", "message": "Webhook not found"}
                
                # Update fields if provided
                if "name" in webhook_data:
                    webhook.name = webhook_data["name"]
                
                if "url" in webhook_data:
                    webhook.url = webhook_data["url"]
                
                if "events" in webhook_data:
                    # Validate event types
                    for event in webhook_data["events"]:
                        if event != "*" and event not in self.supported_event_types:
                            return {
                                "status": "error", 
                                "message": f"Unsupported event type: {event}",
                                "supported_events": self.supported_event_types
                            }
                    
                    webhook.events = webhook_data["events"]
                
                if "format" in webhook_data:
                    webhook.format = webhook_data["format"]
                
                if "is_active" in webhook_data:
                    webhook.is_active = webhook_data["is_active"]
                
                if "secret_key" in webhook_data:
                    webhook.secret_key = webhook_data["secret_key"]
                    # TODO: Hash and salt the secret key
                
                # Update timestamp
                webhook.updated_at = datetime.now()
                
                db.commit()
                
                # Invalidate cache
                cache_key = f"{self.cache_prefix}:brand:{webhook.brand_id}"
                if self.cache:
                    self.cache.delete(cache_key)
                
                # Return updated webhook data
                return {
                    "status": "success",
                    "message": "Webhook updated successfully",
                    "webhook": {
                        "id": webhook.id,
                        "name": webhook.name,
                        "url": webhook.url,
                        "events": webhook.events,
                        "format": webhook.format,
                        "is_active": webhook.is_active,
                        "updated_at": webhook.updated_at.isoformat() if webhook.updated_at else None
                    }
                }
        except SQLAlchemyError as e:
            logger.error(f"Database error updating webhook: {e}")
            return {"status": "error", "message": f"Database error: {str(e)}"}
        except Exception as e:
            logger.error(f"Error updating webhook: {e}")
            return {"status": "error", "message": f"Error updating webhook: {str(e)}"}
    
    async def delete_webhook(self, webhook_id: Any) -> Dict[str, Any]:
        """Delete a webhook.
        
        Args:
            webhook_id: The webhook ID
            
        Returns:
            Dict containing the deletion result
        """
        try:
            with get_db() as db:
                # Get existing webhook
                webhook = db.query(Webhook).filter(Webhook.id == webhook_id).first()
                
                if not webhook:
                    return {"status": "error", "message": "Webhook not found"}
                
                # Store brand ID for cache invalidation
                brand_id = webhook.brand_id
                
                # Delete the webhook
                db.delete(webhook)
                db.commit()
                
                # Invalidate cache
                cache_key = f"{self.cache_prefix}:brand:{brand_id}"
                if self.cache:
                    self.cache.delete(cache_key)
                
                return {
                    "status": "success",
                    "message": "Webhook deleted successfully"
                }
        except SQLAlchemyError as e:
            logger.error(f"Database error deleting webhook: {e}")
            return {"status": "error", "message": f"Database error: {str(e)}"}
        except Exception as e:
            logger.error(f"Error deleting webhook: {e}")
            return {"status": "error", "message": f"Error deleting webhook: {str(e)}"}
    
    def _generate_signature(self, payload: str, secret: str) -> str:
        """Generate HMAC signature for webhook payload.
        
        Args:
            payload: JSON payload as string
            secret: Secret key for signing
            
        Returns:
            Base64-encoded HMAC-SHA256 signature
        """
        if not secret:
            return ""
        
        # Create signature using HMAC-SHA256
        signature = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).digest()
        
        # Return base64-encoded signature
        return base64.b64encode(signature).decode()
    
    async def trigger_webhook(self, webhook: Dict[str, Any], event_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger a webhook with the given payload.
        
        Args:
            webhook: Webhook configuration
            event_type: Type of event that triggered the webhook
            payload: Event payload data
            
        Returns:
            Dict containing the triggering result
        """
        try:
            webhook_url = webhook.get("url")
            webhook_format = webhook.get("format", "json")
            webhook_id = webhook.get("id")
            
            # Format payload based on webhook format
            if webhook_format == "json":
                # Add metadata to payload
                full_payload = {
                    "event_type": event_type,
                    "webhook_id": webhook_id,
                    "timestamp": datetime.now().isoformat(),
                    "data": payload
                }
                
                formatted_payload = json.dumps(full_payload)
                headers = {"Content-Type": "application/json"}
            else:
                # Default to JSON format
                full_payload = {
                    "event_type": event_type,
                    "webhook_id": webhook_id,
                    "timestamp": datetime.now().isoformat(),
                    "data": payload
                }
                
                formatted_payload = json.dumps(full_payload)
                headers = {"Content-Type": "application/json"}
            
            # Add signature if secret key is available
            secret_key = webhook.get("secret_key")
            if secret_key:
                signature = self._generate_signature(formatted_payload, secret_key)
                headers["X-Webhook-Signature"] = signature
            
            # Add event type header
            headers["X-Webhook-Event"] = event_type
            
            # Send webhook request
            start_time = time.time()
            response = requests.post(
                webhook_url,
                data=formatted_payload,
                headers=headers,
                timeout=10  # 10 second timeout
            )
            response_time = time.time() - start_time
            
            # Log webhook result
            logger.info(
                f"Webhook {webhook_id} triggered for event {event_type}. "
                f"Response: {response.status_code}, Time: {response_time:.2f}s"
            )
            
            return {
                "status": "success" if response.status_code < 400 else "error",
                "webhook_id": webhook_id,
                "event_type": event_type,
                "response_code": response.status_code,
                "response_time": response_time,
                "response_body": response.text[:1000] if len(response.text) > 1000 else response.text
            }
        except requests.RequestException as e:
            logger.error(f"Error triggering webhook {webhook.get('id')}: {e}")
            return {
                "status": "error",
                "webhook_id": webhook.get("id"),
                "event_type": event_type,
                "error": str(e)
            }
        except Exception as e:
            logger.error(f"Error triggering webhook {webhook.get('id')}: {e}")
            return {
                "status": "error",
                "webhook_id": webhook.get("id"),
                "event_type": event_type,
                "error": str(e)
            }
    
    async def trigger_event(self, brand_id: Any, event_type: str, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Trigger webhooks for a specific event.
        
        Args:
            brand_id: The brand ID
            event_type: Type of event that occurred
            payload: Event payload data
            
        Returns:
            List of webhook triggering results
        """
        # Get webhooks that should be triggered for this event
        webhooks = await self.get_webhooks_for_event(brand_id, event_type)
        if not webhooks:
            logger.info(f"No webhooks found for event {event_type} (brand {brand_id})")
            return []
        
        # Trigger webhooks in parallel (in a real implementation)
        # Here we'll do it sequentially for simplicity
        results = []
        for webhook in webhooks:
            result = await self.trigger_webhook(webhook, event_type, payload)
            results.append(result)
        
        return results