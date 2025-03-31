"""
Settings for the Ultimate Marketing Team application
"""

import os
from typing import Dict, List, Optional, Union, Any, Tuple
import secrets
import logging

logger = logging.getLogger(__name__)

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
    def __init__(self):
        # Generate secure defaults for development only, but log warnings
        if os.getenv("JWT_SECRET") is None and self.ENV != "test":
            generated = secrets.token_hex(32)
            logger.warning(
                "JWT_SECRET environment variable not set! Using generated secret. "
                "This is acceptable for development but NOT for production."
            )
            self._jwt_secret = generated
        else:
            self._jwt_secret = os.getenv("JWT_SECRET")
            
        if os.getenv("CSRF_SECRET") is None and self.ENV != "test":
            generated = secrets.token_hex(32)
            logger.warning(
                "CSRF_SECRET environment variable not set! Using generated secret. "
                "This is acceptable for development but NOT for production."
            )
            self._csrf_secret = generated
        else:
            self._csrf_secret = os.getenv("CSRF_SECRET")
            
        if os.getenv("ENCRYPTION_KEY") is None and self.ENV != "test":
            generated = secrets.token_urlsafe(32)
            logger.warning(
                "ENCRYPTION_KEY environment variable not set! Using generated key. "
                "This is acceptable for development but NOT for production."
            )
            self._encryption_key = generated
        else:
            self._encryption_key = os.getenv("ENCRYPTION_KEY")
    
    @property
    def JWT_SECRET(self) -> str:
        """Get JWT secret key with validation"""
        if not self._jwt_secret:
            raise ValueError("JWT_SECRET must be set")
        return self._jwt_secret
        
    @property
    def CSRF_SECRET(self) -> str:
        """Get CSRF secret key with validation"""
        if not self._csrf_secret:
            raise ValueError("CSRF_SECRET must be set")
        return self._csrf_secret
        
    @property
    def ENCRYPTION_KEY(self) -> str:
        """Get encryption key with validation"""
        if not self._encryption_key:
            raise ValueError("ENCRYPTION_KEY must be set")
        return self._encryption_key
        
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRY = int(os.getenv("JWT_EXPIRY", "86400"))  # 24 hours by default
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
    @property
    def DATABASE_URL(self) -> str:
        """Get database URL with credentials from environment variables"""
        if os.getenv("DATABASE_URL"):
            return os.getenv("DATABASE_URL")
        
        # Construct from components
        pg_user = os.getenv("POSTGRES_USER")
        pg_password = os.getenv("POSTGRES_PASSWORD")
        pg_host = os.getenv("POSTGRES_HOST", "postgres")
        pg_port = os.getenv("POSTGRES_PORT", "5432")
        pg_db = os.getenv("POSTGRES_DB", "ultimatemarketing")
        
        # For development only, use default credentials with warning
        if (not pg_user or not pg_password) and self.ENV != "test":
            logger.warning(
                "Database credentials not provided via environment variables. "
                "Using default credentials for development. "
                "This is NOT secure for production."
            )
            pg_user = pg_user or "postgres"
            pg_password = pg_password or "postgres"
        
        return f"postgresql://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_db}"
    
    DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))
    DB_POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "20"))
    DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "300"))
    DB_STATEMENT_TIMEOUT = int(os.getenv("DB_STATEMENT_TIMEOUT", "30000"))
    DB_ENABLE_METRICS = os.getenv("DB_ENABLE_METRICS", "true").lower() == "true"
    
    # Redis settings
    @property
    def REDIS_URL(self) -> str:
        """Get Redis URL with credentials from environment variables"""
        if os.getenv("REDIS_URL"):
            return os.getenv("REDIS_URL")
        
        # Construct from components
        redis_host = os.getenv("REDIS_HOST", "redis")
        redis_port = os.getenv("REDIS_PORT", "6379")
        redis_password = os.getenv("REDIS_PASSWORD", "")
        redis_db = os.getenv("REDIS_DB", "0")
        
        # Include password if provided
        if redis_password:
            return f"redis://:{redis_password}@{redis_host}:{redis_port}/{redis_db}"
        else:
            return f"redis://{redis_host}:{redis_port}/{redis_db}"
    
    # RabbitMQ settings
    @property
    def RABBITMQ_URL(self) -> str:
        """Get RabbitMQ URL with credentials from environment variables"""
        if os.getenv("RABBITMQ_URL"):
            return os.getenv("RABBITMQ_URL")
            
        # Construct from components
        rabbitmq_user = os.getenv("RABBITMQ_USER")
        rabbitmq_password = os.getenv("RABBITMQ_PASSWORD")
        rabbitmq_host = os.getenv("RABBITMQ_HOST", "rabbitmq")
        rabbitmq_port = os.getenv("RABBITMQ_PORT", "5672")
        rabbitmq_vhost = os.getenv("RABBITMQ_VHOST", "/")
        
        # For development only, use default credentials with warning
        if (not rabbitmq_user or not rabbitmq_password) and self.ENV != "test":
            logger.warning(
                "RabbitMQ credentials not provided via environment variables. "
                "Using default credentials for development. "
                "This is NOT secure for production."
            )
            rabbitmq_user = rabbitmq_user or "guest"
            rabbitmq_password = rabbitmq_password or "guest"
        
        return f"amqp://{rabbitmq_user}:{rabbitmq_password}@{rabbitmq_host}:{rabbitmq_port}/{rabbitmq_vhost}"
    
    RABBITMQ_QUEUE_PREFIX = os.getenv("RABBITMQ_QUEUE_PREFIX", "umt_")
    
    # Email settings
    SMTP_TLS = os.getenv("SMTP_TLS", "true").lower() == "true"
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    EMAILS_FROM_EMAIL = os.getenv("EMAILS_FROM_EMAIL")
    EMAILS_FROM_NAME = os.getenv("EMAILS_FROM_NAME", "Ultimate Marketing Team")
    
    # Email validation
    def validate_email_settings(self) -> bool:
        """Check if email settings are configured properly"""
        if self.ENV == "production" or self.ENV == "staging":
            required = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "EMAILS_FROM_EMAIL"]
            missing = [field for field in required if not getattr(self, field)]
            
            if missing:
                logger.error(f"Missing required email configuration: {', '.join(missing)}")
                return False
        return True
    
    # File storage settings
    UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")
    MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB
    
    # Logging settings
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_JSON_FORMAT = os.getenv("LOG_JSON_FORMAT", "true").lower() == "true"
    LOG_REQUEST_BODY_ENABLED = os.getenv("LOG_REQUEST_BODY_ENABLED", "false").lower() == "true"
    LOG_RESPONSE_BODY_ENABLED = os.getenv("LOG_RESPONSE_BODY_ENABLED", "false").lower() == "true"
    # Never log sensitive data by default
    LOG_SENSITIVE_DATA = os.getenv("LOG_SENSITIVE_DATA", "false").lower() == "true"
    LOG_SLOW_API_THRESHOLD_MS = int(os.getenv("LOG_SLOW_API_THRESHOLD_MS", "500"))
    LOG_SLOW_DB_THRESHOLD_MS = int(os.getenv("LOG_SLOW_DB_THRESHOLD_MS", "100"))
    
    # Initial admin user
    FIRST_SUPERUSER_EMAIL = os.getenv("FIRST_SUPERUSER_EMAIL")
    FIRST_SUPERUSER_PASSWORD = os.getenv("FIRST_SUPERUSER_PASSWORD")
    
    def validate_superuser_settings(self) -> bool:
        """Check if superuser settings are configured properly for production"""
        if self.ENV == "production" or self.ENV == "staging":
            if not self.FIRST_SUPERUSER_EMAIL or not self.FIRST_SUPERUSER_PASSWORD:
                logger.error("Superuser credentials must be provided in production")
                return False
            # Check password strength
            if len(self.FIRST_SUPERUSER_PASSWORD) < 12:
                logger.error("Superuser password is too weak (min 12 chars)")
                return False
        return True
    
    # Test user for development only
    @property
    def TEST_USER_EMAIL(self) -> str:
        if self.ENV != "development" and self.ENV != "test":
            logger.warning("Test user should only be used in development")
        return os.getenv("TEST_USER_EMAIL", "test@example.com")
    
    @property
    def TEST_USER_PASSWORD(self) -> str:
        if self.ENV != "development" and self.ENV != "test":
            logger.warning("Test user should only be used in development")
        return os.getenv("TEST_USER_PASSWORD", "password123")
    
    # Redis Cache Settings
    CACHE_MONITORING_ENABLED = os.getenv("CACHE_MONITORING_ENABLED", "true").lower() == "true"
    CACHE_DEFAULT_TTL = int(os.getenv("CACHE_DEFAULT_TTL", "3600"))  # 1 hour in seconds
    CACHE_LONG_TTL = int(os.getenv("CACHE_LONG_TTL", "86400"))  # 24 hours in seconds
    CACHE_SHORT_TTL = int(os.getenv("CACHE_SHORT_TTL", "300"))  # 5 minutes in seconds
    CACHE_MAX_MEMORY_MB = int(os.getenv("CACHE_MAX_MEMORY_MB", "500"))  # 500MB max cache size
    CACHE_ENABLE_COMPRESSION = os.getenv("CACHE_ENABLE_COMPRESSION", "true").lower() == "true"
    CACHE_MAX_CONNECTIONS = int(os.getenv("CACHE_MAX_CONNECTIONS", "20"))
    CACHE_SOCKET_TIMEOUT = float(os.getenv("CACHE_SOCKET_TIMEOUT", "5.0"))  # seconds
    CACHE_SOCKET_CONNECT_TIMEOUT = float(os.getenv("CACHE_SOCKET_CONNECT_TIMEOUT", "3.0"))  # seconds
    CACHE_REDIS_DATABASE = int(os.getenv("CACHE_REDIS_DATABASE", "0"))
    
    # Cache TTL for specific data types (in seconds)
    CACHE_TTL_CONTENT = int(os.getenv("CACHE_TTL_CONTENT", "600"))  # 10 minutes for content
    CACHE_TTL_BRAND = int(os.getenv("CACHE_TTL_BRAND", "3600"))  # 1 hour for brand data
    CACHE_TTL_PROJECT = int(os.getenv("CACHE_TTL_PROJECT", "1800"))  # 30 minutes for projects
    CACHE_TTL_CAMPAIGN = int(os.getenv("CACHE_TTL_CAMPAIGN", "900"))  # 15 minutes for campaigns
    CACHE_TTL_USER = int(os.getenv("CACHE_TTL_USER", "7200"))  # 2 hours for user data
    CACHE_TTL_ANALYTICS = int(os.getenv("CACHE_TTL_ANALYTICS", "600"))  # 10 minutes for analytics
    CACHE_TTL_TEMPLATE = int(os.getenv("CACHE_TTL_TEMPLATE", "3600"))  # 1 hour for templates
    CACHE_TTL_SYSTEM = int(os.getenv("CACHE_TTL_SYSTEM", "300"))  # 5 minutes for system settings
    
    # Cache eviction policy
    CACHE_EVICTION_POLICY = os.getenv("CACHE_EVICTION_POLICY", "volatile-lru")  # LRU for keys with expiry

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
    

