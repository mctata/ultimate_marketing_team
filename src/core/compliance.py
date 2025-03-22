"""
Core compliance services for data retention, consent management, and privacy controls.

This module implements services for GDPR, CCPA, and other global privacy regulations 
including data retention policies, subject access requests, and consent management.
"""

from typing import List, Dict, Any, Optional, Tuple, Union
from datetime import datetime, timedelta
import json
import logging
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, cast, JSON

from src.models.compliance import (
    DataRetentionPolicy, DataRetentionExemption, DataRetentionExecutionLog,
    ConsentRecord, DataSubjectRequest, ComplianceDocument,
    DataClassification, FieldClassification, PrivacyImpactAssessment
)
from src.core.security import create_audit_log, encrypt_data, decrypt_data


logger = logging.getLogger(__name__)


class DataRetentionService:
    """Service for managing data retention policies and execution."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_policies(self) -> List[DataRetentionPolicy]:
        """Get all data retention policies."""
        return self.db.query(DataRetentionPolicy).all()
    
    def get_policy(self, entity_type: str) -> Optional[DataRetentionPolicy]:
        """Get the retention policy for a specific entity type."""
        return self.db.query(DataRetentionPolicy).filter(
            DataRetentionPolicy.entity_type == entity_type
        ).first()
    
    def create_policy(
        self, 
        entity_type: str, 
        retention_period_days: int, 
        archive_strategy: str,
        legal_basis: Optional[str] = None,
        applies_to_deleted: bool = True
    ) -> DataRetentionPolicy:
        """Create a new data retention policy."""
        policy = DataRetentionPolicy(
            entity_type=entity_type,
            retention_period_days=retention_period_days,
            archive_strategy=archive_strategy,
            legal_basis=legal_basis,
            applies_to_deleted=applies_to_deleted
        )
        
        self.db.add(policy)
        self.db.commit()
        self.db.refresh(policy)
        
        logger.info(f"Created data retention policy for {entity_type} with {retention_period_days} days retention")
        return policy
    
    def update_policy(
        self, 
        entity_type: str, 
        retention_period_days: Optional[int] = None,
        archive_strategy: Optional[str] = None,
        legal_basis: Optional[str] = None,
        applies_to_deleted: Optional[bool] = None
    ) -> Optional[DataRetentionPolicy]:
        """Update an existing data retention policy."""
        policy = self.get_policy(entity_type)
        if not policy:
            return None
        
        if retention_period_days is not None:
            policy.retention_period_days = retention_period_days
        
        if archive_strategy is not None:
            policy.archive_strategy = archive_strategy
        
        if legal_basis is not None:
            policy.legal_basis = legal_basis
        
        if applies_to_deleted is not None:
            policy.applies_to_deleted = applies_to_deleted
        
        self.db.commit()
        self.db.refresh(policy)
        
        logger.info(f"Updated data retention policy for {entity_type}")
        return policy
    
    def delete_policy(self, entity_type: str) -> bool:
        """Delete a data retention policy."""
        policy = self.get_policy(entity_type)
        if not policy:
            return False
        
        self.db.delete(policy)
        self.db.commit()
        
        logger.info(f"Deleted data retention policy for {entity_type}")
        return True
    
    def create_exemption(
        self, 
        entity_type: str,
        entity_id: int,
        reason: str,
        created_by: int,
        expires_at: Optional[datetime] = None
    ) -> DataRetentionExemption:
        """Create an exemption from a retention policy for a specific entity."""
        exemption = DataRetentionExemption(
            entity_type=entity_type,
            entity_id=entity_id,
            reason=reason,
            created_by=created_by,
            expires_at=expires_at
        )
        
        self.db.add(exemption)
        self.db.commit()
        self.db.refresh(exemption)
        
        logger.info(f"Created data retention exemption for {entity_type} {entity_id}")
        return exemption
    
    def get_exemptions(self, entity_type: Optional[str] = None) -> List[DataRetentionExemption]:
        """Get all exemptions, optionally filtered by entity type."""
        query = self.db.query(DataRetentionExemption)
        
        if entity_type:
            query = query.filter(DataRetentionExemption.entity_type == entity_type)
        
        return query.all()
    
    def check_exemption(self, entity_type: str, entity_id: int) -> Optional[DataRetentionExemption]:
        """Check if an entity has an active exemption."""
        now = datetime.utcnow()
        
        return self.db.query(DataRetentionExemption).filter(
            DataRetentionExemption.entity_type == entity_type,
            DataRetentionExemption.entity_id == entity_id,
            or_(
                DataRetentionExemption.expires_at.is_(None),
                DataRetentionExemption.expires_at > now
            )
        ).first()
    
    def delete_exemption(self, exemption_id: int) -> bool:
        """Delete a data retention exemption."""
        exemption = self.db.query(DataRetentionExemption).filter(
            DataRetentionExemption.id == exemption_id
        ).first()
        
        if not exemption:
            return False
        
        self.db.delete(exemption)
        self.db.commit()
        
        logger.info(f"Deleted data retention exemption {exemption_id}")
        return True
    
    def apply_retention_policies(self, entity_type: Optional[str] = None) -> Dict[str, Any]:
        """Apply data retention policies and return execution statistics."""
        start_time = datetime.utcnow()
        
        if entity_type:
            # Apply policy for a specific entity type
            policies = [self.get_policy(entity_type)]
            if not policies[0]:
                return {"status": "error", "message": f"No policy found for {entity_type}"}
        else:
            # Apply all policies
            policies = self.get_policies()
        
        results = {
            "total_records_processed": 0,
            "total_records_archived": 0,
            "total_records_deleted": 0,
            "entity_results": {},
            "status": "success"
        }
        
        for policy in policies:
            entity_result = self._apply_policy(policy)
            results["total_records_processed"] += entity_result["records_processed"]
            results["total_records_archived"] += entity_result["records_archived"]
            results["total_records_deleted"] += entity_result["records_deleted"]
            results["entity_results"][policy.entity_type] = entity_result
            
            # Log execution
            log_entry = DataRetentionExecutionLog(
                entity_type=policy.entity_type,
                records_processed=entity_result["records_processed"],
                records_archived=entity_result["records_archived"],
                records_deleted=entity_result["records_deleted"],
                execution_time_sec=entity_result["execution_time_sec"],
                status=entity_result["status"],
                error_message=entity_result.get("error_message")
            )
            self.db.add(log_entry)
        
        self.db.commit()
        
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        results["execution_time_sec"] = execution_time
        
        logger.info(f"Completed retention policy execution in {execution_time:.2f} seconds")
        return results
    
    def _apply_policy(self, policy: DataRetentionPolicy) -> Dict[str, Any]:
        """Apply a single retention policy and return execution statistics."""
        start_time = datetime.utcnow()
        result = {
            "records_processed": 0,
            "records_archived": 0,
            "records_deleted": 0,
            "status": "success"
        }
        
        try:
            # Get entity model class
            entity_class = self._get_entity_class(policy.entity_type)
            if not entity_class:
                result["status"] = "error"
                result["error_message"] = f"Unknown entity type: {policy.entity_type}"
                return result
            
            # Calculate cutoff date based on retention period
            cutoff_date = datetime.utcnow() - timedelta(days=policy.retention_period_days)
            
            # Process deleted records if policy applies to them
            if policy.applies_to_deleted and hasattr(entity_class, 'deleted_at'):
                # Find records that were deleted before the cutoff date
                expired_records = self.db.query(entity_class).filter(
                    entity_class.deleted_at.isnot(None),
                    entity_class.deleted_at < cutoff_date
                ).all()
                
                for record in expired_records:
                    # Check for exemptions
                    exemption = self.check_exemption(policy.entity_type, record.id)
                    if exemption:
                        logger.info(f"Exemption found for {policy.entity_type} {record.id}: {exemption.reason}")
                        continue
                    
                    result["records_processed"] += 1
                    
                    # Archive or delete based on policy
                    if policy.archive_strategy == "archive":
                        self._archive_record(record, policy)
                        result["records_archived"] += 1
                    else:
                        # Hard delete
                        self.db.delete(record)
                        result["records_deleted"] += 1
            
            # Add other policy implementations here (e.g., for audit logs, temp data)
            
            self.db.commit()
            result["execution_time_sec"] = (datetime.utcnow() - start_time).total_seconds()
            
        except Exception as e:
            self.db.rollback()
            logger.exception(f"Error applying retention policy for {policy.entity_type}: {str(e)}")
            result["status"] = "error"
            result["error_message"] = str(e)
            result["execution_time_sec"] = (datetime.utcnow() - start_time).total_seconds()
        
        return result
    
    def _get_entity_class(self, entity_type: str):
        """Map entity type string to SQLAlchemy model class."""
        from src.models.system import User, AuditLog
        from src.models.project import Brand, Project
        from src.models.content import Content, ContentDraft
        from src.models.advertising import AdCampaign
        from src.models.competitor import Competitor
        from src.models.integration import SocialAccount
        
        entity_map = {
            "user": User,
            "brand": Brand,
            "project": Project,
            "content": Content,
            "content_draft": ContentDraft,
            "ad_campaign": AdCampaign,
            "competitor": Competitor,
            "social_account": SocialAccount,
            "audit_log": AuditLog,
        }
        
        return entity_map.get(entity_type)
    
    def _archive_record(self, record, policy: DataRetentionPolicy):
        """Archive a record before deletion."""
        # Implementation depends on archive strategy
        # Could export to S3, another database, etc.
        
        # This is a placeholder - actual implementation would depend on
        # the archiving strategy for the organization
        record_dict = {c.name: getattr(record, c.name) for c in record.__table__.columns}
        
        # In a real implementation, we would store this data in a secure archive
        logger.info(f"Archiving {policy.entity_type} record {record.id}")
        
        # Mark record as scheduled for deletion after archive
        if hasattr(record, 'scheduled_deletion_date'):
            record.scheduled_deletion_date = datetime.utcnow() + timedelta(days=30)  # 30-day grace period


class ConsentManager:
    """Service for managing user consent records."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def record_consent(
        self, 
        user_id: int, 
        consent_type: str, 
        status: bool, 
        ip_address: str,
        user_agent: str,
        consent_version: str,
        data_categories: List[str] = None,
        expires_at: Optional[datetime] = None
    ) -> ConsentRecord:
        """Record a new consent decision from a user."""
        consent = ConsentRecord(
            user_id=user_id,
            consent_type=consent_type,
            status=status,
            ip_address=ip_address,
            user_agent=user_agent,
            consent_version=consent_version,
            data_categories=data_categories,
            expires_at=expires_at
        )
        
        self.db.add(consent)
        self.db.commit()
        self.db.refresh(consent)
        
        # Create audit log
        create_audit_log(
            db=self.db,
            user_id=user_id,
            action="consent_update",
            resource_type="consent",
            resource_id=consent.id,
            new_state={
                "consent_type": consent_type,
                "status": status,
                "consent_version": consent_version
            },
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        logger.info(f"Recorded {consent_type} consent for user {user_id}: {status}")
        return consent
    
    def check_user_consent(self, user_id: int, consent_type: str) -> bool:
        """Check if a user has given consent for a specific purpose."""
        latest_consent = self.db.query(ConsentRecord).filter(
            ConsentRecord.user_id == user_id,
            ConsentRecord.consent_type == consent_type
        ).order_by(ConsentRecord.recorded_at.desc()).first()
        
        if not latest_consent:
            return False
        
        # Check if consent has expired
        if latest_consent.expires_at and latest_consent.expires_at < datetime.utcnow():
            return False
        
        return latest_consent.status
    
    def check_consent_for_categories(self, user_id: int, data_categories: List[str]) -> Dict[str, bool]:
        """Check if a user has given consent for specific data categories."""
        results = {}
        
        for category in data_categories:
            # Find latest consent record that includes this category
            latest_consent = self.db.query(ConsentRecord).filter(
                ConsentRecord.user_id == user_id,
                func.jsonb_exists(cast(ConsentRecord.data_categories, JSON), category)
            ).order_by(ConsentRecord.recorded_at.desc()).first()
            
            if not latest_consent:
                results[category] = False
                continue
            
            # Check if consent has expired
            if latest_consent.expires_at and latest_consent.expires_at < datetime.utcnow():
                results[category] = False
                continue
            
            results[category] = latest_consent.status
        
        return results
    
    def get_user_consent_history(self, user_id: int) -> List[Dict[str, Any]]:
        """Get the consent history for a user."""
        consents = self.db.query(ConsentRecord).filter(
            ConsentRecord.user_id == user_id
        ).order_by(ConsentRecord.recorded_at.desc()).all()
        
        return [
            {
                "id": consent.id,
                "consent_type": consent.consent_type,
                "status": consent.status,
                "recorded_at": consent.recorded_at.isoformat(),
                "expires_at": consent.expires_at.isoformat() if consent.expires_at else None,
                "consent_version": consent.consent_version,
                "data_categories": consent.data_categories
            }
            for consent in consents
        ]
    
    def get_consent_types(self) -> List[str]:
        """Get all consent types used in the system."""
        consent_types = self.db.query(ConsentRecord.consent_type).distinct().all()
        return [t[0] for t in consent_types]

    def revoke_all_user_consent(self, user_id: int) -> int:
        """Revoke all consent for a user and return count of revoked consents."""
        # Record revocation for each consent type the user has previously consented to
        consent_types = self.db.query(ConsentRecord.consent_type).filter(
            ConsentRecord.user_id == user_id,
            ConsentRecord.status == True
        ).distinct().all()
        
        count = 0
        for consent_type in consent_types:
            self.record_consent(
                user_id=user_id,
                consent_type=consent_type[0],
                status=False,
                ip_address="system",
                user_agent="system",
                consent_version="revocation",
                data_categories=None
            )
            count += 1
        
        return count


class DataSubjectRequestManager:
    """Service for handling data subject access/deletion requests."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_request(
        self,
        request_type: str,
        requester_email: str,
        request_details: Dict[str, Any] = None,
        user_id: Optional[int] = None
    ) -> DataSubjectRequest:
        """Create a new data subject request."""
        request = DataSubjectRequest(
            user_id=user_id,
            request_type=request_type,
            status="pending",
            request_details=request_details,
            requester_email=requester_email
        )
        
        self.db.add(request)
        self.db.commit()
        self.db.refresh(request)
        
        logger.info(f"Created {request_type} request for {requester_email}")
        return request
    
    def get_request(self, request_id: int) -> Optional[DataSubjectRequest]:
        """Get a data subject request by ID."""
        return self.db.query(DataSubjectRequest).filter(
            DataSubjectRequest.id == request_id
        ).first()
    
    def get_user_requests(self, user_id: int) -> List[DataSubjectRequest]:
        """Get all requests for a specific user."""
        return self.db.query(DataSubjectRequest).filter(
            DataSubjectRequest.user_id == user_id
        ).order_by(DataSubjectRequest.created_at.desc()).all()
    
    def get_requests_by_email(self, email: str) -> List[DataSubjectRequest]:
        """Get all requests for a specific email."""
        return self.db.query(DataSubjectRequest).filter(
            DataSubjectRequest.requester_email == email
        ).order_by(DataSubjectRequest.created_at.desc()).all()
    
    def get_pending_requests(self) -> List[DataSubjectRequest]:
        """Get all pending requests."""
        return self.db.query(DataSubjectRequest).filter(
            DataSubjectRequest.status == "pending"
        ).order_by(DataSubjectRequest.created_at).all()
    
    def update_request_status(
        self,
        request_id: int,
        status: str,
        admin_user_id: int,
        notes: Optional[str] = None
    ) -> Optional[DataSubjectRequest]:
        """Update the status of a data subject request."""
        request = self.get_request(request_id)
        if not request:
            return None
        
        request.status = status
        request.admin_user_id = admin_user_id
        
        if notes:
            request.completion_notes = notes
        
        if status in ["completed", "rejected"]:
            request.completed_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(request)
        
        logger.info(f"Updated request {request_id} status to {status}")
        return request
    
    def execute_access_request(self, request_id: int) -> Dict[str, Any]:
        """Execute a data access request and return the data."""
        request = self.get_request(request_id)
        if not request or request.request_type != "access":
            raise ValueError("Invalid request ID or type")
        
        if not request.user_id:
            raise ValueError("Request must be associated with a user")
        
        # Collect user data from different tables
        user_data = self._collect_user_data(request.user_id)
        
        return user_data
    
    def execute_deletion_request(self, request_id: int) -> bool:
        """Execute a data deletion request."""
        request = self.get_request(request_id)
        if not request or request.request_type != "deletion":
            raise ValueError("Invalid request ID or type")
        
        if not request.user_id:
            raise ValueError("Request must be associated with a user")
        
        # Implement deletion logic
        success = self._delete_user_data(request.user_id)
        
        return success
    
    def _collect_user_data(self, user_id: int) -> Dict[str, Any]:
        """Collect all data associated with a user."""
        from src.models.system import User
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {}
        
        # This would be expanded to gather data from all relevant tables
        # and format it according to the requirements of the access request
        
        user_data = {
            "personal_info": {
                "id": user.id,
                "email": user.email,
                "username": getattr(user, "username", None),
                "full_name": getattr(user, "full_name", None),
                "created_at": user.created_at.isoformat()
            },
            "consent_records": self._get_user_consent_records(user_id),
            # Add other data categories as needed
        }
        
        return user_data
    
    def _get_user_consent_records(self, user_id: int) -> List[Dict[str, Any]]:
        """Get consent records for a user."""
        consent_records = self.db.query(ConsentRecord).filter(
            ConsentRecord.user_id == user_id
        ).order_by(ConsentRecord.recorded_at.desc()).all()
        
        return [
            {
                "consent_type": record.consent_type,
                "status": record.status,
                "recorded_at": record.recorded_at.isoformat(),
                "consent_version": record.consent_version
            }
            for record in consent_records
        ]
    
    def _delete_user_data(self, user_id: int) -> bool:
        """Delete or anonymize all user data."""
        from src.models.system import User
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        # Anonymize user data
        anonymized_email = f"anonymized_{uuid.uuid4().hex}@deleted.example.com"
        
        # Set user to inactive and anonymize identifiable fields
        if hasattr(user, "is_active"):
            user.is_active = False
            
        if hasattr(user, "email"):
            user.email = anonymized_email
            
        if hasattr(user, "username"):
            user.username = f"anonymized_{uuid.uuid4().hex}"
            
        if hasattr(user, "full_name"):
            user.full_name = "Anonymized User"
        
        # Set deleted_at if the field exists
        if hasattr(user, "deleted_at"):
            user.deleted_at = datetime.utcnow()
        
        # Revoke all consent
        consent_manager = ConsentManager(self.db)
        consent_manager.revoke_all_user_consent(user_id)
        
        # Additional data deletion would be implemented here,
        # depending on the specific requirements
        
        self.db.commit()
        
        logger.info(f"Executed deletion request for user {user_id}")
        return True


class ComplianceDocumentManager:
    """Service for managing compliance documents."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_document(
        self,
        document_type: str,
        version: str,
        content: str,
        effective_date: datetime,
        created_by: int,
        is_current: bool = False
    ) -> ComplianceDocument:
        """Create a new compliance document."""
        # If setting as current, unset any existing current document
        if is_current:
            self._unset_current_document(document_type)
        
        document = ComplianceDocument(
            document_type=document_type,
            version=version,
            content=content,
            effective_date=effective_date,
            created_by=created_by,
            is_current=is_current
        )
        
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        
        logger.info(f"Created {document_type} version {version}")
        return document
    
    def _unset_current_document(self, document_type: str) -> None:
        """Unset the current flag for all documents of this type."""
        self.db.query(ComplianceDocument).filter(
            ComplianceDocument.document_type == document_type,
            ComplianceDocument.is_current == True
        ).update({"is_current": False})
        
        self.db.commit()
    
    def get_document(self, document_id: int) -> Optional[ComplianceDocument]:
        """Get a document by ID."""
        return self.db.query(ComplianceDocument).filter(
            ComplianceDocument.id == document_id
        ).first()
    
    def get_current_document(self, document_type: str) -> Optional[ComplianceDocument]:
        """Get the current version of a document type."""
        return self.db.query(ComplianceDocument).filter(
            ComplianceDocument.document_type == document_type,
            ComplianceDocument.is_current == True
        ).first()
    
    def get_document_version(self, document_type: str, version: str) -> Optional[ComplianceDocument]:
        """Get a specific version of a document type."""
        return self.db.query(ComplianceDocument).filter(
            ComplianceDocument.document_type == document_type,
            ComplianceDocument.version == version
        ).first()
    
    def get_document_versions(self, document_type: str) -> List[ComplianceDocument]:
        """Get all versions of a document type."""
        return self.db.query(ComplianceDocument).filter(
            ComplianceDocument.document_type == document_type
        ).order_by(desc(ComplianceDocument.effective_date)).all()
    
    def set_current_document(self, document_id: int) -> Optional[ComplianceDocument]:
        """Set a document as the current version."""
        document = self.get_document(document_id)
        if not document:
            return None
        
        # Unset any current document of this type
        self._unset_current_document(document.document_type)
        
        # Set this document as current
        document.is_current = True
        self.db.commit()
        self.db.refresh(document)
        
        logger.info(f"Set {document.document_type} version {document.version} as current")
        return document


