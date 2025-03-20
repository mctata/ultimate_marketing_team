from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.ultimate_marketing_team.core.database import Base

class Brand(Base):
    """Brand model for managing brand information and guidelines."""
    
    __tablename__ = "brands"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    website_url = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    logo_url = Column(String(512), nullable=True)
    guidelines = Column(JSON, nullable=True)
    created_by = Column(Integer, ForeignKey("umt.users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    projects = relationship("Project", back_populates="brand", cascade="all, delete-orphan")
    competitors = relationship("Competitor", back_populates="brand", cascade="all, delete-orphan")

class ProjectType(Base):
    """Project type model for categorizing projects (e.g., Email, Blog, Social Post)."""
    
    __tablename__ = "project_types"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    projects = relationship("Project", back_populates="project_type")


class Project(Base):
    """Project model for managing marketing projects."""
    
    __tablename__ = "projects"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("umt.brands.id", ondelete="CASCADE"), nullable=False)
    project_type_id = Column(Integer, ForeignKey("umt.project_types.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="draft")
    created_by = Column(Integer, ForeignKey("umt.users.id"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("umt.users.id"), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    brand = relationship("Brand", back_populates="projects")
    project_type = relationship("ProjectType", back_populates="projects")
    created_by_user = relationship("User", foreign_keys=[created_by], back_populates="projects")
    assigned_to_user = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_projects")
    content_drafts = relationship("ContentDraft", back_populates="project", cascade="all, delete-orphan")
    ab_tests = relationship("ABTest", back_populates="project", cascade="all, delete-orphan")
    content_calendar_entries = relationship("ContentCalendar", back_populates="project", cascade="all, delete-orphan")
    content_performance_metrics = relationship("ContentPerformance", back_populates="project", cascade="all, delete-orphan")
