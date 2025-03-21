#!/usr/bin/env python
"""
Script to run all migration verification tests.

This script runs the unit tests for the migration verification system and
generates a report of the results.
"""

import os
import sys
import pytest
from datetime import datetime
import argparse


def run_tests(output_file=None):
    """
    Run all migration verification tests.
    
    Args:
        output_file (str): Path to file for test report output
    
    Returns:
        int: Number of test failures
    """
    # Get path to test files
    script_dir = os.path.dirname(os.path.abspath(__file__))
    test_files = [
        os.path.join(script_dir, "test_check_migration_patterns.py"),
        os.path.join(script_dir, "test_pre_migration_check.py"),
        os.path.join(script_dir, "test_manage_migrations.py")
    ]
    
    # Ensure all test files exist
    missing_files = [f for f in test_files if not os.path.exists(f)]
    if missing_files:
        print(f"ERROR: Missing test files: {missing_files}")
        return 1
    
    # Setup pytest args
    pytest_args = ["-v"]
    
    # Add output file for report if specified
    if output_file:
        pytest_args.extend(["--junitxml", output_file])
    
    # Add test files
    pytest_args.extend(test_files)
    
    # Run the tests
    print(f"Running migration verification tests at {datetime.now().isoformat()}")
    print(f"Testing files: {', '.join(os.path.basename(f) for f in test_files)}")
    
    result = pytest.main(pytest_args)
    
    # Print summary
    if result == 0:
        print("\nAll migration verification tests passed!")
    else:
        print(f"\nMigration verification tests failed with status: {result}")
    
    return result


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Run migration verification tests")
    parser.add_argument(
        "--output", "-o",
        help="Output file for test results in JUnit XML format"
    )
    parser.add_argument(
        "--notify", "-n", action="store_true",
        help="Send notification on test failures"
    )
    return parser.parse_args()


def send_notification(result):
    """
    Send notification about test results.
    
    Args:
        result (int): Test result code
    """
    try:
        # Try to import and use the notification script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(script_dir))
        notify_script = os.path.join(project_root, "scripts", "notify_deploy_status.py")
        
        if not os.path.exists(notify_script):
            print("Notification script not found, skipping notification")
            return
        
        # Add project root to path for import
        if project_root not in sys.path:
            sys.path.insert(0, project_root)
        
        # Import the notification function
        from scripts.notify_deploy_status import send_notification as notify
        
        # Set notification parameters
        status = "success" if result == 0 else "failure"
        title = (
            "Migration Verification Tests Passed" 
            if result == 0 else 
            "Migration Verification Tests Failed"
        )
        message = (
            "All migration verification tests passed successfully!" 
            if result == 0 else 
            f"Migration verification tests failed with status: {result}. Check logs for details."
        )
        
        # Send notification
        notify(
            environment="test",
            status=status,
            title=title,
            message=message
        )
        print("Notification sent")
    except Exception as e:
        print(f"Error sending notification: {e}")


def main():
    """Main function."""
    args = parse_args()
    
    # Run the tests
    result = run_tests(args.output)
    
    # Send notification if requested
    if args.notify:
        send_notification(result)
    
    return result


if __name__ == "__main__":
    sys.exit(main())