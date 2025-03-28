#!/usr/bin/env python3
"""
Create a test user in the database for testing authentication
"""

import sys
import os
import requests
import json

# Add parent directory to path to import utilities
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from scripts.utilities.logging_utils import setup_logger, log_command_execution

# Setup logger
logger = setup_logger('create_test_user')

# API Base URL
API_BASE = "http://localhost:8000/api/v1"

def register_user(email, password, full_name=None):
    """Register a new user"""
    url = f"{API_BASE}/auth/register"
    data = {
        "email": email,
        "password": password,
        "full_name": full_name or "Test User"
    }
    
    try:
        logger.info(f"Sending registration request for {email}")
        response = requests.post(url, json=data)
        
        # Log API request details
        log_command_execution(
            logger,
            f"API POST {url}",
            response.text if response.status_code == 200 else "",
            response.status_code,
            response.text if response.status_code != 200 else ""
        )
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error registering user: {e}")
        if hasattr(e, 'response') and e.response:
            logger.error(f"Response: {e.response.text}")
        return None

def login_user(email, password):
    """Login with email and password"""
    url = f"{API_BASE}/auth/login"
    data = {
        "email": email,
        "password": password
    }
    
    try:
        logger.info(f"Sending login request for {email}")
        response = requests.post(url, json=data)
        
        # Log API request details
        log_command_execution(
            logger,
            f"API POST {url}",
            response.text if response.status_code == 200 else "",
            response.status_code,
            response.text if response.status_code != 200 else ""
        )
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error logging in: {e}")
        if hasattr(e, 'response') and e.response:
            logger.error(f"Response: {e.response.text}")
        return None

def get_token_with_form(email, password):
    """Get token using form-based authentication (OAuth2 endpoint)"""
    url = f"{API_BASE}/auth/token"
    data = {
        "username": email,
        "password": password
    }
    
    try:
        logger.info(f"Requesting OAuth token for {email}")
        response = requests.post(url, data=data)
        
        # Log API request details
        log_command_execution(
            logger,
            f"API POST {url} (OAuth token)",
            response.text if response.status_code == 200 else "",
            response.status_code,
            response.text if response.status_code != 200 else ""
        )
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error getting token: {e}")
        if hasattr(e, 'response') and e.response:
            logger.error(f"Response: {e.response.text}")
        return None

def get_current_user(token):
    """Get current user using token"""
    url = f"{API_BASE}/auth/me"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        logger.info(f"Getting current user profile with token")
        # Only log first 10 characters of token for security
        masked_token = f"{token[:10]}..." if len(token) > 10 else "[token]"
        logger.info(f"Using Authorization: Bearer {masked_token}")
        
        response = requests.get(url, headers=headers)
        
        # Log API request details
        log_command_execution(
            logger,
            f"API GET {url}",
            response.text if response.status_code == 200 else "",
            response.status_code,
            response.text if response.status_code != 200 else ""
        )
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error getting current user: {e}")
        if hasattr(e, 'response') and e.response:
            logger.error(f"Response: {e.response.text}")
        return None

def main():
    # Test user credentials
    test_email = "test@example.com"
    test_password = "password123"
    test_name = "Test User"
    
    # 1. Register a new user
    logger.info(f"Registering user {test_email}...")
    register_result = register_user(test_email, test_password, test_name)
    if register_result:
        logger.info(f"User registered successfully: {json.dumps(register_result, indent=2)}")
    else:
        logger.warning("User registration failed, trying to login anyway...")
    
    # 2. Login with the user
    logger.info(f"Logging in as {test_email}...")
    login_result = login_user(test_email, test_password)
    if login_result:
        token = login_result.get("access_token")
        logger.info(f"Login successful, token: {token}")
        
        # 3. Get user info
        logger.info("Getting current user info...")
        user_info = get_current_user(token)
        if user_info:
            logger.info(f"User info: {json.dumps(user_info, indent=2)}")
        else:
            logger.error("Failed to get user info")
    else:
        logger.error("Login failed")
        
    # 4. Try token endpoint
    logger.info("Testing token endpoint...")
    token_result = get_token_with_form(test_email, test_password)
    if token_result:
        logger.info(f"Token endpoint successful: {json.dumps(token_result, indent=2)}")
    else:
        logger.error("Token endpoint failed")

if __name__ == "__main__":
    main()