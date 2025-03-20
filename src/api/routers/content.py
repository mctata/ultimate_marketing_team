{
  `repo`: `ultimate_marketing_team`,
  `files`: [
    {
      `path`: `src/ultimate_marketing_team/api/routers/content.py`,
      `content`: `from fastapi import APIRouter, HTTPException, Depends, status, Query, Path, Body
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, date
import uuid

from src.ultimate_marketing_team.api.routers.auth import oauth2_scheme

router = APIRouter()

# Models
class ContentDraftBase(BaseModel):
    project_id: str
    content: str

class ContentDraftCreate(ContentDraftBase):
    pass

class ContentDraftUpdate(BaseModel):
    content: Optional[str] = None
    status: Optional[str] = None
    feedback: Optional[str] = None

class ContentDraft(ContentDraftBase):
    id: str
    version: int
    status: str
    feedback: Optional[str] = None
    created_by: Optional[str] = None
    created_at: str
    updated_at: str

class ContentCalendarEntry(BaseModel):
    id: str
    project_id: str
    content_draft_id: Optional[str] = None
    scheduled_date: str
    published_date: Optional[str] = None
    status: str
    created_at: str
    updated_at: str

class ContentCalendarCreate(BaseModel):
    project_id: str
    content_draft_id: Optional[str] = None
    scheduled_date: str

class ContentCalendarUpdate(BaseModel):
    content_draft_id: Optional[str] = None
    scheduled_date: Optional[str] = None
    status: Optional[str] = None

class ContentTopic(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    keywords: Optional[List[str]] = None

class ContentTopicCreate(BaseModel):
    name: str
    description: Optional[str] = None
    keywords: Optional[List[str]] = None

class ContentPerformance(BaseModel):
    id: str
    project_id: Optional[str] = None
    content_draft_id: Optional[str] = None
    date: str
    platform: str
    views: int
    engagements: int
    shares: int
    comments: int
    likes: int
    clicks: int
    conversion_rate: Optional[float] = None

# Endpoints
@router.post(\"/drafts\", response_model=ContentDraft, status_code=status.HTTP_201_CREATED)
async def create_content_draft(draft: ContentDraftCreate, token: str = Depends(oauth2_scheme)):
    \"\"\"Create a new content draft.\"\"\"
    # TODO: Implement actual content draft creation with database
    # For now, return a mock draft
    
    now = datetime.now().isoformat()
    return {
        \"id\": str(uuid.uuid4()),
        \"project_id\": draft.project_id,
        \"content\": draft.content,
        \"version\": 1,
        \"status\": \"draft\",
        \"feedback\": None,
        \"created_by\": \"user123\",  # Would be the current user ID
        \"created_at\": now,
        \"updated_at\": now
    }

@router.get(\"/drafts\", response_model=List[ContentDraft])
async def get_content_drafts(
    project_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    token: str = Depends(oauth2_scheme)
):
    \"\"\"Get all content drafts, optionally filtered by project and status.\"\"\"
    # TODO: Implement actual content draft retrieval from database
    # For now, return mock drafts
    
    now = datetime.now().isoformat()
    drafts = [
        {
            \"id\": str(uuid.uuid4()),
            \"project_id\": project_id or \"project123\",
            \"content\": \"This is a draft of the email newsletter content...\",
            \"version\": 1,
            \"status\": \"draft\",
            \"feedback\": None,
            \"created_by\": \"user123\",
            \"created_at\": now,
            \"updated_at\": now
        },
        {
            \"id\": str(uuid.uuid4()),
            \"project_id\": project_id or \"project123\",
            \"content\": \"This is a revised draft of the email newsletter content...\",
            \"version\": 2,
            \"status\": \"in_review\",
            \"feedback\": \"Please add more details about the new product features.\",
            \"created_by\": \"user123\",
            \"created_at\": now,
            \"updated_at\": now
        }
    ]
    
    # Apply filters
    if status:
        drafts = [d for d in drafts if d[\"status\"] == status]
    
    return drafts[skip:skip+limit]

@router.get(\"/drafts/{draft_id}\", response_model=ContentDraft)
async def get_content_draft(draft_id: str = Path(...), token: str = Depends(oauth2_scheme)):
    \"\"\"Get a specific content draft by ID.\"\"\"
    # TODO: Implement actual content draft retrieval from database
    # For now, return a mock draft
    
    now = datetime.now().isoformat()
    return {
        \"id\": draft_id,
        \"project_id\": \"project123\",
        \"content\": \"This is a draft of the email newsletter content...\",
        \"version\": 1,
        \"status\": \"draft\",
        \"feedback\": None,
        \"created_by\": \"user123\",
        \"created_at\": now,
        \"updated_at\": now
    }

@router.put(\"/drafts/{draft_id}\", response_model=ContentDraft)
async def update_content_draft(
    draft_update: ContentDraftUpdate,
    draft_id: str = Path(...),
    token: str = Depends(oauth2_scheme)
):
    \"\"\"Update a specific content draft.\"\"\"
    # TODO: Implement actual content draft update with database
    # For now, return a mock updated draft
    
    now = datetime.now().isoformat()
    return {
        \"id\": draft_id,
        \"project_id\": \"project123\",
        \"content\": draft_update.content or \"This is a draft of the email newsletter content...\",
        \"version\": 1,
        \"status\": draft_update.status or \"draft\",
        \"feedback\": draft_update.feedback,
        \"created_by\": \"user123\",
        \"created_at\": now,
        \"updated_at\": now
    }

@router.delete(\"/drafts/{draft_id}\", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content_draft(draft_id: str = Path(...), token: str = Depends(oauth2_scheme)):
    \"\"\"Delete a specific content draft.\"\"\"
    # TODO: Implement actual content draft deletion from database
    # For now, return a successful response
    return None

@router.post(\"/calendar\", response_model=ContentCalendarEntry, status_code=status.HTTP_201_CREATED)
async def create_calendar_entry(entry: ContentCalendarCreate, token: str = Depends(oauth2_scheme)):
    \"\"\"Create a new content calendar entry.\"\"\"
    # TODO: Implement actual content calendar entry creation with database
    # For now, return a mock entry
    
    now = datetime.now().isoformat()
    return {
        \"id\": str(uuid.uuid4()),
        \"project_id\": entry.project_id,
        \"content_draft_id\": entry.content_draft_id,
        \"scheduled_date\": entry.scheduled_date,
        \"published_date\": None,
        \"status\": \"scheduled\",
        \"created_at\": now,
        \"updated_at\": now
    }

@router.get(\"/calendar\", response_model=List[ContentCalendarEntry])
async def get_calendar_entries(
    start_date: Optional[str] = Query(None, description=\"Start date (YYYY-MM-DD)\"),
    end_date: Optional[str] = Query(None, description=\"End date (YYYY-MM-DD)\"),
    brand_id: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    token: str = Depends(oauth2_scheme)
):
    \"\"\"Get content calendar entries within a date range, optionally filtered.\"\"\"
    # TODO: Implement actual calendar entry retrieval from database
    # For now, return mock calendar entries
    
    now = datetime.now().isoformat()
    today = datetime.now().date().isoformat()
    tomorrow = (datetime.now().date() + datetime.timedelta(days=1)).isoformat()
    next_week = (datetime.now().date() + datetime.timedelta(days=7)).isoformat()
    
    entries = [
        {
            \"id\": str(uuid.uuid4()),
            \"project_id\": project_id or \"project123\",
            \"content_draft_id\": \"draft123\",
            \"scheduled_date\": today,
            \"published_date\": None,
            \"status\": \"scheduled\",
            \"created_at\": now,
            \"updated_at\": now
        },
        {
            \"id\": str(uuid.uuid4()),
            \"project_id\": project_id or \"project456\",
            \"content_draft_id\": \"draft456\",
            \"scheduled_date\": tomorrow,
            \"published_date\": None,
            \"status\": \"scheduled\",
            \"created_at\": now,
            \"updated_at\": now
        },
        {
            \"id\": str(uuid.uuid4()),
            \"project_id\": project_id or \"project789\",
            \"content_draft_id\": \"draft789\",
            \"scheduled_date\": next_week,
            \"published_date\": None,
            \"status\": \"scheduled\",
            \"created_at\": now,
            \"updated_at\": now
        }
    ]
    
    # Apply filters
    if status:
        entries = [e for e in entries if e[\"status\"] == status]
    
    if start_date:
        entries = [e for e in entries if e[\"scheduled_date\"] >= start_date]
    
    if end_date:
        entries = [e for e in entries if e[\"scheduled_date\"] <= end_date]
    
    return entries

@router.get(\"/calendar/{entry_id}\", response_model=ContentCalendarEntry)
async def get_calendar_entry(entry_id: str = Path(...), token: str = Depends(oauth2_scheme)):
    \"\"\"Get a specific content calendar entry by ID.\"\"\"
    # TODO: Implement actual calendar entry retrieval from database
    # For now, return a mock entry
    
    now = datetime.now().isoformat()
    today = datetime.now().date().isoformat()
    
    return {
        \"id\": entry_id,
        \"project_id\": \"project123\",
        \"content_draft_id\": \"draft123\",
        \"scheduled_date\": today,
        \"published_date\": None,
        \"status\": \"scheduled\",
        \"created_at\": now,
        \"updated_at\": now
    }

@router.put(\"/calendar/{entry_id}\", response_model=ContentCalendarEntry)
async def update_calendar_entry(
    entry_update: ContentCalendarUpdate,
    entry_id: str = Path(...),
    token: str = Depends(oauth2_scheme)
):
    \"\"\"Update a specific content calendar entry.\"\"\"
    # TODO: Implement actual calendar entry update with database
    # For now, return a mock updated entry
    
    now = datetime.now().isoformat()
    today = datetime.now().date().isoformat()
    
    return {
        \"id\": entry_id,
        \"project_id\": \"project123\",
        \"content_draft_id\": entry_update.content_draft_id or \"draft123\",
        \"scheduled_date\": entry_update.scheduled_date or today,
        \"published_date\": None,
        \"status\": entry_update.status or \"scheduled\",
        \"created_at\": now,
        \"updated_at\": now
    }

@router.delete(\"/calendar/{entry_id}\", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calendar_entry(entry_id: str = Path(...), token: str = Depends(oauth2_scheme)):
    \"\"\"Delete a specific content calendar entry.\"\"\"
    # TODO: Implement actual calendar entry deletion from database
    # For now, return a successful response
    return None

@router.post(\"/calendar/{entry_id}/publish\", response_model=ContentCalendarEntry)
async def publish_content(entry_id: str = Path(...), token: str = Depends(oauth2_scheme)):
    \"\"\"Publish content from a calendar entry.\"\"\"
    # TODO: Implement actual content publishing
    # For now, return a mock published entry
    
    now = datetime.now().isoformat()
    today = datetime.now().date().isoformat()
    
    return {
        \"id\": entry_id,
        \"project_id\": \"project123\",
        \"content_draft_id\": \"draft123\",
        \"scheduled_date\": today,
        \"published_date\": now,
        \"status\": \"published\",
        \"created_at\": now,
        \"updated_at\": now
    }

@router.get(\"/topics\", response_model=List[ContentTopic])
async def get_content_topics(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    token: str = Depends(oauth2_scheme)
):
    \"\"\"Get all content topics.\"\"\"
    # TODO: Implement actual topic retrieval from database
    # For now, return mock topics
    
    topics = [
        {
            \"id\": str(uuid.uuid4()),
            \"name\": \"Content Marketing\",
            \"description\": \"Strategies and best practices for content marketing\",
            \"keywords\": [\"content strategy\", \"content creation\", \"content distribution\"]
        },
        {
            \"id\": str(uuid.uuid4()),
            \"name\": \"SEO\",
            \"description\": \"Search engine optimization techniques and tips\",
            \"keywords\": [\"search ranking\", \"keyword research\", \"backlinks\"]
        },
        {
            \"id\": str(uuid.uuid4()),
            \"name\": \"Social Media Marketing\",
            \"description\": \"Using social media platforms for marketing\",
            \"keywords\": [\"social engagement\", \"platform strategy\", \"community building\"]
        }
    ]
    
    return topics[skip:skip+limit]

@router.post(\"/topics\", response_model=ContentTopic, status_code=status.HTTP_201_CREATED)
async def create_content_topic(topic: ContentTopicCreate, token: str = Depends(oauth2_scheme)):
    \"\"\"Create a new content topic.\"\"\"
    # TODO: Implement actual topic creation with database
    # For now, return a mock topic
    
    return {
        \"id\": str(uuid.uuid4()),
        \"name\": topic.name,
        \"description\": topic.description,
        \"keywords\": topic.keywords
    }

@router.get(\"/performance\", response_model=List[ContentPerformance])
async def get_content_performance(
    start_date: Optional[str] = Query(None, description=\"Start date (YYYY-MM-DD)\"),
    end_date: Optional[str] = Query(None, description=\"End date (YYYY-MM-DD)\"),
    project_id: Optional[str] = Query(None),
    content_draft_id: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    token: str = Depends(oauth2_scheme)
):
    \"\"\"Get content performance metrics within a date range, optionally filtered.\"\"\"
    # TODO: Implement actual performance metrics retrieval from database
    # For now, return mock metrics
    
    today = datetime.now().date().isoformat()
    yesterday = (datetime.now().date() - datetime.timedelta(days=1)).isoformat()
    
    metrics = [
        {
            \"id\": str(uuid.uuid4()),
            \"project_id\": project_id or \"project123\",
            \"content_draft_id\": content_draft_id or \"draft123\",
            \"date\": today,
            \"platform\": \"facebook\",
            \"views\": 1200,
            \"engagements\": 150,
            \"shares\": 45,
            \"comments\": 30,
            \"likes\": 75,
            \"clicks\": 95,
            \"conversion_rate\": 2.5
        },
        {
            \"id\": str(uuid.uuid4()),
            \"project_id\": project_id or \"project123\",
            \"content_draft_id\": content_draft_id or \"draft123\",
            \"date\": yesterday,
            \"platform\": \"twitter\",
            \"views\": 950,
            \"engagements\": 120,
            \"shares\": 60,
            \"comments\": 15,
            \"likes\": 45,
            \"clicks\": 75,
            \"conversion_rate\": 1.8
        }
    ]
    
    # Apply filters
    if platform:
        metrics = [m for m in metrics if m[\"platform\"] == platform]
    
    if start_date:
        metrics = [m for m in metrics if m[\"date\"] >= start_date]
    
    if end_date:
        metrics = [m for m in metrics if m[\"date\"] <= end_date]
    
    return metrics
`
    },
    {
      `path`: `src/ultimate_marketing_team/api/routers/competitors.py`,
      `content`: `from fastapi import APIRouter, HTTPException, Depends, status, Query, Path, Body
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
import uuid

from src.ultimate_marketing_team.api.routers.auth import oauth2_scheme

router = APIRouter()

# Models
class CompetitorBase(BaseModel):
    name: str
    website_url: HttpUrl
    description: Optional[str] = None

class CompetitorCreate(CompetitorBase):
    pass

class Competitor(CompetitorBase):
    id: str
    brand_id: str
    created_at: str
    updated_at: str

class CompetitorDetail(Competitor):
    content: Optional[List[Dict[str, Any]]] = None

class CompetitorContentBase(BaseModel):
    content_url: HttpUrl
    content_type: str
    title: Optional[str] = None
    description: Optional[str] = None
    published_date: Optional[str] = None

class CompetitorContentCreate(CompetitorContentBase):
    pass

class CompetitorContent(CompetitorContentBase):
    id: str
    competitor_id: str
    engagement_metrics: Optional[Dict[str, Any]] = None
    created_at: str
    updated_at: str

class ContentAnalysisRequest(BaseModel):
    content_url: HttpUrl

class ContentAnalysisResponse(BaseModel):
    title: str
    content_type: str
    main_topic: str
    estimated_word_count: int
    engagement_metrics: Dict[str, Any]
    quality_assessment: Dict[str, float]
    key_takeaways: List[str]

# Endpoints
@router.post(\"/\", response_model=Competitor, status_code=status.HTTP_201_CREATED)
async def create_competitor(
    competitor: CompetitorCreate,
    brand_id: str = Query(..., description=\"ID of the brand to associate this competitor with\"),
    token: str = Depends(oauth2_scheme)
):
    \"\"\"Create a new competitor for a brand.\"\"\"
    # TODO: Implement actual competitor creation with database
    # For now, return a mock competitor
    
    now = datetime.now().isoformat()
    return {
        \"id\": str(uuid.uuid4()),
        \"name\": competitor.name,
        \"website_url\": str(competitor.website_url),
        \"description\": competitor.description,
        \"brand_id\": brand_id,
        \"created_at\": now,
        \"updated_at\": now
    }

@router.get(\"/\", response_model=List[Competitor])
async def get_competitors(
    brand_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    token: str = Depends(oauth2_scheme)
):
    \"\"\"Get all competitors, optionally filtered by brand.\"\"\"
    # TODO: Implement actual competitor retrieval from database
    # For now, return mock competitors
    
    now = datetime.now().isoformat()
    competitors = [
        {
            \"id\": str(uuid.uuid4()),
            \"name\": \"Competitor A\",
            \"website_url\": \"https://competitora.com\",
            \"description\": \"Our main competitor in the enterprise space\",
            \"brand_id\": brand_id or \"brand123\",
            \"created_at\": now,
            \"updated_at\": now
        },
        {
            \"id\": str(uuid.uuid4()),
            \"name\": \"Competitor B\",
            \"website_url\": \"https://competitorb.com\",
            \"description\": \"Rising competitor focused on SMB market\",
            \"brand_id\": brand_id or \"brand123\",
            \"created_at\": now,
            \"updated_at\": now
        }
    ]
    
    return competitors[skip:skip+limit]

@router.get(\"/{competitor_id}\", response_model=CompetitorDetail)
async def get_competitor(
    competitor_id: str = Path(...),
    include_content: bool = Query(False),
    token: str = Depends(oauth2_scheme)
):
    \"\"\"Get a specific competitor by ID.\"\"\"
    # TODO: Implement actual competitor retrieval from database
    # For now, return a mock competitor
    
    now = datetime.now().isoformat()
    last_week = (datetime.now().date() - datetime.timedelta(days=7)).isoformat()
    
    competitor = {
        \"id\": competitor_id,
        \"name\": \"Competitor A\",
        \"website_url\": \"https://competitora.com\",
        \"description\": \"Our main competitor in the enterprise space\",
        \"brand_id\": \"brand123\",
        \"created_at\": now,
        \"updated_at\": now
    }
    
    if include_content:
        competitor[\"content\"] = [
            {
                \"id\": str(uuid.uuid4()),
                \"content_url\": \"https://competitora.com/blog/marketing-trends-2025\",
                \"content_type\": \"blog_post\",
                \"title\": \"Marketing Trends to Watch in 2025\",
                \"published_date\": last_week,
                \"engagement_metrics\": {
                    \"estimated_views\": 2500,
                    \"social_shares\": 150
                }
            }
        ]
    
    return competitor

@router.put(\"/{competitor_id}\", response_model=Competitor)
async def update_competitor(
    competitor_update: CompetitorCreate,
    competitor_id: str = Path(...),
    token: str = Depends(oauth2_scheme)
):
    \"\"\"Update a specific competitor.\"\"\"
    # TODO: Implement actual competitor update with database
    # For now, return a mock updated competitor
    
    now = datetime.now().isoformat()
    return {
        \"id\": competitor_id,
        \"name\": competitor_update.name,
        \"website_url\": str(competitor_update.website_url),
        \"description\": competitor_update.description,
        \"brand_id\": \"brand123\",
        \"created_at\": now,
        \"updated_at\": now
    }

@router.delete(\"/{competitor_id}\", status_code=status.HTTP_204_NO_CONTENT)
async def delete_competitor(competitor_id: str = Path(...), token: str = Depends(oauth2_scheme)):
    \"\"\"Delete a specific competitor.\"\"\"
    # TODO: Implement actual competitor deletion from database
    # For now, return a successful response
    return None

@router.post(\"/{competitor_id}/content\", response_model=CompetitorContent, status_code=status.HTTP_201_CREATED)
async def create_competitor_content(
    content: CompetitorContentCreate,
    competitor_id: str = Path(...),
    token: str = Depends(oauth2_scheme)
):
    \"\"\"Track a piece of competitor content.\"\"\"
    # TODO: Implement actual competitor content creation with database
    # For now, return a mock content entry
    
    now = datetime.now().isoformat()
    return {
        \"id\": str(uuid.uuid4()),
        \"competitor_id\": competitor_id,
        \"content_url\": str(content.content_url),
        \"content_type\": content.content_type,
        \"title\": content.title,
        \"description\": content.description,
        \"published_date\": content.published_date,
        \"engagement_metrics\": {
            \"estimated_views\": 1500,
            \"social_shares\": {
                \"linkedin\": 45,
                \"twitter\": 75,
                \"facebook\": 30
            }
        },
        \"created_at\": now,
        \"updated_at\": now
    }

@router.get(\"/{competitor_id}/content\", response_model=List[CompetitorContent])
async def get_competitor_content(
    competitor_id: str = Path(...),
    content_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    token: str = Depends(oauth2_scheme)
):
    \"\"\"Get all content for a specific competitor, optionally filtered by content type.\"\"\"
    # TODO: Implement actual competitor content retrieval from database
    # For now, return mock content entries
    
    now = datetime.now().isoformat()
    last_week = (datetime.now().date() - datetime.timedelta(days=7)).isoformat()
    last_month = (datetime.now().date() - datetime.timedelta(days=30)).isoformat()
    
    content = [
        {
            \"id\": str(uuid.uuid4()),
            \"competitor_id\": competitor_id,
            \"content_url\": \"https://competitora.com/blog/marketing-trends-2025\",
            \"content_type\": \"blog_post\",
            \"title\": \"Marketing Trends to Watch in 2025\",
            \"description\": \"An analysis of upcoming marketing trends\",
            \"published_date\": last_week,
            \"engagement_metrics\": {
                \"estimated_views\": 2500,
                \"social_shares\": {
                    \"linkedin\": 85,
                    \"twitter\": 120,
                    \"facebook\": 60
                }
            },
            \"created_at\": now,
            \"updated_at\": now
        },
        {
            \"id\": str(uuid.uuid4()),
            \"competitor_id\": competitor_id,
            \"content_url\": \"https://competitora.com/resources/content-strategy-guide\",
            \"content_type\": \"whitepaper\",
            \"title\": \"Complete Content Strategy Guide\",
            \"description\": \"A comprehensive guide to content strategy\",
            \"published_date\": last_month,
            \"engagement_metrics\": {
                \"estimated_views\": 1200,
                \"social_shares\": {
                    \"linkedin\": 145,
                    \"twitter\": 50,
                    \"facebook\": 35
                }
            },
            \"created_at\": now,
            \"updated_at\": now
        }
    ]
    
    # Apply content type filter
    if content_type:
        content = [c for c in content if c[\"content_type\"] == content_type]
    
    return content[skip:skip+limit]

@router.post(\"/analyze-content\", response_model=ContentAnalysisResponse)
async def analyze_`
    }
  ]
}