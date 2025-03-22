from datetime import datetime
from typing import List, Optional
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.core.database import Base

class SocialAccount(Base):
    """Social media account model for integration with social platforms."""
    
    __tablename__ = "social_accounts"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("umt.brands.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False)
    account_id = Column(String(255), nullable=False)
    account_name = Column(String(255), nullable=True)
    access_token = Column(Text, nullable=True)
    access_token_salt = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    refresh_token_salt = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    health_status = Column(String(50), nullable=True)
    last_health_check = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    brand = relationship("Brand", back_populates="social_accounts")


class CMSAccount(Base):
    """CMS account model for integration with content management systems."""
    
    __tablename__ = "cms_accounts"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("umt.brands.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False)
    site_url = Column(String(255), nullable=False)
    api_key = Column(Text, nullable=True)
    api_key_salt = Column(Text, nullable=True)
    api_secret = Column(Text, nullable=True)
    api_secret_salt = Column(Text, nullable=True)
    username = Column(String(255), nullable=True)
    password = Column(Text, nullable=True)
    password_salt = Column(Text, nullable=True)
    health_status = Column(String(50), nullable=True)
    last_health_check = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    brand = relationship("Brand", back_populates="cms_accounts")


class AdAccount(Base):
    """Advertising account model for integration with ad platforms."""
    
    __tablename__ = "ad_accounts"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("umt.brands.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False)
    account_id = Column(String(255), nullable=False)
    access_token = Column(Text, nullable=True)
    access_token_salt = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    refresh_token_salt = Column(Text, nullable=True)
    # Additional Google Ads fields
    developer_token = Column(Text, nullable=True)
    developer_token_salt = Column(Text, nullable=True)
    client_id = Column(Text, nullable=True)
    client_id_salt = Column(Text, nullable=True)
    client_secret = Column(Text, nullable=True)
    client_secret_salt = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    health_status = Column(String(50), nullable=True)
    last_health_check = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    brand = relationship("Brand", back_populates="ad_accounts")
    ad_campaigns = relationship("AdCampaign", back_populates="ad_account", cascade="all, delete-orphan")


class EmailAccount(Base):
    """Email marketing account model for integration with email platforms."""
    
    __tablename__ = "email_accounts"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("umt.brands.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False)  # mailchimp, hubspot, etc.
    api_key = Column(Text, nullable=True)
    api_key_salt = Column(Text, nullable=True)
    api_secret = Column(Text, nullable=True)
    api_secret_salt = Column(Text, nullable=True)
    access_token = Column(Text, nullable=True)
    access_token_salt = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    refresh_token_salt = Column(Text, nullable=True)
    account_id = Column(String(255), nullable=True)
    data_center = Column(String(50), nullable=True)  # For Mailchimp regional data centers
    server_prefix = Column(String(50), nullable=True)  # For platform-specific URLs
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    health_status = Column(String(50), nullable=True)
    last_health_check = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    brand = relationship("Brand", back_populates="email_accounts")


class AnalyticsAccount(Base):
    """Analytics account model for integration with analytics platforms."""
    
    __tablename__ = "analytics_accounts" 
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("umt.brands.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False)  # google_analytics, adobe_analytics, etc.
    property_id = Column(String(255), nullable=True)  # GA4 property ID, Adobe Report Suite ID, etc.
    view_id = Column(String(255), nullable=True)  # View/profile ID when applicable
    api_key = Column(Text, nullable=True)
    api_key_salt = Column(Text, nullable=True)
    api_secret = Column(Text, nullable=True)
    api_secret_salt = Column(Text, nullable=True)
    access_token = Column(Text, nullable=True)
    access_token_salt = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    refresh_token_salt = Column(Text, nullable=True)
    service_account_json = Column(Text, nullable=True)  # For Google service account JSON
    service_account_json_salt = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    health_status = Column(String(50), nullable=True)
    last_health_check = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    brand = relationship("Brand", back_populates="analytics_accounts")


class ApiKey(Base):
    """API key model for developer platform integrations."""
    
    __tablename__ = "api_keys"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("umt.brands.id", ondelete="CASCADE"), nullable=False)
    key_name = Column(String(100), nullable=False)
    api_key = Column(String(64), nullable=False, index=True)  # Hashed key
    api_key_salt = Column(String(32), nullable=False)
    scopes = Column(JSON, nullable=False, default=list)  # List of permission scopes
    created_by = Column(Integer, ForeignKey("umt.users.id"), nullable=False)
    rate_limit = Column(Integer, nullable=False, default=60)  # Requests per minute
    is_active = Column(Boolean, nullable=False, default=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    brand = relationship("Brand", back_populates="api_keys")
    creator = relationship("User")


class Webhook(Base):
    """Webhook configuration model for developer platform integrations."""
    
    __tablename__ = "webhooks"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("umt.brands.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    url = Column(String(255), nullable=False)
    events = Column(JSON, nullable=False)  # List of event types to trigger webhook
    secret_key = Column(String(64), nullable=True)  # For request signing
    secret_key_salt = Column(String(32), nullable=True)
    format = Column(String(20), nullable=False, default="json")  # json, xml, etc.
    is_active = Column(Boolean, nullable=False, default=True)
    created_by = Column(Integer, ForeignKey("umt.users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    brand = relationship("Brand", back_populates="webhooks")
    creator = relationship("User")


class IntegrationHealth(Base):
    """Model for storing historical integration health check data."""
    
    __tablename__ = "integration_health"
    
    id = Column(Integer, primary_key=True, index=True)
    integration_type = Column(String(50), nullable=False)  # social, cms, ad, email, analytics
    integration_id = Column(Integer, nullable=False)
    check_time = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), nullable=False)  # healthy, unhealthy, degraded
    response_time_ms = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    
    # Schema and Index for faster lookups
    __table_args__ = (
        Index("idx_integration_health_lookup", "integration_type", "integration_id"),
        {"schema": "umt"}
    )
