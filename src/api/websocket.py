from fastapi import WebSocket, WebSocketDisconnect, Depends, status
from typing import Dict, List, Any, Optional
import json
import asyncio
from datetime import datetime

from src.core.security import verify_token
from src.models.system import User

# Store active WebSocket connections
class ConnectionManager:
    def __init__(self):
        # Map of user_id -> list of connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Map of connection -> user_id
        self.connection_users: Dict[WebSocket, str] = {}
        
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
            if user_id in self.active_connections:
                self.active_connections[user_id].remove(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
            del self.connection_users[websocket]
    
    async def send_message(self, websocket: WebSocket, message: Dict[str, Any]):
        """Send a message to a specific WebSocket."""
        try:
            if isinstance(message, dict):
                await websocket.send_json(message)
            else:
                await websocket.send_text(str(message))
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
    
    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_text()
            try:
                # Parse client message
                message = json.loads(data)
                
                # Handle client-initiated messages
                message_type = message.get("type")
                if message_type == "ping":
                    await manager.send_message(websocket, {"type": "pong"})
                
            except json.JSONDecodeError:
                # Invalid JSON, ignore
                pass
                
    except WebSocketDisconnect:
        # Client disconnected
        await manager.disconnect(websocket)