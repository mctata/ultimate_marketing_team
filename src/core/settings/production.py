"""
Production-specific settings for the Ultimate Marketing Team

This module contains all settings specific to the production environment.
It inherits from the base settings and overrides only what needs to be different.
"""

import os
from typing import List

from src.core.settings.base import BaseSettings

class ProductionSettings(BaseSettings):
    """Production environment specific settings."""
    
    # Environment
    ENV: str = "production"
    DEBUG: bool = False
    
    # Database settings with high-performance connection pooling
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 40
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800  # 30 minutes
    DB_STATEMENT_TIMEOUT: int = 60000  # 60 seconds
    
    # API settings
    API_PREFIX: str = "/api/v1"
    
    # Security settings - strict for production
    CORS_ORIGINS: List[str] = [
        "https://ultimate-marketing.example.com",
        "https://*.ultimate-marketing.example.com",
    ]
    
    # Add your production domain to trusted hosts
    TRUSTED_HOSTS: List[str] = [
        "ultimate-marketing.example.com",
        "*.ultimate-marketing.example.com",
    ]
    
    # Rate limiting for production
    RATE_LIMIT_WINDOW_MS: int = 60000  # 1 minute
    RATE_LIMIT_MAX_REQUESTS: int = 60  # 60 requests per minute
    
    # Production logging should be less verbose
    LOG_LEVEL: str = "WARNING"
    
    # Force HTTPS in production
    FORCE_HTTPS: bool = True
    
    # Production-specific overrides
    class Config:
        env_prefix = "UMT_"  # prefix for environment variables
        case_sensitive = True  # env vars are case-sensitive
