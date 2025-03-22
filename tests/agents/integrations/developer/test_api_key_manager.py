"""Unit tests for the API Key Manager."""

import pytest
import time
import jwt
from unittest.mock import patch, MagicMock, call
import hashlib
import secrets

from src.agents.integrations.developer.api_key_manager import ApiKeyManager
from src.models.integration import ApiKey
from src.core.exceptions import ApiKeyError


class TestApiKeyManager:
    """Test suite for the API Key Manager."""

    @pytest.fixture
    def db_session(self):
        """Mock database session for testing."""
        session = MagicMock()
        session.query.return_value.filter.return_value.first.return_value = None
        return session

    @pytest.fixture
    def config(self):
        """Sample configuration for testing."""
        return {
            "secret_key": "test_api_key_secret",
            "hash_algorithm": "sha256",
            "rate_limit": {
                "default": 100,
                "premium": 500,
                "free": 50
            },
            "token_expiry": {
                "default": 30,  # days
                "premium": 90,  # days
                "free": 7       # days
            }
        }

    @pytest.fixture
    def api_key_manager(self, db_session, config):
        """Create an API Key Manager instance for testing."""
        return ApiKeyManager(db_session, config)
    
    @pytest.fixture
    def sample_api_key(self):
        """Sample API key for testing."""
        return ApiKey(
            id=1,
            key_id="key12345",
            key_hash="hashedkey12345",
            salt="salt12345",
            created_by="test_user",
            permissions=["read:content", "write:content"],
            tier="default",
            name="Test API Key",
            active=True,
            last_used=None,
            created_at=int(time.time()) - 86400,  # yesterday
            expires_at=int(time.time()) + 86400 * 30  # 30 days from now
        )

    def test_generate_key_pair(self, api_key_manager):
        """Test generating a key pair."""
        key_id, api_key = api_key_manager.generate_key_pair()
        
        # Check key_id format
        assert len(key_id) > 8  # reasonable minimum length
        
        # Check API key format
        assert len(api_key) > 16  # reasonable minimum length
        
        # Check that the API key includes the key_id as a prefix
        assert api_key.startswith(key_id + ".")

    @patch('src.agents.integrations.developer.api_key_manager.secrets.token_hex')
    def test_create_api_key(self, mock_token_hex, api_key_manager, db_session):
        """Test creating a new API key."""
        # Mock unique key generation
        mock_token_hex.side_effect = ["key12345", "secretpart"]
        
        # Mock hash function
        with patch.object(api_key_manager, 'hash_key', return_value=("hashedkey12345", "salt12345")):
            key_data = {
                "permissions": ["read:content", "write:content"],
                "tier": "default",
                "name": "Test API Key",
                "expires_in": 30  # days
            }
            user_id = "test_user"
            
            new_api_key = MagicMock()
            new_api_key.id = 1
            new_api_key.key_id = "key12345"
            db_session.add.return_value = None
            
            with patch('src.agents.integrations.developer.api_key_manager.ApiKey', return_value=new_api_key):
                result = api_key_manager.create_api_key(key_data, user_id)
        
        # Verify result
        assert result["success"] is True
        assert "api_key" in result
        assert result["api_key"].startswith("key12345.")
        assert "key_id" in result
        assert result["key_id"] == "key12345"
        assert "API key created successfully" in result["message"]
        
        # Verify database operations
        db_session.add.assert_called_once()
        db_session.commit.assert_called_once()

    def test_hash_key(self, api_key_manager):
        """Test hashing an API key."""
        # Use a fixed API key and salt for deterministic testing
        api_key = "test_api_key"
        salt = "test_salt"
        
        with patch('src.agents.integrations.developer.api_key_manager.secrets.token_hex', return_value=salt):
            key_hash, generated_salt = api_key_manager.hash_key(api_key)
        
        # Generate expected hash for comparison
        expected_hash = hashlib.sha256((api_key + salt).encode()).hexdigest()
        
        assert key_hash == expected_hash
        assert generated_salt == salt

    @patch('src.agents.integrations.developer.api_key_manager.time.time')
    def test_validate_api_key_success(self, mock_time, api_key_manager, db_session, sample_api_key):
        """Test validating a valid API key."""
        mock_time.return_value = sample_api_key.created_at + 86400  # 1 day after creation
        
        # Make the query return our sample API key
        db_session.query.return_value.filter.return_value.first.return_value = sample_api_key
        
        # Mock the hash validation
        with patch.object(api_key_manager, 'verify_key_hash', return_value=True):
            api_key = f"{sample_api_key.key_id}.secretpart"
            result = api_key_manager.validate_api_key(api_key)
        
        assert result["valid"] is True
        assert result["key_id"] == sample_api_key.key_id
        assert result["permissions"] == sample_api_key.permissions
        assert result["tier"] == sample_api_key.tier
        
        # Verify last_used was updated
        assert sample_api_key.last_used is not None
        db_session.commit.assert_called_once()

    @patch('src.agents.integrations.developer.api_key_manager.time.time')
    def test_validate_api_key_invalid_format(self, mock_time, api_key_manager):
        """Test validating an API key with invalid format."""
        mock_time.return_value = int(time.time())
        
        # Test with missing separator
        result = api_key_manager.validate_api_key("invalidkeyformat")
        
        assert result["valid"] is False
        assert "Invalid API key format" in result["message"]

    @patch('src.agents.integrations.developer.api_key_manager.time.time')
    def test_validate_api_key_not_found(self, mock_time, api_key_manager, db_session):
        """Test validating an API key that doesn't exist."""
        mock_time.return_value = int(time.time())
        
        # Make the query return None (key not found)
        db_session.query.return_value.filter.return_value.first.return_value = None
        
        api_key = "key12345.secretpart"
        result = api_key_manager.validate_api_key(api_key)
        
        assert result["valid"] is False
        assert "API key not found" in result["message"]

    @patch('src.agents.integrations.developer.api_key_manager.time.time')
    def test_validate_api_key_expired(self, mock_time, api_key_manager, db_session, sample_api_key):
        """Test validating an expired API key."""
        # Set current time to after expiration
        mock_time.return_value = sample_api_key.expires_at + 86400  # 1 day after expiration
        
        # Make the query return our sample API key
        db_session.query.return_value.filter.return_value.first.return_value = sample_api_key
        
        # Mock the hash validation
        with patch.object(api_key_manager, 'verify_key_hash', return_value=True):
            api_key = f"{sample_api_key.key_id}.secretpart"
            result = api_key_manager.validate_api_key(api_key)
        
        assert result["valid"] is False
        assert "API key has expired" in result["message"]
        
        # Verify last_used was NOT updated for expired key
        assert sample_api_key.last_used is None

    @patch('src.agents.integrations.developer.api_key_manager.time.time')
    def test_validate_api_key_inactive(self, mock_time, api_key_manager, db_session, sample_api_key):
        """Test validating an inactive API key."""
        mock_time.return_value = sample_api_key.created_at + 86400  # 1 day after creation
        
        # Set the key to inactive
        sample_api_key.active = False
        
        # Make the query return our sample API key
        db_session.query.return_value.filter.return_value.first.return_value = sample_api_key
        
        # Mock the hash validation
        with patch.object(api_key_manager, 'verify_key_hash', return_value=True):
            api_key = f"{sample_api_key.key_id}.secretpart"
            result = api_key_manager.validate_api_key(api_key)
        
        assert result["valid"] is False
        assert "API key is inactive" in result["message"]

    def test_verify_key_hash(self, api_key_manager):
        """Test verifying a key hash."""
        api_key = "test_api_key"
        salt = "test_salt"
        
        # Generate hash with known values
        hash_value = hashlib.sha256((api_key + salt).encode()).hexdigest()
        
        # Test with correct API key
        assert api_key_manager.verify_key_hash("test_api_key", hash_value, salt) is True
        
        # Test with incorrect API key
        assert api_key_manager.verify_key_hash("wrong_api_key", hash_value, salt) is False

    def test_deactivate_api_key(self, api_key_manager, db_session, sample_api_key):
        """Test deactivating an API key."""
        # Make the query return our sample API key
        db_session.query.return_value.filter.return_value.first.return_value = sample_api_key
        
        result = api_key_manager.deactivate_api_key("key12345", "test_user")
        
        assert result["success"] is True
        assert "API key deactivated successfully" in result["message"]
        assert sample_api_key.active is False
        db_session.commit.assert_called_once()

    def test_deactivate_api_key_not_found(self, api_key_manager, db_session):
        """Test deactivating a non-existent API key."""
        # Make the query return None (key not found)
        db_session.query.return_value.filter.return_value.first.return_value = None
        
        result = api_key_manager.deactivate_api_key("non_existent_key", "test_user")
        
        assert result["success"] is False
        assert "API key not found" in result["message"]
        db_session.commit.assert_not_called()

    def test_deactivate_api_key_unauthorized(self, api_key_manager, db_session, sample_api_key):
        """Test deactivating an API key by an unauthorized user."""
        # Make the query return our sample API key
        db_session.query.return_value.filter.return_value.first.return_value = sample_api_key
        
        result = api_key_manager.deactivate_api_key("key12345", "different_user")
        
        assert result["success"] is False
        assert "Unauthorized" in result["message"]
        assert sample_api_key.active is True  # Unchanged
        db_session.commit.assert_not_called()

    def test_get_api_keys_for_user(self, api_key_manager, db_session, sample_api_key):
        """Test retrieving API keys for a user."""
        # Make the query return a list with our sample API key
        db_session.query.return_value.filter.return_value.all.return_value = [sample_api_key]
        
        keys = api_key_manager.get_api_keys_for_user("test_user")
        
        assert len(keys) == 1
        assert keys[0].key_id == "key12345"
        assert keys[0].created_by == "test_user"
        
        # Ensure sensitive data is not returned
        assert not hasattr(keys[0], "key_hash") or keys[0].key_hash is None
        assert not hasattr(keys[0], "salt") or keys[0].salt is None

    @patch('src.agents.integrations.developer.api_key_manager.ApiKeyManager.validate_api_key')
    def test_check_permission(self, mock_validate, api_key_manager):
        """Test checking if an API key has a specific permission."""
        # Mock validation success
        mock_validate.return_value = {
            "valid": True,
            "permissions": ["read:content", "write:content"]
        }
        
        # Test with a permission the key has
        result = api_key_manager.check_permission("test_api_key", "read:content")
        assert result["has_permission"] is True
        
        # Test with a permission the key doesn't have
        result = api_key_manager.check_permission("test_api_key", "delete:content")
        assert result["has_permission"] is False

    @patch('src.agents.integrations.developer.api_key_manager.ApiKeyManager.validate_api_key')
    def test_check_permission_invalid_key(self, mock_validate, api_key_manager):
        """Test checking permissions with an invalid API key."""
        # Mock validation failure
        mock_validate.return_value = {
            "valid": False,
            "message": "API key not found"
        }
        
        result = api_key_manager.check_permission("invalid_key", "read:content")
        
        assert result["has_permission"] is False
        assert result["valid"] is False
        assert "API key not found" in result["message"]

    @patch('src.agents.integrations.developer.api_key_manager.time.time')
    def test_check_rate_limit(self, mock_time, api_key_manager, db_session, sample_api_key):
        """Test checking rate limits for an API key."""
        mock_time.return_value = int(time.time())
        
        # Make the query return our sample API key
        db_session.query.return_value.filter.return_value.first.return_value = sample_api_key
        
        # Mock redis cache for rate limiting
        mock_cache = MagicMock()
        mock_cache.get.return_value = 50  # Current request count
        api_key_manager.cache = mock_cache
        
        result = api_key_manager.check_rate_limit("key12345")
        
        assert result["allowed"] is True
        assert result["current_count"] == 50
        assert result["limit"] == 100  # default tier limit
        assert result["remaining"] == 50

    @patch('src.agents.integrations.developer.api_key_manager.time.time')
    def test_check_rate_limit_exceeded(self, mock_time, api_key_manager, db_session, sample_api_key):
        """Test checking rate limits when exceeded."""
        mock_time.return_value = int(time.time())
        
        # Make the query return our sample API key
        db_session.query.return_value.filter.return_value.first.return_value = sample_api_key
        
        # Mock redis cache for rate limiting
        mock_cache = MagicMock()
        mock_cache.get.return_value = 100  # Current request count (at limit)
        api_key_manager.cache = mock_cache
        
        result = api_key_manager.check_rate_limit("key12345")
        
        assert result["allowed"] is False
        assert result["current_count"] == 100
        assert result["limit"] == 100  # default tier limit
        assert result["remaining"] == 0

    @patch('src.agents.integrations.developer.api_key_manager.time.time')
    def test_check_rate_limit_key_not_found(self, mock_time, api_key_manager, db_session):
        """Test checking rate limits for a non-existent key."""
        mock_time.return_value = int(time.time())
        
        # Make the query return None (key not found)
        db_session.query.return_value.filter.return_value.first.return_value = None
        
        result = api_key_manager.check_rate_limit("non_existent_key")
        
        assert result["allowed"] is False
        assert "API key not found" in result["message"]

    @patch('src.agents.integrations.developer.api_key_manager.logging')
    def test_logging(self, mock_logging, api_key_manager):
        """Test that operations are properly logged."""
        # Call a method that should log
        with patch.object(api_key_manager, 'generate_key_pair', return_value=("key12345", "key12345.secretpart")):
            key_data = {
                "permissions": ["read:content"],
                "tier": "default",
                "name": "Test Key"
            }
            
            # Mock the necessary dependencies
            new_api_key = MagicMock()
            new_api_key.id = 1
            new_api_key.key_id = "key12345"
            
            with patch('src.agents.integrations.developer.api_key_manager.ApiKey', return_value=new_api_key):
                with patch.object(api_key_manager, 'hash_key', return_value=("hashedkey", "salt")):
                    api_key_manager.create_api_key(key_data, "test_user")
        
        # Verify logging occurred
        assert mock_logging.info.call_count >= 1
        assert any("API key" in str(call_args) for call_args in mock_logging.info.call_args_list)