import asyncio
from typing import Dict, Any, List, Optional, Set
import json
import uuid
from datetime import datetime

from src.api.websocket import manager
import logging

logger = logging.getLogger(__name__)

class WebSocketBridge:
    """Bridge between WebSockets for forwarding events to clients."""
    
    def __init__(self):
        self.running = False
        self.task = None
        self.event_queue = asyncio.Queue()
        self.content_rooms: Dict[str, str] = {}  # content_id -> room_id
    
    async def start(self):
        """Start the bridge."""
        if self.running:
            logger.warning("WebSocketBridge already running")
            return
            
        self.running = True
        logger.info("WebSocketBridge started")
        
        # Start event processor
        self.task = asyncio.create_task(self._process_events())
    
    async def stop(self):
        """Stop the bridge."""
        if not self.running:
            return
            
        self.running = False
        
        if self.task:
            try:
                self.task.cancel()
                await self.task
            except asyncio.CancelledError:
                pass
            
        logger.info("WebSocketBridge stopped")
    
    async def _process_events(self):
        """Process events from the queue."""
        try:
            while self.running:
                event = await self.event_queue.get()
                try:
                    await self._handle_event(event)
                except Exception as e:
                    logger.error(f"Error handling event: {e}")
                finally:
                    self.event_queue.task_done()
        except asyncio.CancelledError:
            logger.info("Event processor cancelled")
        except Exception as e:
            logger.error(f"Event processor error: {e}")
            
    async def _handle_event(self, event: Dict[str, Any]):
        """Handle an event."""
        event_type = event.get("type")
        
        if event_type == "content_update":
            # Forward content update to content room
            content_id = event.get("content_id")
            if not content_id:
                return
                
            room_id = self.content_rooms.get(content_id)
            if not room_id:
                return
                
            await manager.broadcast_to_room(room_id, event)
            
        elif event_type == "content_generation_progress":
            # Forward generation progress to user
            user_id = event.get("user_id")
            if not user_id:
                return
                
            await manager.broadcast_to_user(user_id, event)
            
        elif event_type == "content_version_created":
            # Forward version creation to content room
            content_id = event.get("content_id")
            if not content_id:
                return
                
            room_id = self.content_rooms.get(content_id)
            if not room_id:
                return
                
            await manager.broadcast_to_room(room_id, event)
            
        elif event_type == "broadcast_to_user":
            # Forward message to specific user
            user_id = event.get("user_id")
            if not user_id:
                return
                
            await manager.broadcast_to_user(user_id, event.get("message", {}))
            
        elif event_type == "broadcast_to_room":
            # Forward message to specific room
            room_id = event.get("room_id")
            if not room_id:
                return
                
            await manager.broadcast_to_room(room_id, event.get("message", {}))
    
    async def send_test_message(self, user_id: str, message: Dict[str, Any]):
        """Send a test message to a specific user."""
        try:
            await manager.broadcast_to_user(user_id, message)
        except Exception as e:
            logger.error(f"Error sending test message: {e}")
    
    async def register_content_room(self, content_id: str, room_id: str):
        """Register a content room for updates."""
        self.content_rooms[content_id] = room_id
        logger.info(f"Registered content {content_id} to room {room_id}")
        
    async def unregister_content_room(self, content_id: str):
        """Unregister a content room."""
        if content_id in self.content_rooms:
            del self.content_rooms[content_id]
            logger.info(f"Unregistered content {content_id}")
    
    async def queue_event(self, event: Dict[str, Any]):
        """Queue an event for processing."""
        await self.event_queue.put(event)
    
    async def notify_content_updated(self, content_id: str, user_id: str, update_data: Dict[str, Any]):
        """Notify that content has been updated."""
        if content_id in self.content_rooms:
            room_id = self.content_rooms[content_id]
            event = {
                "type": "content_updated",
                "room_id": room_id,
                "content_id": content_id,
                "user_id": user_id,
                "update_data": update_data,
                "timestamp": datetime.now().isoformat()
            }
            await self.queue_event(event)
    
    async def notify_content_version_created(self, content_id: str, version_id: str, user_id: str, version_data: Dict[str, Any]):
        """Notify that a new content version has been created."""
        if content_id in self.content_rooms:
            room_id = self.content_rooms[content_id]
            event = {
                "type": "content_version_created",
                "room_id": room_id,
                "content_id": content_id,
                "version_id": version_id,
                "user_id": user_id,
                "version_data": version_data,
                "timestamp": datetime.now().isoformat()
            }
            await self.queue_event(event)
    
    async def notify_content_comment_added(self, content_id: str, comment_id: str, user_id: str, comment_data: Dict[str, Any]):
        """Notify that a comment has been added to content."""
        if content_id in self.content_rooms:
            room_id = self.content_rooms[content_id]
            event = {
                "type": "content_comment_added",
                "room_id": room_id,
                "content_id": content_id,
                "comment_id": comment_id,
                "user_id": user_id,
                "comment_data": comment_data,
                "timestamp": datetime.now().isoformat()
            }
            await self.queue_event(event)
    
    async def notify_generation_progress(self, user_id: str, task_id: str, progress: float, status: str, task_data: Optional[Dict[str, Any]] = None):
        """Notify about content generation progress."""
        event = {
            "type": "content_generation_progress",
            "user_id": user_id,
            "task_id": task_id,
            "progress": progress,
            "status": status,
            "task_data": task_data or {},
            "timestamp": datetime.now().isoformat()
        }
        await self.queue_event(event)
    
    async def notify_ai_suggestion(self, content_id: str, suggestion_id: str, suggestion_text: str, suggestion_data: Dict[str, Any]):
        """Notify about an AI writing suggestion."""
        if content_id in self.content_rooms:
            room_id = self.content_rooms[content_id]
            event = {
                "type": "ai_suggestion",
                "room_id": room_id,
                "content_id": content_id,
                "suggestion_id": suggestion_id,
                "suggestion_text": suggestion_text,
                "suggestion_data": suggestion_data,
                "timestamp": datetime.now().isoformat()
            }
            await self.queue_event(event)
    
    async def notify_seo_tip(self, content_id: str, tip_id: str, tip_text: str, tip_data: Dict[str, Any]):
        """Notify about an SEO optimization tip."""
        if content_id in self.content_rooms:
            room_id = self.content_rooms[content_id]
            event = {
                "type": "seo_tip",
                "room_id": room_id,
                "content_id": content_id,
                "tip_id": tip_id,
                "tip_text": tip_text,
                "tip_data": tip_data,
                "timestamp": datetime.now().isoformat()
            }
            await self.queue_event(event)

