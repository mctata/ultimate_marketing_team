#!/usr/bin/env python3
"""
Unit tests for the logging utility functions.
"""

import os
import sys
import glob
import shutil
import unittest
import logging
import tempfile
from datetime import datetime
from unittest.mock import patch, MagicMock

# Add project root to path
script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
project_root = os.path.dirname(script_dir)
sys.path.insert(0, project_root)

# Import modules to test
from scripts.utilities.logging_utils import (
    setup_logger, 
    get_component_logger, 
    log_command_execution, 
    log_database_operation,
    find_log_files,
    parse_log_timestamp,
    cleanup_old_logs
)

class TestLoggingUtils(unittest.TestCase):
    """Test case for the logging utility functions."""

    def setUp(self):
        """Set up the test environment."""
        # Create a temporary directory for logs
        self.temp_dir = tempfile.mkdtemp()
        self.original_logs_dir = None
        
        # Mock the get_logs_dir function to use our temporary directory
        self.patcher = patch('scripts.utilities.logging_utils.get_logs_dir')
        self.mock_get_logs_dir = self.patcher.start()
        self.mock_get_logs_dir.return_value = self.temp_dir
    
    def tearDown(self):
        """Clean up the test environment."""
        # Stop the patcher
        self.patcher.stop()
        
        # Remove the temporary directory
        shutil.rmtree(self.temp_dir)
    
    def test_setup_logger(self):
        """Test the setup_logger function."""
        # Test basic logger setup
        logger = setup_logger("test_logger")
        
        # Verify the logger is configured correctly
        self.assertEqual(logger.name, "test_logger")
        self.assertEqual(logger.level, logging.INFO)
        
        # Verify handlers are created
        self.assertEqual(len(logger.handlers), 2)  # File and console handlers
        
        # Verify log file is created
        log_files = glob.glob(os.path.join(self.temp_dir, "test_logger_*.log"))
        self.assertEqual(len(log_files), 1)
    
    def test_log_rotation(self):
        """Test log rotation functionality."""
        # Set up a logger with a very small max size
        logger = setup_logger(
            "rotation_test",
            include_timestamp=False,  # Use consistent filename for testing
            max_size_mb=0.001,  # 1KB - very small for testing
            backup_count=2
        )
        
        # Generate enough log messages to trigger rotation
        for i in range(200):
            logger.info("X" * 100)  # Each message is about 100 bytes
        
        # Verify that rotated log files exist
        log_files = glob.glob(os.path.join(self.temp_dir, "rotation_test.log*"))
        self.assertGreaterEqual(len(log_files), 2)  # At least main log + 1 backup
    
    def test_log_command_execution(self):
        """Test the log_command_execution function."""
        # Set up a test logger with a mock
        logger = logging.getLogger("test_command_logger")
        logger.setLevel(logging.INFO)
        logger.addHandler(logging.NullHandler())
        logger.info = MagicMock()
        logger.error = MagicMock()
        
        # Test successful command
        log_command_execution(logger, "test command", "test output", 0)
        logger.info.assert_any_call("Executing command: test command")
        logger.info.assert_any_call("Command succeeded with return code: 0")
        logger.info.assert_any_call("Command output:\ntest output")
        
        # Reset mocks
        logger.info.reset_mock()
        logger.error.reset_mock()
        
        # Test failed command
        log_command_execution(logger, "test command", "test output", 1, "error output")
        logger.info.assert_any_call("Executing command: test command")
        logger.error.assert_any_call("Command failed with return code: 1")
        logger.error.assert_any_call("Error output:\nerror output")
    
    def test_log_database_operation(self):
        """Test the log_database_operation function."""
        # Set up a test logger with a mock
        logger = logging.getLogger("test_db_logger")
        logger.setLevel(logging.INFO)
        logger.addHandler(logging.NullHandler())
        logger.info = MagicMock()
        logger.error = MagicMock()
        
        # Test successful operation
        log_database_operation(
            logger, 
            "INSERT", 
            "users", 
            {"user_id": 123, "username": "test_user"}
        )
        logger.info.assert_called_once()
        
        # Reset mocks
        logger.info.reset_mock()
        logger.error.reset_mock()
        
        # Test failed operation
        log_database_operation(
            logger, 
            "INSERT", 
            "users", 
            {"user_id": 123, "error": "Duplicate key"},
            False
        )
        logger.error.assert_called_once()
    
    def test_find_log_files(self):
        """Test the find_log_files function."""
        # Create some test log files
        open(os.path.join(self.temp_dir, "test1_20230101_120000.log"), "w").close()
        open(os.path.join(self.temp_dir, "test2_20230102_120000.log"), "w").close()
        open(os.path.join(self.temp_dir, "test1_20230103_120000.log"), "w").close()
        
        # Test finding all log files
        all_logs = find_log_files()
        self.assertEqual(len(all_logs), 3)
        
        # Test finding logs for a specific component
        test1_logs = find_log_files("test1")
        self.assertEqual(len(test1_logs), 2)
    
    def test_parse_log_timestamp(self):
        """Test the parse_log_timestamp function."""
        # Test valid timestamp
        timestamp = parse_log_timestamp("test_20230101_120000.log")
        self.assertIsNotNone(timestamp)
        self.assertEqual(timestamp.year, 2023)
        self.assertEqual(timestamp.month, 1)
        self.assertEqual(timestamp.day, 1)
        self.assertEqual(timestamp.hour, 12)
        
        # Test invalid timestamp
        invalid_timestamp = parse_log_timestamp("test.log")
        self.assertIsNone(invalid_timestamp)
    
    def test_cleanup_old_logs(self):
        """Test the cleanup_old_logs function."""
        # Create test log files with dates in the filename
        past_date = "20220101_120000"  # Old date
        current_date = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Create old and new log files
        open(os.path.join(self.temp_dir, f"test1_{past_date}.log"), "w").close()
        open(os.path.join(self.temp_dir, f"test2_{past_date}.log"), "w").close()
        open(os.path.join(self.temp_dir, f"test3_{current_date}.log"), "w").close()
        
        # Clean up logs older than a year (should delete the past_date logs)
        deleted_count = cleanup_old_logs(max_age_days=365)
        
        # Verify that old logs were deleted
        self.assertEqual(deleted_count, 2)
        
        # Verify that only the new log remains
        remaining_logs = glob.glob(os.path.join(self.temp_dir, "*.log"))
        self.assertEqual(len(remaining_logs), 1)
        self.assertIn(current_date, remaining_logs[0])

if __name__ == "__main__":
    unittest.main()