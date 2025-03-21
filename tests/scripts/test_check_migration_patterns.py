"""
Unit tests for check_migration_patterns.py

These tests verify that the migration pattern checker correctly identifies
problematic SQL patterns in migration files.
"""
import os
import sys
import pytest
import tempfile
from unittest.mock import patch, MagicMock

# Add the project root to the Python path so we can import the script
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import the migration pattern checker
from scripts.check_migration_patterns import (
    check_ast_for_issues, 
    check_file_patterns, 
    generate_fix_recommendations,
    check_migration_file,
    RAW_SQL_PATTERNS
)


class TestCheckMigrationPatterns:
    """Test suite for migration pattern checker."""

    def setup_method(self):
        """Set up test fixtures."""
        # Create temporary files for testing
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = self.temp_dir.name

    def teardown_method(self):
        """Clean up test fixtures."""
        self.temp_dir.cleanup()

    def create_test_file(self, content):
        """Create a test file with the given content."""
        file_path = os.path.join(self.temp_path, "test_migration.py")
        with open(file_path, "w") as f:
            f.write(content)
        return file_path

    def test_detect_raw_sql_execution(self):
        """Test detection of raw SQL execution."""
        # Create a file with raw SQL execution
        file_content = """
        def upgrade():
            op.execute("CREATE TABLE users (id SERIAL PRIMARY KEY)")
            connection.execute("INSERT INTO users VALUES (1, 'test')")
        """
        file_path = self.create_test_file(file_content)
        
        # Check for issues
        issues = check_file_patterns(file_path)
        
        # Verify that issues were detected
        assert "raw_sql_execution" in issues
        assert len(issues["raw_sql_execution"]) == 2
        
        # Verify line numbers
        line_numbers = [line_num for line_num, _ in issues["raw_sql_execution"]]
        assert 3 in line_numbers
        assert 4 in line_numbers

    def test_detect_sql_injection_fstring(self):
        """Test detection of SQL injection via f-strings."""
        # Create a file with SQL injection vulnerability
        file_content = """
        def upgrade():
            table_name = "users"
            op.execute(f"CREATE TABLE {table_name} (id SERIAL PRIMARY KEY)")
        """
        file_path = self.create_test_file(file_content)
        
        # Check for issues
        issues = check_file_patterns(file_path)
        
        # Verify that issues were detected
        assert "raw_sql_execution" in issues
        assert len(issues["raw_sql_execution"]) == 1

    def test_detect_datetime_in_fstring(self):
        """Test detection of datetime usage in f-strings."""
        # Create a file with datetime in SQL f-string
        file_content = """
        def upgrade():
            from datetime import datetime
            now = datetime.utcnow()
            op.execute(f"INSERT INTO logs VALUES ('{now}')")
        """
        file_path = self.create_test_file(file_content)
        
        # Check for issues
        issues = check_file_patterns(file_path)
        
        # Verify that issues were detected
        assert "datetime_in_sql" in issues
        assert len(issues["datetime_in_sql"]) == 1

    def test_missing_text_import(self):
        """Test detection of missing text import."""
        # Create a file with raw SQL execution but no text import
        file_content = """
        from sqlalchemy import Column, Integer, String
        
        def upgrade():
            op.execute("CREATE TABLE users (id SERIAL PRIMARY KEY)")
        """
        file_path = self.create_test_file(file_content)
        
        # Check for issues
        issues = check_file_patterns(file_path)
        
        # Verify that issues were detected
        assert "missing_text_import" in issues
        assert "raw_sql_execution" in issues

    def test_ast_analysis_direct_string(self):
        """Test AST analysis for direct string execution."""
        # Create a file for AST analysis
        file_content = """
        from sqlalchemy import text
        
        def upgrade():
            op.execute("CREATE TABLE users (id SERIAL PRIMARY KEY)")
        """
        file_path = self.create_test_file(file_content)
        
        # Check for issues using AST
        issues = check_ast_for_issues(file_path)
        
        # Verify that issues were detected
        assert "direct_string_execution" in issues
        assert len(issues["direct_string_execution"]) == 1

    def test_ast_analysis_fstring(self):
        """Test AST analysis for f-string execution."""
        # Create a file for AST analysis
        file_content = """
        from sqlalchemy import text
        
        def upgrade():
            table_name = "users"
            op.execute(f"CREATE TABLE {table_name} (id SERIAL PRIMARY KEY)")
        """
        file_path = self.create_test_file(file_content)
        
        # Check for issues using AST
        issues = check_ast_for_issues(file_path)
        
        # Verify that issues were detected
        assert "fstring_execution" in issues
        assert len(issues["fstring_execution"]) == 1

    def test_ast_analysis_with_text_function(self):
        """Test AST analysis with proper text() function usage."""
        # Create a file with proper text() usage
        file_content = """
        from sqlalchemy import text
        
        def upgrade():
            op.execute(text("CREATE TABLE users (id SERIAL PRIMARY KEY)"))
            op.execute(text("INSERT INTO users VALUES (:id, :name)").bindparams(id=1, name="test"))
        """
        file_path = self.create_test_file(file_content)
        
        # Check for issues using AST
        issues = check_ast_for_issues(file_path)
        
        # Verify that no issues were detected for proper usage
        assert "direct_string_execution" not in issues
        assert "fstring_execution" not in issues
        assert "potential_non_text_execution" not in issues

    def test_fix_recommendations(self):
        """Test the generation of fix recommendations."""
        # Mock issues
        issues = {
            "raw_sql_execution": [
                (3, 'op.execute("CREATE TABLE users (id SERIAL PRIMARY KEY)")'),
                (4, 'connection.execute("INSERT INTO users VALUES (1, \'test\')")')
            ],
            "fstring_execution": [
                (5, 'op.execute(f"CREATE TABLE {table_name} (id SERIAL PRIMARY KEY)")')
            ],
            "missing_text_import": [
                (0, "Missing 'from sqlalchemy import text' import")
            ]
        }
        
        # Generate recommendations
        file_path = "dummy_path.py"
        recommendations = generate_fix_recommendations(file_path, issues)
        
        # Verify recommendations
        assert len(recommendations) > 0
        assert any("Add import: from sqlalchemy import text" in rec for rec in recommendations)
        assert any("Replace with:" in rec for rec in recommendations)
        assert any("Use text() with parameters instead of f-strings" in rec for rec in recommendations)

    def test_check_migration_file_integration(self):
        """Test the entire check_migration_file function."""
        # Create a file with multiple issues
        file_content = """
        def upgrade():
            op.execute("CREATE TABLE users (id SERIAL PRIMARY KEY)")
            table_name = "logs"
            op.execute(f"CREATE TABLE {table_name} (id SERIAL PRIMARY KEY, timestamp TIMESTAMP)")
        """
        file_path = self.create_test_file(file_content)
        
        # Run the comprehensive file check
        has_issues, all_issues, recommendations = check_migration_file(file_path)
        
        # Verify that issues were detected and recommendations provided
        assert has_issues
        assert len(all_issues) > 0
        assert len(recommendations) > 0


if __name__ == "__main__":
    pytest.main(["-xvs", __file__])