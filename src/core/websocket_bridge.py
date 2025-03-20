import asyncio
from typing import Dict, Any, List, Optional
import json

from src.ultimate_marketing_team.api.websocket import manager
from src.ultimate_marketing_team.core.messaging import AsyncRabbitMQClient
from src.ultimate_marketing_team.core.logging import logger

class WebSocketBridge:
    """Bridge between RabbitMQ and WebSockets to forward events to clients."""
    
    def __init__(self):
        self.rabbitmq = AsyncRabbitMQClient()
        self.queue_name = "websocket_bridge"
        self.exchange_name = "events"
        self.routing_keys = [
            "content.#",
            "project.#",
            "ad.#",
            "notification.#"
        ]
        self.running = False
        self.task = None
    
    async def start(self):
        """Start the bridge."""
        if self.running:
            logger.warning("WebSocketBridge already running")
            return
            
        self.running = True
        
        try:
            # Connect to RabbitMQ
            await self.rabbitmq.connect()
            
            # Set up exchange and queue
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
            self.task = asyncio.create_task(
                self.rabbitmq.consume(self.queue_name, self.handle_message)
            )
            
            logger.info("WebSocketBridge started")
            
        except Exception as e:
            self.running = False
            logger.error(f"Error starting WebSocketBridge: {e}")
            raise
    
    async def stop(self):
        """Stop the bridge."""
        if not self.running:
            return
            
        self.running = False
        
        # Cancel task
        if self.task and not self.task.done():
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        
        # Close connection
        await self.rabbitmq.close()
        logger.info("WebSocketBridge stopped")
    
    async def handle_message(self, message: Dict[str, Any]):
        """Handle a message from RabbitMQ and forward to WebSockets."""
        try:
            # Extract routing key and determine type
            routing_key = message.get("routing_key", "")
            
            # Transform RabbitMQ message to WebSocket format
            ws_message = self.transform_message(routing_key, message)
            
            # Get target users
            target_users = []
            if "user_id" in message:
                # Direct message to specific user
                target_users = [message["user_id"]]
            elif "target_users" in message:
                # Message to specific list of users
                target_users = message["target_users"]
            else:
                # Broadcast to all users
                await manager.broadcast(ws_message)
                return
            
            # Send to specific users
            for user_id in target_users:
                await manager.broadcast_to_user(user_id, ws_message)
                
        except Exception as e:
            logger.error(f"Error in WebSocketBridge.handle_message: {e}")
    
    def transform_message(self, routing_key: str, message: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a RabbitMQ message to a WebSocket message format."""
        # Start with a base transformation
        ws_message = {
            "id": message.get("message_id"),
            "timestamp": message.get("timestamp")
        }
        
        # Transform based on routing key
        if routing_key.startswith("notification."):
            ws_message.update({
                "type": "notification",
                "notificationType": message.get("notification_type", "info"),
                "message": message.get("message", ""),
            })
        
        elif routing_key.startswith("content."):
            ws_message.update({
                "type": "content_update",
                "content": message.get("content"),
                "action": message.get("action", "update")
            })
        
        elif routing_key.startswith("project."):
            ws_message.update({
                "type": "project_update",
                "project": message.get("project"),
                "action": message.get("action", "update")
            })
        
        elif routing_key.startswith("ad."):
            ws_message.update({
                "type": "ad_update",
                "ad": message.get("ad"),
                "action": message.get("action", "update")
            })
        
        # Add original routing key for debugging
        ws_message["routing_key"] = routing_key
        
        return ws_message

# Create singleton instance
bridge = WebSocketBridge()

async def start_websocket_bridge():
    """Start the WebSocket bridge."""
    await bridge.start()

async def stop_websocket_bridge():
    """Stop the WebSocket bridge."""
    await bridge.stop()