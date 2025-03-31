"""
Unit tests for the Data Retention Service.

These tests validate that the DataRetentionService correctly manages retention
policies, exemptions, and applies retention rules to entities.
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from src.core.compliance import DataRetentionService
from src.models.compliance import (
    DataRetentionPolicy, DataRetentionExemption, DataRetentionExecutionLog
)


@pytest.fixture
def mock_db():
    """Mock database session."""
    db = MagicMock(spec=Session)
    
    # Set up query mock objects
    db.query.return_value = db.query
    db.query.filter.return_value = db.query
    db.query.filter_by.return_value = db.query
    db.query.all.return_value = []
    db.query.first.return_value = None
    
    return db


@pytest.fixture
def data_retention_service(mock_db):
    """Create DataRetentionService with mock db."""
    return DataRetentionService(mock_db)


@pytest.fixture
def sample_policy():
    """Create a sample retention policy."""
    return DataRetentionPolicy(
        id=1,
        entity_type="user",
        retention_period_days=730,  # 2 years
        archive_strategy="archive",
        legal_basis="GDPR Article 6",
        applies_to_deleted=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def sample_exemption():
    """Create a sample retention exemption."""
    return DataRetentionExemption(
        id=1,
        entity_type="user",
        entity_id=123,
        reason="Legal hold for ongoing investigation",
        created_by=1,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=90)
    )


class TestDataRetentionService:
    """Tests for DataRetentionService."""
    
    def test_get_policies(self, data_retention_service, mock_db, sample_policy):
        """Test fetching all retention policies."""
        # Arrange
        mock_db.query.return_value.all.return_value = [sample_policy]
        
        # Act
        policies = data_retention_service.get_policies()
        
        # Assert
        assert len(policies) == 1
        assert policies[0].entity_type == "user"
        assert policies[0].retention_period_days == 730
        mock_db.query.assert_called_once()
    
    def test_get_policy(self, data_retention_service, mock_db, sample_policy):
        """Test fetching a specific retention policy."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_policy
        
        # Act
        policy = data_retention_service.get_policy("user")
        
        # Assert
        assert policy is not None
        assert policy.entity_type == "user"
        assert policy.retention_period_days == 730
        mock_db.query.assert_called_once()
    
    def test_create_policy(self, data_retention_service, mock_db):
        """Test creating a new retention policy."""
        # Act
        policy = data_retention_service.create_policy(
            entity_type="content",
            retention_period_days=365,
            archive_strategy="delete",
            legal_basis="Business requirement",
            applies_to_deleted=True
        )
        
        # Assert
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    def test_update_policy(self, data_retention_service, mock_db, sample_policy):
        """Test updating an existing retention policy."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_policy
        
        # Act
        updated_policy = data_retention_service.update_policy(
            entity_type="user",
            retention_period_days=1095,  # 3 years
            archive_strategy="delete"
        )
        
        # Assert
        assert updated_policy is not None
        assert updated_policy.retention_period_days == 1095
        assert updated_policy.archive_strategy == "delete"
        assert updated_policy.legal_basis == "GDPR Article 6"
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    def test_update_policy_not_found(self, data_retention_service, mock_db):
        """Test updating a policy that doesn't exist."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = data_retention_service.update_policy(
            entity_type="nonexistent",
            retention_period_days=365
        )
        
        # Assert
        assert result is None
        mock_db.commit.assert_not_called()
    
    def test_delete_policy(self, data_retention_service, mock_db, sample_policy):
        """Test deleting a retention policy."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_policy
        
        # Act
        result = data_retention_service.delete_policy("user")
        
        # Assert
        assert result is True
        mock_db.delete.assert_called_once_with(sample_policy)
        mock_db.commit.assert_called_once()
    
    def test_delete_policy_not_found(self, data_retention_service, mock_db):
        """Test deleting a policy that doesn't exist."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = data_retention_service.delete_policy("nonexistent")
        
        # Assert
        assert result is False
        mock_db.delete.assert_not_called()
        mock_db.commit.assert_not_called()
    
    def test_create_exemption(self, data_retention_service, mock_db):
        """Test creating a new exemption."""
        # Act
        exemption = data_retention_service.create_exemption(
            entity_type="user",
            entity_id=456,
            reason="Legal investigation",
            created_by=1,
            expires_at=datetime.utcnow() + timedelta(days=180)
        )
        
        # Assert
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    def test_get_exemptions(self, data_retention_service, mock_db, sample_exemption):
        """Test fetching all exemptions."""
        # Arrange
        mock_db.query.return_value.all.return_value = [sample_exemption]
        
        # Act
        exemptions = data_retention_service.get_exemptions()
        
        # Assert
        assert len(exemptions) == 1
        assert exemptions[0].entity_type == "user"
        assert exemptions[0].entity_id == 123
        mock_db.query.assert_called_once()
    
    def test_get_exemptions_filtered(self, data_retention_service, mock_db, sample_exemption):
        """Test fetching exemptions filtered by entity type."""
        # Arrange
        mock_db.query.return_value.filter.return_value.all.return_value = [sample_exemption]
        
        # Act
        exemptions = data_retention_service.get_exemptions(entity_type="user")
        
        # Assert
        assert len(exemptions) == 1
        assert exemptions[0].entity_type == "user"
        assert exemptions[0].entity_id == 123
        mock_db.query.assert_called_once()
    
    def test_check_exemption_exists(self, data_retention_service, mock_db, sample_exemption):
        """Test checking if an entity has an exemption (found case)."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_exemption
        
        # Act
        exemption = data_retention_service.check_exemption("user", 123)
        
        # Assert
        assert exemption is not None
        assert exemption.entity_type == "user"
        assert exemption.entity_id == 123
    
    def test_check_exemption_not_found(self, data_retention_service, mock_db):
        """Test checking if an entity has an exemption (not found case)."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        exemption = data_retention_service.check_exemption("user", 999)
        
        # Assert
        assert exemption is None
    
    def test_delete_exemption(self, data_retention_service, mock_db, sample_exemption):
        """Test deleting an exemption."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_exemption
        
        # Act
        result = data_retention_service.delete_exemption(1)
        
        # Assert
        assert result is True
        mock_db.delete.assert_called_once_with(sample_exemption)
        mock_db.commit.assert_called_once()
    
    def test_delete_exemption_not_found(self, data_retention_service, mock_db):
        """Test deleting an exemption that doesn't exist."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = data_retention_service.delete_exemption(999)
        
        # Assert
        assert result is False
        mock_db.delete.assert_not_called()
        mock_db.commit.assert_not_called()
    
    @patch('src.core.compliance.datetime')
    def test_apply_retention_policies(self, mock_datetime, data_retention_service, mock_db, sample_policy):
        """Test applying all retention policies."""
        # Arrange
        mock_now = datetime.utcnow()
        mock_datetime.utcnow.return_value = mock_now
        
        mock_db.query.return_value.all.return_value = [sample_policy]
        
        # Mock _apply_policy with return value
        data_retention_service._apply_policy = MagicMock(return_value={
            "records_processed": 10,
            "records_archived": 5,
            "records_deleted": 5,
            "execution_time_sec": 1.5,
            "status": "success"
        })
        
        # Act
        result = data_retention_service.apply_retention_policies()
        
        # Assert
        assert result["status"] == "success"
        assert result["total_records_processed"] == 10
        assert result["total_records_archived"] == 5
        assert result["total_records_deleted"] == 5
        assert "execution_time_sec" in result
        data_retention_service._apply_policy.assert_called_once_with(sample_policy)
        mock_db.add.assert_called_once()  # For the execution log
        mock_db.commit.assert_called_once()
    
    @patch('src.core.compliance.datetime')
    def test_apply_retention_policy_specific(self, mock_datetime, data_retention_service, mock_db, sample_policy):
        """Test applying a specific retention policy."""
        # Arrange
        mock_now = datetime.utcnow()
        mock_datetime.utcnow.return_value = mock_now
        
        mock_db.query.return_value.filter.return_value.first.return_value = sample_policy
        
        # Mock _apply_policy with return value
        data_retention_service._apply_policy = MagicMock(return_value={
            "records_processed": 10,
            "records_archived": 5,
            "records_deleted": 5,
            "execution_time_sec": 1.5,
            "status": "success"
        })
        
        # Act
        result = data_retention_service.apply_retention_policies(entity_type="user")
        
        # Assert
        assert result["status"] == "success"
        assert result["total_records_processed"] == 10
        assert result["total_records_archived"] == 5
        assert result["total_records_deleted"] == 5
        assert "execution_time_sec" in result
        data_retention_service._apply_policy.assert_called_once_with(sample_policy)
        mock_db.add.assert_called_once()  # For the execution log
        mock_db.commit.assert_called_once()
    
    def test_apply_retention_policy_not_found(self, data_retention_service, mock_db):
        """Test applying a non-existent policy."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = data_retention_service.apply_retention_policies("nonexistent")
        
        # Assert
        assert result["status"] == "error"
        assert "No policy found" in result["message"]
    
    @patch('src.core.compliance.datetime')
    @patch('src.core.compliance.timedelta')
    def test_apply_policy(self, mock_timedelta, mock_datetime, data_retention_service, mock_db, sample_policy):
        """Test the _apply_policy method."""
        # This test is more complex as it interacts with entity models
        # We'll mock the necessary model classes and behavior
        
        # Arrange
        mock_now = datetime.utcnow()
        mock_datetime.utcnow.return_value = mock_now
        
        # Mock cutoff date calculation
        mock_cutoff = mock_now - timedelta(days=730)
        mock_timedelta.return_value = mock_cutoff
        
        # Mock User class with a deleted_at attribute
        mock_user_class = MagicMock()
        mock_user_class.deleted_at = MagicMock()
        
        # Mock user records
        mock_user1 = MagicMock()
        mock_user1.id = 1
        mock_user1.deleted_at = mock_now - timedelta(days=800)  # Deleted long ago
        
        mock_user2 = MagicMock()
        mock_user2.id = 2
        mock_user2.deleted_at = mock_now - timedelta(days=800)  # Deleted long ago, but has exemption
        
        # Mock _get_entity_class to return our mock User class
        data_retention_service._get_entity_class = MagicMock(return_value=mock_user_class)
        
        # Mock query for deleted users
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_user1, mock_user2]
        
        # Mock check_exemption - user1 has no exemption, user2 has exemption
        data_retention_service.check_exemption = MagicMock(side_effect=lambda entity_type, entity_id: 
            None if entity_id == 1 else sample_exemption)
        
        # Mock _archive_record
        data_retention_service._archive_record = MagicMock()
        
        # Act
        result = data_retention_service._apply_policy(sample_policy)
        
        # Assert
        assert result["status"] == "success"
        assert result["records_processed"] == 1  # Only 1 processed (other has exemption)
        assert result["records_archived"] == 1   # 1 archived
        assert result["records_deleted"] == 0    # None deleted (archive strategy)
        data_retention_service._archive_record.assert_called_once()
        mock_db.delete.assert_not_called()  # No deletion with archive strategy
        mock_db.commit.assert_called_once()
    
    def test_get_entity_class(self, data_retention_service):
        """Test the _get_entity_class method."""
        # Test with known entity types
        assert data_retention_service._get_entity_class("user") is not None
        assert data_retention_service._get_entity_class("brand") is not None
        assert data_retention_service._get_entity_class("content") is not None
        
        # Test with unknown entity type
        assert data_retention_service._get_entity_class("nonexistent") is None