import pytest
from unittest.mock import MagicMock, patch
from typing import Dict, Any

from src.agents.base_agent import BaseAgent
from src.agents.brand_project_management_agent import BrandProjectManagementAgent
from src.agents.content_strategy_research_agent import ContentStrategyResearchAgent
from src.agents.content_creation_testing_agent import ContentCreationTestingAgent
from src.agents.content_ad_management_agent import ContentAdManagementAgent
from src.agents.auth_integration_agent import AuthIntegrationAgent


@pytest.fixture
def mock_rabbitmq():
    with patch('src.core.messaging.RabbitMQClient') as mock:
        yield mock


@pytest.fixture
def mock_redis():
    with patch('src.core.cache.RedisCache') as mock:
        yield mock


@pytest.fixture
def agent_system(mock_rabbitmq, mock_redis):
    """Create a system with all agent types."""
    agents = {
        "auth_agent": AuthIntegrationAgent(
            agent_id="auth_agent",
            name="Auth & Integration Agent"
        ),
        "brand_agent": BrandProjectManagementAgent(
            agent_id="brand_agent",
            name="Brand & Project Management Agent"
        ),
        "strategy_agent": ContentStrategyResearchAgent(
            agent_id="strategy_agent",
            name="Content Strategy & Research Agent"
        ),
        "creation_agent": ContentCreationTestingAgent(
            agent_id="creation_agent",
            name="Content Creation & Testing Agent"
        ),
        "ad_agent": ContentAdManagementAgent(
            agent_id="ad_agent",
            name="Content & Ad Management Agent"
        )
    }
    
    # Configure send_task and broadcast_event mocks
    for agent_id, agent in agents.items():
        agent.send_task = MagicMock(return_value={"status": "success"})
        agent.broadcast_event = MagicMock()
    
    return agents


