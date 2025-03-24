from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, extract

from src.core.database import get_db
from src.core.security import get_current_user
from src.models.user import User
from src.models.content import ContentCalendar, ContentDraft, ContentPerformance
from src.models.project import Project

router = APIRouter(prefix="/api/v1/content-calendar", tags=["content-calendar"])

# ==================== Schemas ====================

from pydantic import BaseModel, Field

class ContentCalendarBase(BaseModel):
    project_id: int
    content_draft_id: Optional[int] = None
    scheduled_date: datetime
    status: str = "scheduled"
    
class ContentCalendarCreate(ContentCalendarBase):
    pass

class ContentCalendarUpdate(BaseModel):
    project_id: Optional[int] = None
    content_draft_id: Optional[int] = None
    scheduled_date: Optional[datetime] = None
    published_date: Optional[datetime] = None
    status: Optional[str] = None

class ContentCalendarResponse(ContentCalendarBase):
    id: int
    published_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Additional fields for frontend display
    title: Optional[str] = None
    content_type: Optional[str] = None
    platform: Optional[str] = None
    
    class Config:
        orm_mode = True

class ContentCalendarBulkCreate(BaseModel):
    items: List[ContentCalendarCreate]

class ContentCalendarBulkUpdate(BaseModel):
    item_ids: List[int]
    updates: ContentCalendarUpdate

class ContentCalendarPerformanceStats(BaseModel):
    hour_of_day: Optional[int] = None
    day_of_week: Optional[int] = None
    average_engagement: float
    total_posts: int

class BestTimeRecommendation(BaseModel):
    platform: str
    day_of_week: int
    hour_of_day: int
    average_engagement: float
    confidence: float

class SchedulingInsight(BaseModel):
    insight_type: str  # "gap", "conflict", "balance", "frequency"
    description: str
    severity: str  # "info", "warning", "critical"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    affected_content_ids: Optional[List[int]] = None
    recommendation: str

# ==================== Helper Functions ====================

def get_content_calendar_entry(db: Session, entry_id: int, user: User):
    """Get a content calendar entry and verify user has access to its project."""
    entry = db.query(ContentCalendar).filter(ContentCalendar.id == entry_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content calendar entry not found"
        )
    
    # Check if user has access to the project
    project = db.query(Project).filter(Project.id == entry.project_id).first()
    if not project or project.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this content calendar entry"
        )
        
    return entry

def enrich_calendar_entries(db: Session, entries: List[ContentCalendar]) -> List[ContentCalendarResponse]:
    """Enrich calendar entries with additional data for frontend display."""
    result = []
    
    for entry in entries:
        entry_dict = {
            "id": entry.id,
            "project_id": entry.project_id,
            "content_draft_id": entry.content_draft_id,
            "scheduled_date": entry.scheduled_date,
            "published_date": entry.published_date,
            "status": entry.status,
            "created_at": entry.created_at,
            "updated_at": entry.updated_at,
            "title": None,
            "content_type": None,
            "platform": None
        }
        
        # Get content draft info if available
        if entry.content_draft_id:
            draft = db.query(ContentDraft).filter(ContentDraft.id == entry.content_draft_id).first()
            if draft:
                # Extract a title from the content (first 50 chars)
                if draft.content:
                    entry_dict["title"] = draft.content[:50] + "..." if len(draft.content) > 50 else draft.content
                
                # You would need to add a content_type field to ContentDraft or infer it
                # entry_dict["content_type"] = draft.content_type
        
        result.append(ContentCalendarResponse(**entry_dict))
    
    return result

