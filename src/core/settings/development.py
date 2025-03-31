"""
Development-specific settings for the Ultimate Marketing Team

This module contains all settings specific to the development environment.
It inherits from the base settings and overrides only what needs to be different.
"""

import os
from typing import List

from src.core.settings.base import BaseSettings

class DevelopmentSettings(BaseSettings):
    """Development environment specific settings."""
    
    # Environment
    ENV: str = "development"
    DEBUG: bool = True
    
    # Database settings
    DB_POOL_SIZE: int = 3
    DB_MAX_OVERFLOW: int = 5
    
    # API settings
    API_PREFIX: str = "/api/v1"
    
    # Security settings - relaxed for development
    CORS_ORIGINS: List[str] = ["*"]
    
    # Reduce rate limiting for development
    RATE_LIMIT_WINDOW_MS: int = 60000  # 1 minute
    RATE_LIMIT_MAX_REQUESTS: int = 500  # 500 requests per minute
    
    # More verbose logging for development
    LOG_LEVEL: str = "DEBUG"
    
    # Development-specific settings
    AUTO_RELOAD: bool = True
    MOCK_EXTERNAL_APIS: bool = True
    
    class Config:
        env_prefix = "UMT_"  # prefix for environment variables
        case_sensitive = True  # env vars are case-sensitive
