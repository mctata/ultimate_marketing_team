"""
SEO models for database and Google Search Console integration.
"""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import logging

from src.core.database import Base

# Configure logger
logger = logging.getLogger(__name__)

class SearchConsoleIntegration:
    """Represents a Google Search Console integration for a brand."""
    
    def __init__(self, brand_id: int, property_uri: Optional[str] = None, credentials: Optional[Dict] = None):
        self.brand_id = brand_id
        self.property_uri = property_uri or "https://example.com"
        self.credentials = credentials or {}
        
    def get_indexation_status(self, url: str) -> Dict[str, Any]:
        """
        Get indexation status for a specific URL.
        
        Args:
            url: The URL to check
            
        Returns:
            A dictionary with indexation status
        """
        # In a real implementation, this would call the GSC API's URL Inspection endpoint
        # For development, return mock data
        return {
            "status": "success",
            "url": url,
            "is_indexed": True,
            "indexing_state": "INDEXED",
            "last_crawled": "2025-03-22T14:35:12Z",
            "sitemap": "https://example.com/sitemap.xml",
            "mobile_usability": "USABLE",
            "enhancements": {
                "mobile_usability": {
                    "status": "VALID",
                    "issues": []
                },
                "structured_data": {
                    "status": "VALID",
                    "detected_items": ["Article", "BreadcrumbList"]
                }
            }
        }
        
    def get_mobile_usability(self, url: str) -> Dict[str, Any]:
        """
        Get mobile usability status for a specific URL.
        
        Args:
            url: The URL to check
            
        Returns:
            A dictionary with mobile usability status
        """
        # In a real implementation, this would call the GSC API's Mobile Usability endpoint
        # For development, return mock data
        return {
            "status": "success",
            "url": url,
            "usability_status": "USABLE",
            "issues": [],
            "last_checked": "2025-03-24T09:15:43Z",
            "screenshot": "https://example.com/screenshots/mobile_123.png",
            "device_tested": "Smartphone"
        }


class SEOAuditLog(Base):
    """Model to store SEO audit logs."""
    
    __tablename__ = "seo_audit_logs"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, nullable=False)
    brand_id = Column(Integer, nullable=False)
    audit_type = Column(String(50), nullable=False)  # validation, structured_data, etc.
    status = Column(String(20), nullable=False)  # success, error, warning
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SEOContentMetrics(Base):
    """Model to store SEO metrics for content."""
    
    __tablename__ = "seo_content_metrics"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, nullable=False)
    brand_id = Column(Integer, nullable=False)
    url = Column(String(255), nullable=True)
    
    # Summary metrics
    average_position = Column(Float, nullable=True)
    total_clicks = Column(Integer, nullable=True)
    total_impressions = Column(Integer, nullable=True)
    average_ctr = Column(Float, nullable=True)
    
    # Top keywords
    top_keywords = Column(JSON, nullable=True)
    
    # Historical data
    historical_data = Column(JSON, nullable=True)
    
    # Timestamps
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class SEOKeywordOpportunity(Base):
    """Model to store keyword opportunities for content."""
    
    __tablename__ = "seo_keyword_opportunities"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, nullable=False)
    brand_id = Column(Integer, nullable=False)
    
    keyword = Column(String(255), nullable=False)
    current_ranking = Column(Integer, nullable=True)
    search_volume = Column(Integer, nullable=True)
    competition = Column(String(20), nullable=True)  # LOW, MEDIUM, HIGH
    opportunity_score = Column(Integer, nullable=True)
    recommended_action = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SEOContentUpdateRecommendation(Base):
    """Model to store content update recommendations."""
    
    __tablename__ = "seo_content_update_recommendations"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, nullable=False)
    brand_id = Column(Integer, nullable=False)
    
    recommendation_type = Column(String(50), nullable=False)  # keyword, structure, meta, content
    priority = Column(Integer, nullable=False)  # 1-5, with 1 being highest
    recommendation = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)
    implemented = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SearchConsoleProperty(Base):
    """Model to store Google Search Console properties for brands."""
    
    __tablename__ = "search_console_properties"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, nullable=False)
    property_type = Column(String(50), nullable=False)  # DOMAIN, URL_PREFIX, etc.
    property_uri = Column(String(255), nullable=False)
    verified = Column(Boolean, default=False, nullable=False)
    verification_method = Column(String(50), nullable=True)
    credentials_id = Column(Integer, nullable=True)  # Reference to encrypted credentials
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)