def detect_scheduling_conflicts(db: Session, project_id: int, 
                                start_date: datetime, end_date: datetime) -> List[SchedulingInsight]:
    """Detect scheduling conflicts, gaps, and imbalances in the calendar."""
    insights = []
    
    # Get all entries in the date range
    entries = db.query(ContentCalendar).filter(
        ContentCalendar.project_id == project_id,
        ContentCalendar.scheduled_date.between(start_date, end_date)
    ).order_by(ContentCalendar.scheduled_date).all()
    
    # Check for conflicts (multiple posts scheduled too close together)
    if entries:
        for i in range(len(entries) - 1):
            time_diff = entries[i+1].scheduled_date - entries[i].scheduled_date
            if time_diff < timedelta(hours=2):  # Configurable threshold
                insights.append(SchedulingInsight(
                    insight_type="conflict",
                    description=f"Content scheduled too close together ({time_diff.total_seconds() / 60} minutes apart)",
                    severity="warning",
                    start_date=entries[i].scheduled_date,
                    end_date=entries[i+1].scheduled_date,
                    affected_content_ids=[entries[i].id, entries[i+1].id],
                    recommendation="Consider spacing out content by at least 2 hours for better engagement"
                ))
                
    # Check for gaps (periods without any content)
    if entries:
        # Set a threshold for what constitutes a gap (e.g., 3 days)
        gap_threshold = timedelta(days=3)
        
        for i in range(len(entries) - 1):
            gap = entries[i+1].scheduled_date - entries[i].scheduled_date
            if gap > gap_threshold:
                insights.append(SchedulingInsight(
                    insight_type="gap",
                    description=f"Gap of {gap.days} days without scheduled content",
                    severity="info",
                    start_date=entries[i].scheduled_date,
                    end_date=entries[i+1].scheduled_date,
                    recommendation="Consider adding content during this period to maintain audience engagement"
                ))
    
    # Add more insights as needed...
    
    return insights

def generate_best_time_recommendations(db: Session, project_id: int) -> List[BestTimeRecommendation]:
    """Generate best time to post recommendations based on historical performance."""
    recommendations = []
    
    # Query performance data grouped by day of week and hour of day
    platforms = db.query(ContentPerformance.platform).filter(
        ContentPerformance.project_id == project_id
    ).distinct().all()
    
    for platform_tuple in platforms:
        platform = platform_tuple[0]
        
        # Get average engagement by day and hour for this platform
        performance_stats = db.query(
            extract('dow', ContentPerformance.date).label('day_of_week'),
            extract('hour', ContentPerformance.date).label('hour_of_day'),
            func.avg(ContentPerformance.engagements).label('avg_engagement'),
            func.count(ContentPerformance.id).label('total_posts')
        ).filter(
            ContentPerformance.project_id == project_id,
            ContentPerformance.platform == platform
        ).group_by(
            'day_of_week', 'hour_of_day'
        ).order_by(
            func.avg(ContentPerformance.engagements).desc()
        ).limit(3).all()
        
        for stat in performance_stats:
            # Skip if not enough data
            if stat.total_posts < 3:
                continue
                
            # Calculate confidence based on sample size
            confidence = min(1.0, stat.total_posts / 10)
            
            recommendations.append(BestTimeRecommendation(
                platform=platform,
                day_of_week=stat.day_of_week,
                hour_of_day=stat.hour_of_day,
                average_engagement=stat.avg_engagement,
                confidence=confidence
            ))
    
    return recommendations

# ==================== Endpoints ====================

@router.post("/", response_model=ContentCalendarResponse, status_code=status.HTTP_201_CREATED)
async def create_calendar_entry(
    entry: ContentCalendarCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new content calendar entry."""
    # Verify project exists and user has access
    project = db.query(Project).filter(Project.id == entry.project_id).first()
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project"
        )
        
    # Verify content draft exists if provided
    if entry.content_draft_id:
        draft = db.query(ContentDraft).filter(ContentDraft.id == entry.content_draft_id).first()
        if not draft:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content draft not found"
            )
    
    # Create new calendar entry
    db_entry = ContentCalendar(**entry.dict())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    # Prepare response object
    enriched_entry = enrich_calendar_entries(db, [db_entry])[0]
    
    # Send real-time notification
    try:
        from src.api.content_calendar_websocket import notify_calendar_item_change
        await notify_calendar_item_change(
            change_type="create",
            project_id=str(entry.project_id),
            item_id=str(db_entry.id),
            data=enriched_entry.dict(),
            user_id=str(current_user.id)
        )
    except Exception as e:
        # Log error but don't fail the request
        print(f"Error notifying calendar change: {e}")
    
    # Return enriched entry
    return enriched_entry

@router.get("/", response_model=List[ContentCalendarResponse])
def get_calendar_entries(
    project_id: int,
    start_date: datetime = Query(None),
    end_date: datetime = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get content calendar entries with optional filtering."""
    # Verify project exists and user has access
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project"
        )
    
    # Build query
    query = db.query(ContentCalendar).filter(ContentCalendar.project_id == project_id)
    
    # Apply filters
    if start_date and end_date:
        query = query.filter(ContentCalendar.scheduled_date.between(start_date, end_date))
    elif start_date:
        query = query.filter(ContentCalendar.scheduled_date >= start_date)
    elif end_date:
        query = query.filter(ContentCalendar.scheduled_date <= end_date)
    
    if status:
        query = query.filter(ContentCalendar.status == status)
    
    # Execute query
    entries = query.order_by(ContentCalendar.scheduled_date).all()
    
    # Return enriched entries
    return enrich_calendar_entries(db, entries)

