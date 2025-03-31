"""
Unit tests for the Compliance Document Manager.

These tests validate that the ComplianceDocumentManager correctly manages
compliance documents such as privacy policies and terms of service.
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import desc

from src.core.compliance import ComplianceDocumentManager
from src.models.compliance import ComplianceDocument


@pytest.fixture
def mock_db():
    """Mock database session."""
    db = MagicMock(spec=Session)
    
    # Set up query mock objects
    db.query.return_value = db.query
    db.query.filter.return_value = db.query
    db.query.filter_by.return_value = db.query
    db.query.update.return_value = 1
    db.query.order_by.return_value = db.query
    db.query.all.return_value = []
    db.query.first.return_value = None
    
    return db


@pytest.fixture
def document_manager(mock_db):
    """Create ComplianceDocumentManager with mock db."""
    return ComplianceDocumentManager(mock_db)


@pytest.fixture
def sample_document():
    """Create a sample compliance document."""
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
def sample_old_document():
    """Create a sample older compliance document version."""
    return ComplianceDocument(
        id=2,
        document_type="privacy_policy",
        version="v0.9",
        content="This is our old privacy policy...",
        effective_date=datetime.utcnow() - timedelta(days=90),
        created_by=1,
        is_current=False,
        created_at=datetime.utcnow() - timedelta(days=90),
        updated_at=datetime.utcnow() - timedelta(days=90)
    )


class TestComplianceDocumentManager:
    """Tests for ComplianceDocumentManager."""
    
    def test_create_document(self, document_manager, mock_db):
        """Test creating a new compliance document."""
        # Act
        document = document_manager.create_document(
            document_type="privacy_policy",
            version="v1.0",
            content="This is a privacy policy...",
            effective_date=datetime.utcnow(),
            created_by=1,
            is_current=True
        )
        
        # Assert
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    def test_create_document_sets_current(self, document_manager, mock_db):
        """Test creating a document and setting it as current."""
        # Act
        document = document_manager.create_document(
            document_type="privacy_policy",
            version="v1.0",
            content="This is a privacy policy...",
            effective_date=datetime.utcnow(),
            created_by=1,
            is_current=True
        )
        
        # Assert
        # Verify _unset_current_document was called
        assert mock_db.query.call_count >= 2  # At least one for unset, one for add
        assert mock_db.commit.call_count >= 2  # Commit for unset and for add
    
    def test_unset_current_document(self, document_manager, mock_db):
        """Test unsetting the current flag for all documents of a type."""
        # Act
        document_manager._unset_current_document("privacy_policy")
        
        # Assert
        mock_db.query.assert_called_once()
        mock_db.query.return_value.filter.assert_called_once()
        mock_db.query.return_value.filter.return_value.update.assert_called_once_with({"is_current": False})
        mock_db.commit.assert_called_once()
    
    def test_get_document(self, document_manager, mock_db, sample_document):
        """Test fetching a document by ID."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_document
        
        # Act
        document = document_manager.get_document(1)
        
        # Assert
        assert document is not None
        assert document.id == 1
        assert document.document_type == "privacy_policy"
        assert document.version == "v1.0"
        assert document.is_current is True
        mock_db.query.assert_called_once()
    
    def test_get_current_document(self, document_manager, mock_db, sample_document):
        """Test fetching the current version of a document type."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_document
        
        # Act
        document = document_manager.get_current_document("privacy_policy")
        
        # Assert
        assert document is not None
        assert document.document_type == "privacy_policy"
        assert document.is_current is True
        mock_db.query.assert_called_once()
    
    def test_get_document_version(self, document_manager, mock_db, sample_document):
        """Test fetching a specific version of a document type."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_document
        
        # Act
        document = document_manager.get_document_version("privacy_policy", "v1.0")
        
        # Assert
        assert document is not None
        assert document.document_type == "privacy_policy"
        assert document.version == "v1.0"
        mock_db.query.assert_called_once()
    
    def test_get_document_versions(self, document_manager, mock_db, sample_document, sample_old_document):
        """Test fetching all versions of a document type."""
        # Arrange
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [
            sample_document, sample_old_document
        ]
        
        # Act
        documents = document_manager.get_document_versions("privacy_policy")
        
        # Assert
        assert len(documents) == 2
        assert documents[0].version == "v1.0"
        assert documents[1].version == "v0.9"
        mock_db.query.assert_called_once()
    
    @patch('sqlalchemy.desc')
    def test_get_document_versions_ordering(self, mock_desc, document_manager, mock_db):
        """Test that document versions are ordered by effective date descending."""
        # Act
        document_manager.get_document_versions("privacy_policy")
        
        # Assert
        # Verify ordering by effective_date descending
        mock_desc.assert_called_once()
    
    def test_set_current_document(self, document_manager, mock_db, sample_old_document):
        """Test setting a document as the current version."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_old_document
        
        # Act
        document = document_manager.set_current_document(2)
        
        # Assert
        assert document is not None
        assert document.is_current is True
        # Verify _unset_current_document was called
        assert mock_db.query.call_count >= 2  # At least one for unset, one for get
        assert mock_db.commit.call_count >= 2  # Commit for unset and for update
    
    def test_set_current_document_not_found(self, document_manager, mock_db):
        """Test setting a non-existent document as current."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        document = document_manager.set_current_document(999)
        
        # Assert
        assert document is None
        # Verify _unset_current_document was not called
        assert mock_db.query.call_count == 1  # Only for the initial get
        assert mock_db.commit.call_count == 0  # No commits