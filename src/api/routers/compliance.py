"""
API endpoints for data retention and compliance features.

This module provides endpoints for managing data retention policies, consent management,
data subject requests, and other compliance features.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, validator

from src.core.database import get_db
from src.core.security import get_current_user, has_permission
from src.core.compliance import (
    DataRetentionService, ConsentManager, DataSubjectRequestManager,
    ComplianceDocumentManager, DataClassificationService, PrivacyImpactAssessmentService
)
from src.models.system import User


# Pydantic models for request/response validation
class RetentionPolicyCreate(BaseModel):
    entity_type: str = Field(..., description="The type of entity this policy applies to")
    retention_period_days: int = Field(..., description="Number of days to retain data")
    archive_strategy: str = Field(..., description="Archive strategy (archive or delete)")
    legal_basis: Optional[str] = Field(None, description="Legal basis for retention period")
    applies_to_deleted: bool = Field(True, description="Whether to apply to soft-deleted records")
    
    @validator('retention_period_days')
    def validate_retention_period(cls, v):
        if v < 1:
            raise ValueError('Retention period must be at least 1 day')
        return v
    
    @validator('archive_strategy')
    def validate_archive_strategy(cls, v):
        if v not in ["archive", "delete"]:
            raise ValueError('Archive strategy must be either "archive" or "delete"')
        return v


class RetentionPolicyResponse(BaseModel):
    id: int
    entity_type: str
    retention_period_days: int
    archive_strategy: str
    legal_basis: Optional[str]
    applies_to_deleted: bool
    created_at: datetime
    updated_at: datetime


class RetentionExemptionCreate(BaseModel):
    entity_type: str = Field(..., description="The type of entity this exemption applies to")
    entity_id: int = Field(..., description="ID of the entity to exempt")
    reason: str = Field(..., description="Reason for exemption")
    expires_at: Optional[datetime] = Field(None, description="When exemption expires (null for indefinite)")


class RetentionExemptionResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    reason: str
    expires_at: Optional[datetime]
    created_by: int
    created_at: datetime


class ConsentRecordCreate(BaseModel):
    consent_type: str = Field(..., description="Type of consent (marketing, analytics, etc.)")
    status: bool = Field(..., description="Whether consent is granted (true) or denied (false)")
    consent_version: str = Field(..., description="Version of consent form/terms")
    data_categories: Optional[List[str]] = Field(None, description="Categories of data covered by consent")
    expires_at: Optional[datetime] = Field(None, description="When consent expires (null for indefinite)")


class ConsentRecordResponse(BaseModel):
    id: int
    consent_type: str
    status: bool
    recorded_at: datetime
    expires_at: Optional[datetime]
    consent_version: str
    data_categories: Optional[List[str]]


class DataSubjectRequestCreate(BaseModel):
    request_type: str = Field(..., description="Type of request (access, deletion, correction, portability)")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional details for request")
    
    @validator('request_type')
    def validate_request_type(cls, v):
        valid_types = ["access", "deletion", "correction", "portability", "restriction"]
        if v not in valid_types:
            raise ValueError(f'Request type must be one of: {", ".join(valid_types)}')
        return v


class DataSubjectRequestResponse(BaseModel):
    id: int
    request_type: str
    status: str
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]


class DataSubjectRequestStatusUpdate(BaseModel):
    status: str = Field(..., description="New status (pending, in_progress, completed, rejected)")
    notes: Optional[str] = Field(None, description="Notes about the status update")
    
    @validator('status')
    def validate_status(cls, v):
        valid_statuses = ["pending", "in_progress", "completed", "rejected"]
        if v not in valid_statuses:
            raise ValueError(f'Status must be one of: {", ".join(valid_statuses)}')
        return v


class ComplianceDocumentCreate(BaseModel):
    document_type: str = Field(..., description="Type of document (privacy_policy, terms, etc.)")
    version: str = Field(..., description="Document version")
    content: str = Field(..., description="Document content")
    effective_date: datetime = Field(..., description="When document becomes effective")
    is_current: bool = Field(False, description="Whether this is the current version")


class ComplianceDocumentResponse(BaseModel):
    id: int
    document_type: str
    version: str
    effective_date: datetime
    is_current: bool
    created_at: datetime


class ClassificationCreate(BaseModel):
    name: str = Field(..., description="Classification name")
    description: str = Field(..., description="Classification description")
    access_requirements: str = Field(..., description="Access requirements for this classification")
    encryption_required: bool = Field(False, description="Whether encryption is required")
    retention_requirements: Optional[str] = Field(None, description="Retention requirements")


class ClassificationResponse(BaseModel):
    id: int
    name: str
    description: str
    access_requirements: str
    encryption_required: bool
    retention_requirements: Optional[str]
    created_at: datetime
    updated_at: datetime


class FieldClassificationCreate(BaseModel):
    table_name: str = Field(..., description="Database table name")
    field_name: str = Field(..., description="Field/column name")
    classification_id: int = Field(..., description="ID of the classification to apply")
    is_pii: bool = Field(False, description="Whether this field contains personal identifiable information")
    is_encrypted: bool = Field(False, description="Whether this field is encrypted in the database")
    mask_display: bool = Field(False, description="Whether to mask this field in UI/exports")


class FieldClassificationResponse(BaseModel):
    id: int
    table_name: str
    field_name: str
    classification_id: int
    is_pii: bool
    is_encrypted: bool
    mask_display: bool
    created_at: datetime
    updated_at: datetime


class PrivacyImpactAssessmentCreate(BaseModel):
    title: str = Field(..., description="Title of the assessment")
    feature_description: str = Field(..., description="Description of the feature being assessed")
    data_collected: List[Dict[str, Any]] = Field(..., description="Data collected by the feature")
    data_use: str = Field(..., description="How the data will be used")
    data_sharing: Optional[str] = Field(None, description="How the data will be shared")
    risks_identified: Optional[List[Dict[str, Any]]] = Field(None, description="Risks identified")
    mitigations: Optional[List[Dict[str, Any]]] = Field(None, description="Risk mitigations")


class PrivacyImpactAssessmentResponse(BaseModel):
    id: int
    title: str
    status: str
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]


# Router definition
router = APIRouter(
    prefix="/api/v1/compliance",
    tags=["compliance"],
    responses={404: {"description": "Not found"}}
)


# Data Retention Policy Endpoints
@router.get("/retention/policies", response_model=List[RetentionPolicyResponse])
async def get_retention_policies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all data retention policies."""
    if not has_permission(current_user, "compliance", "read"):
        raise HTTPException(status_code=403, detail="Not authorized to view retention policies")
    
    retention_service = DataRetentionService(db)
    return retention_service.get_policies()


