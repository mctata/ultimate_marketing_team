"""
Tests for the compliance API endpoints.

These tests validate that the API endpoints for compliance features correctly
manage data retention policies, consent, data subject requests, and other compliance
functionality.
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
import json

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.api.routers.compliance import router
from src.core.compliance import (
    DataRetentionService, ConsentManager, DataSubjectRequestManager,
    ComplianceDocumentManager, DataClassificationService, PrivacyImpactAssessmentService
)
from src.models.compliance import (
    DataRetentionPolicy, DataRetentionExemption, ConsentRecord,
    DataSubjectRequest, ComplianceDocument, DataClassification, FieldClassification,
    PrivacyImpactAssessment
)
from src.models.system import User


# Create test FastAPI app with compliance router
app = FastAPI()
app.include_router(router)
client = TestClient(app)


@pytest.fixture
def mock_get_db():
    """Mock database session dependency."""
    mock_db = MagicMock(spec=Session)
    return mock_db


@pytest.fixture
def mock_auth_user():
    """Mock authenticated user for dependency injection."""
    user = MagicMock(spec=User)
    user.id = 1
    user.email = "admin@example.com"
    user.is_active = True
    return user


@pytest.fixture
def auth_headers():
    """Mock authorization headers for requests."""
    return {"Authorization": "Bearer fake_token"}


@pytest.fixture
def mock_has_permission():
    """Mock permission check to always return True."""
    return MagicMock(return_value=True)


@pytest.fixture
def sample_retention_policy():
    """Create a sample retention policy for testing."""
    return DataRetentionPolicy(
        id=1,
        entity_type="user",
        retention_period_days=730,
        archive_strategy="archive",
        legal_basis="GDPR Article 6",
        applies_to_deleted=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def sample_retention_exemption():
    """Create a sample retention exemption for testing."""
    return DataRetentionExemption(
        id=1,
        entity_type="user",
        entity_id=123,
        reason="Legal hold",
        created_by=1,
        created_at=datetime.utcnow()
    )


@pytest.fixture
def sample_consent_record():
    """Create a sample consent record for testing."""
    return ConsentRecord(
        id=1,
        user_id=1,
        consent_type="marketing_emails",
        status=True,
        ip_address="192.168.1.1",
        user_agent="Mozilla/5.0 (Test Client)",
        consent_version="v1.0",
        data_categories=["email", "preferences"],
        recorded_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=365)
    )


@pytest.fixture
def sample_data_subject_request():
    """Create a sample data subject request for testing."""
    return DataSubjectRequest(
        id=1,
        user_id=1,
        request_type="access",
        status="pending",
        request_details={"reason": "GDPR access request"},
        requester_email="user@example.com",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def sample_compliance_document():
    """Create a sample compliance document for testing."""
    return ComplianceDocument(
        id=1,
        document_type="privacy_policy",
        version="v1.0",
        content="This is our privacy policy...",
        effective_date=datetime.utcnow(),
        created_by=1,
        is_current=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def sample_data_classification():
    """Create a sample data classification for testing."""
    return DataClassification(
        id=1,
        name="confidential",
        description="Sensitive business data",
        access_requirements="Employees only",
        encryption_required=True,
        retention_requirements="5 years",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def sample_field_classification():
    """Create a sample field classification for testing."""
    return FieldClassification(
        id=1,
        table_name="user",
        field_name="social_security_number",
        classification_id=1,
        is_pii=True,
        is_encrypted=True,
        mask_display=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def sample_privacy_assessment():
    """Create a sample privacy impact assessment for testing."""
    return PrivacyImpactAssessment(
        id=1,
        title="Customer Profiling Feature",
        feature_description="AI-powered customer behavior profiling",
        data_collected=[
            {"category": "demographics", "purpose": "segmentation"}
        ],
        data_use="Customer segmentation",
        status="draft",
        created_by=1,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


# Override dependencies for testing
@pytest.fixture(autouse=True)
def override_dependencies(monkeypatch):
    """Override FastAPI dependencies for testing."""
    # Mock get_db dependency
    mock_db = MagicMock(spec=Session)
    monkeypatch.setattr("src.api.routers.compliance.get_db", lambda: mock_db)
    
    # Mock get_current_user dependency
    mock_user = User(
        id=1, 
        email="admin@example.com", 
        is_active=True
    )
    monkeypatch.setattr("src.api.routers.compliance.get_current_user", lambda: mock_user)
    
    # Mock has_permission dependency
    monkeypatch.setattr("src.api.routers.compliance.has_permission", lambda user, scope, action: True)
    
    # Return the mocked db for tests to use
    return mock_db


# Data Retention Policy Tests
class TestRetentionPolicyEndpoints:
    """Tests for data retention policy endpoints."""
    
    @patch("src.api.routers.compliance.DataRetentionService")
    def test_get_retention_policies(self, mock_service_class, override_dependencies, auth_headers, sample_retention_policy):
        """Test getting all retention policies."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_policies.return_value = [sample_retention_policy]
        
        # Act
        response = client.get("/api/v1/compliance/retention/policies", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["entity_type"] == "user"
        assert response.json()[0]["retention_period_days"] == 730
        mock_service.get_policies.assert_called_once()
    
    @patch("src.api.routers.compliance.DataRetentionService")
    def test_create_retention_policy(self, mock_service_class, override_dependencies, auth_headers, sample_retention_policy):
        """Test creating a new retention policy."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_policy.return_value = None  # No existing policy
        mock_service.create_policy.return_value = sample_retention_policy
        
        # Act
        response = client.post(
            "/api/v1/compliance/retention/policies",
            headers=auth_headers,
            json={
                "entity_type": "user",
                "retention_period_days": 730,
                "archive_strategy": "archive",
                "legal_basis": "GDPR Article 6",
                "applies_to_deleted": True
            }
        )
        
        # Assert
        assert response.status_code == 201
        assert response.json()["entity_type"] == "user"
        assert response.json()["retention_period_days"] == 730
        mock_service.create_policy.assert_called_once()
    
    @patch("src.api.routers.compliance.DataRetentionService")
    def test_create_retention_policy_conflict(self, mock_service_class, override_dependencies, auth_headers, sample_retention_policy):
        """Test creating a policy that already exists."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_policy.return_value = sample_retention_policy  # Policy already exists
        
        # Act
        response = client.post(
            "/api/v1/compliance/retention/policies",
            headers=auth_headers,
            json={
                "entity_type": "user",
                "retention_period_days": 730,
                "archive_strategy": "archive",
                "legal_basis": "GDPR Article 6",
                "applies_to_deleted": True
            }
        )
        
        # Assert
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]
        mock_service.create_policy.assert_not_called()
    
    @patch("src.api.routers.compliance.DataRetentionService")
    def test_get_retention_policy(self, mock_service_class, override_dependencies, auth_headers, sample_retention_policy):
        """Test getting a specific retention policy."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_policy.return_value = sample_retention_policy
        
        # Act
        response = client.get("/api/v1/compliance/retention/policies/user", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert response.json()["entity_type"] == "user"
        assert response.json()["retention_period_days"] == 730
        mock_service.get_policy.assert_called_once_with("user")
    
    @patch("src.api.routers.compliance.DataRetentionService")
    def test_get_retention_policy_not_found(self, mock_service_class, override_dependencies, auth_headers):
        """Test getting a non-existent retention policy."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_policy.return_value = None
        
        # Act
        response = client.get("/api/v1/compliance/retention/policies/nonexistent", headers=auth_headers)
        
        # Assert
        assert response.status_code == 404
        assert "No retention policy found" in response.json()["detail"]
    
    @patch("src.api.routers.compliance.DataRetentionService")
    def test_update_retention_policy(self, mock_service_class, override_dependencies, auth_headers, sample_retention_policy):
        """Test updating a retention policy."""
        # Arrange
        mock_service = mock_service_class.return_value
        
        # Modified policy
        updated_policy = sample_retention_policy
        updated_policy.retention_period_days = 365
        
        mock_service.update_policy.return_value = updated_policy
        
        # Act
        response = client.put(
            "/api/v1/compliance/retention/policies/user",
            headers=auth_headers,
            json={"retention_period_days": 365}
        )
        
        # Assert
        assert response.status_code == 200
        assert response.json()["retention_period_days"] == 365
        mock_service.update_policy.assert_called_once()
    
    @patch("src.api.routers.compliance.DataRetentionService")
    def test_delete_retention_policy(self, mock_service_class, override_dependencies, auth_headers):
        """Test deleting a retention policy."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.delete_policy.return_value = True
        
        # Act
        response = client.delete("/api/v1/compliance/retention/policies/user", headers=auth_headers)
        
        # Assert
        assert response.status_code == 204
        mock_service.delete_policy.assert_called_once_with("user")
    
    @patch("src.api.routers.compliance.DataRetentionService")
    def test_delete_retention_policy_not_found(self, mock_service_class, override_dependencies, auth_headers):
        """Test deleting a non-existent retention policy."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.delete_policy.return_value = False
        
        # Act
        response = client.delete("/api/v1/compliance/retention/policies/nonexistent", headers=auth_headers)
        
        # Assert
        assert response.status_code == 404
        assert "No retention policy found" in response.json()["detail"]


