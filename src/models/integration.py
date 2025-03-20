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
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
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
    api_secret = Column(Text, nullable=True)
    username = Column(String(255), nullable=True)
    password = Column(Text, nullable=True)
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
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    brand = relationship("Brand", back_populates="ad_accounts")
    ad_campaigns = relationship("AdCampaign", back_populates="ad_account", cascade="all, delete-orphan")
