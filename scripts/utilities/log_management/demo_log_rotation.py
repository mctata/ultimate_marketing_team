#!/usr/bin/env python3
"""
Demo script to show log rotation features in action.
This script generates log messages to demonstrate the rotation functionality.
"""

import os
import sys
import time
import random
import string
from datetime import datetime

# Add project root to path
script_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
project_root = os.path.dirname(script_dir)
sys.path.insert(0, project_root)

from scripts.utilities.logging_utils import setup_logger

def generate_random_log_message(size=100):
    """Generate a random log message of specified size"""
    return ''.join(random.choices(string.ascii_letters + string.digits + ' ', k=size))

def main():
    """Main function to demonstrate log rotation"""
    # Set up a logger with a small max size to demonstrate rotation
    logger = setup_logger(
        "rotation_demo",
        max_size_mb=0.1,  # 100KB for quick demonstration
        backup_count=3,   # Keep 3 backup files
        include_timestamp=False  # Use a consistent filename for easier viewing
    )
    
    print(f"Log rotation demo started at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("Generating log messages to demonstrate rotation...")
    print("Check the logs directory for rotation_demo.log files")
    
    # Generate enough messages to trigger rotation several times
    count = 0
    try:
        for i in range(5000):  # Should be enough to trigger rotation
            message = f"[{i}] {generate_random_log_message(random.randint(50, 200))}"
            if i % 100 == 0:  # Every 100 messages, use a different log level
                logger.warning(message)
            elif i % 500 == 0:  # Every 500 messages, log an error
                logger.error(message)
            else:
                logger.info(message)
            
            count = i
            
            # Add a small delay to make it more observable
            if i % 1000 == 0:
                print(f"Generated {i} messages so far...")
                
            # Progress more slowly as we approach the end
            if i > 4000:
                time.sleep(0.01)
    except KeyboardInterrupt:
        print("\nDemo interrupted by user")
    
    print(f"Demo completed after generating {count+1} log messages")
    print("The following files should now exist:")
    print("- rotation_demo.log         (current log file)")
    print("- rotation_demo.log.1       (most recent backup)")
    print("- rotation_demo.log.2       (second most recent backup)")
    print("- rotation_demo.log.3       (third most recent backup)")
    
if __name__ == "__main__":
    main()