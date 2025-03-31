#!/usr/bin/env python
"""
Test runner for all compliance feature tests.

This script runs all the unit and integration tests for the compliance features
implemented in the Ultimate Marketing Team platform.
"""

import sys
import os
import subprocess
import argparse


def run_unit_tests(module=None, verbose=False):
    """Run the unit tests for compliance features."""
    if module:
        test_path = f"tests/core/compliance/test_{module}.py"
    else:
        test_path = "tests/core/compliance/"

    cmd = ["python", "-m", "pytest", test_path]
    
    if verbose:
        cmd.append("-v")
    
    print(f"Running unit tests: {' '.join(cmd)}")
    subprocess.run(cmd)


def run_api_tests(verbose=False):
    """Run the API tests for compliance features."""
    cmd = ["python", "-m", "pytest", "tests/api/test_compliance_api.py"]
    
    if verbose:
        cmd.append("-v")
    
    print(f"Running API tests: {' '.join(cmd)}")
    subprocess.run(cmd)


def run_integration_tests(module=None, verbose=False):
    """Run the integration tests for compliance features."""
    if module:
        test_path = f"tests/integration/test_{module}.py"
    else:
        # Run all compliance-related integration tests
        test_modules = [
            "tests/integration/test_data_retention_workflow.py",
            "tests/integration/test_data_export.py"
        ]
        test_path = " ".join(test_modules)

    cmd = ["python", "-m", "pytest", *test_path.split()]
    
    if verbose:
        cmd.append("-v")
    
    print(f"Running integration tests: {' '.join(cmd)}")
    subprocess.run(cmd)


def run_all_tests(verbose=False):
    """Run all compliance-related tests."""
    run_unit_tests(verbose=verbose)
    run_api_tests(verbose=verbose)
    run_integration_tests(verbose=verbose)


def main():
    """Parse command line arguments and run the specified tests."""
    parser = argparse.ArgumentParser(description="Run compliance feature tests")
    
    parser.add_argument("--unit", "-u", action="store_true", 
                        help="Run unit tests for compliance features")
    parser.add_argument("--api", "-a", action="store_true", 
                        help="Run API tests for compliance features")
    parser.add_argument("--integration", "-i", action="store_true", 
                        help="Run integration tests for compliance features")
    parser.add_argument("--all", action="store_true", 
                        help="Run all tests for compliance features")
    parser.add_argument("--module", "-m", 
                        help="Run tests for a specific module (e.g., 'data_retention_service')")
    parser.add_argument("--verbose", "-v", action="store_true", 
                        help="Run tests with verbose output")
    
    args = parser.parse_args()
    
    # If no specific test type is specified, run all tests
    if not (args.unit or args.api or args.integration or args.all):
        args.all = True
    
    # Run the specified tests
    if args.all:
        run_all_tests(verbose=args.verbose)
    else:
        if args.unit:
            run_unit_tests(module=args.module, verbose=args.verbose)
        if args.api:
            run_api_tests(verbose=args.verbose)
        if args.integration:
            run_integration_tests(module=args.module, verbose=args.verbose)


if __name__ == "__main__":
    main()