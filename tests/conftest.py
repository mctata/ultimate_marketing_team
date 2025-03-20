"""
Global pytest fixtures for the Ultimate Marketing Team tests.

This file contains fixtures that can be used across all test files.
"""

import pytest
from unittest.mock import MagicMock, patch
from typing import Dict, Any

# Mock global dependencies
@pytest.fixture(autouse=True)
def mock_settings():
    """Mock settings for all tests to avoid loading real configuration files."""
    with patch('src.ultimate_marketing_team.core.settings.settings') as mock:
        # Configure mock settings
        mock.RABBITMQ_URL = "amqp://localhost"
        mock.RABBITMQ_QUEUE_PREFIX = "test_"
        mock.REDIS_URL = "redis://localhost"
        mock.LOG_LEVEL = "INFO"
        mock.ENV = "test"
        yield mock


@pytest.fixture
def mock_rabbitmq():
    """Mock RabbitMQ client for all tests to avoid actual message broker connections."""
    with patch('src.ultimate_marketing_team.core.messaging.RabbitMQClient') as mock:
        # Configure standard methods to return sensible defaults
        mock_instance = MagicMock()
        mock.return_value = mock_instance
        mock_instance.declare_queue.return_value = "test_queue"
        mock_instance.declare_exchange.return_value = "test_exchange"
        mock_instance.publish.return_value = None
        mock_instance.publish_direct.return_value = None
        yield mock


@pytest.fixture
def mock_redis():
    """Mock Redis cache for all tests to avoid actual Redis connections."""
    with patch('src.ultimate_marketing_team.core.cache.RedisCache') as mock:
        # Configure standard methods to return sensible defaults
        mock_instance = MagicMock()
        mock.return_value = mock_instance
        mock_instance.get.return_value = None
        mock_instance.set.return_value = None
        mock_instance.exists.return_value = False
        yield mock


@pytest.fixture
def mock_logger():
    """Mock logger for all tests to avoid cluttering test output with log messages."""
    with patch('src.ultimate_marketing_team.core.logging.logger') as mock:
        yield mock


@pytest.fixture
def sample_task():
    """Generate a sample task for testing."""
    return {
        "task_id": "test-task-123",
        "task_type": "test_task",
        "data": {
            "key1": "value1",
            "key2": "value2"
        },
        "user_id": "test-user-123"
    }


@pytest.fixture
def sample_event():
    """Generate a sample event for testing."""
    return {
        "event_id": "test-event-123",
        "event_type": "test_event",
        "data": {
            "key1": "value1",
            "key2": "value2"
        },
        "sender_agent_id": "test-agent-123",
        "timestamp": "2025-03-20T12:34:56Z"
    }


@pytest.fixture
def sample_brand():
    """Generate a sample brand for testing."""
    return {
        "id": 123,
        "name": "Test Brand",
        "website_url": "https://testbrand.com",
        "description": "A brand for testing",
        "logo_url": "https://testbrand.com/logo.png",
        "guidelines": {
            "voice": "Professional",
            "tone": "Friendly",
            "color_palette": ["#1a73e8", "#34a853", "#fbbc04", "#ea4335"],
            "typography": {"font_families": ["Roboto", "Open Sans"]}
        }
    }


@pytest.fixture
def sample_content_project():
    """Generate a sample content project for testing."""
    return {
        "id": 456,
        "name": "Test Content Project",
        "description": "A project for testing content creation",
        "brand_id": 123,
        "project_type": "Blog",
        "status": "in_progress",
        "created_by": 789,
        "assigned_to": 987,
        "due_date": "2025-04-15T00:00:00Z",
        "created_at": "2025-03-01T00:00:00Z",
        "updated_at": "2025-03-15T00:00:00Z"
    }


@pytest.fixture
def sample_content_strategy():
    """Generate a sample content strategy for testing."""
    return {
        "brand_id": 123,
        "strategic_themes": [
            {
                "name": "Industry Expertise",
                "description": "Demonstrate thought leadership",
                "topics": ["Digital Marketing"]
            }
        ],
        "recommended_formats": {
            "Blog": [
                {"name": "How-To Guide", "effectiveness": 9.0}
            ],
            "Social Post": [
                {"name": "Question Post", "effectiveness": 8.2}
            ]
        },
        "distribution_channels": {
            "primary": ["Company Blog", "LinkedIn"],
            "secondary": ["Twitter", "Industry Forums"]
        },
        "topic_recommendations": {
            "Digital Marketing": {
                "priority": 1,
                "recommended_angles": [
                    {"title": "The Ultimate Guide to Digital Marketing"}
                ],
                "recommended_keywords": [
                    {"keyword": "digital marketing strategy", "search_volume": 1000}
                ]
            }
        }
    }


@pytest.fixture
def sample_content():
    """Generate a sample content item for testing."""
    return {
        "content_id": "content-123",
        "title": "The Ultimate Guide to Digital Marketing",
        "content": "This is the content of the digital marketing guide.",
        "meta_description": "Learn all about digital marketing in this comprehensive guide.",
        "keywords": ["digital marketing", "marketing guide", "online marketing"],
        "word_count": 1200,
        "project_id": 456,
        "brand_id": 123,
        "author_id": 789,
        "created_at": "2025-03-20T10:30:00Z",
        "updated_at": "2025-03-20T11:45:00Z",
        "status": "draft"
    }