# Add validation method to Settings class
def validate_all_settings(self) -> bool:
    """Validate all critical settings before startup"""
    if self.ENV == "production" or self.ENV == "staging":
        validators = [
            self.validate_email_settings,
            self.validate_superuser_settings,
        ]
        
        for validator in validators:
            if not validator():
                return False
    
    return True

# Add validation method to detect secrets in code
def check_for_hardcoded_secrets(self) -> bool:
    """Check for potentially hardcoded secrets remaining in settings"""
    potential_hardcoded = []
    
    # Check for anything that looks like a token, key, or password in the code
    for attr_name in dir(self):
        if attr_name.startswith('_'):
            continue
            
        attr_value = getattr(self, attr_name)
        # Skip methods and properties
        if callable(attr_value) or isinstance(attr_value, property):
            continue
            
        # Check if it's a string and looks suspicious
        if isinstance(attr_value, str) and len(attr_value) > 8:
            suspicious_patterns = ['key', 'secret', 'password', 'token', 'credential']
            if any(pattern in attr_name.lower() for pattern in suspicious_patterns):
                if attr_value and not attr_value.startswith(('os.getenv', '{', '$')):
                    potential_hardcoded.append(attr_name)
    
    if potential_hardcoded:
        logger.warning(f"Potential hardcoded secrets found in settings: {', '.join(potential_hardcoded)}")
        return False
    
    return True

Settings.validate_all_settings = validate_all_settings
Settings.check_for_hardcoded_secrets = check_for_hardcoded_secrets

settings = Settings()

# Check for hardcoded secrets at import time
settings.check_for_hardcoded_secrets()