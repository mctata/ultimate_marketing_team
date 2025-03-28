#!/usr/bin/env python3
"""
Script to seed the database with template data from the TypeScript files.
This script parses the TypeScript data files and inserts the templates
into the database.
"""

import os
import re
import json
import argparse
from typing import List, Dict, Any
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Add the parent directory to the path
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.settings import settings
from src.models.template import (
    Template, TemplateCategory, TemplateIndustry, TemplateFormat, 
    template_category_association, template_industry_association
)

# Regex patterns for extracting data from TypeScript files
START_ARRAY_PATTERN = re.compile(r'export const (\w+) = \[')
TEMPLATE_PATTERN = re.compile(r'\{(.*?)\}(?=,\s*\{|\s*\];)', re.DOTALL)
INDUSTRY_MAP = {
    "health-wellness": "Health & Wellness",
    "fitness": "Fitness",
    "nutrition": "Nutrition",
    "yoga": "Yoga",
    "meditation": "Meditation",
    "mental-health": "Mental Health",
    "food-beverage": "Food & Beverage",
    "professional-services": "Professional Services"
}

CATEGORY_MAP = {
    "social-proof": "Social Proof",
    "customer-acquisition": "Customer Acquisition",
    "educational-content": "Educational Content",
    "brand-awareness": "Brand Awareness",
    "event-promotion": "Event Promotion",
    "community-building": "Community Building"
}

FORMAT_MAP = {
    "social-instagram": {
        "name": "Instagram Post",
        "description": "Format optimized for Instagram feed posts",
        "platform": "Instagram",
        "content_type": "social",
        "specs": {
            "character_limit": 2200,
            "hashtag_limit": 30,
            "image_ratio": "1:1 or 4:5"
        }
    },
    "social-twitter": {
        "name": "Twitter Post",
        "description": "Format optimized for Twitter posts",
        "platform": "Twitter",
        "content_type": "social",
        "specs": {
            "character_limit": 280
        }
    },
    "blog-how-to": {
        "name": "How-To Blog Post",
        "description": "Format optimized for educational how-to blog content",
        "platform": None,
        "content_type": "blog",
        "specs": {
            "recommended_length": "1500-2500 words",
            "sections": ["Introduction", "Steps", "Tips", "Conclusion"]
        }
    },
    "email-promotional": {
        "name": "Promotional Email",
        "description": "Format optimized for promotional email campaigns",
        "platform": "Email",
        "content_type": "email",
        "specs": {
            "subject_line_length": "50 characters",
            "preheader_length": "85-100 characters",
            "width": "600px recommended"
        }
    },
    "social-facebook": {
        "name": "Facebook Post",
        "description": "Format optimized for Facebook posts",
        "platform": "Facebook",
        "content_type": "social",
        "specs": {
            "character_limit": 63206,
            "image_ratio": "1.91:1"
        }
    }
}

def clean_ts_value(value: str) -> Any:
    """
    Clean and convert a TypeScript value to a Python value.
    """
    # Handle null
    if value.strip() == 'null':
        return None
    
    # Handle booleans
    if value.strip() == 'true':
        return True
    if value.strip() == 'false':
        return False
    
    # Handle strings (with or without quotes)
    if (value.strip().startswith('"') and value.strip().endswith('"')) or \
       (value.strip().startswith("'") and value.strip().endswith("'")):
        return value.strip()[1:-1]
    
    # Handle numbers
    try:
        return int(value.strip())
    except ValueError:
        try:
            return float(value.strip())
        except ValueError:
            pass
    
    # For complex objects, just return the string
    return value.strip()

