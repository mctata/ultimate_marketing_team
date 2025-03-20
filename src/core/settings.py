"""
Settings for the Ultimate Marketing Team application
"""

import os
from typing import Dict, List, Optional, Union, Any
from pydantic import BaseSettings, validator, PostgresDsn, AnyHttpUrl, EmailStr

class Settings(BaseSettings):
    """Application settings."""
    
    # App information
    APP_NAME: str = "Ultimate Marketing Team"
    APP_DESCRIPTION: str = "Platform for managing marketing campaigns and content"
    APP_VERSION: str = "0.1.0"
    ENV: str = os.getenv("ENVIRONMENT", "development")
    
    # API settings
    API_PREFIX: str = "/api/v1"
    
    # CORS settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8080"
    ]
    
    # Rate limiting
    RATE_LIMIT_MAX_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_MS: int = 60 * 1000  # 1 minute
    
    # Performance tracking
    PERFORMANCE_TRACKING_ENABLED: bool = True
    
    # Security settings
    JWT_SECRET: str = os.getenv("JWT_SECRET", "development_secret_key_change_in_production_please")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY: int = 60 * 60 * 24 * 7  # 7 days
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8080",
    ]
    
    # Database settings
    DATABASE_URL: Optional[PostgresDsn] = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/marketing_team")
    
    # Redis settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # RabbitMQ settings
    RABBITMQ_URL: str = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
    
    # OAuth settings
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET")
    
    FACEBOOK_CLIENT_ID: Optional[str] = os.getenv("FACEBOOK_CLIENT_ID")
    FACEBOOK_CLIENT_SECRET: Optional[str] = os.getenv("FACEBOOK_CLIENT_SECRET")
    
    LINKEDIN_CLIENT_ID: Optional[str] = os.getenv("LINKEDIN_CLIENT_ID")
    LINKEDIN_CLIENT_SECRET: Optional[str] = os.getenv("LINKEDIN_CLIENT_SECRET")
    
    # Email settings
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = 587
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST")
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    EMAILS_FROM_EMAIL: Optional[EmailStr] = os.getenv("EMAILS_FROM_EMAIL", "info@example.com")
    EMAILS_FROM_NAME: Optional[str] = os.getenv("EMAILS_FROM_NAME", "Ultimate Marketing Team")
    
    # File storage settings
    UPLOADS_DIR: str = os.getenv("UPLOADS_DIR", "uploads")
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB
    
    # Logging settings
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Initial admin user
    FIRST_SUPERUSER_EMAIL: EmailStr = os.getenv("FIRST_SUPERUSER_EMAIL", "admin@example.com")
    FIRST_SUPERUSER_PASSWORD: str = os.getenv("FIRST_SUPERUSER_PASSWORD", "changeme")
    
    # Test user for development
    TEST_USER_EMAIL: EmailStr = "test@example.com"
    TEST_USER_PASSWORD: str = "password123"
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()