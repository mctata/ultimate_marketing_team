import json
import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
from src.api.main import app
from src.models.content import ContentCalendar, ContentDraft
from src.models.project import Project
from src.models.user import User

# Test client
client = TestClient(app)

# Fixture for setting up test data
@pytest.fixture(scope="module")
def setup_test_data(db_session: Session):
    """Set up test data for content calendar tests."""
    # Create test user
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password="fakehashed",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    
    # Create test project
    project = Project(
        name="Test Project",
        description="Test project for content calendar",
        user_id=user.id
    )
    db_session.add(project)
    db_session.commit()
    
    # Create test content draft
    content_draft = ContentDraft(
        project_id=project.id,
        content="Test content draft",
        version=1,
        status="draft",
        created_by=user.id
    )
    db_session.add(content_draft)
    db_session.commit()
    
    # Create test calendar entries
    calendar_entries = []
    for i in range(5):
        entry = ContentCalendar(
            project_id=project.id,
            content_draft_id=content_draft.id,
            scheduled_date=datetime.now() + timedelta(days=i),
            status=["draft", "scheduled", "published"][i % 3]
        )
        calendar_entries.append(entry)
        db_session.add(entry)
    db_session.commit()
    
    # Return test data
    return {
        "user": user,
        "project": project,
        "content_draft": content_draft,
        "calendar_entries": calendar_entries
    }

# Test getting calendar entries
def test_get_calendar_entries(setup_test_data, db_session, auth_header):
    """Test GET /api/v1/content-calendar/ endpoint."""
    project = setup_test_data["project"]
    
    # Make request
    response = client.get(
        f"/api/v1/content-calendar/?project_id={project.id}",
        headers=auth_header
    )
    
    # Assert response
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 5
    
    # Check entry properties
    entry = data[0]
    assert "id" in entry
    assert "project_id" in entry
    assert "scheduled_date" in entry
    assert "status" in entry

# Test getting a specific calendar entry
def test_get_calendar_entry(setup_test_data, db_session, auth_header):
    """Test GET /api/v1/content-calendar/{entry_id} endpoint."""
    entry = setup_test_data["calendar_entries"][0]
    
    # Make request
    response = client.get(
        f"/api/v1/content-calendar/{entry.id}",
        headers=auth_header
    )
    
    # Assert response
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == entry.id
    assert data["project_id"] == entry.project_id
    assert data["status"] == entry.status

# Test creating a calendar entry
def test_create_calendar_entry(setup_test_data, db_session, auth_header):
    """Test POST /api/v1/content-calendar/ endpoint."""
    project = setup_test_data["project"]
    content_draft = setup_test_data["content_draft"]
    
    # Entry data
    entry_data = {
        "project_id": project.id,
        "content_draft_id": content_draft.id,
        "scheduled_date": (datetime.now() + timedelta(days=10)).isoformat(),
        "status": "scheduled"
    }
    
    # Make request
    response = client.post(
        "/api/v1/content-calendar/",
        json=entry_data,
        headers=auth_header
    )
    
    # Assert response
    assert response.status_code == 201
    data = response.json()
    assert data["project_id"] == project.id
    assert data["content_draft_id"] == content_draft.id
    assert data["status"] == "scheduled"
    
    # Verify entry was created in the database
    db_entry = db_session.query(ContentCalendar).filter(ContentCalendar.id == data["id"]).first()
    assert db_entry is not None
    assert db_entry.project_id == project.id
    assert db_entry.status == "scheduled"

# Test updating a calendar entry
def test_update_calendar_entry(setup_test_data, db_session, auth_header):
    """Test PUT /api/v1/content-calendar/{entry_id} endpoint."""
    entry = setup_test_data["calendar_entries"][1]
    
    # Update data
    update_data = {
        "status": "published",
        "published_date": datetime.now().isoformat()
    }
    
    # Make request
    response = client.put(
        f"/api/v1/content-calendar/{entry.id}",
        json=update_data,
        headers=auth_header
    )
    
    # Assert response
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == entry.id
    assert data["status"] == "published"
    assert data["published_date"] is not None
    
    # Verify entry was updated in the database
    db_entry = db_session.query(ContentCalendar).filter(ContentCalendar.id == entry.id).first()
    assert db_entry.status == "published"
    assert db_entry.published_date is not None