@router.get("/{entry_id}", response_model=ContentCalendarResponse)
def get_calendar_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific content calendar entry by ID."""
    entry = get_content_calendar_entry(db, entry_id, current_user)
    return enrich_calendar_entries(db, [entry])[0]

@router.put("/{entry_id}", response_model=ContentCalendarResponse)
async def update_calendar_entry(
    entry_id: int,
    entry_update: ContentCalendarUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a content calendar entry."""
    db_entry = get_content_calendar_entry(db, entry_id, current_user)
    
    # Update fields
    update_data = entry_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_entry, key, value)
    
    db.commit()
    db.refresh(db_entry)
    
    # Prepare response object
    enriched_entry = enrich_calendar_entries(db, [db_entry])[0]
    
    # Send real-time notification
    try:
        from src.api.content_calendar_websocket import notify_calendar_item_change
        await notify_calendar_item_change(
            change_type="update",
            project_id=str(db_entry.project_id),
            item_id=str(db_entry.id),
            data=enriched_entry.dict(),
            user_id=str(current_user.id)
        )
    except Exception as e:
        # Log error but don't fail the request
        print(f"Error notifying calendar change: {e}")
    
    return enriched_entry

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calendar_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a content calendar entry."""
    db_entry = get_content_calendar_entry(db, entry_id, current_user)
    
    # Store project_id for notification before deleting
    project_id = db_entry.project_id
    entry_id_str = str(db_entry.id)
    
    # Get entry info for the notification
    entry_info = enrich_calendar_entries(db, [db_entry])[0].dict()
    
    # Delete the entry
    db.delete(db_entry)
    db.commit()
    
    # Send real-time notification
    try:
        from src.api.content_calendar_websocket import notify_calendar_item_change
        await notify_calendar_item_change(
            change_type="delete",
            project_id=str(project_id),
            item_id=entry_id_str,
            data=entry_info,
            user_id=str(current_user.id)
        )
    except Exception as e:
        # Log error but don't fail the request
        print(f"Error notifying calendar change: {e}")
    
    return {"status": "success"}

@router.post("/bulk", response_model=List[ContentCalendarResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_calendar_entries(
    entries: ContentCalendarBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create multiple calendar entries at once."""
    # Verify project access for all entries
    project_ids = set(entry.project_id for entry in entries.items)
    projects = db.query(Project).filter(Project.id.in_(project_ids)).all()
    accessible_project_ids = {p.id for p in projects if p.user_id == current_user.id}
    
    invalid_projects = project_ids - accessible_project_ids
    if invalid_projects:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Not authorized to access projects: {invalid_projects}"
        )
    
    # Create entries
    db_entries = []
    for entry in entries.items:
        db_entry = ContentCalendar(**entry.dict())
        db.add(db_entry)
        db_entries.append(db_entry)
    
    db.commit()
    for entry in db_entries:
        db.refresh(entry)
    
    # Prepare enriched entries for response
    enriched_entries = enrich_calendar_entries(db, db_entries)
    
    # Send real-time notifications for each entry by project
    try:
        from src.api.content_calendar_websocket import notify_calendar_item_change
        
        # Group entries by project for more efficient notifications
        entries_by_project = {}
        for i, entry in enumerate(db_entries):
            project_id = str(entry.project_id)
            if project_id not in entries_by_project:
                entries_by_project[project_id] = []
            entries_by_project[project_id].append((entry, enriched_entries[i]))
        
        # Send notifications for each project
        for project_id, project_entries in entries_by_project.items():
            # Send individual notifications for each entry
            for entry, enriched_entry in project_entries:
                await notify_calendar_item_change(
                    change_type="create",
                    project_id=project_id,
                    item_id=str(entry.id),
                    data=enriched_entry.dict(),
                    user_id=str(current_user.id)
                )
            
            # Also send a bulk notification
            await notify_calendar_item_change(
                change_type="bulk_create",
                project_id=project_id,
                item_id="bulk",
                data={
                    "count": len(project_entries),
                    "items": [e.dict() for _, e in project_entries]
                },
                user_id=str(current_user.id)
            )
    except Exception as e:
        # Log error but don't fail the request
        print(f"Error notifying bulk calendar changes: {e}")
    
    # Return enriched entries
    return enriched_entries

