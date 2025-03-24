import asyncio
import json
import pytest
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocketDisconnect
import jwt
from typing import Dict, Any, List
import time

from src.api.main import app
from src.core.settings import settings
from src.core.database import Base, engine, get_db
from src.models.content import ContentCalendar
from src.models.system import User, Project
from sqlalchemy.orm import Session

# Setup test database
@pytest.fixture(scope="module")
def test_db():
    # Create test database tables
    Base.metadata.create_all(bind=engine)
    
    # Get a test database session
    db = next(get_db())
    
    # Create test user
    test_user = User(
        email="test@example.com",
        hashed_password="$2b$12$FD6zqKbNBGZe0NiAP/B4dOUWF1JT4sZNMpHoFK/Kv0SxWus.g4FWC",  # "password"
        is_active=True,
        is_superuser=False,
        full_name="Test User"
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    # Create test project
    test_project = Project(
        name="Test Project",
        description="Test project for WebSocket tests",
        user_id=test_user.id
    )
    db.add(test_project)
    db.commit()
    db.refresh(test_project)
    
    # Create test calendar entries
    for i in range(3):
        entry = ContentCalendar(
            project_id=test_project.id,
            scheduled_date=f"2025-04-0{i+1}T09:00:00",
            status="scheduled"
        )
        db.add(entry)
    
    db.commit()
    
    yield db
    
    # Clean up
    db.query(ContentCalendar).delete()
    db.query(Project).delete()
    db.query(User).delete()
    db.commit()
    db.close()

@pytest.fixture
def test_user_token():
    """Create a test JWT token for websocket authentication."""
    payload = {
        "sub": "1",  # Test user ID is 1
        "exp": int(time.time()) + 3600  # 1 hour expiry
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token

@pytest.fixture
def test_client():
    """Create a test client for HTTP requests."""
    with TestClient(app) as client:
        yield client

class WebSocketTestClient:
    """Test client for WebSocket connections."""
    
    def __init__(self, url: str, token: str):
        self.url = url
        self.token = token
        self.client = TestClient(app)
        self.received_messages = []
        
    def connect(self):
        """Connect to the WebSocket."""
        ws_url = f"{self.url}?token={self.token}"
        return self.client.websocket_connect(ws_url)
    
    async def receive_messages(self, websocket, count=1, timeout=5):
        """Receive a specific number of messages or until timeout."""
        messages = []
        for _ in range(count):
            try:
                # Set a timeout for receiving messages
                message = await asyncio.wait_for(websocket.receive_text(), timeout)
                messages.append(json.loads(message))
            except asyncio.TimeoutError:
                break
            except WebSocketDisconnect:
                break
        
        return messages

@pytest.mark.asyncio
async def test_websocket_connection(test_db, test_user_token):
    """Test WebSocket connection and authentication."""
    client = WebSocketTestClient("/ws/calendar", test_user_token)
    
    # Connect to the WebSocket
    with client.connect() as websocket:
        # The first message should be the connection confirmation
        messages = await client.receive_messages(websocket, count=1)
        
        assert len(messages) == 1
        assert messages[0]["type"] == "connection_status"
        assert messages[0]["status"] == "connected"
        assert messages[0]["user_id"] == "1"  # Test user ID

@pytest.mark.asyncio
async def test_join_project(test_db, test_user_token):
    """Test joining a project for real-time updates."""
    client = WebSocketTestClient("/ws/calendar", test_user_token)
    
    # Connect to the WebSocket
    with client.connect() as websocket:
        # Skip the connection confirmation
        await client.receive_messages(websocket, count=1)
        
        # Join project
        await websocket.send_text(json.dumps({
            "type": "join_project",
            "project_id": "1",  # Test project ID
            "user_data": {
                "name": "Test User",
                "avatar": "https://example.com/avatar.png"
            }
        }))
        
        # Receive join confirmation
        messages = await client.receive_messages(websocket, count=1)
        
        assert len(messages) == 1
        assert messages[0]["type"] == "project_joined"
        assert messages[0]["project_id"] == "1"
        assert "users" in messages[0]
        assert "1" in messages[0]["users"]  # Test user ID

@pytest.mark.asyncio
async def test_lock_content(test_db, test_user_token):
    """Test locking content for editing."""
    client = WebSocketTestClient("/ws/calendar", test_user_token)
    
    # Connect to the WebSocket
    with client.connect() as websocket:
        # Skip the connection confirmation
        await client.receive_messages(websocket, count=1)
        
        # Join project
        await websocket.send_text(json.dumps({
            "type": "join_project",
            "project_id": "1"  # Test project ID
        }))
        
        # Skip join confirmation
        await client.receive_messages(websocket, count=1)
        
        # Lock content
        await websocket.send_text(json.dumps({
            "type": "lock_content",
            "content_id": "1",  # Test content ID
            "user_data": {
                "name": "Test User"
            }
        }))
        
        # Receive lock confirmation
        messages = await client.receive_messages(websocket, count=1)
        
        assert len(messages) == 1
        assert messages[0]["type"] == "content_locked"
        assert messages[0]["content_id"] == "1"
        assert messages[0]["locked_by"] == "1"  # Test user ID

@pytest.mark.asyncio
async def test_real_time_updates(test_db, test_user_token, test_client):
    """Test receiving real-time updates when calendar items change."""
    client = WebSocketTestClient("/ws/calendar", test_user_token)
    
    # First authorize for HTTP requests
    auth_response = test_client.post("/api/v1/auth/token", data={
        "username": "test@example.com",
        "password": "password"
    })
    
    if auth_response.status_code != 200:
        # For this test, we'll create a token manually if the auth endpoint isn't available
        http_token = test_user_token
    else:
        http_token = auth_response.json()["access_token"]
    
    # Connect to the WebSocket
    with client.connect() as websocket:
        # Skip the connection confirmation
        await client.receive_messages(websocket, count=1)
        
        # Join project
        await websocket.send_text(json.dumps({
            "type": "join_project",
            "project_id": "1"  # Test project ID
        }))
        
        # Skip join confirmation
        await client.receive_messages(websocket, count=1)
        
        # Create a new calendar entry via HTTP API
        create_response = test_client.post(
            "/api/v1/content-calendar/",
            json={
                "project_id": 1,
                "scheduled_date": "2025-04-04T09:00:00",
                "status": "scheduled"
            },
            headers={"Authorization": f"Bearer {http_token}"}
        )
        
        assert create_response.status_code == 201
        
        # Receive the real-time update via WebSocket
        messages = await client.receive_messages(websocket, count=1, timeout=2)
        
        assert len(messages) > 0
        assert messages[0]["type"] == "calendar_change"
        assert messages[0]["change_type"] == "create"
        assert messages[0]["project_id"] == "1"
        
        # Update the calendar entry
        entry_id = create_response.json()["id"]
        update_response = test_client.put(
            f"/api/v1/content-calendar/{entry_id}",
            json={
                "scheduled_date": "2025-04-05T09:00:00",
                "status": "draft"
            },
            headers={"Authorization": f"Bearer {http_token}"}
        )
        
        assert update_response.status_code == 200
        
        # Receive the update notification
        messages = await client.receive_messages(websocket, count=1, timeout=2)
        
        assert len(messages) > 0
        assert messages[0]["type"] == "calendar_change"
        assert messages[0]["change_type"] == "update"
        assert messages[0]["project_id"] == "1"
        assert messages[0]["content_id"] == str(entry_id)
        
        # Delete the calendar entry
        delete_response = test_client.delete(
            f"/api/v1/content-calendar/{entry_id}",
            headers={"Authorization": f"Bearer {http_token}"}
        )
        
        assert delete_response.status_code == 204
        
        # Receive the delete notification
        messages = await client.receive_messages(websocket, count=1, timeout=2)
        
        assert len(messages) > 0
        assert messages[0]["type"] == "calendar_change"
        assert messages[0]["change_type"] == "delete"
        assert messages[0]["project_id"] == "1"
        assert messages[0]["content_id"] == str(entry_id)

@pytest.mark.asyncio
async def test_multiple_clients(test_db, test_user_token):
    """Test multiple clients receiving updates simultaneously."""
    client1 = WebSocketTestClient("/ws/calendar", test_user_token)
    client2 = WebSocketTestClient("/ws/calendar", test_user_token)
    
    # Connect first client
    with client1.connect() as websocket1:
        # Skip connection confirmation
        await client1.receive_messages(websocket1, count=1)
        
        # Join project
        await websocket1.send_text(json.dumps({
            "type": "join_project",
            "project_id": "1"  # Test project ID
        }))
        
        # Skip join confirmation
        await client1.receive_messages(websocket1, count=1)
        
        # Connect second client
        with client2.connect() as websocket2:
            # Skip connection confirmation
            await client2.receive_messages(websocket2, count=1)
            
            # Join same project
            await websocket2.send_text(json.dumps({
                "type": "join_project",
                "project_id": "1"  # Test project ID
            }))
            
            # Skip join confirmation
            await client2.receive_messages(websocket2, count=1)
            
            # Client 1 should receive notification about client 2 joining
            messages = await client1.receive_messages(websocket1, count=1)
            assert len(messages) == 1
            assert messages[0]["type"] == "user_joined_project"
            assert messages[0]["user_id"] == "1"
            
            # Lock content from client 1
            await websocket1.send_text(json.dumps({
                "type": "lock_content",
                "content_id": "2"  # Test content ID
            }))
            
            # Client 1 receives lock confirmation
            messages1 = await client1.receive_messages(websocket1, count=1)
            assert messages1[0]["type"] == "content_locked"
            
            # Client 2 should also receive lock notification
            messages2 = await client2.receive_messages(websocket2, count=1)
            assert messages2[0]["type"] == "content_locked"
            assert messages2[0]["content_id"] == "2"
            assert messages2[0]["locked_by"] == "1"  # Test user ID
            
            # Client 2 attempts to lock the same content (should fail)
            await websocket2.send_text(json.dumps({
                "type": "lock_content",
                "content_id": "2"  # Already locked by client 1
            }))
            
            # Client 2 receives error
            messages = await client2.receive_messages(websocket2, count=1)
            assert messages[0]["type"] == "error"
            assert "locked by another user" in messages[0]["error"].lower()
            
            # Client 1 unlocks content
            await websocket1.send_text(json.dumps({
                "type": "unlock_content",
                "content_id": "2"
            }))
            
            # Both clients receive unlock notification
            messages1 = await client1.receive_messages(websocket1, count=1)
            messages2 = await client2.receive_messages(websocket2, count=1)
            
            assert messages1[0]["type"] == "content_unlocked"
            assert messages2[0]["type"] == "content_unlocked"
            assert messages1[0]["content_id"] == "2"
            assert messages1[0]["previously_locked_by"] == "1"

# Run tests with: pytest -xvs tests/integration/test_calendar_websockets.py