# Test deleting a calendar entry
def test_delete_calendar_entry(setup_test_data, db_session, auth_header):
    """Test DELETE /api/v1/content-calendar/{entry_id} endpoint."""
    entry = setup_test_data["calendar_entries"][2]
    
    # Make request
    response = client.delete(
        f"/api/v1/content-calendar/{entry.id}",
        headers=auth_header
    )
    
    # Assert response
    assert response.status_code == 204
    
    # Verify entry was deleted from the database
    db_entry = db_session.query(ContentCalendar).filter(ContentCalendar.id == entry.id).first()
    assert db_entry is None

# Test publishing a calendar entry
def test_publish_content(setup_test_data, db_session, auth_header):
    """Test POST /api/v1/content-calendar/{entry_id}/publish endpoint."""
    entry = setup_test_data["calendar_entries"][3]
    
    # Make request
    response = client.post(
        f"/api/v1/content-calendar/{entry.id}/publish",
        headers=auth_header
    )
    
    # Assert response
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == entry.id
    assert data["status"] == "published"
    assert data["published_date"] is not None
    
    # Verify entry was updated in the database
    db_entry = db_session.query(ContentCalendar).filter(ContentCalendar.id == entry.id).first()
    assert db_entry.status == "published"
    assert db_entry.published_date is not None

# Test bulk creating calendar entries
def test_bulk_create_calendar_entries(setup_test_data, db_session, auth_header):
    """Test POST /api/v1/content-calendar/bulk endpoint."""
    project = setup_test_data["project"]
    content_draft = setup_test_data["content_draft"]
    
    # Bulk entries data
    bulk_data = {
        "items": [
            {
                "project_id": project.id,
                "content_draft_id": content_draft.id,
                "scheduled_date": (datetime.now() + timedelta(days=20)).isoformat(),
                "status": "scheduled"
            },
            {
                "project_id": project.id,
                "content_draft_id": content_draft.id,
                "scheduled_date": (datetime.now() + timedelta(days=21)).isoformat(),
                "status": "scheduled"
            }
        ]
    }
    
    # Make request
    response = client.post(
        "/api/v1/content-calendar/bulk",
        json=bulk_data,
        headers=auth_header
    )
    
    # Assert response
    assert response.status_code == 201
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    
    # Verify entries were created in the database
    for entry_data in data:
        db_entry = db_session.query(ContentCalendar).filter(ContentCalendar.id == entry_data["id"]).first()
        assert db_entry is not None
        assert db_entry.project_id == project.id
        assert db_entry.status == "scheduled"

# Test bulk updating calendar entries
def test_bulk_update_calendar_entries(setup_test_data, db_session, auth_header):
    """Test PUT /api/v1/content-calendar/bulk endpoint."""
    entries = setup_test_data["calendar_entries"]
    entry_ids = [entries[0].id, entries[4].id]
    
    # Bulk update data
    bulk_update_data = {
        "item_ids": entry_ids,
        "updates": {
            "status": "draft"
        }
    }
    
    # Make request
    response = client.put(
        "/api/v1/content-calendar/bulk",
        json=bulk_update_data,
        headers=auth_header
    )
    
    # Assert response
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    
    # Verify entries were updated in the database
    for entry_id in entry_ids:
        db_entry = db_session.query(ContentCalendar).filter(ContentCalendar.id == entry_id).first()
        assert db_entry is not None
        assert db_entry.status == "draft"

# Test getting best time recommendations
def test_get_best_time_recommendations(setup_test_data, db_session, auth_header):
    """Test GET /api/v1/content-calendar/insights/best-times endpoint."""
    project = setup_test_data["project"]
    
    # Make request
    response = client.get(
        f"/api/v1/content-calendar/insights/best-times?project_id={project.id}",
        headers=auth_header
    )
    
    # Assert response (might be empty if no performance data)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

# Test getting scheduling insights
def test_get_scheduling_insights(setup_test_data, db_session, auth_header):
    """Test GET /api/v1/content-calendar/insights/conflicts endpoint."""
    project = setup_test_data["project"]
    
    # Date range
    start_date = datetime.now().isoformat()
    end_date = (datetime.now() + timedelta(days=30)).isoformat()
    
    # Make request
    response = client.get(
        f"/api/v1/content-calendar/insights/conflicts?project_id={project.id}&start_date={start_date}&end_date={end_date}",
        headers=auth_header
    )
    
    # Assert response
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)