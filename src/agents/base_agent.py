# Standard library imports
import queue
import threading
import uuid
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Callable, Union

# Third-party imports
from loguru import logger

# Local imports
from src.core.messaging import RabbitMQClient
from src.core.cache import RedisCache

class BaseAgent(ABC):
    """Base class for all agents in the system.
    
    This class defines the common interface and shared functionality
    for all specialized agents in the Ultimate Marketing Team platform.
    """
    
    def __init__(self, agent_id: str, name: str):
        self.agent_id = agent_id
        self.name = name
        self.mq_client = RabbitMQClient()
        self.cache = RedisCache()
        self.task_handlers = {}
        self.is_running = False
        self.input_queue = f"{self.agent_id}_queue"
        self.event_handlers = {}
        self._initialize()
    
    def _initialize(self):
        """Initialize agent-specific setup.
        
        This method should be overridden by subclasses to initialize
        agent-specific resources and configurations.
        """
        # Register basic event handlers
        self.register_event_handler("heartbeat", self._handle_heartbeat)
        self.register_event_handler("shutdown", self._handle_shutdown)
    
    def register_task_handler(self, task_type: str, handler: Callable[[Dict[str, Any]], Any]):
        """Register a handler for a specific task type."""
        self.task_handlers[task_type] = handler
        logger.debug(f"Registered handler for task type: {task_type}")
    
    def register_event_handler(self, event_type: str, handler: Callable[[Dict[str, Any]], Any]):
        """Register a handler for a specific event type."""
        self.event_handlers[event_type] = handler
        logger.debug(f"Registered handler for event type: {event_type}")
    
    @abstractmethod
    def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process a task assigned to this agent.
        
        This method should be implemented by all agent subclasses to define
        their specific task processing logic.
        
        Args:
            task: A dictionary containing task details
            
        Returns:
            A dictionary containing the task result
        """
        pass
    
    def handle_task(self, message: Dict[str, Any]):
        """Handle an incoming task message."""
        try:
            task_type = message.get("task_type")
            task_id = message.get("task_id")
            logger.info(f"Received task: {task_id} of type: {task_type}")
            
            if task_type in self.task_handlers:
                # Use registered handler if available
                result = self.task_handlers[task_type](message)
            else:
                # Default to generic processing
                result = self.process_task(message)
            
            # Send result back if response_queue is specified
            response_queue = message.get("response_queue")
            if response_queue and result is not None:
                result["task_id"] = task_id
                result["agent_id"] = self.agent_id
                self.mq_client.publish_direct(response_queue, result)
                logger.debug(f"Sent result for task {task_id} to {response_queue}")
                
            return result
        except Exception as e:
            logger.error(f"Error handling task: {e}")
            # Send error response if response_queue is specified
            response_queue = message.get("response_queue")
            if response_queue:
                error_result = {
                    "task_id": message.get("task_id"),
                    "agent_id": self.agent_id,
                    "status": "error",
                    "error": str(e)
                }
                self.mq_client.publish_direct(response_queue, error_result)
            return {"status": "error", "error": str(e)}
    
    def handle_event(self, message: Dict[str, Any]):
        """Handle an incoming event message."""
        try:
            event_type = message.get("event_type")
            event_id = message.get("event_id")
            logger.info(f"Received event: {event_id} of type: {event_type}")
            
            if event_type in self.event_handlers:
                # Use registered handler if available
                result = self.event_handlers[event_type](message)
                return result
            else:
                logger.warning(f"No handler registered for event type: {event_type}")
                return {"status": "ignored", "reason": f"No handler for event type: {event_type}"}
        except Exception as e:
            logger.error(f"Error handling event: {e}")
            return {"status": "error", "error": str(e)}
    
    def _handle_heartbeat(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle heartbeat events to check agent health."""
        return {
            "status": "alive",
            "agent_id": self.agent_id,
            "name": self.name,
            "timestamp": message.get("timestamp")
        }
    
    def _handle_shutdown(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle shutdown events to gracefully stop the agent."""
        logger.info(f"Received shutdown signal. Stopping agent: {self.agent_id}")
        self.stop()
        return {"status": "shutdown", "agent_id": self.agent_id}
    
    def start(self):
        """Start the agent and begin processing tasks."""
        if self.is_running:
            logger.warning(f"Agent {self.agent_id} is already running")
            return
        
        try:
            # Declare input queue
            self.mq_client.declare_queue(self.input_queue)
            logger.info(f"Agent {self.agent_id} ({self.name}) started")
            
            # Define message callback
            def message_callback(message):
                if "task_type" in message:
                    self.handle_task(message)
                elif "event_type" in message:
                    self.handle_event(message)
                else:
                    logger.warning(f"Unknown message type: {message}")
            
            # Start consuming
            self.is_running = True
            self.mq_client.consume(self.input_queue, message_callback)
        except Exception as e:
            logger.error(f"Error starting agent {self.agent_id}: {e}")
            self.is_running = False
    
    def stop(self):
        """Stop the agent and clean up resources."""
        if not self.is_running:
            logger.warning(f"Agent {self.agent_id} is not running")
            return
        
        try:
            # Close messaging connection
            self.mq_client.close()
            logger.info(f"Agent {self.agent_id} ({self.name}) stopped")
            self.is_running = False
        except Exception as e:
            logger.error(f"Error stopping agent {self.agent_id}: {e}")
    
    def send_task(self, target_agent_id: str, task: Dict[str, Any], wait_for_response: bool = False) -> Optional[Dict[str, Any]]:
        """Send a task to another agent.
        
        Args:
            target_agent_id: ID of the target agent
            task: Task details
            wait_for_response: Whether to wait for a response
            
        Returns:
            Task result if wait_for_response is True, None otherwise
        """
        try:
            # Generate task ID if not provided
            if "task_id" not in task:
                task["task_id"] = str(uuid.uuid4())
            
            # Set sender information
            task["sender_agent_id"] = self.agent_id
            
            # Create response queue if waiting for response
            if wait_for_response:
                response_queue = f"response_{self.agent_id}_{uuid.uuid4()}"
                self.mq_client.declare_queue(response_queue)
                task["response_queue"] = response_queue
                
                # Send task
                target_queue = f"{target_agent_id}_queue"
                self.mq_client.publish_direct(target_queue, task)
                
                result_queue = queue.Queue()
                
                def response_callback(message):
                    result_queue.put(message)
                
                # Start consuming from response queue
                threading.Thread(
                    target=self.mq_client.consume,
                    args=(response_queue, response_callback),
                    daemon=True
                ).start()
                
                # Wait for response with timeout (30 seconds)
                try:
                    result = result_queue.get(timeout=30)
                    return result
                except queue.Empty:
                    logger.warning(f"Timeout waiting for response from {target_agent_id}")
                    return {"status": "timeout", "error": "No response received"}
            else:
                # Send task without waiting for response
                target_queue = f"{target_agent_id}_queue"
                self.mq_client.publish_direct(target_queue, task)
                return None
        except Exception as e:
            logger.error(f"Error sending task to {target_agent_id}: {e}")
            return {"status": "error", "error": str(e)}
    
    def broadcast_event(self, event: Dict[str, Any]):
        """Broadcast an event to all agents.
        
        Args:
            event: Event details
        """
        try:
            # Generate event ID if not provided
            if "event_id" not in event:
                event["event_id"] = str(uuid.uuid4())
            
            # Set sender information
            event["sender_agent_id"] = self.agent_id
            
            # Broadcast to events exchange
            self.mq_client.declare_exchange("events")
            self.mq_client.publish("events", "broadcast", event)
            logger.debug(f"Broadcasted event: {event['event_id']} of type: {event.get('event_type')}")
        except Exception as e:
            logger.error(f"Error broadcasting event: {e}")