# Retention Exemption Tests
class TestRetentionExemptionEndpoints:
    """Tests for data retention exemption endpoints."""
    
    @patch("src.api.routers.compliance.DataRetentionService")
    def test_create_retention_exemption(self, mock_service_class, override_dependencies, auth_headers, sample_retention_policy, sample_retention_exemption):
        """Test creating a new retention exemption."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_policy.return_value = sample_retention_policy  # Policy exists
        mock_service.check_exemption.return_value = None  # No existing exemption
        mock_service.create_exemption.return_value = sample_retention_exemption
        
        # Act
        response = client.post(
            "/api/v1/compliance/retention/exemptions",
            headers=auth_headers,
            json={
                "entity_type": "user",
                "entity_id": 123,
                "reason": "Legal hold",
                "expires_at": None
            }
        )
        
        # Assert
        assert response.status_code == 201
        assert response.json()["entity_type"] == "user"
        assert response.json()["entity_id"] == 123
        mock_service.create_exemption.assert_called_once()
    
    @patch("src.api.routers.compliance.DataRetentionService")
    def test_create_exemption_no_policy(self, mock_service_class, override_dependencies, auth_headers):
        """Test creating an exemption for a non-existent policy."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_policy.return_value = None  # Policy doesn't exist
        
        # Act
        response = client.post(
            "/api/v1/compliance/retention/exemptions",
            headers=auth_headers,
            json={
                "entity_type": "nonexistent",
                "entity_id": 123,
                "reason": "Legal hold",
                "expires_at": None
            }
        )
        
        # Assert
        assert response.status_code == 404
        assert "No retention policy found" in response.json()["detail"]
        mock_service.create_exemption.assert_not_called()
    
    @patch("src.api.routers.compliance.DataRetentionService")
    def test_create_exemption_already_exists(self, mock_service_class, override_dependencies, auth_headers, sample_retention_policy, sample_retention_exemption):
        """Test creating an exemption that already exists."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_policy.return_value = sample_retention_policy  # Policy exists
        mock_service.check_exemption.return_value = sample_retention_exemption  # Exemption already exists
        
        # Act
        response = client.post(
            "/api/v1/compliance/retention/exemptions",
            headers=auth_headers,
            json={
                "entity_type": "user",
                "entity_id": 123,
                "reason": "Legal hold",
                "expires_at": None
            }
        )
        
        # Assert
        assert response.status_code == 409
        assert "exemption already exists" in response.json()["detail"]
        mock_service.create_exemption.assert_not_called()
    
    @patch("src.api.routers.compliance.DataRetentionService")
    def test_get_retention_exemptions(self, mock_service_class, override_dependencies, auth_headers, sample_retention_exemption):
        """Test getting all retention exemptions."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_exemptions.return_value = [sample_retention_exemption]
        
        # Act
        response = client.get("/api/v1/compliance/retention/exemptions", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["entity_type"] == "user"
        assert response.json()[0]["entity_id"] == 123
        mock_service.get_exemptions.assert_called_once_with(None)
    
    @patch("src.api.routers.compliance.DataRetentionService")
    def test_get_retention_exemptions_filtered(self, mock_service_class, override_dependencies, auth_headers, sample_retention_exemption):
        """Test getting retention exemptions filtered by entity type."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_exemptions.return_value = [sample_retention_exemption]
        
        # Act
        response = client.get("/api/v1/compliance/retention/exemptions?entity_type=user", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["entity_type"] == "user"
        mock_service.get_exemptions.assert_called_once_with("user")
    
    @patch("src.api.routers.compliance.DataRetentionService")
    def test_delete_retention_exemption(self, mock_service_class, override_dependencies, auth_headers):
        """Test deleting a retention exemption."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.delete_exemption.return_value = True
        
        # Act
        response = client.delete("/api/v1/compliance/retention/exemptions/1", headers=auth_headers)
        
        # Assert
        assert response.status_code == 204
        mock_service.delete_exemption.assert_called_once_with(1)
    
    @patch("src.api.routers.compliance.DataRetentionService")
    def test_delete_retention_exemption_not_found(self, mock_service_class, override_dependencies, auth_headers):
        """Test deleting a non-existent retention exemption."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.delete_exemption.return_value = False
        
        # Act
        response = client.delete("/api/v1/compliance/retention/exemptions/999", headers=auth_headers)
        
        # Assert
        assert response.status_code == 404
        assert "No exemption found" in response.json()["detail"]


# Consent Management Tests
class TestConsentEndpoints:
    """Tests for consent management endpoints."""
    
    @patch("src.api.routers.compliance.ConsentManager")
    def test_record_consent(self, mock_service_class, override_dependencies, auth_headers, sample_consent_record):
        """Test recording a new consent decision."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.record_consent.return_value = sample_consent_record
        
        # Act
        response = client.post(
            "/api/v1/compliance/consent",
            headers=auth_headers,
            json={
                "consent_type": "marketing_emails",
                "status": True,
                "consent_version": "v1.0",
                "data_categories": ["email", "preferences"]
            }
        )
        
        # Assert
        assert response.status_code == 201
        assert response.json()["consent_type"] == "marketing_emails"
        assert response.json()["status"] is True
        mock_service.record_consent.assert_called_once()
    
    @patch("src.api.routers.compliance.ConsentManager")
    def test_check_consent(self, mock_service_class, override_dependencies, auth_headers):
        """Test checking a user's consent status."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.check_user_consent.return_value = True
        
        # Act
        response = client.get("/api/v1/compliance/consent/status/marketing_emails", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert response.json()["consent_type"] == "marketing_emails"
        assert response.json()["has_consent"] is True
        mock_service.check_user_consent.assert_called_once_with(1, "marketing_emails")
    
    @patch("src.api.routers.compliance.ConsentManager")
    def test_check_consent_categories(self, mock_service_class, override_dependencies, auth_headers):
        """Test checking a user's consent for multiple categories."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.check_consent_for_categories.return_value = {
            "email": True,
            "preferences": True,
            "location": False
        }
        
        # Act
        response = client.get("/api/v1/compliance/consent/categories?categories=email&categories=preferences&categories=location", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert response.json()["email"] is True
        assert response.json()["preferences"] is True
        assert response.json()["location"] is False
        mock_service.check_consent_for_categories.assert_called_once()
    
    @patch("src.api.routers.compliance.ConsentManager")
    def test_get_consent_history(self, mock_service_class, override_dependencies, auth_headers, sample_consent_record):
        """Test getting a user's consent history."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_user_consent_history.return_value = [
            {
                "id": 1,
                "consent_type": "marketing_emails",
                "status": True,
                "recorded_at": datetime.utcnow().isoformat(),
                "expires_at": (datetime.utcnow() + timedelta(days=365)).isoformat(),
                "consent_version": "v1.0",
                "data_categories": ["email", "preferences"]
            }
        ]
        
        # Act
        response = client.get("/api/v1/compliance/consent/history", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["consent_type"] == "marketing_emails"
        assert response.json()[0]["status"] is True
        mock_service.get_user_consent_history.assert_called_once_with(1)
    
    @patch("src.api.routers.compliance.ConsentManager")
    def test_revoke_all_consent(self, mock_service_class, override_dependencies, auth_headers):
        """Test revoking all consent for a user."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.revoke_all_user_consent.return_value = 3  # 3 consents revoked
        
        # Act
        response = client.post("/api/v1/compliance/consent/revoke-all", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert response.json()["consents_revoked"] == 3
        mock_service.revoke_all_user_consent.assert_called_once_with(1)


# Data Subject Request Tests
class TestDataSubjectRequestEndpoints:
    """Tests for data subject request endpoints."""
    
    @patch("src.api.routers.compliance.DataSubjectRequestManager")
    def test_create_data_request(self, mock_service_class, override_dependencies, auth_headers, sample_data_subject_request):
        """Test creating a data subject request."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.create_request.return_value = sample_data_subject_request
        
        # Act
        response = client.post(
            "/api/v1/compliance/data-requests",
            headers=auth_headers,
            json={
                "request_type": "access",
                "details": {"reason": "GDPR access request"}
            }
        )
        
        # Assert
        assert response.status_code == 201
        assert response.json()["request_type"] == "access"
        assert response.json()["status"] == "pending"
        mock_service.create_request.assert_called_once()
    
    @patch("src.api.routers.compliance.DataSubjectRequestManager")
    def test_get_user_data_requests(self, mock_service_class, override_dependencies, auth_headers, sample_data_subject_request):
        """Test getting all data subject requests for a user."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_user_requests.return_value = [sample_data_subject_request]
        
        # Act
        response = client.get("/api/v1/compliance/data-requests", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["request_type"] == "access"
        assert response.json()[0]["status"] == "pending"
        mock_service.get_user_requests.assert_called_once_with(1)
    
    @patch("src.api.routers.compliance.DataSubjectRequestManager")
    def test_get_data_request(self, mock_service_class, override_dependencies, auth_headers, sample_data_subject_request):
        """Test getting details of a specific data subject request."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_request.return_value = sample_data_subject_request
        
        # Act
        response = client.get("/api/v1/compliance/data-requests/1", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert response.json()["id"] == 1
        assert response.json()["request_type"] == "access"
        assert response.json()["status"] == "pending"
        mock_service.get_request.assert_called_once_with(1)
    
    @patch("src.api.routers.compliance.DataSubjectRequestManager")
    def test_get_data_request_not_found(self, mock_service_class, override_dependencies, auth_headers):
        """Test getting a non-existent data subject request."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_request.return_value = None
        
        # Act
        response = client.get("/api/v1/compliance/data-requests/999", headers=auth_headers)
        
        # Assert
        assert response.status_code == 404
        assert "Request not found" in response.json()["detail"]
    
    @patch("src.api.routers.compliance.DataSubjectRequestManager")
    def test_get_pending_requests(self, mock_service_class, override_dependencies, auth_headers, sample_data_subject_request):
        """Test getting all pending data subject requests (admin endpoint)."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_pending_requests.return_value = [sample_data_subject_request]
        
        # Act
        response = client.get("/api/v1/compliance/admin/data-requests/pending", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["request_type"] == "access"
        assert response.json()[0]["status"] == "pending"
        mock_service.get_pending_requests.assert_called_once()
    
    @patch("src.api.routers.compliance.DataSubjectRequestManager")
    def test_update_request_status(self, mock_service_class, override_dependencies, auth_headers, sample_data_subject_request):
        """Test updating the status of a data subject request."""
        # Arrange
        mock_service = mock_service_class.return_value
        
        # Modified request with updated status
        updated_request = sample_data_subject_request
        updated_request.status = "in_progress"
        updated_request.updated_at = datetime.utcnow()
        
        mock_service.update_request_status.return_value = updated_request
        
        # Act
        response = client.put(
            "/api/v1/compliance/admin/data-requests/1/status",
            headers=auth_headers,
            json={
                "status": "in_progress",
                "notes": "Processing request"
            }
        )
        
        # Assert
        assert response.status_code == 200
        assert response.json()["status"] == "in_progress"
        mock_service.update_request_status.assert_called_once()
    
    @patch("src.api.routers.compliance.DataSubjectRequestManager")
    def test_execute_data_request(self, mock_service_class, override_dependencies, auth_headers, sample_data_subject_request):
        """Test executing a data subject request."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_request.return_value = sample_data_subject_request
        
        # Act
        response = client.post("/api/v1/compliance/admin/data-requests/1/execute", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert "Execution of access request started" in response.json()["message"]
        mock_service.get_request.assert_called_once_with(1)


# Compliance Document Tests
class TestComplianceDocumentEndpoints:
    """Tests for compliance document endpoints."""
    
    @patch("src.api.routers.compliance.ComplianceDocumentManager")
    def test_create_compliance_document(self, mock_service_class, override_dependencies, auth_headers, sample_compliance_document):
        """Test creating a new compliance document."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.create_document.return_value = sample_compliance_document
        
        # Act
        response = client.post(
            "/api/v1/compliance/documents",
            headers=auth_headers,
            json={
                "document_type": "privacy_policy",
                "version": "v1.0",
                "content": "This is our privacy policy...",
                "effective_date": datetime.utcnow().isoformat(),
                "is_current": True
            }
        )
        
        # Assert
        assert response.status_code == 201
        assert response.json()["document_type"] == "privacy_policy"
        assert response.json()["version"] == "v1.0"
        assert response.json()["is_current"] is True
        mock_service.create_document.assert_called_once()
    
    @patch("src.api.routers.compliance.ComplianceDocumentManager")
    def test_get_current_document(self, mock_service_class, override_dependencies, auth_headers, sample_compliance_document):
        """Test getting the current version of a document type."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_current_document.return_value = sample_compliance_document
        
        # Act
        response = client.get("/api/v1/compliance/documents/current/privacy_policy", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert response.json()["document_type"] == "privacy_policy"
        assert response.json()["version"] == "v1.0"
        assert "content" in response.json()
        mock_service.get_current_document.assert_called_once_with("privacy_policy")
    
    @patch("src.api.routers.compliance.ComplianceDocumentManager")
    def test_get_current_document_not_found(self, mock_service_class, override_dependencies, auth_headers):
        """Test getting a non-existent current document."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_current_document.return_value = None
        
        # Act
        response = client.get("/api/v1/compliance/documents/current/nonexistent", headers=auth_headers)
        
        # Assert
        assert response.status_code == 404
        assert "No current nonexistent document found" in response.json()["detail"]
    
    @patch("src.api.routers.compliance.ComplianceDocumentManager")
    def test_get_document_versions(self, mock_service_class, override_dependencies, auth_headers, sample_compliance_document):
        """Test getting all versions of a document type."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_document_versions.return_value = [sample_compliance_document]
        
        # Act
        response = client.get("/api/v1/compliance/documents/privacy_policy/versions", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["version"] == "v1.0"
        assert response.json()[0]["is_current"] is True
        mock_service.get_document_versions.assert_called_once_with("privacy_policy")
    
    @patch("src.api.routers.compliance.ComplianceDocumentManager")
    def test_set_current_document(self, mock_service_class, override_dependencies, auth_headers, sample_compliance_document):
        """Test setting a document as the current version."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.set_current_document.return_value = sample_compliance_document
        
        # Act
        response = client.put("/api/v1/compliance/documents/1/set-current", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert response.json()["document_type"] == "privacy_policy"
        assert response.json()["is_current"] is True
        mock_service.set_current_document.assert_called_once_with(1)


# Data Classification Tests
class TestDataClassificationEndpoints:
    """Tests for data classification endpoints."""
    
    @patch("src.api.routers.compliance.DataClassificationService")
    def test_create_classification(self, mock_service_class, override_dependencies, auth_headers, sample_data_classification):
        """Test creating a new data classification."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.create_classification.return_value = sample_data_classification
        
        # Act
        response = client.post(
            "/api/v1/compliance/classifications",
            headers=auth_headers,
            json={
                "name": "confidential",
                "description": "Sensitive business data",
                "access_requirements": "Employees only",
                "encryption_required": True,
                "retention_requirements": "5 years"
            }
        )
        
        # Assert
        assert response.status_code == 201
        assert response.json()["name"] == "confidential"
        assert response.json()["encryption_required"] is True
        mock_service.create_classification.assert_called_once()
    
    @patch("src.api.routers.compliance.DataClassificationService")
    def test_get_classifications(self, mock_service_class, override_dependencies, auth_headers, sample_data_classification):
        """Test getting all data classifications."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_all_classifications.return_value = [sample_data_classification]
        
        # Act
        response = client.get("/api/v1/compliance/classifications", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["name"] == "confidential"
        assert response.json()[0]["encryption_required"] is True
        mock_service.get_all_classifications.assert_called_once()
    
    @patch("src.api.routers.compliance.DataClassificationService")
    def test_classify_field(self, mock_service_class, override_dependencies, auth_headers, sample_field_classification):
        """Test classifying a database field."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.classify_field.return_value = sample_field_classification
        
        # Act
        response = client.post(
            "/api/v1/compliance/field-classifications",
            headers=auth_headers,
            json={
                "table_name": "user",
                "field_name": "social_security_number",
                "classification_id": 1,
                "is_pii": True,
                "is_encrypted": True,
                "mask_display": True
            }
        )
        
        # Assert
        assert response.status_code == 201
        assert response.json()["table_name"] == "user"
        assert response.json()["field_name"] == "social_security_number"
        assert response.json()["is_pii"] is True
        mock_service.classify_field.assert_called_once()
    
    @patch("src.api.routers.compliance.DataClassificationService")
    def test_get_table_classifications(self, mock_service_class, override_dependencies, auth_headers, sample_field_classification):
        """Test getting classifications for all fields in a table."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_table_classifications.return_value = [sample_field_classification]
        
        # Act
        response = client.get("/api/v1/compliance/field-classifications/table/user", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["table_name"] == "user"
        assert response.json()[0]["field_name"] == "social_security_number"
        assert response.json()[0]["is_pii"] is True
        mock_service.get_table_classifications.assert_called_once_with("user")
    
    @patch("src.api.routers.compliance.DataClassificationService")
    def test_get_pii_fields(self, mock_service_class, override_dependencies, auth_headers, sample_field_classification):
        """Test getting all fields classified as PII."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_pii_fields.return_value = [sample_field_classification]
        
        # Act
        response = client.get("/api/v1/compliance/field-classifications/pii", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["table_name"] == "user"
        assert response.json()[0]["field_name"] == "social_security_number"
        assert response.json()[0]["is_encrypted"] is True
        mock_service.get_pii_fields.assert_called_once()


# Privacy Impact Assessment Tests
class TestPrivacyImpactAssessmentEndpoints:
    """Tests for privacy impact assessment endpoints."""
    
    @patch("src.api.routers.compliance.PrivacyImpactAssessmentService")
    def test_create_privacy_assessment(self, mock_service_class, override_dependencies, auth_headers, sample_privacy_assessment):
        """Test creating a new privacy impact assessment."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.create_assessment.return_value = sample_privacy_assessment
        
        # Act
        response = client.post(
            "/api/v1/compliance/privacy-assessments",
            headers=auth_headers,
            json={
                "title": "Customer Profiling Feature",
                "feature_description": "AI-powered customer behavior profiling",
                "data_collected": [
                    {"category": "demographics", "purpose": "segmentation"}
                ],
                "data_use": "Customer segmentation"
            }
        )
        
        # Assert
        assert response.status_code == 201
        assert response.json()["title"] == "Customer Profiling Feature"
        assert response.json()["status"] == "draft"
        mock_service.create_assessment.assert_called_once()
    
    @patch("src.api.routers.compliance.PrivacyImpactAssessmentService")
    def test_get_privacy_assessments(self, mock_service_class, override_dependencies, auth_headers, sample_privacy_assessment):
        """Test getting all privacy impact assessments."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_assessments.return_value = [sample_privacy_assessment]
        
        # Act
        response = client.get("/api/v1/compliance/privacy-assessments", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["title"] == "Customer Profiling Feature"
        assert response.json()[0]["status"] == "draft"
        mock_service.get_assessments.assert_called_once_with(None)
    
    @patch("src.api.routers.compliance.PrivacyImpactAssessmentService")
    def test_get_privacy_assessments_filtered(self, mock_service_class, override_dependencies, auth_headers, sample_privacy_assessment):
        """Test getting privacy impact assessments filtered by status."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_assessments.return_value = [sample_privacy_assessment]
        
        # Act
        response = client.get("/api/v1/compliance/privacy-assessments?status=draft", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["status"] == "draft"
        mock_service.get_assessments.assert_called_once_with("draft")
    
    @patch("src.api.routers.compliance.PrivacyImpactAssessmentService")
    def test_get_privacy_assessment(self, mock_service_class, override_dependencies, auth_headers, sample_privacy_assessment):
        """Test getting a specific privacy impact assessment."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_assessment.return_value = sample_privacy_assessment
        
        # Act
        response = client.get("/api/v1/compliance/privacy-assessments/1", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert response.json()["id"] == 1
        assert response.json()["title"] == "Customer Profiling Feature"
        assert "data_collected" in response.json()
        mock_service.get_assessment.assert_called_once_with(1)
    
    @patch("src.api.routers.compliance.PrivacyImpactAssessmentService")
    def test_get_privacy_assessment_not_found(self, mock_service_class, override_dependencies, auth_headers):
        """Test getting a non-existent privacy impact assessment."""
        # Arrange
        mock_service = mock_service_class.return_value
        mock_service.get_assessment.return_value = None
        
        # Act
        response = client.get("/api/v1/compliance/privacy-assessments/999", headers=auth_headers)
        
        # Assert
        assert response.status_code == 404
        assert "Privacy assessment with ID 999 not found" in response.json()["detail"]
    
    @patch("src.api.routers.compliance.PrivacyImpactAssessmentService")
    def test_update_privacy_assessment_status(self, mock_service_class, override_dependencies, auth_headers, sample_privacy_assessment):
        """Test updating the status of a privacy impact assessment."""
        # Arrange
        mock_service = mock_service_class.return_value
        
        # Modified assessment with updated status
        updated_assessment = sample_privacy_assessment
        updated_assessment.status = "approved"
        updated_assessment.updated_at = datetime.utcnow()
        
        mock_service.update_assessment_status.return_value = updated_assessment
        
        # Act
        response = client.put("/api/v1/compliance/privacy-assessments/1/status?status=approved", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        assert response.json()["status"] == "approved"
        mock_service.update_assessment_status.assert_called_once()