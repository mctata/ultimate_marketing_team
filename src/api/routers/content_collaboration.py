from fastapi import APIRouter, Depends, HTTPException, Body, BackgroundTasks, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
import json
import uuid
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from src.core.security import get_current_user
from src.core.database import get_db
from src.models.content import ContentDraft, ContentVersionHistory, ContentCollaborator, ContentComment
from src.core.websocket_bridge import register_content_room, notify_content_updated, notify_content_version_created, notify_content_comment_added
from src.api.websocket import manager

# Models for API
class ContentVersionHistoryResponse(BaseModel):
    id: int
    version: int
    created_by: Optional[int] = None
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = None
    
class CommentResponse(BaseModel):
    id: int
    user_id: int
    text: str
    position: Optional[int] = None
    selection_path: Optional[str] = None
    selection_start: Optional[int] = None
    selection_end: Optional[int] = None
    resolved: bool = False
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    parent_id: Optional[int] = None
    replies: List["CommentResponse"] = []
    
class ContentCollaboratorResponse(BaseModel):
    user_id: int
    permission: str
    last_viewed_at: Optional[datetime] = None
    last_edited_at: Optional[datetime] = None
    
class ContentDetailResponse(BaseModel):
    id: int
    project_id: int
    content: str
    version: int
    status: str
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    version_history: List[ContentVersionHistoryResponse] = []
    collaborators: List[ContentCollaboratorResponse] = []
    comments: List[CommentResponse] = []
    
class CreateVersionRequest(BaseModel):
    content: str = Field(..., description="Content for the new version")
    changes: Optional[List[Dict[str, Any]]] = Field(None, description="Operations that led to this version")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class ContentOperationRequest(BaseModel):
    operation_type: str = Field(..., description="Type of operation (insert, delete, replace)")
    position: int = Field(..., description="Position in the document")
    text: Optional[str] = Field(None, description="Text to insert (for insert and replace)")
    length: Optional[int] = Field(None, description="Length of text to delete (for delete and replace)")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class CommentRequest(BaseModel):
    text: str = Field(..., description="Comment text")
    position: Optional[int] = Field(None, description="Position in the document")
    selection_path: Optional[str] = Field(None, description="Path to the selected element")
    selection_start: Optional[int] = Field(None, description="Start of text selection")
    selection_end: Optional[int] = Field(None, description="End of text selection")
    parent_id: Optional[int] = Field(None, description="ID of parent comment for replies")

class ResolveCommentRequest(BaseModel):
    resolved: bool = Field(True, description="Whether to mark the comment as resolved")

class CollaboratorRequest(BaseModel):
    user_id: int = Field(..., description="User ID to add/update as collaborator")
    permission: str = Field("view", description="Permission level (view, edit, approve)")

# Router definition
router = APIRouter(
    prefix="/content-collaboration",
    tags=["content-collaboration"],
    responses={404: {"description": "Not found"}},
)

