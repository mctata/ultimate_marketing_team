from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.ultimate_marketing_team.core.database import Base

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


class IntegrationHealth(Base):
    """Model for storing historical integration health check data."""
    
    __tablename__ = "integration_health"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    integration_type = Column(String(50), nullable=False)  # social, cms, ad
    integration_id = Column(Integer, nullable=False)
    check_time = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), nullable=False)  # healthy, unhealthy, degraded
    response_time_ms = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    
    # Index for faster lookups
    __table_args__ = (
        {"schema": "umt"},
        Index("idx_integration_health_lookup", "integration_type", "integration_id")
    )
