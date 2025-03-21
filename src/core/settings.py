"""
Settings for the Ultimate Marketing Team application
"""

import os
from typing import Dict, List, Optional, Union, Any, Tuple

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
    SESSION_EXPIRY = 60 * 60 * 24 * 30  # 30 days
    
    # Enhanced rate limiting settings
    RATE_LIMIT_MAX_REQUESTS = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "100"))
    RATE_LIMIT_WINDOW_MS = int(os.getenv("RATE_LIMIT_WINDOW_MS", "60000"))  # 1 minute
    RATE_LIMIT_SECURITY_MAX = int(os.getenv("RATE_LIMIT_SECURITY_MAX", "20"))
    RATE_LIMIT_SECURITY_WINDOW_MS = int(os.getenv("RATE_LIMIT_SECURITY_WINDOW_MS", "60000"))
    RATE_LIMIT_PUBLIC_MAX = int(os.getenv("RATE_LIMIT_PUBLIC_MAX", "200"))
    RATE_LIMIT_PUBLIC_WINDOW_MS = int(os.getenv("RATE_LIMIT_PUBLIC_WINDOW_MS", "60000"))
    
    # Circuit breaker settings
    CIRCUIT_BREAKER_ERROR_THRESHOLD = int(os.getenv("CIRCUIT_BREAKER_ERROR_THRESHOLD", "50"))
    CIRCUIT_BREAKER_SUCCESS_THRESHOLD = int(os.getenv("CIRCUIT_BREAKER_SUCCESS_THRESHOLD", "5"))
    CIRCUIT_BREAKER_TIMEOUT = int(os.getenv("CIRCUIT_BREAKER_TIMEOUT", "60"))  # 1 minute
    
    # Content security settings
    MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))  # 10 MB
    ALLOWED_UPLOAD_TYPES = os.getenv("ALLOWED_UPLOAD_TYPES", "image/jpeg,image/png,image/gif,image/webp,application/pdf").split(",")
    MALWARE_SCAN_ENABLED = os.getenv("MALWARE_SCAN_ENABLED", "true").lower() == "true"
    
    # Monitoring and observability settings
    # Prometheus
    PROMETHEUS_ENABLED = os.getenv("PROMETHEUS_ENABLED", "true").lower() == "true"
    PROMETHEUS_PORT = int(os.getenv("PROMETHEUS_PORT", "9090"))
    
    # OpenTelemetry
    OPENTELEMETRY_ENABLED = os.getenv("OPENTELEMETRY_ENABLED", "true").lower() == "true"
    OPENTELEMETRY_ENDPOINT = os.getenv("OPENTELEMETRY_ENDPOINT", "http://otel-collector:4317")
    OPENTELEMETRY_SAMPLING_RATE = float(os.getenv("OPENTELEMETRY_SAMPLING_RATE", "0.5"))
    
    # Elasticsearch/Logstash/Kibana (ELK)
    ELK_ENABLED = os.getenv("ELK_ENABLED", "true").lower() == "true"
    LOGSTASH_HOST = os.getenv("LOGSTASH_HOST", "logstash")
    LOGSTASH_PORT = int(os.getenv("LOGSTASH_PORT", "5044"))
    
    # PagerDuty
    PAGERDUTY_ENABLED = os.getenv("PAGERDUTY_ENABLED", "false").lower() == "true"
    PAGERDUTY_ROUTING_KEY = os.getenv("PAGERDUTY_ROUTING_KEY", "")
    PAGERDUTY_SERVICE_ID = os.getenv("PAGERDUTY_SERVICE_ID", "")
    
    # Synthetic monitoring
    SYNTHETIC_MONITORING_ENABLED = os.getenv("SYNTHETIC_MONITORING_ENABLED", "true").lower() == "true"
    SYNTHETIC_MONITORING_INTERVAL_MINUTES = int(os.getenv("SYNTHETIC_MONITORING_INTERVAL_MINUTES", "15"))
    
    # Critical monitoring
    CRITICAL_EXCEPTIONS = os.getenv("CRITICAL_EXCEPTIONS", "DatabaseError,ConnectionError,TimeoutError").split(",")
    CRITICAL_ENDPOINTS = os.getenv("CRITICAL_ENDPOINTS", "/auth,/payment").split(",")
    
    # External services to monitor
    EXTERNAL_SERVICES_TO_MONITOR = [
        {"name": "openai", "url": "https://api.openai.com/v1/health"},
        {"name": "anthropic", "url": "https://api.anthropic.com/v1/health"},
        {"name": "google_ads", "url": "https://googleads.googleapis.com/"},
        {"name": "facebook_ads", "url": "https://graph.facebook.com/"},
        {"name": "linkedin_ads", "url": "https://api.linkedin.com/v2/"},
    ]
    
    # OAuth settings
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID")
    MICROSOFT_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET")
    MICROSOFT_TENANT_ID = os.getenv("MICROSOFT_TENANT_ID", "common")
    OKTA_CLIENT_ID = os.getenv("OKTA_CLIENT_ID")
    OKTA_CLIENT_SECRET = os.getenv("OKTA_CLIENT_SECRET")
    OKTA_DOMAIN = os.getenv("OKTA_DOMAIN")
    LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
    LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")
    FACEBOOK_CLIENT_ID = os.getenv("FACEBOOK_CLIENT_ID")
    FACEBOOK_CLIENT_SECRET = os.getenv("FACEBOOK_CLIENT_SECRET")
    GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
    
    # Database settings
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/ultimatemarketing")
    DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))
    DB_POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "20"))
    DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "300"))
    DB_STATEMENT_TIMEOUT = int(os.getenv("DB_STATEMENT_TIMEOUT", "30000"))
    DB_ENABLE_METRICS = os.getenv("DB_ENABLE_METRICS", "true").lower() == "true"
    
    # Redis settings
    REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
    
    # RabbitMQ settings
    RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
    RABBITMQ_QUEUE_PREFIX = os.getenv("RABBITMQ_QUEUE_PREFIX", "umt_")
    
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
    LOG_JSON_FORMAT = os.getenv("LOG_JSON_FORMAT", "true").lower() == "true"
    LOG_REQUEST_BODY_ENABLED = os.getenv("LOG_REQUEST_BODY_ENABLED", "false").lower() == "true"
    LOG_RESPONSE_BODY_ENABLED = os.getenv("LOG_RESPONSE_BODY_ENABLED", "false").lower() == "true"
    LOG_SENSITIVE_DATA = os.getenv("LOG_SENSITIVE_DATA", "false").lower() == "true"
    LOG_SLOW_API_THRESHOLD_MS = int(os.getenv("LOG_SLOW_API_THRESHOLD_MS", "500"))
    LOG_SLOW_DB_THRESHOLD_MS = int(os.getenv("LOG_SLOW_DB_THRESHOLD_MS", "100"))
    
    # Initial admin user
    FIRST_SUPERUSER_EMAIL = os.getenv("FIRST_SUPERUSER_EMAIL", "admin@example.com")
    FIRST_SUPERUSER_PASSWORD = os.getenv("FIRST_SUPERUSER_PASSWORD", "changeme")
    
    # Test user for development
    TEST_USER_EMAIL = "test@example.com"
    TEST_USER_PASSWORD = "password123"
    
    # AI settings
    ENABLE_MODEL_CACHING = os.getenv("ENABLE_MODEL_CACHING", "true").lower() == "true"
    MODEL_CACHE_TTL = int(os.getenv("MODEL_CACHE_TTL", "3600"))
    DEFAULT_CONTENT_MODEL = os.getenv("DEFAULT_CONTENT_MODEL", "gpt-4-turbo")
    DEFAULT_STRATEGY_MODEL = os.getenv("DEFAULT_STRATEGY_MODEL", "claude-3-opus")
    OPENAI_DAILY_BUDGET_USD = float(os.getenv("OPENAI_DAILY_BUDGET_USD", "100.0"))
    ANTHROPIC_DAILY_BUDGET_USD = float(os.getenv("ANTHROPIC_DAILY_BUDGET_USD", "100.0"))
    MAX_TOKENS_PER_REQUEST = int(os.getenv("MAX_TOKENS_PER_REQUEST", "8000"))
    AI_RATE_LIMIT_TOKENS_PER_MINUTE = int(os.getenv("AI_RATE_LIMIT_TOKENS_PER_MINUTE", "100000"))
    AI_FALLBACK_TO_SMALLER_MODEL = os.getenv("AI_FALLBACK_TO_SMALLER_MODEL", "true").lower() == "true"
    AI_ENABLE_ADAPTIVE_RATE_LIMITING = os.getenv("AI_ENABLE_ADAPTIVE_RATE_LIMITING", "true").lower() == "true"

    # Service Level Objectives (SLOs) and Service Level Agreements (SLAs)
    SLO_API_LATENCY_MS = int(os.getenv("SLO_API_LATENCY_MS", "500"))
    SLO_API_SUCCESS_RATE = float(os.getenv("SLO_API_SUCCESS_RATE", "0.995"))
    SLO_API_AVAILABILITY = float(os.getenv("SLO_API_AVAILABILITY", "0.9995"))
    SLO_CONTENT_GENERATION_SUCCESS_RATE = float(os.getenv("SLO_CONTENT_GENERATION_SUCCESS_RATE", "0.98"))
    

settings = Settings()