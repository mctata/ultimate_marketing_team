#!/usr/bin/env python3
"""
Script to create test users for development and testing purposes.
This script creates both an admin user and an editor (content creator) user.
"""

import sys
import os
import requests
import argparse
import json
from datetime import datetime

# Add project root to path to import models and utilities
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from scripts.utilities.logging_utils import setup_logger, log_command_execution, log_database_operation

try:
    from src.core.security import get_password_hash
    from sqlalchemy import create_engine, text
    from sqlalchemy.exc import SQLAlchemyError
except ImportError as e:
    print(f"Error importing required modules: {e}")
    print("Please run this script in a virtual environment with required packages installed.")
    print("Run: python -m venv venv && source venv/bin/activate && pip install -r requirements.txt")
    sys.exit(1)

# Setup logger
logger = setup_logger('create_test_users')

# Configuration
DEFAULT_API_URL = "http://localhost:8000"

def parse_args():
    parser = argparse.ArgumentParser(description="Create test users for development")
    parser.add_argument("--api", default=DEFAULT_API_URL, help=f"API URL (default: {DEFAULT_API_URL})")
    parser.add_argument("--db-url", help="Database URL (optional, direct DB access)")
    parser.add_argument("--admin-email", default="admin@example.com", help="Admin email")
    parser.add_argument("--admin-password", default="admin123", help="Admin password")
    parser.add_argument("--editor-email", default="editor@example.com", help="Editor email")
    parser.add_argument("--editor-password", default="editor123", help="Editor password")
    return parser.parse_args()

def register_user_api(api_url, email, password, username, full_name):
    """Register a user via the API"""
    url = f"{api_url}/auth/register"
    data = {
        "email": email,
        "password": password,
        "username": username,
        "full_name": full_name
    }
    
    try:
        logger.info(f"Registering user {email} via API")
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
    except requests.RequestException as e:
        logger.error(f"Failed to register user via API: {e}")
        if hasattr(e, 'response') and e.response:
            logger.error(f"Response: {e.response.text}")
        return None

def get_token(api_url, email, password):
    """Get authentication token"""
    url = f"{api_url}/auth/token"
    data = {
        "username": email,  # API expects username field but uses email
        "password": password
    }
    
    try:
        logger.info(f"Requesting authentication token for {email}")
        response = requests.post(url, data=data)
        
        # Log API request details without exposing sensitive token data
        success = response.status_code == 200
        log_command_execution(
            logger,
            f"API POST {url} (OAuth token)",
            "Token request successful" if success else "",
            response.status_code,
            response.text if not success else ""
        )
        
        response.raise_for_status()
        token = response.json().get("access_token")
        
        if token:
            # Only log first few characters of token for security
            masked_token = f"{token[:8]}..." if len(token) > 8 else "[token]"
            logger.info(f"Successfully obtained token: {masked_token}")
        
        return token
    except requests.RequestException as e:
        logger.error(f"Failed to get token: {e}")
        if hasattr(e, 'response') and e.response:
            logger.error(f"Response: {e.response.text}")
        return None

def add_user_to_role(api_url, token, user_id, role_name):
    """Add user to role via API"""
    url = f"{api_url}/auth/users/{user_id}/roles"
    headers = {"Authorization": f"Bearer {token}"}
    data = {"role_name": role_name}
    
    try:
        logger.info(f"Adding user ID {user_id} to role '{role_name}'")
        response = requests.post(url, headers=headers, json=data)
        
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
    except requests.RequestException as e:
        logger.error(f"Failed to add user to role {role_name}: {e}")
        if hasattr(e, 'response') and e.response:
            logger.error(f"Response: {e.response.text}")
        return None