class DataClassificationService:
    """Service for managing data classification and field-level security."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_classification(
        self,
        name: str,
        description: str,
        access_requirements: str,
        encryption_required: bool = False,
        retention_requirements: Optional[str] = None
    ) -> DataClassification:
        """Create a new data classification level."""
        classification = DataClassification(
            name=name,
            description=description,
            access_requirements=access_requirements,
            encryption_required=encryption_required,
            retention_requirements=retention_requirements
        )
        
        self.db.add(classification)
        self.db.commit()
        self.db.refresh(classification)
        
        logger.info(f"Created data classification: {name}")
        return classification
    
    def get_classification(self, classification_id: int) -> Optional[DataClassification]:
        """Get a data classification by ID."""
        return self.db.query(DataClassification).filter(
            DataClassification.id == classification_id
        ).first()
    
    def get_classification_by_name(self, name: str) -> Optional[DataClassification]:
        """Get a data classification by name."""
        return self.db.query(DataClassification).filter(
            DataClassification.name == name
        ).first()
    
    def get_all_classifications(self) -> List[DataClassification]:
        """Get all data classifications."""
        return self.db.query(DataClassification).all()
    
    def classify_field(
        self,
        table_name: str,
        field_name: str,
        classification_id: int,
        is_pii: bool = False,
        is_encrypted: bool = False,
        mask_display: bool = False
    ) -> FieldClassification:
        """Classify a database field."""
        # Check if classification exists
        classification = self.get_classification(classification_id)
        if not classification:
            raise ValueError(f"Classification with ID {classification_id} not found")
        
        # Check if field is already classified and update if so
        existing = self.db.query(FieldClassification).filter(
            FieldClassification.table_name == table_name,
            FieldClassification.field_name == field_name
        ).first()
        
        if existing:
            existing.classification_id = classification_id
            existing.is_pii = is_pii
            existing.is_encrypted = is_encrypted
            existing.mask_display = mask_display
            
            self.db.commit()
            self.db.refresh(existing)
            
            logger.info(f"Updated classification for {table_name}.{field_name}")
            return existing
        
        # Create new classification
        field_classification = FieldClassification(
            table_name=table_name,
            field_name=field_name,
            classification_id=classification_id,
            is_pii=is_pii,
            is_encrypted=is_encrypted,
            mask_display=mask_display
        )
        
        self.db.add(field_classification)
        self.db.commit()
        self.db.refresh(field_classification)
        
        logger.info(f"Classified {table_name}.{field_name} as {classification.name}")
        return field_classification
    
    def get_field_classification(self, table_name: str, field_name: str) -> Optional[FieldClassification]:
        """Get classification for a specific field."""
        return self.db.query(FieldClassification).filter(
            FieldClassification.table_name == table_name,
            FieldClassification.field_name == field_name
        ).first()
    
    def get_table_classifications(self, table_name: str) -> List[FieldClassification]:
        """Get classifications for all fields in a table."""
        return self.db.query(FieldClassification).filter(
            FieldClassification.table_name == table_name
        ).all()
    
    def get_pii_fields(self) -> List[FieldClassification]:
        """Get all fields classified as PII."""
        return self.db.query(FieldClassification).filter(
            FieldClassification.is_pii == True
        ).all()
    
    def should_encrypt_field(self, table_name: str, field_name: str) -> bool:
        """Check if a field should be encrypted based on its classification."""
        field = self.get_field_classification(table_name, field_name)
        if not field:
            return False
        
        classification = self.get_classification(field.classification_id)
        if not classification:
            return False
        
        return classification.encryption_required
    
    def should_mask_field(self, table_name: str, field_name: str) -> bool:
        """Check if a field should be masked in display/exports."""
        field = self.get_field_classification(table_name, field_name)
        if not field:
            return False
        
        return field.mask_display


class PrivacyImpactAssessmentService:
    """Service for managing privacy impact assessments."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_assessment(
        self,
        title: str,
        feature_description: str,
        data_collected: List[Dict[str, Any]],
        data_use: str,
        data_sharing: Optional[str] = None,
        risks_identified: Optional[List[Dict[str, Any]]] = None,
        mitigations: Optional[List[Dict[str, Any]]] = None,
        created_by: int = None
    ) -> PrivacyImpactAssessment:
        """Create a new privacy impact assessment."""
        assessment = PrivacyImpactAssessment(
            title=title,
            feature_description=feature_description,
            data_collected=data_collected,
            data_use=data_use,
            data_sharing=data_sharing,
            risks_identified=risks_identified,
            mitigations=mitigations,
            status="draft",
            created_by=created_by
        )
        
        self.db.add(assessment)
        self.db.commit()
        self.db.refresh(assessment)
        
        logger.info(f"Created PIA: {title}")
        return assessment
    
    def get_assessment(self, assessment_id: int) -> Optional[PrivacyImpactAssessment]:
        """Get a privacy impact assessment by ID."""
        return self.db.query(PrivacyImpactAssessment).filter(
            PrivacyImpactAssessment.id == assessment_id
        ).first()
    
    def get_assessments(
        self, 
        status: Optional[str] = None, 
        creator_id: Optional[int] = None
    ) -> List[PrivacyImpactAssessment]:
        """Get privacy impact assessments, optionally filtered by status or creator."""
        query = self.db.query(PrivacyImpactAssessment)
        
        if status:
            query = query.filter(PrivacyImpactAssessment.status == status)
        
        if creator_id:
            query = query.filter(PrivacyImpactAssessment.created_by == creator_id)
        
        return query.order_by(PrivacyImpactAssessment.created_at.desc()).all()
    
    def update_assessment(
        self,
        assessment_id: int,
        updates: Dict[str, Any]
    ) -> Optional[PrivacyImpactAssessment]:
        """Update a privacy impact assessment."""
        assessment = self.get_assessment(assessment_id)
        if not assessment:
            return None
        
        # Update only allowed fields
        allowed_fields = [
            "title", "feature_description", "data_collected", 
            "data_use", "data_sharing", "risks_identified", "mitigations"
        ]
        
        for field in allowed_fields:
            if field in updates:
                setattr(assessment, field, updates[field])
        
        self.db.commit()
        self.db.refresh(assessment)
        
        logger.info(f"Updated PIA: {assessment.title}")
        return assessment
    
    def update_assessment_status(
        self,
        assessment_id: int,
        status: str,
        reviewer_id: Optional[int] = None
    ) -> Optional[PrivacyImpactAssessment]:
        """Update the status of a privacy impact assessment."""
        assessment = self.get_assessment(assessment_id)
        if not assessment:
            return None
        
        assessment.status = status
        
        if reviewer_id:
            assessment.reviewer_id = reviewer_id
        
        if status in ["approved", "rejected"]:
            assessment.completed_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(assessment)
        
        logger.info(f"Updated PIA status to {status}: {assessment.title}")
        return assessment