@router.get("/{content_id}/versions", response_model=List[ContentVersionHistoryResponse])
async def get_content_versions(
    content_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get version history for a content item."""
    # Check access to content
    content_draft = db.query(ContentDraft).filter(ContentDraft.id == content_id).first()
    if not content_draft:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check permission
    collaborator = db.query(ContentCollaborator).filter(
        ContentCollaborator.content_draft_id == content_id,
        ContentCollaborator.user_id == user.id
    ).first()
    
    if not collaborator and content_draft.created_by != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get versions
    versions = db.query(ContentVersionHistory).filter(
        ContentVersionHistory.content_draft_id == content_id
    ).order_by(ContentVersionHistory.version.desc()).offset(offset).limit(limit).all()
    
    return [
        {
            "id": version.id,
            "version": version.version,
            "created_by": version.created_by,
            "created_at": version.created_at,
            "metadata": version.metadata
        }
        for version in versions
    ]

@router.get("/{content_id}/versions/{version_id}")
async def get_content_version(
    content_id: int,
    version_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific version of content."""
    # Check access to content
    content_draft = db.query(ContentDraft).filter(ContentDraft.id == content_id).first()
    if not content_draft:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check permission
    collaborator = db.query(ContentCollaborator).filter(
        ContentCollaborator.content_draft_id == content_id,
        ContentCollaborator.user_id == user.id
    ).first()
    
    if not collaborator and content_draft.created_by != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get version
    version = db.query(ContentVersionHistory).filter(
        ContentVersionHistory.content_draft_id == content_id,
        ContentVersionHistory.id == version_id
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return {
        "id": version.id,
        "content_id": content_id,
        "version": version.version,
        "content": version.content,
        "changes": version.changes,
        "metadata": version.metadata,
        "created_by": version.created_by,
        "created_at": version.created_at
    }

@router.post("/{content_id}/versions")
async def create_content_version(
    content_id: int,
    version_data: CreateVersionRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    """Create a new version of content."""
    # Check access to content
    content_draft = db.query(ContentDraft).filter(ContentDraft.id == content_id).first()
    if not content_draft:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check permission
    collaborator = db.query(ContentCollaborator).filter(
        ContentCollaborator.content_draft_id == content_id,
        ContentCollaborator.user_id == user.id
    ).first()
    
    if not collaborator or collaborator.permission not in ["edit", "approve"]:
        if content_draft.created_by != user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Create new version
    new_version = content_draft.version + 1
    
    # Add to version history
    version_history = ContentVersionHistory(
        content_draft_id=content_id,
        version=new_version,
        content=version_data.content,
        changes=version_data.changes,
        metadata=version_data.metadata,
        created_by=user.id
    )
    
    db.add(version_history)
    
    # Update content draft
    content_draft.content = version_data.content
    content_draft.version = new_version
    content_draft.updated_at = datetime.now()
    
    # Update collaborator record
    if collaborator:
        collaborator.last_edited_at = datetime.now()
    
    # Commit changes
    db.commit()
    db.refresh(version_history)
    
    # Notify clients via WebSocket
    if background_tasks:
        background_tasks.add_task(
            notify_content_version_created,
            content_id=str(content_id),
            version_id=str(version_history.id),
            user_id=str(user.id),
            version_data={
                "version": new_version,
                "created_at": version_history.created_at.isoformat()
            }
        )
    
    return {
        "id": version_history.id,
        "content_id": content_id,
        "version": new_version,
        "created_by": user.id,
        "created_at": version_history.created_at
    }

@router.post("/{content_id}/operation")
async def apply_content_operation(
    content_id: int,
    operation: ContentOperationRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    """Apply an operation to content (for real-time collaboration)."""
    # Check access to content
    content_draft = db.query(ContentDraft).filter(ContentDraft.id == content_id).first()
    if not content_draft:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check permission
    collaborator = db.query(ContentCollaborator).filter(
        ContentCollaborator.content_draft_id == content_id,
        ContentCollaborator.user_id == user.id
    ).first()
    
    if not collaborator or collaborator.permission not in ["edit", "approve"]:
        if content_draft.created_by != user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Apply operation (in a real implementation, you would use a more robust approach
    # like Operational Transformation or CRDT)
    content = content_draft.content
    position = operation.position
    
    if operation.operation_type == "insert":
        if not operation.text:
            raise HTTPException(status_code=400, detail="Text is required for insert operation")
        
        content = content[:position] + operation.text + content[position:]
    
    elif operation.operation_type == "delete":
        if not operation.length:
            raise HTTPException(status_code=400, detail="Length is required for delete operation")
        
        content = content[:position] + content[position + operation.length:]
    
    elif operation.operation_type == "replace":
        if not operation.text or not operation.length:
            raise HTTPException(status_code=400, detail="Text and length are required for replace operation")
        
        content = content[:position] + operation.text + content[position + operation.length:]
    
    else:
        raise HTTPException(status_code=400, detail="Invalid operation type")
    
    # Update content draft
    content_draft.content = content
    content_draft.updated_at = datetime.now()
    
    # Update collaborator record
    if collaborator:
        collaborator.last_edited_at = datetime.now()
    
    # Commit changes
    db.commit()
    
    # Notify clients via WebSocket
    if background_tasks:
        background_tasks.add_task(
            notify_content_updated,
            content_id=str(content_id),
            user_id=str(user.id),
            update_data={
                "operation": {
                    "operation_type": operation.operation_type,
                    "position": operation.position,
                    "text": operation.text,
                    "length": operation.length
                }
            }
        )
    
    return {"success": True}

@router.post("/{content_id}/comments")
async def add_comment(
    content_id: int,
    comment_data: CommentRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    """Add a comment to content."""
    # Check access to content
    content_draft = db.query(ContentDraft).filter(ContentDraft.id == content_id).first()
    if not content_draft:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check permission (anyone who can view can comment)
    collaborator = db.query(ContentCollaborator).filter(
        ContentCollaborator.content_draft_id == content_id,
        ContentCollaborator.user_id == user.id
    ).first()
    
    if not collaborator and content_draft.created_by != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # If this is a reply, check that parent exists
    if comment_data.parent_id:
        parent_comment = db.query(ContentComment).filter(
            ContentComment.id == comment_data.parent_id,
            ContentComment.content_draft_id == content_id
        ).first()
        
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")
    
    # Create comment
    comment = ContentComment(
        content_draft_id=content_id,
        user_id=user.id,
        parent_id=comment_data.parent_id,
        text=comment_data.text,
        position=comment_data.position,
        selection_path=comment_data.selection_path,
        selection_start=comment_data.selection_start,
        selection_end=comment_data.selection_end
    )
    
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    # Notify clients via WebSocket
    if background_tasks:
        background_tasks.add_task(
            notify_content_comment_added,
            content_id=str(content_id),
            comment_id=str(comment.id),
            user_id=str(user.id),
            comment_data={
                "id": comment.id,
                "text": comment.text,
                "position": comment.position,
                "selection_path": comment.selection_path,
                "selection_start": comment.selection_start,
                "selection_end": comment.selection_end,
                "parent_id": comment.parent_id,
                "created_at": comment.created_at.isoformat()
            }
        )
    
    return {
        "id": comment.id,
        "content_id": content_id,
        "user_id": user.id,
        "text": comment.text,
        "position": comment.position,
        "selection_path": comment.selection_path,
        "selection_start": comment.selection_start,
        "selection_end": comment.selection_end,
        "parent_id": comment.parent_id,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at
    }

@router.get("/{content_id}/comments")
async def get_comments(
    content_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    include_resolved: bool = Query(False)
):
    """Get comments for a content item."""
    # Check access to content
    content_draft = db.query(ContentDraft).filter(ContentDraft.id == content_id).first()
    if not content_draft:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check permission
    collaborator = db.query(ContentCollaborator).filter(
        ContentCollaborator.content_draft_id == content_id,
        ContentCollaborator.user_id == user.id
    ).first()
    
    if not collaborator and content_draft.created_by != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Query to get top-level comments
    query = db.query(ContentComment).filter(
        ContentComment.content_draft_id == content_id,
        ContentComment.parent_id == None  # Only get top-level comments
    )
    
    # Filter by resolved status if specified
    if not include_resolved:
        query = query.filter(ContentComment.resolved == False)
    
    # Get comments ordered by creation time
    comments = query.order_by(ContentComment.created_at.asc()).all()
    
    # Function to recursively build comment tree
    def build_comment_tree(comment):
        comment_dict = {
            "id": comment.id,
            "user_id": comment.user_id,
            "text": comment.text,
            "position": comment.position,
            "selection_path": comment.selection_path,
            "selection_start": comment.selection_start,
            "selection_end": comment.selection_end,
            "resolved": comment.resolved,
            "resolved_by": comment.resolved_by,
            "resolved_at": comment.resolved_at,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at,
            "parent_id": comment.parent_id,
            "replies": [build_comment_tree(reply) for reply in comment.replies 
                       if include_resolved or not reply.resolved]
        }
        return comment_dict
    
    return [build_comment_tree(comment) for comment in comments]

@router.put("/{content_id}/comments/{comment_id}/resolve")
async def resolve_comment(
    content_id: int,
    comment_id: int,
    resolve_data: ResolveCommentRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    """Resolve or unresolve a comment."""
    # Check that comment exists
    comment = db.query(ContentComment).filter(
        ContentComment.id == comment_id,
        ContentComment.content_draft_id == content_id
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check access to content
    content_draft = db.query(ContentDraft).filter(ContentDraft.id == content_id).first()
    if not content_draft:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check permission (must be original commenter, content creator, or editor)
    collaborator = db.query(ContentCollaborator).filter(
        ContentCollaborator.content_draft_id == content_id,
        ContentCollaborator.user_id == user.id
    ).first()
    
    can_resolve = (
        user.id == comment.user_id or  # Original commenter
        user.id == content_draft.created_by or  # Content creator
        (collaborator and collaborator.permission in ["edit", "approve"])  # Editor
    )
    
    if not can_resolve:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update comment
    if resolve_data.resolved and not comment.resolved:
        comment.resolved = True
        comment.resolved_by = user.id
        comment.resolved_at = datetime.now()
    elif not resolve_data.resolved and comment.resolved:
        comment.resolved = False
        comment.resolved_by = None
        comment.resolved_at = None
    
    db.commit()
    db.refresh(comment)
    
    # TODO: Add WebSocket notification
    
    return {
        "id": comment.id,
        "resolved": comment.resolved,
        "resolved_by": comment.resolved_by,
        "resolved_at": comment.resolved_at
    }

@router.post("/{content_id}/collaborators")
async def add_collaborator(
    content_id: int,
    collaborator_data: CollaboratorRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add or update a collaborator for content."""
    # Check access to content
    content_draft = db.query(ContentDraft).filter(ContentDraft.id == content_id).first()
    if not content_draft:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check permission (must be content creator or have approval permission)
    collaborator = db.query(ContentCollaborator).filter(
        ContentCollaborator.content_draft_id == content_id,
        ContentCollaborator.user_id == user.id
    ).first()
    
    can_manage_collaborators = (
        user.id == content_draft.created_by or  # Content creator
        (collaborator and collaborator.permission == "approve")  # Approver
    )
    
    if not can_manage_collaborators:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if collaborator already exists
    existing_collaborator = db.query(ContentCollaborator).filter(
        ContentCollaborator.content_draft_id == content_id,
        ContentCollaborator.user_id == collaborator_data.user_id
    ).first()
    
    if existing_collaborator:
        # Update existing
        existing_collaborator.permission = collaborator_data.permission
        db.commit()
        return {"user_id": existing_collaborator.user_id, "permission": existing_collaborator.permission}
    else:
        # Create new
        new_collaborator = ContentCollaborator(
            content_draft_id=content_id,
            user_id=collaborator_data.user_id,
            permission=collaborator_data.permission
        )
        
        db.add(new_collaborator)
        db.commit()
        db.refresh(new_collaborator)
        
        return {"user_id": new_collaborator.user_id, "permission": new_collaborator.permission}

@router.get("/{content_id}/collaborators")
async def get_collaborators(
    content_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get collaborators for a content item."""
    # Check access to content
    content_draft = db.query(ContentDraft).filter(ContentDraft.id == content_id).first()
    if not content_draft:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check permission
    collaborator = db.query(ContentCollaborator).filter(
        ContentCollaborator.content_draft_id == content_id,
        ContentCollaborator.user_id == user.id
    ).first()
    
    if not collaborator and content_draft.created_by != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get collaborators
    collaborators = db.query(ContentCollaborator).filter(
        ContentCollaborator.content_draft_id == content_id
    ).all()
    
    return [
        {
            "user_id": c.user_id,
            "permission": c.permission,
            "last_viewed_at": c.last_viewed_at,
            "last_edited_at": c.last_edited_at
        }
        for c in collaborators
    ]

@router.delete("/{content_id}/collaborators/{user_id}")
async def remove_collaborator(
    content_id: int,
    user_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a collaborator from content."""
    # Check access to content
    content_draft = db.query(ContentDraft).filter(ContentDraft.id == content_id).first()
    if not content_draft:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check permission (must be content creator or have approval permission)
    collaborator = db.query(ContentCollaborator).filter(
        ContentCollaborator.content_draft_id == content_id,
        ContentCollaborator.user_id == current_user.id
    ).first()
    
    can_manage_collaborators = (
        current_user.id == content_draft.created_by or  # Content creator
        (collaborator and collaborator.permission == "approve")  # Approver
    )
    
    if not can_manage_collaborators:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Find and delete collaborator
    target_collaborator = db.query(ContentCollaborator).filter(
        ContentCollaborator.content_draft_id == content_id,
        ContentCollaborator.user_id == user_id
    ).first()
    
    if not target_collaborator:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    
    db.delete(target_collaborator)
    db.commit()
    
    return {"success": True}

@router.websocket("/ws/{content_id}")
async def content_collaboration_websocket(
    websocket: WebSocket,
    content_id: str
):
    """WebSocket endpoint for real-time content collaboration."""
    # Get token from query parameters
    token = websocket.query_params.get("token")
    
    if not token:
        await websocket.close(code=1008, reason="Missing token")
        return
    
    # Verify token and get user ID
    from src.core.security import verify_token
    user_id = verify_token(token)
    
    if not user_id:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    # Create a unique room ID for this content
    room_id = f"content_{content_id}"
    
    # Accept the connection and join the room
    await manager.connect(websocket, user_id)
    await manager.join_room(websocket, room_id, content_id)
    
    # Register the room for content updates
    await register_content_room(content_id, room_id)
    
    try:
        # Handle WebSocket messages - already implemented in websocket.py
        # This is just a special endpoint for content collaboration
        while True:
            await websocket.receive_text()  # This keeps the connection open
    except WebSocketDisconnect:
        # Client disconnected
        await manager.disconnect(websocket)