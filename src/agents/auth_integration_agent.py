from typing import Dict, Any, List, Optional, Tuple
from loguru import logger
import requests
import json
import time
import os
import hmac
import hashlib
import base64
import datetime
from urllib.parse import urlencode, quote
from sqlalchemy.orm import Session
from threading import Thread, Event

from src.agents.base_agent import BaseAgent
from src.core.database import get_db
from src.core.security import encrypt_sensitive_data, decrypt_sensitive_data
from src.models.integration import SocialAccount, CMSAccount, AdAccount, IntegrationHealth

class AuthIntegrationAgent(BaseAgent):
    """Agent responsible for authentication and platform integrations.
    
    This agent handles user authentication through social platforms (Google, Facebook, LinkedIn),
    sets up and maintains connections with content management systems (WordPress, Shopify) 
    and ad platforms (Google Ads, Facebook Ads), and continuously monitors the health of all 
    integrations. It implements OAuth flows, secure token storage, and automated refresh processes.
    """
    
    def __init__(self, agent_id: str, name: str, **kwargs):
        super().__init__(agent_id, name)
        self.integration_check_interval = kwargs.get("integration_check_interval", 3600)  # Default: 1 hour
        self.integration_health_cache_key = "integration_health"
        self.oauth_tokens_cache_prefix = "oauth_tokens"
        self.enable_audit_trails = kwargs.get("enable_audit_trails", True)
        
        # Initialize health check monitoring thread
        self.health_check_interval = kwargs.get("health_check_interval", 3600)  # Check every hour by default
        self.health_check_thread = None
        self.health_check_stop_event = Event()
        
        # Start health monitoring automatically if enabled
        if kwargs.get("auto_start_monitoring", True):
            self.start_health_monitoring()
        
        # OAuth configuration
        self.oauth_config = {
            "google": {
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_id": os.getenv("GOOGLE_CLIENT_ID", ""),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET", ""),
                "scopes": [
                    "https://www.googleapis.com/auth/userinfo.profile",
                    "https://www.googleapis.com/auth/userinfo.email"
                ],
                "user_info_endpoint": "https://www.googleapis.com/oauth2/v3/userinfo"
            },
            "facebook": {
                "auth_uri": "https://www.facebook.com/v18.0/dialog/oauth",
                "token_uri": "https://graph.facebook.com/v18.0/oauth/access_token",
                "client_id": os.getenv("FACEBOOK_CLIENT_ID", ""),
                "client_secret": os.getenv("FACEBOOK_CLIENT_SECRET", ""),
                "scopes": [
                    "email", 
                    "public_profile",
                    "pages_manage_posts",
                    "pages_read_engagement",
                    "instagram_basic",
                    "instagram_content_publish"
                ],
                "user_info_endpoint": "https://graph.facebook.com/v18.0/me?fields=id,name,email,picture"
            },
            "linkedin": {
                "auth_uri": "https://www.linkedin.com/oauth/v2/authorization",
                "token_uri": "https://www.linkedin.com/oauth/v2/accessToken",
                "client_id": os.getenv("LINKEDIN_CLIENT_ID", ""),
                "client_secret": os.getenv("LINKEDIN_CLIENT_SECRET", ""),
                "scopes": [
                    "r_liteprofile", 
                    "r_emailaddress",
                    "w_member_social"
                ],
                "user_info_endpoint": "https://api.linkedin.com/v2/me"
            }
        }
        
        # Platform integration configuration
        self.integration_config = self._load_integration_config()
        
        # Start integration health monitoring
        self._start_integration_health_monitoring()
    
    def _load_integration_config(self) -> Dict[str, Any]:
        """Load integration configuration from configuration files or environment."""
        # In a production environment, this would load from a configuration file
        # For now, return a hardcoded configuration based on integrations.yaml
        return {
            "social_media": {
                "facebook": {
                    "api_version": "v18.0",
                    "rate_limits": {"requests_per_hour": 200, "posts_per_day": 25},
                    "error_handling": {"retry_attempts": 3, "retry_delay_seconds": 60}
                },
                "twitter": {
                    "api_version": "2.0",
                    "rate_limits": {"requests_per_hour": 300, "tweets_per_day": 50},
                    "error_handling": {"retry_attempts": 3, "retry_delay_seconds": 30}
                },
                "linkedin": {
                    "api_version": "v2",
                    "rate_limits": {"requests_per_hour": 100, "posts_per_day": 15},
                    "error_handling": {"retry_attempts": 3, "retry_delay_seconds": 120}
                }
            },
            "cms": {
                "wordpress": {
                    "api_version": "wp/v2",
                    "error_handling": {"retry_attempts": 3, "retry_delay_seconds": 30}
                },
                "shopify": {
                    "api_version": "2023-10",
                    "rate_limits": {"requests_per_minute": 40},
                    "error_handling": {"retry_attempts": 3, "retry_delay_seconds": 45}
                }
            },
            "advertising": {
                "google_ads": {
                    "api_version": "v14",
                    "error_handling": {"retry_attempts": 3, "retry_delay_seconds": 60}
                },
                "facebook_ads": {
                    "api_version": "v18.0",
                    "error_handling": {"retry_attempts": 3, "retry_delay_seconds": 45}
                }
            }
        }
    
    def _initialize(self):
        super()._initialize()
        
        # Register task handlers
        self.register_task_handler("user_authentication_task", self.handle_user_authentication)
        self.register_task_handler("create_oauth_url_task", self.handle_create_oauth_url)
        self.register_task_handler("platform_integration_setup_task", self.handle_platform_integration_setup)
        self.register_task_handler("integration_health_check_task", self.handle_integration_health_check)
        self.register_task_handler("refresh_oauth_token_task", self.handle_refresh_oauth_token)
        self.register_task_handler("get_integration_status_task", self.handle_get_integration_status)
        
        # Register event handlers
        self.register_event_handler("integration_failure", self._handle_integration_failure)
    
    def handle_create_oauth_url(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle creation of OAuth authorization URLs for initiating the auth flow."""
        provider = task.get("provider")
        redirect_uri = task.get("redirect_uri")
        state = task.get("state", "")
        scope = task.get("scope", [])
        
        if not provider or not redirect_uri:
            return {
                "status": "error",
                "error": "Missing required parameters (provider, redirect_uri)"
            }
        
        try:
            # Create OAuth URL
            oauth_url = self._create_oauth_authorization_url(provider, redirect_uri, state, scope)
            
            if not oauth_url:
                return {
                    "status": "error",
                    "error": f"Failed to create OAuth URL for provider: {provider}"
                }
            
            return {
                "status": "success",
                "provider": provider,
                "oauth_url": oauth_url
            }
        except Exception as e:
            logger.error(f"Error creating OAuth URL for {provider}: {e}")
            return {
                "status": "error",
                "error": str(e),
                "provider": provider
            }
    
    def _create_oauth_authorization_url(self, provider: str, redirect_uri: str, state: str = "", scope: List[str] = None) -> Optional[str]:
        """Create an OAuth authorization URL for the specified provider."""
        if provider not in self.oauth_config:
            logger.error(f"Unknown OAuth provider: {provider}")
            return None
        
        config = self.oauth_config[provider]
        
        # Use provided scopes or default from config
        if not scope or len(scope) == 0:
            scope = config["scopes"]
        
        # Generate a random state if not provided
        if not state:
            import uuid
            state = str(uuid.uuid4())
        
        # Build authorization URL based on provider
        if provider == "google":
            params = {
                "client_id": config["client_id"],
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": " ".join(scope),
                "access_type": "offline",  # Request refresh token
                "prompt": "consent",  # Force consent screen
                "state": state
            }
            return f"{config['auth_uri']}?{urlencode(params)}"
            
        elif provider == "facebook":
            params = {
                "client_id": config["client_id"],
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": ",".join(scope),
                "state": state
            }
            return f"{config['auth_uri']}?{urlencode(params)}"
            
        elif provider == "linkedin":
            params = {
                "client_id": config["client_id"],
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": " ".join(scope),
                "state": state
            }
            return f"{config['auth_uri']}?{urlencode(params)}"
        
        else:
            logger.error(f"OAuth URL generation not implemented for provider: {provider}")
            return None
    
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
        logger.info(f"Exchanging auth code for token with provider: {provider}")
        
        if provider not in self.oauth_config:
            logger.error(f"Unknown OAuth provider: {provider}")
            return {}
        
        config = self.oauth_config[provider]
        
        # Prepare token request
        token_request_params = {
            "client_id": config["client_id"],
            "client_secret": config["client_secret"],
            "code": auth_code,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        }
        
        # Special handling for LinkedIn
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        if provider == "linkedin":
            headers["Accept"] = "application/json"
        
        try:
            # Make the token request
            response = requests.post(
                config["token_uri"],
                headers=headers,
                data=token_request_params
            )
            
            # Handle response
            if response.status_code == 200:
                token_data = response.json()
                logger.info(f"Successfully obtained token for provider: {provider}")
                
                # Add expires_at timestamp for easier expiration checking
                if "expires_in" in token_data:
                    token_data["expires_at"] = time.time() + token_data["expires_in"]
                
                return token_data
            else:
                logger.error(f"Token exchange failed with {provider}: {response.status_code} - {response.text}")
                return {}
                
        except Exception as e:
            logger.error(f"Error during token exchange with {provider}: {e}")
            return {}
    
    def _get_user_info_from_provider(self, provider: str, access_token: str) -> Dict[str, Any]:
        """Get user information from auth provider using access token."""
        logger.info(f"Getting user info from provider: {provider}")
        
        if provider not in self.oauth_config:
            logger.error(f"Unknown OAuth provider: {provider}")
            return {"user_id": f"unknown_{int(time.time())}", "provider": provider}
        
        config = self.oauth_config[provider]
        
        # Set up headers with authorization
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Special handling for LinkedIn
        if provider == "linkedin":
            # LinkedIn requires additional API calls for email
            headers["Accept"] = "application/json"
            headers["X-Restli-Protocol-Version"] = "2.0.0"
        
        try:
            # Make request to user info endpoint
            response = requests.get(
                config["user_info_endpoint"],
                headers=headers
            )
            
            # Handle response
            if response.status_code == 200:
                user_data = response.json()
                
                # Normalize user data based on provider
                normalized_data = self._normalize_user_data(provider, user_data)
                logger.info(f"Successfully retrieved user info for provider: {provider}")
                return normalized_data
            else:
                logger.error(f"User info retrieval failed with {provider}: {response.status_code} - {response.text}")
                return {"user_id": f"error_{int(time.time())}", "provider": provider}
                
        except Exception as e:
            logger.error(f"Error retrieving user info from {provider}: {e}")
            return {"user_id": f"error_{int(time.time())}", "provider": provider}
    
    def _normalize_user_data(self, provider: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize user data from different providers into a standard format."""
        normalized = {
            "provider": provider,
            "raw_data": user_data
        }
        
        if provider == "google":
            normalized.update({
                "user_id": user_data.get("sub", ""),
                "email": user_data.get("email", ""),
                "name": user_data.get("name", ""),
                "profile_picture": user_data.get("picture", ""),
                "verified": user_data.get("email_verified", False)
            })
        
        elif provider == "facebook":
            normalized.update({
                "user_id": user_data.get("id", ""),
                "email": user_data.get("email", ""),
                "name": user_data.get("name", ""),
                "profile_picture": user_data.get("picture", {}).get("data", {}).get("url", "") if "picture" in user_data else "",
            })
        
        elif provider == "linkedin":
            # LinkedIn profile data is structured differently
            normalized.update({
                "user_id": user_data.get("id", ""),
                "name": f"{user_data.get('localizedFirstName', '')} {user_data.get('localizedLastName', '')}".strip(),
                "profile_picture": user_data.get("profilePicture", {}).get("displayImage", "") if "profilePicture" in user_data else ""
            })
            
            # LinkedIn requires separate API call for email which would be handled in a complete implementation
        
        return normalized
    
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
        logger.info(f"Validating credentials for platform: {platform_type}")
        
        # Determine platform category and specific platform
        platform_category = None
        specific_platform = None
        
        for category, platforms in self.integration_config.items():
            if platform_type in platforms:
                platform_category = category
                specific_platform = platform_type
                break
        
        if not platform_category:
            logger.error(f"Unknown platform type: {platform_type}")
            return {
                "valid": False,
                "message": f"Unknown platform type: {platform_type}"
            }
        
        # Validate credentials based on platform type
        try:
            if platform_category == "social_media":
                return self._validate_social_media_credentials(specific_platform, credentials)
            elif platform_category == "cms":
                return self._validate_cms_credentials(specific_platform, credentials)
            elif platform_category == "advertising":
                return self._validate_advertising_credentials(specific_platform, credentials)
            else:
                logger.warning(f"No validation method for platform category: {platform_category}")
                return {
                    "valid": False,
                    "message": f"No validation method for platform category: {platform_category}"
                }
        except Exception as e:
            logger.error(f"Error validating credentials for {platform_type}: {e}")
            return {
                "valid": False,
                "message": f"Validation failed: {str(e)}"
            }
    
    def _validate_social_media_credentials(self, platform: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Validate social media platform credentials."""
        if platform == "facebook":
            # Validate Facebook credentials with Graph API
            if "access_token" not in credentials:
                return {"valid": False, "message": "Missing access token"}
            
            try:
                response = requests.get(
                    f"https://graph.facebook.com/v18.0/me",
                    params={"access_token": credentials["access_token"]}
                )
                
                if response.status_code == 200:
                    user_data = response.json()
                    return {
                        "valid": True,
                        "message": "Facebook credentials validated successfully",
                        "details": {
                            "account_id": user_data.get("id"),
                            "name": user_data.get("name"),
                            "scope": ["read", "write"]
                        }
                    }
                else:
                    return {
                        "valid": False,
                        "message": f"Facebook validation failed: {response.status_code} - {response.text}"
                    }
            except Exception as e:
                logger.error(f"Error validating Facebook credentials: {e}")
                return {"valid": False, "message": str(e)}
                
        elif platform == "twitter":
            # Validate Twitter credentials with Twitter API
            if "access_token" not in credentials or "access_token_secret" not in credentials:
                return {"valid": False, "message": "Missing access token or secret"}
            
            try:
                # Twitter API v2 requires OAuth 1.0a for some endpoints
                # This is a simplified version - real implementation would use proper OAuth 1.0a
                headers = {
                    "Authorization": f"Bearer {credentials['access_token']}"
                }
                
                response = requests.get(
                    "https://api.twitter.com/2/users/me",
                    headers=headers
                )
                
                if response.status_code == 200:
                    user_data = response.json()
                    return {
                        "valid": True,
                        "message": "Twitter credentials validated successfully",
                        "details": {
                            "account_id": user_data.get("data", {}).get("id"),
                            "username": user_data.get("data", {}).get("username"),
                            "scope": ["tweet.read", "tweet.write", "users.read"]
                        }
                    }
                else:
                    return {
                        "valid": False,
                        "message": f"Twitter validation failed: {response.status_code} - {response.text}"
                    }
            except Exception as e:
                logger.error(f"Error validating Twitter credentials: {e}")
                return {"valid": False, "message": str(e)}
                
        elif platform == "linkedin":
            # Validate LinkedIn credentials
            if "access_token" not in credentials:
                return {"valid": False, "message": "Missing access token"}
            
            try:
                headers = {
                    "Authorization": f"Bearer {credentials['access_token']}",
                    "X-Restli-Protocol-Version": "2.0.0"
                }
                
                response = requests.get(
                    "https://api.linkedin.com/v2/me",
                    headers=headers
                )
                
                if response.status_code == 200:
                    profile_data = response.json()
                    return {
                        "valid": True,
                        "message": "LinkedIn credentials validated successfully",
                        "details": {
                            "account_id": profile_data.get("id"),
                            "name": f"{profile_data.get('localizedFirstName', '')} {profile_data.get('localizedLastName', '')}",
                            "scope": ["r_liteprofile", "r_emailaddress", "w_member_social"]
                        }
                    }
                else:
                    return {
                        "valid": False,
                        "message": f"LinkedIn validation failed: {response.status_code} - {response.text}"
                    }
            except Exception as e:
                logger.error(f"Error validating LinkedIn credentials: {e}")
                return {"valid": False, "message": str(e)}
        
        else:
            return {"valid": False, "message": f"Unsupported social media platform: {platform}"}
    
    def _validate_cms_credentials(self, platform: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Validate CMS platform credentials."""
        if platform == "wordpress":
            # Validate WordPress credentials with WP REST API
            if "url" not in credentials or "username" not in credentials or "password" not in credentials:
                return {"valid": False, "message": "Missing required WordPress credentials"}
            
            try:
                # WordPress REST API requires Basic Auth or OAuth
                # This uses basic auth for simplicity
                from base64 import b64encode
                
                auth_str = f"{credentials['username']}:{credentials['password']}"
                auth_header = b64encode(auth_str.encode()).decode()
                
                headers = {
                    "Authorization": f"Basic {auth_header}"
                }
                
                # Normalize URL
                api_url = credentials["url"]
                if not api_url.endswith("/"):
                    api_url += "/"
                if not api_url.endswith("wp-json/"):
                    api_url += "wp-json/"
                
                response = requests.get(
                    f"{api_url}wp/v2/users/me",
                    headers=headers
                )
                
                if response.status_code == 200:
                    user_data = response.json()
                    return {
                        "valid": True,
                        "message": "WordPress credentials validated successfully",
                        "details": {
                            "account_id": user_data.get("id"),
                            "username": user_data.get("username"),
                            "site_url": credentials["url"],
                            "capabilities": user_data.get("capabilities", {})
                        }
                    }
                else:
                    return {
                        "valid": False,
                        "message": f"WordPress validation failed: {response.status_code} - {response.text}"
                    }
            except Exception as e:
                logger.error(f"Error validating WordPress credentials: {e}")
                return {"valid": False, "message": str(e)}
                
        elif platform == "shopify":
            # Validate Shopify credentials
            if "shop_url" not in credentials or "access_token" not in credentials:
                return {"valid": False, "message": "Missing required Shopify credentials"}
            
            try:
                headers = {
                    "X-Shopify-Access-Token": credentials["access_token"],
                    "Content-Type": "application/json"
                }
                
                # Normalize shop URL
                shop_url = credentials["shop_url"]
                if not shop_url.startswith("https://"):
                    shop_url = f"https://{shop_url}"
                if shop_url.endswith("/"):
                    shop_url = shop_url[:-1]
                
                response = requests.get(
                    f"{shop_url}/admin/api/2023-10/shop.json",
                    headers=headers
                )
                
                if response.status_code == 200:
                    shop_data = response.json().get("shop", {})
                    return {
                        "valid": True,
                        "message": "Shopify credentials validated successfully",
                        "details": {
                            "account_id": shop_data.get("id"),
                            "shop_name": shop_data.get("name"),
                            "shop_url": shop_data.get("domain"),
                            "plan_name": shop_data.get("plan_name")
                        }
                    }
                else:
                    return {
                        "valid": False,
                        "message": f"Shopify validation failed: {response.status_code} - {response.text}"
                    }
            except Exception as e:
                logger.error(f"Error validating Shopify credentials: {e}")
                return {"valid": False, "message": str(e)}
        
        else:
            return {"valid": False, "message": f"Unsupported CMS platform: {platform}"}
    
    def _validate_advertising_credentials(self, platform: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Validate advertising platform credentials."""
        if platform == "google_ads":
            # Validate Google Ads credentials
            if "developer_token" not in credentials or "client_id" not in credentials or "refresh_token" not in credentials:
                return {"valid": False, "message": "Missing required Google Ads credentials"}
            
            try:
                # Google Ads API requires OAuth 2.0
                # First, refresh the access token
                refresh_params = {
                    "client_id": credentials["client_id"],
                    "client_secret": credentials.get("client_secret", ""),
                    "refresh_token": credentials["refresh_token"],
                    "grant_type": "refresh_token"
                }
                
                token_response = requests.post(
                    "https://oauth2.googleapis.com/token",
                    data=refresh_params
                )
                
                if token_response.status_code != 200:
                    return {
                        "valid": False,
                        "message": f"Failed to refresh Google Ads token: {token_response.status_code} - {token_response.text}"
                    }
                
                access_token = token_response.json().get("access_token")
                
                # Now validate with Google Ads API
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "developer-token": credentials["developer_token"]
                }
                
                # This is a simplified version - real implementation would use Google Ads API client
                customer_id = credentials.get("customer_id", "")
                if customer_id:
                    response = requests.get(
                        f"https://googleads.googleapis.com/v14/customers/{customer_id}/googleAds:search",
                        headers=headers,
                        params={"query": "SELECT customer.id FROM customer LIMIT 1"}
                    )
                    
                    if response.status_code == 200:
                        return {
                            "valid": True,
                            "message": "Google Ads credentials validated successfully",
                            "details": {
                                "customer_id": customer_id,
                                "scope": ["CAMPAIGN_MANAGEMENT", "ACCOUNT_MANAGEMENT", "REPORTING"]
                            }
                        }
                    else:
                        return {
                            "valid": False,
                            "message": f"Google Ads validation failed: {response.status_code} - {response.text}"
                        }
                else:
                    # If no customer ID is provided, we'll consider it valid if we could refresh the token
                    return {
                        "valid": True,
                        "message": "Google Ads OAuth credentials validated successfully",
                        "details": {
                            "customer_id": None,
                            "scope": ["CAMPAIGN_MANAGEMENT", "ACCOUNT_MANAGEMENT", "REPORTING"]
                        }
                    }
            except Exception as e:
                logger.error(f"Error validating Google Ads credentials: {e}")
                return {"valid": False, "message": str(e)}
                
        elif platform == "facebook_ads":
            # Validate Facebook Ads credentials
            if "access_token" not in credentials:
                return {"valid": False, "message": "Missing required Facebook Ads credentials"}
            
            try:
                params = {
                    "access_token": credentials["access_token"],
                    "fields": "id,name"
                }
                
                # If ad account ID is provided, validate it specifically
                if "ad_account_id" in credentials:
                    ad_account_id = credentials["ad_account_id"]
                    # Ensure ad account ID has 'act_' prefix
                    if not ad_account_id.startswith("act_"):
                        ad_account_id = f"act_{ad_account_id}"
                    
                    response = requests.get(
                        f"https://graph.facebook.com/v18.0/{ad_account_id}",
                        params=params
                    )
                    
                    if response.status_code == 200:
                        account_data = response.json()
                        return {
                            "valid": True,
                            "message": "Facebook Ads credentials validated successfully",
                            "details": {
                                "account_id": account_data.get("id", "").replace("act_", ""),
                                "account_name": account_data.get("name"),
                                "scope": ["ads_management", "ads_read"]
                            }
                        }
                    else:
                        return {
                            "valid": False,
                            "message": f"Facebook Ads validation failed: {response.status_code} - {response.text}"
                        }
                else:
                    # If no specific ad account ID, check for ad accounts the user has access to
                    response = requests.get(
                        "https://graph.facebook.com/v18.0/me/adaccounts",
                        params=params
                    )
                    
                    if response.status_code == 200:
                        accounts_data = response.json().get("data", [])
                        
                        if not accounts_data:
                            return {
                                "valid": False,
                                "message": "No ad accounts found for this access token"
                            }
                        
                        return {
                            "valid": True,
                            "message": "Facebook Ads credentials validated successfully",
                            "details": {
                                "account_count": len(accounts_data),
                                "accounts": [{"id": acct.get("id", "").replace("act_", ""), "name": acct.get("name")} for acct in accounts_data[:5]],
                                "scope": ["ads_management", "ads_read"]
                            }
                        }
                    else:
                        return {
                            "valid": False,
                            "message": f"Facebook Ads validation failed: {response.status_code} - {response.text}"
                        }
            except Exception as e:
                logger.error(f"Error validating Facebook Ads credentials: {e}")
                return {"valid": False, "message": str(e)}
        
        else:
            return {"valid": False, "message": f"Unsupported advertising platform: {platform}"}
    
    def _store_integration_credentials(self, platform_type: str, brand_id: Any, credentials: Dict[str, Any]) -> int:
        """Store integration credentials securely in the database based on platform type.
        
        Now uses real database storage with proper encryption for sensitive data.
        """
        logger.info(f"Storing credentials for {platform_type}, brand {brand_id}")
        
        # Determine platform category
        platform_category = None
        for category, platforms in self.integration_config.items():
            if platform_type in platforms:
                platform_category = category
                break
        
        if not platform_category:
            logger.error(f"Unknown platform type: {platform_type}")
            raise ValueError(f"Unknown platform type: {platform_type}")
        
        integration_id = None
        
        with get_db() as db:
            try:
                if platform_category == "social_media":
                    # Store as SocialAccount with encrypted tokens
                    account = SocialAccount()
                    account.brand_id = brand_id
                    account.platform = platform_type
                    account.account_id = credentials.get("account_id", f"acc_{int(time.time())}")
                    account.account_name = credentials.get("account_name", "")
                    
                    # Encrypt access token
                    if access_token := credentials.get("access_token"):
                        encrypted_token, token_salt = encrypt_sensitive_data(access_token)
                        account.access_token = encrypted_token
                        account.access_token_salt = token_salt
                    
                    # Encrypt refresh token
                    if refresh_token := credentials.get("refresh_token"):
                        encrypted_refresh, refresh_salt = encrypt_sensitive_data(refresh_token)
                        account.refresh_token = encrypted_refresh
                        account.refresh_token_salt = refresh_salt
                    
                    # Set expiry time if provided
                    if "expires_in" in credentials:
                        expiry_time = datetime.datetime.now() + datetime.timedelta(seconds=credentials["expires_in"])
                        account.token_expires_at = expiry_time
                    
                    account.health_status = "pending"
                    db.add(account)
                    db.flush()  # Get the ID
                    integration_id = account.id
                    
                elif platform_category == "cms":
                    # Store as CMSAccount with encrypted credentials
                    cms = CMSAccount()
                    cms.brand_id = brand_id
                    cms.platform = platform_type
                    cms.site_url = credentials.get("url") or credentials.get("shop_url", "")
                    cms.username = credentials.get("username", "")
                    
                    # Encrypt API key
                    if api_key := credentials.get("api_key"):
                        encrypted_key, key_salt = encrypt_sensitive_data(api_key)
                        cms.api_key = encrypted_key
                        cms.api_key_salt = key_salt
                    
                    # Encrypt API secret
                    if api_secret := credentials.get("api_secret"):
                        encrypted_secret, secret_salt = encrypt_sensitive_data(api_secret)
                        cms.api_secret = encrypted_secret
                        cms.api_secret_salt = secret_salt
                    
                    # Encrypt password
                    if password := credentials.get("password"):
                        encrypted_password, password_salt = encrypt_sensitive_data(password)
                        cms.password = encrypted_password
                        cms.password_salt = password_salt
                    
                    cms.health_status = "pending"
                    db.add(cms)
                    db.flush()  # Get the ID
                    integration_id = cms.id
                    
                elif platform_category == "advertising":
                    # Store as AdAccount with encrypted credentials
                    ad = AdAccount()
                    ad.brand_id = brand_id
                    ad.platform = platform_type
                    ad.account_id = credentials.get("account_id") or credentials.get("customer_id", f"acc_{int(time.time())}")
                    
                    # Encrypt access token
                    if access_token := credentials.get("access_token"):
                        encrypted_token, token_salt = encrypt_sensitive_data(access_token)
                        ad.access_token = encrypted_token
                        ad.access_token_salt = token_salt
                    
                    # Encrypt refresh token
                    if refresh_token := credentials.get("refresh_token"):
                        encrypted_refresh, refresh_salt = encrypt_sensitive_data(refresh_token)
                        ad.refresh_token = encrypted_refresh
                        ad.refresh_token_salt = refresh_salt
                    
                    # For Google Ads, store additional fields with encryption
                    if platform_type == "google_ads":
                        if developer_token := credentials.get("developer_token"):
                            encrypted_dev_token, dev_token_salt = encrypt_sensitive_data(developer_token)
                            ad.developer_token = encrypted_dev_token
                            ad.developer_token_salt = dev_token_salt
                            
                        if client_id := credentials.get("client_id"):
                            encrypted_client_id, client_id_salt = encrypt_sensitive_data(client_id)
                            ad.client_id = encrypted_client_id
                            ad.client_id_salt = client_id_salt
                            
                        if client_secret := credentials.get("client_secret"):
                            encrypted_client_secret, client_secret_salt = encrypt_sensitive_data(client_secret)
                            ad.client_secret = encrypted_client_secret
                            ad.client_secret_salt = client_secret_salt
                    
                    # Set expiry time if provided
                    if "expires_in" in credentials:
                        expiry_time = datetime.datetime.now() + datetime.timedelta(seconds=credentials["expires_in"])
                        ad.token_expires_at = expiry_time
                    
                    ad.health_status = "pending"
                    db.add(ad)
                    db.flush()  # Get the ID
                    integration_id = ad.id
                
                # Also store the credential in cache for fast access (without sensitive info)
                metadata = {
                    "id": integration_id,
                    "platform_type": platform_type,
                    "platform_category": platform_category,
                    "brand_id": brand_id,
                    "created_at": time.time(),
                    "last_health_check": None,
                    "health_status": "pending"
                }
                metadata_cache_key = f"integration:{platform_category}:{integration_id}"
                self.cache.set(metadata_cache_key, json.dumps(metadata))
                
                logger.info(f"Successfully stored integration credentials for {platform_type}, brand {brand_id}, ID: {integration_id}")
                return integration_id
                
            except Exception as e:
                logger.error(f"Error storing integration credentials for {platform_type}: {e}")
                db.rollback()
                raise
    
    def _check_integration_health(self, platform_type: str, integration_id: Union[str, int], credentials: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check health of a platform integration by making an API call to verify connectivity.
        Stores results in database and cache.
        """
        logger.info(f"Checking health for integration: {integration_id} ({platform_type})")
        
        # Determine platform category
        platform_category = None
        for category, platforms in self.integration_config.items():
            if platform_type in platforms:
                platform_category = category
                break
        
        if not platform_category:
            logger.error(f"Unknown platform type: {platform_type}")
            return {
                "status": "unhealthy",
                "timestamp": time.time(),
                "error": "Unknown platform type"
            }
        
        # Convert string ID to integer if necessary for database operations
        db_id = None
        if isinstance(integration_id, int):
            db_id = integration_id
        elif isinstance(integration_id, str) and integration_id.isdigit():
            db_id = int(integration_id)
        
        try:
            # Start timer for response time measurement
            start_time = time.time()
            
            # Perform health check based on platform type
            health_result = {}
            
            if platform_category == "social_media":
                health_result = self._check_social_media_health(platform_type, credentials)
            elif platform_category == "cms":
                health_result = self._check_cms_health(platform_type, credentials)
            elif platform_category == "advertising":
                health_result = self._check_advertising_health(platform_type, credentials)
            else:
                health_result = {"status": "unhealthy", "error": f"No health check method for {platform_category}"}
            
            # Calculate response time
            response_time_ms = int((time.time() - start_time) * 1000)
            
            # Build the health status response
            health_status = {
                "status": health_result.get("status", "unhealthy"),
                "timestamp": time.time(),
                "response_time_ms": response_time_ms,
                "details": health_result.get("details", {})
            }
            
            # If there was an error, include it
            if "error" in health_result:
                health_status["error"] = health_result["error"]
            
            # Store health check result in both database and cache
            with get_db() as db:
                # 1. Update the health status in the appropriate account table
                if db_id is not None:
                    now = datetime.datetime.now()
                    status = health_status["status"]
                    
                    # Update the appropriate table based on platform category
                    if platform_category == "social_media":
                        account = db.query(SocialAccount).filter(SocialAccount.id == db_id).first()
                        if account:
                            account.health_status = status
                            account.last_health_check = now
                    elif platform_category == "cms":
                        cms = db.query(CMSAccount).filter(CMSAccount.id == db_id).first()
                        if cms:
                            cms.health_status = status
                            cms.last_health_check = now
                    elif platform_category == "advertising":
                        ad = db.query(AdAccount).filter(AdAccount.id == db_id).first()
                        if ad:
                            ad.health_status = status
                            ad.last_health_check = now
                    
                    # 2. Create a historical health check record
                    health_record = IntegrationHealth(
                        integration_type=platform_category,
                        integration_id=db_id,
                        check_time=now,
                        status=status,
                        response_time_ms=response_time_ms,
                        error_message=health_status.get("error"),
                        details=health_result.get("details", {})
                    )
                    db.add(health_record)
            
            # 3. Update cache for quick access
            # Update health status in cache
            cache_key = f"integration:{platform_category}:{integration_id}"
            metadata_str = self.cache.get(cache_key)
            if metadata_str:
                try:
                    metadata = json.loads(metadata_str)
                    metadata["last_health_check"] = time.time()
                    metadata["health_status"] = health_status["status"]
                    # Store the latest check result for reference
                    metadata["last_health_result"] = health_status
                    self.cache.set(cache_key, json.dumps(metadata))
                except json.JSONDecodeError:
                    logger.error(f"Failed to decode metadata for integration {integration_id}")
            
            return health_status
            
        except Exception as e:
            logger.error(f"Error during health check for {platform_type}: {e}")
            error_status = {
                "status": "unhealthy",
                "timestamp": time.time(),
                "error": str(e),
                "details": {
                    "exception_type": type(e).__name__
                }
            }
            
            # Store error status in database if we have a valid ID
            if db_id is not None:
                try:
                    with get_db() as db:
                        now = datetime.datetime.now()
                        
                        # Update the appropriate table
                        if platform_category == "social_media":
                            account = db.query(SocialAccount).filter(SocialAccount.id == db_id).first()
                            if account:
                                account.health_status = "unhealthy"
                                account.last_health_check = now
                        elif platform_category == "cms":
                            cms = db.query(CMSAccount).filter(CMSAccount.id == db_id).first()
                            if cms:
                                cms.health_status = "unhealthy"
                                cms.last_health_check = now
                        elif platform_category == "advertising":
                            ad = db.query(AdAccount).filter(AdAccount.id == db_id).first()
                            if ad:
                                ad.health_status = "unhealthy"
                                ad.last_health_check = now
                        
                        # Create a health check record with error
                        health_record = IntegrationHealth(
                            integration_type=platform_category,
                            integration_id=db_id,
                            check_time=now,
                            status="unhealthy",
                            response_time_ms=None,
                            error_message=str(e),
                            details={"exception_type": type(e).__name__}
                        )
                        db.add(health_record)
                except Exception as db_err:
                    logger.error(f"Failed to store health check error in database: {db_err}")
            
            # Update health status in cache to reflect the error
            cache_key = f"integration:{integration_id}"
            metadata_str = self.cache.get(cache_key)
            if metadata_str:
                try:
                    metadata = json.loads(metadata_str)
                    metadata["last_health_check"] = time.time()
                    metadata["health_status"] = "unhealthy"
                    metadata["last_health_result"] = error_status
                    self.cache.set(cache_key, json.dumps(metadata))
                except json.JSONDecodeError:
                    logger.error(f"Failed to decode metadata for integration {integration_id}")
            
            return error_status
    
    def _check_social_media_health(self, platform: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Check health of a social media platform integration."""
        if platform == "facebook":
            if "access_token" not in credentials:
                return {"status": "unhealthy", "error": "Missing access token"}
            
            try:
                # Check rate limits and account status with Graph API
                response = requests.get(
                    "https://graph.facebook.com/v18.0/me/insights",
                    params={"access_token": credentials["access_token"]}
                )
                
                if response.status_code == 200:
                    rate_limit_remaining = response.headers.get("x-app-usage", "{}")
                    try:
                        rate_limit_data = json.loads(rate_limit_remaining)
                    except json.JSONDecodeError:
                        rate_limit_data = {}
                    
                    return {
                        "status": "healthy",
                        "details": {
                            "api_rate_limit_remaining": rate_limit_data.get("call_count", 0),
                            "api_calls_quota": rate_limit_data.get("total_cputime", 0),
                            "rate_limited": rate_limit_data.get("rate_limit_reached", 0) == 1
                        }
                    }
                elif response.status_code == 401:
                    return {
                        "status": "unhealthy",
                        "error": "Authentication failed - token may be expired",
                        "details": {"auth_error": True}
                    }
                else:
                    return {
                        "status": "degraded",
                        "error": f"API error: {response.status_code}",
                        "details": {"response_text": response.text[:200]}
                    }
            except Exception as e:
                return {"status": "unhealthy", "error": str(e)}
        
        elif platform == "twitter":
            if "access_token" not in credentials:
                return {"status": "unhealthy", "error": "Missing access token"}
            
            try:
                headers = {
                    "Authorization": f"Bearer {credentials['access_token']}"
                }
                
                response = requests.get(
                    "https://api.twitter.com/2/users/me",
                    headers=headers
                )
                
                if response.status_code == 200:
                    # Check rate limits from headers
                    rate_limit_remaining = response.headers.get("x-rate-limit-remaining", "0")
                    rate_limit_limit = response.headers.get("x-rate-limit-limit", "0")
                    rate_limit_reset = response.headers.get("x-rate-limit-reset", "0")
                    
                    return {
                        "status": "healthy",
                        "details": {
                            "api_rate_limit_remaining": int(rate_limit_remaining),
                            "api_rate_limit_total": int(rate_limit_limit),
                            "api_rate_limit_reset": int(rate_limit_reset)
                        }
                    }
                elif response.status_code == 401:
                    return {
                        "status": "unhealthy",
                        "error": "Authentication failed - token may be expired",
                        "details": {"auth_error": True}
                    }
                else:
                    return {
                        "status": "degraded",
                        "error": f"API error: {response.status_code}",
                        "details": {"response_text": response.text[:200]}
                    }
            except Exception as e:
                return {"status": "unhealthy", "error": str(e)}
        
        elif platform == "linkedin":
            if "access_token" not in credentials:
                return {"status": "unhealthy", "error": "Missing access token"}
            
            try:
                headers = {
                    "Authorization": f"Bearer {credentials['access_token']}",
                    "X-Restli-Protocol-Version": "2.0.0"
                }
                
                response = requests.get(
                    "https://api.linkedin.com/v2/me",
                    headers=headers
                )
                
                if response.status_code == 200:
                    # LinkedIn doesn't provide rate limit headers in the same way
                    # We'll look for the response headers that might give us some info
                    return {
                        "status": "healthy",
                        "details": {
                            "api_version": "v2",
                            "response_headers": dict(response.headers)
                        }
                    }
                elif response.status_code == 401:
                    return {
                        "status": "unhealthy",
                        "error": "Authentication failed - token may be expired",
                        "details": {"auth_error": True}
                    }
                else:
                    return {
                        "status": "degraded",
                        "error": f"API error: {response.status_code}",
                        "details": {"response_text": response.text[:200]}
                    }
            except Exception as e:
                return {"status": "unhealthy", "error": str(e)}
        
        else:
            return {"status": "unhealthy", "error": f"Unsupported social media platform: {platform}"}
    
    def _check_cms_health(self, platform: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Check health of a CMS platform integration."""
        if platform == "wordpress":
            if "url" not in credentials or ("username" not in credentials and "api_key" not in credentials):
                return {"status": "unhealthy", "error": "Missing required WordPress credentials"}
            
            try:
                # Normalize URL
                api_url = credentials["url"]
                if not api_url.endswith("/"):
                    api_url += "/"
                if not api_url.endswith("wp-json/"):
                    api_url += "wp-json/"
                
                # Use either API key or basic auth
                headers = {}
                if "api_key" in credentials:
                    headers["Authorization"] = f"Bearer {credentials['api_key']}"
                elif "username" in credentials and "password" in credentials:
                    from base64 import b64encode
                    auth_str = f"{credentials['username']}:{credentials['password']}"
                    auth_header = b64encode(auth_str.encode()).decode()
                    headers["Authorization"] = f"Basic {auth_header}"
                
                response = requests.get(
                    f"{api_url}",  # Root WP REST API endpoint
                    headers=headers
                )
                
                if response.status_code == 200:
                    return {
                        "status": "healthy",
                        "details": {
                            "api_version": response.json().get("namespaces", ["wp/v2"])[0],
                            "site_name": response.json().get("name", "WordPress Site")
                        }
                    }
                elif response.status_code == 401:
                    return {
                        "status": "unhealthy",
                        "error": "Authentication failed - credentials may be invalid",
                        "details": {"auth_error": True}
                    }
                else:
                    return {
                        "status": "degraded",
                        "error": f"API error: {response.status_code}",
                        "details": {"response_text": response.text[:200]}
                    }
            except Exception as e:
                return {"status": "unhealthy", "error": str(e)}
        
        elif platform == "shopify":
            if "shop_url" not in credentials or "access_token" not in credentials:
                return {"status": "unhealthy", "error": "Missing required Shopify credentials"}
            
            try:
                headers = {
                    "X-Shopify-Access-Token": credentials["access_token"],
                    "Content-Type": "application/json"
                }
                
                # Normalize shop URL
                shop_url = credentials["shop_url"]
                if not shop_url.startswith("https://"):
                    shop_url = f"https://{shop_url}"
                if shop_url.endswith("/"):
                    shop_url = shop_url[:-1]
                
                response = requests.get(
                    f"{shop_url}/admin/api/2023-10/shop.json",
                    headers=headers
                )
                
                if response.status_code == 200:
                    # Get rate limit information from headers
                    calls_made = response.headers.get("X-Shopify-Shop-Api-Call-Limit", "0/40").split("/")[0]
                    calls_limit = response.headers.get("X-Shopify-Shop-Api-Call-Limit", "0/40").split("/")[1]
                    
                    return {
                        "status": "healthy",
                        "details": {
                            "api_calls_made": int(calls_made),
                            "api_calls_limit": int(calls_limit),
                            "shop_name": response.json().get("shop", {}).get("name"),
                            "plan_name": response.json().get("shop", {}).get("plan_name")
                        }
                    }
                elif response.status_code == 401:
                    return {
                        "status": "unhealthy",
                        "error": "Authentication failed - token may be invalid",
                        "details": {"auth_error": True}
                    }
                else:
                    return {
                        "status": "degraded",
                        "error": f"API error: {response.status_code}",
                        "details": {"response_text": response.text[:200]}
                    }
            except Exception as e:
                return {"status": "unhealthy", "error": str(e)}
        
        else:
            return {"status": "unhealthy", "error": f"Unsupported CMS platform: {platform}"}
    
    def _check_advertising_health(self, platform: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Check health of an advertising platform integration."""
        if platform == "google_ads":
            if "refresh_token" not in credentials or "client_id" not in credentials:
                return {"status": "unhealthy", "error": "Missing required Google Ads credentials"}
            
            try:
                # First, refresh the access token
                refresh_params = {
                    "client_id": credentials["client_id"],
                    "client_secret": credentials.get("client_secret", ""),
                    "refresh_token": credentials["refresh_token"],
                    "grant_type": "refresh_token"
                }
                
                token_response = requests.post(
                    "https://oauth2.googleapis.com/token",
                    data=refresh_params
                )
                
                if token_response.status_code != 200:
                    return {
                        "status": "unhealthy",
                        "error": "Failed to refresh access token",
                        "details": {"auth_error": True}
                    }
                
                access_token = token_response.json().get("access_token")
                
                # If we have a customer ID, check it
                # If not, we'll just test the token refresh as health check
                if "customer_id" in credentials and "developer_token" in credentials:
                    headers = {
                        "Authorization": f"Bearer {access_token}",
                        "developer-token": credentials["developer_token"]
                    }
                    
                    response = requests.get(
                        f"https://googleads.googleapis.com/v14/customers/{credentials['customer_id']}/googleAds:search",
                        headers=headers,
                        params={"query": "SELECT customer.id FROM customer LIMIT 1"}
                    )
                    
                    if response.status_code == 200:
                        return {
                            "status": "healthy",
                            "details": {
                                "customer_id": credentials["customer_id"],
                                "token_refresh_successful": True
                            }
                        }
                    else:
                        return {
                            "status": "degraded",
                            "error": f"API error: {response.status_code}",
                            "details": {
                                "token_refresh_successful": True,
                                "api_error": response.text[:200]
                            }
                        }
                else:
                    # No customer ID, just report token refresh success
                    return {
                        "status": "healthy",
                        "details": {
                            "token_refresh_successful": True,
                            "note": "No customer ID provided for full health check"
                        }
                    }
            except Exception as e:
                return {"status": "unhealthy", "error": str(e)}
        
        elif platform == "facebook_ads":
            if "access_token" not in credentials:
                return {"status": "unhealthy", "error": "Missing required Facebook Ads credentials"}
            
            try:
                params = {
                    "access_token": credentials["access_token"],
                    "fields": "id,name,account_status"
                }
                
                # If ad account ID is provided, check it specifically
                if "ad_account_id" in credentials:
                    ad_account_id = credentials["ad_account_id"]
                    if not ad_account_id.startswith("act_"):
                        ad_account_id = f"act_{ad_account_id}"
                    
                    response = requests.get(
                        f"https://graph.facebook.com/v18.0/{ad_account_id}",
                        params=params
                    )
                    
                    if response.status_code == 200:
                        account_data = response.json()
                        account_status = account_data.get("account_status", 0)
                        
                        # Facebook account status: 1 = active, 2 = disabled, 3 = pending verification
                        status_map = {1: "active", 2: "disabled", 3: "pending"}
                        account_status_name = status_map.get(account_status, "unknown")
                        
                        # Check Facebook's rate limit headers
                        app_usage = response.headers.get("x-app-usage", "{}")
                        try:
                            app_usage_data = json.loads(app_usage)
                        except json.JSONDecodeError:
                            app_usage_data = {}
                        
                        health_status = "healthy" if account_status == 1 else "degraded"
                        
                        return {
                            "status": health_status,
                            "details": {
                                "account_id": account_data.get("id", "").replace("act_", ""),
                                "account_name": account_data.get("name"),
                                "account_status": account_status_name,
                                "api_rate_limit_remaining": 100 - app_usage_data.get("call_count", 0),
                                "rate_limited": app_usage_data.get("rate_limit_reached", 0) == 1
                            }
                        }
                    elif response.status_code == 401:
                        return {
                            "status": "unhealthy",
                            "error": "Authentication failed - token may be expired",
                            "details": {"auth_error": True}
                        }
                    else:
                        return {
                            "status": "degraded",
                            "error": f"API error: {response.status_code}",
                            "details": {"response_text": response.text[:200]}
                        }
                else:
                    # Check the user's permissions if no specific ad account
                    response = requests.get(
                        "https://graph.facebook.com/v18.0/me/permissions",
                        params={"access_token": credentials["access_token"]}
                    )
                    
                    if response.status_code == 200:
                        permissions = response.json().get("data", [])
                        return {
                            "status": "healthy",
                            "details": {
                                "permissions_count": len(permissions),
                                "has_ads_management": any(p.get("permission") == "ads_management" and p.get("status") == "granted" for p in permissions),
                                "has_ads_read": any(p.get("permission") == "ads_read" and p.get("status") == "granted" for p in permissions)
                            }
                        }
                    elif response.status_code == 401:
                        return {
                            "status": "unhealthy",
                            "error": "Authentication failed - token may be expired",
                            "details": {"auth_error": True}
                        }
                    else:
                        return {
                            "status": "degraded",
                            "error": f"API error: {response.status_code}",
                            "details": {"response_text": response.text[:200]}
                        }
            except Exception as e:
                return {"status": "unhealthy", "error": str(e)}
        
        else:
            return {"status": "unhealthy", "error": f"Unsupported advertising platform: {platform}"}
    
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
    
    def _get_integration_credentials(self, integration_id: Union[str, int], platform_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieve integration credentials from database based on integration ID.
        Decrypts sensitive data for use.
        
        Args:
            integration_id: The ID of the integration record
            platform_type: Optional platform type (if known) to optimize the query
            
        Returns:
            Dictionary with decrypted credentials
        """
        logger.info(f"Retrieving credentials for integration ID: {integration_id}")
        
        try:
            # Convert string ID to integer if necessary
            if isinstance(integration_id, str) and integration_id.isdigit():
                integration_id = int(integration_id)
            elif isinstance(integration_id, str) and not integration_id.startswith("integration_"):
                # If it's a string but not an old format integration ID, it might be a cache key
                cached_data = self.cache.get(integration_id)
                if cached_data:
                    return json.loads(cached_data)
        except (ValueError, TypeError, json.JSONDecodeError):
            pass
        
        # New implementation handling database records
        if isinstance(integration_id, int):
            # First check cache for metadata to determine platform category
            platform_category = None
            
            if platform_type:
                # If platform type is provided, determine the category
                for category, platforms in self.integration_config.items():
                    if platform_type in platforms:
                        platform_category = category
                        break
            else:
                # Try to find in cache
                for category in ["social_media", "cms", "advertising"]:
                    cache_key = f"integration:{category}:{integration_id}"
                    cached_data = self.cache.get(cache_key)
                    if cached_data:
                        try:
                            metadata = json.loads(cached_data)
                            platform_type = metadata.get("platform_type")
                            platform_category = category
                            break
                        except json.JSONDecodeError:
                            continue
            
            # If still not determined, we'll need to check all tables
            with get_db() as db:
                credentials = {}
                
                if platform_category == "social_media" or not platform_category:
                    # Check SocialAccount
                    social_account = db.query(SocialAccount).filter(SocialAccount.id == integration_id).first()
                    if social_account:
                        credentials = {
                            "account_id": social_account.account_id,
                            "account_name": social_account.account_name,
                            "platform": social_account.platform,
                            "brand_id": social_account.brand_id
                        }
                        
                        # Decrypt access token
                        if social_account.access_token and social_account.access_token_salt:
                            credentials["access_token"] = decrypt_sensitive_data(
                                social_account.access_token, social_account.access_token_salt
                            )
                        
                        # Decrypt refresh token
                        if social_account.refresh_token and social_account.refresh_token_salt:
                            credentials["refresh_token"] = decrypt_sensitive_data(
                                social_account.refresh_token, social_account.refresh_token_salt
                            )
                        
                        if social_account.token_expires_at:
                            # Convert datetime to seconds from now
                            now = datetime.datetime.now()
                            if social_account.token_expires_at > now:
                                credentials["expires_in"] = int((social_account.token_expires_at - now).total_seconds())
                            else:
                                credentials["expires_in"] = 0
                        
                        return credentials
                
                if platform_category == "cms" or not platform_category:
                    # Check CMSAccount
                    cms_account = db.query(CMSAccount).filter(CMSAccount.id == integration_id).first()
                    if cms_account:
                        credentials = {
                            "site_url": cms_account.site_url,
                            "username": cms_account.username,
                            "platform": cms_account.platform,
                            "brand_id": cms_account.brand_id
                        }
                        
                        # Decrypt API key
                        if cms_account.api_key and cms_account.api_key_salt:
                            credentials["api_key"] = decrypt_sensitive_data(
                                cms_account.api_key, cms_account.api_key_salt
                            )
                        
                        # Decrypt API secret
                        if cms_account.api_secret and cms_account.api_secret_salt:
                            credentials["api_secret"] = decrypt_sensitive_data(
                                cms_account.api_secret, cms_account.api_secret_salt
                            )
                        
                        # Decrypt password
                        if cms_account.password and cms_account.password_salt:
                            credentials["password"] = decrypt_sensitive_data(
                                cms_account.password, cms_account.password_salt
                            )
                        
                        return credentials
                
                if platform_category == "advertising" or not platform_category:
                    # Check AdAccount
                    ad_account = db.query(AdAccount).filter(AdAccount.id == integration_id).first()
                    if ad_account:
                        credentials = {
                            "account_id": ad_account.account_id,
                            "platform": ad_account.platform,
                            "brand_id": ad_account.brand_id
                        }
                        
                        # Decrypt access token
                        if ad_account.access_token and ad_account.access_token_salt:
                            credentials["access_token"] = decrypt_sensitive_data(
                                ad_account.access_token, ad_account.access_token_salt
                            )
                        
                        # Decrypt refresh token
                        if ad_account.refresh_token and ad_account.refresh_token_salt:
                            credentials["refresh_token"] = decrypt_sensitive_data(
                                ad_account.refresh_token, ad_account.refresh_token_salt
                            )
                        
                        # Additional fields for Google Ads
                        if ad_account.platform == "google_ads":
                            if ad_account.developer_token and ad_account.developer_token_salt:
                                credentials["developer_token"] = decrypt_sensitive_data(
                                    ad_account.developer_token, ad_account.developer_token_salt
                                )
                            
                            if ad_account.client_id and ad_account.client_id_salt:
                                credentials["client_id"] = decrypt_sensitive_data(
                                    ad_account.client_id, ad_account.client_id_salt
                                )
                            
                            if ad_account.client_secret and ad_account.client_secret_salt:
                                credentials["client_secret"] = decrypt_sensitive_data(
                                    ad_account.client_secret, ad_account.client_secret_salt
                                )
                        
                        if ad_account.token_expires_at:
                            # Convert datetime to seconds from now
                            now = datetime.datetime.now()
                            if ad_account.token_expires_at > now:
                                credentials["expires_in"] = int((ad_account.token_expires_at - now).total_seconds())
                            else:
                                credentials["expires_in"] = 0
                        
                        return credentials
        
        # Legacy support for old integration IDs or fallback mock
        logger.warning(f"Using mock credentials for integration ID: {integration_id}")
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
        logger.info(f"Refreshing token for provider: {provider}")
        
        if provider not in self.oauth_config:
            logger.error(f"Unknown OAuth provider: {provider}")
            return {}
        
        config = self.oauth_config[provider]
        
        # Prepare token refresh request
        refresh_request_params = {
            "client_id": config["client_id"],
            "client_secret": config["client_secret"],
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        
        # Special handling for LinkedIn
        if provider == "linkedin":
            headers["Accept"] = "application/json"
        
        try:
            # Make the token refresh request
            response = requests.post(
                config["token_uri"],
                headers=headers,
                data=refresh_request_params
            )
            
            # Handle response
            if response.status_code == 200:
                token_data = response.json()
                logger.info(f"Successfully refreshed token for provider: {provider}")
                
                # Add expires_at timestamp for easier expiration checking
                if "expires_in" in token_data:
                    token_data["expires_at"] = time.time() + token_data["expires_in"]
                
                # Some providers don't return a refresh token on refresh
                # Make sure we don't lose the original refresh token
                if "refresh_token" not in token_data:
                    token_data["refresh_token"] = refresh_token
                
                return token_data
            else:
                logger.error(f"Token refresh failed with {provider}: {response.status_code} - {response.text}")
                return {}
                
        except Exception as e:
            logger.error(f"Error during token refresh with {provider}: {e}")
            return {}
    
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
    
    # Health monitoring methods
    def start_health_monitoring(self):
        """Start the background health monitoring thread."""
        if self.health_check_thread is None or not self.health_check_thread.is_alive():
            self.health_check_stop_event.clear()
            self.health_check_thread = Thread(
                target=self._health_monitoring_worker,
                name="IntegrationHealthMonitor",
                daemon=True  # Thread will exit when main thread exits
            )
            self.health_check_thread.start()
            logger.info("Started integration health monitoring thread")
    
    def stop_health_monitoring(self):
        """Stop the background health monitoring thread."""
        if self.health_check_thread and self.health_check_thread.is_alive():
            logger.info("Stopping health monitoring thread...")
            self.health_check_stop_event.set()
            self.health_check_thread.join(timeout=10)
            logger.info("Health monitoring thread stopped")
    
    def _health_monitoring_worker(self):
        """Worker function for the health monitoring thread."""
        logger.info("Health monitoring thread started")
        
        while not self.health_check_stop_event.is_set():
            try:
                # Perform health check on all integrations
                logger.info("Running scheduled health checks on all integrations")
                
                with get_db() as db:
                    # Check social media accounts
                    social_accounts = db.query(SocialAccount).all()
                    for account in social_accounts:
                        if self.health_check_stop_event.is_set():
                            break
                        
                        try:
                            # Get credentials
                            credentials = self._get_integration_credentials(account.id, account.platform)
                            # Perform health check
                            self._check_integration_health(account.platform, account.id, credentials)
                            logger.debug(f"Checked health for social account: {account.id} ({account.platform})")
                        except Exception as e:
                            logger.error(f"Error checking health for social account {account.id}: {e}")
                    
                    # Check CMS accounts
                    cms_accounts = db.query(CMSAccount).all()
                    for cms in cms_accounts:
                        if self.health_check_stop_event.is_set():
                            break
                        
                        try:
                            # Get credentials
                            credentials = self._get_integration_credentials(cms.id, cms.platform)
                            # Perform health check
                            self._check_integration_health(cms.platform, cms.id, credentials)
                            logger.debug(f"Checked health for CMS account: {cms.id} ({cms.platform})")
                        except Exception as e:
                            logger.error(f"Error checking health for CMS account {cms.id}: {e}")
                    
                    # Check ad accounts
                    ad_accounts = db.query(AdAccount).all()
                    for ad in ad_accounts:
                        if self.health_check_stop_event.is_set():
                            break
                        
                        try:
                            # Get credentials
                            credentials = self._get_integration_credentials(ad.id, ad.platform)
                            # Perform health check
                            self._check_integration_health(ad.platform, ad.id, credentials)
                            logger.debug(f"Checked health for ad account: {ad.id} ({ad.platform})")
                        except Exception as e:
                            logger.error(f"Error checking health for ad account {ad.id}: {e}")
                
                logger.info("Scheduled health checks completed")
                
                # Sleep until next check interval, but check for stop event every 10 seconds
                for _ in range(self.health_check_interval // 10):
                    if self.health_check_stop_event.is_set():
                        break
                    time.sleep(10)
                
            except Exception as e:
                logger.error(f"Error in health monitoring thread: {e}")
                # Sleep for a while before retrying
                time.sleep(60)