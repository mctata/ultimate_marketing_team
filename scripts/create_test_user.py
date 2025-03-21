#!/usr/bin/env python3
"""
Create a test user in the database for testing authentication
"""

import sys
import os
import logging
import requests
import json

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
        response = requests.post(url, json=data)
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
        response = requests.post(url, json=data)
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
        response = requests.post(url, data=data)
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
        logger.debug(f"Calling {url} with token: {token}")
        response = requests.get(url, headers=headers)
        logger.debug(f"Response status: {response.status_code}")
        logger.debug(f"Response headers: {response.headers}")
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