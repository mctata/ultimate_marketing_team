"""
Unit tests for pre_migration_check.py

These tests verify that the pre-migration checks correctly validate
migration files before they are applied.
"""
import os
import sys
import pytest
import tempfile
from unittest.mock import patch, MagicMock, mock_open

# Add the project root to the Python path so we can import the script
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import the pre-migration check functions
from scripts.pre_migration_check import (
    verify_migration_sequence,
    check_migration_patterns,
    create_test_database,
    simulate_migrations,
    run_command
)


class TestPreMigrationCheck:
    """Test suite for pre-migration check script."""

    def setup_method(self):
        """Set up test fixtures."""
        # Create temporary dir for test files
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = self.temp_dir.name
        
        # Create temporary migration directories
        self.migrations_dir = os.path.join(self.temp_path, "migrations")
        self.versions_dir = os.path.join(self.migrations_dir, "versions")
        os.makedirs(self.versions_dir, exist_ok=True)

    def teardown_method(self):
        """Clean up test fixtures."""
        self.temp_dir.cleanup()

    def create_migration_file(self, filename, revision, down_revision=None):
        """Create a mock migration file with specific revision info."""
        down_rev_str = f'"{down_revision}"' if down_revision else "None"
        file_content = f'''
"""Migration {filename}"""

revision = "{revision}"
down_revision = {down_rev_str}

def upgrade():
    pass

def downgrade():
    pass
'''
        file_path = os.path.join(self.versions_dir, filename)
        with open(file_path, "w") as f:
            f.write(file_content)
        return file_path

    @patch("scripts.pre_migration_check.VERSIONS_DIR")
    def test_verify_migration_sequence_valid(self, mock_versions_dir):
        """Test verifying a valid migration sequence."""
        # Setup mock migration files
        mock_versions_dir.__str__.return_value = self.versions_dir
        
        # Create a sequence of migration files
        self.create_migration_file("001_initial.py", "aaa111", None)
        self.create_migration_file("002_second.py", "bbb222", "aaa111")
        self.create_migration_file("003_third.py", "ccc333", "bbb222")
        
        # Mock VERSIONS_DIR to use our temp directory
        with patch("scripts.pre_migration_check.os.listdir", return_value=["001_initial.py", "002_second.py", "003_third.py"]):
            # Run verification
            result = verify_migration_sequence()
            
            # Verify success
            assert result is True

    @patch("scripts.pre_migration_check.VERSIONS_DIR")
    def test_verify_migration_sequence_invalid(self, mock_versions_dir):
        """Test verifying an invalid migration sequence."""
        # Setup mock migration files
        mock_versions_dir.__str__.return_value = self.versions_dir
        
        # Create a broken sequence of migration files
        self.create_migration_file("001_initial.py", "aaa111", None)
        self.create_migration_file("002_second.py", "bbb222", "aaa111")
        self.create_migration_file("003_third.py", "ccc333", "xxx999")  # Invalid down_revision
        
        # Mock VERSIONS_DIR to use our temp directory
        with patch("scripts.pre_migration_check.os.listdir", return_value=["001_initial.py", "002_second.py", "003_third.py"]):
            # Run verification
            result = verify_migration_sequence()
            
            # Verify failure
            assert result is False

    @patch("scripts.pre_migration_check.SCRIPT_DIR")
    @patch("scripts.pre_migration_check.run_command")
    def test_check_migration_patterns_success(self, mock_run_command, mock_script_dir):
        """Test migration pattern check when successful."""
        # Setup mocks
        mock_script_dir.__str__.return_value = "/mock/script/dir"
        mock_run_command.return_value = (0, "All migration files use proper SQLAlchemy patterns!", "")
        
        # Run check
        result = check_migration_patterns()
        
        # Verify success
        assert result is True
        mock_run_command.assert_called_once()

    @patch("scripts.pre_migration_check.SCRIPT_DIR")
    @patch("scripts.pre_migration_check.run_command")
    def test_check_migration_patterns_failure(self, mock_run_command, mock_script_dir):
        """Test migration pattern check when it fails."""
        # Setup mocks
        mock_script_dir.__str__.return_value = "/mock/script/dir"
        mock_run_command.return_value = (1, "Issues found in migration files", "")
        
        # Run check
        result = check_migration_patterns()
        
        # Verify failure
        assert result is False
        mock_run_command.assert_called_once()

    @patch("scripts.pre_migration_check.run_command")
    def test_run_command(self, mock_subprocess_popen):
        """Test the run_command function."""
        # Setup mock subprocess.Popen
        mock_process = MagicMock()
        mock_process.returncode = 0
        mock_process.communicate.return_value = ("stdout output", "stderr output")
        mock_subprocess_popen.return_value = mock_process
        
        # Run command
        exit_code, stdout, stderr = run_command(["test", "command"])
        
        # Verify results
        assert exit_code == 0
        assert stdout == "stdout output"
        assert stderr == "stderr output"

    @patch("os.environ")
    @patch("sqlalchemy.create_engine")
    def test_create_test_database(self, mock_create_engine, mock_environ):
        """Test creating a test database."""
        # Setup mocks
        mock_environ.get.return_value = "postgresql://user:pass@localhost:5432/dbname"
        mock_conn = MagicMock()
        mock_engine = MagicMock()
        mock_engine.connect.return_value = mock_conn
        mock_create_engine.return_value = mock_engine
        
        # Run function
        result = create_test_database()
        
        # Verify success
        assert result is True
        mock_create_engine.assert_called_once()
        assert mock_conn.execute.call_count > 0  # Should execute SQL to create DB
        assert "SQLALCHEMY_TEST_URL" in mock_environ  # Should set env var

    @patch("tempfile.NamedTemporaryFile")
    @patch("shutil.copyfile")
    @patch("os.environ")
    @patch("scripts.pre_migration_check.run_command")
    def test_simulate_migrations_success(self, mock_run_command, mock_environ, mock_copyfile, mock_temp_file):
        """Test successful migration simulation."""
        # Setup mocks
        temp_file_mock = MagicMock()
        temp_file_mock.name = "/tmp/alembic_test.ini"
        mock_temp_file.return_value.__enter__.return_value = temp_file_mock
        
        mock_environ.get.return_value = "postgresql://user:pass@localhost:5432/dbname"
        mock_environ.__contains__.return_value = True  # 'SQLALCHEMY_TEST_URL' in os.environ
        
        # Mock run_command to succeed for all alembic commands
        mock_run_command.return_value = (0, "Successfully upgraded", "")
        
        # Mock open for reading/writing config
        m = mock_open(read_data="sqlalchemy.url = postgresql://old_url")
        with patch("builtins.open", m):
            # Run function
            result = simulate_migrations()
            
            # Verify success
            assert result is True
            assert mock_run_command.call_count == 3  # upgrade, downgrade, upgrade

    @patch("tempfile.NamedTemporaryFile")
    @patch("shutil.copyfile")
    @patch("os.environ")
    @patch("scripts.pre_migration_check.run_command")
    def test_simulate_migrations_failure(self, mock_run_command, mock_environ, mock_copyfile, mock_temp_file):
        """Test failed migration simulation."""
        # Setup mocks
        temp_file_mock = MagicMock()
        temp_file_mock.name = "/tmp/alembic_test.ini"
        mock_temp_file.return_value.__enter__.return_value = temp_file_mock
        
        mock_environ.get.return_value = "postgresql://user:pass@localhost:5432/dbname"
        mock_environ.__contains__.return_value = True  # 'SQLALCHEMY_TEST_URL' in os.environ
        
        # Mock run_command to fail for upgrade command
        mock_run_command.return_value = (1, "", "Error: migration failed")
        
        # Mock open for reading/writing config
        m = mock_open(read_data="sqlalchemy.url = postgresql://old_url")
        with patch("builtins.open", m):
            # Run function
            result = simulate_migrations()
            
            # Verify failure
            assert result is False
            assert mock_run_command.call_count == 1  # Should stop after first failure


if __name__ == "__main__":
    pytest.main(["-xvs", __file__])