from fastapi import WebSocket, WebSocketDisconnect, Depends, status
from typing import Dict, List, Any, Optional
import json
import asyncio
from datetime import datetime

from src.ultimate_marketing_team.core.security import get_current_user_from_token
from src.ultimate_marketing_team.core.messaging import AsyncRabbitMQClient
from src.ultimate_marketing_team.models.system import User

# Store active WebSocket connections
class ConnectionManager:
    def __init__(self):
        # Map of user_id -> list of connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Map of connection -> user_id
        self.connection_users: Dict[WebSocket, str] = {}
        # RabbitMQ client for message handling
        self.rabbitmq = AsyncRabbitMQClient()
        # Exchange to listen for events
        self.exchange_name = "events"
        # Queue for this service
        self.queue_name = "websocket_service"
        # Binding keys for different event types
        self.routing_keys = [
            "content.#",
            "project.#",
            "ad.#",
            "notification.#",
        ]
        # Initialize the consumer task
        self.consumer_task = None
        
    async def init_messaging(self):
        """Initialize messaging infrastructure."""
        await self.rabbitmq.connect()
        await self.rabbitmq.declare_exchange(self.exchange_name)
        await self.rabbitmq.declare_queue(self.queue_name)
        
        # Bind to routing keys
        for key in self.routing_keys:
            await self.rabbitmq.bind_queue_to_exchange(
                self.queue_name, 
                self.exchange_name, 
                key
            )
        
        # Start consuming messages
        if not self.consumer_task or self.consumer_task.done():
            self.consumer_task = asyncio.create_task(
                self.rabbitmq.consume(self.queue_name, self.handle_message)
            )
    
    async def handle_message(self, message: Dict[str, Any]):
        """Handle incoming messages from RabbitMQ."""
        # Extract routing key from message
        routing_key = message.get("routing_key", "")
        
        # Determine which users should receive this message
        target_users = []
        
        if routing_key.startswith("notification."):
            # Check if message has specific user target
            user_id = message.get("user_id")
            if user_id:
                target_users = [user_id]
            else:
                # Broadcast to all active users
                target_users = list(self.active_connections.keys())
        elif "target_users" in message:
            # Message has explicit target users
            target_users = message.get("target_users", [])
        else:
            # Broadcast to all users
            target_users = list(self.active_connections.keys())
        
        # Send the message to all targeted users
        for user_id in target_users:
            if user_id in self.active_connections:
                for connection in self.active_connections[user_id]:
                    await self.send_message(connection, message)
    
    async def connect(self, websocket: WebSocket, user: User):
        """Connect a new WebSocket with user authentication."""
        await websocket.accept()
        
        # Store the connection
        user_id = str(user.id)
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        self.connection_users[websocket] = user_id
        
        # Ensure messaging is initialized
        await self.init_messaging()
        
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
        # Cancel consumer task
        if self.consumer_task and not self.consumer_task.done():
            self.consumer_task.cancel()
            try:
                await self.consumer_task
            except asyncio.CancelledError:
                pass
        
        # Close RabbitMQ connection
        await self.rabbitmq.close()
        
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
async def websocket_endpoint(
    websocket: WebSocket,
    user: User = Depends(get_current_user_from_token)
):
    """WebSocket endpoint for client connections."""
    await manager.connect(websocket, user)
    
    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_text()
            try:
                # Parse client message
                message = json.loads(data)
                
                # Handle client-initiated messages (if needed)
                message_type = message.get("type")
                if message_type == "ping":
                    await manager.send_message(websocket, {"type": "pong"})
                elif message_type == "subscribe":
                    # Future implementation for specific subscriptions
                    pass
                
            except json.JSONDecodeError:
                # Invalid JSON, ignore
                pass
                
    except WebSocketDisconnect:
        # Client disconnected
        await manager.disconnect(websocket)