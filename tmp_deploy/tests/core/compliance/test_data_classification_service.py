"""
Unit tests for the Data Classification Service.

These tests validate that the DataClassificationService correctly manages
data classification levels and field-level security.
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

from sqlalchemy.orm import Session

from src.core.compliance import DataClassificationService
from src.models.compliance import DataClassification, FieldClassification


@pytest.fixture
def mock_db():
    """Mock database session."""
    db = MagicMock(spec=Session)
    
    # Set up query mock objects
    db.query.return_value = db.query
    db.query.filter.return_value = db.query
    db.query.all.return_value = []
    db.query.first.return_value = None
    
    return db


@pytest.fixture
def classification_service(mock_db):
    """Create DataClassificationService with mock db."""
    return DataClassificationService(mock_db)


@pytest.fixture
def sample_classification():
    """Create a sample data classification."""
    return DataClassification(
        id=1,
        name="restricted",
        description="Highly sensitive data",
        access_requirements="Only accessible to authorized personnel with MFA",
        encryption_required=True,
        retention_requirements="7 years, then purge",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def sample_field_classification():
    """Create a sample field classification."""
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


class TestDataClassificationService:
    """Tests for DataClassificationService."""
    
    def test_create_classification(self, classification_service, mock_db):
        """Test creating a new data classification level."""
        # Act
        classification = classification_service.create_classification(
            name="confidential",
            description="Sensitive business data",
            access_requirements="Employees only",
            encryption_required=True,
            retention_requirements="5 years"
        )
        
        # Assert
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    def test_get_classification(self, classification_service, mock_db, sample_classification):
        """Test fetching a data classification by ID."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_classification
        
        # Act
        classification = classification_service.get_classification(1)
        
        # Assert
        assert classification is not None
        assert classification.id == 1
        assert classification.name == "restricted"
        assert classification.encryption_required is True
        mock_db.query.assert_called_once()
    
    def test_get_classification_by_name(self, classification_service, mock_db, sample_classification):
        """Test fetching a data classification by name."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_classification
        
        # Act
        classification = classification_service.get_classification_by_name("restricted")
        
        # Assert
        assert classification is not None
        assert classification.id == 1
        assert classification.name == "restricted"
        assert classification.encryption_required is True
        mock_db.query.assert_called_once()
    
    def test_get_all_classifications(self, classification_service, mock_db, sample_classification):
        """Test fetching all data classifications."""
        # Arrange
        mock_db.query.return_value.all.return_value = [sample_classification]
        
        # Act
        classifications = classification_service.get_all_classifications()
        
        # Assert
        assert len(classifications) == 1
        assert classifications[0].id == 1
        assert classifications[0].name == "restricted"
        mock_db.query.assert_called_once()
    
    def test_classify_field_new(self, classification_service, mock_db, sample_classification):
        """Test classifying a database field for the first time."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            sample_classification,  # First call to check classification
            None                    # Second call to check existing field
        ]
        
        # Act
        field_classification = classification_service.classify_field(
            table_name="user",
            field_name="social_security_number",
            classification_id=1,
            is_pii=True,
            is_encrypted=True,
            mask_display=True
        )
        
        # Assert
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    def test_classify_field_update(self, classification_service, mock_db, sample_classification, sample_field_classification):
        """Test updating an existing field classification."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            sample_classification,      # First call to check classification
            sample_field_classification  # Second call to check existing field
        ]
        
        # Act
        field_classification = classification_service.classify_field(
            table_name="user",
            field_name="social_security_number",
            classification_id=1,
            is_pii=True,
            is_encrypted=False,  # Changed from True
            mask_display=True
        )
        
        # Assert
        assert field_classification is not None
        assert field_classification.is_encrypted is False  # Verify update
        mock_db.add.assert_not_called()  # Shouldn't add new record
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    def test_classify_field_invalid_classification(self, classification_service, mock_db):
        """Test classifying a field with an invalid classification ID."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = None  # Classification not found
        
        # Act & Assert
        with pytest.raises(ValueError, match="Classification with ID .* not found"):
            classification_service.classify_field(
                table_name="user",
                field_name="social_security_number",
                classification_id=999,
                is_pii=True
            )
    
    def test_get_field_classification(self, classification_service, mock_db, sample_field_classification):
        """Test getting classification for a specific field."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_field_classification
        
        # Act
        field = classification_service.get_field_classification("user", "social_security_number")
        
        # Assert
        assert field is not None
        assert field.table_name == "user"
        assert field.field_name == "social_security_number"
        assert field.classification_id == 1
        assert field.is_pii is True
        mock_db.query.assert_called_once()
    
    def test_get_table_classifications(self, classification_service, mock_db, sample_field_classification):
        """Test getting classifications for all fields in a table."""
        # Arrange
        mock_db.query.return_value.filter.return_value.all.return_value = [sample_field_classification]
        
        # Act
        fields = classification_service.get_table_classifications("user")
        
        # Assert
        assert len(fields) == 1
        assert fields[0].table_name == "user"
        assert fields[0].field_name == "social_security_number"
        mock_db.query.assert_called_once()
    
    def test_get_pii_fields(self, classification_service, mock_db, sample_field_classification):
        """Test getting all fields classified as PII."""
        # Arrange
        mock_db.query.return_value.filter.return_value.all.return_value = [sample_field_classification]
        
        # Act
        fields = classification_service.get_pii_fields()
        
        # Assert
        assert len(fields) == 1
        assert fields[0].table_name == "user"
        assert fields[0].field_name == "social_security_number"
        assert fields[0].is_pii is True
        mock_db.query.assert_called_once()
    
    def test_should_encrypt_field_true(self, classification_service, mock_db, sample_field_classification, sample_classification):
        """Test checking if a field should be encrypted (true case)."""
        # Arrange
        # First query to get field classification
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            sample_field_classification,  # Field classification
            sample_classification         # Data classification
        ]
        
        # Act
        should_encrypt = classification_service.should_encrypt_field("user", "social_security_number")
        
        # Assert
        assert should_encrypt is True
        assert mock_db.query.call_count == 2  # Two queries: field and classification
    
    def test_should_encrypt_field_false(self, classification_service, mock_db, sample_field_classification):
        """Test checking if a field should be encrypted (false case)."""
        # Arrange
        # First query to get field classification
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            sample_field_classification,  # Field classification
            MagicMock(encryption_required=False)  # Classification with encryption disabled
        ]
        
        # Act
        should_encrypt = classification_service.should_encrypt_field("user", "social_security_number")
        
        # Assert
        assert should_encrypt is False
        assert mock_db.query.call_count == 2  # Two queries: field and classification
    
    def test_should_encrypt_field_no_field(self, classification_service, mock_db):
        """Test checking encryption for a field that isn't classified."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = None  # Field not found
        
        # Act
        should_encrypt = classification_service.should_encrypt_field("user", "unknown_field")
        
        # Assert
        assert should_encrypt is False
        assert mock_db.query.call_count == 1  # Only one query for field
    
    def test_should_encrypt_field_no_classification(self, classification_service, mock_db, sample_field_classification):
        """Test checking encryption for a field with missing classification."""
        # Arrange
        # First query to get field classification
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            sample_field_classification,  # Field classification
            None                         # Classification not found
        ]
        
        # Act
        should_encrypt = classification_service.should_encrypt_field("user", "social_security_number")
        
        # Assert
        assert should_encrypt is False
        assert mock_db.query.call_count == 2  # Two queries: field and classification
    
    def test_should_mask_field_true(self, classification_service, mock_db, sample_field_classification):
        """Test checking if a field should be masked (true case)."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_field_classification
        
        # Act
        should_mask = classification_service.should_mask_field("user", "social_security_number")
        
        # Assert
        assert should_mask is True
        mock_db.query.assert_called_once()
    
    def test_should_mask_field_false(self, classification_service, mock_db):
        """Test checking if a field should be masked (false case)."""
        # Arrange
        field_no_mask = MagicMock()
        field_no_mask.mask_display = False
        mock_db.query.return_value.filter.return_value.first.return_value = field_no_mask
        
        # Act
        should_mask = classification_service.should_mask_field("user", "username")
        
        # Assert
        assert should_mask is False
        mock_db.query.assert_called_once()
    
    def test_should_mask_field_not_classified(self, classification_service, mock_db):
        """Test checking masking for a field that isn't classified."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        should_mask = classification_service.should_mask_field("user", "unknown_field")
        
        # Assert
        assert should_mask is False
        mock_db.query.assert_called_once()