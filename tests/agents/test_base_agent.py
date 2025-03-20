import pytest
from unittest.mock import MagicMock, patch
from typing import Dict, Any

from src.agents.base_agent import BaseAgent

# Test implementation of BaseAgent (since it's abstract)
class TestAgent(BaseAgent):
    def __init__(self, agent_id: str, name: str):
        super().__init__(agent_id, name)
        
    def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        return {"status": "processed", "task_data": task}


@pytest.fixture
def mock_rabbitmq():
    with patch('src.ultimate_marketing_team.core.messaging.RabbitMQClient') as mock:
        yield mock


@pytest.fixture
def mock_redis():
    with patch('src.ultimate_marketing_team.core.cache.RedisCache') as mock:
        yield mock


@pytest.fixture
def test_agent(mock_rabbitmq, mock_redis):
    agent = TestAgent("test_agent", "Test Agent")
    return agent


class TestBaseAgent:
    def test_initialization(self, test_agent, mock_rabbitmq, mock_redis):
        """Test that agent initializes correctly with proper attributes."""
        assert test_agent.agent_id == "test_agent"
        assert test_agent.name == "Test Agent"
        assert test_agent.is_running is False
        assert test_agent.input_queue == "test_agent_queue"
        assert "heartbeat" in test_agent.event_handlers
        assert "shutdown" in test_agent.event_handlers
        
    def test_register_task_handler(self, test_agent):
        """Test registering a task handler."""
        mock_handler = MagicMock()
        test_agent.register_task_handler("test_task", mock_handler)
        assert "test_task" in test_agent.task_handlers
        assert test_agent.task_handlers["test_task"] == mock_handler
        
    def test_register_event_handler(self, test_agent):
        """Test registering an event handler."""
        mock_handler = MagicMock()
        test_agent.register_event_handler("test_event", mock_handler)
        assert "test_event" in test_agent.event_handlers
        assert test_agent.event_handlers["test_event"] == mock_handler
        
    def test_handle_task_with_handler(self, test_agent):
        """Test handling a task with a registered handler."""
        mock_handler = MagicMock(return_value={"status": "success"})
        test_agent.register_task_handler("test_task", mock_handler)
        
        task_message = {
            "task_id": "123",
            "task_type": "test_task",
            "data": {"key": "value"}
        }
        
        result = test_agent.handle_task(task_message)
        
        mock_handler.assert_called_once_with(task_message)
        assert result == {"status": "success"}
        
    def test_handle_task_without_handler(self, test_agent):
        """Test handling a task without a registered handler."""
        task_message = {
            "task_id": "123",
            "task_type": "unknown_task",
            "data": {"key": "value"}
        }
        
        result = test_agent.handle_task(task_message)
        
        assert result == {"status": "processed", "task_data": task_message}
        
    def test_handle_task_with_response_queue(self, test_agent):
        """Test handling a task with a response queue."""
        mock_handler = MagicMock(return_value={"status": "success"})
        test_agent.register_task_handler("test_task", mock_handler)
        
        task_message = {
            "task_id": "123",
            "task_type": "test_task",
            "response_queue": "response_queue",
            "data": {"key": "value"}
        }
        
        test_agent.handle_task(task_message)
        
        test_agent.mq_client.publish_direct.assert_called_once()
        call_args = test_agent.mq_client.publish_direct.call_args[0]
        assert call_args[0] == "response_queue"
        assert call_args[1]["task_id"] == "123"
        assert call_args[1]["agent_id"] == "test_agent"
        assert call_args[1]["status"] == "success"
        
    def test_handle_task_with_error(self, test_agent):
        """Test handling a task that raises an error."""
        mock_handler = MagicMock(side_effect=ValueError("Test error"))
        test_agent.register_task_handler("test_task", mock_handler)
        
        task_message = {
            "task_id": "123",
            "task_type": "test_task",
            "data": {"key": "value"}
        }
        
        result = test_agent.handle_task(task_message)
        
        assert result["status"] == "error"
        assert "Test error" in result["error"]
        
    def test_handle_event_with_handler(self, test_agent):
        """Test handling an event with a registered handler."""
        mock_handler = MagicMock(return_value={"status": "success"})
        test_agent.register_event_handler("test_event", mock_handler)
        
        event_message = {
            "event_id": "123",
            "event_type": "test_event",
            "data": {"key": "value"}
        }
        
        result = test_agent.handle_event(event_message)
        
        mock_handler.assert_called_once_with(event_message)
        assert result == {"status": "success"}
        
    def test_handle_event_without_handler(self, test_agent):
        """Test handling an event without a registered handler."""
        event_message = {
            "event_id": "123",
            "event_type": "unknown_event",
            "data": {"key": "value"}
        }
        
        result = test_agent.handle_event(event_message)
        
        assert result["status"] == "ignored"
        assert "No handler for event type" in result["reason"]
        
    def test_heartbeat_handler(self, test_agent):
        """Test the heartbeat event handler."""
        event_message = {
            "event_id": "123",
            "event_type": "heartbeat",
            "timestamp": "2023-01-01T00:00:00"
        }
        
        result = test_agent._handle_heartbeat(event_message)
        
        assert result["status"] == "alive"
        assert result["agent_id"] == "test_agent"
        assert result["name"] == "Test Agent"
        assert result["timestamp"] == "2023-01-01T00:00:00"
        
    def test_shutdown_handler(self, test_agent):
        """Test the shutdown event handler."""
        event_message = {
            "event_id": "123",
            "event_type": "shutdown"
        }
        
        # Mock the stop method
        test_agent.stop = MagicMock()
        
        result = test_agent._handle_shutdown(event_message)
        
        test_agent.stop.assert_called_once()
        assert result["status"] == "shutdown"
        assert result["agent_id"] == "test_agent"
        
    def test_start(self, test_agent):
        """Test starting the agent."""
        # Mock methods to avoid actual RabbitMQ interaction
        test_agent.mq_client.declare_queue = MagicMock()
        test_agent.mq_client.consume = MagicMock()
        
        test_agent.start()
        
        test_agent.mq_client.declare_queue.assert_called_once_with("test_agent_queue")
        test_agent.mq_client.consume.assert_called_once()
        assert test_agent.is_running is True
        
    def test_start_already_running(self, test_agent):
        """Test starting an already running agent."""
        test_agent.is_running = True
        
        test_agent.start()
        
        test_agent.mq_client.declare_queue.assert_not_called()
        test_agent.mq_client.consume.assert_not_called()
        
    def test_stop(self, test_agent):
        """Test stopping the agent."""
        test_agent.is_running = True
        
        test_agent.stop()
        
        test_agent.mq_client.close.assert_called_once()
        assert test_agent.is_running is False
        
    def test_stop_not_running(self, test_agent):
        """Test stopping an agent that is not running."""
        test_agent.is_running = False
        
        test_agent.stop()
        
        test_agent.mq_client.close.assert_not_called()
        
    def test_send_task_without_waiting(self, test_agent):
        """Test sending a task without waiting for response."""
        task = {"task_type": "test_task", "data": {"key": "value"}}
        
        with patch('uuid.uuid4', return_value="test-uuid"):
            result = test_agent.send_task("target_agent", task)
        
        assert result is None
        test_agent.mq_client.publish_direct.assert_called_once()
        call_args = test_agent.mq_client.publish_direct.call_args[0]
        assert call_args[0] == "target_agent_queue"
        assert call_args[1]["task_id"] == "test-uuid"
        assert call_args[1]["sender_agent_id"] == "test_agent"
        assert call_args[1]["task_type"] == "test_task"
        assert "response_queue" not in call_args[1]
        
    def test_broadcast_event(self, test_agent):
        """Test broadcasting an event."""
        event = {"event_type": "test_event", "data": {"key": "value"}}
        
        with patch('uuid.uuid4', return_value="test-uuid"):
            test_agent.broadcast_event(event)
        
        test_agent.mq_client.declare_exchange.assert_called_once_with("events")
        test_agent.mq_client.publish.assert_called_once()
        call_args = test_agent.mq_client.publish.call_args[0]
        assert call_args[0] == "events"
        assert call_args[1] == "broadcast"
        assert call_args[2]["event_id"] == "test-uuid"
        assert call_args[2]["sender_agent_id"] == "test_agent"
        assert call_args[2]["event_type"] == "test_event"