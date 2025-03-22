"""
Integration tests for the data retention workflow.

These tests validate that the data retention policies are correctly applied to entities,
including archiving and deletion workflows.
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
import json
import os

from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from src.core.database import get_db
from src.core.compliance import DataRetentionService
from src.models.compliance import (
    DataRetentionPolicy, DataRetentionExemption, DataRetentionExecutionLog
)
from src.models.system import User


# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_data_retention.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


@pytest.fixture(scope="module")
def test_db():
    """Create a test database and provide a session."""
    # Create the test database and tables
    Base.metadata.create_all(bind=engine)
    
    # Create a session
    db = TestingSessionLocal()
    
    # Provide the session to the test
    yield db
    
    # Teardown: close the session and remove the test database
    db.close()
    os.remove("./test_data_retention.db")


@pytest.fixture
def mock_entities():
    """Create mock entity classes for testing."""
    # Mock User class for testing
    class MockUser:
        def __init__(self, id, email, deleted_at=None):
            self.id = id
            self.email = email
            self.deleted_at = deleted_at
            self.scheduled_deletion_date = None
    
    # Create a list of mock users
    users = [
        MockUser(1, "active@example.com"),  # Active user
        MockUser(2, "deleted@example.com", datetime.utcnow() - timedelta(days=400)),  # Deleted long ago
        MockUser(3, "recent@example.com", datetime.utcnow() - timedelta(days=10)),  # Recently deleted
    ]
    
    return {
        "user": users
    }


@pytest.fixture
def test_retention_policy(test_db):
    """Create a test retention policy."""
    # Create a retention policy for the User entity
    policy = DataRetentionPolicy(
        entity_type="user",
        retention_period_days=365,  # 1 year
        archive_strategy="archive",
        legal_basis="GDPR compliance",
        applies_to_deleted=True
    )
    
    test_db.add(policy)
    test_db.commit()
    
    return policy


@pytest.fixture
def test_retention_exemption(test_db, test_retention_policy):
    """Create a test retention exemption."""
    # Create an exemption for user with ID 3
    exemption = DataRetentionExemption(
        entity_type="user",
        entity_id=3,
        reason="Legal hold for investigation",
        created_by=1
    )
    
    test_db.add(exemption)
    test_db.commit()
    
    return exemption


@pytest.fixture
def retention_service(test_db):
    """Create a DataRetentionService instance with the test DB."""
    return DataRetentionService(test_db)


class TestDataRetentionWorkflow:
    """Integration tests for the data retention workflow."""
    
    @patch("src.core.compliance.DataRetentionService._get_entity_class")
    def test_data_retention_workflow(self, mock_get_entity_class, test_db, mock_entities, 
                                    test_retention_policy, test_retention_exemption, 
                                    retention_service):
        """Test the complete data retention workflow."""
        # Arrange
        # Mock _get_entity_class to return our mock User
        mock_get_entity_class.return_value = MagicMock()
        
        # Mock the query to return our mock users
        mock_query = MagicMock()
        mock_query.filter.return_value.all.return_value = mock_entities["user"]
        test_db.query = MagicMock(return_value=mock_query)
        
        # Mock the _archive_record method to avoid actual archiving
        retention_service._archive_record = MagicMock()
        
        # Act
        result = retention_service.apply_retention_policies("user")
        
        # Assert
        # Verify the overall result
        assert result["status"] == "success"
        assert "user" in result["entity_results"]
        
        # By our setup:
        # - User 1 is active, so should not be processed
        # - User 2 was deleted long ago (400 days), exceeding the 365-day retention period, so should be archived
        # - User 3 was recently deleted (10 days) but has an exemption, so should not be processed
        
        # Check that User 2 was archived (the only one that should be)
        retention_service._archive_record.assert_called_once()
        
        # Verify the execution log was created
        logs = test_db.query(DataRetentionExecutionLog).all()
        assert len(logs) > 0
        assert logs[0].entity_type == "user"
        assert logs[0].status == "success"
        
        # Clean up
        test_db.query = Session.query  # Restore original query method
    
    @patch("src.core.compliance.DataRetentionService._get_entity_class")
    def test_exemption_prevents_archiving(self, mock_get_entity_class, test_db, mock_entities, 
                                        test_retention_policy, test_retention_exemption, 
                                        retention_service):
        """Test that exemptions prevent entities from being archived/deleted."""
        # Arrange
        # Mock _get_entity_class to return our mock User
        mock_get_entity_class.return_value = MagicMock()
        
        # Create a mock user that would normally be archived (deleted 400 days ago)
        exempted_user = mock_entities["user"][1]  # User 2
        
        # Create an exemption for this user
        exemption = DataRetentionExemption(
            entity_type="user",
            entity_id=exempted_user.id,
            reason="Legal hold for specific test",
            created_by=1
        )
        test_db.add(exemption)
        test_db.commit()
        
        # Mock the query to return just this user
        mock_query = MagicMock()
        mock_query.filter.return_value.all.return_value = [exempted_user]
        test_db.query = MagicMock(return_value=mock_query)
        
        # Override check_exemption to return our exemption
        retention_service.check_exemption = MagicMock(return_value=exemption)
        
        # Mock the _archive_record method to verify it's not called
        retention_service._archive_record = MagicMock()
        
        # Act
        result = retention_service.apply_retention_policies("user")
        
        # Assert
        # Verify _archive_record was not called since user has exemption
        retention_service._archive_record.assert_not_called()
        
        # Clean up
        test_db.query = Session.query  # Restore original query method
    
    def test_create_update_delete_policy(self, test_db, retention_service):
        """Test creating, updating, and deleting a retention policy."""
        # Create a new policy
        policy = retention_service.create_policy(
            entity_type="content",
            retention_period_days=180,
            archive_strategy="delete",
            legal_basis="Business requirement"
        )
        
        # Verify the policy was created
        assert policy.id is not None
        assert policy.entity_type == "content"
        assert policy.retention_period_days == 180
        
        # Update the policy
        updated_policy = retention_service.update_policy(
            entity_type="content",
            retention_period_days=365,
            archive_strategy="archive"
        )
        
        # Verify the policy was updated
        assert updated_policy.retention_period_days == 365
        assert updated_policy.archive_strategy == "archive"
        
        # Delete the policy
        result = retention_service.delete_policy("content")
        
        # Verify the policy was deleted
        assert result is True
        assert retention_service.get_policy("content") is None
    
    def test_create_check_delete_exemption(self, test_db, test_retention_policy, retention_service):
        """Test creating, checking, and deleting a retention exemption."""
        # Create a new exemption
        exemption = retention_service.create_exemption(
            entity_type="user",
            entity_id=42,
            reason="Test exemption",
            created_by=1,
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        
        # Verify the exemption was created
        assert exemption.id is not None
        assert exemption.entity_type == "user"
        assert exemption.entity_id == 42
        
        # Check the exemption
        checked_exemption = retention_service.check_exemption("user", 42)
        
        # Verify the exemption was found
        assert checked_exemption is not None
        assert checked_exemption.id == exemption.id
        
        # Delete the exemption
        result = retention_service.delete_exemption(exemption.id)
        
        # Verify the exemption was deleted
        assert result is True
        assert retention_service.check_exemption("user", 42) is None