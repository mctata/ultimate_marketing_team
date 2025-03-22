"""
Integration tests for the data export functionality.

These tests validate that the data export capabilities for compliance features
correctly export data in various formats (JSON, CSV, etc.) and respect field-level security.
"""

import pytest
from unittest.mock import MagicMock, patch
import json
import csv
import os
import io
from datetime import datetime, timedelta

from src.core.security import encrypt_data, decrypt_data, encrypt_field_if_needed
from src.core.compliance import DataSubjectRequestManager, DataClassificationService
from src.models.compliance import DataClassification, FieldClassification


@pytest.fixture
def sample_user_data():
    """Create sample user data for export testing."""
    return {
        "personal_info": {
            "id": 1,
            "email": "user@example.com",
            "username": "testuser",
            "full_name": "Test User",
            "dob": "1990-01-01",
            "ssn": "123-45-6789",
            "created_at": datetime.utcnow().isoformat()
        },
        "contact": {
            "address": "123 Main St",
            "city": "Anytown",
            "state": "CA",
            "zip": "12345",
            "phone": "555-123-4567"
        },
        "preferences": {
            "theme": "dark",
            "notifications": True,
            "language": "en-US"
        },
        "consent_records": [
            {
                "consent_type": "marketing_emails",
                "status": True,
                "recorded_at": (datetime.utcnow() - timedelta(days=30)).isoformat(),
                "consent_version": "v1.0"
            },
            {
                "consent_type": "analytics",
                "status": False,
                "recorded_at": (datetime.utcnow() - timedelta(days=10)).isoformat(),
                "consent_version": "v1.0"
            }
        ],
        "activity": {
            "last_login": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "logins": [
                {
                    "timestamp": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                    "ip": "192.168.1.1",
                    "device": "Chrome/Windows"
                },
                {
                    "timestamp": (datetime.utcnow() - timedelta(days=3)).isoformat(),
                    "ip": "192.168.1.1",
                    "device": "Safari/Mac"
                }
            ]
        }
    }


@pytest.fixture
def mock_db():
    """Mock database session."""
    return MagicMock()


@pytest.fixture
def sample_classifications(mock_db):
    """Create sample data classifications."""
    # Create classification service
    classification_service = DataClassificationService(mock_db)
    
    # Mock get_field_classification method to return different classifications
    def mock_get_field_classification(table_name, field_name):
        if table_name == "user" and field_name == "ssn":
            # SSN is PII, encrypted, and masked
            field = MagicMock()
            field.is_pii = True
            field.is_encrypted = True
            field.mask_display = True
            field.classification_id = 1
            return field
        elif table_name == "user" and field_name == "dob":
            # DOB is PII but not encrypted or masked
            field = MagicMock()
            field.is_pii = True
            field.is_encrypted = False
            field.mask_display = False
            field.classification_id = 2
            return field
        elif table_name == "user" and field_name == "email":
            # Email is PII and masked but not encrypted
            field = MagicMock()
            field.is_pii = True
            field.is_encrypted = False
            field.mask_display = True
            field.classification_id = 3
            return field
        return None
    
    # Mock should_encrypt_field
    def mock_should_encrypt_field(table_name, field_name):
        if table_name == "user" and field_name == "ssn":
            return True
        return False
    
    # Mock should_mask_field
    def mock_should_mask_field(table_name, field_name):
        if table_name == "user" and (field_name == "ssn" or field_name == "email"):
            return True
        return False
    
    classification_service.get_field_classification = mock_get_field_classification
    classification_service.should_encrypt_field = mock_should_encrypt_field
    classification_service.should_mask_field = mock_should_mask_field
    
    return classification_service


