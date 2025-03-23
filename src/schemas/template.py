from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# Template Category Schemas
class TemplateCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None

class TemplateCategoryCreate(TemplateCategoryBase):
    pass

class TemplateCategoryRead(TemplateCategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# Template Industry Schemas
class TemplateIndustryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None

class TemplateIndustryCreate(TemplateIndustryBase):
    pass

class TemplateIndustryRead(TemplateIndustryBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# Template Format Schemas
class TemplateFormatBase(BaseModel):
    name: str
    description: Optional[str] = None
    platform: Optional[str] = None
    content_type: str
    specs: Optional[Dict[str, Any]] = None

class TemplateFormatCreate(TemplateFormatBase):
    pass

class TemplateFormatRead(TemplateFormatBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# Template Schemas
class TemplateBase(BaseModel):
    title: str
    description: Optional[str] = None
    content: str
    preview_image: Optional[str] = None
    dynamic_fields: Optional[Dict[str, Any]] = None
    tone_options: Optional[List[Dict[str, Any]]] = None
    is_featured: Optional[bool] = Field(default=False)
    is_premium: Optional[bool] = Field(default=False)

class TemplateCreate(TemplateBase):
    format_id: int
    category_ids: Optional[List[int]] = None
    industry_ids: Optional[List[int]] = None

class TemplateUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    format_id: Optional[int] = None
    preview_image: Optional[str] = None
    dynamic_fields: Optional[Dict[str, Any]] = None
    tone_options: Optional[List[Dict[str, Any]]] = None
    is_featured: Optional[bool] = None
    is_premium: Optional[bool] = None
    category_ids: Optional[List[int]] = None
    industry_ids: Optional[List[int]] = None

class TemplateRead(TemplateBase):
    id: int
    format_id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    community_rating: float
    usage_count: int
    version: int
    categories: List[TemplateCategoryRead] = []
    industries: List[TemplateIndustryRead] = []
    format: TemplateFormatRead
    
    class Config:
        orm_mode = True

# Template Rating Schemas
class TemplateRatingBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class TemplateRatingCreate(TemplateRatingBase):
    pass

class TemplateRatingRead(TemplateRatingBase):
    id: int
    template_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# Template Usage Schemas
class TemplateUsageBase(BaseModel):
    customizations: Optional[Dict[str, Any]] = None

class TemplateUsageCreate(TemplateUsageBase):
    pass

class TemplateUsageRead(TemplateUsageBase):
    id: int
    template_id: int
    user_id: int
    content_draft_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

# Template Favorite Schemas
class TemplateFavoriteBase(BaseModel):
    pass

class TemplateFavoriteCreate(TemplateFavoriteBase):
    pass

class TemplateFavoriteRead(TemplateFavoriteBase):
    id: int
    template_id: int
    user_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True
