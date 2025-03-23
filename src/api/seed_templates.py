"""
API endpoint for seeding templates directly from the TypeScript data.
"""
from typing import List, Dict, Any, Optional
import re
import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.core.security import get_current_user
from src.models.system import User
from src.models.template import (
    Template, TemplateCategory, TemplateIndustry, TemplateFormat, 
    TemplateRating, TemplateUsage, TemplateFavorite
)

router = APIRouter(
    tags=["templates"]
)

# Add a simple test endpoint without auth for debugging
@router.get("/test", response_model=dict)
def test_seed_templates_endpoint():
    """Simple test endpoint to verify the seed-templates router is working."""
    return {"status": "ok", "message": "Seed templates router is working"}

# Industry mapping
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

# Category mapping
CATEGORY_MAP = {
    "social-proof": "Social Proof",
    "customer-acquisition": "Customer Acquisition",
    "educational-content": "Educational Content",
    "brand-awareness": "Brand Awareness",
    "event-promotion": "Event Promotion",
    "community-building": "Community Building"
}

# Format mapping
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

# Template data
HEALTH_WELLNESS_TEMPLATES = [
    {
        "id": "wellness-transformation-instagram",
        "title": "Client Transformation - Instagram Post",
        "description": "Showcase client success stories and transformations with this engaging and inspirational template.",
        "format_id": "social-instagram",
        "preview_image": None,
        "content": "✨ {transformation_emoji} TRANSFORMATION TUESDAY {transformation_emoji} ✨\n\nMeet {client_first_name}, who achieved {transformation_achievement} with {program_name}!\n\n{transformation_description}\n\nKey results:\n✅ {result_1}\n✅ {result_2}\n✅ {result_3}\n\n{client_quote}\n\nWant to start your own transformation journey? {cta_text}\n\n#TransformationTuesday #{business_hashtag} #{niche_hashtag} #{location_hashtag}",
        "dynamic_fields": {
            "transformation_emoji": {
                "label": "Transformation Emoji",
                "description": "Emoji that represents the transformation",
                "default": "💪",
                "multiline": False
            },
            "client_first_name": {
                "label": "Client First Name",
                "description": "First name of the featured client",
                "default": "Sarah",
                "multiline": False
            },
            "transformation_achievement": {
                "label": "Transformation Achievement",
                "description": "The main achievement or transformation",
                "default": "remarkable strength gains and 15kg weight loss",
                "multiline": False
            },
            "program_name": {
                "label": "Programme Name",
                "description": "Your programme, service, or method name",
                "default": "our 12-Week Total Body Transformation Programme",
                "multiline": False
            },
            "transformation_description": {
                "label": "Transformation Description",
                "description": "Describe the client's journey and transformation",
                "default": "Sarah came to us feeling exhausted, struggling with chronic pain, and unhappy with her fitness level. After 12 weeks of personalised training, nutrition guidance, and unwavering dedication, she's completely transformed not just her body, but her entire lifestyle!",
                "multiline": True
            },
            "result_1": {
                "label": "Result 1",
                "description": "First key result or achievement",
                "default": "Lost 15kg while gaining lean muscle",
                "multiline": False
            },
            "result_2": {
                "label": "Result 2",
                "description": "Second key result or achievement",
                "default": "Eliminated chronic back pain through proper movement patterns",
                "multiline": False
            },
            "result_3": {
                "label": "Result 3",
                "description": "Third key result or achievement",
                "default": "Doubled her energy levels and improved sleep quality",
                "multiline": False
            },
            "client_quote": {
                "label": "Client Quote",
                "description": "Quote from the client about their experience",
                "default": "\"This programme changed my life! Not only do I look better, but I feel stronger and more confident than ever before. The coaches provided the perfect balance of challenge and support.\" - Sarah",
                "multiline": True
            },
            "cta_text": {
                "label": "Call to Action",
                "description": "What you want viewers to do",
                "default": "Click the link in our bio to book your free consultation!",
                "multiline": False
            },
            "business_hashtag": {
                "label": "Business Hashtag",
                "description": "Your business hashtag",
                "default": "FitnessEvolution",
                "multiline": False
            },
            "niche_hashtag": {
                "label": "Niche Hashtag",
                "description": "Hashtag for your specific niche",
                "default": "StrengthTraining",
                "multiline": False
            },
            "location_hashtag": {
                "label": "Location Hashtag",
                "description": "Hashtag for your location",
                "default": "LondonFitness",
                "multiline": False
            }
        },
        "tone_options": [
            {
                "id": "inspirational",
                "name": "Inspirational",
                "description": "Uplifting and motivational tone",
                "modifications": {}
            },
            {
                "id": "professional",
                "name": "Professional/Medical",
                "description": "More clinical and professional tone",
                "modifications": {
                    "content": "📊 CLIENT OUTCOME: {transformation_achievement} 📊\n\nCase Study: {client_first_name}\nProgramme: {program_name}\n\n{transformation_description}\n\nDocumented Results:\n▪️ {result_1}\n▪️ {result_2}\n▪️ {result_3}\n\nClient Testimonial:\n{client_quote}\n\nFor a personalised assessment and treatment plan: {cta_text}\n\n#ClinicalResults #{business_hashtag} #{niche_hashtag} #{location_hashtag}"
                }
            },
            {
                "id": "conversational",
                "name": "Conversational/Friendly",
                "description": "Casual and relatable tone",
                "modifications": {
                    "content": "OMG CHECK OUT THIS AMAZING TRANSFORMATION! {transformation_emoji}\n\nThis is {client_first_name}, and wow, just look at what she accomplished! She achieved {transformation_achievement} with {program_name} and we couldn't be prouder!\n\n{transformation_description}\n\nHere's what she achieved:\n✅ {result_1}\n✅ {result_2}\n✅ {result_3}\n\nIn her own words:\n{client_quote}\n\nFeeling inspired? We'd love to help you too! {cta_text}\n\n#TransformationTuesday #{business_hashtag} #{niche_hashtag} #{location_hashtag}"
                }
            }
        ],
        "is_featured": True,
        "is_premium": False,
        "categories": ["social-proof", "customer-acquisition"],
        "industries": ["health-wellness", "fitness"]
    },
    {
        "id": "wellness-daily-tips-twitter",
        "title": "Wellness Daily Tip - Twitter Post",
        "description": "Share quick, valuable health and wellness tips with your audience on Twitter.",
        "format_id": "social-twitter",
        "preview_image": None,
        "content": "{emoji} {wellness_tip_headline} {emoji}\n\n{wellness_tip_content}\n\n{supporting_fact}\n\n#WellnessTip #{business_hashtag} #{topic_hashtag}",
        "dynamic_fields": {
            "emoji": {
                "label": "Emoji",
                "description": "Emoji that relates to your tip",
                "default": "💧",
                "multiline": False
            },
            "wellness_tip_headline": {
                "label": "Tip Headline",
                "description": "Short, attention-grabbing headline",
                "default": "HYDRATION HACK",
                "multiline": False
            },
            "wellness_tip_content": {
                "label": "Tip Content",
                "description": "Your main wellness tip (keep concise for Twitter)",
                "default": "Start your day with a glass of room temperature water with fresh lemon. This boosts hydration, jumpstarts digestion, and provides vitamin C first thing.",
                "multiline": True
            },
            "supporting_fact": {
                "label": "Supporting Fact",
                "description": "A fact that supports your tip",
                "default": "Studies show proper morning hydration can boost metabolism by up to 30% for 1-2 hours!",
                "multiline": True
            },
            "business_hashtag": {
                "label": "Business Hashtag",
                "description": "Your business hashtag",
                "default": "WellnessWithSarah",
                "multiline": False
            },
            "topic_hashtag": {
                "label": "Topic Hashtag",
                "description": "Hashtag related to the tip topic",
                "default": "HydrationTips",
                "multiline": False
            }
        },
        "tone_options": [
            {
                "id": "informative",
                "name": "Informative/Educational",
                "description": "Educational tone focused on facts",
                "modifications": {}
            },
            {
                "id": "motivational",
                "name": "Motivational/Inspiring",
                "description": "Uplifting and motivational tone",
                "modifications": {
                    "content": "✨ {wellness_tip_headline} ✨\n\n{wellness_tip_content}\n\nRemember: {supporting_fact}\n\nYou've got this! 💪\n\n#WellnessJourney #{business_hashtag} #{topic_hashtag}"
                }
            },
            {
                "id": "conversational",
                "name": "Conversational/Friendly",
                "description": "Casual, friendly tone",
                "modifications": {
                    "content": "Hey there! {emoji} Try this quick {wellness_tip_headline}:\n\n{wellness_tip_content}\n\nFun fact: {supporting_fact}\n\nWhat's your favorite wellness habit? Reply below!\n\n#DailyWellness #{business_hashtag} #{topic_hashtag}"
                }
            }
        ],
        "is_featured": True,
        "is_premium": False,
        "categories": ["educational-content", "brand-awareness"],
        "industries": ["health-wellness", "nutrition", "mental-health"]
    }
]