def extract_ts_object(ts_object_str: str) -> Dict[str, Any]:
    """
    Extract a TypeScript object string into a Python dictionary.
    This is a simplified parser and may not handle all edge cases.
    """
    result = {}
    # Remove newlines within string literals for easier parsing
    cleaned_str = ''
    in_string = False
    string_char = None
    
    for char in ts_object_str:
        if char in ['"', "'", "`"] and (not in_string or char == string_char):
            in_string = not in_string
            string_char = char if in_string else None
        
        if in_string and char == '\n':
            cleaned_str += '\\n'  # Replace newline with escape sequence
        else:
            cleaned_str += char
    
    # Split the cleaned string by properties
    props = []
    in_nested = 0
    current_prop = ''
    
    for char in cleaned_str:
        if char == '{' or char == '[':
            in_nested += 1
        elif char == '}' or char == ']':
            in_nested -= 1
        
        current_prop += char
        
        if char == ',' and in_nested == 0:
            props.append(current_prop[:-1].strip())  # Remove trailing comma
            current_prop = ''
    
    if current_prop:
        props.append(current_prop.strip())
    
    # Process each property
    for prop in props:
        if ':' not in prop:
            continue
        
        key, value = prop.split(':', 1)
        key = key.strip()
        
        # Remove quotes from key if present
        if (key.startswith('"') and key.endswith('"')) or \
           (key.startswith("'") and key.endswith("'")):
            key = key[1:-1]
        
        value = value.strip()
        
        # Handle nested objects
        if value.startswith('{') and value.endswith('}'):
            result[key] = extract_ts_object(value[1:-1])
        # Handle arrays
        elif value.startswith('[') and value.endswith(']'):
            if value == '[]':
                result[key] = []
            else:
                # Simplified array parsing - this doesn't handle all cases
                array_items = []
                item_str = ''
                in_nested = 0
                in_string = False
                string_char = None
                
                for i, char in enumerate(value[1:-1]):
                    if char in ['"', "'", "`"] and (not in_string or char == string_char):
                        in_string = not in_string
                        string_char = char if in_string else None
                    
                    if not in_string:
                        if char == '{' or char == '[':
                            in_nested += 1
                        elif char == '}' or char == ']':
                            in_nested -= 1
                    
                    item_str += char
                    
                    if (char == ',' and in_nested == 0 and not in_string) or i == len(value[1:-1]) - 1:
                        item = item_str.strip()
                        if char == ',':
                            item = item[:-1].strip()  # Remove trailing comma
                        
                        if item.startswith('{') and item.endswith('}'):
                            array_items.append(extract_ts_object(item[1:-1]))
                        else:
                            array_items.append(clean_ts_value(item))
                        
                        item_str = ''
                
                result[key] = array_items
        else:
            result[key] = clean_ts_value(value)
    
    return result

