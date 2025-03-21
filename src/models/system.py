from datetime import datetime
import enum
from sqlalchemy import Column, DateTime, Integer, String, Text, JSON, ForeignKey, Boolean, Table
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
