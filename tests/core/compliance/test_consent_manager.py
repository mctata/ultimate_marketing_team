"""
Unit tests for the Consent Manager.

These tests validate that the ConsentManager correctly records and verifies consent
for various purposes and data categories.
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import func, cast, JSON

from src.core.compliance import ConsentManager
from src.models.compliance import ConsentRecord


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
    db.query.distinct.return_value = db.query
    
    return db


@pytest.fixture
def consent_manager(mock_db):
    """Create ConsentManager with mock db."""
    return ConsentManager(mock_db)


@pytest.fixture
def sample_consent_record():
    """Create a sample consent record."""
    return ConsentRecord(
        id=1,
        user_id=42,
        consent_type="marketing_emails",
        status=True,
        ip_address="192.168.1.1",
        user_agent="Mozilla/5.0 (Test Browser)",
        consent_version="v1.0",
        data_categories=["email", "preferences"],
        recorded_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=365)
    )


@pytest.fixture
def sample_expired_consent_record():
    """Create a sample expired consent record."""
    return ConsentRecord(
        id=2,
        user_id=42,
        consent_type="analytics",
        status=True,
        ip_address="192.168.1.1",
        user_agent="Mozilla/5.0 (Test Browser)",
        consent_version="v1.0",
        data_categories=["behavior", "preferences"],
        recorded_at=datetime.utcnow() - timedelta(days=400),
        expires_at=datetime.utcnow() - timedelta(days=30)  # Expired
    )


class TestConsentManager:
    """Tests for ConsentManager."""
    
    def test_record_consent(self, consent_manager, mock_db):
        """Test recording a new consent."""
        # Act
        consent = consent_manager.record_consent(
            user_id=42,
            consent_type="marketing_emails",
            status=True,
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0 (Test Browser)",
            consent_version="v1.0",
            data_categories=["email", "preferences"]
        )
        
        # Assert
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
        
        # Verify audit log creation
        # The create_audit_log function should be called
        from src.core.security import create_audit_log
        # Note: This assumes create_audit_log is properly mocked in the test environment
    
    def test_check_user_consent_granted(self, consent_manager, mock_db, sample_consent_record):
        """Test checking current consent (granted case)."""
        # Arrange
        mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = sample_consent_record
        
        # Act
        has_consent = consent_manager.check_user_consent(42, "marketing_emails")
        
        # Assert
        assert has_consent is True
        mock_db.query.assert_called_once()
    
    def test_check_user_consent_not_granted(self, consent_manager, mock_db):
        """Test checking current consent (not granted case)."""
        # Arrange
        # Return a consent record with status=False
        mock_record = MagicMock()
        mock_record.status = False
        mock_record.expires_at = None
        mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = mock_record
        
        # Act
        has_consent = consent_manager.check_user_consent(42, "marketing_emails")
        
        # Assert
        assert has_consent is False
        mock_db.query.assert_called_once()
    
    def test_check_user_consent_no_record(self, consent_manager, mock_db):
        """Test checking consent when no record exists."""
        # Arrange
        mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
        
        # Act
        has_consent = consent_manager.check_user_consent(42, "marketing_emails")
        
        # Assert
        assert has_consent is False
        mock_db.query.assert_called_once()
    
    def test_check_user_consent_expired(self, consent_manager, mock_db, sample_expired_consent_record):
        """Test checking consent when the record has expired."""
        # Arrange
        mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = sample_expired_consent_record
        
        # Act
        has_consent = consent_manager.check_user_consent(42, "analytics")
        
        # Assert
        assert has_consent is False
        mock_db.query.assert_called_once()
    
    @patch('src.core.compliance.func.jsonb_exists')
    def test_check_consent_for_categories(self, mock_jsonb_exists, consent_manager, mock_db, sample_consent_record):
        """Test checking consent for specific data categories."""
        # Arrange
        mock_jsonb_exists.return_value = True
        mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = sample_consent_record
        
        # Act
        result = consent_manager.check_consent_for_categories(42, ["email", "preferences"])
        
        # Assert
        assert result["email"] is True
        assert result["preferences"] is True
        assert mock_db.query.call_count >= 1
    
    @patch('src.core.compliance.func.jsonb_exists')
    def test_check_consent_for_categories_mixed(self, mock_jsonb_exists, consent_manager, mock_db, sample_consent_record):
        """Test checking consent with mixed results for different categories."""
        # Arrange
        # First category has consent
        mock_jsonb_exists.return_value = True
        mock_db.query.return_value.filter.return_value.order_by.return_value.first.side_effect = [
            sample_consent_record,  # For email
            None                   # For location (no consent record)
        ]
        
        # Act
        result = consent_manager.check_consent_for_categories(42, ["email", "location"])
        
        # Assert
        assert result["email"] is True
        assert result["location"] is False
        assert mock_db.query.call_count >= 2
    
    @patch('src.core.compliance.func.jsonb_exists')
    def test_check_consent_for_categories_expired(self, mock_jsonb_exists, consent_manager, mock_db, sample_expired_consent_record):
        """Test checking consent for categories with expired consent."""
        # Arrange
        mock_jsonb_exists.return_value = True
        mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = sample_expired_consent_record
        
        # Act
        result = consent_manager.check_consent_for_categories(42, ["behavior"])
        
        # Assert
        assert result["behavior"] is False  # Expired consent
        assert mock_db.query.call_count >= 1
    
    def test_get_user_consent_history(self, consent_manager, mock_db, sample_consent_record):
        """Test getting a user's consent history."""
        # Arrange
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [sample_consent_record]
        
        # Act
        history = consent_manager.get_user_consent_history(42)
        
        # Assert
        assert len(history) == 1
        assert history[0]["consent_type"] == "marketing_emails"
        assert history[0]["status"] is True
        assert "recorded_at" in history[0]
        assert "expires_at" in history[0]
        mock_db.query.assert_called_once()
    
    def test_get_consent_types(self, consent_manager, mock_db):
        """Test getting all consent types used in the system."""
        # Arrange
        mock_db.query.return_value.distinct.return_value.all.return_value = [
            ("marketing_emails",), ("analytics",), ("third_party_sharing",)
        ]
        
        # Act
        consent_types = consent_manager.get_consent_types()
        
        # Assert
        assert len(consent_types) == 3
        assert "marketing_emails" in consent_types
        assert "analytics" in consent_types
        assert "third_party_sharing" in consent_types
        mock_db.query.assert_called_once()
    
    def test_revoke_all_user_consent(self, consent_manager, mock_db):
        """Test revoking all consent for a user."""
        # Arrange
        # Mock query to find existing consent types
        mock_db.query.return_value.filter.return_value.distinct.return_value.all.return_value = [
            ("marketing_emails",), ("analytics",)
        ]
        
        # Override record_consent to be a mock
        consent_manager.record_consent = MagicMock()
        
        # Act
        count = consent_manager.revoke_all_user_consent(42)
        
        # Assert
        assert count == 2
        assert consent_manager.record_consent.call_count == 2
        # Verify both consent types were revoked
        consent_manager.record_consent.assert_any_call(
            user_id=42,
            consent_type="marketing_emails",
            status=False,
            ip_address="system",
            user_agent="system",
            consent_version="revocation",
            data_categories=None
        )
        consent_manager.record_consent.assert_any_call(
            user_id=42,
            consent_type="analytics",
            status=False,
            ip_address="system",
            user_agent="system",
            consent_version="revocation",
            data_categories=None
        )