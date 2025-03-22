"""API Key Management Module.

This module provides functionality for managing API keys, including
creation, validation, authentication, and rate limiting.
"""

import os
import json
import logging
import hashlib
import secrets
import time
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta

from sqlalchemy.exc import SQLAlchemyError

from src.core.database import get_db
from src.models.integration import ApiKey

logger = logging.getLogger(__name__)

class ApiKeyManager:
    """Manager for API key operations."""
    
    def __init__(self, cache=None):
        """Initialize the API key manager.
        
        Args:
            cache: Optional cache instance for storing API key data
        """
        self.cache = cache
        self.cache_ttl = 3600  # 1 hour
        self.cache_prefix = "api_key"
        
        # Default scopes that can be assigned to API keys
        self.supported_scopes = [
            "read:content",
            "write:content",
            "read:analytics",
            "write:analytics",
            "read:campaigns",
            "write:campaigns",
            "read:integrations",
            "write:integrations",
            "read:projects",
            "write:projects",
            "read:users",
            "write:users",
            "read:webhooks",
            "write:webhooks"
        ]
    
    def _generate_api_key(self) -> Tuple[str, str]:
        """Generate a new API key with a random salt.
        
        Returns:
            Tuple of (api_key, api_key_salt)
        """
        # Generate a random API key
        api_key = secrets.token_hex(32)
        
        # Generate a random salt
        api_key_salt = secrets.token_hex(16)
        
        return api_key, api_key_salt
    
    def _hash_api_key(self, api_key: str, salt: str) -> str:
        """Hash an API key with a salt for secure storage.
        
        Args:
            api_key: The API key to hash
            salt: Salt value to use
            
        Returns:
            Hashed API key
        """
        # Combine the API key and salt
        salted_key = api_key + salt
        
        # Hash the combined value with SHA-256
        hashed_key = hashlib.sha256(salted_key.encode()).hexdigest()
        
        return hashed_key
    
    async def create_api_key(self, brand_id: Any, key_data: Dict[str, Any], created_by: Any) -> Dict[str, Any]:
        """Create a new API key.
        
        Args:
            brand_id: The brand ID
            key_data: API key configuration data
            created_by: User ID of the creator
            
        Returns:
            Dict containing the creation result
        """
        # Validate required fields
        if "key_name" not in key_data:
            return {"status": "error", "message": "API key name is required"}
        
        # Validate scopes if provided
        if "scopes" in key_data:
            for scope in key_data["scopes"]:
                if scope not in self.supported_scopes:
                    return {
                        "status": "error", 
                        "message": f"Unsupported scope: {scope}",
                        "supported_scopes": self.supported_scopes
                    }
        
        # Generate new API key and salt
        api_key_value, api_key_salt = self._generate_api_key()
        
        # Hash the API key for storage
        hashed_key = self._hash_api_key(api_key_value, api_key_salt)
        
        # Create API key in database
        try:
            with get_db() as db:
                # Create API key object
                api_key = ApiKey(
                    brand_id=brand_id,
                    key_name=key_data["key_name"],
                    api_key=hashed_key,
                    api_key_salt=api_key_salt,
                    scopes=key_data.get("scopes", self.supported_scopes),
                    created_by=created_by,
                    rate_limit=key_data.get("rate_limit", 60),
                    is_active=True,
                    expires_at=key_data.get("expires_at")
                )
                
                db.add(api_key)
                db.commit()
                db.refresh(api_key)
                
                # Return API key data
                return {
                    "status": "success",
                    "message": "API key created successfully",
                    "api_key": {
                        "id": api_key.id,
                        "key": api_key_value,  # This is the only time the unhashed key is returned
                        "key_name": api_key.key_name,
                        "scopes": api_key.scopes,
                        "rate_limit": api_key.rate_limit,
                        "expires_at": api_key.expires_at.isoformat() if api_key.expires_at else None,
                        "created_at": api_key.created_at.isoformat() if api_key.created_at else None
                    }
                }
        except SQLAlchemyError as e:
            logger.error(f"Database error creating API key: {e}")
            return {"status": "error", "message": f"Database error: {str(e)}"}
        except Exception as e:
            logger.error(f"Error creating API key: {e}")
            return {"status": "error", "message": f"Error creating API key: {str(e)}"}
    
    async def get_api_keys_for_brand(self, brand_id: Any) -> List[Dict[str, Any]]:
        """Get all API keys for a brand.
        
        Args:
            brand_id: The brand ID
            
        Returns:
            List of API keys (without the actual key values)
        """
        try:
            with get_db() as db:
                api_keys = db.query(ApiKey).filter(
                    ApiKey.brand_id == brand_id
                ).all()
                
                key_list = []
                for key in api_keys:
                    key_list.append({
                        "id": key.id,
                        "key_name": key.key_name,
                        "scopes": key.scopes,
                        "rate_limit": key.rate_limit,
                        "is_active": key.is_active,
                        "expires_at": key.expires_at.isoformat() if key.expires_at else None,
                        "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None,
                        "created_at": key.created_at.isoformat() if key.created_at else None,
                        "created_by": key.created_by
                    })
                
                return key_list
        except Exception as e:
            logger.error(f"Error getting API keys for brand {brand_id}: {e}")
            return []
    
    async def update_api_key(self, key_id: Any, key_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing API key.
        
        Args:
            key_id: The API key ID
            key_data: Updated API key configuration data
            
        Returns:
            Dict containing the update result
        """
        try:
            with get_db() as db:
                # Get existing API key
                api_key = db.query(ApiKey).filter(ApiKey.id == key_id).first()
                
                if not api_key:
                    return {"status": "error", "message": "API key not found"}
                
                # Update fields if provided
                if "key_name" in key_data:
                    api_key.key_name = key_data["key_name"]
                
                if "scopes" in key_data:
                    # Validate scopes
                    for scope in key_data["scopes"]:
                        if scope not in self.supported_scopes:
                            return {
                                "status": "error", 
                                "message": f"Unsupported scope: {scope}",
                                "supported_scopes": self.supported_scopes
                            }
                    
                    api_key.scopes = key_data["scopes"]
                
                if "rate_limit" in key_data:
                    api_key.rate_limit = key_data["rate_limit"]
                
                if "is_active" in key_data:
                    api_key.is_active = key_data["is_active"]
                
                if "expires_at" in key_data:
                    api_key.expires_at = key_data["expires_at"]
                
                # Update timestamp
                api_key.updated_at = datetime.now()
                
                db.commit()
                
                # Return updated API key data
                return {
                    "status": "success",
                    "message": "API key updated successfully",
                    "api_key": {
                        "id": api_key.id,
                        "key_name": api_key.key_name,
                        "scopes": api_key.scopes,
                        "rate_limit": api_key.rate_limit,
                        "is_active": api_key.is_active,
                        "expires_at": api_key.expires_at.isoformat() if api_key.expires_at else None,
                        "updated_at": api_key.updated_at.isoformat() if api_key.updated_at else None
                    }
                }
        except SQLAlchemyError as e:
            logger.error(f"Database error updating API key: {e}")
            return {"status": "error", "message": f"Database error: {str(e)}"}
        except Exception as e:
            logger.error(f"Error updating API key: {e}")
            return {"status": "error", "message": f"Error updating API key: {str(e)}"}
    
    async def delete_api_key(self, key_id: Any) -> Dict[str, Any]:
        """Delete an API key.
        
        Args:
            key_id: The API key ID
            
        Returns:
            Dict containing the deletion result
        """
        try:
            with get_db() as db:
                # Get existing API key
                api_key = db.query(ApiKey).filter(ApiKey.id == key_id).first()
                
                if not api_key:
                    return {"status": "error", "message": "API key not found"}
                
                # Delete the API key
                db.delete(api_key)
                db.commit()
                
                return {
                    "status": "success",
                    "message": "API key deleted successfully"
                }
        except SQLAlchemyError as e:
            logger.error(f"Database error deleting API key: {e}")
            return {"status": "error", "message": f"Database error: {str(e)}"}
        except Exception as e:
            logger.error(f"Error deleting API key: {e}")
            return {"status": "error", "message": f"Error deleting API key: {str(e)}"}
    
    async def validate_api_key(self, api_key_value: str, required_scope: Optional[str] = None) -> Dict[str, Any]:
        """Validate an API key and check its permissions.
        
        Args:
            api_key_value: The API key to validate
            required_scope: Optional scope that is required for the operation
            
        Returns:
            Dict containing validation result with brand_id if valid
        """
        # Check cache first for better performance
        cache_key = f"{self.cache_prefix}:validation:{api_key_value}"
        if self.cache:
            cached_result = self.cache.get(cache_key)
            if cached_result:
                try:
                    cached_data = json.loads(cached_result)
                    
                    # If a specific scope is required, check it
                    if required_scope and required_scope not in cached_data.get("scopes", []):
                        return {
                            "status": "error",
                            "message": f"API key doesn't have the required scope: {required_scope}"
                        }
                    
                    return cached_data
                except Exception as e:
                    logger.error(f"Error parsing cached API key validation: {e}")
        
        # If not in cache, validate against database
        try:
            with get_db() as db:
                # Find all API keys to check against (inefficient but necessary
                # since we only have the unhashed key)
                api_keys = db.query(ApiKey).filter(
                    ApiKey.is_active == True
                ).all()
                
                # Check each API key
                for key in api_keys:
                    # Hash the provided key with the stored salt
                    hashed_key = self._hash_api_key(api_key_value, key.api_key_salt)
                    
                    # Compare the hashed keys
                    if hashed_key == key.api_key:
                        # Check if the key is expired
                        if key.expires_at and key.expires_at < datetime.now():
                            return {
                                "status": "error",
                                "message": "API key has expired"
                            }
                        
                        # Check if the key has the required scope
                        if required_scope and required_scope not in key.scopes:
                            return {
                                "status": "error",
                                "message": f"API key doesn't have the required scope: {required_scope}"
                            }
                        
                        # Update last used timestamp
                        key.last_used_at = datetime.now()
                        db.commit()
                        
                        # Create validation result
                        validation_result = {
                            "status": "success",
                            "brand_id": key.brand_id,
                            "key_id": key.id,
                            "scopes": key.scopes,
                            "rate_limit": key.rate_limit
                        }
                        
                        # Cache the result
                        if self.cache:
                            self.cache.set(
                                cache_key,
                                json.dumps(validation_result),
                                ex=self.cache_ttl
                            )
                        
                        return validation_result
                
                # If we reached here, the key wasn't found
                return {
                    "status": "error",
                    "message": "Invalid API key"
                }
        except Exception as e:
            logger.error(f"Error validating API key: {e}")
            return {
                "status": "error",
                "message": f"Error validating API key: {str(e)}"
            }
    
    async def check_rate_limit(self, api_key_value: str, increment: bool = True) -> Dict[str, Any]:
        """Check if an API key has exceeded its rate limit.
        
        Args:
            api_key_value: The API key to check
            increment: Whether to increment the counter if not exceeded
            
        Returns:
            Dict containing rate limit check result
        """
        # Validate the API key first
        validation_result = await self.validate_api_key(api_key_value)
        
        if validation_result["status"] != "success":
            return validation_result
        
        # Get key ID and rate limit
        key_id = validation_result["key_id"]
        rate_limit = validation_result["rate_limit"]
        
        # Check rate limit using cache
        if self.cache:
            rate_limit_key = f"{self.cache_prefix}:rate_limit:{key_id}"
            current_minute = int(time.time() / 60)
            minute_key = f"{rate_limit_key}:{current_minute}"
            
            # Get current request count
            count = self.cache.get(minute_key)
            count = int(count) if count else 0
            
            # Check if limit exceeded
            if count >= rate_limit:
                return {
                    "status": "error",
                    "message": "Rate limit exceeded",
                    "limit": rate_limit,
                    "current": count,
                    "reset_after": 60 - int(time.time() % 60)  # Seconds until reset
                }
            
            # Increment counter if not exceeded and increment is True
            if increment:
                pipe = self.cache.pipeline()
                pipe.incr(minute_key)
                pipe.expire(minute_key, 120)  # 2-minute expiry for cleanup
                pipe.execute()
            
            return {
                "status": "success",
                "limit": rate_limit,
                "current": count + (1 if increment else 0),
                "remaining": rate_limit - count - (1 if increment else 0),
                "reset_after": 60 - int(time.time() % 60)  # Seconds until reset
            }
        else:
            # If no cache is available, allow all requests
            # (not recommended for production)
            return {
                "status": "success",
                "message": "Rate limiting not enabled (no cache)",
                "limit": rate_limit,
                "remaining": rate_limit
            }