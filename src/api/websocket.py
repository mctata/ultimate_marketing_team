from fastapi import WebSocket, WebSocketDisconnect, Depends, status
from typing import Dict, List, Any, Optional, Set
import json
import asyncio
import uuid
import time
from datetime import datetime
import statistics

from src.core.security import verify_token
from src.models.system import User
from src.core.api_metrics import ux_analytics_service

# Store active WebSocket connections
class ConnectionManager:
    def __init__(self):
        # Map of user_id -> list of connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Map of connection -> user_id
        self.connection_users: Dict[WebSocket, str] = {}
        # Map of room_id -> set of user_ids
        self.rooms: Dict[str, Set[str]] = {}
        # Map of user_id -> set of room_ids
        self.user_rooms: Dict[str, Set[str]] = {}
        # Map of connection -> current_room_id
        self.connection_rooms: Dict[WebSocket, str] = {}
        # Map of room_id -> content_state (for collaborative editing)
        self.room_content: Dict[str, Dict[str, Any]] = {}
        # Map of room_id -> typing users
        self.typing_users: Dict[str, Dict[str, Dict[str, Any]]] = {}
        # Map of room_id -> selection ranges
        self.user_selections: Dict[str, Dict[str, Dict[str, Any]]] = {}
        # Map of room_id -> comments
        self.room_comments: Dict[str, List[Dict[str, Any]]] = {}
        # Map of room_id -> cursors
        self.user_cursors: Dict[str, Dict[str, Dict[str, Any]]] = {}
        
        # Metrics tracking
        self.connection_start_times: Dict[WebSocket, float] = {}
        self.message_latencies: List[float] = []
        self.metrics_last_recorded = time.time()
        self.peak_concurrent_connections = 0
        self.connection_count = 0
        self.messages_sent = 0
        self.messages_received = 0
        self.bytes_sent = 0
        self.bytes_received = 0
        
        # Setup metrics recording task
        asyncio.create_task(self._record_metrics_periodically())
        
    async def _record_metrics_periodically(self):
        """Record WebSocket metrics periodically."""
        try:
            while True:
                await asyncio.sleep(60)  # Record metrics every minute
                
                now = time.time()
                duration = now - self.metrics_last_recorded
                self.metrics_last_recorded = now
                
                # Calculate total connections across all users
                total_connections = sum(len(conns) for conns in self.active_connections.values())
                
                # Update peak concurrent connections
                self.peak_concurrent_connections = max(self.peak_concurrent_connections, total_connections)
                
                # Calculate message latencies
                avg_latency = 0
                p95_latency = 0
                p99_latency = 0
                
                if self.message_latencies:
                    avg_latency = sum(self.message_latencies) / len(self.message_latencies)
                    sorted_latencies = sorted(self.message_latencies)
                    p95_index = int(len(sorted_latencies) * 0.95)
                    p99_index = int(len(sorted_latencies) * 0.99)
                    p95_latency = sorted_latencies[p95_index] if p95_index < len(sorted_latencies) else sorted_latencies[-1]
                    p99_latency = sorted_latencies[p99_index] if p99_index < len(sorted_latencies) else sorted_latencies[-1]
                
                # Record metrics
                await ux_analytics_service.record_websocket_metrics(
                    metric_type="connections",
                    connections=self.connection_count,
                    peak_connections=self.peak_concurrent_connections,
                    avg_connections=total_connections,
                )
                
                await ux_analytics_service.record_websocket_metrics(
                    metric_type="messages",
                    messages_sent=self.messages_sent,
                    messages_received=self.messages_received,
                    bytes_sent=self.bytes_sent,
                    bytes_received=self.bytes_received,
                )
                
                await ux_analytics_service.record_websocket_metrics(
                    metric_type="latency",
                    avg_latency_ms=avg_latency,
                    p95_latency_ms=p95_latency,
                    p99_latency_ms=p99_latency,
                )
                
                # Reset counters for next period
                self.message_latencies = []
                self.messages_sent = 0
                self.messages_received = 0
                self.bytes_sent = 0
                self.bytes_received = 0
                self.connection_count = 0
                
        except Exception as e:
            print(f"Error in websocket metrics recording: {e}")
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a new WebSocket with user authentication."""
        await websocket.accept()
        
        # Store the connection
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        self.connection_users[websocket] = user_id
        
        # Record connection start time for metrics
        self.connection_start_times[websocket] = time.time()
        self.connection_count += 1
        
        # Record connection in analytics
        device_info = {}
        for header, value in websocket.headers.items():
            if header.lower() == "user-agent":
                device_info["user_agent"] = value
        
        await ux_analytics_service.record_user_interaction(
            session_id=str(id(websocket)),
            event_type="connection",
            event_category="websocket",
            event_action="connect",
            user_id=int(user_id) if user_id.isdigit() else None,
            metadata=device_info
        )
        
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
            
            # Record connection duration for metrics
            if websocket in self.connection_start_times:
                duration_sec = time.time() - self.connection_start_times[websocket]
                
                # Record disconnection in analytics
                await ux_analytics_service.record_user_interaction(
                    session_id=str(id(websocket)),
                    event_type="connection",
                    event_category="websocket",
                    event_action="disconnect",
                    user_id=int(user_id) if user_id.isdigit() else None,
                    value=duration_sec,
                    metadata={"duration_sec": duration_sec}
                )
                
                # Clean up metrics tracking
                del self.connection_start_times[websocket]
            
            # Leave room if in one
            if websocket in self.connection_rooms:
                room_id = self.connection_rooms[websocket]
                await self.leave_room(websocket, room_id)
            
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
            # Start timing for latency measurement
            start_time = time.time()
            
            if isinstance(message, dict):
                # Track size of message
                message_str = json.dumps(message)
                bytes_count = len(message_str.encode('utf-8'))
                self.bytes_sent += bytes_count
                
                # Send the message
                await websocket.send_json(message)
            else:
                # Track size of message
                message_str = str(message)
                bytes_count = len(message_str.encode('utf-8'))
                self.bytes_sent += bytes_count
                
                # Send the message
                await websocket.send_text(message_str)
                
            # Record message latency
            latency_ms = (time.time() - start_time) * 1000
            self.message_latencies.append(latency_ms)
            self.messages_sent += 1
            
            # Record message in analytics for certain message types
            if isinstance(message, dict) and 'type' in message:
                message_type = message.get('type')
                if message_type in ['content_operation', 'user_joined_room', 'user_left_room', 
                                   'comment_added', 'comment_resolved']:
                    user_id = self.connection_users.get(websocket)
                    if user_id:
                        await ux_analytics_service.record_user_interaction(
                            session_id=str(id(websocket)),
                            event_type="message",
                            event_category="websocket",
                            event_action=f"send_{message_type}",
                            user_id=int(user_id) if user_id.isdigit() else None,
                            value=latency_ms,
                            metadata={"latency_ms": latency_ms, "size_bytes": bytes_count}
                        )
                
        except Exception as e:
            # Error sending message, likely connection is closed
            await self.disconnect(websocket)
    
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a message to all connected clients."""
        for connections in self.active_connections.values():
            for connection in connections:
                await self.send_message(connection, message)
    
    async def broadcast_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send a message to all connections for a specific user."""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await self.send_message(connection, message)
    
    async def broadcast_to_room(self, room_id: str, message: Dict[str, Any], exclude_websocket: WebSocket = None):
        """Send a message to all clients in a room except the sender if specified."""
        if room_id not in self.rooms:
            return
            
        # Get all user IDs in the room
        for user_id in self.rooms[room_id]:
            if user_id in self.active_connections:
                for connection in self.active_connections[user_id]:
                    # Skip sender if specified
                    if exclude_websocket and connection == exclude_websocket:
                        continue
                    await self.send_message(connection, message)
    
    async def join_room(self, websocket: WebSocket, room_id: str, content_id: Optional[str] = None, user_data: Optional[Dict[str, Any]] = None):
        """Join a collaborative editing room."""
        user_id = self.connection_users.get(websocket)
        if not user_id:
            return False
            
        # Create room if it doesn't exist
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
            self.typing_users[room_id] = {}
            self.user_selections[room_id] = {}
            self.user_cursors[room_id] = {}
            self.room_comments[room_id] = []
            
            # Initialize content state (if this is a content collaboration room)
            if content_id:
                self.room_content[room_id] = {
                    "content_id": content_id,
                    "version": 1,
                    "updates": [],
                    "last_updated": datetime.now().isoformat()
                }
        
        # Add user to room
        self.rooms[room_id].add(user_id)
        
        # Add room to user's rooms
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = set()
        self.user_rooms[user_id].add(room_id)
        
        # Track which room this connection is in
        self.connection_rooms[websocket] = room_id
        
        # Get list of other users in the room
        other_users = []
        for uid in self.rooms[room_id]:
            if uid != user_id:
                other_users.append({
                    "user_id": uid,
                    "typing": uid in self.typing_users.get(room_id, {}),
                    "selection": self.user_selections.get(room_id, {}).get(uid),
                    "cursor": self.user_cursors.get(room_id, {}).get(uid)
                })
        
        # Send room join confirmation
        await self.send_message(websocket, {
            "type": "room_joined",
            "room_id": room_id,
            "content_id": content_id,
            "users": list(self.rooms[room_id]),
            "user_details": other_users,
            "timestamp": datetime.now().isoformat()
        })
        
        # If content state exists, send it
        if room_id in self.room_content:
            await self.send_message(websocket, {
                "type": "content_state",
                "room_id": room_id,
                "content_id": self.room_content[room_id].get("content_id"),
                "version": self.room_content[room_id].get("version"),
                "timestamp": datetime.now().isoformat()
            })
            
        # If comments exist, send them
        if room_id in self.room_comments and self.room_comments[room_id]:
            await self.send_message(websocket, {
                "type": "room_comments",
                "room_id": room_id,
                "comments": self.room_comments[room_id],
                "timestamp": datetime.now().isoformat()
            })
        
        # Notify others about the new user
        await self.broadcast_to_room(room_id, {
            "type": "user_joined_room",
            "room_id": room_id,
            "user_id": user_id,
            "user_data": user_data or {},
            "timestamp": datetime.now().isoformat()
        }, exclude_websocket=websocket)
        
        return True
        
    async def leave_room(self, websocket: WebSocket, room_id: str):
        """Leave a collaborative editing room."""
        user_id = self.connection_users.get(websocket)
        if not user_id or room_id not in self.rooms:
            return False
            
        # Remove user from room
        if user_id in self.rooms[room_id]:
            self.rooms[room_id].remove(user_id)
            
        # Remove room from user's rooms
        if user_id in self.user_rooms and room_id in self.user_rooms[user_id]:
            self.user_rooms[user_id].remove(room_id)
            if not self.user_rooms[user_id]:
                del self.user_rooms[user_id]
                
        # Remove room tracking for this connection
        if websocket in self.connection_rooms:
            del self.connection_rooms[websocket]
            
        # Clean up user state in the room
        if room_id in self.typing_users and user_id in self.typing_users[room_id]:
            del self.typing_users[room_id][user_id]
            
        if room_id in self.user_selections and user_id in self.user_selections[room_id]:
            del self.user_selections[room_id][user_id]
            
        if room_id in self.user_cursors and user_id in self.user_cursors[room_id]:
            del self.user_cursors[room_id][user_id]
            
        # Delete room if empty
        if not self.rooms[room_id]:
            del self.rooms[room_id]
            if room_id in self.typing_users:
                del self.typing_users[room_id]
            if room_id in self.user_selections:
                del self.user_selections[room_id]
            if room_id in self.user_cursors:
                del self.user_cursors[room_id]
            if room_id in self.room_content:
                del self.room_content[room_id]
            if room_id in self.room_comments:
                del self.room_comments[room_id]
                
        # Notify others the user left
        await self.broadcast_to_room(room_id, {
            "type": "user_left_room",
            "room_id": room_id,
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        })
        
        return True
    
    async def update_user_status(self, websocket: WebSocket, status_type: str, status_data: Dict[str, Any]):
        """Update user status in a room (typing, cursor, selection)."""
        user_id = self.connection_users.get(websocket)
        room_id = self.connection_rooms.get(websocket)
        
        if not user_id or not room_id or room_id not in self.rooms:
            return False
            
        # Update the appropriate status based on type
        if status_type == "typing":
            # Update typing status
            if room_id not in self.typing_users:
                self.typing_users[room_id] = {}
                
            is_typing = status_data.get("is_typing", False)
            
            if is_typing:
                self.typing_users[room_id][user_id] = {
                    "timestamp": datetime.now().isoformat()
                }
            elif user_id in self.typing_users[room_id]:
                del self.typing_users[room_id][user_id]
                
            # Broadcast to others in room
            await self.broadcast_to_room(room_id, {
                "type": "user_typing",
                "room_id": room_id,
                "user_id": user_id,
                "is_typing": is_typing,
                "timestamp": datetime.now().isoformat()
            }, exclude_websocket=websocket)
            
        elif status_type == "selection":
            # Update selection status
            if room_id not in self.user_selections:
                self.user_selections[room_id] = {}
                
            selection = status_data.get("selection")
            
            if selection:
                self.user_selections[room_id][user_id] = {
                    "start": selection.get("start"),
                    "end": selection.get("end"),
                    "timestamp": datetime.now().isoformat()
                }
            elif user_id in self.user_selections[room_id]:
                del self.user_selections[room_id][user_id]
                
            # Broadcast to others in room
            await self.broadcast_to_room(room_id, {
                "type": "user_selection",
                "room_id": room_id,
                "user_id": user_id,
                "selection": selection,
                "timestamp": datetime.now().isoformat()
            }, exclude_websocket=websocket)
            
        elif status_type == "cursor":
            # Update cursor position
            if room_id not in self.user_cursors:
                self.user_cursors[room_id] = {}
                
            cursor = status_data.get("cursor")
            
            if cursor:
                self.user_cursors[room_id][user_id] = {
                    "position": cursor.get("position"),
                    "timestamp": datetime.now().isoformat()
                }
            elif user_id in self.user_cursors[room_id]:
                del self.user_cursors[room_id][user_id]
                
            # Broadcast to others in room
            await self.broadcast_to_room(room_id, {
                "type": "user_cursor",
                "room_id": room_id,
                "user_id": user_id,
                "cursor": cursor,
                "timestamp": datetime.now().isoformat()
            }, exclude_websocket=websocket)
            
        return True
    
    async def process_content_operation(self, websocket: WebSocket, operation: Dict[str, Any]):
        """Process a content editing operation."""
        user_id = self.connection_users.get(websocket)
        room_id = self.connection_rooms.get(websocket)
        
        if not user_id or not room_id or room_id not in self.rooms:
            return False
            
        # Get current content state
        if room_id not in self.room_content:
            return False
            
        # Get operation details
        op_type = operation.get("op_type")
        position = operation.get("position")
        length = operation.get("length", 0)
        text = operation.get("text", "")
        
        # Apply operation to content state
        # In a real implementation, we would use a more robust approach
        # like Operational Transformation or CRDT
        content_state = self.room_content[room_id]
        content_state["version"] += 1
        content_state["last_updated"] = datetime.now().isoformat()
        
        # Add operation to history
        content_state["updates"].append({
            "user_id": user_id,
            "op_type": op_type,
            "position": position,
            "length": length,
            "text": text,
            "timestamp": datetime.now().isoformat(),
            "version": content_state["version"]
        })
        
        # Broadcast the operation to others in the room
        await self.broadcast_to_room(room_id, {
            "type": "content_operation",
            "room_id": room_id,
            "user_id": user_id,
            "operation": {
                "op_type": op_type,
                "position": position,
                "length": length,
                "text": text
            },
            "version": content_state["version"],
            "timestamp": datetime.now().isoformat()
        }, exclude_websocket=websocket)
        
        return True
    
    async def add_comment(self, websocket: WebSocket, comment_data: Dict[str, Any]):
        """Add a comment to the content."""
        user_id = self.connection_users.get(websocket)
        room_id = self.connection_rooms.get(websocket)
        
        if not user_id or not room_id or room_id not in self.rooms:
            return False
            
        # Create comment
        comment_id = str(uuid.uuid4())
        comment = {
            "id": comment_id,
            "user_id": user_id,
            "text": comment_data.get("text", ""),
            "position": comment_data.get("position", 0),
            "resolved": False,
            "created_at": datetime.now().isoformat(),
            "replies": []
        }
        
        # Add comment to room
        if room_id not in self.room_comments:
            self.room_comments[room_id] = []
            
        self.room_comments[room_id].append(comment)
        
        # Broadcast to everyone in the room (including sender)
        await self.broadcast_to_room(room_id, {
            "type": "comment_added",
            "room_id": room_id,
            "comment": comment,
            "timestamp": datetime.now().isoformat()
        })
        
        return True
    
    async def reply_to_comment(self, websocket: WebSocket, reply_data: Dict[str, Any]):
        """Add a reply to a comment."""
        user_id = self.connection_users.get(websocket)
        room_id = self.connection_rooms.get(websocket)
        
        if not user_id or not room_id or room_id not in self.rooms:
            return False
            
        # Get comment ID
        comment_id = reply_data.get("comment_id")
        
        # Find the comment
        if room_id in self.room_comments:
            for comment in self.room_comments[room_id]:
                if comment["id"] == comment_id:
                    # Create reply
                    reply_id = str(uuid.uuid4())
                    reply = {
                        "id": reply_id,
                        "user_id": user_id,
                        "text": reply_data.get("text", ""),
                        "created_at": datetime.now().isoformat()
                    }
                    
                    # Add reply to comment
                    comment["replies"].append(reply)
                    
                    # Broadcast to everyone in the room
                    await self.broadcast_to_room(room_id, {
                        "type": "comment_reply_added",
                        "room_id": room_id,
                        "comment_id": comment_id,
                        "reply": reply,
                        "timestamp": datetime.now().isoformat()
                    })
                    
                    return True
                    
        return False
    
    async def resolve_comment(self, websocket: WebSocket, resolve_data: Dict[str, Any]):
        """Resolve a comment."""
        user_id = self.connection_users.get(websocket)
        room_id = self.connection_rooms.get(websocket)
        
        if not user_id or not room_id or room_id not in self.rooms:
            return False
            
        # Get comment ID
        comment_id = resolve_data.get("comment_id")
        
        # Find and resolve the comment
        if room_id in self.room_comments:
            for comment in self.room_comments[room_id]:
                if comment["id"] == comment_id:
                    comment["resolved"] = True
                    comment["resolved_by"] = user_id
                    comment["resolved_at"] = datetime.now().isoformat()
                    
                    # Broadcast to everyone in the room
                    await self.broadcast_to_room(room_id, {
                        "type": "comment_resolved",
                        "room_id": room_id,
                        "comment_id": comment_id,
                        "resolved_by": user_id,
                        "timestamp": datetime.now().isoformat()
                    })
                    
                    return True
                    
        return False
    
    async def shutdown(self):
        """Shutdown the connection manager."""        
        # Close all WebSockets
        for connections in self.active_connections.values():
            for connection in connections:
                try:
                    await connection.close(code=1000)
                except:
                    pass
        
        # Clear connection tracking
        self.active_connections = {}
        self.connection_users = {}
        self.rooms = {}
        self.user_rooms = {}
        self.connection_rooms = {}
        self.room_content = {}
        self.typing_users = {}
        self.user_selections = {}
        self.user_cursors = {}
        self.room_comments = {}

# Create global connection manager
manager = ConnectionManager()

async def get_websocket_manager():
    """Dependency to get the WebSocket connection manager."""
    return manager

# WebSocket endpoint for client connections
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for client connections."""
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
    await manager.connect(websocket, user_id)
    
    # For tracking user journey
    session_id = str(id(websocket))
    journey_path = []
    journey_start_time = datetime.now()
    current_page = websocket.headers.get("referer", "unknown")
    
    # Get device info
    user_agent = websocket.headers.get("user-agent", "")
    device_type = "unknown"
    if "mobile" in user_agent.lower():
        device_type = "mobile"
    elif "tablet" in user_agent.lower():
        device_type = "tablet"
    else:
        device_type = "desktop"
    
    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_text()
            
            # Track message metrics
            manager.messages_received += 1
            manager.bytes_received += len(data.encode('utf-8'))
            
            try:
                # Parse client message
                message = json.loads(data)
                
                # Record page navigation for journey tracking
                if message.get("type") == "page_view":
                    page_path = message.get("page", "")
                    if page_path:
                        # Record previous page duration
                        if journey_path and current_page != page_path:
                            prev_duration = (datetime.now() - (journey_path[-1].get("timestamp") 
                                               if journey_path else journey_start_time)).total_seconds()
                            journey_path.append({
                                "page": current_page,
                                "timestamp": datetime.now().isoformat(),
                                "duration": prev_duration
                            })
                        current_page = page_path
                        
                        # Record page view in analytics
                        await ux_analytics_service.record_user_interaction(
                            session_id=session_id,
                            event_type="view",
                            event_category="page",
                            event_action="page_view",
                            page_path=page_path,
                            user_id=int(user_id) if user_id.isdigit() else None,
                            device_type=device_type
                        )
                
                # Handle client-initiated messages and track feature usage
                message_type = message.get("type")
                feature_category = None
                
                if message_type == "ping":
                    await manager.send_message(websocket, {"type": "pong"})
                
                elif message_type == "join_room":
                    room_id = message.get("room_id")
                    content_id = message.get("content_id")
                    user_data = message.get("user_data", {})
                    
                    if room_id:
                        success = await manager.join_room(websocket, room_id, content_id, user_data)
                        feature_category = "collaboration"
                        
                        # Record feature usage metrics
                        await ux_analytics_service.record_user_interaction(
                            session_id=session_id,
                            event_type="feature_use",
                            event_category="collaboration",
                            event_action="join_room",
                            user_id=int(user_id) if user_id.isdigit() else None,
                            content_id=int(content_id) if content_id and content_id.isdigit() else None,
                            value=1.0,
                            metadata={"room_id": room_id, "success": success}
                        )
                
                elif message_type == "leave_room":
                    room_id = message.get("room_id")
                    
                    if room_id:
                        success = await manager.leave_room(websocket, room_id)
                        feature_category = "collaboration"
                        
                        # Record feature usage metrics
                        await ux_analytics_service.record_user_interaction(
                            session_id=session_id,
                            event_type="feature_use",
                            event_category="collaboration",
                            event_action="leave_room",
                            user_id=int(user_id) if user_id.isdigit() else None,
                            value=1.0,
                            metadata={"room_id": room_id, "success": success}
                        )
                
                elif message_type == "typing_status":
                    is_typing = message.get("is_typing", False)
                    await manager.update_user_status(websocket, "typing", {
                        "is_typing": is_typing
                    })
                    feature_category = "collaboration"
                    
                    # Record feature usage metrics (only when typing starts)
                    if is_typing:
                        await ux_analytics_service.record_user_interaction(
                            session_id=session_id,
                            event_type="feature_use",
                            event_category="collaboration",
                            event_action="typing_indicator",
                            user_id=int(user_id) if user_id.isdigit() else None,
                            value=1.0
                        )
                
                elif message_type == "cursor_position":
                    await manager.update_user_status(websocket, "cursor", {
                        "cursor": message.get("cursor")
                    })
                    feature_category = "collaboration"
                    
                    # Record feature usage periodically (not every cursor move)
                    if message.get("track_analytics", False):
                        await ux_analytics_service.record_user_interaction(
                            session_id=session_id,
                            event_type="feature_use",
                            event_category="collaboration",
                            event_action="cursor_sharing",
                            user_id=int(user_id) if user_id.isdigit() else None,
                            value=1.0
                        )
                
                elif message_type == "selection_change":
                    await manager.update_user_status(websocket, "selection", {
                        "selection": message.get("selection")
                    })
                    feature_category = "collaboration"
                    
                    # Record feature usage metrics (only when selection is shared)
                    if message.get("track_analytics", False):
                        await ux_analytics_service.record_user_interaction(
                            session_id=session_id,
                            event_type="feature_use",
                            event_category="collaboration",
                            event_action="selection_sharing",
                            user_id=int(user_id) if user_id.isdigit() else None,
                            value=1.0
                        )
                
                elif message_type == "content_operation":
                    operation = message.get("operation", {})
                    success = await manager.process_content_operation(websocket, operation)
                    feature_category = "collaboration"
                    
                    # Record feature usage metrics
                    await ux_analytics_service.record_user_interaction(
                        session_id=session_id,
                        event_type="feature_use",
                        event_category="collaboration",
                        event_action="content_editing",
                        user_id=int(user_id) if user_id.isdigit() else None,
                        value=1.0,
                        metadata={
                            "op_type": operation.get("op_type"),
                            "length": operation.get("length", 0),
                            "success": success
                        }
                    )
                
                elif message_type == "add_comment":
                    comment_data = message.get("comment", {})
                    success = await manager.add_comment(websocket, comment_data)
                    feature_category = "collaboration"
                    
                    # Record feature usage metrics
                    await ux_analytics_service.record_user_interaction(
                        session_id=session_id,
                        event_type="feature_use",
                        event_category="collaboration",
                        event_action="comment_add",
                        user_id=int(user_id) if user_id.isdigit() else None,
                        value=1.0,
                        metadata={
                            "text_length": len(comment_data.get("text", "")),
                            "success": success
                        }
                    )
                    
                    # Update feature usage aggregated metrics asynchronously
                    await ux_analytics_service.update_feature_usage_metrics(
                        feature_id="comment_add",
                        feature_category="collaboration",
                        user_id=int(user_id) if user_id.isdigit() else None,
                        duration_sec=0,
                        was_successful=success
                    )
                
                elif message_type == "reply_to_comment":
                    reply_data = message.get("reply", {})
                    success = await manager.reply_to_comment(websocket, reply_data)
                    feature_category = "collaboration"
                    
                    # Record feature usage metrics
                    await ux_analytics_service.record_user_interaction(
                        session_id=session_id,
                        event_type="feature_use",
                        event_category="collaboration",
                        event_action="comment_reply",
                        user_id=int(user_id) if user_id.isdigit() else None,
                        value=1.0,
                        metadata={
                            "text_length": len(reply_data.get("text", "")),
                            "success": success
                        }
                    )
                
                elif message_type == "resolve_comment":
                    resolve_data = message.get("resolve", {})
                    success = await manager.resolve_comment(websocket, resolve_data)
                    feature_category = "collaboration"
                    
                    # Record feature usage metrics
                    await ux_analytics_service.record_user_interaction(
                        session_id=session_id,
                        event_type="feature_use",
                        event_category="collaboration",
                        event_action="comment_resolve",
                        user_id=int(user_id) if user_id.isdigit() else None,
                        value=1.0,
                        metadata={"success": success}
                    )
                
                # Record AI assistant interactions
                elif message_type == "ai_suggestion":
                    suggestion_type = message.get("suggestion_type", "completion")
                    action = message.get("action", "generated")
                    
                    # Track AI suggestion interaction
                    await ux_analytics_service.record_ai_assistant_usage(
                        suggestion_type=suggestion_type,
                        action=action,
                        response_time_ms=message.get("response_time_ms"),
                        suggestion_length=message.get("length")
                    )
                    
                    # Record detailed interaction
                    await ux_analytics_service.record_user_interaction(
                        session_id=session_id,
                        event_type="feature_use",
                        event_category="ai_assistance",
                        event_action=f"{suggestion_type}_{action}",
                        user_id=int(user_id) if user_id.isdigit() else None,
                        value=message.get("response_time_ms", 0),
                        metadata={
                            "suggestion_type": suggestion_type,
                            "action": action,
                            "length": message.get("length", 0)
                        }
                    )
                
            except json.JSONDecodeError:
                # Invalid JSON, ignore
                pass
                
    except WebSocketDisconnect:
        # Record final page duration for journey
        if current_page:
            journey_path.append({
                "page": current_page,
                "timestamp": datetime.now().isoformat(),
                "duration": (datetime.now() - (journey_path[-1].get("timestamp") 
                             if journey_path else journey_start_time)).total_seconds()
            })
        
        # Record complete journey if it has at least one page
        if journey_path:
            journey_end_time = datetime.now()
            entry_page = journey_path[0]["page"] if journey_path else "unknown"
            exit_page = journey_path[-1]["page"] if journey_path else "unknown"
            
            # Record the user journey
            await ux_analytics_service.record_user_journey(
                session_id=session_id,
                path=journey_path,
                entry_page=entry_page,
                exit_page=exit_page,
                start_time=journey_start_time,
                end_time=journey_end_time,
                user_id=int(user_id) if user_id.isdigit() else None,
                device_type=device_type,
                completed_task=len(journey_path) > 1  # Simple heuristic for task completion
            )
        
        # Client disconnected, clean up
        await manager.disconnect(websocket)