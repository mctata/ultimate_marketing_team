"""
Unit tests for the Data Subject Request Manager.

These tests validate that the DataSubjectRequestManager correctly handles 
data subject access and deletion requests.
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from src.core.compliance import DataSubjectRequestManager, ConsentManager
from src.models.compliance import DataSubjectRequest, ConsentRecord


@pytest.fixture
def mock_db():
    """Mock database session."""
    db = MagicMock(spec=Session)
    
    # Set up query mock objects
    db.query.return_value = db.query
    db.query.filter.return_value = db.query
    db.query.order_by.return_value = db.query
    db.query.all.return_value = []
    db.query.first.return_value = None
    
    return db


@pytest.fixture
def request_manager(mock_db):
    """Create DataSubjectRequestManager with mock db."""
    return DataSubjectRequestManager(mock_db)


@pytest.fixture
def sample_access_request():
    """Create a sample access request."""
    return DataSubjectRequest(
        id=1,
        user_id=42,
        request_type="access",
        status="pending",
        request_details={"reason": "Exercising GDPR rights"},
        requester_email="user@example.com",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def sample_deletion_request():
    """Create a sample deletion request."""
    return DataSubjectRequest(
        id=2,
        user_id=42,
        request_type="deletion",
        status="pending",
        request_details={"reason": "Exercising right to be forgotten"},
        requester_email="user@example.com",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


class TestDataSubjectRequestManager:
    """Tests for DataSubjectRequestManager."""
    
    def test_create_request(self, request_manager, mock_db):
        """Test creating a new data subject request."""
        # Act
        request = request_manager.create_request(
            request_type="access",
            requester_email="user@example.com",
            request_details={"reason": "GDPR access request"},
            user_id=42
        )
        
        # Assert
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    def test_get_request(self, request_manager, mock_db, sample_access_request):
        """Test fetching a specific data subject request."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_access_request
        
        # Act
        request = request_manager.get_request(1)
        
        # Assert
        assert request is not None
        assert request.id == 1
        assert request.request_type == "access"
        assert request.user_id == 42
        mock_db.query.assert_called_once()
    
    def test_get_user_requests(self, request_manager, mock_db, sample_access_request, sample_deletion_request):
        """Test fetching all requests for a specific user."""
        # Arrange
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [
            sample_access_request, sample_deletion_request
        ]
        
        # Act
        requests = request_manager.get_user_requests(42)
        
        # Assert
        assert len(requests) == 2
        assert requests[0].request_type == "access"
        assert requests[1].request_type == "deletion"
        mock_db.query.assert_called_once()
    
    def test_get_requests_by_email(self, request_manager, mock_db, sample_access_request):
        """Test fetching all requests for a specific email."""
        # Arrange
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [sample_access_request]
        
        # Act
        requests = request_manager.get_requests_by_email("user@example.com")
        
        # Assert
        assert len(requests) == 1
        assert requests[0].id == 1
        assert requests[0].request_type == "access"
        mock_db.query.assert_called_once()
    
    def test_get_pending_requests(self, request_manager, mock_db, sample_access_request, sample_deletion_request):
        """Test fetching all pending requests."""
        # Arrange
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [
            sample_access_request, sample_deletion_request
        ]
        
        # Act
        requests = request_manager.get_pending_requests()
        
        # Assert
        assert len(requests) == 2
        mock_db.query.assert_called_once()
    
    def test_update_request_status(self, request_manager, mock_db, sample_access_request):
        """Test updating the status of a data subject request."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_access_request
        
        # Act
        updated_request = request_manager.update_request_status(
            request_id=1,
            status="in_progress",
            admin_user_id=99,
            notes="Processing request"
        )
        
        # Assert
        assert updated_request is not None
        assert updated_request.status == "in_progress"
        assert updated_request.admin_user_id == 99
        assert updated_request.completion_notes == "Processing request"
        assert updated_request.completed_at is None  # Not completed yet
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    def test_update_request_status_completed(self, request_manager, mock_db, sample_access_request):
        """Test marking a request as completed."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_access_request
        
        # Act
        updated_request = request_manager.update_request_status(
            request_id=1,
            status="completed",
            admin_user_id=99,
            notes="Request fulfilled"
        )
        
        # Assert
        assert updated_request is not None
        assert updated_request.status == "completed"
        assert updated_request.admin_user_id == 99
        assert updated_request.completion_notes == "Request fulfilled"
        assert updated_request.completed_at is not None  # Has completion timestamp
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    def test_update_request_status_rejected(self, request_manager, mock_db, sample_access_request):
        """Test rejecting a request."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_access_request
        
        # Act
        updated_request = request_manager.update_request_status(
            request_id=1,
            status="rejected",
            admin_user_id=99,
            notes="Invalid request"
        )
        
        # Assert
        assert updated_request is not None
        assert updated_request.status == "rejected"
        assert updated_request.admin_user_id == 99
        assert updated_request.completion_notes == "Invalid request"
        assert updated_request.completed_at is not None  # Has completion timestamp
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    def test_update_request_status_not_found(self, request_manager, mock_db):
        """Test updating a non-existent request."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        updated_request = request_manager.update_request_status(
            request_id=999,
            status="in_progress",
            admin_user_id=99
        )
        
        # Assert
        assert updated_request is None
        mock_db.commit.assert_not_called()
        mock_db.refresh.assert_not_called()
    
    @patch('src.core.compliance.datetime')
    def test_execute_access_request(self, mock_datetime, request_manager, mock_db, sample_access_request):
        """Test executing a data access request."""
        # Arrange
        mock_now = datetime.utcnow()
        mock_datetime.utcnow.return_value = mock_now
        
        mock_db.query.return_value.filter.return_value.first.return_value = sample_access_request
        
        # Mock the _collect_user_data method
        request_manager._collect_user_data = MagicMock(return_value={
            "personal_info": {
                "id": 42,
                "email": "user@example.com",
                "username": "testuser"
            },
            "consent_records": [
                {
                    "consent_type": "marketing_emails",
                    "status": True,
                    "recorded_at": "2023-01-01T12:00:00",
                    "consent_version": "v1.0"
                }
            ]
        })
        
        # Act
        user_data = request_manager.execute_access_request(1)
        
        # Assert
        assert user_data is not None
        assert "personal_info" in user_data
        assert "consent_records" in user_data
        assert user_data["personal_info"]["id"] == 42
        request_manager._collect_user_data.assert_called_once_with(42)
    
    def test_execute_access_request_invalid_type(self, request_manager, mock_db, sample_deletion_request):
        """Test executing an access request with a request of wrong type."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_deletion_request  # Deletion, not access
        
        # Act & Assert
        with pytest.raises(ValueError, match="Invalid request ID or type"):
            request_manager.execute_access_request(2)
    
    def test_execute_access_request_no_user(self, request_manager, mock_db):
        """Test executing an access request without associated user."""
        # Arrange
        request_without_user = MagicMock()
        request_without_user.request_type = "access"
        request_without_user.user_id = None
        
        mock_db.query.return_value.filter.return_value.first.return_value = request_without_user
        
        # Act & Assert
        with pytest.raises(ValueError, match="Request must be associated with a user"):
            request_manager.execute_access_request(1)
    
    def test_execute_deletion_request(self, request_manager, mock_db, sample_deletion_request):
        """Test executing a data deletion request."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_deletion_request
        
        # Mock the _delete_user_data method
        request_manager._delete_user_data = MagicMock(return_value=True)
        
        # Act
        success = request_manager.execute_deletion_request(2)
        
        # Assert
        assert success is True
        request_manager._delete_user_data.assert_called_once_with(42)
    
    def test_execute_deletion_request_invalid_type(self, request_manager, mock_db, sample_access_request):
        """Test executing a deletion request with a request of wrong type."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_access_request  # Access, not deletion
        
        # Act & Assert
        with pytest.raises(ValueError, match="Invalid request ID or type"):
            request_manager.execute_deletion_request(1)
    
    def test_execute_deletion_request_no_user(self, request_manager, mock_db):
        """Test executing a deletion request without associated user."""
        # Arrange
        request_without_user = MagicMock()
        request_without_user.request_type = "deletion"
        request_without_user.user_id = None
        
        mock_db.query.return_value.filter.return_value.first.return_value = request_without_user
        
        # Act & Assert
        with pytest.raises(ValueError, match="Request must be associated with a user"):
            request_manager.execute_deletion_request(1)
    
    def test_collect_user_data(self, request_manager, mock_db):
        """Test collecting all data associated with a user."""
        # Arrange
        # Mock User model
        mock_user = MagicMock()
        mock_user.id = 42
        mock_user.email = "user@example.com"
        mock_user.username = "testuser"
        mock_user.full_name = "Test User"
        mock_user.created_at = datetime(2023, 1, 1, 12, 0, 0)
        
        # Mock user query
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        # Mock _get_user_consent_records method
        request_manager._get_user_consent_records = MagicMock(return_value=[
            {
                "consent_type": "marketing_emails",
                "status": True,
                "recorded_at": "2023-01-01T12:00:00",
                "consent_version": "v1.0"
            }
        ])
        
        # Act
        user_data = request_manager._collect_user_data(42)
        
        # Assert
        assert user_data is not None
        assert "personal_info" in user_data
        assert "consent_records" in user_data
        assert user_data["personal_info"]["id"] == 42
        assert user_data["personal_info"]["email"] == "user@example.com"
        assert user_data["personal_info"]["username"] == "testuser"
        assert user_data["personal_info"]["full_name"] == "Test User"
        assert user_data["personal_info"]["created_at"] == "2023-01-01T12:00:00"
        assert len(user_data["consent_records"]) == 1
        request_manager._get_user_consent_records.assert_called_once_with(42)
    
    def test_collect_user_data_user_not_found(self, request_manager, mock_db):
        """Test collecting data for a non-existent user."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        user_data = request_manager._collect_user_data(999)
        
        # Assert
        assert user_data == {}
    
    def test_get_user_consent_records(self, request_manager, mock_db):
        """Test getting consent records for a user."""
        # Arrange
        # Mock consent records
        consent1 = MagicMock()
        consent1.consent_type = "marketing_emails"
        consent1.status = True
        consent1.recorded_at = datetime(2023, 1, 1, 12, 0, 0)
        consent1.consent_version = "v1.0"
        
        consent2 = MagicMock()
        consent2.consent_type = "analytics"
        consent2.status = False
        consent2.recorded_at = datetime(2023, 1, 2, 12, 0, 0)
        consent2.consent_version = "v1.0"
        
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [consent1, consent2]
        
        # Act
        consent_records = request_manager._get_user_consent_records(42)
        
        # Assert
        assert len(consent_records) == 2
        assert consent_records[0]["consent_type"] == "marketing_emails"
        assert consent_records[0]["status"] is True
        assert consent_records[1]["consent_type"] == "analytics"
        assert consent_records[1]["status"] is False
    
    @patch('src.core.compliance.uuid')
    def test_delete_user_data(self, mock_uuid, request_manager, mock_db):
        """Test deleting/anonymizing all user data."""
        # Arrange
        # Mock UUID generation
        mock_uuid.uuid4.return_value.hex = "abcdef1234567890"
        
        # Mock User model
        mock_user = MagicMock()
        mock_user.id = 42
        mock_user.email = "user@example.com"
        mock_user.username = "testuser"
        mock_user.full_name = "Test User"
        mock_user.is_active = True
        mock_user.deleted_at = None
        
        # Mock user query
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        # Mock ConsentManager
        mock_consent_manager = MagicMock()
        with patch('src.core.compliance.ConsentManager', return_value=mock_consent_manager):
            # Act
            success = request_manager._delete_user_data(42)
            
            # Assert
            assert success is True
            assert mock_user.is_active is False
            assert mock_user.email == "anonymized_abcdef1234567890@deleted.example.com"
            assert mock_user.username == "anonymized_abcdef1234567890"
            assert mock_user.full_name == "Anonymized User"
            assert mock_user.deleted_at is not None
            mock_consent_manager.revoke_all_user_consent.assert_called_once_with(42)
            mock_db.commit.assert_called_once()
    
    def test_delete_user_data_user_not_found(self, request_manager, mock_db):
        """Test deleting data for a non-existent user."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        success = request_manager._delete_user_data(999)
        
        # Assert
        assert success is False
        mock_db.commit.assert_not_called()