class TestEndToEndWorkflow:
    """Test complete end-to-end workflows across all agent types."""
    
    def test_complete_content_workflow(self, agent_system):
        """Test the complete content workflow from brand onboarding to content publication."""
        # Get agent references
        auth_agent = agent_system["auth_agent"]
        brand_agent = agent_system["brand_agent"]
        strategy_agent = agent_system["strategy_agent"]
        creation_agent = agent_system["creation_agent"]
        ad_agent = agent_system["ad_agent"]
        
        # Step 1: Authenticate user and verify integrations
        # Mock the platform integration check
        with patch.object(AuthIntegrationAgent, 'handle_verify_platform_integration') as mock_verify:
            mock_verify.return_value = {
                "status": "success",
                "integration_status": "active",
                "platform": "wordpress",
                "last_connected": "2025-03-20T12:34:56Z"
            }
            
            integration_task = {
                "task_id": "task1",
                "task_type": "verify_platform_integration",
                "platform": "wordpress",
                "user_id": "user123"
            }
            
            integration_result = auth_agent.handle_verify_platform_integration(integration_task)
        
        assert integration_result["status"] == "success"
        assert integration_result["integration_status"] == "active"
        
        # Step 2: Onboard a new brand
        # Mock website scraping
        with patch.object(BrandProjectManagementAgent, '_scrape_website_data') as mock_scrape:
            mock_scrape.return_value = {
                "description": "Test Company Description",
                "logo_url": "https://example.com/logo.png",
                "brand_guidelines": {
                    "color_palette": ["#123456", "#789abc"],
                    "typography": {"font_families": ["Arial", "Helvetica"]}
                }
            }
            
            # Mock audit trail
            with patch.object(BrandProjectManagementAgent, '_record_audit_trail'):
                onboarding_task = {
                    "task_id": "task2",
                    "task_type": "onboard_brand",
                    "company_name": "Test Company",
                    "website_url": "https://example.com",
                    "brand_guidelines": {"voice": "Professional"},
                    "user_id": "user123"
                }
                
                onboarding_result = brand_agent.handle_onboard_brand(onboarding_task)
        
        assert onboarding_result["status"] == "success"
        brand_id = onboarding_result["brand_id"]
        
        # Step 3: Create a content strategy project
        # Mock access check and audit trail
        with patch.object(BrandProjectManagementAgent, '_check_brand_access', return_value=True):
            with patch.object(BrandProjectManagementAgent, '_record_audit_trail'):
                project_task = {
                    "task_id": "task3",
                    "task_type": "create_project",
                    "brand_id": brand_id,
                    "project_type_id": 1,
                    "name": "Content Strategy Project",
                    "description": "Develop a comprehensive content strategy",
                    "user_id": "user123",
                    "due_date": "2025-04-15T00:00:00Z"
                }
                
                project_result = brand_agent.handle_create_project(project_task)
        
        assert project_result["status"] == "success"
        project_id = project_result["project_id"]
        
        # Step 4: Develop content strategy
        # Mock audit trail
        with patch.object(ContentStrategyResearchAgent, '_record_audit_trail'):
            strategy_task = {
                "task_id": "task4",
                "task_type": "content_strategy_development_task",
                "brand_id": brand_id,
                "project_id": project_id,
                "content_topics": ["Digital Marketing", "Content Strategy"],
                "project_types": ["Blog", "Social Post", "Email"],
                "business_objectives": {"increase_engagement": True, "generate_leads": True},
                "user_id": "user123"
            }
            
            strategy_result = strategy_agent.handle_content_strategy_development(strategy_task)
        
        assert strategy_result["status"] == "success"
        assert "strategy" in strategy_result
        strategy = strategy_result["strategy"]
        
        # Step 5: Create content calendar
        # Mock audit trail
        with patch.object(ContentStrategyResearchAgent, '_record_audit_trail'):
            calendar_task = {
                "task_id": "task5",
                "task_type": "content_calendar_creation_task",
                "brand_id": brand_id,
                "content_topics": ["Digital Marketing", "Content Strategy"],
                "project_types": ["Blog", "Social Post", "Email"],
                "timeframe": {"start_date": "2025-04-01", "end_date": "2025-06-30"},
                "user_id": "user123"
            }
            
            calendar_result = strategy_agent.handle_content_calendar_creation(calendar_task)
        
        assert calendar_result["status"] == "success"
        assert "calendar" in calendar_result
        calendar = calendar_result["calendar"]
        
        # Get the first content item from the calendar for generation
        content_item = calendar["content_items"][0]
        
        # Step 6: Generate content for the first calendar item
        # Mock AI content generation and audit trail
        with patch.object(ContentCreationTestingAgent, '_generate_content_with_ai') as mock_generate:
            mock_generate.return_value = {
                "title": "The Complete Guide to Digital Marketing (April 2025)",
                "content": "This is a mock content for the Digital Marketing blog post.",
                "meta_description": "Learn everything about Digital Marketing in our comprehensive guide.",
                "keywords": ["digital marketing", "marketing guide", "online marketing"],
                "word_count": 1200
            }
            
            with patch.object(ContentCreationTestingAgent, '_record_audit_trail'):
                generation_task = {
                    "task_id": "task6",
                    "task_type": "generate_content",
                    "brand_id": brand_id,
                    "project_id": project_id,
                    "content_item_id": content_item["id"],
                    "content_topic": content_item["content_topic"],
                    "project_type": content_item["project_type"],
                    "title": content_item["title"],
                    "brief": content_item["content_brief"],
                    "user_id": "user123"
                }
                
                generation_result = creation_agent.handle_generate_content(generation_task)
        
        assert generation_result["status"] == "success"
        assert "content" in generation_result
        content = generation_result["content"]
        
        # Step 7: Test content variations
        # Mock A/B testing and audit trail
        with patch.object(ContentCreationTestingAgent, '_generate_content_variations') as mock_variations:
            mock_variations.return_value = [
                {
                    "variation_id": "var1",
                    "title": "Digital Marketing Guide: Essential Strategies for 2025",
                    "content": "This is variation 1 of the content.",
                    "variation_description": "More action-oriented title and intro"
                },
                {
                    "variation_id": "var2",
                    "title": "Why Digital Marketing Matters in 2025: A Complete Guide",
                    "content": "This is variation 2 of the content.",
                    "variation_description": "Benefit-focused title and intro"
                }
            ]
            
            with patch.object(ContentCreationTestingAgent, '_record_audit_trail'):
                ab_test_task = {
                    "task_id": "task7",
                    "task_type": "ab_test_content",
                    "brand_id": brand_id,
                    "project_id": project_id,
                    "content_id": content["content_id"],
                    "original_content": content,
                    "test_elements": ["title", "intro"],
                    "variation_count": 2,
                    "user_id": "user123"
                }
                
                ab_test_result = creation_agent.handle_ab_test_content(ab_test_task)
        
        assert ab_test_result["status"] == "success"
        assert "variations" in ab_test_result
        variations = ab_test_result["variations"]
        assert len(variations) == 2
        
        # Step 8: Publish content
        # Mock publishing and audit trail
        with patch.object(ContentAdManagementAgent, '_publish_to_platform') as mock_publish:
            mock_publish.return_value = {
                "platform": "wordpress",
                "published_url": "https://example.com/blog/digital-marketing-guide",
                "published_date": "2025-04-01T10:00:00Z",
                "status": "published"
            }
            
            with patch.object(ContentAdManagementAgent, '_record_audit_trail'):
                publish_task = {
                    "task_id": "task8",
                    "task_type": "publish_content",
                    "brand_id": brand_id,
                    "project_id": project_id,
                    "content_id": content["content_id"],
                    "content": content,
                    "platform": "wordpress",
                    "publish_date": "2025-04-01T10:00:00Z",
                    "user_id": "user123"
                }
                
                publish_result = ad_agent.handle_publish_content(publish_task)
        
        assert publish_result["status"] == "success"
        assert "published_url" in publish_result
        assert "platform" in publish_result
        
        # Step 9: Create ad campaign for the published content
        # Mock ad campaign creation and audit trail
        with patch.object(ContentAdManagementAgent, '_create_ad_campaign_internal') as mock_ad:
            mock_ad.return_value = {
                "campaign_id": "ad123",
                "platform": "facebook",
                "status": "active",
                "budget": 500.00,
                "start_date": "2025-04-01T12:00:00Z",
                "end_date": "2025-04-30T23:59:59Z"
            }
            
            with patch.object(ContentAdManagementAgent, '_record_audit_trail'):
                ad_task = {
                    "task_id": "task9",
                    "task_type": "create_ad_campaign",
                    "brand_id": brand_id,
                    "content_id": content["content_id"],
                    "content_url": publish_result["published_url"],
                    "platform": "facebook",
                    "campaign_type": "traffic",
                    "budget": 500.00,
                    "start_date": "2025-04-01T12:00:00Z",
                    "end_date": "2025-04-30T23:59:59Z",
                    "targeting": {
                        "interests": ["digital marketing", "business"],
                        "age_range": {"min": 25, "max": 55},
                        "locations": ["United States", "Canada"]
                    },
                    "user_id": "user123"
                }
                
                ad_result = ad_agent.handle_create_ad_campaign(ad_task)
        
        assert ad_result["status"] == "success"
        assert "campaign_id" in ad_result
        assert ad_result["platform"] == "facebook"
        
        # Verify communication between agents through the workflow
        # Brand agent should have sent task to strategy agent
        brand_agent.send_task.assert_called()
        
        # Strategy agent should have sent event about calendar creation
        strategy_agent.broadcast_event.assert_called()
        
        # Creation agent should have sent task to ad agent
        creation_agent.send_task.assert_called()
        
        # Ad agent should have broadcast event about published content
        ad_agent.broadcast_event.assert_called()