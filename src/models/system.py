from datetime import datetime
import enum
from sqlalchemy import Column, DateTime, Integer, String, Text, JSON, ForeignKey, Boolean, Table, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.core.database import Base

# Many-to-many association tables
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("umt.users.id"), primary_key=True),
    Column("role_id", Integer, ForeignKey("umt.roles.id"), primary_key=True),
    schema="umt"
)

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("umt.roles.id"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("umt.permissions.id"), primary_key=True),
    schema="umt"
)

class ActionType(enum.Enum):
    """Enum for audit log action types"""
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    PUBLISH = "publish"
    ASSIGN = "assign"

class User(Base):
    """User model for authentication and authorization"""
    
    __tablename__ = "users"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")
    projects = relationship("Project", foreign_keys="Project.created_by", back_populates="created_by_user")
    assigned_projects = relationship("Project", foreign_keys="Project.assigned_to", back_populates="assigned_to_user")
    content_drafts = relationship("ContentDraft", back_populates="created_by_user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Role(Base):
    """Role model for RBAC"""
    
    __tablename__ = "roles"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    users = relationship("User", secondary=user_roles, back_populates="roles")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")

class Permission(Base):
    """Permission model for RBAC"""
    
    __tablename__ = "permissions"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    resource = Column(String(50), nullable=False)  # e.g., "brand", "project", "content"
    action = Column(String(20), nullable=False)    # e.g., "create", "read", "update", "delete"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

class AuditLog(Base):
    """Audit log for tracking user actions on resources"""
    
    __tablename__ = "audit_logs"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("umt.users.id"), nullable=False)
    action = Column(String(20), nullable=False)  # CREATE, READ, UPDATE, DELETE, etc.
    resource_type = Column(String(50), nullable=False)  # brand, project, content, etc.
    resource_id = Column(Integer, nullable=False)  # Primary key of the affected resource
    previous_state = Column(JSON, nullable=True)  # Previous state for auditing changes
    new_state = Column(JSON, nullable=True)      # New state for auditing changes
    ip_address = Column(String(45), nullable=True)  # Support for IPv6
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")

