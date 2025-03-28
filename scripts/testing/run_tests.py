#!/usr/bin/env python3
"""
Test runner script with logging to files in logs directory.
This script runs pytest with appropriate parameters and stores logs.
"""

import argparse
import datetime
import os
import subprocess
import sys

# Ensure logs directory exists
LOGS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "logs")
os.makedirs(LOGS_DIR, exist_ok=True)

def get_timestamp():
    """Return current timestamp string in YYYYMMDD_HHMMSS format"""
    return datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

def run_tests(test_path=None, verbose=False, coverage=False, output_file=None):
    """Run pytest with specified options and log output to file"""
    
    timestamp = get_timestamp()
    log_filename = output_file or f"test_run_{timestamp}.log"
    log_path = os.path.join(LOGS_DIR, log_filename)
    
    # Build pytest command
    cmd = ["python", "-m", "pytest"]
    
    if verbose:
        cmd.append("-v")
    
    if coverage:
        cmd.extend(["--cov=src", "--cov-report=term"])
    
    if test_path:
        cmd.append(test_path)
    
    # Open log file
    with open(log_path, "w") as log_file:
        # Write header
        log_file.write(f"Test run started at {datetime.datetime.now().isoformat()}\n")
        log_file.write(f"Command: {' '.join(cmd)}\n\n")
        
        # Run pytest
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        # Capture and write output in real-time
        for line in process.stdout:
            sys.stdout.write(line)
            log_file.write(line)
        
        process.wait()
        
        # Write footer
        log_file.write(f"\nTest run completed at {datetime.datetime.now().isoformat()}\n")
        log_file.write(f"Exit code: {process.returncode}\n")
    
    print(f"\nTest log saved to: {log_path}")
    return process.returncode

def main():
    parser = argparse.ArgumentParser(description="Run tests with logging")
    parser.add_argument("test_path", nargs="?", help="Specific test path to run")
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable verbose output")
    parser.add_argument("--cov", "--coverage", action="store_true", dest="coverage", 
                      help="Run with coverage report")
    parser.add_argument("-o", "--output", help="Specify output log filename")
    
    args = parser.parse_args()
    
    return run_tests(
        test_path=args.test_path,
        verbose=args.verbose,
        coverage=args.coverage,
        output_file=args.output
    )

if __name__ == "__main__":
    sys.exit(main())