import pytest
from unittest.mock import MagicMock, patch
from typing import Dict, Any

from src.agents.brand_project_management_agent import BrandProjectManagementAgent


@pytest.fixture
def mock_rabbitmq():
    with patch('src.core.messaging.RabbitMQClient') as mock:
        yield mock


@pytest.fixture
def mock_redis():
    with patch('src.core.cache.RedisCache') as mock:
        yield mock


@pytest.fixture
def agent(mock_rabbitmq, mock_redis):
    agent = BrandProjectManagementAgent(
        agent_id="brand_agent",
        name="Brand Management Agent"
    )
    return agent


class TestBrandProjectManagementAgent:
    def test_initialization(self, agent):
        """Test that agent initializes correctly with proper attributes."""
        assert agent.agent_id == "brand_agent"
        assert agent.name == "Brand Management Agent"
        assert agent.enable_web_scraping is True
        assert agent.enable_rbac is True
        assert agent.enable_audit_trails is True
        
        # Check task handlers registration
        assert "onboard_brand" in agent.task_handlers
        assert "update_brand" in agent.task_handlers
        assert "get_brand_info" in agent.task_handlers
        assert "create_project" in agent.task_handlers
        assert "update_project" in agent.task_handlers
        assert "get_project_info" in agent.task_handlers
        assert "assign_project" in agent.task_handlers
        assert "get_brand_projects" in agent.task_handlers
    
    def test_process_task_unhandled(self, agent):
        """Test processing unhandled task type."""
        task = {
            "task_id": "123",
            "task_type": "unknown_task"
        }
        
        result = agent.process_task(task)
        
        assert result["status"] == "error"
        assert "Unhandled task type" in result["error"]
    
    @patch('src.agents.brand_project_management_agent.BrandProjectManagementAgent._scrape_website_data')
    @patch('src.agents.brand_project_management_agent.BrandProjectManagementAgent._record_audit_trail')
    def test_handle_onboard_brand(self, mock_audit, mock_scrape, agent):
        """Test handling brand onboarding."""
        # Setup mock for website scraping
        mock_scrape.return_value = {
            "description": "Test Company Description",
            "logo_url": "https://example.com/logo.png",
            "brand_guidelines": {
                "color_palette": ["#123456", "#789abc"],
                "typography": {"font_families": ["Arial", "Helvetica"]}
            }
        }
        
        task = {
            "task_id": "123",
            "task_type": "onboard_brand",
            "company_name": "Test Company",
            "website_url": "https://example.com",
            "brand_guidelines": {"voice": "Professional"},
            "user_id": "user123"
        }
        
        result = agent.handle_onboard_brand(task)
        
        # Verify scraping was called
        mock_scrape.assert_called_once_with("https://example.com")
        
        # Verify audit trail was recorded
        mock_audit.assert_called_once()
        assert mock_audit.call_args[0][0] == "brand_onboarded"
        assert mock_audit.call_args[0][1] == "user123"
        
        # Verify response
        assert result["status"] == "success"
        assert "Test Company" in result["message"]
        assert "brand_id" in result
        assert result["brand_data"]["name"] == "Test Company"
        assert result["brand_data"]["website_url"] == "https://example.com"
        assert result["brand_data"]["description"] == "Test Company Description"
        assert result["brand_data"]["logo_url"] == "https://example.com/logo.png"
        assert result["brand_data"]["brand_guidelines"]["voice"] == "Professional"
        assert "#123456" in result["brand_data"]["brand_guidelines"]["color_palette"]
    
    @patch('src.agents.brand_project_management_agent.requests.get')
    def test_scrape_website_data(self, mock_get, agent):
        """Test website scraping functionality."""
        # Mock the response
        mock_response = MagicMock()
        mock_response.text = """
        <html>
            <head>
                <title>Test Company</title>
                <meta name="description" content="A test company description">
                <style>
                    body { color: #123456; font-family: 'Arial', sans-serif; }
                    .header { background-color: #789abc; font-family: "Helvetica"; }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/logo.png" alt="Logo">
                </div>
            </body>
        </html>
        """
        mock_get.return_value = mock_response
        
        result = agent._scrape_website_data("https://example.com")
        
        # Verify request was made
        mock_get.assert_called_once()
        
        # Verify extracted data
        assert result["description"] == "A test company description"
        assert "https://example.com/logo.png" in result["logo_url"]
        assert "#123456" in result["brand_guidelines"]["color_palette"]
        assert "#789abc" in result["brand_guidelines"]["color_palette"]
        assert "Arial" in result["brand_guidelines"]["typography"]["font_families"]
        assert "Helvetica" in result["brand_guidelines"]["typography"]["font_families"]
    
    @patch('src.agents.brand_project_management_agent.BrandProjectManagementAgent._record_audit_trail')
    def test_handle_update_brand(self, mock_audit, agent):
        """Test handling brand updates."""
        task = {
            "task_id": "123",
            "task_type": "update_brand",
            "brand_id": 123,
            "updates": {"name": "Updated Company", "description": "New description"},
            "user_id": "user123"
        }
        
        result = agent.handle_update_brand(task)
        
        # Verify audit trail was recorded
        mock_audit.assert_called_once()
        assert mock_audit.call_args[0][0] == "brand_updated"
        assert mock_audit.call_args[0][1] == "user123"
        assert "name" in mock_audit.call_args[0][2]["fields_updated"]
        assert "description" in mock_audit.call_args[0][2]["fields_updated"]
        
        # Verify response
        assert result["status"] == "success"
        assert result["brand_id"] == 123
    
    @patch('src.agents.brand_project_management_agent.BrandProjectManagementAgent._check_brand_access')
    def test_handle_get_brand_info(self, mock_access, agent):
        """Test retrieving brand information."""
        # Setup mock for access check
        mock_access.return_value = True
        
        task = {
            "task_id": "123",
            "task_type": "get_brand_info",
            "brand_id": 123,
            "include_guidelines": True,
            "include_projects": True,
            "user_id": "user123"
        }
        
        result = agent.handle_get_brand_info(task)
        
        # Verify access was checked
        mock_access.assert_called_once_with(123, "user123")
        
        # Verify response
        assert result["status"] == "success"
        assert result["brand"]["id"] == 123
        assert "guidelines" in result["brand"]
        assert "projects" in result["brand"]
    
    @patch('src.agents.brand_project_management_agent.BrandProjectManagementAgent._check_brand_access')
    def test_handle_get_brand_info_access_denied(self, mock_access, agent):
        """Test access denied when retrieving brand information."""
        # Setup mock for access check
        mock_access.return_value = False
        
        task = {
            "task_id": "123",
            "task_type": "get_brand_info",
            "brand_id": 123,
            "user_id": "user123"
        }
        
        result = agent.handle_get_brand_info(task)
        
        # Verify access was checked
        mock_access.assert_called_once_with(123, "user123")
        
        # Verify response
        assert result["status"] == "error"
        assert "Access denied" in result["error"]
    
    @patch('src.agents.brand_project_management_agent.BrandProjectManagementAgent._check_brand_access')
    @patch('src.agents.brand_project_management_agent.BrandProjectManagementAgent._record_audit_trail')
    def test_handle_create_project(self, mock_audit, mock_access, agent):
        """Test creating a project."""
        # Setup mock for access check
        mock_access.return_value = True
        
        task = {
            "task_id": "123",
            "task_type": "create_project",
            "brand_id": 123,
            "project_type_id": 1,
            "name": "Test Project",
            "description": "A test project",
            "user_id": "user123",
            "due_date": "2025-04-15T00:00:00Z"
        }
        
        result = agent.handle_create_project(task)
        
        # Verify access was checked
        mock_access.assert_called_once_with(123, "user123")
        
        # Verify audit trail was recorded
        mock_audit.assert_called_once()
        assert mock_audit.call_args[0][0] == "project_created"
        
        # Verify response
        assert result["status"] == "success"
        assert "project_id" in result
        assert result["project_data"]["name"] == "Test Project"
        assert result["project_data"]["brand_id"] == 123
    
    @patch('src.agents.brand_project_management_agent.BrandProjectManagementAgent._check_project_access')
    @patch('src.agents.brand_project_management_agent.BrandProjectManagementAgent._record_audit_trail')
    def test_handle_assign_project(self, mock_audit, mock_access, agent):
        """Test assigning a project to a user."""
        # Setup mock for access check
        mock_access.return_value = True
        
        # Mock broadcast_event method
        agent.broadcast_event = MagicMock()
        
        task = {
            "task_id": "123",
            "task_type": "assign_project",
            "project_id": 456,
            "assigned_to": "user456",
            "user_id": "user123"
        }
        
        result = agent.handle_assign_project(task)
        
        # Verify access was checked
        mock_access.assert_called_once_with(456, "user123")
        
        # Verify audit trail was recorded
        mock_audit.assert_called_once()
        assert mock_audit.call_args[0][0] == "project_assigned"
        
        # Verify event was broadcast
        agent.broadcast_event.assert_called_once()
        event = agent.broadcast_event.call_args[0][0]
        assert event["event_type"] == "project_assigned"
        assert event["project_id"] == 456
        assert event["assigned_to"] == "user456"
        
        # Verify response
        assert result["status"] == "success"
        assert result["project_id"] == 456
        assert result["assigned_to"] == "user456"
    
    @patch('src.agents.brand_project_management_agent.BrandProjectManagementAgent._check_brand_access')
    def test_handle_get_brand_projects(self, mock_access, agent):
        """Test retrieving projects for a brand."""
        # Setup mock for access check
        mock_access.return_value = True
        
        task = {
            "task_id": "123",
            "task_type": "get_brand_projects",
            "brand_id": 123,
            "status": "in_progress",
            "user_id": "user123"
        }
        
        result = agent.handle_get_brand_projects(task)
        
        # Verify access was checked
        mock_access.assert_called_once_with(123, "user123")
        
        # Verify response
        assert result["status"] == "success"
        assert result["brand_id"] == 123
        assert len(result["projects"]) >= 1
        assert all(p["status"] == "in_progress" for p in result["projects"])