"""
Bitwarden Vault secrets management integration for secure credential storage.

This module provides a secure way to access and manage sensitive information 
like API keys, credentials and other secrets using Bitwarden Vault.
"""

import os
import json
import logging
import time
from enum import Enum
from typing import Dict, Any, Optional, Union, List, Tuple
import requests
from requests.exceptions import RequestException
from functools import lru_cache
import cachetools

from .settings import settings

logger = logging.getLogger(__name__)

class SecretType(Enum):
    """Types of secrets that can be stored"""
    API_KEY = "api_key"
    LOGIN_CREDENTIALS = "login"
    OAUTH_CREDENTIALS = "oauth"
    DB_CREDENTIALS = "database"
    JWT_SECRET = "jwt"
    ENCRYPTION_KEY = "encryption"
    CERTIFICATE = "certificate"


class BitwardenClient:
    """Client for interacting with Bitwarden Vault API"""
    
    def __init__(self, client_id: str = None, client_secret: str = None, 
                 org_id: str = None, base_url: str = None, identity_url: str = None):
        """Initialize the Bitwarden client.
        
        Args:
            client_id: Client ID for API access
            client_secret: Client secret for API access
            org_id: Organization ID
            base_url: Base URL for the Bitwarden API
            identity_url: URL for the Bitwarden identity service
        """
        self.client_id = client_id or os.getenv("BITWARDEN_CLIENT_ID")
        self.client_secret = client_secret or os.getenv("BITWARDEN_CLIENT_SECRET")
        self.organization_id = org_id or os.getenv("BITWARDEN_ORGANIZATION_ID")
        self.base_url = base_url or os.getenv("BITWARDEN_API_URL", "https://api.bitwarden.com/public")
        self.identity_url = identity_url or os.getenv("BITWARDEN_IDENTITY_URL", "https://identity.bitwarden.com")
        
        self.access_token = None
        self.token_expires_at = 0
        
        # Cache for retrieved secrets
        self.cache = cachetools.TTLCache(maxsize=100, ttl=300)  # 5 minutes cache
        
        if not self.client_id or not self.client_secret:
            logger.warning("Bitwarden API credentials not configured. Secrets manager will use environment variables only.")
            self.enabled = False
        else:
            self.enabled = True
        
    def _authenticate(self) -> bool:
        """Authenticate with Bitwarden API and get an access token.
        
        Returns:
            bool: True if authentication was successful, False otherwise
        """
        if not self.enabled:
            return False
        
        # Check if we already have a valid token
        if self.access_token and time.time() < self.token_expires_at:
            return True
        
        try:
            url = f"{self.identity_url}/connect/token"
            data = {
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "scope": "api.organization"
            }
            
            response = requests.post(url, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            self.access_token = token_data["access_token"]
            # Set expiry with a 60-second buffer
            self.token_expires_at = time.time() + token_data["expires_in"] - 60
            
            return True
        except RequestException as e:
            logger.error(f"Failed to authenticate with Bitwarden: {str(e)}")
            return False
    
    def get_secret(self, secret_id: str) -> Optional[Dict[str, Any]]:
        """Get a secret from Bitwarden by its ID.
        
        Args:
            secret_id: The ID of the secret to retrieve
            
        Returns:
            Dict containing the secret data or None if not found
        """
        # Try to get from cache first
        if secret_id in self.cache:
            return self.cache[secret_id]
        
        if not self.enabled:
            logger.warning(f"Bitwarden client not enabled. Cannot retrieve secret {secret_id}")
            return None
        
        if not self._authenticate():
            return None
        
        try:
            url = f"{self.base_url}/items/{secret_id}"
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            secret_data = response.json()
            # Cache the result
            self.cache[secret_id] = secret_data
            
            return secret_data
        except RequestException as e:
            logger.error(f"Failed to retrieve secret {secret_id}: {str(e)}")
            return None
    
    def get_secret_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Get a secret from Bitwarden by its name.
        
        Args:
            name: The name of the secret to retrieve
            
        Returns:
            Dict containing the secret data or None if not found
        """
        # Try to get from cache first
        cache_key = f"name:{name}"
        if cache_key in self.cache:
            return self.cache[cache_key]
            
        if not self.enabled:
            logger.warning(f"Bitwarden client not enabled. Cannot retrieve secret {name}")
            return None
            
        if not self._authenticate():
            return None
            
        if not self.organization_id:
            logger.error("Organization ID not set. Cannot search for secrets by name.")
            return None
            
        try:
            url = f"{self.base_url}/organizations/{self.organization_id}/items"
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            items = response.json()
            for item in items:
                if item["name"] == name:
                    # Cache the result
                    self.cache[cache_key] = item
                    return item
                    
            logger.warning(f"Secret with name {name} not found in Bitwarden")
            return None
        except RequestException as e:
            logger.error(f"Failed to retrieve secret by name {name}: {str(e)}")
            return None


class SecretsManager:
    """Manages secrets retrieval from Bitwarden or environment variables"""
    
    def __init__(self):
        """Initialize the secrets manager"""
        self.bitwarden = BitwardenClient()
        self.use_bitwarden = self.bitwarden.enabled
        
    @lru_cache(maxsize=128)
    def get_secret(self, key: str, secret_type: SecretType = None, 
                   bitwarden_id: str = None, default: str = None) -> Optional[str]:
        """Get a secret value by its key name.
        
        Tries to get the secret from Bitwarden first if enabled and ID is provided,
        then falls back to environment variables.
        
        Args:
            key: The key name for the secret
            secret_type: The type of secret (for organization)
            bitwarden_id: Optional Bitwarden item ID
            default: Default value if not found
            
        Returns:
            The secret value or None if not found
        """
        # Try Bitwarden first if enabled and ID is provided
        if self.use_bitwarden and bitwarden_id:
            secret = self.bitwarden.get_secret(bitwarden_id)
            if secret and secret.get("login", {}).get("password"):
                return secret["login"]["password"]
                
        # Try Bitwarden by secret name if enabled
        if self.use_bitwarden and not bitwarden_id:
            prefix = ""
            if secret_type:
                prefix = f"{secret_type.value}:"
                
            # Try to find the secret by its name
            secret = self.bitwarden.get_secret_by_name(f"{prefix}{key}")
            if secret and secret.get("login", {}).get("password"):
                return secret["login"]["password"]
        
        # Fall back to environment variables
        env_value = os.getenv(key)
        if env_value is not None:
            return env_value
            
        # Return default if provided
        return default
        
    def get_database_credentials(self) -> Dict[str, str]:
        """Get database credentials from secrets storage.
        
        Returns:
            Dict with username, password, host, port, database name
        """
        return {
            "user": self.get_secret("POSTGRES_USER", SecretType.DB_CREDENTIALS),
            "password": self.get_secret("POSTGRES_PASSWORD", SecretType.DB_CREDENTIALS),
            "host": self.get_secret("POSTGRES_HOST", default="postgres"),
            "port": self.get_secret("POSTGRES_PORT", default="5432"),
            "database": self.get_secret("POSTGRES_DB", default="ultimatemarketing"),
        }
        
    def get_jwt_secret(self) -> str:
        """Get JWT secret key from secrets storage.
        
        Returns:
            JWT secret key
        """
        return self.get_secret("JWT_SECRET", SecretType.JWT_SECRET)
        
    def get_encryption_key(self) -> str:
        """Get encryption key from secrets storage.
        
        Returns:
            Encryption key
        """
        return self.get_secret("ENCRYPTION_KEY", SecretType.ENCRYPTION_KEY)
        
    def get_rabbitmq_credentials(self) -> Dict[str, str]:
        """Get RabbitMQ credentials from secrets storage.
        
        Returns:
            Dict with username, password, host, port
        """
        return {
            "user": self.get_secret("RABBITMQ_USER"),
            "password": self.get_secret("RABBITMQ_PASSWORD"),
            "host": self.get_secret("RABBITMQ_HOST", default="rabbitmq"),
            "port": self.get_secret("RABBITMQ_PORT", default="5672"),
            "vhost": self.get_secret("RABBITMQ_VHOST", default="/"),
        }
        
    def get_smtp_credentials(self) -> Dict[str, str]:
        """Get SMTP credentials from secrets storage.
        
        Returns:
            Dict with username, password, host, port
        """
        return {
            "user": self.get_secret("SMTP_USER"),
            "password": self.get_secret("SMTP_PASSWORD"),
            "host": self.get_secret("SMTP_HOST"),
            "port": self.get_secret("SMTP_PORT", default="587"),
            "from_email": self.get_secret("EMAILS_FROM_EMAIL"),
        }
        
    def get_oauth_credentials(self, provider: str) -> Dict[str, str]:
        """Get OAuth credentials for a specific provider.
        
        Args:
            provider: The OAuth provider (google, microsoft, etc.)
            
        Returns:
            Dict with client_id and client_secret
        """
        provider = provider.upper()
        return {
            "client_id": self.get_secret(f"{provider}_CLIENT_ID", SecretType.OAUTH_CREDENTIALS),
            "client_secret": self.get_secret(f"{provider}_CLIENT_SECRET", SecretType.OAUTH_CREDENTIALS),
        }
        
    def get_api_key(self, service: str) -> str:
        """Get API key for a specific service.
        
        Args:
            service: The service name (openai, google_ai, etc.)
            
        Returns:
            API key for the service
        """
        return self.get_secret(f"{service.upper()}_API_KEY", SecretType.API_KEY)
    
    
# Create a singleton instance
secrets_manager = SecretsManager()