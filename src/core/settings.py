"""
Settings for the Ultimate Marketing Team application
"""

import os
from typing import Dict, List, Optional, Union, Any

class Settings:
    """Application settings."""
    
    # App information
    APP_NAME = "Ultimate Marketing Team"
    APP_DESCRIPTION = "Platform for managing marketing campaigns and content"
    APP_VERSION = "0.1.0"
    ENV = os.getenv("ENVIRONMENT", "development")
    
    # API settings
    API_PREFIX = "/api/v1"
    
    # CORS settings
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000,http://localhost:8080").split(",")
    
    # Rate limiting
    RATE_LIMIT_MAX_REQUESTS = 100
    RATE_LIMIT_WINDOW_MS = 60 * 1000  # 1 minute
    
    # Performance tracking
    PERFORMANCE_TRACKING_ENABLED = True
    
    # Security settings
    JWT_SECRET = os.getenv("JWT_SECRET", "development_secret_key_change_in_production_please")
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRY = 60 * 60 * 24 * 7  # 7 days
    
    # Database settings
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/ultimatemarketing")
    
    # Redis settings
    REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
    
    # RabbitMQ settings
    RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
    RABBITMQ_QUEUE_PREFIX = os.getenv("RABBITMQ_QUEUE_PREFIX", "umt_")
    
    # OAuth settings
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    
    FACEBOOK_CLIENT_ID = os.getenv("FACEBOOK_CLIENT_ID")
    FACEBOOK_CLIENT_SECRET = os.getenv("FACEBOOK_CLIENT_SECRET")
    
    LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
    LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")
    
    # Email settings
    SMTP_TLS = True
    SMTP_PORT = 587
    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    EMAILS_FROM_EMAIL = os.getenv("EMAILS_FROM_EMAIL", "info@example.com")
    EMAILS_FROM_NAME = os.getenv("EMAILS_FROM_NAME", "Ultimate Marketing Team")
    
    # File storage settings
    UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")
    MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB
    
    # Logging settings
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    # Initial admin user
    FIRST_SUPERUSER_EMAIL = os.getenv("FIRST_SUPERUSER_EMAIL", "admin@example.com")
    FIRST_SUPERUSER_PASSWORD = os.getenv("FIRST_SUPERUSER_PASSWORD", "changeme")
    
    # Test user for development
    TEST_USER_EMAIL = "test@example.com"
    TEST_USER_PASSWORD = "password123"


settings = Settings()