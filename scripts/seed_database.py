#!/usr/bin/env python
"""
Database Seeding Utility for Ultimate Marketing Team

This script creates seed data for development and testing environments.
It uses SQLAlchemy and the application models to populate the database with:
- Users with different roles
- Brands with social accounts
- Project types and projects
- Sample content and content drafts
- Integration configurations

Usage:
    python scripts/seed_database.py

Options:
    --truncate  Clear existing data before seeding
    --env ENV   Target environment (development, testing, demo)
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from datetime import datetime, timedelta
import random
from typing import List, Dict, Any

# Add project root to python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.orm import Session

from src.core.database import engine, SessionLocal, configure_mappers
from src.models.system import User, Role, Permission, AuditLog, Notification, UserPreference
from src.models.project import Brand, Project, ProjectType
from src.models.content import Content, ContentDraft
from src.models.integration import Integration
from src.core.security import get_password_hash

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Seed data configurations
USERS = [
    {
        "email": "admin@ultimatemarketing.com",
        "username": "admin",
        "password": "admin123",
        "full_name": "Admin User",
        "is_superuser": True,
        "roles": ["Admin"]
    },
    {
        "email": "marketer@ultimatemarketing.com",
        "username": "marketer",
        "password": "marketing123",
        "full_name": "Marketing User",
        "is_superuser": False,
        "roles": ["Marketer"]
    },
    {
        "email": "content@ultimatemarketing.com",
        "username": "content",
        "password": "content123",
        "full_name": "Content Creator",
        "is_superuser": False, 
        "roles": ["ContentCreator"]
    },
    {
        "email": "viewer@ultimatemarketing.com",
        "username": "viewer",
        "password": "viewer123",
        "full_name": "Report Viewer",
        "is_superuser": False,
        "roles": ["Viewer"]
    }
]

ROLES = [
    {
        "name": "Admin",
        "description": "Full system access with all permissions"
    },
    {
        "name": "Marketer",
        "description": "Can create and manage campaigns, view analytics"
    },
    {
        "name": "ContentCreator",
        "description": "Can create and edit content"
    },
    {
        "name": "Viewer",
        "description": "Read-only access to reports and content"
    }
]

PERMISSIONS = [
    # Brand permissions
    {"name": "brand:create", "description": "Create brands", "resource": "brand", "action": "create"},
    {"name": "brand:read", "description": "View brands", "resource": "brand", "action": "read"},
    {"name": "brand:update", "description": "Update brands", "resource": "brand", "action": "update"},
    {"name": "brand:delete", "description": "Delete brands", "resource": "brand", "action": "delete"},
    
    # Project permissions
    {"name": "project:create", "description": "Create projects", "resource": "project", "action": "create"},
    {"name": "project:read", "description": "View projects", "resource": "project", "action": "read"},
    {"name": "project:update", "description": "Update projects", "resource": "project", "action": "update"},
    {"name": "project:delete", "description": "Delete projects", "resource": "project", "action": "delete"},
    
    # Content permissions
    {"name": "content:create", "description": "Create content", "resource": "content", "action": "create"},
    {"name": "content:read", "description": "View content", "resource": "content", "action": "read"},
    {"name": "content:update", "description": "Update content", "resource": "content", "action": "update"},
    {"name": "content:delete", "description": "Delete content", "resource": "content", "action": "delete"},
    {"name": "content:publish", "description": "Publish content", "resource": "content", "action": "publish"},
    
    # Analytics permissions
    {"name": "analytics:view", "description": "View analytics", "resource": "analytics", "action": "read"},
]

BRANDS = [
    {
        "name": "TechInnovate",
        "description": "A cutting-edge technology company focused on AI solutions",
        "logo_url": "https://example.com/techinnovate_logo.png",
        "color_primary": "#4A90E2",
        "color_secondary": "#50E3C2",
        "social_accounts": [
            {"platform": "facebook", "username": "techinnovate"},
            {"platform": "twitter", "username": "techinnovate"},
            {"platform": "linkedin", "username": "techinnovate-ai"}
        ]
    },
    {
        "name": "GreenEats",
        "description": "Sustainable food delivery service with eco-friendly packaging",
        "logo_url": "https://example.com/greeneats_logo.png",
        "color_primary": "#2ECC71",
        "color_secondary": "#F1C40F",
        "social_accounts": [
            {"platform": "instagram", "username": "greeneats_official"},
            {"platform": "facebook", "username": "greeneats"},
            {"platform": "tiktok", "username": "green.eats"}
        ]
    },
    {
        "name": "FitLife",
        "description": "Fitness app and supplement brand for active lifestyles",
        "logo_url": "https://example.com/fitlife_logo.png",
        "color_primary": "#9B59B6",
        "color_secondary": "#E74C3C",
        "social_accounts": [
            {"platform": "instagram", "username": "fitlife"},
            {"platform": "youtube", "username": "FitLifeOfficial"},
            {"platform": "facebook", "username": "fitlifeapp"}
        ]
    }
]

PROJECT_TYPES = [
    {"name": "Content Marketing", "description": "Projects focused on creating and distributing content"},
    {"name": "Social Media Campaign", "description": "Campaigns specifically for social media channels"},
    {"name": "Product Launch", "description": "Marketing activities related to new product launches"},
    {"name": "Brand Awareness", "description": "Projects to increase brand recognition and visibility"},
    {"name": "Lead Generation", "description": "Campaigns aimed at generating new leads and prospects"}
]

INTEGRATION_TYPES = [
    {"type": "social", "platforms": ["facebook", "instagram", "twitter", "linkedin", "tiktok", "youtube"]},
    {"type": "cms", "platforms": ["wordpress", "contentful", "strapi", "drupal"]},
    {"type": "email", "platforms": ["mailchimp", "sendgrid", "klaviyo", "hubspot"]},
    {"type": "analytics", "platforms": ["google_analytics", "mixpanel", "amplitude", "hotjar"]},
    {"type": "advertising", "platforms": ["google_ads", "facebook_ads", "tiktok_ads", "linkedin_ads"]}
]

def truncate_tables(db: Session):
    """
    Truncate all tables in the correct order to avoid foreign key constraint issues.
    """
    logger.info("Truncating existing data...")
    
    # Drop tables in reverse dependency order
    db.execute("TRUNCATE TABLE umt.audit_logs CASCADE")
    db.execute("TRUNCATE TABLE umt.content_drafts CASCADE")
    db.execute("TRUNCATE TABLE umt.content CASCADE")
    db.execute("TRUNCATE TABLE umt.projects CASCADE")
    db.execute("TRUNCATE TABLE umt.project_types CASCADE")
    db.execute("TRUNCATE TABLE umt.social_accounts CASCADE")
    db.execute("TRUNCATE TABLE umt.integrations CASCADE")
    db.execute("TRUNCATE TABLE umt.user_preferences CASCADE")
    db.execute("TRUNCATE TABLE umt.notifications CASCADE")
    db.execute("TRUNCATE TABLE umt.role_permissions CASCADE")
    db.execute("TRUNCATE TABLE umt.user_roles CASCADE")
    db.execute("TRUNCATE TABLE umt.permissions CASCADE")
    db.execute("TRUNCATE TABLE umt.roles CASCADE")
    db.execute("TRUNCATE TABLE umt.brands CASCADE")
    db.execute("TRUNCATE TABLE umt.users CASCADE")
    
    db.commit()
    logger.info("All tables truncated successfully")

def create_roles_and_permissions(db: Session) -> Dict[str, Role]:
    """
    Create roles and permissions and return a dictionary of role objects by name.
    """
    logger.info("Creating roles and permissions...")
    
    # Create permissions
    permissions = {}
    for perm_data in PERMISSIONS:
        permission = Permission(**perm_data)
        db.add(permission)
        permissions[perm_data["name"]] = permission
    
    # Create roles
    roles = {}
    for role_data in ROLES:
        role = Role(
            name=role_data["name"],
            description=role_data["description"]
        )
        db.add(role)
        roles[role_data["name"]] = role
    
    db.commit()
    
    # Assign permissions to roles
    # Admin role gets all permissions
    admin_role = roles["Admin"]
    for perm in permissions.values():
        admin_role.permissions.append(perm)
    
    # Marketer role gets specific permissions
    marketer_role = roles["Marketer"]
    marketer_perms = ["brand:read", "project:read", "project:create", "project:update", 
                      "content:read", "content:create", "content:update", "content:publish",
                      "analytics:view"]
    for perm_name in marketer_perms:
        marketer_role.permissions.append(permissions[perm_name])
    
    # ContentCreator role gets content-related permissions
    content_role = roles["ContentCreator"]
    content_perms = ["brand:read", "project:read", "content:read", "content:create", 
                    "content:update", "content:publish"]
    for perm_name in content_perms:
        content_role.permissions.append(permissions[perm_name])
    
    # Viewer role gets read-only permissions
    viewer_role = roles["Viewer"]
    viewer_perms = ["brand:read", "project:read", "content:read", "analytics:view"]
    for perm_name in viewer_perms:
        viewer_role.permissions.append(permissions[perm_name])
    
    db.commit()
    logger.info(f"Created {len(roles)} roles and {len(permissions)} permissions")
    
    return roles

def create_users(db: Session, roles: Dict[str, Role]) -> Dict[str, User]:
    """
    Create users with roles and return a dictionary of user objects by username.
    """
    logger.info("Creating users...")
    
    users = {}
    for user_data in USERS:
        user = User(
            email=user_data["email"],
            username=user_data["username"],
            hashed_password=get_password_hash(user_data["password"]),
            full_name=user_data["full_name"],
            is_superuser=user_data["is_superuser"],
            is_active=True
        )
        
        # Assign roles
        for role_name in user_data["roles"]:
            if role_name in roles:
                user.roles.append(roles[role_name])
        
        db.add(user)
        users[user_data["username"]] = user
    
    db.commit()
    
    # Create user preferences
    for user in users.values():
        preferences = UserPreference(
            user_id=user.id,
            theme="light" if random.random() > 0.5 else "dark",
            notifications_enabled=True,
            email_frequency="daily" if random.random() > 0.3 else "weekly",
            timezone="UTC",
            language="en",
            settings={"dashboard_widgets": ["recent_activity", "content_calendar", "performance_metrics"]}
        )
        db.add(preferences)
    
    db.commit()
    logger.info(f"Created {len(users)} users with preferences")
    
    return users

def create_brands(db: Session, admin_user: User) -> Dict[str, Brand]:
    """
    Create brands with social accounts and return a dictionary of brand objects by name.
    """
    logger.info("Creating brands...")
    
    brands = {}
    for brand_data in BRANDS:
        social_accounts = brand_data.pop("social_accounts", [])
        
        brand = Brand(
            name=brand_data["name"],
            description=brand_data["description"],
            logo_url=brand_data["logo_url"],
            color_primary=brand_data["color_primary"],
            color_secondary=brand_data["color_secondary"],
            created_by=admin_user.id
        )
        db.add(brand)
        db.flush()  # Get the brand ID
        
        # Create social accounts for the brand
        for account in social_accounts:
            social = {
                "brand_id": brand.id,
                "platform": account["platform"],
                "username": account["username"],
                "access_token": f"sample_token_{account['platform']}_{brand.id}",
                "refresh_token": f"sample_refresh_{account['platform']}_{brand.id}",
                "token_expires_at": datetime.now() + timedelta(days=30)
            }
            db.execute(
                """
                INSERT INTO umt.social_accounts 
                (brand_id, platform, username, access_token, refresh_token, token_expires_at, created_at, updated_at)
                VALUES (:brand_id, :platform, :username, :access_token, :refresh_token, :token_expires_at, now(), now())
                """,
                social
            )
        
        brands[brand_data["name"]] = brand
    
    db.commit()
    logger.info(f"Created {len(brands)} brands with social accounts")
    
    return brands

def create_project_types(db: Session) -> Dict[str, int]:
    """
    Create project types and return a dictionary mapping project type names to IDs.
    """
    logger.info("Creating project types...")
    
    project_types = {}
    for pt_data in PROJECT_TYPES:
        pt = ProjectType(
            name=pt_data["name"],
            description=pt_data["description"]
        )
        db.add(pt)
        db.flush()
        project_types[pt_data["name"]] = pt.id
    
    db.commit()
    logger.info(f"Created {len(project_types)} project types")
    
    return project_types

def create_projects(db: Session, brands: Dict[str, Brand], project_types: Dict[str, int], users: Dict[str, User]) -> List[Project]:
    """
    Create projects for brands and return a list of created projects.
    """
    logger.info("Creating projects...")
    
    projects = []
    admin_user = users["admin"]
    content_user = users["content"]
    
    # Project ideas for each brand
    project_ideas = {
        "TechInnovate": [
            {"name": "AI Assistant Launch", "type": "Product Launch"},
            {"name": "Tech Blog Content Series", "type": "Content Marketing"},
            {"name": "Developer Community Growth", "type": "Brand Awareness"}
        ],
        "GreenEats": [
            {"name": "Sustainable Packaging Campaign", "type": "Brand Awareness"},
            {"name": "Recipe Sharing Social Media", "type": "Social Media Campaign"},
            {"name": "New Partner Restaurants", "type": "Lead Generation"}
        ],
        "FitLife": [
            {"name": "Summer Fitness Challenge", "type": "Social Media Campaign"},
            {"name": "Nutrition Guide Launch", "type": "Product Launch"},
            {"name": "Trainer Partnership Program", "type": "Lead Generation"}
        ]
    }
    
    for brand_name, brand_obj in brands.items():
        for project_idea in project_ideas.get(brand_name, []):
            project = Project(
                name=project_idea["name"],
                description=f"Project for {project_idea['name']} with {brand_name}",
                brand_id=brand_obj.id,
                project_type_id=project_types[project_idea["type"]],
                start_date=datetime.now().date(),
                end_date=(datetime.now() + timedelta(days=90)).date(),
                created_by=admin_user.id,
                assigned_to=content_user.id if random.random() > 0.5 else admin_user.id
            )
            db.add(project)
            projects.append(project)
    
    db.commit()
    logger.info(f"Created {len(projects)} projects")
    
    return projects

def create_integrations(db: Session, brands: Dict[str, Brand], admin_user: User):
    """
    Create sample integrations for brands.
    """
    logger.info("Creating integrations...")
    
    count = 0
    for brand_name, brand_obj in brands.items():
        # Each brand gets 2-3 random integrations
        integration_count = random.randint(2, 3)
        used_types = set()
        
        for _ in range(integration_count):
            # Select random integration type that hasn't been used yet for this brand
            available_types = [t for t in INTEGRATION_TYPES if t["type"] not in used_types]
            if not available_types:
                break
                
            integration_type = random.choice(available_types)
            used_types.add(integration_type["type"])
            
            # Select random platform for this integration type
            platform = random.choice(integration_type["platforms"])
            
            # Create the integration
            integration = Integration(
                name=f"{platform.capitalize()} Integration",
                integration_type=integration_type["type"],
                brand_id=brand_obj.id,
                is_active=True,
                config={
                    "platform": platform,
                    "api_key": f"sample_key_{platform}_{brand_obj.id}",
                    "api_secret": f"sample_secret_{platform}_{brand_obj.id}",
                    "webhook_url": f"https://api.ultimatemarketing.com/webhooks/{platform}/{brand_obj.id}",
                    "last_sync": datetime.now().isoformat(),
                    "settings": {
                        "auto_publish": True,
                        "sync_frequency": "daily"
                    }
                }
            )
            db.add(integration)
            count += 1
    
    db.commit()
    logger.info(f"Created {count} integrations for brands")

def create_content(db: Session, projects: List[Project], users: Dict[str, User]):
    """
    Create sample content and drafts for projects.
    """
    logger.info("Creating content and drafts...")
    
    content_types = ["blog_post", "social_post", "email", "ad", "landing_page"]
    statuses = ["draft", "review", "approved", "published"]
    
    content_count = 0
    draft_count = 0
    
    content_creator = users["content"]
    
    for project in projects:
        # Each project gets 2-5 content items
        for _ in range(random.randint(2, 5)):
            content_type = random.choice(content_types)
            status = random.choice(statuses)
            
            content = Content(
                title=f"{content_type.replace('_', ' ').title()} for {project.name}",
                content_type=content_type,
                status=status,
                project_id=project.id,
                created_by=content_creator.id,
                publish_date=datetime.now() + timedelta(days=random.randint(1, 30)) if status != "published" else datetime.now()
            )
            db.add(content)
            db.flush()
            content_count += 1
            
            # Each content gets 1-3 drafts
            for version in range(1, random.randint(2, 4)):
                draft = ContentDraft(
                    content_id=content.id,
                    version=version,
                    body=f"Draft {version} for {content.title}. This is sample content for testing.",
                    metadata={
                        "word_count": random.randint(200, 1500),
                        "tags": ["sample", content_type, project.name.lower().replace(" ", "_")],
                        "seo_score": random.randint(60, 95),
                        "reading_time": random.randint(1, 10),
                        "created_with": "ai_assistant" if random.random() > 0.5 else "manual"
                    },
                    created_by=content_creator.id
                )
                db.add(draft)
                draft_count += 1
    
    db.commit()
    logger.info(f"Created {content_count} content items with {draft_count} drafts")

def create_notifications(db: Session, users: Dict[str, User]):
    """
    Create sample notifications for users.
    """
    logger.info("Creating notifications...")
    
    notification_types = ["system", "task", "content", "project", "analytics"]
    notification_messages = [
        "New comment on your content",
        "Content has been approved",
        "Project deadline approaching",
        "New analytics report available",
        "Campaign performance update",
        "New task assigned to you",
        "Content review requested",
        "System maintenance scheduled"
    ]
    
    count = 0
    for username, user in users.items():
        # Each user gets 3-8 notifications
        for _ in range(random.randint(3, 8)):
            notification_type = random.choice(notification_types)
            message = random.choice(notification_messages)
            
            notification = Notification(
                user_id=user.id,
                title=message,
                message=f"{message} - Details for notification. Please check the relevant section for more information.",
                is_read=random.random() > 0.7,  # 30% read, 70% unread
                notification_type=notification_type,
                related_entity_type=random.choice(["project", "content", "system", None]),
                related_entity_id=random.randint(1, 10) if random.random() > 0.5 else None
            )
            db.add(notification)
            count += 1
    
    db.commit()
    logger.info(f"Created {count} notifications")

def seed_database(truncate: bool = False, environment: str = "development"):
    """
    Main function to seed the database.
    """
    logger.info(f"Starting database seeding for {environment} environment...")
    
    # Initialize SQLAlchemy
    configure_mappers()
    
    db = SessionLocal()
    try:
        # Truncate tables if requested
        if truncate:
            truncate_tables(db)
        
        # Create data in the correct order
        roles = create_roles_and_permissions(db)
        users = create_users(db, roles)
        brands = create_brands(db, users["admin"])
        project_types = create_project_types(db)
        projects = create_projects(db, brands, project_types, users)
        create_integrations(db, brands, users["admin"])
        create_content(db, projects, users)
        create_notifications(db, users)
        
        logger.info("Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the database with initial data")
    parser.add_argument("--truncate", action="store_true", help="Truncate existing data before seeding")
    parser.add_argument("--env", default="development", choices=["development", "testing", "demo"], 
                      help="Target environment")
    
    args = parser.parse_args()
    seed_database(truncate=args.truncate, environment=args.env)