# Create singleton instance
bridge = WebSocketBridge()

async def start_websocket_bridge():
    """Start the WebSocket bridge."""
    await bridge.start()

async def stop_websocket_bridge():
    """Stop the WebSocket bridge."""
    await bridge.stop()

async def register_content_room(content_id: str, room_id: str):
    """Register a content room for updates."""
    await bridge.register_content_room(content_id, room_id)

async def unregister_content_room(content_id: str):
    """Unregister a content room."""
    await bridge.unregister_content_room(content_id)

async def notify_content_updated(content_id: str, user_id: str, update_data: Dict[str, Any]):
    """Notify that content has been updated."""
    await bridge.notify_content_updated(content_id, user_id, update_data)

async def notify_content_version_created(content_id: str, version_id: str, user_id: str, version_data: Dict[str, Any]):
    """Notify that a new content version has been created."""
    await bridge.notify_content_version_created(content_id, version_id, user_id, version_data)

async def notify_content_comment_added(content_id: str, comment_id: str, user_id: str, comment_data: Dict[str, Any]):
    """Notify that a comment has been added to content."""
    await bridge.notify_content_comment_added(content_id, comment_id, user_id, comment_data)

async def notify_generation_progress(user_id: str, task_id: str, progress: float, status: str, task_data: Optional[Dict[str, Any]] = None):
    """Notify about content generation progress."""
    await bridge.notify_generation_progress(user_id, task_id, progress, status, task_data)

async def notify_ai_suggestion(content_id: str, suggestion_id: str, suggestion_text: str, suggestion_data: Dict[str, Any]):
    """Notify about an AI writing suggestion."""
    await bridge.notify_ai_suggestion(content_id, suggestion_id, suggestion_text, suggestion_data)

async def notify_seo_tip(content_id: str, tip_id: str, tip_text: str, tip_data: Dict[str, Any]):
    """Notify about an SEO optimization tip."""
    await bridge.notify_seo_tip(content_id, tip_id, tip_text, tip_data)