@router.put("/bulk", response_model=List[ContentCalendarResponse])
async def bulk_update_calendar_entries(
    updates: ContentCalendarBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update multiple calendar entries at once."""
    # Get all entries and verify access
    entries = db.query(ContentCalendar).filter(ContentCalendar.id.in_(updates.item_ids)).all()
    if len(entries) != len(updates.item_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Some calendar entries not found"
        )
    
    # Verify project access for all entries
    project_ids = {entry.project_id for entry in entries}
    projects = db.query(Project).filter(Project.id.in_(project_ids)).all()
    accessible_project_ids = {p.id for p in projects if p.user_id == current_user.id}
    
    invalid_projects = project_ids - accessible_project_ids
    if invalid_projects:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Not authorized to access some projects"
        )
    
    # Update entries
    update_data = updates.updates.dict(exclude_unset=True)
    for entry in entries:
        for key, value in update_data.items():
            setattr(entry, key, value)
    
    db.commit()
    for entry in entries:
        db.refresh(entry)
    
    # Prepare enriched entries for response
    enriched_entries = enrich_calendar_entries(db, entries)
    
    # Send real-time notifications for each entry by project
    try:
        from src.api.content_calendar_websocket import notify_calendar_item_change
        
        # Group entries by project for more efficient notifications
        entries_by_project = {}
        for i, entry in enumerate(entries):
            project_id = str(entry.project_id)
            if project_id not in entries_by_project:
                entries_by_project[project_id] = []
            entries_by_project[project_id].append((entry, enriched_entries[i]))
        
        # Send notifications for each project
        for project_id, project_entries in entries_by_project.items():
            # Send individual notifications for each entry
            for entry, enriched_entry in project_entries:
                await notify_calendar_item_change(
                    change_type="update",
                    project_id=project_id,
                    item_id=str(entry.id),
                    data=enriched_entry.dict(),
                    user_id=str(current_user.id)
                )
            
            # Also send a bulk notification
            await notify_calendar_item_change(
                change_type="bulk_update",
                project_id=project_id,
                item_id="bulk",
                data={
                    "count": len(project_entries),
                    "items": [e.dict() for _, e in project_entries],
                    "update_fields": list(update_data.keys())
                },
                user_id=str(current_user.id)
            )
    except Exception as e:
        # Log error but don't fail the request
        print(f"Error notifying bulk calendar changes: {e}")
    
    # Return enriched entries
    return enriched_entries

@router.post("/{entry_id}/publish", response_model=ContentCalendarResponse)
async def publish_content(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark content calendar entry as published."""
    db_entry = get_content_calendar_entry(db, entry_id, current_user)
    
    # Update status and published date
    db_entry.status = "published"
    db_entry.published_date = datetime.now()
    
    db.commit()
    db.refresh(db_entry)
    
    # Prepare response object
    enriched_entry = enrich_calendar_entries(db, [db_entry])[0]
    
    # Send real-time notification
    try:
        from src.api.content_calendar_websocket import notify_calendar_item_change
        await notify_calendar_item_change(
            change_type="publish",
            project_id=str(db_entry.project_id),
            item_id=str(db_entry.id),
            data=enriched_entry.dict(),
            user_id=str(current_user.id)
        )
    except Exception as e:
        # Log error but don't fail the request
        print(f"Error notifying calendar change: {e}")
    
    return enriched_entry

@router.get("/insights/conflicts", response_model=List[SchedulingInsight])
def get_scheduling_insights(
    project_id: int,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get scheduling insights for a date range."""
    # Verify project exists and user has access
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project"
        )
    
    # Get insights
    insights = detect_scheduling_conflicts(db, project_id, start_date, end_date)
    
    return insights

@router.get("/insights/best-times", response_model=List[BestTimeRecommendation])
def get_best_time_recommendations(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recommendations for best times to post based on historical performance."""
    # Verify project exists and user has access
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project"
        )
    
    # Get recommendations
    recommendations = generate_best_time_recommendations(db, project_id)
    
    return recommendations