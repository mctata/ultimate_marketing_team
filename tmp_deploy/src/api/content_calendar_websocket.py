from fastapi import WebSocket, WebSocketDisconnect, Depends, status
from typing import Dict, List, Any, Optional, Set
import json
import asyncio
import uuid
from datetime import datetime

from src.core.security import verify_token
from src.core.database import get_db, SessionLocal
from src.models.content import ContentCalendar
from src.models.system import User
from src.core.api_metrics import ux_analytics_service
from sqlalchemy.orm import Session
import logging

# Setup logging
logger = logging.getLogger(__name__)

# WebSocket connection manager for calendar-specific functionality
class CalendarConnectionManager:
    def __init__(self):
        # Map of user_id -> list of connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Map of connection -> user_id
        self.connection_users: Dict[WebSocket, str] = {}
        # Map of project_id -> set of user_ids
        self.project_viewers: Dict[str, Set[str]] = {}
        # Map of user_id -> set of project_ids
        self.user_projects: Dict[str, Set[str]] = {}
        # Map of connection -> current_project_id
        self.connection_projects: Dict[WebSocket, str] = {}
        # Map of content_id -> set of user_ids editing
        self.content_editors: Dict[str, Set[str]] = {}
        # Map of project_id -> last modification timestamp
        self.project_last_modified: Dict[str, str] = {}
        # Map of content_id -> lock info (user_id, timestamp)
        self.content_locks: Dict[str, Dict[str, Any]] = {}
        
        # Track operations in progress to handle conflicts
        self.ongoing_operations: Dict[str, List[Dict[str, Any]]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a new WebSocket with user authentication."""
        await websocket.accept()
        
        # Store the connection
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        self.connection_users[websocket] = user_id
        
        # Send connection confirmation
        await self.send_message(websocket, {
            "type": "connection_status",
            "status": "connected",
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id
        })
    
    async def disconnect(self, websocket: WebSocket):
        """Disconnect a WebSocket."""
        if websocket in self.connection_users:
            user_id = self.connection_users[websocket]
            
            # Leave project if in one
            if websocket in self.connection_projects:
                project_id = self.connection_projects[websocket]
                await self.leave_project(websocket, project_id)
            
            # Remove from active connections
            if user_id in self.active_connections:
                self.active_connections[user_id].remove(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
            
            # Remove user mapping
            del self.connection_users[websocket]
    
    async def send_message(self, websocket: WebSocket, message: Dict[str, Any]):
        """Send a message to a specific WebSocket."""
        try:
            if isinstance(message, dict):
                await websocket.send_json(message)
            else:
                await websocket.send_text(str(message))
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            # Error sending message, likely connection is closed
            await self.disconnect(websocket)
    
    async def broadcast_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send a message to all connections for a specific user."""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await self.send_message(connection, message)
    
    async def broadcast_to_project(self, project_id: str, message: Dict[str, Any], exclude_websocket: WebSocket = None):
        """Send a message to all clients viewing a project except the sender if specified."""
        if project_id not in self.project_viewers:
            return
            
        # Get all user IDs viewing the project
        for user_id in self.project_viewers[project_id]:
            if user_id in self.active_connections:
                for connection in self.active_connections[user_id]:
                    # Skip sender if specified
                    if exclude_websocket and connection == exclude_websocket:
                        continue
                    await self.send_message(connection, message)
    
    async def join_project(self, websocket: WebSocket, project_id: str, user_data: Optional[Dict[str, Any]] = None):
        """Join a project's real-time updates."""
        user_id = self.connection_users.get(websocket)
        if not user_id:
            return False
            
        # Create project viewers set if it doesn't exist
        if project_id not in self.project_viewers:
            self.project_viewers[project_id] = set()
            self.project_last_modified[project_id] = datetime.now().isoformat()
        
        # Add user to project
        self.project_viewers[project_id].add(user_id)
        
        # Add project to user's projects
        if user_id not in self.user_projects:
            self.user_projects[user_id] = set()
        self.user_projects[user_id].add(project_id)
        
        # Track which project this connection is viewing
        self.connection_projects[websocket] = project_id
        
        # Get list of other users viewing the project
        other_users = []
        for uid in self.project_viewers[project_id]:
            if uid != user_id:
                other_users.append({
                    "user_id": uid,
                    "user_data": user_data or {}
                })
        
        # Send project join confirmation
        await self.send_message(websocket, {
            "type": "project_joined",
            "project_id": project_id,
            "users": list(self.project_viewers[project_id]),
            "user_details": other_users,
            "last_modified": self.project_last_modified[project_id],
            "timestamp": datetime.now().isoformat()
        })
        
        # Notify others about the new user
        await self.broadcast_to_project(project_id, {
            "type": "user_joined_project",
            "project_id": project_id,
            "user_id": user_id,
            "user_data": user_data or {},
            "timestamp": datetime.now().isoformat()
        }, exclude_websocket=websocket)
        
        # Send information about locked content
        locked_content = []
        for content_id, lock_info in self.content_locks.items():
            # Only include locks for this project
            if lock_info.get("project_id") == project_id:
                locked_content.append({
                    "content_id": content_id,
                    "locked_by": lock_info.get("user_id"),
                    "locked_at": lock_info.get("timestamp"),
                    "user_data": lock_info.get("user_data", {})
                })
        
        if locked_content:
            await self.send_message(websocket, {
                "type": "content_locks",
                "project_id": project_id,
                "locked_content": locked_content,
                "timestamp": datetime.now().isoformat()
            })
        
        return True
        
    async def leave_project(self, websocket: WebSocket, project_id: str):
        """Leave a project's real-time updates."""
        user_id = self.connection_users.get(websocket)
        if not user_id or project_id not in self.project_viewers:
            return False
            
        # Remove user from project
        if user_id in self.project_viewers[project_id]:
            self.project_viewers[project_id].remove(user_id)
            
        # Remove project from user's projects
        if user_id in self.user_projects and project_id in self.user_projects[user_id]:
            self.user_projects[user_id].remove(project_id)
            if not self.user_projects[user_id]:
                del self.user_projects[user_id]
                
        # Remove project tracking for this connection
        if websocket in self.connection_projects:
            del self.connection_projects[websocket]
        
        # Remove user's content locks for this project
        content_ids_to_remove = []
        for content_id, lock_info in self.content_locks.items():
            if lock_info.get("project_id") == project_id and lock_info.get("user_id") == user_id:
                content_ids_to_remove.append(content_id)
        
        for content_id in content_ids_to_remove:
            if content_id in self.content_locks:
                del self.content_locks[content_id]
                # Notify others that content is no longer locked
                await self.broadcast_to_project(project_id, {
                    "type": "content_unlocked",
                    "project_id": project_id,
                    "content_id": content_id,
                    "previously_locked_by": user_id,
                    "timestamp": datetime.now().isoformat()
                })
        
        # Delete project if empty
        if not self.project_viewers[project_id]:
            del self.project_viewers[project_id]
            if project_id in self.project_last_modified:
                del self.project_last_modified[project_id]
                
        # Notify others the user left
        await self.broadcast_to_project(project_id, {
            "type": "user_left_project",
            "project_id": project_id,
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        })
        
        return True
    
    async def lock_content(self, websocket: WebSocket, content_id: str, user_data: Optional[Dict[str, Any]] = None):
        """Lock a content item for editing."""
        user_id = self.connection_users.get(websocket)
        project_id = self.connection_projects.get(websocket)
        
        if not user_id or not project_id:
            return {"success": False, "reason": "Not connected to a project"}
        
        # Check if content is already locked
        if content_id in self.content_locks:
            lock_info = self.content_locks[content_id]
            if lock_info.get("user_id") != user_id:
                # Content is locked by someone else
                return {
                    "success": False, 
                    "reason": "Content is locked by another user",
                    "locked_by": lock_info.get("user_id"),
                    "locked_at": lock_info.get("timestamp")
                }
        
        # Lock the content
        self.content_locks[content_id] = {
            "user_id": user_id,
            "project_id": project_id,
            "timestamp": datetime.now().isoformat(),
            "user_data": user_data or {}
        }
        
        # Notify all users in the project
        await self.broadcast_to_project(project_id, {
            "type": "content_locked",
            "project_id": project_id,
            "content_id": content_id,
            "locked_by": user_id,
            "user_data": user_data or {},
            "timestamp": datetime.now().isoformat()
        })
        
        return {"success": True}
    
    async def unlock_content(self, websocket: WebSocket, content_id: str):
        """Unlock a content item."""
        user_id = self.connection_users.get(websocket)
        project_id = self.connection_projects.get(websocket)
        
        if not user_id or not project_id:
            return {"success": False, "reason": "Not connected to a project"}
        
        # Check if content is locked
        if content_id not in self.content_locks:
            return {"success": False, "reason": "Content is not locked"}
        
        # Check if the user is the one who locked it
        lock_info = self.content_locks[content_id]
        if lock_info.get("user_id") != user_id:
            return {"success": False, "reason": "Content is locked by another user"}
        
        # Unlock the content
        del self.content_locks[content_id]
        
        # Notify all users in the project
        await self.broadcast_to_project(project_id, {
            "type": "content_unlocked",
            "project_id": project_id,
            "content_id": content_id,
            "previously_locked_by": user_id,
            "timestamp": datetime.now().isoformat()
        })
        
        return {"success": True}
    
    async def force_unlock_content(self, admin_websocket: WebSocket, content_id: str):
        """Force unlock content (admin only)."""
        admin_id = self.connection_users.get(admin_websocket)
        if not admin_id:
            return {"success": False, "reason": "Not connected"}
        
        # Check if content is locked
        if content_id not in self.content_locks:
            return {"success": False, "reason": "Content is not locked"}
        
        # Get lock info before removing
        lock_info = self.content_locks[content_id]
        project_id = lock_info.get("project_id")
        previously_locked_by = lock_info.get("user_id")
        
        # Unlock the content
        del self.content_locks[content_id]
        
        # Notify all users in the project
        await self.broadcast_to_project(project_id, {
            "type": "content_force_unlocked",
            "project_id": project_id,
            "content_id": content_id,
            "previously_locked_by": previously_locked_by,
            "unlocked_by": admin_id,
            "timestamp": datetime.now().isoformat()
        })
        
        # Also notify the user who had it locked
        if previously_locked_by:
            await self.broadcast_to_user(previously_locked_by, {
                "type": "content_force_unlocked",
                "project_id": project_id,
                "content_id": content_id,
                "unlocked_by": admin_id,
                "timestamp": datetime.now().isoformat()
            })
        
        return {"success": True}
    
    async def notify_calendar_change(self, project_id: str, change_type: str, 
                                    content_id: str, data: Dict[str, Any], source_user_id: str):
        """Notify all users in a project about a calendar change."""
        # Update last modification timestamp
        self.project_last_modified[project_id] = datetime.now().isoformat()
        
        # Broadcast change to all users in the project
        await self.broadcast_to_project(project_id, {
            "type": "calendar_change",
            "project_id": project_id,
            "change_type": change_type,  # "create", "update", "delete", "publish"
            "content_id": content_id,
            "data": data,
            "source_user_id": source_user_id,
            "timestamp": datetime.now().isoformat()
        })
    
    async def start_operation(self, websocket: WebSocket, operation_id: str, 
                             operation_type: str, content_id: str, data: Dict[str, Any]):
        """
        Start tracking an operation to handle conflicts.
        Returns True if the operation can proceed, False if it conflicts.
        """
        user_id = self.connection_users.get(websocket)
        project_id = self.connection_projects.get(websocket)
        
        if not user_id or not project_id:
            return False
        
        # Check if there's a conflicting operation in progress
        if content_id in self.ongoing_operations:
            for op in self.ongoing_operations[content_id]:
                # If the same user has an operation in progress, it's ok
                if op["user_id"] == user_id:
                    continue
                    
                # Otherwise, it's a conflict
                if datetime.now().timestamp() - op["start_time"] < 30:  # 30-second window
                    return False
        
        # Track the operation
        if content_id not in self.ongoing_operations:
            self.ongoing_operations[content_id] = []
            
        self.ongoing_operations[content_id].append({
            "operation_id": operation_id,
            "operation_type": operation_type,
            "user_id": user_id,
            "start_time": datetime.now().timestamp(),
            "data": data
        })
        
        return True
    
    async def complete_operation(self, websocket: WebSocket, operation_id: str, content_id: str):
        """Mark an operation as complete."""
        user_id = self.connection_users.get(websocket)
        
        if not content_id in self.ongoing_operations:
            return
            
        # Remove the operation
        self.ongoing_operations[content_id] = [
            op for op in self.ongoing_operations[content_id] 
            if not (op["operation_id"] == operation_id and op["user_id"] == user_id)
        ]
        
        # Clean up empty lists
        if not self.ongoing_operations[content_id]:
            del self.ongoing_operations[content_id]

# Create global connection manager
calendar_manager = CalendarConnectionManager()

# Function to get the calendar connection manager
async def get_calendar_websocket_manager():
    """Dependency to get the calendar WebSocket connection manager."""
    return calendar_manager

# WebSocket endpoint for client connections
async def calendar_websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for calendar-specific client connections."""
    # Get token from query parameters
    token = websocket.query_params.get("token")
    
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing token")
        return
    
    # Verify token and get user ID
    user_id = verify_token(token)
    
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        return
    
    # Accept the connection
    await calendar_manager.connect(websocket, user_id)
    
    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_text()
            
            try:
                # Parse client message
                message = json.loads(data)
                message_type = message.get("type")
                
                # Get DB session for operations that need it
                db = SessionLocal()
                try:
                    # Handle client messages based on type
                    if message_type == "ping":
                        await calendar_manager.send_message(websocket, {"type": "pong"})
                    
                    elif message_type == "join_project":
                        project_id = message.get("project_id")
                        user_data = message.get("user_data", {})
                        
                        if project_id:
                            # Verify user has access to the project
                            user = db.query(User).filter(User.id == int(user_id)).first()
                            if not user:
                                await calendar_manager.send_message(websocket, {
                                    "type": "error",
                                    "error": "Authentication failed",
                                    "timestamp": datetime.now().isoformat()
                                })
                                continue
                            
                            # Here we'd check project access, but for simplicity we'll allow all users
                            # In a real implementation, you'd check user permissions
                            
                            success = await calendar_manager.join_project(websocket, project_id, user_data)
                            
                            if not success:
                                await calendar_manager.send_message(websocket, {
                                    "type": "error",
                                    "error": "Failed to join project",
                                    "timestamp": datetime.now().isoformat()
                                })
                    
                    elif message_type == "leave_project":
                        project_id = message.get("project_id")
                        
                        if project_id:
                            await calendar_manager.leave_project(websocket, project_id)
                    
                    elif message_type == "lock_content":
                        content_id = message.get("content_id")
                        user_data = message.get("user_data", {})
                        
                        if content_id:
                            result = await calendar_manager.lock_content(websocket, content_id, user_data)
                            
                            if not result.get("success"):
                                await calendar_manager.send_message(websocket, {
                                    "type": "error",
                                    "error": result.get("reason", "Failed to lock content"),
                                    "locked_by": result.get("locked_by"),
                                    "locked_at": result.get("locked_at"),
                                    "timestamp": datetime.now().isoformat()
                                })
                    
                    elif message_type == "unlock_content":
                        content_id = message.get("content_id")
                        
                        if content_id:
                            result = await calendar_manager.unlock_content(websocket, content_id)
                            
                            if not result.get("success"):
                                await calendar_manager.send_message(websocket, {
                                    "type": "error",
                                    "error": result.get("reason", "Failed to unlock content"),
                                    "timestamp": datetime.now().isoformat()
                                })
                    
                    elif message_type == "force_unlock_content":
                        content_id = message.get("content_id")
                        
                        if content_id:
                            # Check if user is an admin
                            user = db.query(User).filter(User.id == int(user_id)).first()
                            if not user or not user.is_superuser:
                                await calendar_manager.send_message(websocket, {
                                    "type": "error",
                                    "error": "Permission denied - admin access required",
                                    "timestamp": datetime.now().isoformat()
                                })
                                continue
                            
                            result = await calendar_manager.force_unlock_content(websocket, content_id)
                            
                            if not result.get("success"):
                                await calendar_manager.send_message(websocket, {
                                    "type": "error",
                                    "error": result.get("reason", "Failed to force unlock content"),
                                    "timestamp": datetime.now().isoformat()
                                })
                    
                    elif message_type == "start_operation":
                        operation_id = message.get("operation_id") or str(uuid.uuid4())
                        operation_type = message.get("operation_type")
                        content_id = message.get("content_id")
                        data = message.get("data", {})
                        
                        if operation_type and content_id:
                            can_proceed = await calendar_manager.start_operation(
                                websocket, operation_id, operation_type, content_id, data
                            )
                            
                            await calendar_manager.send_message(websocket, {
                                "type": "operation_status",
                                "operation_id": operation_id,
                                "status": "started" if can_proceed else "conflict",
                                "can_proceed": can_proceed,
                                "timestamp": datetime.now().isoformat()
                            })
                    
                    elif message_type == "complete_operation":
                        operation_id = message.get("operation_id")
                        content_id = message.get("content_id")
                        
                        if operation_id and content_id:
                            await calendar_manager.complete_operation(websocket, operation_id, content_id)
                            
                            await calendar_manager.send_message(websocket, {
                                "type": "operation_status",
                                "operation_id": operation_id,
                                "status": "completed",
                                "timestamp": datetime.now().isoformat()
                            })
                
                finally:
                    db.close()
                    
            except json.JSONDecodeError:
                # Invalid JSON, ignore
                pass
                
    except WebSocketDisconnect:
        # Client disconnected, clean up
        await calendar_manager.disconnect(websocket)

# Trigger calendar change notification (called from API endpoints)
async def notify_calendar_item_change(change_type: str, project_id: str, item_id: str, 
                                     data: Dict[str, Any], user_id: str):
    """
    Notify connected clients about calendar changes.
    This function is called from the API endpoints when content calendar items change.
    """
    await calendar_manager.notify_calendar_change(
        project_id=project_id,
        change_type=change_type,
        content_id=item_id,
        data=data,
        source_user_id=user_id
    )