def create_users_via_db(db_url, admin_email, admin_password, editor_email, editor_password):
    """Create users directly in the database"""
    try:
        logger.info(f"Connecting to database at {db_url.split('@')[-1]}")  # Only log DB host, not credentials
        engine = create_engine(db_url)
        
        # Hash passwords
        logger.info("Generating password hashes")
        admin_password_hash = get_password_hash(admin_password)
        editor_password_hash = get_password_hash(editor_password)
        
        with engine.connect() as connection:
            # Check if admin role exists
            logger.info("Checking if admin role exists")
            role_check = connection.execute(text("SELECT id FROM umt.roles WHERE name = 'admin'"))
            admin_role_id = role_check.fetchone()
            
            log_database_operation(
                logger, 
                "SELECT", 
                "roles", 
                {"name": "admin", "exists": admin_role_id is not None}
            )
            
            if not admin_role_id:
                logger.error("Admin role not found in database. Ensure the database is properly initialized.")
                return False
                
            # Check if content_creator role exists
            logger.info("Checking if content_creator role exists")
            role_check = connection.execute(text("SELECT id FROM umt.roles WHERE name = 'content_creator'"))
            content_creator_role_id = role_check.fetchone()
            
            log_database_operation(
                logger, 
                "SELECT", 
                "roles", 
                {"name": "content_creator", "exists": content_creator_role_id is not None}
            )
            
            if not content_creator_role_id:
                logger.error("Content creator role not found in database. Ensure the database is properly initialized.")
                return False
            
            # Create admin user if it doesn't exist
            logger.info(f"Checking if admin user {admin_email} exists")
            admin_check = connection.execute(text("SELECT id FROM umt.users WHERE email = :email"), {"email": admin_email})
            admin_user = admin_check.fetchone()
            
            log_database_operation(
                logger, 
                "SELECT", 
                "users", 
                {"email": admin_email, "exists": admin_user is not None}
            )
            
            if admin_user:
                admin_id = admin_user[0]
                logger.info(f"Admin user {admin_email} already exists with ID {admin_id}")
            else:
                logger.info(f"Creating new admin user: {admin_email}")
                result = connection.execute(
                    text("""
                        INSERT INTO umt.users 
                            (email, username, hashed_password, full_name, is_active, is_superuser, created_at, updated_at) 
                        VALUES 
                            (:email, :username, :password, :full_name, true, true, :timestamp, :timestamp) 
                        RETURNING id
                    """),
                    {
                        "email": admin_email,
                        "username": admin_email.split('@')[0],
                        "password": admin_password_hash,
                        "full_name": "Admin User",
                        "timestamp": datetime.now()
                    }
                )
                admin_id = result.fetchone()[0]
                
                log_database_operation(
                    logger, 
                    "INSERT", 
                    "users", 
                    {"email": admin_email, "username": admin_email.split('@')[0], "id": admin_id, "role": "admin"}
                )
                
                # Assign admin role
                logger.info(f"Assigning admin role to user {admin_email}")
                connection.execute(
                    text("INSERT INTO umt.user_roles (user_id, role_id) VALUES (:user_id, :role_id)"),
                    {"user_id": admin_id, "role_id": admin_role_id[0]}
                )
                
                log_database_operation(
                    logger, 
                    "INSERT", 
                    "user_roles", 
                    {"user_id": admin_id, "role_id": admin_role_id[0], "role_name": "admin"}
                )
            
            # Create editor user if it doesn't exist
            logger.info(f"Checking if editor user {editor_email} exists")
            editor_check = connection.execute(text("SELECT id FROM umt.users WHERE email = :email"), {"email": editor_email})
            editor_user = editor_check.fetchone()
            
            log_database_operation(
                logger, 
                "SELECT", 
                "users", 
                {"email": editor_email, "exists": editor_user is not None}
            )
            
            if editor_user:
                editor_id = editor_user[0]
                logger.info(f"Editor user {editor_email} already exists with ID {editor_id}")
            else:
                logger.info(f"Creating new editor user: {editor_email}")
                result = connection.execute(
                    text("""
                        INSERT INTO umt.users 
                            (email, username, hashed_password, full_name, is_active, is_superuser, created_at, updated_at) 
                        VALUES 
                            (:email, :username, :password, :full_name, true, false, :timestamp, :timestamp) 
                        RETURNING id
                    """),
                    {
                        "email": editor_email,
                        "username": editor_email.split('@')[0],
                        "password": editor_password_hash,
                        "full_name": "Editor User",
                        "timestamp": datetime.now()
                    }
                )
                editor_id = result.fetchone()[0]
                
                log_database_operation(
                    logger, 
                    "INSERT", 
                    "users", 
                    {"email": editor_email, "username": editor_email.split('@')[0], "id": editor_id, "role": "editor"}
                )
                
                # Assign content creator role
                logger.info(f"Assigning content_creator role to user {editor_email}")
                connection.execute(
                    text("INSERT INTO umt.user_roles (user_id, role_id) VALUES (:user_id, :role_id)"),
                    {"user_id": editor_id, "role_id": content_creator_role_id[0]}
                )
                
                log_database_operation(
                    logger, 
                    "INSERT", 
                    "user_roles", 
                    {"user_id": editor_id, "role_id": content_creator_role_id[0], "role_name": "content_creator"}
                )
                
            connection.commit()
            logger.info("Database changes committed successfully")
            return True
            
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        return False
    except Exception as e:
        logger.error(f"Error: {e}")
        return False

def main():
    args = parse_args()
    
    if args.db_url:
        logger.info("Creating test users directly in the database...")
        success = create_users_via_db(
            args.db_url, 
            args.admin_email, 
            args.admin_password,
            args.editor_email,
            args.editor_password
        )
        
        if success:
            logger.info("Successfully created test users in the database")
            print("\n==== TEST USER CREDENTIALS ====")
            print(f"Admin: {args.admin_email} / {args.admin_password}")
            print(f"Editor: {args.editor_email} / {args.editor_password}")
            print("==============================\n")
        else:
            logger.error("Failed to create test users in the database")
    else:
        logger.info("Creating test users via API...")
        
        # Register admin
        admin_username = args.admin_email.split('@')[0]
        admin_user = register_user_api(args.api, args.admin_email, args.admin_password, admin_username, "Admin User")
        
        if admin_user:
            logger.info(f"Successfully registered admin user: {args.admin_email}")
            
            # Get token for admin
            token = get_token(args.api, args.admin_email, args.admin_password)
            
            if token:
                # Add admin to admin role
                result = add_user_to_role(args.api, token, admin_user["id"], "admin")
                if result:
                    logger.info(f"Added {args.admin_email} to admin role")
                
                # Register editor
                editor_username = args.editor_email.split('@')[0]
                editor_user = register_user_api(args.api, args.editor_email, args.editor_password, editor_username, "Editor User")
                
                if editor_user:
                    logger.info(f"Successfully registered editor user: {args.editor_email}")
                    
                    # Add editor to content_creator role
                    result = add_user_to_role(args.api, token, editor_user["id"], "content_creator")
                    if result:
                        logger.info(f"Added {args.editor_email} to content_creator role")
                    
                    # Print credentials
                    print("\n==== TEST USER CREDENTIALS ====")
                    print(f"Admin: {args.admin_email} / {args.admin_password}")
                    print(f"Editor: {args.editor_email} / {args.editor_password}")
                    print("==============================\n")
                else:
                    logger.error(f"Failed to register editor user: {args.editor_email}")
            else:
                logger.error("Failed to get authentication token")
        else:
            logger.error(f"Failed to register admin user: {args.admin_email}")

if __name__ == "__main__":
    main()