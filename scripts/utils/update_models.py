import os
from sqlalchemy import Column, ForeignKey, String, Integer, Text, JSON, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

def append_to_file(file_path, content):
    with open(file_path, 'a') as f:
        f.write(content)

def update_brand_model():
    file_path = '/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/src/models/project.py'
    if not os.path.exists(file_path):
        return

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

if __name__ == "__main__":
    update_brand_model()
    print("Updated models with missing relationships")
