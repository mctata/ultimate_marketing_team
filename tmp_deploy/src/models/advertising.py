from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Float, JSON, Boolean, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.core.database import Base

class AdCampaign(Base):
    """Ad campaign model for managing advertising campaigns."""
    
    __tablename__ = "ad_campaigns"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("umt.brands.id", ondelete="CASCADE"), nullable=False)
    ad_account_id = Column(Integer, ForeignKey("umt.ad_accounts.id"), nullable=False)
    platform = Column(String(50), nullable=False)
    campaign_name = Column(String(255), nullable=False)
    campaign_objective = Column(String(50), nullable=True)
    budget = Column(Numeric(15, 2), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="draft")
    platform_campaign_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    brand = relationship("Brand", back_populates="ad_campaigns")
    ad_account = relationship("AdAccount", back_populates="ad_campaigns")
    ad_sets = relationship("AdSet", back_populates="ad_campaign", cascade="all, delete-orphan")
    performance_metrics = relationship("AdPerformance", back_populates="ad_campaign", cascade="all, delete-orphan")


class AdSet(Base):
    """Ad set model for managing groups of ads within a campaign."""
    
    __tablename__ = "ad_sets"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    ad_campaign_id = Column(Integer, ForeignKey("umt.ad_campaigns.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    targeting = Column(JSON, nullable=True)
    budget = Column(Numeric(15, 2), nullable=True)
    bid_strategy = Column(String(50), nullable=True)
    platform_ad_set_id = Column(String(255), nullable=True)
    status = Column(String(50), default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    ad_campaign = relationship("AdCampaign", back_populates="ad_sets")
    ads = relationship("Ad", back_populates="ad_set", cascade="all, delete-orphan")
    performance_metrics = relationship("AdPerformance", back_populates="ad_set", cascade="all, delete-orphan")


class Ad(Base):
    """Ad model for managing individual ads."""
    
    __tablename__ = "ads"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    ad_set_id = Column(Integer, ForeignKey("umt.ad_sets.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    content_draft_id = Column(Integer, ForeignKey("umt.content_drafts.id"), nullable=True)
    ad_format = Column(String(50), nullable=True)
    headline = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    video_url = Column(String(255), nullable=True)
    call_to_action = Column(String(50), nullable=True)
    destination_url = Column(String(255), nullable=True)
    platform_ad_id = Column(String(255), nullable=True)
    status = Column(String(50), default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    ad_set = relationship("AdSet", back_populates="ads")
    content_draft = relationship("ContentDraft", back_populates="ads")
    performance_metrics = relationship("AdPerformance", back_populates="ad", cascade="all, delete-orphan")


class AdPerformance(Base):
    """Ad performance metrics model for tracking ad engagement and ROI."""
    
    __tablename__ = "ad_performance"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    ad_id = Column(Integer, ForeignKey("umt.ads.id", ondelete="CASCADE"), nullable=True)
    ad_set_id = Column(Integer, ForeignKey("umt.ad_sets.id", ondelete="CASCADE"), nullable=True)
    ad_campaign_id = Column(Integer, ForeignKey("umt.ad_campaigns.id", ondelete="CASCADE"), nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    spend = Column(Numeric(15, 2), default=0)
    conversions = Column(Integer, default=0)
    revenue = Column(Numeric(15, 2), default=0)
    ctr = Column(Numeric(10, 4), nullable=True)
    cpc = Column(Numeric(10, 4), nullable=True)
    cpa = Column(Numeric(10, 4), nullable=True)
    roas = Column(Numeric(10, 4), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    ad = relationship("Ad", back_populates="performance_metrics")
    ad_set = relationship("AdSet", back_populates="performance_metrics")
    ad_campaign = relationship("AdCampaign", back_populates="performance_metrics")
