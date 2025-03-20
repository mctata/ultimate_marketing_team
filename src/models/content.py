from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Float, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.core.database import Base

class ContentTopic(Base):
    """Content topic model for categorizing and managing content themes."""
    
    __tablename__ = "content_topics"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    keywords = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ContentDraft(Base):
    """Content draft model for storing versions of content."""
    
    __tablename__ = "content_drafts"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("umt.projects.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    version = Column(Integer, nullable=False)
    status = Column(String(50), default="draft")
    feedback = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("umt.users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="content_drafts")
    created_by_user = relationship("User", back_populates="content_drafts")
    ab_test_variants = relationship("ABTestVariant", back_populates="content_draft", cascade="all, delete-orphan")
    content_calendar_entries = relationship("ContentCalendar", back_populates="content_draft")
    content_performance_metrics = relationship("ContentPerformance", back_populates="content_draft")
    ads = relationship("Ad", back_populates="content_draft")


class ABTest(Base):
    """A/B Test model for testing different content variations."""
    
    __tablename__ = "ab_tests"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("umt.projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="ab_tests")
    variants = relationship("ABTestVariant", back_populates="ab_test", cascade="all, delete-orphan")


class ABTestVariant(Base):
    """A/B Test Variant model for individual variants in an A/B test."""
    
    __tablename__ = "ab_test_variants"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    ab_test_id = Column(Integer, ForeignKey("umt.ab_tests.id", ondelete="CASCADE"), nullable=False)
    content_draft_id = Column(Integer, ForeignKey("umt.content_drafts.id"), nullable=False)
    variant_name = Column(String(50), nullable=False)
    is_control = Column(Boolean, default=False)
    impressions = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    ab_test = relationship("ABTest", back_populates="variants")
    content_draft = relationship("ContentDraft", back_populates="ab_test_variants")


class ContentCalendar(Base):
    """Content calendar model for scheduling content publication."""
    
    __tablename__ = "content_calendar"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("umt.projects.id", ondelete="CASCADE"), nullable=False)
    content_draft_id = Column(Integer, ForeignKey("umt.content_drafts.id"), nullable=True)
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    published_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="scheduled")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="content_calendar_entries")
    content_draft = relationship("ContentDraft", back_populates="content_calendar_entries")


class ContentPerformance(Base):
    """Content performance metrics model for tracking content engagement."""
    
    __tablename__ = "content_performance"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("umt.projects.id", ondelete="CASCADE"), nullable=True)
    content_draft_id = Column(Integer, ForeignKey("umt.content_drafts.id", ondelete="CASCADE"), nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)
    platform = Column(String(50), nullable=False)
    views = Column(Integer, default=0)
    engagements = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    conversion_rate = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="content_performance_metrics")
    content_draft = relationship("ContentDraft", back_populates="content_performance_metrics")