@router.post("/retention/policies", response_model=RetentionPolicyResponse, status_code=201)
async def create_retention_policy(
    policy: RetentionPolicyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new data retention policy."""
    if not has_permission(current_user, "compliance", "create"):
        raise HTTPException(status_code=403, detail="Not authorized to create retention policies")
    
    retention_service = DataRetentionService(db)
    
    # Check if policy already exists for this entity type
    existing_policy = retention_service.get_policy(policy.entity_type)
    if existing_policy:
        raise HTTPException(
            status_code=409,
            detail=f"A retention policy for {policy.entity_type} already exists"
        )
    
    return retention_service.create_policy(
        entity_type=policy.entity_type,
        retention_period_days=policy.retention_period_days,
        archive_strategy=policy.archive_strategy,
        legal_basis=policy.legal_basis,
        applies_to_deleted=policy.applies_to_deleted
    )


@router.get("/retention/policies/{entity_type}", response_model=RetentionPolicyResponse)
async def get_retention_policy(
    entity_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific data retention policy by entity type."""
    if not has_permission(current_user, "compliance", "read"):
        raise HTTPException(status_code=403, detail="Not authorized to view retention policies")
    
    retention_service = DataRetentionService(db)
    policy = retention_service.get_policy(entity_type)
    
    if not policy:
        raise HTTPException(
            status_code=404,
            detail=f"No retention policy found for {entity_type}"
        )
    
    return policy


@router.put("/retention/policies/{entity_type}", response_model=RetentionPolicyResponse)
async def update_retention_policy(
    entity_type: str,
    updates: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a data retention policy."""
    if not has_permission(current_user, "compliance", "update"):
        raise HTTPException(status_code=403, detail="Not authorized to update retention policies")
    
    retention_service = DataRetentionService(db)
    policy = retention_service.update_policy(
        entity_type=entity_type,
        retention_period_days=updates.get("retention_period_days"),
        archive_strategy=updates.get("archive_strategy"),
        legal_basis=updates.get("legal_basis"),
        applies_to_deleted=updates.get("applies_to_deleted")
    )
    
    if not policy:
        raise HTTPException(
            status_code=404,
            detail=f"No retention policy found for {entity_type}"
        )
    
    return policy


@router.delete("/retention/policies/{entity_type}", status_code=204)
async def delete_retention_policy(
    entity_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a data retention policy."""
    if not has_permission(current_user, "compliance", "delete"):
        raise HTTPException(status_code=403, detail="Not authorized to delete retention policies")
    
    retention_service = DataRetentionService(db)
    success = retention_service.delete_policy(entity_type)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"No retention policy found for {entity_type}"
        )


@router.post("/retention/execute", status_code=200)
async def execute_retention_policies(
    background_tasks: BackgroundTasks,
    entity_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute data retention policies (async background task)."""
    if not has_permission(current_user, "compliance", "update"):
        raise HTTPException(status_code=403, detail="Not authorized to execute retention policies")
    
    # Run in background task to avoid timeout for long-running operations
    def execute_retention():
        retention_service = DataRetentionService(db)
        retention_service.apply_retention_policies(entity_type)
    
    background_tasks.add_task(execute_retention)
    
    return {"status": "success", "message": "Retention policy execution started"}


# Data Retention Exemption Endpoints
@router.post("/retention/exemptions", response_model=RetentionExemptionResponse, status_code=201)
async def create_retention_exemption(
    exemption: RetentionExemptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new exemption from a retention policy."""
    if not has_permission(current_user, "compliance", "create"):
        raise HTTPException(status_code=403, detail="Not authorized to create retention exemptions")
    
    retention_service = DataRetentionService(db)
    
    # Check if the entity type has a retention policy
    policy = retention_service.get_policy(exemption.entity_type)
    if not policy:
        raise HTTPException(
            status_code=404,
            detail=f"No retention policy found for {exemption.entity_type}"
        )
    
    # Check if exemption already exists
    existing = retention_service.check_exemption(exemption.entity_type, exemption.entity_id)
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"An exemption already exists for {exemption.entity_type} {exemption.entity_id}"
        )
    
    return retention_service.create_exemption(
        entity_type=exemption.entity_type,
        entity_id=exemption.entity_id,
        reason=exemption.reason,
        created_by=current_user.id,
        expires_at=exemption.expires_at
    )


@router.get("/retention/exemptions", response_model=List[RetentionExemptionResponse])
async def get_retention_exemptions(
    entity_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all exemptions from retention policies."""
    if not has_permission(current_user, "compliance", "read"):
        raise HTTPException(status_code=403, detail="Not authorized to view retention exemptions")
    
    retention_service = DataRetentionService(db)
    return retention_service.get_exemptions(entity_type)


@router.delete("/retention/exemptions/{exemption_id}", status_code=204)
async def delete_retention_exemption(
    exemption_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an exemption from a retention policy."""
    if not has_permission(current_user, "compliance", "delete"):
        raise HTTPException(status_code=403, detail="Not authorized to delete retention exemptions")
    
    retention_service = DataRetentionService(db)
    success = retention_service.delete_exemption(exemption_id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"No exemption found with ID {exemption_id}"
        )


# Consent Management Endpoints
@router.post("/consent", response_model=ConsentRecordResponse, status_code=201)
async def record_consent(
    consent: ConsentRecordCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record a user's consent decision."""
    consent_manager = ConsentManager(db)
    
    record = consent_manager.record_consent(
        user_id=current_user.id,
        consent_type=consent.consent_type,
        status=consent.status,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        consent_version=consent.consent_version,
        data_categories=consent.data_categories,
        expires_at=consent.expires_at
    )
    
    return record


@router.get("/consent/status/{consent_type}")
async def check_consent(
    consent_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check a user's consent status for a specific type."""
    consent_manager = ConsentManager(db)
    has_consent = consent_manager.check_user_consent(current_user.id, consent_type)
    
    return {
        "consent_type": consent_type,
        "has_consent": has_consent
    }


@router.get("/consent/categories")
async def check_consent_categories(
    categories: List[str] = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check a user's consent status for multiple data categories."""
    consent_manager = ConsentManager(db)
    consent_status = consent_manager.check_consent_for_categories(current_user.id, categories)
    
    return consent_status


@router.get("/consent/history", response_model=List[ConsentRecordResponse])
async def get_consent_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a user's consent history."""
    consent_manager = ConsentManager(db)
    history = consent_manager.get_user_consent_history(current_user.id)
    
    return history


@router.post("/consent/revoke-all", status_code=200)
async def revoke_all_consent(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke all consent for the current user."""
    consent_manager = ConsentManager(db)
    count = consent_manager.revoke_all_user_consent(current_user.id)
    
    return {
        "status": "success",
        "consents_revoked": count
    }


# Data Subject Request Endpoints
@router.post("/data-requests", response_model=DataSubjectRequestResponse, status_code=201)
async def create_data_request(
    request_data: DataSubjectRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a data subject request (access, deletion, etc.)."""
    request_manager = DataSubjectRequestManager(db)
    
    data_request = request_manager.create_request(
        request_type=request_data.request_type,
        requester_email=current_user.email,
        request_details=request_data.details,
        user_id=current_user.id
    )
    
    return data_request


@router.get("/data-requests", response_model=List[DataSubjectRequestResponse])
async def get_user_data_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all data subject requests for the current user."""
    request_manager = DataSubjectRequestManager(db)
    requests = request_manager.get_user_requests(current_user.id)
    
    return requests


@router.get("/data-requests/{request_id}", response_model=Dict[str, Any])
async def get_data_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details of a data subject request."""
    request_manager = DataSubjectRequestManager(db)
    data_request = request_manager.get_request(request_id)
    
    if not data_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Only the requester or admins can view the request
    if data_request.user_id != current_user.id and not has_permission(current_user, "compliance", "read"):
        raise HTTPException(status_code=403, detail="Not authorized to view this request")
    
    return {
        "id": data_request.id,
        "request_type": data_request.request_type,
        "status": data_request.status,
        "requester_email": data_request.requester_email,
        "created_at": data_request.created_at.isoformat(),
        "updated_at": data_request.updated_at.isoformat(),
        "completed_at": data_request.completed_at.isoformat() if data_request.completed_at else None,
        "details": data_request.request_details
    }


# Admin endpoints for data subject request management
@router.get("/admin/data-requests/pending", response_model=List[DataSubjectRequestResponse])
async def get_pending_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all pending data subject requests (admin only)."""
    if not has_permission(current_user, "compliance", "read"):
        raise HTTPException(status_code=403, detail="Not authorized to view pending requests")
    
    request_manager = DataSubjectRequestManager(db)
    requests = request_manager.get_pending_requests()
    
    return requests


@router.put("/admin/data-requests/{request_id}/status")
async def update_request_status(
    request_id: int,
    status_update: DataSubjectRequestStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the status of a data subject request (admin only)."""
    if not has_permission(current_user, "compliance", "update"):
        raise HTTPException(status_code=403, detail="Not authorized to update request status")
    
    request_manager = DataSubjectRequestManager(db)
    
    updated_request = request_manager.update_request_status(
        request_id=request_id,
        status=status_update.status,
        admin_user_id=current_user.id,
        notes=status_update.notes
    )
    
    if not updated_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {
        "id": updated_request.id,
        "status": updated_request.status,
        "updated_at": updated_request.updated_at.isoformat(),
        "completed_at": updated_request.completed_at.isoformat() if updated_request.completed_at else None
    }


@router.post("/admin/data-requests/{request_id}/execute")
async def execute_data_request(
    request_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute a data subject request (admin only)."""
    if not has_permission(current_user, "compliance", "update"):
        raise HTTPException(status_code=403, detail="Not authorized to execute data requests")
    
    request_manager = DataSubjectRequestManager(db)
    data_request = request_manager.get_request(request_id)
    
    if not data_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if data_request.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {data_request.status}")
    
    # Update request status to in progress
    request_manager.update_request_status(
        request_id=request_id,
        status="in_progress",
        admin_user_id=current_user.id,
        notes=f"Execution started by {current_user.email}"
    )
    
    # Execute request in background task
    def execute_request():
        try:
            if data_request.request_type == "access":
                user_data = request_manager.execute_access_request(request_id)
                # In a real implementation, we would store the result or email it to the user
            elif data_request.request_type == "deletion":
                request_manager.execute_deletion_request(request_id)
            
            # Update status to completed
            request_manager.update_request_status(
                request_id=request_id,
                status="completed",
                admin_user_id=current_user.id,
                notes=f"Executed successfully by {current_user.email}"
            )
        except Exception as e:
            # Update status with error
            request_manager.update_request_status(
                request_id=request_id,
                status="pending",
                admin_user_id=current_user.id,
                notes=f"Execution failed: {str(e)}"
            )
    
    background_tasks.add_task(execute_request)
    
    return {
        "status": "success",
        "message": f"Execution of {data_request.request_type} request started"
    }


# Compliance Document Endpoints
@router.post("/documents", response_model=ComplianceDocumentResponse, status_code=201)
async def create_compliance_document(
    document: ComplianceDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new compliance document."""
    if not has_permission(current_user, "compliance", "create"):
        raise HTTPException(status_code=403, detail="Not authorized to create compliance documents")
    
    document_manager = ComplianceDocumentManager(db)
    
    try:
        doc = document_manager.create_document(
            document_type=document.document_type,
            version=document.version,
            content=document.content,
            effective_date=document.effective_date,
            created_by=current_user.id,
            is_current=document.is_current
        )
        return doc
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/documents/current/{document_type}")
async def get_current_document(
    document_type: str,
    db: Session = Depends(get_db)
):
    """Get the current version of a document type."""
    document_manager = ComplianceDocumentManager(db)
    document = document_manager.get_current_document(document_type)
    
    if not document:
        raise HTTPException(
            status_code=404,
            detail=f"No current {document_type} document found"
        )
    
    return {
        "id": document.id,
        "document_type": document.document_type,
        "version": document.version,
        "content": document.content,
        "effective_date": document.effective_date.isoformat(),
        "created_at": document.created_at.isoformat()
    }


@router.get("/documents/{document_type}/versions")
async def get_document_versions(
    document_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all versions of a document type."""
    if not has_permission(current_user, "compliance", "read"):
        raise HTTPException(status_code=403, detail="Not authorized to view document versions")
    
    document_manager = ComplianceDocumentManager(db)
    documents = document_manager.get_document_versions(document_type)
    
    return [
        {
            "id": doc.id,
            "version": doc.version,
            "effective_date": doc.effective_date.isoformat(),
            "is_current": doc.is_current,
            "created_at": doc.created_at.isoformat()
        }
        for doc in documents
    ]


@router.put("/documents/{document_id}/set-current", response_model=ComplianceDocumentResponse)
async def set_current_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set a document as the current version."""
    if not has_permission(current_user, "compliance", "update"):
        raise HTTPException(status_code=403, detail="Not authorized to update compliance documents")
    
    document_manager = ComplianceDocumentManager(db)
    document = document_manager.set_current_document(document_id)
    
    if not document:
        raise HTTPException(
            status_code=404,
            detail=f"Document with ID {document_id} not found"
        )
    
    return document


# Data Classification Endpoints
@router.post("/classifications", response_model=ClassificationResponse, status_code=201)
async def create_classification(
    classification: ClassificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new data classification."""
    if not has_permission(current_user, "compliance", "create"):
        raise HTTPException(status_code=403, detail="Not authorized to create data classifications")
    
    classification_service = DataClassificationService(db)
    
    try:
        result = classification_service.create_classification(
            name=classification.name,
            description=classification.description,
            access_requirements=classification.access_requirements,
            encryption_required=classification.encryption_required,
            retention_requirements=classification.retention_requirements
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/classifications", response_model=List[ClassificationResponse])
async def get_classifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all data classifications."""
    if not has_permission(current_user, "compliance", "read"):
        raise HTTPException(status_code=403, detail="Not authorized to view data classifications")
    
    classification_service = DataClassificationService(db)
    return classification_service.get_all_classifications()


@router.post("/field-classifications", response_model=FieldClassificationResponse, status_code=201)
async def classify_field(
    field_classification: FieldClassificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Classify a database field."""
    if not has_permission(current_user, "compliance", "create"):
        raise HTTPException(status_code=403, detail="Not authorized to classify database fields")
    
    classification_service = DataClassificationService(db)
    
    try:
        result = classification_service.classify_field(
            table_name=field_classification.table_name,
            field_name=field_classification.field_name,
            classification_id=field_classification.classification_id,
            is_pii=field_classification.is_pii,
            is_encrypted=field_classification.is_encrypted,
            mask_display=field_classification.mask_display
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/field-classifications/table/{table_name}")
async def get_table_classifications(
    table_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get classifications for all fields in a table."""
    if not has_permission(current_user, "compliance", "read"):
        raise HTTPException(status_code=403, detail="Not authorized to view field classifications")
    
    classification_service = DataClassificationService(db)
    fields = classification_service.get_table_classifications(table_name)
    
    return [
        {
            "id": field.id,
            "table_name": field.table_name,
            "field_name": field.field_name,
            "classification_id": field.classification_id,
            "is_pii": field.is_pii,
            "is_encrypted": field.is_encrypted,
            "mask_display": field.mask_display
        }
        for field in fields
    ]


@router.get("/field-classifications/pii")
async def get_pii_fields(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all fields classified as PII."""
    if not has_permission(current_user, "compliance", "read"):
        raise HTTPException(status_code=403, detail="Not authorized to view PII field classifications")
    
    classification_service = DataClassificationService(db)
    fields = classification_service.get_pii_fields()
    
    return [
        {
            "id": field.id,
            "table_name": field.table_name,
            "field_name": field.field_name,
            "classification_id": field.classification_id,
            "is_encrypted": field.is_encrypted,
            "mask_display": field.mask_display
        }
        for field in fields
    ]


# Privacy Impact Assessment Endpoints
@router.post("/privacy-assessments", response_model=PrivacyImpactAssessmentResponse, status_code=201)
async def create_privacy_assessment(
    assessment: PrivacyImpactAssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new privacy impact assessment."""
    if not has_permission(current_user, "compliance", "create"):
        raise HTTPException(status_code=403, detail="Not authorized to create privacy assessments")
    
    assessment_service = PrivacyImpactAssessmentService(db)
    
    try:
        result = assessment_service.create_assessment(
            title=assessment.title,
            feature_description=assessment.feature_description,
            data_collected=assessment.data_collected,
            data_use=assessment.data_use,
            data_sharing=assessment.data_sharing,
            risks_identified=assessment.risks_identified,
            mitigations=assessment.mitigations,
            created_by=current_user.id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/privacy-assessments", response_model=List[PrivacyImpactAssessmentResponse])
async def get_privacy_assessments(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get privacy impact assessments."""
    if not has_permission(current_user, "compliance", "read"):
        raise HTTPException(status_code=403, detail="Not authorized to view privacy assessments")
    
    assessment_service = PrivacyImpactAssessmentService(db)
    assessments = assessment_service.get_assessments(status)
    
    return assessments


@router.get("/privacy-assessments/{assessment_id}")
async def get_privacy_assessment(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific privacy impact assessment."""
    if not has_permission(current_user, "compliance", "read"):
        raise HTTPException(status_code=403, detail="Not authorized to view privacy assessments")
    
    assessment_service = PrivacyImpactAssessmentService(db)
    assessment = assessment_service.get_assessment(assessment_id)
    
    if not assessment:
        raise HTTPException(
            status_code=404,
            detail=f"Privacy assessment with ID {assessment_id} not found"
        )
    
    return {
        "id": assessment.id,
        "title": assessment.title,
        "feature_description": assessment.feature_description,
        "data_collected": assessment.data_collected,
        "data_use": assessment.data_use,
        "data_sharing": assessment.data_sharing,
        "risks_identified": assessment.risks_identified,
        "mitigations": assessment.mitigations,
        "status": assessment.status,
        "created_at": assessment.created_at.isoformat(),
        "updated_at": assessment.updated_at.isoformat(),
        "completed_at": assessment.completed_at.isoformat() if assessment.completed_at else None
    }


@router.put("/privacy-assessments/{assessment_id}/status")
async def update_privacy_assessment_status(
    assessment_id: int,
    status: str = Query(..., regex="^(draft|review|approved|rejected)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the status of a privacy impact assessment."""
    if not has_permission(current_user, "compliance", "update"):
        raise HTTPException(status_code=403, detail="Not authorized to update privacy assessments")
    
    assessment_service = PrivacyImpactAssessmentService(db)
    assessment = assessment_service.update_assessment_status(
        assessment_id=assessment_id,
        status=status,
        reviewer_id=current_user.id if status in ["approved", "rejected"] else None
    )
    
    if not assessment:
        raise HTTPException(
            status_code=404,
            detail=f"Privacy assessment with ID {assessment_id} not found"
        )
    
    return {
        "id": assessment.id,
        "title": assessment.title,
        "status": assessment.status,
        "updated_at": assessment.updated_at.isoformat(),
        "completed_at": assessment.completed_at.isoformat() if assessment.completed_at else None
    }