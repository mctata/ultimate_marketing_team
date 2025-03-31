"""
Base settings for the Ultimate Marketing Team

This module contains base settings that are common to all environments.
Environment-specific settings should override these in their own modules.
"""

import os
from typing import List, Optional

from pydantic import BaseSettings as PydanticBaseSettings

class BaseSettings(PydanticBaseSettings):
    """Base settings for all environments."""
    
    # App info
    APP_NAME: str = "Ultimate Marketing Team"
    APP_DESCRIPTION: str = "AI-driven marketing automation system"
    APP_VERSION: str = "0.1.0"
    ENV: str = "development"
    DEBUG: bool = False
    
    # Database settings
    SCHEMA_NAME: str = "umt"
    DATABASE_URL: str = os.environ.get("DATABASE_URL", 
                                       "postgresql://postgres:postgres@localhost:5432/umt")
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800  # 30 minutes
    DB_STATEMENT_TIMEOUT: int = 30000  # 30 seconds
    
    # API settings
    API_PREFIX: str = "/api/v1"
    
    # Security settings
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "supersecretkeythatshouldbereplacedstoredinenvironmentvars")
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "jwtsecretkeythatshouldbereplacedstoredinenvironmentvars")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY: int = 60 * 60 * 24 * 7  # 7 days
    SESSION_EXPIRY: int = 60 * 60 * 24 * 30  # 30 days
    CSRF_SECRET: str = os.environ.get("CSRF_SECRET", "csrfsecretkeythatshouldbereplacedstoredinenvironmentvars")
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["*"]
    TRUSTED_HOSTS: List[str] = ["*"]
    
    # Rate limiting settings
    RATE_LIMIT_WINDOW_MS: int = 60000  # 1 minute
    RATE_LIMIT_MAX_REQUESTS: int = 60  # 60 requests per minute
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Maintenance mode
    MAINTENANCE_MODE: bool = False
    
    class Config:
        env_prefix = "UMT_"  # prefix for environment variables
        case_sensitive = True  # env vars are case-sensitive
