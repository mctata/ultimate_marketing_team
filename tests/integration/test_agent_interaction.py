import pytest
from unittest.mock import MagicMock, patch
from typing import Dict, Any

from src.agents.brand_project_management_agent import BrandProjectManagementAgent
from src.agents.content_strategy_research_agent import ContentStrategyResearchAgent


@pytest.fixture
def mock_rabbitmq():
    with patch('src.ultimate_marketing_team.core.messaging.RabbitMQClient') as mock:
        yield mock


@pytest.fixture
def mock_redis():
    with patch('src.ultimate_marketing_team.core.cache.RedisCache') as mock:
        yield mock


@pytest.fixture
def brand_agent(mock_rabbitmq, mock_redis):
    agent = BrandProjectManagementAgent(
        agent_id="brand_agent",
        name="Brand Management Agent"
    )
    return agent


@pytest.fixture
def strategy_agent(mock_rabbitmq, mock_redis):
    agent = ContentStrategyResearchAgent(
        agent_id="strategy_agent",
        name="Content Strategy Research Agent"
    )
    return agent


class TestAgentInteraction:
    """Test the interaction between different agent types."""
    
    def test_brand_project_creation_to_content_strategy(self, brand_agent, strategy_agent):
        """Test the workflow from brand project creation to content strategy development."""
        # Setup mocks to simulate message passing between agents
        brand_agent.send_task = MagicMock(return_value={"status": "success", "strategy": {}})
        
        # Step 1: Onboard a new brand
        onboarding_task = {
            "task_id": "task1",
            "task_type": "onboard_brand",
            "company_name": "Test Company",
            "website_url": "https://example.com",
            "brand_guidelines": {"voice": "Professional"},
            "user_id": "user123"
        }
        
        # Mock website scraping
        with patch('src.agents.brand_project_management_agent.BrandProjectManagementAgent._scrape_website_data') as mock_scrape:
            mock_scrape.return_value = {
                "description": "Test Company Description",
                "logo_url": "https://example.com/logo.png",
                "brand_guidelines": {
                    "color_palette": ["#123456", "#789abc"],
                    "typography": {"font_families": ["Arial", "Helvetica"]}
                }
            }
            
            # Mock audit trail
            with patch('src.agents.brand_project_management_agent.BrandProjectManagementAgent._record_audit_trail'):
                onboarding_result = brand_agent.handle_onboard_brand(onboarding_task)
        
        assert onboarding_result["status"] == "success"
        brand_id = onboarding_result["brand_id"]
        
        # Step 2: Create a new content project
        project_task = {
            "task_id": "task2",
            "task_type": "create_project",
            "brand_id": brand_id,
            "project_type_id": 1,
            "name": "Content Strategy Project",
            "description": "Develop a comprehensive content strategy",
            "user_id": "user123",
            "due_date": "2025-04-15T00:00:00Z"
        }
        
        # Mock access check and audit trail
        with patch('src.agents.brand_project_management_agent.BrandProjectManagementAgent._check_brand_access', return_value=True):
            with patch('src.agents.brand_project_management_agent.BrandProjectManagementAgent._record_audit_trail'):
                project_result = brand_agent.handle_create_project(project_task)
        
        assert project_result["status"] == "success"
        project_id = project_result["project_id"]
        
        # Step 3: Send content strategy development task to strategy agent
        strategy_task = {
            "task_id": "task3",
            "task_type": "content_strategy_development_task",
            "brand_id": brand_id,
            "project_id": project_id,
            "content_topics": ["Digital Marketing", "Content Strategy"],
            "project_types": ["Blog", "Social Post", "Email"],
            "business_objectives": {"increase_engagement": True, "generate_leads": True},
            "user_id": "user123"
        }
        
        # Simulate brand agent sending task to strategy agent
        brand_agent.send_task.assert_not_called()  # Verify it hasn't been called yet
        brand_agent.send_task("strategy_agent", strategy_task)
        brand_agent.send_task.assert_called_once()
        
        # Verify task was sent with correct parameters
        call_args = brand_agent.send_task.call_args[0]
        assert call_args[0] == "strategy_agent"
        assert call_args[1]["task_type"] == "content_strategy_development_task"
        assert call_args[1]["brand_id"] == brand_id
        assert call_args[1]["project_id"] == project_id
        
        # Step 4: Strategy agent processes the task
        # Mock audit trail recording
        with patch('src.agents.content_strategy_research_agent.ContentStrategyResearchAgent._record_audit_trail'):
            # Process the strategy task
            strategy_result = strategy_agent.handle_content_strategy_development(strategy_task)
        
        # Verify strategy was created successfully
        assert strategy_result["status"] == "success"
        assert "strategy" in strategy_result
        strategy = strategy_result["strategy"]
        
        # Verify strategy has expected components
        assert "strategic_themes" in strategy
        assert "recommended_formats" in strategy
        assert "distribution_channels" in strategy
        assert "topic_recommendations" in strategy
        assert len(strategy["topic_recommendations"]) == 2  # Two topics were provided
        
        # Step 5: Create content calendar based on strategy
        calendar_task = {
            "task_id": "task4",
            "task_type": "content_calendar_creation_task",
            "brand_id": brand_id,
            "content_topics": ["Digital Marketing", "Content Strategy"],
            "project_types": ["Blog", "Social Post", "Email"],
            "timeframe": {"start_date": "2025-04-01", "end_date": "2025-06-30"},
            "user_id": "user123"
        }
        
        # Mock audit trail recording
        with patch('src.agents.content_strategy_research_agent.ContentStrategyResearchAgent._record_audit_trail'):
            # Process the calendar task
            calendar_result = strategy_agent.handle_content_calendar_creation(calendar_task)
        
        # Verify calendar was created successfully
        assert calendar_result["status"] == "success"
        assert "calendar" in calendar_result
        calendar = calendar_result["calendar"]
        
        # Verify calendar has expected components
        assert "content_items" in calendar
        assert "campaigns" in calendar
        assert "series" in calendar
        assert len(calendar["content_items"]) > 0
    
    def test_competitor_analysis_integration(self, brand_agent, strategy_agent):
        """Test the integration between brand agent and strategy agent for competitor analysis."""
        # Setup mocks
        brand_agent.send_task = MagicMock(return_value={"status": "success"})
        
        # Step 1: Get brand info including competitors
        brand_info_task = {
            "task_id": "task1",
            "task_type": "get_brand_info",
            "brand_id": 123,
            "include_guidelines": True,
            "include_projects": False,
            "user_id": "user123"
        }
        
        # Mock access check
        with patch('src.agents.brand_project_management_agent.BrandProjectManagementAgent._check_brand_access', return_value=True):
            brand_info = brand_agent.handle_get_brand_info(brand_info_task)
        
        assert brand_info["status"] == "success"
        
        # Step 2: Send competitor analysis task to strategy agent
        competitor_task = {
            "task_id": "task2",
            "task_type": "competitor_analysis_task",
            "brand_id": 123,
            "competitor_websites": ["https://competitor1.com", "https://competitor2.com"],
            "content_topics": ["Digital Marketing", "Content Strategy"],
            "project_types": ["Blog", "Social Post"],
            "user_id": "user123"
        }
        
        # Simulate brand agent sending task to strategy agent
        brand_agent.send_task("strategy_agent", competitor_task)
        brand_agent.send_task.assert_called_once()
        
        # Verify task was sent with correct parameters
        call_args = brand_agent.send_task.call_args[0]
        assert call_args[0] == "strategy_agent"
        assert call_args[1]["task_type"] == "competitor_analysis_task"
        assert "competitor_websites" in call_args[1]
        
        # Step 3: Strategy agent processes the competitor analysis task
        with patch('src.agents.content_strategy_research_agent.ContentStrategyResearchAgent._analyze_competitor_website') as mock_analyze:
            # Mock the competitor analysis method
            mock_analyze.return_value = {
                "website": "https://competitor1.com",
                "content_frequency": "weekly",
                "primary_content_types": ["Blog", "Case Study"],
                "topic_coverage": {
                    "Digital Marketing": {
                        "coverage_level": "comprehensive",
                        "content_count": 15,
                        "content_quality": 8
                    },
                    "Content Strategy": {
                        "coverage_level": "minimal",
                        "content_count": 3,
                        "content_quality": 6
                    }
                }
            }
            
            # Mock audit trail recording
            with patch('src.agents.content_strategy_research_agent.ContentStrategyResearchAgent._record_audit_trail'):
                # Process the competitor analysis task
                competitor_result = strategy_agent.handle_competitor_analysis(competitor_task)
        
        # Verify analysis was completed successfully
        assert competitor_result["status"] == "success"
        assert "competitor_analyses" in competitor_result
        assert "competitive_landscape" in competitor_result
        assert "strategic_opportunities" in competitor_result
        
        # Verify analyses for both competitors
        assert "https://competitor1.com" in competitor_result["competitor_analyses"]
        assert "https://competitor2.com" in competitor_result["competitor_analyses"]