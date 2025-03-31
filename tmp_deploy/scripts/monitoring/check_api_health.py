#!/usr/bin/env python
"""
API Health Check Script

This script checks if the API service is running and responding properly.
It's used in CI/CD pipelines to verify service health after deployment.
"""

import argparse
import sys
import time
import requests
import os

# Import the logging utility
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from scripts.utilities.logging_utils import setup_logger

# Setup logger
logger = setup_logger('api_health_check')


def check_health(url, retries=5, delay=2):
    """Check if the API is healthy by polling the health endpoint.
    
    Args:
        url (str): The URL of the API health endpoint
        retries (int): Number of retry attempts
        delay (int): Delay between retries in seconds
        
    Returns:
        bool: True if healthy, False otherwise
    """
    for attempt in range(retries):
        try:
            logger.info(f"Health check attempt {attempt + 1}/{retries}...")
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Health check successful: {data}")
                return True
            else:
                logger.error(f"Health check failed with status code: {response.status_code}")
                logger.error(f"Response: {response.text}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Health check request failed: {e}")
            
        if attempt < retries - 1:
            logger.info(f"Retrying in {delay} seconds...")
            time.sleep(delay)
            
    return False


def main():
    parser = argparse.ArgumentParser(description='API Health Check')
    parser.add_argument('--url', default='http://localhost:8000/api/health',
                        help='Health check URL (default: http://localhost:8000/api/health)')
    parser.add_argument('--retries', type=int, default=5,
                        help='Number of retry attempts (default: 5)')
    parser.add_argument('--delay', type=int, default=2,
                        help='Delay between retries in seconds (default: 2)')
    
    args = parser.parse_args()
    
    logger.info(f"Checking API health at {args.url}")
    
    if check_health(args.url, args.retries, args.delay):
        logger.info("API is healthy!")
        sys.exit(0)
    else:
        logger.error("API health check failed after multiple attempts")
        sys.exit(1)


if __name__ == "__main__":
    main()