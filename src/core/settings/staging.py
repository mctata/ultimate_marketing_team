"""
Staging-specific settings for the Ultimate Marketing Team

This module contains all settings specific to the staging environment.
It inherits from the base settings and overrides only what needs to be different.
"""

import os
from typing import List

from src.core.settings.base import BaseSettings

class StagingSettings(BaseSettings):
    """Staging environment specific settings."""
    
    # Environment
    ENV: str = "staging"
    DEBUG: bool = False
    
    # Database settings with more reliable connection handling
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800  # 30 minutes
    DB_STATEMENT_TIMEOUT: int = 30000  # 30 seconds
    
    # Connection retry settings
    DB_CONNECTION_RETRIES: int = 5
    DB_CONNECTION_RETRY_DELAY: int = 5  # seconds
    
    # API settings
    API_PREFIX: str = "/api/v1"
    
    # Security settings
    CORS_ORIGINS: List[str] = [
        "https://staging.ultimate-marketing.example.com",
        "https://*.staging.ultimate-marketing.example.com",
    ]
    
    # Add your staging domain to trusted hosts
    TRUSTED_HOSTS: List[str] = [
        "staging.ultimate-marketing.example.com",
        "*.staging.ultimate-marketing.example.com",
    ]
    
    # Rate limiting settings
    RATE_LIMIT_WINDOW_MS: int = 60000  # 1 minute
    RATE_LIMIT_MAX_REQUESTS: int = 100  # 100 requests per minute
    
    # Enable maintenance mode flag
    MAINTENANCE_MODE: bool = False
    
    # Set logging to a less verbose level for staging
    LOG_LEVEL: str = "INFO"
    
    # Staging-specific overrides
    class Config:
        env_prefix = "UMT_"  # prefix for environment variables
        case_sensitive = True  # env vars are case-sensitive
