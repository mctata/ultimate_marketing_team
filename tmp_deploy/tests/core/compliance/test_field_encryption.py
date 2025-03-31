"""
Unit tests for field-level encryption functionality.

These tests validate that the field-level encryption functions in the security module
correctly encrypt and decrypt sensitive data.
"""

import pytest
import json
from unittest.mock import MagicMock, patch
import base64
import os

from src.core.security import (
    encrypt_data, decrypt_data, encrypt_field_if_needed, decrypt_field_if_needed
)
from src.core.compliance import DataClassificationService


@pytest.fixture
def mock_db():
    """Mock database session."""
    db = MagicMock()
    return db


@pytest.fixture
def mock_classification_service():
    """Mock DataClassificationService."""
    service = MagicMock(spec=DataClassificationService)
    return service


@pytest.fixture
def sensitive_data():
    """Sample sensitive data for testing."""
    return {
        "simple_string": "sensitive personal data",
        "complex_object": {
            "name": "John Doe",
            "ssn": "123-45-6789",
            "dob": "1980-01-01"
        },
        "array_value": ["item1", "item2", "item3"]
    }


class TestFieldEncryption:
    """Tests for field-level encryption functionality."""
    
    def test_encrypt_decrypt_string(self):
        """Test encrypting and decrypting a simple string."""
        # Arrange
        original_data = "This is sensitive data"
        
        # Act
        encrypted_data, salt = encrypt_data(original_data)
        decrypted_data = decrypt_data(encrypted_data, salt)
        
        # Assert
        assert encrypted_data != original_data
        assert decrypted_data == original_data
    
    def test_encrypt_decrypt_json(self):
        """Test encrypting and decrypting a JSON object."""
        # Arrange
        original_data = {
            "name": "John Doe",
            "ssn": "123-45-6789",
            "address": {
                "street": "123 Main St",
                "city": "Anytown"
            }
        }
        
        # Act
        encrypted_data, salt = encrypt_data(original_data)
        decrypted_data = decrypt_data(encrypted_data, salt)
        
        # Assert
        assert encrypted_data != original_data
        assert encrypted_data != json.dumps(original_data)
        assert decrypted_data == original_data
    
    def test_encrypt_decrypt_list(self):
        """Test encrypting and decrypting a list."""
        # Arrange
        original_data = ["item1", "item2", {"key": "value"}]
        
        # Act
        encrypted_data, salt = encrypt_data(original_data)
        decrypted_data = decrypt_data(encrypted_data, salt)
        
        # Assert
        assert encrypted_data != original_data
        assert decrypted_data == original_data
    
    def test_encrypt_decrypt_number(self):
        """Test encrypting and decrypting a number."""
        # Arrange
        original_data = 12345
        
        # Act
        encrypted_data, salt = encrypt_data(original_data)
        decrypted_data = decrypt_data(encrypted_data, salt)
        
        # Assert
        assert encrypted_data != original_data
        assert decrypted_data == original_data
    
    def test_encrypt_decrypt_none(self):
        """Test encrypting and decrypting None value."""
        # Arrange
        original_data = None
        
        # Act
        encrypted_data, salt = encrypt_data(original_data)
        decrypted_data = decrypt_data(encrypted_data, salt)
        
        # Assert
        assert decrypted_data == original_data
    
    def test_unique_encryption_same_data(self):
        """Test that encrypting the same data twice produces different results."""
        # Arrange
        original_data = "This is sensitive data"
        
        # Act
        encrypted_data1, salt1 = encrypt_data(original_data)
        encrypted_data2, salt2 = encrypt_data(original_data)
        
        # Assert
        assert encrypted_data1 != encrypted_data2
        assert salt1 != salt2
    
    def test_encrypt_field_if_needed_should_encrypt(self, mock_db, mock_classification_service):
        """Test field encryption when the field should be encrypted."""
        # Arrange
        with patch('src.core.security.DataClassificationService', return_value=mock_classification_service):
            mock_classification_service.should_encrypt_field.return_value = True
            
            # Act
            result = encrypt_field_if_needed("user", "ssn", "123-45-6789", mock_db)
            
            # Assert
            assert result != "123-45-6789"
            assert isinstance(result, dict)
            assert "value" in result
            assert "salt" in result
            assert "is_encrypted" in result
            assert result["is_encrypted"] is True
            mock_classification_service.should_encrypt_field.assert_called_once_with("user", "ssn")
    
    def test_encrypt_field_if_needed_should_not_encrypt(self, mock_db, mock_classification_service):
        """Test field encryption when the field should not be encrypted."""
        # Arrange
        with patch('src.core.security.DataClassificationService', return_value=mock_classification_service):
            mock_classification_service.should_encrypt_field.return_value = False
            
            # Act
            result = encrypt_field_if_needed("user", "username", "johndoe", mock_db)
            
            # Assert
            assert result == "johndoe"  # Not encrypted
            mock_classification_service.should_encrypt_field.assert_called_once_with("user", "username")
    
    def test_encrypt_field_if_needed_already_encrypted(self, mock_db, mock_classification_service):
        """Test field encryption when the field is already encrypted."""
        # Arrange
        with patch('src.core.security.DataClassificationService', return_value=mock_classification_service):
            # The value is already in the encrypted format
            already_encrypted = {
                "value": "encrypted_data",
                "salt": "salt_value",
                "is_encrypted": True
            }
            
            # Act
            result = encrypt_field_if_needed("user", "ssn", already_encrypted, mock_db)
            
            # Assert
            assert result == already_encrypted  # No change
            mock_classification_service.should_encrypt_field.assert_not_called()
    
    def test_decrypt_field_if_needed_not_encrypted(self):
        """Test field decryption when the field is not encrypted."""
        # Arrange
        not_encrypted = "plain text value"
        
        # Act
        result = decrypt_field_if_needed(not_encrypted)
        
        # Assert
        assert result == not_encrypted  # No change
    
    def test_decrypt_field_if_needed_is_encrypted(self):
        """Test field decryption when the field is encrypted."""
        # Arrange
        original_value = "sensitive data"
        encrypted_data, salt = encrypt_data(original_value)
        
        encrypted_field = {
            "value": encrypted_data,
            "salt": salt,
            "is_encrypted": True
        }
        
        # Act
        result = decrypt_field_if_needed(encrypted_field)
        
        # Assert
        assert result == original_value
    
    def test_decrypt_field_if_needed_none(self):
        """Test field decryption with None value."""
        # Act
        result = decrypt_field_if_needed(None)
        
        # Assert
        assert result is None
    
    def test_encrypt_decrypt_field_complex_data(self, mock_db, mock_classification_service, sensitive_data):
        """Test full cycle of encrypting and decrypting complex field data."""
        # Arrange
        with patch('src.core.security.DataClassificationService', return_value=mock_classification_service):
            mock_classification_service.should_encrypt_field.return_value = True
            
            # Act
            encrypted = encrypt_field_if_needed("user", "profile_data", sensitive_data, mock_db)
            decrypted = decrypt_field_if_needed(encrypted)
            
            # Assert
            assert encrypted != sensitive_data
            assert encrypted["is_encrypted"] is True
            assert decrypted == sensitive_data
            mock_classification_service.should_encrypt_field.assert_called_once_with("user", "profile_data")
    
    def test_encrypt_decrypt_with_invalid_salt(self):
        """Test decryption with invalid salt."""
        # Arrange
        original_data = "sensitive data"
        encrypted_data, _ = encrypt_data(original_data)
        invalid_salt = base64.b64encode(os.urandom(16)).decode('utf-8')
        
        # Act & Assert
        with pytest.raises(Exception):
            decrypt_data(encrypted_data, invalid_salt)
    
    def test_decrypt_with_invalid_data_format(self):
        """Test decryption with invalid data format."""
        # Arrange
        invalid_encrypted_field = {
            "value": "not_valid_encrypted_data",
            "salt": "salt",
            "is_encrypted": True
        }
        
        # Act & Assert
        with pytest.raises(Exception):
            decrypt_field_if_needed(invalid_encrypted_field)
    
    def test_encrypt_field_if_needed_none_value(self, mock_db, mock_classification_service):
        """Test encrypting a None value."""
        # Arrange
        with patch('src.core.security.DataClassificationService', return_value=mock_classification_service):
            mock_classification_service.should_encrypt_field.return_value = True
            
            # Act
            result = encrypt_field_if_needed("user", "ssn", None, mock_db)
            
            # Assert
            assert result is None
            mock_classification_service.should_encrypt_field.assert_called_once_with("user", "ssn")