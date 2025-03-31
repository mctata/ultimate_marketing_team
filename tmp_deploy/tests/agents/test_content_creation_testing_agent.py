import pytest
from unittest.mock import MagicMock, patch
from typing import Dict, Any

from src.agents.content_creation_testing_agent import ContentCreationTestingAgent


@pytest.fixture
def mock_rabbitmq():
    with patch('src.agents.base_agent.RabbitMQClient') as mock:
        yield mock


@pytest.fixture
def mock_redis():
    with patch('src.agents.base_agent.RedisCache') as mock:
        yield mock


@pytest.fixture
def mock_openai():
    with patch('openai.OpenAI') as mock:
        mock_instance = MagicMock()
        mock.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def agent(mock_rabbitmq, mock_redis, mock_openai):
    agent = ContentCreationTestingAgent(
        agent_id="content_creation_agent",
        name="Content Creation & Testing Agent",
        openai_api_key="test_api_key"
    )
    return agent


class TestContentCreationTestingAgent:
    def test_initialization(self, agent):
        """Test that agent initializes correctly with proper attributes."""
        assert agent.agent_id == "content_creation_agent"
        assert agent.name == "Content Creation & Testing Agent"
        assert agent.enable_ai_content_generation is True
        assert agent.enable_ab_testing is True
        assert agent.enable_audit_trails is True
        assert agent.openai_model == "gpt-4-turbo"
        assert agent.openai_api_key == "test_api_key"
        
        # Check task handlers registration
        assert "ai_content_generation_task" in agent.task_handlers
        assert "content_testing_task" in agent.task_handlers
    
    @patch('src.agents.content_creation_testing_agent.ContentCreationTestingAgent._generate_content_variations')
    @patch('src.agents.content_creation_testing_agent.ContentCreationTestingAgent._record_audit_trail')
    def test_handle_ai_content_generation(self, mock_audit, mock_generate, agent):
        """Test handling AI content generation."""
        # Setup mock for content generation
        mock_content = [
            {"variation_id": "variation_0", "content": "Test content 1"},
            {"variation_id": "variation_1", "content": "Test content 2"}
        ]
        mock_generate.return_value = mock_content
        
        # Mock cache.set
        agent.cache.set = MagicMock()
        
        task = {
            "task_id": "123",
            "task_type": "ai_content_generation_task",
            "brand_id": 456,
            "project_id": 789,
            "project_type": "Blog",
            "content_topic": "Digital Marketing Trends",
            "content_brief": {"objective": "Educate audience"},
            "brand_guidelines": {"voice": "Professional"},
            "variation_count": 2,
            "user_id": "user123"
        }
        
        result = agent.handle_ai_content_generation(task)
        
        # Verify content generation was called with correct parameters
        mock_generate.assert_called_once_with(
            456, "Blog", "Digital Marketing Trends", 
            {"objective": "Educate audience"}, 
            {"voice": "Professional"}, 2
        )
        
        # Verify cache was set
        agent.cache.set.assert_called_once()
        assert "content_variations" in agent.cache.set.call_args[0][0]
        assert "789" in agent.cache.set.call_args[0][0]
        
        # Verify audit trail was recorded
        mock_audit.assert_called_once()
        assert mock_audit.call_args[0][0] == "content_generated"
        
        # Verify response
        assert result["status"] == "success"
        assert "Generated 2 content variations" in result["message"]
        assert result["project_id"] == 789
        assert result["content_variations"] == mock_content
    
    def test_ai_content_generation_disabled(self, agent):
        """Test handling when AI content generation is disabled."""
        agent.enable_ai_content_generation = False
        
        task = {
            "task_id": "123",
            "task_type": "ai_content_generation_task",
            "brand_id": 456,
            "project_id": 789
        }
        
        result = agent.handle_ai_content_generation(task)
        
        # Verify response indicates feature is disabled
        assert result["status"] == "error"
        assert "AI content generation is not enabled" in result["error"]
    
    @patch('src.agents.content_creation_testing_agent.ContentCreationTestingAgent._design_content_test')
    @patch('src.agents.content_creation_testing_agent.ContentCreationTestingAgent._schedule_test_completion')
    @patch('src.agents.content_creation_testing_agent.ContentCreationTestingAgent._record_audit_trail')
    def test_handle_content_testing(self, mock_audit, mock_schedule, mock_design, agent):
        """Test handling content testing."""
        # Setup mock for test design
        mock_test = {
            "test_id": "test_789_123456",
            "variations": [{"variation_id": "var1"}, {"variation_id": "var2"}]
        }
        mock_design.return_value = mock_test
        
        # Mock cache operations
        agent.cache.get = MagicMock(return_value='[{"variation_id": "var1"}, {"variation_id": "var2"}]')
        agent.cache.set = MagicMock()
        
        task = {
            "task_id": "123",
            "task_type": "content_testing_task",
            "brand_id": 456,
            "project_id": 789,
            "test_type": "A/B test",
            "metrics": ["engagement", "conversion"],
            "duration": 7,
            "user_id": "user123"
        }
        
        result = agent.handle_content_testing(task)
        
        # Verify cache get was called to retrieve variations
        agent.cache.get.assert_called_once()
        assert "content_variations" in agent.cache.get.call_args[0][0]
        assert "789" in agent.cache.get.call_args[0][0]
        
        # Verify test design was called
        mock_design.assert_called_once()
        assert mock_design.call_args[0][0] == 789
        assert mock_design.call_args[0][1] == "A/B test"
        
        # Verify test was scheduled
        mock_schedule.assert_called_once_with(789, 7)
        
        # Verify test design was cached
        agent.cache.set.assert_called_once()
        assert "test_results" in agent.cache.set.call_args[0][0]
        
        # Verify audit trail was recorded
        mock_audit.assert_called_once()
        assert mock_audit.call_args[0][0] == "test_initiated"
        
        # Verify response
        assert result["status"] == "success"
        assert "A/B test initiated for project 789" in result["message"]
        assert result["test_id"] == "test_789_123456"
        assert result["test_design"] == mock_test
    
    def test_ab_testing_disabled(self, agent):
        """Test handling when A/B testing is disabled."""
        agent.enable_ab_testing = False
        
        task = {
            "task_id": "123",
            "task_type": "content_testing_task",
            "brand_id": 456,
            "project_id": 789
        }
        
        result = agent.handle_content_testing(task)
        
        # Verify response indicates feature is disabled
        assert result["status"] == "error"
        assert "A/B testing is not enabled" in result["error"]
    
    def test_content_testing_no_variations(self, agent):
        """Test handling content testing when no variations exist."""
        # Mock cache.get to return None (no variations found)
        agent.cache.get = MagicMock(return_value=None)
        
        task = {
            "task_id": "123",
            "task_type": "content_testing_task",
            "brand_id": 456,
            "project_id": 789,
            "test_type": "A/B test"
        }
        
        result = agent.handle_content_testing(task)
        
        # Verify response indicates no variations found
        assert result["status"] == "error"
        assert "No content variations found" in result["error"]
    
    def test_handle_content_performance_update(self, agent):
        """Test handling content performance update event."""
        event = {
            "event_type": "content_performance_update",
            "content_id": 123,
            "performance_data": {
                "views": 1000,
                "engagement_rate": 5.4,
                "conversion_rate": 2.1
            }
        }
        
        result = agent._handle_content_performance_update(event)
        
        # Verify response
        assert result["status"] == "processed"
        assert result["content_id"] == 123
        assert "Performance data processed" in result["message"]
    
    @patch('src.agents.content_creation_testing_agent.ContentCreationTestingAgent._generate_blog_variation')
    @patch('src.agents.content_creation_testing_agent.ContentCreationTestingAgent._generate_social_post_variation')
    @patch('src.agents.content_creation_testing_agent.ContentCreationTestingAgent._generate_email_variation')
    @patch('src.agents.content_creation_testing_agent.ContentCreationTestingAgent._generate_landing_page_variation')
    def test_generate_content_variations(self, mock_landing, mock_email, mock_social, mock_blog, agent):
        """Test generating content variations with the fallback mock implementation."""
        # Setup mocks to return test content
        mock_blog.return_value = {"variation_id": "blog_0", "project_type": "Blog"}
        mock_social.return_value = {"variation_id": "social_0", "project_type": "Social Post"}
        mock_email.return_value = {"variation_id": "email_0", "project_type": "Email"}
        mock_landing.return_value = {"variation_id": "landing_0", "project_type": "Landing Page"}
        
        # Disable OpenAI client to test fallback
        agent.openai_client = None
        
        # Test with Blog project type
        result = agent._generate_content_variations(
            123, "Blog", "Test Topic", {}, {}, 1
        )
        assert len(result) == 1
        assert result[0]["variation_id"] == "blog_0"
        mock_blog.assert_called_once()
        
        # Test with Social Post project type
        result = agent._generate_content_variations(
            123, "Social Post", "Test Topic", {}, {}, 1
        )
        assert len(result) == 1
        assert result[0]["variation_id"] == "social_0"
        mock_social.assert_called_once()
        
        # Test with Email project type
        result = agent._generate_content_variations(
            123, "Email", "Test Topic", {}, {}, 1
        )
        assert len(result) == 1
        assert result[0]["variation_id"] == "email_0"
        mock_email.assert_called_once()
        
        # Test with Landing Page project type
        result = agent._generate_content_variations(
            123, "Landing Page", "Test Topic", {}, {}, 1
        )
        assert len(result) == 1
        assert result[0]["variation_id"] == "landing_0"
        mock_landing.assert_called_once()
    
    def test_design_content_test(self, agent):
        """Test designing content test."""
        variations = [
            {"variation_id": "var1", "variation_approach": "approach1"},
            {"variation_id": "var2", "variation_approach": "approach2"}
        ]
        
        result = agent._design_content_test(
            789, "A/B test", variations, ["engagement", "conversion"], 7
        )
        
        # Verify test design structure
        assert "test_id" in result
        assert result["project_id"] == 789
        assert result["test_type"] == "A/B test"
        assert result["duration_days"] == 7
        assert result["status"] == "running"
        
        # Verify variations are included
        assert len(result["variations"]) == 2
        assert result["variations"][0]["variation_id"] == "var1"
        
        # Verify audience segments
        assert len(result["audience_segments"]) == 2
        
        # Verify metrics configuration
        assert "engagement" in result["metrics"]
        assert "conversion" in result["metrics"]
        
        # Verify statistical parameters
        assert "confidence_level" in result["statistical_parameters"]
        assert "minimum_detectable_effect" in result["statistical_parameters"]