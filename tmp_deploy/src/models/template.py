from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, JSON, Boolean, Table, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.core.database import Base

# Association table for template categories
template_category_association = Table(
    'template_category_association',
    Base.metadata,
    Column('template_id', Integer, ForeignKey('umt.templates.id', ondelete="CASCADE"), primary_key=True),
    Column('template_category_id', Integer, ForeignKey('umt.template_categories.id', ondelete="CASCADE"), primary_key=True),
    schema="umt"
)

# Association table for template industries
template_industry_association = Table(
    'template_industry_association',
    Base.metadata,
    Column('template_id', Integer, ForeignKey('umt.templates.id', ondelete="CASCADE"), primary_key=True),
    Column('template_industry_id', Integer, ForeignKey('umt.template_industries.id', ondelete="CASCADE"), primary_key=True),
    schema="umt"
)

class TemplateIndustry(Base):
    """Industry model for categorizing templates by business type."""
    
    __tablename__ = "template_industries"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    icon = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    templates = relationship("Template", secondary=template_industry_association, back_populates="industries")


class TemplateCategory(Base):
    """Category model for classifying templates by use case."""
    
    __tablename__ = "template_categories"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    icon = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    templates = relationship("Template", secondary=template_category_association, back_populates="categories")


class TemplateFormat(Base):
    """Template format model for different content types (social, email, blog, etc.)."""
    
    __tablename__ = "template_formats"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    platform = Column(String(255), nullable=True)  # For platform-specific formats (e.g., Facebook, Instagram)
    content_type = Column(String(255), nullable=False)  # Type of content (social, email, blog, landing page, ad)
    specs = Column(JSON, nullable=True)  # Technical specifications like character limits, image sizes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    templates = relationship("Template", back_populates="format")


class Template(Base):
    """Template model for reusable content templates."""
    
    __tablename__ = "templates"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    format_id = Column(Integer, ForeignKey("umt.template_formats.id"), nullable=False)
    preview_image = Column(String(512), nullable=True)
    dynamic_fields = Column(JSON, nullable=True)  # JSON array of fields that can be customized
    tone_options = Column(JSON, nullable=True)  # Different tone variations
    is_featured = Column(Boolean, default=False)
    is_premium = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("umt.users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    community_rating = Column(Float, default=0.0)
    usage_count = Column(Integer, default=0)
    version = Column(Integer, default=1)
    
    # Relationships
    format = relationship("TemplateFormat", back_populates="templates")
    categories = relationship("TemplateCategory", secondary=template_category_association, back_populates="templates")
    industries = relationship("TemplateIndustry", secondary=template_industry_association, back_populates="templates")
    created_by_user = relationship("User", foreign_keys=[created_by])
    ratings = relationship("TemplateRating", back_populates="template", cascade="all, delete-orphan")
    usage_history = relationship("TemplateUsage", back_populates="template", cascade="all, delete-orphan")
    versions = relationship("TemplateVersion", back_populates="template", cascade="all, delete-orphan")
    
    
class TemplateRating(Base):
    """User ratings for templates."""
    
    __tablename__ = "template_ratings"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("umt.templates.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("umt.users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # Rating from 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    template = relationship("Template", back_populates="ratings")
    user = relationship("User")


class TemplateUsage(Base):
    """Tracks template usage for analytics."""
    
    __tablename__ = "template_usage"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("umt.templates.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("umt.users.id"), nullable=False)
    content_draft_id = Column(Integer, ForeignKey("umt.content_drafts.id"), nullable=True)
    customizations = Column(JSON, nullable=True)  # What fields were customized
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    template = relationship("Template", back_populates="usage_history")
    user = relationship("User")
    content_draft = relationship("ContentDraft")


class TemplateVersion(Base):
    """Tracks version history of templates."""
    
    __tablename__ = "template_versions"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("umt.templates.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    dynamic_fields = Column(JSON, nullable=True)
    changes = Column(Text, nullable=True)  # Description of changes
    created_by = Column(Integer, ForeignKey("umt.users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    template = relationship("Template", back_populates="versions")
    created_by_user = relationship("User")


class TemplateFavorite(Base):
    """User favorite templates for bookmarking."""
    
    __tablename__ = "template_favorites"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("umt.templates.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("umt.users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    template = relationship("Template")
    user = relationship("User")
