from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_, or_

from src.core.database import get_db
from src.core.security import get_current_user
from src.models.template import (
    Template, TemplateCategory, TemplateIndustry, TemplateFormat, 
    TemplateRating, TemplateUsage, TemplateFavorite,
    template_category_association, template_industry_association
)
from src.models.system import User
from src.models.content import ContentDraft
from src.schemas.template import (
    TemplateCreate, TemplateUpdate, TemplateRead, TemplateCategoryCreate, 
    TemplateIndustryCreate, TemplateFormatCreate, TemplateRatingCreate
)

router = APIRouter(
    tags=["templates"]
)

# Add a simple test endpoint without auth for debugging
@router.get("/test", response_model=dict)
def test_templates_endpoint():
    """Simple test endpoint to verify the templates router is working."""
    return {"status": "ok", "message": "Templates router is working"}

# Add test endpoints without auth for debugging
@router.get("/categories-test", response_model=dict)
def test_categories_endpoint(db: Session = Depends(get_db)):
    """Test endpoint to verify database connectivity for template categories."""
    try:
        categories_count = db.query(TemplateCategory).count()
        return {
            "status": "ok", 
            "message": "Template categories database connection successful",
            "categories_count": categories_count,
            "db_session": str(type(db)),
            "db_info": {
                "url": str(db.bind.url).replace("postgresql://", "postgresql://*****:*****@"),
                "is_connected": db.bind.pool.checkedin() > 0 or db.bind.pool.checkedout() > 0,
                "pool_size": db.bind.pool.size(),
                "overflow": db.bind.pool.overflow(),
                "checkedin": db.bind.pool.checkedin(),
                "checkedout": db.bind.pool.checkedout()
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database connection error: {str(e)}",
            "error_type": str(type(e)),
            "db_session": str(type(db)) if db else "None"
        }

# Add test endpoint for getting templates without auth
@router.get("/all-test", response_model=dict)
def test_all_templates_endpoint(db: Session = Depends(get_db)):
    """Test endpoint to get all templates without authentication."""
    try:
        templates = db.query(Template).limit(5).all()
        return {
            "status": "ok",
            "message": "Templates retrieved successfully",
            "count": len(templates),
            "templates": [{
                "id": template.id,
                "title": template.title,
                "description": template.description,
                "format": template.format.name if template.format else None,
                "categories": [c.name for c in template.categories] if template.categories else [],
                "industries": [i.name for i in template.industries] if template.industries else []
            } for template in templates]
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error retrieving templates: {str(e)}",
            "error_type": str(type(e))
        }

# Template Categories
@router.get("/categories", response_model=List[Dict[str, Any]])
def get_template_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all template categories with counts."""
    try:
        categories = db.query(TemplateCategory).all()
        return [{
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "icon": category.icon,
            "template_count": len(category.templates)
        } for category in categories]
    except Exception as e:
        # Log the error and return a meaningful message
        print(f"Error in get_template_categories: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch template categories: {str(e)}"
        )

@router.post("/categories", response_model=Dict[str, Any])
def create_template_category(
    category: TemplateCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new template category."""
    db_category = TemplateCategory(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return {
        "id": db_category.id,
        "name": db_category.name,
        "description": db_category.description,
        "icon": db_category.icon
    }

# Template Industries
@router.get("/industries", response_model=List[Dict[str, Any]])
def get_template_industries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all template industries."""
    industries = db.query(TemplateIndustry).all()
    return [{
        "id": industry.id,
        "name": industry.name,
        "description": industry.description,
        "icon": industry.icon,
        "template_count": len(industry.templates)
    } for industry in industries]

@router.post("/industries", response_model=Dict[str, Any])
def create_template_industry(
    industry: TemplateIndustryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new template industry."""
    db_industry = TemplateIndustry(**industry.dict())
    db.add(db_industry)
    db.commit()
    db.refresh(db_industry)
    return {
        "id": db_industry.id,
        "name": db_industry.name,
        "description": db_industry.description,
        "icon": db_industry.icon
    }

# Template Formats
@router.get("/formats", response_model=List[Dict[str, Any]])
def get_template_formats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    content_type: Optional[str] = Query(None)
):
    """Get all template formats, optionally filtered by content type."""
    query = db.query(TemplateFormat)
    if content_type:
        query = query.filter(TemplateFormat.content_type == content_type)
    
    formats = query.all()
    return [{
        "id": format.id,
        "name": format.name,
        "description": format.description,
        "platform": format.platform,
        "content_type": format.content_type,
        "specs": format.specs,
        "template_count": len(format.templates)
    } for format in formats]

@router.post("/formats", response_model=Dict[str, Any])
def create_template_format(
    format: TemplateFormatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new template format."""
    db_format = TemplateFormat(**format.dict())
    db.add(db_format)
    db.commit()
    db.refresh(db_format)
    return {
        "id": db_format.id,
        "name": db_format.name,
        "description": db_format.description,
        "platform": db_format.platform,
        "content_type": db_format.content_type,
        "specs": db_format.specs
    }

# Templates
@router.get("", response_model=List[TemplateRead])
def get_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    industry_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    format_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    is_featured: Optional[bool] = Query(None),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc"),
    skip: int = Query(0),
    limit: int = Query(100)
):
    """Get templates with various filtering options."""
    query = db.query(Template)
    
    # Apply filters
    if industry_id:
        query = query.filter(Template.industries.any(id=industry_id))
    if category_id:
        query = query.filter(Template.categories.any(id=category_id))
    if format_id:
        query = query.filter(Template.format_id == format_id)
    if is_featured is not None:
        query = query.filter(Template.is_featured == is_featured)
    if search:
        search_term = f"%{search}%"
        query = query.filter(or_(
            Template.title.ilike(search_term),
            Template.description.ilike(search_term)
        ))
    
    # Apply sorting
    if sort_dir.lower() == "desc":
        query = query.order_by(desc(getattr(Template, sort_by)))
    else:
        query = query.order_by(getattr(Template, sort_by))
    
    # Apply pagination
    templates = query.offset(skip).limit(limit).all()
    
    return templates

@router.get("/{template_id}", response_model=TemplateRead)
def get_template(
    template_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific template by ID."""
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.post("", response_model=TemplateRead)
def create_template(
    template: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new template."""
    db_template = Template(
        title=template.title,
        description=template.description,
        content=template.content,
        format_id=template.format_id,
        preview_image=template.preview_image,
        dynamic_fields=template.dynamic_fields,
        tone_options=template.tone_options,
        is_featured=template.is_featured,
        is_premium=template.is_premium,
        created_by=current_user.id
    )
    
    # Add categories
    if template.category_ids:
        categories = db.query(TemplateCategory).filter(
            TemplateCategory.id.in_(template.category_ids)
        ).all()
        db_template.categories = categories
    
    # Add industries
    if template.industry_ids:
        industries = db.query(TemplateIndustry).filter(
            TemplateIndustry.id.in_(template.industry_ids)
        ).all()
        db_template.industries = industries
    
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.put("/{template_id}", response_model=TemplateRead)
def update_template(
    template_update: TemplateUpdate,
    template_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a template."""
    db_template = db.query(Template).filter(Template.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Update template fields
    update_data = template_update.dict(exclude_unset=True)
    
    # Handle special fields
    category_ids = update_data.pop("category_ids", None)
    industry_ids = update_data.pop("industry_ids", None)
    
    # Update simple fields
    for field, value in update_data.items():
        setattr(db_template, field, value)
    
    # Update categories
    if category_ids is not None:
        categories = db.query(TemplateCategory).filter(
            TemplateCategory.id.in_(category_ids)
        ).all()
        db_template.categories = categories
    
    # Update industries
    if industry_ids is not None:
        industries = db.query(TemplateIndustry).filter(
            TemplateIndustry.id.in_(industry_ids)
        ).all()
        db_template.industries = industries
    
    # Increment version
    db_template.version += 1
    
    db.commit()
    db.refresh(db_template)
    return db_template

@router.delete("/{template_id}")
def delete_template(
    template_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a template."""
    db_template = db.query(Template).filter(Template.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Only allow deletion by creator or admin
    if db_template.created_by != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this template")
    
    db.delete(db_template)
    db.commit()
    return {"message": "Template deleted successfully"}

# Template Ratings
@router.post("/{template_id}/ratings", response_model=Dict[str, Any])
def rate_template(
    rating: TemplateRatingCreate,
    template_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Rate a template."""
    # Check if template exists
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check if user has already rated this template
    existing_rating = db.query(TemplateRating).filter(
        TemplateRating.template_id == template_id,
        TemplateRating.user_id == current_user.id
    ).first()
    
    if existing_rating:
        # Update existing rating
        existing_rating.rating = rating.rating
        existing_rating.comment = rating.comment
    else:
        # Create new rating
        db_rating = TemplateRating(
            template_id=template_id,
            user_id=current_user.id,
            rating=rating.rating,
            comment=rating.comment
        )
        db.add(db_rating)
    
    db.commit()
    
    # Update template's average rating
    avg_rating = db.query(func.avg(TemplateRating.rating)).filter(
        TemplateRating.template_id == template_id
    ).scalar()
    
    template.community_rating = avg_rating
    db.commit()
    
    return {
        "message": "Rating submitted successfully",
        "template_id": template_id,
        "rating": rating.rating,
        "new_avg_rating": avg_rating
    }

# Template Usage
@router.post("/{template_id}/use", response_model=Dict[str, Any])
def use_template(
    template_id: int = Path(...),
    customizations: Dict[str, Any] = Body(...),
    draft_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Use a template to create a new content draft."""
    # Check if template exists
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Create content draft
    content_draft = ContentDraft(
        project_id=draft_data.get("project_id"),
        content=draft_data.get("content"),
        version=1,
        status="draft",
        created_by=current_user.id
    )
    db.add(content_draft)
    db.commit()
    db.refresh(content_draft)
    
    # Track template usage
    usage = TemplateUsage(
        template_id=template_id,
        user_id=current_user.id,
        content_draft_id=content_draft.id,
        customizations=customizations
    )
    db.add(usage)
    
    # Update template usage count
    template.usage_count += 1
    
    db.commit()
    
    return {
        "message": "Template used successfully",
        "template_id": template_id,
        "content_draft_id": content_draft.id
    }

# Template Favorites
@router.post("/{template_id}/favorite", response_model=Dict[str, Any])
def favorite_template(
    template_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a template to user's favorites."""
    # Check if template exists
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check if already favorited
    existing_favorite = db.query(TemplateFavorite).filter(
        TemplateFavorite.template_id == template_id,
        TemplateFavorite.user_id == current_user.id
    ).first()
    
    if existing_favorite:
        return {"message": "Template is already in favorites"}
    
    # Add to favorites
    favorite = TemplateFavorite(
        template_id=template_id,
        user_id=current_user.id
    )
    db.add(favorite)
    db.commit()
    
    return {
        "message": "Template added to favorites",
        "template_id": template_id
    }

@router.delete("/{template_id}/favorite", response_model=Dict[str, Any])
def unfavorite_template(
    template_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a template from user's favorites."""
    # Check if favorited
    favorite = db.query(TemplateFavorite).filter(
        TemplateFavorite.template_id == template_id,
        TemplateFavorite.user_id == current_user.id
    ).first()
    
    if not favorite:
        return {"message": "Template is not in favorites"}
    
    # Remove from favorites
    db.delete(favorite)
    db.commit()
    
    return {
        "message": "Template removed from favorites",
        "template_id": template_id
    }

@router.get("/favorites", response_model=List[TemplateRead])
def get_favorite_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's favorite templates."""
    templates = db.query(Template).join(
        TemplateFavorite, 
        Template.id == TemplateFavorite.template_id
    ).filter(
        TemplateFavorite.user_id == current_user.id
    ).all()
    
    return templates

# Template Analytics
@router.get("/popular", response_model=List[TemplateRead])
def get_popular_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(10)
):
    """Get the most popular templates based on usage count."""
    templates = db.query(Template).order_by(
        desc(Template.usage_count)
    ).limit(limit).all()
    
    return templates

@router.get("/recommended", response_model=List[TemplateRead])
def get_recommended_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(10)
):
    """Get personalized template recommendations for the user."""
    # Get user's most used template categories
    user_usage = db.query(TemplateUsage).filter(
        TemplateUsage.user_id == current_user.id
    ).all()
    
    used_template_ids = [usage.template_id for usage in user_usage]
    
    if not used_template_ids:
        # If no usage history, return featured templates
        return db.query(Template).filter(
            Template.is_featured == True
        ).limit(limit).all()
    
    # Get categories from used templates
    used_categories = db.query(TemplateCategory).join(
        template_category_association,
        TemplateCategory.id == template_category_association.c.template_category_id
    ).filter(
        template_category_association.c.template_id.in_(used_template_ids)
    ).all()
    
    category_ids = [category.id for category in used_categories]
    
    if not category_ids:
        # If no categories found, return popular templates
        return db.query(Template).order_by(
            desc(Template.usage_count)
        ).limit(limit).all()
    
    try:
        # Get templates in the same categories, but not used by the user
        templates = db.query(Template).join(
            template_category_association,
            Template.id == template_category_association.c.template_id
        ).filter(
            template_category_association.c.template_category_id.in_(category_ids),
            ~Template.id.in_(used_template_ids)
        ).order_by(
            desc(Template.community_rating), 
            desc(Template.usage_count)
        ).limit(limit).all()
    except Exception as e:
        # If there's an error, return a fallback set of templates
        templates = db.query(Template).order_by(
            desc(Template.community_rating),
            desc(Template.usage_count)
        ).limit(limit).all()
    
    return templates
