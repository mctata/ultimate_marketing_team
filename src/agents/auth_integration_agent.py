from typing import Dict, Any, List, Optional
from loguru import logger
import requests
import json
import time
from urllib.parse import urlencode

from src.ultimate_marketing_team.agents.base_agent import BaseAgent

class AuthIntegrationAgent(BaseAgent):
    """Agent responsible for authentication and platform integrations.
    
    This agent handles user authentication through social platforms, set up and
    maintain connections with content management systems (CMS) and ad platforms,
    and continuously monitor the health of all integrations. It implements
    OAuth flows, secure token storage, and automated refresh processes.
    """
    
    def __init__(self, agent_id: str, name: str, **kwargs):
        super().__init__(agent_id, name)
        self.integration_check_interval = kwargs.get("integration_check_interval", 3600)  # Default: 1 hour
        self.integration_health_cache_key = "integration_health"
        self.oauth_tokens_cache_prefix = "oauth_tokens"
        self.enable_audit_trails = kwargs.get("enable_audit_trails", True)
        
        # Start integration health monitoring
        self._start_integration_health_monitoring()
    
    def _initialize(self):
        super()._initialize()
        
        # Register task handlers
        self.register_task_handler("user_authentication_task", self.handle_user_authentication)
        self.register_task_handler("platform_integration_setup_task", self.handle_platform_integration_setup)
        self.register_task_handler("integration_health_check_task", self.handle_integration_health_check)
        self.register_task_handler("refresh_oauth_token_task", self.handle_refresh_oauth_token)
        self.register_task_handler("get_integration_status_task", self.handle_get_integration_status)
        
        # Register event handlers
        self.register_event_handler("integration_failure", self._handle_integration_failure)
    
    def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process a generic task assigned to this agent."""
        task_type = task.get("task_type")
        logger.warning(f"Using generic task processing for task type: {task_type}")
        
        # Return error for unhandled task types
        return {
            "status": "error",
            "error": f"Unhandled task type: {task_type}"
        }
    
    def handle_user_authentication(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle user authentication through social platforms."""
        auth_provider = task.get("auth_provider")  # e.g., google, facebook, twitter
        auth_code = task.get("auth_code")
        redirect_uri = task.get("redirect_uri")
        
        # Log the authentication attempt
        logger.info(f"Processing authentication with provider: {auth_provider}")
        
        if not auth_provider or not auth_code:
            return {
                "status": "error",
                "error": "Missing required authentication parameters"
            }
        
        try:
            # Perform OAuth token exchange
            token_data = self._exchange_auth_code_for_token(auth_provider, auth_code, redirect_uri)
            
            if not token_data or "access_token" not in token_data:
                return {
                    "status": "error",
                    "error": "Failed to obtain access token"
                }
            
            # Extract user info from the token
            user_info = self._get_user_info_from_provider(auth_provider, token_data["access_token"])
            
            # Store tokens securely in cache with expiration
            self._store_oauth_tokens(auth_provider, user_info["user_id"], token_data)
            
            # Record audit trail if enabled
            if self.enable_audit_trails:
                self._record_audit_trail(
                    action="user_authenticated",
                    user_id=user_info["user_id"],
                    details={
                        "auth_provider": auth_provider,
                        "email": user_info.get("email"),
                        "timestamp": time.time()
                    }
                )
            
            # Broadcast successful authentication event
            self.broadcast_event({
                "event_type": "user_authenticated",
                "user_id": user_info["user_id"],
                "auth_provider": auth_provider
            })
            
            return {
                "status": "success",
                "message": f"Authentication successful with {auth_provider}",
                "user_id": user_info["user_id"],
                "user_info": user_info,
                "token": {
                    "access_token": token_data["access_token"],
                    "expires_in": token_data.get("expires_in", 3600),
                    "token_type": token_data.get("token_type", "Bearer")
                }
            }
        except Exception as e:
            logger.error(f"Authentication error with {auth_provider}: {e}")
            return {
                "status": "error",
                "error": f"Authentication failed: {str(e)}",
                "auth_provider": auth_provider
            }
    
    def _exchange_auth_code_for_token(self, provider: str, auth_code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for OAuth tokens."""
        # TODO: Implement actual token exchange with providers
        # Mock implementation for testing
        logger.info(f"Exchanging auth code for token with provider: {provider}")
        
        # In a real implementation, this would make API calls to the respective OAuth providers
        mock_token_data = {
            "access_token": f"mock_access_token_{provider}_{int(time.time())}",
            "refresh_token": f"mock_refresh_token_{provider}_{int(time.time())}",
            "expires_in": 3600,
            "token_type": "Bearer",
            "scope": "profile email"
        }
        
        return mock_token_data
    
    def _get_user_info_from_provider(self, provider: str, access_token: str) -> Dict[str, Any]:
        """Get user information from auth provider using access token."""
        # TODO: Implement actual user info retrieval from providers
        # Mock implementation for testing
        logger.info(f"Getting user info from provider: {provider} with token: {access_token[:10]}...")
        
        # In a real implementation, this would make API calls to get user profile data
        mock_user_data = {
            "user_id": f"user_{int(time.time())}",
            "email": f"user_{int(time.time())}@example.com",
            "name": "Test User",
            "profile_picture": f"https://example.com/profile_{int(time.time())}.jpg",
            "provider": provider
        }
        
        return mock_user_data
    
    def _store_oauth_tokens(self, provider: str, user_id: str, token_data: Dict[str, Any]):
        """Store OAuth tokens securely in cache with proper expiration."""
        cache_key = f"{self.oauth_tokens_cache_prefix}:{provider}:{user_id}"
        
        # Set expiration based on token expiry time
        expiration = token_data.get("expires_in", 3600)
        
        # Add timestamp for refresh calculations
        token_data["stored_at"] = time.time()
        
        # Store in Redis cache with expiration
        self.cache.set(cache_key, json.dumps(token_data), expiration)
        logger.debug(f"Stored OAuth tokens for user {user_id} with provider {provider}")
    
    def _get_stored_oauth_tokens(self, provider: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve stored OAuth tokens for a user and provider."""
        cache_key = f"{self.oauth_tokens_cache_prefix}:{provider}:{user_id}"
        
        # Get from Redis cache
        token_data_str = self.cache.get(cache_key)
        
        if not token_data_str:
            return None
            
        try:
            return json.loads(token_data_str)
        except json.JSONDecodeError:
            logger.error(f"Failed to decode token data for user {user_id} with provider {provider}")
            return None
    
    def handle_platform_integration_setup(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle setup of platform integrations for CMS and ad platforms."""
        platform_type = task.get("platform_type")  # e.g., wordpress, shopify, facebook_ads, google_ads
        credentials = task.get("credentials", {})
        brand_id = task.get("brand_id")
        user_id = task.get("user_id")
        
        # Log the integration setup attempt
        logger.info(f"Setting up integration for platform: {platform_type} for brand {brand_id}")
        
        if not platform_type or not credentials or not brand_id:
            return {
                "status": "error",
                "error": "Missing required integration parameters"
            }
        
        try:
            # Validate credentials with the platform
            validation_result = self._validate_platform_credentials(platform_type, credentials)
            
            if not validation_result["valid"]:
                return {
                    "status": "error",
                    "error": f"Invalid credentials for {platform_type}: {validation_result['message']}"
                }
            
            # Store integration credentials securely
            integration_id = self._store_integration_credentials(platform_type, brand_id, credentials)
            
            # Record audit trail if enabled
            if self.enable_audit_trails:
                self._record_audit_trail(
                    action="integration_setup",
                    user_id=user_id,
                    details={
                        "platform_type": platform_type,
                        "brand_id": brand_id,
                        "integration_id": integration_id
                    }
                )
            
            # Perform initial health check
            health_status = self._check_integration_health(platform_type, integration_id, credentials)
            
            # Broadcast integration setup event
            self.broadcast_event({
                "event_type": "integration_setup",
                "platform_type": platform_type,
                "brand_id": brand_id,
                "integration_id": integration_id,
                "health_status": health_status["status"]
            })
            
            return {
                "status": "success",
                "message": f"Integration with {platform_type} setup successfully",
                "integration_id": integration_id,
                "health_status": health_status
            }
        except Exception as e:
            logger.error(f"Integration setup error with {platform_type}: {e}")
            return {
                "status": "error",
                "error": f"Integration setup failed: {str(e)}",
                "platform_type": platform_type
            }
    
    def _validate_platform_credentials(self, platform_type: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Validate credentials with the platform API."""
        # TODO: Implement actual validation with platform APIs
        # Mock implementation for testing
        logger.info(f"Validating credentials for platform: {platform_type}")
        
        # In a real implementation, this would make API calls to validate credentials
        return {
            "valid": True,
            "message": "Credentials validated successfully",
            "details": {
                "account_id": f"acc_{platform_type}_{int(time.time())}",
                "scope": ["read", "write"]
            }
        }
    
    def _store_integration_credentials(self, platform_type: str, brand_id: Any, credentials: Dict[str, Any]) -> str:
        """Store integration credentials securely."""
        # TODO: Implement actual credential storage in database
        # For now, return a mock integration ID
        integration_id = f"integration_{platform_type}_{brand_id}_{int(time.time())}"
        
        # Store basic metadata in cache for health checking
        cache_key = f"integration:{integration_id}"
        metadata = {
            "platform_type": platform_type,
            "brand_id": brand_id,
            "created_at": time.time(),
            "last_health_check": None,
            "health_status": "pending"
        }
        self.cache.set(cache_key, json.dumps(metadata))
        
        logger.info(f"Stored integration credentials for {platform_type}, brand {brand_id}")
        return integration_id
    
    def _check_integration_health(self, platform_type: str, integration_id: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Check health of a platform integration."""
        # TODO: Implement actual health checks with platform APIs
        # Mock implementation for testing
        logger.info(f"Checking health for integration: {integration_id} ({platform_type})")
        
        # In a real implementation, this would make API calls to check connection status
        health_status = {
            "status": "healthy",
            "timestamp": time.time(),
            "response_time_ms": 250,
            "details": {
                "api_rate_limit_remaining": 950,
                "api_calls_today": 50
            }
        }
        
        # Update health status in cache
        cache_key = f"integration:{integration_id}"
        metadata_str = self.cache.get(cache_key)
        if metadata_str:
            try:
                metadata = json.loads(metadata_str)
                metadata["last_health_check"] = time.time()
                metadata["health_status"] = health_status["status"]
                self.cache.set(cache_key, json.dumps(metadata))
            except json.JSONDecodeError:
                logger.error(f"Failed to decode metadata for integration {integration_id}")
        
        return health_status
    
    def _start_integration_health_monitoring(self):
        """Start background monitoring of integration health."""
        import threading
        
        def monitor_integrations():
            while self.is_running:
                try:
                    self.handle_integration_health_check({
                        "task_type": "integration_health_check_task",
                        "check_all": True
                    })
                except Exception as e:
                    logger.error(f"Error in integration health monitoring: {e}")
                
                # Sleep until next check interval
                time.sleep(self.integration_check_interval)
        
        # Start monitoring in a separate thread
        threading.Thread(target=monitor_integrations, daemon=True).start()
        logger.info(f"Started integration health monitoring (interval: {self.integration_check_interval}s)")
    
    def handle_integration_health_check(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle periodic health checks for platform integrations."""
        integration_id = task.get("integration_id")
        check_all = task.get("check_all", False)
        
        if check_all:
            # TODO: Implement retrieval of all integrations from database
            # Mock implementation for testing
            integrations = [
                {"id": "integration_wordpress_123_1714502400", "platform_type": "wordpress", "brand_id": 123},
                {"id": "integration_facebook_ads_123_1714502500", "platform_type": "facebook_ads", "brand_id": 123},
                {"id": "integration_google_ads_456_1714502600", "platform_type": "google_ads", "brand_id": 456}
            ]
            
            results = []
            for integration in integrations:
                # Get stored credentials (mock)
                credentials = self._get_integration_credentials(integration["id"])
                
                # Check health
                health_status = self._check_integration_health(
                    integration["platform_type"],
                    integration["id"],
                    credentials
                )
                
                results.append({
                    "integration_id": integration["id"],
                    "platform_type": integration["platform_type"],
                    "brand_id": integration["brand_id"],
                    "health_status": health_status
                })
                
                # If unhealthy, trigger failure event
                if health_status["status"] != "healthy":
                    self._handle_integration_failure({
                        "event_type": "integration_failure",
                        "integration_id": integration["id"],
                        "platform_type": integration["platform_type"],
                        "brand_id": integration["brand_id"],
                        "health_status": health_status
                    })
            
            # Update global health status in cache
            self.cache.set(
                self.integration_health_cache_key,
                json.dumps({
                    "last_check": time.time(),
                    "total": len(results),
                    "healthy": sum(1 for r in results if r["health_status"]["status"] == "healthy"),
                    "unhealthy": sum(1 for r in results if r["health_status"]["status"] != "healthy")
                })
            )
            
            return {
                "status": "success",
                "message": f"Checked health of {len(results)} integrations",
                "results": results
            }
        
        elif integration_id:
            # Get integration details (mock)
            # TODO: Implement retrieval from database
            integration = {
                "id": integration_id,
                "platform_type": integration_id.split("_")[1],
                "brand_id": integration_id.split("_")[2]
            }
            
            # Get stored credentials (mock)
            credentials = self._get_integration_credentials(integration_id)
            
            # Check health
            health_status = self._check_integration_health(
                integration["platform_type"],
                integration["id"],
                credentials
            )
            
            # If unhealthy, trigger failure event
            if health_status["status"] != "healthy":
                self._handle_integration_failure({
                    "event_type": "integration_failure",
                    "integration_id": integration["id"],
                    "platform_type": integration["platform_type"],
                    "brand_id": integration["brand_id"],
                    "health_status": health_status
                })
            
            return {
                "status": "success",
                "message": f"Checked health of integration {integration_id}",
                "integration_id": integration_id,
                "platform_type": integration["platform_type"],
                "brand_id": integration["brand_id"],
                "health_status": health_status
            }
        
        else:
            return {
                "status": "error",
                "error": "Missing integration_id or check_all parameter"
            }
    
    def _get_integration_credentials(self, integration_id: str) -> Dict[str, Any]:
        """Retrieve integration credentials."""
        # TODO: Implement actual credential retrieval from database
        # Mock implementation for testing
        return {
            "api_key": f"mock_api_key_{integration_id}",
            "api_secret": f"mock_api_secret_{integration_id}"
        }
    
    def _handle_integration_failure(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Handle integration failure events."""
        integration_id = event.get("integration_id")
        platform_type = event.get("platform_type")
        brand_id = event.get("brand_id")
        health_status = event.get("health_status", {})
        
        logger.warning(f"Integration failure detected: {integration_id} ({platform_type}) for brand {brand_id}")
        
        # Update integration status in database
        # TODO: Implement actual database update
        
        # Attempt to auto-repair if appropriate
        repair_result = self._attempt_integration_repair(integration_id, platform_type, health_status)
        
        # Notify brand owners if repair failed
        if not repair_result["repaired"]:
            # TODO: Implement actual notification
            logger.error(f"Failed to repair integration {integration_id}. Manual intervention required.")
        
        return {
            "status": "handled",
            "integration_id": integration_id,
            "repair_attempted": True,
            "repair_result": repair_result
        }
    
    def _attempt_integration_repair(self, integration_id: str, platform_type: str, health_status: Dict[str, Any]) -> Dict[str, Any]:
        """Attempt to automatically repair a failing integration."""
        # TODO: Implement actual repair logic based on platform type and error
        # Mock implementation for testing
        logger.info(f"Attempting to repair integration: {integration_id} ({platform_type})")
        
        # 80% success rate for testing
        import random
        success = random.random() > 0.2
        
        if success:
            logger.info(f"Successfully repaired integration: {integration_id}")
            return {
                "repaired": True,
                "message": "Integration automatically repaired",
                "repair_action": "token_refresh"
            }
        else:
            logger.warning(f"Failed to repair integration: {integration_id}")
            return {
                "repaired": False,
                "message": "Automatic repair failed, manual intervention required",
                "error": "API rate limit exceeded"
            }
    
    def handle_refresh_oauth_token(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle refresh of OAuth tokens before they expire."""
        provider = task.get("provider")
        user_id = task.get("user_id")
        
        if not provider or not user_id:
            return {
                "status": "error",
                "error": "Missing required parameters"
            }
        
        # Get stored tokens
        token_data = self._get_stored_oauth_tokens(provider, user_id)
        
        if not token_data or "refresh_token" not in token_data:
            return {
                "status": "error",
                "error": f"No valid refresh token found for user {user_id} with provider {provider}"
            }
        
        try:
            # Perform token refresh
            new_token_data = self._refresh_oauth_token(provider, token_data["refresh_token"])
            
            if not new_token_data or "access_token" not in new_token_data:
                return {
                    "status": "error",
                    "error": "Failed to refresh access token"
                }
            
            # Preserve refresh token if not provided in response
            if "refresh_token" not in new_token_data and "refresh_token" in token_data:
                new_token_data["refresh_token"] = token_data["refresh_token"]
            
            # Store updated tokens
            self._store_oauth_tokens(provider, user_id, new_token_data)
            
            # Record audit trail if enabled
            if self.enable_audit_trails:
                self._record_audit_trail(
                    action="token_refreshed",
                    user_id=user_id,
                    details={
                        "provider": provider,
                        "timestamp": time.time()
                    }
                )
            
            return {
                "status": "success",
                "message": f"Token refreshed for user {user_id} with provider {provider}",
                "token": {
                    "access_token": new_token_data["access_token"],
                    "expires_in": new_token_data.get("expires_in", 3600),
                    "token_type": new_token_data.get("token_type", "Bearer")
                }
            }
        except Exception as e:
            logger.error(f"Token refresh error for user {user_id} with provider {provider}: {e}")
            return {
                "status": "error",
                "error": f"Token refresh failed: {str(e)}",
                "provider": provider,
                "user_id": user_id
            }
    
    def _refresh_oauth_token(self, provider: str, refresh_token: str) -> Dict[str, Any]:
        """Refresh OAuth access token using refresh token."""
        # TODO: Implement actual token refresh with providers
        # Mock implementation for testing
        logger.info(f"Refreshing token for provider: {provider} using refresh token: {refresh_token[:10]}...")
        
        # In a real implementation, this would make API calls to the respective OAuth providers
        mock_token_data = {
            "access_token": f"mock_refreshed_token_{provider}_{int(time.time())}",
            "expires_in": 3600,
            "token_type": "Bearer",
            "scope": "profile email"
        }
        
        return mock_token_data
    
    def handle_get_integration_status(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle request for integration status."""
        integration_id = task.get("integration_id")
        brand_id = task.get("brand_id")
        
        # If integration_id is provided, get specific integration status
        if integration_id:
            # Get cached health status
            cache_key = f"integration:{integration_id}"
            metadata_str = self.cache.get(cache_key)
            
            if not metadata_str:
                return {
                    "status": "error",
                    "error": f"Integration not found: {integration_id}"
                }
            
            try:
                metadata = json.loads(metadata_str)
                
                # If health check is older than 1 hour, perform a new check
                if not metadata.get("last_health_check") or \
                   time.time() - metadata["last_health_check"] > 3600:
                    # Get credentials and perform health check
                    credentials = self._get_integration_credentials(integration_id)
                    health_status = self._check_integration_health(
                        metadata["platform_type"],
                        integration_id,
                        credentials
                    )
                    metadata["last_health_check"] = time.time()
                    metadata["health_status"] = health_status["status"]
                    self.cache.set(cache_key, json.dumps(metadata))
                    
                    return {
                        "status": "success",
                        "integration_id": integration_id,
                        "platform_type": metadata["platform_type"],
                        "brand_id": metadata["brand_id"],
                        "health_status": health_status
                    }
                else:
                    # Return cached status
                    return {
                        "status": "success",
                        "integration_id": integration_id,
                        "platform_type": metadata["platform_type"],
                        "brand_id": metadata["brand_id"],
                        "health_status": {
                            "status": metadata["health_status"],
                            "timestamp": metadata["last_health_check"]
                        }
                    }
            except json.JSONDecodeError:
                logger.error(f"Failed to decode metadata for integration {integration_id}")
                return {
                    "status": "error",
                    "error": "Invalid integration metadata"
                }
        
        # If brand_id is provided, get all integrations for that brand
        elif brand_id:
            # TODO: Implement retrieval of brand integrations from database
            # Mock implementation for testing
            integrations = [
                {"id": f"integration_wordpress_{brand_id}_1714502400", "platform_type": "wordpress"},
                {"id": f"integration_facebook_ads_{brand_id}_1714502500", "platform_type": "facebook_ads"}
            ]
            
            results = []
            for integration in integrations:
                # Get cached health status
                cache_key = f"integration:{integration['id']}"
                metadata_str = self.cache.get(cache_key)
                
                if metadata_str:
                    try:
                        metadata = json.loads(metadata_str)
                        results.append({
                            "integration_id": integration["id"],
                            "platform_type": integration["platform_type"],
                            "health_status": metadata["health_status"],
                            "last_health_check": metadata.get("last_health_check")
                        })
                    except json.JSONDecodeError:
                        logger.error(f"Failed to decode metadata for integration {integration['id']}")
                else:
                    # Use placeholder if not in cache
                    results.append({
                        "integration_id": integration["id"],
                        "platform_type": integration["platform_type"],
                        "health_status": "unknown",
                        "last_health_check": None
                    })
            
            return {
                "status": "success",
                "brand_id": brand_id,
                "integrations": results
            }
        
        # If neither is provided, get overall integration status
        else:
            # Get global health status from cache
            health_cache_str = self.cache.get(self.integration_health_cache_key)
            
            if health_cache_str:
                try:
                    health_data = json.loads(health_cache_str)
                    return {
                        "status": "success",
                        "overall_health": "healthy" if health_data.get("unhealthy", 0) == 0 else "issues",
                        "last_check": health_data.get("last_check"),
                        "total": health_data.get("total", 0),
                        "healthy": health_data.get("healthy", 0),
                        "unhealthy": health_data.get("unhealthy", 0)
                    }
                except json.JSONDecodeError:
                    logger.error("Failed to decode global health status")
            
            return {
                "status": "success",
                "overall_health": "unknown",
                "message": "No health data available"
            }
    
    def _record_audit_trail(self, action: str, user_id: Any, details: Dict[str, Any]):
        """Record an audit trail entry."""
        # TODO: Implement actual audit trail recording in database
        logger.info(f"AUDIT: {action} by user {user_id} - {details}")