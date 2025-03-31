import pytest
from unittest.mock import MagicMock, patch
from typing import Dict, Any

from src.agents.content_strategy_research_agent import ContentStrategyResearchAgent


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
    agent = ContentStrategyResearchAgent(
        agent_id="content_strategy_agent",
        name="Content Strategy Research Agent"
    )
    return agent


class TestContentStrategyResearchAgent:
    def test_initialization(self, agent):
        """Test that agent initializes correctly with proper attributes."""
        assert agent.agent_id == "content_strategy_agent"
        assert agent.name == "Content Strategy Research Agent"
        assert agent.enable_competitor_analysis is True
        assert agent.enable_content_gap_analysis is True
        assert agent.enable_performance_analysis is True
        assert agent.enable_audit_trails is True
        
        # Check task handlers registration
        assert "content_strategy_development_task" in agent.task_handlers
        assert "competitor_analysis_task" in agent.task_handlers
        assert "content_calendar_creation_task" in agent.task_handlers
    
    def test_process_task_unhandled(self, agent):
        """Test processing unhandled task type."""
        task = {
            "task_id": "123",
            "task_type": "unknown_task"
        }
        
        result = agent.process_task(task)
        
        assert result["status"] == "error"
        assert "Unhandled task type" in result["error"]
    
    @patch('src.agents.content_strategy_research_agent.ContentStrategyResearchAgent._analyze_performance_data')
    @patch('src.agents.content_strategy_research_agent.ContentStrategyResearchAgent._generate_content_recommendations')
    @patch('src.agents.content_strategy_research_agent.ContentStrategyResearchAgent._identify_content_gaps')
    @patch('src.agents.content_strategy_research_agent.ContentStrategyResearchAgent._record_audit_trail')
    def test_handle_content_strategy_development(self, mock_audit, mock_gaps, mock_recommendations, mock_performance, agent):
        """Test handling content strategy development."""
        # Setup mocks
        mock_performance.return_value = {
            "by_project_type": {"Blog": {"top_performing_topics": []}},
            "by_topic": {"AI": {"avg_engagement_rate": 3.8}},
            "overall": {"best_performing_combination": {}}
        }
        
        mock_recommendations.return_value = {
            "themes": [{"name": "Industry Expertise"}],
            "formats": {"Blog": [{"name": "Listicle"}]},
            "channels": {"primary": ["LinkedIn"]}
        }
        
        mock_gaps.return_value = {
            "by_topic": {"AI": {"missing_formats": []}},
            "by_project_type": {"Blog": {"coverage_percentage": 65}},
            "overall_recommendations": []
        }
        
        task = {
            "task_id": "123",
            "task_type": "content_strategy_development_task",
            "brand_id": 123,
            "content_topics": ["AI", "Marketing"],
            "project_types": ["Blog", "Social Post"],
            "performance_metrics": {"engagement_rate": 3.5},
            "business_objectives": {"awareness": 8},
            "user_id": "user123"
        }
        
        result = agent.handle_content_strategy_development(task)
        
        # Verify mocks were called
        mock_performance.assert_called_once()
        mock_recommendations.assert_called_once()
        mock_gaps.assert_called_once()
        mock_audit.assert_called_once()
        
        # Verify response
        assert result["status"] == "success"
        assert result["message"] == "Content strategy developed for brand 123"
        assert "strategy" in result
        assert "strategic_themes" in result["strategy"]
        assert "recommended_formats" in result["strategy"]
        assert "distribution_channels" in result["strategy"]
        assert "content_gaps" in result["strategy"]
        assert "performance_insights" in result["strategy"]
        assert "topic_recommendations" in result["strategy"]
        assert "AI" in result["strategy"]["topic_recommendations"]
        assert "Marketing" in result["strategy"]["topic_recommendations"]
    
    @patch('src.agents.content_strategy_research_agent.ContentStrategyResearchAgent._analyze_competitor_website')
    @patch('src.agents.content_strategy_research_agent.ContentStrategyResearchAgent._synthesize_competitive_insights')
    @patch('src.agents.content_strategy_research_agent.ContentStrategyResearchAgent._identify_competitive_opportunities')
    @patch('src.agents.content_strategy_research_agent.ContentStrategyResearchAgent._record_audit_trail')
    def test_handle_competitor_analysis(self, mock_audit, mock_opportunities, mock_insights, mock_analyze, agent):
        """Test handling competitor analysis."""
        # Setup mocks
        mock_analyze.return_value = {
            "website": "example.com",
            "content_frequency": "weekly",
            "primary_content_types": ["Blog", "Case Study"],
            "topic_coverage": {"AI": {"coverage_level": "comprehensive"}}
        }
        
        mock_insights.return_value = {
            "competitor_count": 3,
            "content_type_usage": {"Blog": 3},
            "topic_coverage": {"AI": {"saturation_level": "high"}},
            "distribution_channels": {"social_platforms": {"LinkedIn": 3}}
        }
        
        mock_opportunities.return_value = {
            "underserved_topics": [{"topic": "AI", "opportunity_score": 9.2}],
            "underutilized_content_types": [{"content_type": "Video", "opportunity_score": 8.5}],
            "differentiation_opportunities": [],
            "strategic_recommendations": []
        }
        
        task = {
            "task_id": "123",
            "task_type": "competitor_analysis_task",
            "brand_id": 123,
            "competitor_websites": ["example.com", "competitor.com"],
            "content_topics": ["AI", "Marketing"],
            "project_types": ["Blog", "Social Post"],
            "user_id": "user123"
        }
        
        result = agent.handle_competitor_analysis(task)
        
        # Verify mocks were called
        assert mock_analyze.call_count == 2  # Once for each website
        mock_insights.assert_called_once()
        mock_opportunities.assert_called_once()
        mock_audit.assert_called_once()
        
        # Verify response
        assert result["status"] == "success"
        assert "Analyzed 2 competitor websites" in result["message"]
        assert "competitor_analyses" in result
        assert "example.com" in result["competitor_analyses"]
        assert "competitor.com" in result["competitor_analyses"]
        assert "competitive_landscape" in result
        assert "strategic_opportunities" in result
    
    @patch('src.agents.content_strategy_research_agent.ContentStrategyResearchAgent._generate_content_calendar')
    @patch('src.agents.content_strategy_research_agent.ContentStrategyResearchAgent._record_audit_trail')
    def test_handle_content_calendar_creation(self, mock_audit, mock_calendar, agent):
        """Test handling content calendar creation."""
        # Setup mock
        mock_calendar.return_value = {
            "brand_id": 123,
            "timeframe": {"start_date": "2025-03-01", "end_date": "2025-05-31"},
            "content_items": [
                {
                    "id": "content_1",
                    "title": "AI Guide",
                    "project_type": "Blog",
                    "content_topic": "AI",
                    "scheduled_date": "2025-03-15"
                }
            ],
            "campaigns": [],
            "series": [],
            "distribution": {"by_project_type": {"Blog": 1}, "by_topic": {"AI": 1}}
        }
        
        task = {
            "task_id": "123",
            "task_type": "content_calendar_creation_task",
            "brand_id": 123,
            "content_topics": ["AI", "Marketing"],
            "project_types": ["Blog", "Social Post"],
            "scheduling_preferences": {"posting_frequency": {"Blog": 1}},
            "timeframe": {"start_date": "2025-03-01", "end_date": "2025-05-31"},
            "user_id": "user123"
        }
        
        result = agent.handle_content_calendar_creation(task)
        
        # Verify mocks were called
        mock_calendar.assert_called_once()
        mock_audit.assert_called_once()
        
        # Verify response
        assert result["status"] == "success"
        assert result["message"] == "Content calendar created for brand 123"
        assert "calendar" in result
        assert result["calendar"]["brand_id"] == 123
        assert "timeframe" in result["calendar"]
        assert "content_items" in result["calendar"]
        assert len(result["calendar"]["content_items"]) >= 1