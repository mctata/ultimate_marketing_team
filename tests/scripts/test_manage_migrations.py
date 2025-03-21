"""
Unit tests for manage_migrations.py

These tests verify that the migration management script functions correctly.
"""
import os
import sys
import pytest
from unittest.mock import patch, MagicMock, call
import argparse

# Add the project root to the Python path so we can import the script
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import the migration management functions
import manage_migrations


class TestManageMigrations:
    """Test suite for migration management script."""

    @patch("manage_migrations.run_alembic_command")
    def test_create_migration(self, mock_run_alembic_command):
        """Test creating a migration."""
        # Setup mock args
        args = argparse.Namespace()
        args.message = "Test migration"
        args.autogenerate = True
        
        # Run function
        manage_migrations.create_migration(args)
        
        # Verify command ran correctly
        mock_run_alembic_command.assert_called_once_with(
            'revision --autogenerate -m "Test migration"'
        )

    @patch("manage_migrations.run_alembic_command")
    def test_upgrade_database(self, mock_run_alembic_command):
        """Test upgrading the database."""
        # Setup mock args
        args = argparse.Namespace()
        args.revision = "abcdef"
        args.skip_checks = False
        
        # Run function
        manage_migrations.upgrade_database(args)
        
        # Verify command ran correctly
        mock_run_alembic_command.assert_called_once_with(
            "upgrade abcdef", skip_checks=False
        )

    @patch("manage_migrations.run_alembic_command")
    @patch("builtins.input", return_value="y")
    def test_downgrade_database_confirmed(self, mock_input, mock_run_alembic_command):
        """Test downgrading the database with confirmation."""
        # Setup mock args
        args = argparse.Namespace()
        args.revision = "abcdef"
        args.yes = False
        
        # Run function
        manage_migrations.downgrade_database(args)
        
        # Verify command ran correctly
        mock_run_alembic_command.assert_called_once_with("downgrade abcdef")

    @patch("manage_migrations.run_alembic_command")
    @patch("builtins.input", return_value="n")
    def test_downgrade_database_rejected(self, mock_input, mock_run_alembic_command):
        """Test downgrading the database with rejection."""
        # Setup mock args
        args = argparse.Namespace()
        args.revision = "abcdef"
        args.yes = False
        
        # Run function
        manage_migrations.downgrade_database(args)
        
        # Verify command did not run
        mock_run_alembic_command.assert_not_called()

    @patch("manage_migrations.run_alembic_command")
    def test_downgrade_database_auto_yes(self, mock_run_alembic_command):
        """Test downgrading the database with auto-yes."""
        # Setup mock args
        args = argparse.Namespace()
        args.revision = "abcdef"
        args.yes = True
        
        # Run function
        manage_migrations.downgrade_database(args)
        
        # Verify command ran without input
        mock_run_alembic_command.assert_called_once_with("downgrade abcdef")

    @patch("manage_migrations.run_alembic_command")
    def test_show_history(self, mock_run_alembic_command):
        """Test showing migration history."""
        # Setup mock args
        args = argparse.Namespace()
        args.verbose = True
        
        # Run function
        manage_migrations.show_history(args)
        
        # Verify command ran correctly
        mock_run_alembic_command.assert_called_once_with("history -v")

    @patch("manage_migrations.run_alembic_command")
    def test_show_current(self, mock_run_alembic_command):
        """Test showing current migration."""
        # Setup mock args
        args = argparse.Namespace()
        args.verbose = False
        
        # Run function
        manage_migrations.show_current(args)
        
        # Verify command ran correctly
        mock_run_alembic_command.assert_called_once_with("current ")

    @patch("manage_migrations.run_pre_migration_checks")
    def test_verify_migrations_success(self, mock_run_checks):
        """Test verifying migrations."""
        # Setup mock to succeed
        mock_run_checks.return_value = True
        
        # Run function
        args = argparse.Namespace()
        result = manage_migrations.verify_migrations(args)
        
        # Verify success
        assert result is True
        mock_run_checks.assert_called_once()

    @patch("manage_migrations.run_pre_migration_checks")
    def test_verify_migrations_failure(self, mock_run_checks):
        """Test verifying migrations with failure."""
        # Setup mock to fail
        mock_run_checks.return_value = False
        
        # Run function
        args = argparse.Namespace()
        result = manage_migrations.verify_migrations(args)
        
        # Verify failure
        assert result is False
        mock_run_checks.assert_called_once()

    @patch("manage_migrations.run_pre_migration_checks")
    @patch("subprocess.run")
    def test_run_alembic_command_with_checks(self, mock_subprocess_run, mock_run_checks):
        """Test running alembic command with pre-migration checks."""
        # Setup mocks
        mock_run_checks.return_value = True
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = "Success"
        mock_result.stderr = ""
        mock_subprocess_run.return_value = mock_result
        
        # Run command
        result = manage_migrations.run_alembic_command("upgrade head")
        
        # Verify checks ran and command executed
        assert result is True
        mock_run_checks.assert_called_once()
        mock_subprocess_run.assert_called_once()

    @patch("manage_migrations.run_pre_migration_checks")
    @patch("subprocess.run")
    def test_run_alembic_command_skip_checks(self, mock_subprocess_run, mock_run_checks):
        """Test running alembic command while skipping checks."""
        # Setup mocks
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = "Success"
        mock_result.stderr = ""
        mock_subprocess_run.return_value = mock_result
        
        # Run command with skip_checks
        result = manage_migrations.run_alembic_command("upgrade head", skip_checks=True)
        
        # Verify checks did not run but command executed
        assert result is True
        mock_run_checks.assert_not_called()
        mock_subprocess_run.assert_called_once()

    @patch("manage_migrations.run_pre_migration_checks")
    def test_run_alembic_command_failed_checks(self, mock_run_checks):
        """Test running alembic command when checks fail."""
        # Setup mock to fail
        mock_run_checks.return_value = False
        
        # Run command
        result = manage_migrations.run_alembic_command("upgrade head")
        
        # Verify checks ran but command did not execute
        assert result is False
        mock_run_checks.assert_called_once()

    @patch("subprocess.run")
    def test_extract_revision_from_output(self, mock_subprocess_run):
        """Test extracting revision ID from command output."""
        # Test upgrade output
        rev = manage_migrations.extract_revision_from_output(
            "INFO  [alembic.runtime.migration] Running upgrade abc123 -> def456"
        )
        assert rev == "def456"
        
        # Test downgrade output
        rev = manage_migrations.extract_revision_from_output(
            "INFO  [alembic.runtime.migration] Running downgrade def456 -> abc123"
        )
        assert rev == "abc123"
        
        # Test revision creation output
        rev = manage_migrations.extract_revision_from_output(
            "Generating /path/to/versions/abc123_create_users.py"
        )
        assert rev == "abc123"
        
        # Test current output
        rev = manage_migrations.extract_revision_from_output(
            "Current revision(s): abc123"
        )
        assert rev == "abc123"
        
        # Test no match
        rev = manage_migrations.extract_revision_from_output(
            "Some other output"
        )
        assert rev is None

    @patch("os.path.exists")
    @patch("subprocess.check_call")
    def test_run_pre_migration_checks_success(self, mock_check_call, mock_path_exists):
        """Test running pre-migration checks successfully."""
        # Setup mocks
        mock_path_exists.return_value = True
        
        # Run function
        result = manage_migrations.run_pre_migration_checks()
        
        # Verify success
        assert result is True
        mock_check_call.assert_called_once()

    @patch("os.path.exists")
    @patch("subprocess.check_call")
    def test_run_pre_migration_checks_failure(self, mock_check_call, mock_path_exists):
        """Test running pre-migration checks with failure."""
        # Setup mocks
        mock_path_exists.return_value = True
        mock_check_call.side_effect = Exception("Test failure")
        
        # Run function
        result = manage_migrations.run_pre_migration_checks()
        
        # Verify failure
        assert result is False
        mock_check_call.assert_called_once()

    @patch("manage_migrations.get_engine")
    @patch("sqlalchemy.text")
    def test_log_migration_operation(self, mock_text, mock_get_engine):
        """Test logging migration operations."""
        # Setup mocks
        mock_conn = MagicMock()
        mock_engine = MagicMock()
        mock_engine.connect.return_value.__enter__.return_value = mock_conn
        mock_get_engine.return_value = mock_engine
        
        # Mock the table existence check to return True
        mock_conn.execute.return_value.scalar.return_value = True
        
        # Call the function
        manage_migrations.log_migration_operation(
            version="abc123",
            status="OK",
            description="upgrade head",
            error_message=None,
            duration_ms=1500
        )
        
        # Verify that the execute was called for the insert
        assert mock_conn.execute.call_count >= 2  # Once for check, once for insert
        mock_conn.commit.assert_called_once()

    @patch("manage_migrations.get_engine")
    @patch("sqlalchemy.text")
    def test_log_migration_operation_no_table(self, mock_text, mock_get_engine):
        """Test logging when migration_history table doesn't exist."""
        # Setup mocks
        mock_conn = MagicMock()
        mock_engine = MagicMock()
        mock_engine.connect.return_value.__enter__.return_value = mock_conn
        mock_get_engine.return_value = mock_engine
        
        # Mock the table existence check to return False
        mock_conn.execute.return_value.scalar.return_value = False
        
        # Call the function
        manage_migrations.log_migration_operation(
            version="abc123",
            status="OK",
            description="upgrade head",
            error_message=None,
            duration_ms=1500
        )
        
        # Verify that execute was called for check but not for insert
        assert mock_conn.execute.call_count == 1  # Only for the check
        mock_conn.commit.assert_not_called()


if __name__ == "__main__":
    pytest.main(["-xvs", __file__])