#!/usr/bin/env python3
"""
Direct database script to create test users without needing the API or full application running.
"""

import os
import sys
import argparse
import hashlib
import base64
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_password_hash(password: str) -> str:
    """Create password hash using simple bcrypt-like format"""
    # This is a simplified version just for testing - not for production use
    salt = os.urandom(16)
    salted = salt + password.encode('utf-8')
    hashed = hashlib.sha256(salted).digest()
    encoded = base64.b64encode(salt + hashed).decode('utf-8')
    return f"$2b${encoded}"

def create_test_users(db_url):
    """Create test admin and editor users directly in the database"""
    try:
        engine = create_engine(db_url)
        
        # Test user credentials
        admin_email = "admin@example.com"
        admin_password = "admin123"
        editor_email = "editor@example.com"
        editor_password = "editor123"
        
        # Hash passwords
        admin_password_hash = get_password_hash(admin_password)
        editor_password_hash = get_password_hash(editor_password)
        
        with engine.connect() as connection:
            # First make sure the schema exists
            connection.execute(text("CREATE SCHEMA IF NOT EXISTS umt"))
            
            # Make sure roles table exists
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS umt.roles (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) UNIQUE NOT NULL,
                    description VARCHAR(255),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Make sure users table exists
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS umt.users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    hashed_password VARCHAR(255) NOT NULL,
                    full_name VARCHAR(100),
                    is_active BOOLEAN DEFAULT TRUE,
                    is_superuser BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Make sure user_roles table exists
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS umt.user_roles (
                    user_id INTEGER REFERENCES umt.users(id) ON DELETE CASCADE,
                    role_id INTEGER REFERENCES umt.roles(id) ON DELETE CASCADE,
                    PRIMARY KEY (user_id, role_id)
                )
            """))
            
            # Insert roles if they don't exist
            connection.execute(text("""
                INSERT INTO umt.roles (name, description) 
                VALUES 
                    ('admin', 'Administrator with full access to all resources'),
                    ('brand_manager', 'Can manage brands and their projects'),
                    ('content_creator', 'Can create and edit content'),
                    ('viewer', 'Can view brands, projects, and content but not modify them')
                ON CONFLICT (name) DO NOTHING
            """))
            
            # Get admin role id
            result = connection.execute(text("SELECT id FROM umt.roles WHERE name = 'admin'"))
            admin_role_id = result.fetchone()[0]
            
            # Get content_creator role id
            result = connection.execute(text("SELECT id FROM umt.roles WHERE name = 'content_creator'"))
            content_creator_role_id = result.fetchone()[0]
            
            # Create admin user if not exists
            admin_check = connection.execute(text("SELECT id FROM umt.users WHERE email = :email"), {"email": admin_email})
            admin_user = admin_check.fetchone()
            
            if admin_user:
                admin_id = admin_user[0]
                logger.info(f"Admin user {admin_email} already exists with ID {admin_id}")
            else:
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
                        "username": "admin",
                        "password": admin_password_hash,
                        "full_name": "Admin User",
                        "timestamp": datetime.now()
                    }
                )
                admin_id = result.fetchone()[0]
                logger.info(f"Created admin user {admin_email} with ID {admin_id}")
                
                # Assign admin role
                connection.execute(
                    text("INSERT INTO umt.user_roles (user_id, role_id) VALUES (:user_id, :role_id)"),
                    {"user_id": admin_id, "role_id": admin_role_id}
                )
                logger.info(f"Assigned admin role to user {admin_email}")
            
            # Create editor user if not exists
            editor_check = connection.execute(text("SELECT id FROM umt.users WHERE email = :email"), {"email": editor_email})
            editor_user = editor_check.fetchone()
            
            if editor_user:
                editor_id = editor_user[0]
                logger.info(f"Editor user {editor_email} already exists with ID {editor_id}")
            else:
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
                        "username": "editor",
                        "password": editor_password_hash,
                        "full_name": "Editor User",
                        "timestamp": datetime.now()
                    }
                )
                editor_id = result.fetchone()[0]
                logger.info(f"Created editor user {editor_email} with ID {editor_id}")
                
                # Assign content creator role
                connection.execute(
                    text("INSERT INTO umt.user_roles (user_id, role_id) VALUES (:user_id, :role_id)"),
                    {"user_id": editor_id, "role_id": content_creator_role_id}
                )
                logger.info(f"Assigned content creator role to user {editor_email}")
            
            connection.commit()
            
            # Return credentials
            return {
                "admin": {"email": admin_email, "password": admin_password},
                "editor": {"email": editor_email, "password": editor_password}
            }
            
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        return None
    except Exception as e:
        logger.error(f"Error: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Create test users directly in the database")
    parser.add_argument("--db-url", default="postgresql://postgres:postgres@localhost:5432/ultimatemarketing", 
                        help="Database URL (default: postgresql://postgres:postgres@localhost:5432/ultimatemarketing)")
    args = parser.parse_args()
    
    logger.info("Creating test users directly in the database...")
    users = create_test_users(args.db_url)
    
    if users:
        logger.info("Successfully created test users!")
        print("\n==== TEST USER CREDENTIALS ====")
        print(f"Admin: {users['admin']['email']} / {users['admin']['password']}")
        print(f"Editor: {users['editor']['email']} / {users['editor']['password']}")
        print("==============================\n")
    else:
        logger.error("Failed to create test users")

if __name__ == "__main__":
    main()