class Notification(Base):
    """Notification model for user notifications."""
    
    __tablename__ = "notifications"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("umt.users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    notification_type = Column(String(50), nullable=False)  # e.g. "system", "task", "content", etc.
    related_entity_type = Column(String(50), nullable=True)  # e.g. "project", "content", etc.
    related_entity_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notifications")

class SystemLog(Base):
    """System log model for tracking system events and errors."""
    
    __tablename__ = "system_logs"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    log_level = Column(String(20), nullable=False)
    component = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AIAPIUsage(Base):
    """AI API usage tracking for cost and performance monitoring."""
    
    __tablename__ = "ai_api_usage"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(50), nullable=False, index=True)  # openai, anthropic, etc.
    model = Column(String(50), nullable=False, index=True)     # gpt-4, claude-3-opus, etc.
    tokens_in = Column(Integer, nullable=False)                # Input tokens
    tokens_out = Column(Integer, nullable=False)               # Output tokens
    total_tokens = Column(Integer, nullable=False)             # Total tokens
    duration_ms = Column(Integer, nullable=False)              # Request duration in ms
    cost_usd = Column(Integer, nullable=False)                 # Cost in USD (stored as cents)
    endpoint = Column(String(50), nullable=False)              # completion, chat, etc.
    cached = Column(Boolean, default=False, nullable=False)    # Whether response was from cache
    success = Column(Boolean, default=True, nullable=False)    # Whether request succeeded
    error_type = Column(String(50), nullable=True)             # Type of error if failed
    agent_type = Column(String(50), nullable=True, index=True) # Type of agent that made the request
    task_id = Column(String(100), nullable=True, index=True)   # Associated task ID
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class DailyCostSummary(Base):
    """Daily aggregated cost summary by provider and model."""
    
    __tablename__ = "daily_cost_summary"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    provider = Column(String(50), nullable=False, index=True)
    model = Column(String(50), nullable=False, index=True)
    total_requests = Column(Integer, default=0, nullable=False)
    cached_requests = Column(Integer, default=0, nullable=False)
    failed_requests = Column(Integer, default=0, nullable=False)
    total_tokens = Column(Integer, default=0, nullable=False)
    cost_usd = Column(Integer, default=0, nullable=False)  # Cost in USD (stored as cents)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class UserPreference(Base):
    """User preferences for platform customization and settings."""
    
    __tablename__ = "user_preferences"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("umt.users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    theme = Column(String(20), server_default="light", nullable=True)
    notifications_enabled = Column(Boolean, server_default="true", nullable=False)
    email_frequency = Column(String(20), server_default="daily", nullable=True)
    default_dashboard_view = Column(String(50), nullable=True)
    timezone = Column(String(50), server_default="UTC", nullable=True)
    language = Column(String(10), server_default="en", nullable=True)
    settings = Column(JSON, nullable=True)  # For additional settings as JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="preferences")


class ContentMetric(Base):
    """Content performance metrics model."""
    
    __tablename__ = "content_metrics"
    __table_args__ = (
        UniqueConstraint("content_id", "date", "platform", name="uq_content_metric_content_date_platform"),
        {"schema": "umt"}
    )
    
    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, nullable=False, index=True)
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    platform = Column(String(50), nullable=False, index=True)  # website, facebook, twitter, linkedin, etc.
    
    # Engagement metrics
    views = Column(Integer, default=0, nullable=False)
    unique_visitors = Column(Integer, default=0, nullable=False)
    likes = Column(Integer, default=0, nullable=False)
    shares = Column(Integer, default=0, nullable=False)
    comments = Column(Integer, default=0, nullable=False)
    clicks = Column(Integer, default=0, nullable=False)
    click_through_rate = Column(Float, default=0.0, nullable=False)
    avg_time_on_page = Column(Integer, default=0, nullable=False)  # In seconds
    bounce_rate = Column(Float, default=0.0, nullable=False)
    scroll_depth = Column(Float, default=0.0, nullable=False)
    
    # Conversion metrics
    conversions = Column(Integer, default=0, nullable=False)
    conversion_rate = Column(Float, default=0.0, nullable=False)
    leads_generated = Column(Integer, default=0, nullable=False)
    revenue_generated = Column(Integer, default=0, nullable=False)  # In cents
    
    # SEO metrics
    serp_position = Column(Float, default=0.0, nullable=True)
    organic_traffic = Column(Integer, default=0, nullable=False)
    backlinks = Column(Integer, default=0, nullable=False)
    
    # Raw data for advanced analysis
    demographics = Column(JSON, nullable=True)
    sources = Column(JSON, nullable=True)
    devices = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ContentAttributionPath(Base):
    """Multi-touch attribution model for content conversions."""
    
    __tablename__ = "content_attribution_paths"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    user_identifier = Column(String(255), nullable=False, index=True)  # Anonymized user ID
    conversion_id = Column(String(255), nullable=False, index=True)
    conversion_type = Column(String(50), nullable=False)  # purchase, signup, download, etc.
    conversion_value = Column(Integer, default=0, nullable=False)  # In cents
    path = Column(JSON, nullable=False)  # Array of touchpoints with content_id, timestamp, platform
    first_touch_content_id = Column(Integer, nullable=True, index=True)
    last_touch_content_id = Column(Integer, nullable=True, index=True)
    conversion_date = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CustomDashboard(Base):
    """User-defined custom analytics dashboards."""
    
    __tablename__ = "custom_dashboards"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("umt.users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    layout = Column(JSON, nullable=False)  # Grid layout config
    widgets = Column(JSON, nullable=False)  # Widget definitions and config
    is_default = Column(Boolean, default=False, nullable=False)
    role_id = Column(Integer, ForeignKey("umt.roles.id", ondelete="SET NULL"), nullable=True)  # For role-specific dashboards
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    role = relationship("Role")


class AnalyticsReport(Base):
    """Scheduled and generated analytics reports."""
    
    __tablename__ = "analytics_reports"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("umt.users.id", ondelete="CASCADE"), nullable=False, index=True)
    report_type = Column(String(50), nullable=False)  # content, campaign, competitor, executive, etc.
    template_id = Column(String(100), nullable=True)  # Optional template identifier
    config = Column(JSON, nullable=False)  # Report configuration (date ranges, metrics, filters)
    
    # Scheduling
    schedule_type = Column(String(50), nullable=True)  # none, daily, weekly, monthly, etc.
    schedule_config = Column(JSON, nullable=True)  # Cron expression, time of day, etc.
    recipients = Column(JSON, nullable=True)  # List of email recipients
    
    # For generated reports
    last_generated = Column(DateTime(timezone=True), nullable=True)
    file_path = Column(String(255), nullable=True)  # Path to stored report file
    file_type = Column(String(50), nullable=True)  # pdf, csv, html, pptx, etc.
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")


class ContentPredictionModel(Base):
    """Machine learning model metadata for content performance prediction."""
    
    __tablename__ = "content_prediction_models"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    model_type = Column(String(50), nullable=False)  # regression, classification, timeseries, etc.
    target_metric = Column(String(50), nullable=False)  # clicks, conversions, views, etc.
    features = Column(JSON, nullable=False)  # List of features used in the model
    model_path = Column(String(255), nullable=False)  # Path to stored model file
    performance_metrics = Column(JSON, nullable=False)  # Accuracy, precision, recall, etc.
    training_date = Column(DateTime(timezone=True), nullable=False)
    last_used = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ContentPerformancePrediction(Base):
    """Content performance predictions from ML models."""
    
    __tablename__ = "content_performance_predictions"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, nullable=False, index=True)
    model_id = Column(Integer, ForeignKey("umt.content_prediction_models.id"), nullable=False)
    prediction_date = Column(DateTime(timezone=True), nullable=False)
    metric = Column(String(50), nullable=False)  # clicks, conversions, views, etc.
    predicted_value = Column(Float, nullable=False)
    confidence_interval_lower = Column(Float, nullable=True)
    confidence_interval_upper = Column(Float, nullable=True)
    features_used = Column(JSON, nullable=True)  # Feature values used for this prediction
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    model = relationship("ContentPredictionModel")