def parse_ts_file(file_path: str) -> List[Dict[str, Any]]:
    """
    Parse a TypeScript file and extract template data.
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the array name
    start_match = START_ARRAY_PATTERN.search(content)
    if not start_match:
        print(f"Could not find array declaration in {file_path}")
        return []
    
    # Extract template objects
    template_matches = TEMPLATE_PATTERN.findall(content)
    templates = []
    
    for match in template_matches:
        try:
            template = extract_ts_object(match)
            templates.append(template)
        except Exception as e:
            print(f"Error parsing template in {file_path}: {str(e)}")
    
    return templates

def ensure_categories(db: Session) -> Dict[str, int]:
    """
    Ensure categories exist in the database and return a mapping of
    category name to ID.
    """
    category_map = {}
    
    for category_id, category_name in CATEGORY_MAP.items():
        # Check if category exists
        category = db.query(TemplateCategory).filter(TemplateCategory.name == category_name).first()
        
        if not category:
            # Create new category
            category = TemplateCategory(
                name=category_name,
                description=f"{category_name} templates"
            )
            db.add(category)
            db.commit()
            db.refresh(category)
        
        category_map[category_id] = category.id
    
    return category_map

def ensure_industries(db: Session) -> Dict[str, int]:
    """
    Ensure industries exist in the database and return a mapping of
    industry name to ID.
    """
    industry_map = {}
    
    for industry_id, industry_name in INDUSTRY_MAP.items():
        # Check if industry exists
        industry = db.query(TemplateIndustry).filter(TemplateIndustry.name == industry_name).first()
        
        if not industry:
            # Create new industry
            industry = TemplateIndustry(
                name=industry_name,
                description=f"{industry_name} industry templates"
            )
            db.add(industry)
            db.commit()
            db.refresh(industry)
        
        industry_map[industry_id] = industry.id
    
    return industry_map

def ensure_formats(db: Session) -> Dict[str, int]:
    """
    Ensure formats exist in the database and return a mapping of
    format name to ID.
    """
    format_map = {}
    
    for format_id, format_data in FORMAT_MAP.items():
        # Check if format exists
        template_format = db.query(TemplateFormat).filter(TemplateFormat.name == format_data["name"]).first()
        
        if not template_format:
            # Create new format
            template_format = TemplateFormat(
                name=format_data["name"],
                description=format_data["description"],
                platform=format_data["platform"],
                content_type=format_data["content_type"],
                specs=format_data["specs"]
            )
            db.add(template_format)
            db.commit()
            db.refresh(template_format)
        
        format_map[format_id] = template_format.id
    
    return format_map

def import_templates(db: Session, templates: List[Dict[str, Any]], 
                    category_map: Dict[str, int], industry_map: Dict[str, int], 
                    format_map: Dict[str, int]) -> None:
    """
    Import templates into the database.
    """
    for template_data in templates:
        # Check if template already exists
        existing_template = db.query(Template).filter(Template.title == template_data.get("title", "")).first()
        
        if existing_template:
            print(f"Template '{template_data.get('title', '')}' already exists, skipping.")
            continue
        
        # Get format ID
        format_id = format_map.get(template_data.get("format_id", ""))
        if not format_id:
            print(f"Format not found for template '{template_data.get('title', '')}', skipping.")
            continue
        
        # Create new template
        template = Template(
            title=template_data.get("title", ""),
            description=template_data.get("description", ""),
            content=template_data.get("content", ""),
            format_id=format_id,
            preview_image=template_data.get("preview_image"),
            dynamic_fields=template_data.get("dynamic_fields", {}),
            tone_options=template_data.get("tone_options", []),
            is_featured=template_data.get("is_featured", False),
            is_premium=template_data.get("is_premium", False),
            community_rating=0.0,
            usage_count=0,
            version=1
        )
        
        # Add categories
        categories = []
        for category_id in template_data.get("categories", []):
            db_category_id = category_map.get(category_id)
            if db_category_id:
                category = db.query(TemplateCategory).filter(TemplateCategory.id == db_category_id).first()
                if category:
                    categories.append(category)
        
        template.categories = categories
        
        # Add industries
        industries = []
        for industry_id in template_data.get("industries", []):
            db_industry_id = industry_map.get(industry_id)
            if db_industry_id:
                industry = db.query(TemplateIndustry).filter(TemplateIndustry.id == db_industry_id).first()
                if industry:
                    industries.append(industry)
        
        template.industries = industries
        
        # Save template
        db.add(template)
        db.commit()
        print(f"Imported template '{template_data.get('title', '')}'")

def main():
    """
    Main function to seed the database with template data.
    """
    parser = argparse.ArgumentParser(description='Seed template data from TypeScript files')
    parser.add_argument('--database-url', dest='db_url', default=settings.DATABASE_URL,
                        help='Database URL (default: from settings)')
    parser.add_argument('--ts-dir', dest='ts_dir', default='src/data',
                        help='Directory containing TypeScript template files')
    parser.add_argument('--clean', action='store_true',
                        help='Clean existing templates before import')
    
    args = parser.parse_args()
    
    # Connect to the database
    engine = create_engine(args.db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Clean templates if requested
        if args.clean:
            print("Cleaning existing templates...")
            db.query(Template).delete()
            db.commit()
        
        # Ensure categories, industries, and formats exist
        print("Ensuring categories exist...")
        category_map = ensure_categories(db)
        
        print("Ensuring industries exist...")
        industry_map = ensure_industries(db)
        
        print("Ensuring formats exist...")
        format_map = ensure_formats(db)
        
        # Get TypeScript files
        ts_files = []
        for root, _, files in os.walk(args.ts_dir):
            for file in files:
                if file.endswith('Templates.ts'):
                    ts_files.append(os.path.join(root, file))
        
        # Parse and import templates
        for ts_file in ts_files:
            print(f"Parsing {ts_file}...")
            templates = parse_ts_file(ts_file)
            print(f"Found {len(templates)} templates in {ts_file}")
            
            import_templates(db, templates, category_map, industry_map, format_map)
        
        print("Template seeding completed successfully!")
    
    except Exception as e:
        print(f"Error seeding templates: {str(e)}")
        db.rollback()
        raise
    
    finally:
        db.close()

if __name__ == '__main__':
    main()