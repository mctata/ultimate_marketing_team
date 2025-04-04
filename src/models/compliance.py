"""
Compliance models for data retention, consent management, and data subject requests.

This module includes models for GDPR, CCPA, and other global privacy regulations.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional

from sqlalchemy import Column, DateTime, Integer, String, Text, JSON, ForeignKey, Boolean, Table, Float, UniqueConstraint, MetaData
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.core.database import Base


class DataRetentionPolicy(Base):
    """Defines retention policy for different entity types."""
    
    __tablename__ = "data_retention_policies"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False, unique=True)  # user, content, project, etc.
    retention_period_days = Column(Integer, nullable=False)
    archive_strategy = Column(String(20), nullable=False)  # archive, delete
    legal_basis = Column(String(100), nullable=True)  # legal justification
    applies_to_deleted = Column(Boolean, nullable=False, default=True)  # whether to apply to soft-deleted records
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    exemptions = relationship("DataRetentionExemption", back_populates="policy")
    execution_logs = relationship("DataRetentionExecutionLog", back_populates="policy")


class DataRetentionExemption(Base):
    """Exemptions from retention policy for specific entities."""
    
    __tablename__ = "data_retention_exemptions"
    __table_args__ = (
        UniqueConstraint("entity_type", "entity_id", name="uq_retention_exemption_entity"),
        {"schema": "umt"}
    )
    
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), ForeignKey("umt.data_retention_policies.entity_type", ondelete="CASCADE"), nullable=False)
    entity_id = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False)  # legal hold, investigation, etc.
    expires_at = Column(DateTime(timezone=True), nullable=True)  # when exemption expires
    created_by = Column(Integer, ForeignKey("umt.users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    policy = relationship("DataRetentionPolicy", back_populates="exemptions")
    created_by_user = relationship("User")


class DataRetentionExecutionLog(Base):
    """Logs for data retention policy executions."""
    
    __tablename__ = "data_retention_execution_logs"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), ForeignKey("umt.data_retention_policies.entity_type", ondelete="CASCADE"), nullable=False)
    records_processed = Column(Integer, nullable=False, default=0)
    records_archived = Column(Integer, nullable=False, default=0)
    records_deleted = Column(Integer, nullable=False, default=0)
    execution_time_sec = Column(Float, nullable=False)
    status = Column(String(20), nullable=False)  # success, error
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    policy = relationship("DataRetentionPolicy", back_populates="execution_logs")


class ConsentRecord(Base):
    """Records user consent for various purposes (marketing, analytics, etc.)."""
    
    __tablename__ = "consent_records"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("umt.users.id", ondelete="CASCADE"), nullable=False, index=True)
    consent_type = Column(String(50), nullable=False)  # marketing, analytics, third_party, etc.
    status = Column(Boolean, nullable=False)  # true=consented, false=declined
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    consent_version = Column(String(50), nullable=False)  # Version of consent form/terms
    data_categories = Column(JSON, nullable=True)  # Categories of data covered by this consent
    
    # Relationships - Added option to handle missing relationship
    user = relationship("User", back_populates="consent_records", foreign_keys=[user_id], primaryjoin="ConsentRecord.user_id == User.id", overlaps="content,projects,audit_logs,assigned_projects,content_drafts,notifications,preferences,data_requests")


class DataSubjectRequest(Base):
    """Tracks data subject access/deletion/correction requests (GDPR, CCPA)."""
    
    __tablename__ = "data_subject_requests"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("umt.users.id", ondelete="SET NULL"), nullable=True, index=True)
    request_type = Column(String(50), nullable=False)  # access, deletion, correction, portability
    status = Column(String(50), nullable=False)  # pending, in_progress, completed, rejected
    request_details = Column(JSON, nullable=True)
    requester_email = Column(String(255), nullable=False)
    verification_method = Column(String(50), nullable=True)
    verification_status = Column(Boolean, nullable=True)
    completion_notes = Column(Text, nullable=True)
    admin_user_id = Column(Integer, ForeignKey("umt.users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="data_requests")
    admin = relationship("User", foreign_keys=[admin_user_id])


class ComplianceDocument(Base):
    """Stores compliance documents like privacy policies, terms, etc."""
    
    __tablename__ = "compliance_documents"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    document_type = Column(String(50), nullable=False)  # privacy_policy, terms, dpa, cookie_policy
    version = Column(String(20), nullable=False)
    effective_date = Column(DateTime(timezone=True), nullable=False)
    content = Column(Text, nullable=False)
    is_current = Column(Boolean, nullable=False, default=False)
    created_by = Column(Integer, ForeignKey("umt.users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    author = relationship("User")

    __table_args__ = (
        UniqueConstraint("document_type", "version", name="uq_document_type_version"),
        {"schema": "umt"}
    )


class DataClassification(Base):
    """Defines data classification levels and access requirements."""
    
    __tablename__ = "data_classifications"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)  # public, internal, confidential, restricted
    description = Column(Text, nullable=False)
    access_requirements = Column(Text, nullable=False)
    encryption_required = Column(Boolean, nullable=False, default=False)
    retention_requirements = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    field_classifications = relationship("FieldClassification", back_populates="classification")


class FieldClassification(Base):
    """Maps database fields to their data classification."""
    
    __tablename__ = "field_classifications"
    __table_args__ = (
        UniqueConstraint("table_name", "field_name", name="uq_field_classification"),
        {"schema": "umt"}
    )
    
    id = Column(Integer, primary_key=True, index=True)
    table_name = Column(String(100), nullable=False)
    field_name = Column(String(100), nullable=False)
    classification_id = Column(Integer, ForeignKey("umt.data_classifications.id"), nullable=False)
    is_pii = Column(Boolean, nullable=False, default=False)
    is_encrypted = Column(Boolean, nullable=False, default=False)
    mask_display = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    classification = relationship("DataClassification", back_populates="field_classifications")


class PrivacyImpactAssessment(Base):
    """Privacy Impact Assessment records for new features/products."""
    
    __tablename__ = "privacy_impact_assessments"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    feature_description = Column(Text, nullable=False)
    data_collected = Column(JSON, nullable=False)
    data_use = Column(Text, nullable=False)
    data_sharing = Column(Text, nullable=True)
    risks_identified = Column(JSON, nullable=True)
    mitigations = Column(JSON, nullable=True)
    status = Column(String(50), nullable=False)  # draft, review, approved, rejected
    reviewer_id = Column(Integer, ForeignKey("umt.users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("umt.users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    reviewer = relationship("User", foreign_keys=[reviewer_id])