def seed_all_templates(db: Session, background_tasks: BackgroundTasks, user_id: int) -> Dict[str, Any]:
    """Seed all templates in a background task."""
    def background_seed_job():
        # Ensure categories exist
        category_map = ensure_categories(db)
        
        # Ensure industries exist
        industry_map = ensure_industries(db)
        
        # Ensure formats exist
        format_map = ensure_formats(db)
        
        # Import templates
        import_templates(
            db, 
            HEALTH_WELLNESS_TEMPLATES, 
            category_map, 
            industry_map, 
            format_map, 
            user_id
        )
    
    # Add the seeding task to background tasks
    background_tasks.add_task(background_seed_job)
    
    return {
        "status": "success",
        "message": "Template seeding started in the background",
        "templates_to_import": len(HEALTH_WELLNESS_TEMPLATES)
    }

def ensure_categories(db: Session) -> Dict[str, int]:
    """Ensure categories exist in the database and return a mapping."""
    category_map = {}
    
    for category_id, category_name in CATEGORY_MAP.items():
        # Check if category exists
        category = db.query(TemplateCategory).filter(TemplateCategory.name == category_name).first()
        
        if not category:
            # Create new category
            category = TemplateCategory(
                name=category_name,
                description=f"{category_name} templates",
                icon="folder"  # Default icon
            )
            db.add(category)
            db.commit()
            db.refresh(category)
        
        category_map[category_id] = category.id
    
    return category_map

