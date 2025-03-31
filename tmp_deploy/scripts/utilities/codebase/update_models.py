#!/usr/bin/env python3
"""
Model Relationship Updater

This script automatically updates model relationship definitions to ensure proper 
connections between models in the SQLAlchemy ORM.

Usage:
    python -m scripts.utilities.codebase.update_models
"""

import os
import sys
from pathlib import Path

def append_to_file(file_path, content):
    """Append content to a file."""
    with open(file_path, 'a') as f:
        f.write(content)

def update_brand_model():
    """Update the Brand model with missing relationship definitions."""
    # Calculate project root directory
    project_root = Path(__file__).parents[3]
    file_path = project_root / "src" / "models" / "project.py"
    
    if not file_path.exists():
        print(f"Error: Model file not found at {file_path}")
        return False

    # Check if social_accounts relationship already exists
    with open(file_path, 'r') as f:
        content = f.read()
        if 'social_accounts' not in content:
            # Add social_accounts relationship
            append_to_file(file_path, """
# Adding missing relationships for auth integrations
    social_accounts = relationship("SocialAccount", back_populates="brand", cascade="all, delete-orphan")
    cms_accounts = relationship("CMSAccount", back_populates="brand", cascade="all, delete-orphan")
    ad_accounts = relationship("AdAccount", back_populates="brand", cascade="all, delete-orphan")
""")
            return True
    
    return False

def main():
    """Main function to update models."""
    success = update_brand_model()
    if success:
        print("✅ Updated models with missing relationships")
    else:
        print("ℹ️ No model updates needed")

if __name__ == "__main__":
    main()
