from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.ultimate_marketing_team.core.database import Base

class Competitor(Base):
    """Competitor model for tracking competitor companies."""
    
    __tablename__ = "competitors"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("umt.brands.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    website_url = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    brand = relationship("Brand", back_populates="competitors")
    content = relationship("CompetitorContent", back_populates="competitor", cascade="all, delete-orphan")


class CompetitorContent(Base):
    """Competitor content model for tracking competitor content."""
    
    __tablename__ = "competitor_content"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    competitor_id = Column(Integer, ForeignKey("umt.competitors.id", ondelete="CASCADE"), nullable=False)
    content_url = Column(String(255), nullable=False)
    content_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    published_date = Column(DateTime(timezone=True), nullable=True)
    engagement_metrics = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    competitor = relationship("Competitor", back_populates="content")