def ensure_industries(db: Session) -> Dict[str, int]:
    """Ensure industries exist in the database and return a mapping."""
    industry_map = {}
    
    for industry_id, industry_name in INDUSTRY_MAP.items():
        # Check if industry exists
        industry = db.query(TemplateIndustry).filter(TemplateIndustry.name == industry_name).first()
        
        if not industry:
            # Create new industry
            industry = TemplateIndustry(
                name=industry_name,
                description=f"{industry_name} industry templates",
                icon=industry_id.split('-')[0]  # Simple icon from first word
            )
            db.add(industry)
            db.commit()
            db.refresh(industry)
        
        industry_map[industry_id] = industry.id
    
    return industry_map

def ensure_formats(db: Session) -> Dict[str, int]:
    """Ensure formats exist in the database and return a mapping."""
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

def import_templates(
    db: Session, 
    templates: List[Dict[str, Any]], 
    category_map: Dict[str, int], 
    industry_map: Dict[str, int], 
    format_map: Dict[str, int],
    user_id: int
) -> None:
    """Import templates into the database."""
    for template_data in templates:
        # Check if template already exists
        existing_template = db.query(Template).filter(Template.title == template_data["title"]).first()
        
        if existing_template:
            print(f"Template '{template_data['title']}' already exists, skipping.")
            continue
        
        # Get format ID
        format_id = format_map.get(template_data["format_id"])
        if not format_id:
            print(f"Format not found for template '{template_data['title']}', skipping.")
            continue
        
        # Create new template
        template = Template(
            title=template_data["title"],
            description=template_data["description"],
            content=template_data["content"],
            format_id=format_id,
            preview_image=template_data["preview_image"],
            dynamic_fields=template_data["dynamic_fields"],
            tone_options=template_data["tone_options"],
            is_featured=template_data["is_featured"],
            is_premium=template_data["is_premium"],
            community_rating=0.0,
            usage_count=0,
            version=1,
            created_by=user_id
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
        print(f"Imported template '{template_data['title']}'")

@router.post("", response_model=Dict[str, Any])
async def seed_templates(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Seed the database with template data.
    This will create template categories, industries, formats, and templates.
    """
    # Only allow admin users to seed templates
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admin users can seed templates")
    
    # Check if templates already exist
    existing_templates = db.query(Template).count()
    if existing_templates > 0:
        return {
            "status": "success",
            "message": f"Templates already exist in the database ({existing_templates} templates)",
            "count": existing_templates
        }
    
    # Seed templates
    return seed_all_templates(db, background_tasks, current_user.id)

@router.get("/check", response_model=Dict[str, Any])
async def check_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if templates exist in the database.
    Returns the count of templates and related entities.
    """
    # Count templates, categories, industries, and formats
    template_count = db.query(Template).count()
    category_count = db.query(TemplateCategory).count()
    industry_count = db.query(TemplateIndustry).count()
    format_count = db.query(TemplateFormat).count()
    
    return {
        "status": "success",
        "exists": template_count > 0,
        "counts": {
            "templates": template_count,
            "categories": category_count,
            "industries": industry_count,
            "formats": format_count
        }
    }