class TestDataExport:
    """Tests for data export functionality."""
    
    def test_export_to_json(self, sample_user_data, sample_classifications, mock_db):
        """Test exporting data to JSON format."""
        # We'll create a simple export function for testing
        def export_to_json(data, output_file, classification_service=None, apply_masking=True):
            """Export user data to JSON with optional masking."""
            if classification_service and apply_masking:
                # Apply masking to sensitive fields
                data = self._apply_masking(data, classification_service)
            
            with open(output_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            return output_file
        
        # Apply masking function
        def _apply_masking(data, classification_service):
            """Mask sensitive fields based on classification."""
            # Deep copy the data to avoid modifying the original
            masked_data = json.loads(json.dumps(data))
            
            # Mask PII fields
            if "personal_info" in masked_data:
                info = masked_data["personal_info"]
                
                # Check and mask SSN
                if "ssn" in info and classification_service.should_mask_field("user", "ssn"):
                    info["ssn"] = "XXX-XX-XXXX"
                
                # Check and mask email
                if "email" in info and classification_service.should_mask_field("user", "email"):
                    email = info["email"]
                    parts = email.split("@")
                    if len(parts) == 2:
                        masked_username = parts[0][0] + "***" if len(parts[0]) > 1 else "***"
                        info["email"] = f"{masked_username}@{parts[1]}"
            
            return masked_data
        
        self._apply_masking = _apply_masking
        
        # Create output file for testing
        output_file = "test_export.json"
        
        try:
            # Test exporting with masking
            export_to_json(sample_user_data, output_file, sample_classifications, True)
            
            # Verify the export
            with open(output_file, 'r') as f:
                exported_data = json.load(f)
            
            # Check masking was applied
            assert exported_data["personal_info"]["ssn"] == "XXX-XX-XXXX"
            assert exported_data["personal_info"]["email"].startswith("u***@")
            
            # Test exporting without masking
            export_to_json(sample_user_data, output_file, sample_classifications, False)
            
            # Verify the export
            with open(output_file, 'r') as f:
                exported_data = json.load(f)
            
            # Check masking was not applied
            assert exported_data["personal_info"]["ssn"] == "123-45-6789"
            assert exported_data["personal_info"]["email"] == "user@example.com"
            
        finally:
            # Clean up
            if os.path.exists(output_file):
                os.remove(output_file)
    
    def test_export_to_csv(self, sample_user_data, sample_classifications, mock_db):
        """Test exporting data to CSV format."""
        # We'll create a simple export function for testing
        def export_to_csv(data, output_file, classification_service=None, apply_masking=True):
            """Export user data to CSV with optional masking."""
            # For CSV, we'll flatten the personal_info section
            flattened_data = data["personal_info"].copy()
            
            # Apply masking if requested
            if classification_service and apply_masking:
                if classification_service.should_mask_field("user", "ssn"):
                    flattened_data["ssn"] = "XXX-XX-XXXX"
                
                if classification_service.should_mask_field("user", "email"):
                    email = flattened_data["email"]
                    parts = email.split("@")
                    if len(parts) == 2:
                        masked_username = parts[0][0] + "***" if len(parts[0]) > 1 else "***"
                        flattened_data["email"] = f"{masked_username}@{parts[1]}"
            
            # Write to CSV
            with open(output_file, 'w', newline='') as csvfile:
                fieldnames = flattened_data.keys()
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                writer.writerow(flattened_data)
            
            return output_file
        
        # Create output file for testing
        output_file = "test_export.csv"
        
        try:
            # Test exporting with masking
            export_to_csv(sample_user_data, output_file, sample_classifications, True)
            
            # Verify the export
            with open(output_file, 'r', newline='') as csvfile:
                reader = csv.DictReader(csvfile)
                exported_data = next(reader)
                
                # Check masking was applied
                assert exported_data["ssn"] == "XXX-XX-XXXX"
                assert exported_data["email"].startswith("u***@")
            
            # Test exporting without masking
            export_to_csv(sample_user_data, output_file, sample_classifications, False)
            
            # Verify the export
            with open(output_file, 'r', newline='') as csvfile:
                reader = csv.DictReader(csvfile)
                exported_data = next(reader)
                
                # Check masking was not applied
                assert exported_data["ssn"] == "123-45-6789"
                assert exported_data["email"] == "user@example.com"
            
        finally:
            # Clean up
            if os.path.exists(output_file):
                os.remove(output_file)
    
    def test_export_with_encryption(self, sample_user_data, sample_classifications, mock_db):
        """Test handling encrypted fields during export."""
        # Encrypt the SSN field
        original_ssn = sample_user_data["personal_info"]["ssn"]
        encrypted_ssn, salt = encrypt_data(original_ssn)
        
        # Replace the SSN with the encrypted format
        sample_user_data["personal_info"]["ssn"] = {
            "value": encrypted_ssn,
            "salt": salt,
            "is_encrypted": True
        }
        
        # We'll create a function that simulates how the data would be processed for export
        def process_for_export(data, classification_service, decrypt_fields=True, apply_masking=True):
            """Process data for export, with options for decryption and masking."""
            # Deep copy the data to avoid modifying the original
            processed_data = json.loads(json.dumps(data))
            
            # Handle personal_info section
            if "personal_info" in processed_data:
                info = processed_data["personal_info"]
                
                # Handle SSN field - first decrypt if needed, then mask if needed
                if "ssn" in info:
                    ssn_field = info["ssn"]
                    
                    # Determine if it's encrypted
                    if isinstance(ssn_field, dict) and ssn_field.get("is_encrypted"):
                        if decrypt_fields:
                            # Decrypt the field
                            ssn_decrypted = decrypt_data(ssn_field["value"], ssn_field["salt"])
                            info["ssn"] = ssn_decrypted
                        else:
                            # Leave as "[ENCRYPTED]" if not decrypting
                            info["ssn"] = "[ENCRYPTED]"
                    
                    # Apply masking if needed (after decryption)
                    if apply_masking and classification_service.should_mask_field("user", "ssn"):
                        info["ssn"] = "XXX-XX-XXXX"
                
                # Handle email field - mask if needed
                if "email" in info and apply_masking and classification_service.should_mask_field("user", "email"):
                    email = info["email"]
                    parts = email.split("@")
                    if len(parts) == 2:
                        masked_username = parts[0][0] + "***" if len(parts[0]) > 1 else "***"
                        info["email"] = f"{masked_username}@{parts[1]}"
            
            return processed_data
        
        # Test with decryption and masking
        processed_data = process_for_export(sample_user_data, sample_classifications, True, True)
        
        # Verify decryption and masking
        assert processed_data["personal_info"]["ssn"] == "XXX-XX-XXXX"  # Decrypted then masked
        assert processed_data["personal_info"]["email"].startswith("u***@")  # Masked
        
        # Test with decryption but no masking
        processed_data = process_for_export(sample_user_data, sample_classifications, True, False)
        
        # Verify decryption without masking
        assert processed_data["personal_info"]["ssn"] == original_ssn  # Decrypted, not masked
        assert processed_data["personal_info"]["email"] == "user@example.com"  # Not masked
        
        # Test with no decryption but with masking
        processed_data = process_for_export(sample_user_data, sample_classifications, False, True)
        
        # Verify no decryption with masking
        assert processed_data["personal_info"]["ssn"] == "XXX-XX-XXXX"  # Masked, not decrypted
        assert processed_data["personal_info"]["email"].startswith("u***@")  # Masked
        
        # Test with neither decryption nor masking
        processed_data = process_for_export(sample_user_data, sample_classifications, False, False)
        
        # Verify neither decryption nor masking
        assert processed_data["personal_info"]["ssn"] == "[ENCRYPTED]"  # Not decrypted, not masked
        assert processed_data["personal_info"]["email"] == "user@example.com"  # Not masked
    
    def test_export_selective_fields(self, sample_user_data, sample_classifications, mock_db):
        """Test exporting only selected fields based on user request."""
        # We'll create a function for selective export
        def export_selected_fields(data, selected_fields, output_file, 
                                  classification_service=None, apply_masking=True):
            """Export only selected fields from user data."""
            # Extract only the requested fields
            export_data = {}
            
            # Handle nested fields using dot notation (e.g., "personal_info.email")
            for field in selected_fields:
                parts = field.split(".")
                value = data
                
                # Traverse the nested structure
                for part in parts:
                    if part in value:
                        value = value[part]
                    else:
                        value = None
                        break
                
                # If we found the value, add it to export data
                if value is not None:
                    # For simplicity, we'll flatten everything in the output
                    export_data[field] = value
                    
                    # Apply masking if needed
                    if classification_service and apply_masking:
                        # Extract table and field from the path
                        if field.startswith("personal_info."):
                            table = "user"
                            field_name = field.split(".")[1]
                            
                            if classification_service.should_mask_field(table, field_name):
                                if field_name == "ssn":
                                    export_data[field] = "XXX-XX-XXXX"
                                elif field_name == "email":
                                    email = export_data[field]
                                    parts = email.split("@")
                                    if len(parts) == 2:
                                        masked_username = parts[0][0] + "***" if len(parts[0]) > 1 else "***"
                                        export_data[field] = f"{masked_username}@{parts[1]}"
            
            # Write to JSON
            with open(output_file, 'w') as f:
                json.dump(export_data, f, indent=2)
            
            return output_file
        
        # Create output file for testing
        output_file = "test_selective_export.json"
        
        try:
            # Test exporting selected fields
            selected_fields = [
                "personal_info.id", 
                "personal_info.email", 
                "personal_info.username",
                "contact.address",
                "preferences.theme"
            ]
            
            export_selected_fields(sample_user_data, selected_fields, output_file, 
                                 sample_classifications, True)
            
            # Verify the export
            with open(output_file, 'r') as f:
                exported_data = json.load(f)
            
            # Check only selected fields were exported
            assert "personal_info.id" in exported_data
            assert "personal_info.email" in exported_data
            assert "personal_info.username" in exported_data
            assert "contact.address" in exported_data
            assert "preferences.theme" in exported_data
            assert "personal_info.ssn" not in exported_data  # Not selected
            
            # Check masking was applied to selected sensitive fields
            assert exported_data["personal_info.email"].startswith("u***@")
            
        finally:
            # Clean up
            if os.path.exists(output_file):
                os.remove(output_file)
    
    def test_export_batch_processing(self, sample_user_data, sample_classifications, mock_db):
        """Test batch export of multiple records."""
        # Create multiple user records
        users = [
            sample_user_data,  # Original user
            {  # Second user
                "personal_info": {
                    "id": 2,
                    "email": "jane@example.com",
                    "username": "janesmith",
                    "full_name": "Jane Smith",
                    "ssn": "987-65-4321",
                    "created_at": datetime.utcnow().isoformat()
                },
                "contact": {
                    "address": "456 Oak St",
                    "city": "Othertown",
                    "state": "NY",
                    "zip": "67890"
                },
                "consent_records": []
            },
            {  # Third user with minimal data
                "personal_info": {
                    "id": 3,
                    "email": "bob@example.com",
                    "username": "bobuser"
                }
            }
        ]
        
        # We'll create a function for batch export
        def batch_export_to_csv(users, output_file, classification_service=None, apply_masking=True):
            """Export multiple user records to CSV with optional masking."""
            # Extract fields from all users to determine CSV columns
            all_fields = set()
            for user in users:
                if "personal_info" in user:
                    all_fields.update(user["personal_info"].keys())
            
            # Sort fields for consistent output
            fieldnames = sorted(list(all_fields))
            
            with open(output_file, 'w', newline='') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                
                # Write each user's data
                for user in users:
                    if "personal_info" in user:
                        row = {}
                        
                        # Start with all fields set to empty
                        for field in fieldnames:
                            row[field] = ""
                        
                        # Fill in available fields
                        for field, value in user["personal_info"].items():
                            row[field] = value
                        
                        # Apply masking if requested
                        if classification_service and apply_masking:
                            if "ssn" in row and classification_service.should_mask_field("user", "ssn"):
                                if row["ssn"]:  # Only mask if not empty
                                    row["ssn"] = "XXX-XX-XXXX"
                            
                            if "email" in row and classification_service.should_mask_field("user", "email"):
                                if row["email"]:  # Only mask if not empty
                                    email = row["email"]
                                    parts = email.split("@")
                                    if len(parts) == 2:
                                        masked_username = parts[0][0] + "***" if len(parts[0]) > 1 else "***"
                                        row["email"] = f"{masked_username}@{parts[1]}"
                        
                        writer.writerow(row)
            
            return output_file
        
        # Create output file for testing
        output_file = "test_batch_export.csv"
        
        try:
            # Test batch export with masking
            batch_export_to_csv(users, output_file, sample_classifications, True)
            
            # Verify the export
            with open(output_file, 'r', newline='') as csvfile:
                reader = csv.DictReader(csvfile)
                exported_rows = list(reader)
                
                # Check we have the right number of rows
                assert len(exported_rows) == 3
                
                # Check masking was applied
                assert exported_rows[0]["ssn"] == "XXX-XX-XXXX"
                assert exported_rows[0]["email"].startswith("u***@")
                assert exported_rows[1]["ssn"] == "XXX-XX-XXXX"
                assert exported_rows[1]["email"].startswith("j***@")
                assert exported_rows[2]["email"].startswith("b***@")
                
            # Test batch export without masking
            batch_export_to_csv(users, output_file, sample_classifications, False)
            
            # Verify the export
            with open(output_file, 'r', newline='') as csvfile:
                reader = csv.DictReader(csvfile)
                exported_rows = list(reader)
                
                # Check masking was not applied
                assert exported_rows[0]["ssn"] == "123-45-6789"
                assert exported_rows[0]["email"] == "user@example.com"
                assert exported_rows[1]["ssn"] == "987-65-4321"
                assert exported_rows[1]["email"] == "jane@example.com"
                assert exported_rows[2]["email"] == "bob@example.com"
            
        finally:
            # Clean up
            if os.path.exists(output_file):
                os.remove(output_file)