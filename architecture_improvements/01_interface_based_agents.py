"""
Interface-based Agent Architecture with Dependency Injection
This module defines the core interfaces and abstract classes for the agent architecture.
"""

from abc import ABC, abstractmethod
from typing import Any, Callable, Dict, List, Optional, Type, TypeVar, Union, Protocol
import uuid
from datetime import datetime
import json

# Type definitions
TaskType = str
EventType = str
AgentId = str
MessageId = str
HandlerId = str

# Define the message protocol interfaces
class Message(Protocol):
    """Base protocol for all messages in the system."""
    message_id: MessageId
    timestamp: datetime
    
class TaskMessage(Message):
    """Protocol for task messages."""
    task_id: str
    task_type: TaskType
    sender_agent_id: AgentId
    payload: Dict[str, Any]
    response_queue: Optional[str]
    
class EventMessage(Message):
    """Protocol for event messages."""
    event_id: str
    event_type: EventType
    sender_agent_id: AgentId
    payload: Dict[str, Any]
    
class ResponseMessage(Message):
    """Protocol for response messages."""
    task_id: str
    status: str
    agent_id: AgentId
    payload: Dict[str, Any]

# Define service interfaces
class MessageSerializer(Protocol):
    """Protocol for message serialization/deserialization."""
    
    def serialize(self, message: Union[TaskMessage, EventMessage, ResponseMessage]) -> bytes:
        """Serialize a message to bytes."""
        ...
        
    def deserialize(self, data: bytes) -> Union[TaskMessage, EventMessage, ResponseMessage]:
        """Deserialize bytes to a message."""
        ...

class MessageBroker(Protocol):
    """Protocol for message broker functionality."""
    
    def send_task(self, target_agent_id: AgentId, task_type: TaskType, 
                  payload: Dict[str, Any], wait_for_response: bool = False, 
                  timeout: int = 30) -> Optional[ResponseMessage]:
        """Send a task to a specific agent."""
        ...
        
    def broadcast_event(self, event_type: EventType, payload: Dict[str, Any]) -> None:
        """Broadcast an event to all listening agents."""
        ...
        
    def register_task_handler(self, task_type: TaskType, 
                            handler: Callable[[TaskMessage], ResponseMessage]) -> HandlerId:
        """Register a handler for a specific task type."""
        ...
        
    def register_event_handler(self, event_type: EventType,
                             handler: Callable[[EventMessage], None]) -> HandlerId:
        """Register a handler for a specific event type."""
        ...
        
    def start_consuming(self) -> None:
        """Start consuming messages."""
        ...
        
    def stop_consuming(self) -> None:
        """Stop consuming messages."""
        ...

class Cache(Protocol):
    """Protocol for cache functionality."""
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache."""
        ...
        
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set a value in the cache with optional TTL."""
        ...
        
    def delete(self, key: str) -> None:
        """Delete a value from the cache."""
        ...
        
    def exists(self, key: str) -> bool:
        """Check if a key exists in the cache."""
        ...

class CircuitBreaker(Protocol):
    """Protocol for circuit breaker functionality."""
    
    def execute(self, func: Callable, *args, **kwargs) -> Any:
        """Execute a function with circuit breaker protection."""
        ...
        
    def reset(self) -> None:
        """Reset the circuit breaker state."""
        ...
        
    @property
    def state(self) -> str:
        """Get the current state of the circuit breaker."""
        ...

class TracingProvider(Protocol):
    """Protocol for distributed tracing functionality."""
    
    def start_span(self, name: str, context: Optional[Any] = None) -> Any:
        """Start a new tracing span."""
        ...
        
    def end_span(self, span: Any) -> None:
        """End a tracing span."""
        ...
        
    def add_event(self, span: Any, name: str, attributes: Dict[str, Any]) -> None:
        """Add an event to a span."""
        ...
        
    def set_attribute(self, span: Any, key: str, value: Any) -> None:
        """Set an attribute on a span."""
        ...
        
    def inject_context(self, carrier: Dict[str, str], context: Any) -> None:
        """Inject tracing context into a carrier."""
        ...
        
    def extract_context(self, carrier: Dict[str, str]) -> Any:
        """Extract tracing context from a carrier."""
        ...

# Concrete implementation of JSON message serializer
class JsonMessageSerializer:
    """JSON implementation of the MessageSerializer protocol."""
    
    def serialize(self, message: Union[TaskMessage, EventMessage, ResponseMessage]) -> bytes:
        """Serialize a message to JSON bytes."""
        return json.dumps(message.__dict__).encode('utf-8')
        
    def deserialize(self, data: bytes) -> Union[TaskMessage, EventMessage, ResponseMessage]:
        """Deserialize JSON bytes to a message."""
        message_dict = json.loads(data.decode('utf-8'))
        
        # Determine message type and create appropriate object
        if 'task_type' in message_dict:
            return TaskMessage(**message_dict)
        elif 'event_type' in message_dict:
            return EventMessage(**message_dict)
        elif 'status' in message_dict:
            return ResponseMessage(**message_dict)
        else:
            raise ValueError(f"Unknown message type: {message_dict}")

# Base agent interface
class Agent(ABC):
    """Abstract base class for all agents in the system."""
    
    @property
    @abstractmethod
    def agent_id(self) -> AgentId:
        """Get the agent ID."""
        ...
    
    @abstractmethod
    def process_task(self, task: TaskMessage) -> ResponseMessage:
        """Process a task message."""
        ...
    
    @abstractmethod
    def process_event(self, event: EventMessage) -> None:
        """Process an event message."""
        ...
    
    @abstractmethod
    def start(self) -> None:
        """Start the agent."""
        ...
    
    @abstractmethod
    def stop(self) -> None:
        """Stop the agent."""
        ...

# Abstract base class for agents with default implementations
class BaseAgent(Agent):
    """Base implementation of the Agent interface with common functionality."""
    
    def __init__(self, 
                 agent_id: AgentId, 
                 message_broker: MessageBroker,
                 cache: Optional[Cache] = None,
                 circuit_breaker: Optional[CircuitBreaker] = None,
                 tracer: Optional[TracingProvider] = None):
        """Initialize a new BaseAgent instance.
        
        Args:
            agent_id: Unique identifier for this agent
            message_broker: Message broker for communication
            cache: Optional cache implementation
            circuit_breaker: Optional circuit breaker implementation
            tracer: Optional distributed tracing provider
        """
        self._agent_id = agent_id
        self._message_broker = message_broker
        self._cache = cache
        self._circuit_breaker = circuit_breaker
        self._tracer = tracer
        self._task_handlers = {}
        self._event_handlers = {}
        
        # Register default event handlers
        self._register_default_handlers()
    
    @property
    def agent_id(self) -> AgentId:
        """Get the agent ID."""
        return self._agent_id
    
    def send_task(self, target_agent_id: AgentId, task_type: TaskType, 
                  payload: Dict[str, Any], wait_for_response: bool = False, 
                  timeout: int = 30) -> Optional[ResponseMessage]:
        """Send a task to another agent.
        
        Args:
            target_agent_id: The ID of the target agent
            task_type: The type of task to send
            payload: The task payload
            wait_for_response: Whether to wait for a response
            timeout: Timeout in seconds when waiting for a response
            
        Returns:
            Response message if wait_for_response is True, otherwise None
        """
        span = None
        try:
            if self._tracer:
                span = self._tracer.start_span(f"send_task.{task_type}")
                self._tracer.set_attribute(span, "target_agent_id", target_agent_id)
                self._tracer.set_attribute(span, "task_type", task_type)
            
            # Use circuit breaker if available
            if self._circuit_breaker:
                return self._circuit_breaker.execute(
                    self._message_broker.send_task,
                    target_agent_id, task_type, payload, wait_for_response, timeout
                )
            else:
                return self._message_broker.send_task(
                    target_agent_id, task_type, payload, wait_for_response, timeout
                )
        finally:
            if span and self._tracer:
                self._tracer.end_span(span)
    
    def broadcast_event(self, event_type: EventType, payload: Dict[str, Any]) -> None:
        """Broadcast an event to all agents.
        
        Args:
            event_type: The type of event to broadcast
            payload: The event payload
        """
        span = None
        try:
            if self._tracer:
                span = self._tracer.start_span(f"broadcast_event.{event_type}")
                self._tracer.set_attribute(span, "event_type", event_type)
            
            # Use circuit breaker if available
            if self._circuit_breaker:
                self._circuit_breaker.execute(
                    self._message_broker.broadcast_event,
                    event_type, payload
                )
            else:
                self._message_broker.broadcast_event(event_type, payload)
        finally:
            if span and self._tracer:
                self._tracer.end_span(span)
    
    def register_task_handler(self, task_type: TaskType, 
                            handler: Callable[[TaskMessage], ResponseMessage]) -> HandlerId:
        """Register a handler for a specific task type.
        
        Args:
            task_type: The type of task to handle
            handler: The handler function
            
        Returns:
            Handler ID
        """
        handler_id = self._message_broker.register_task_handler(task_type, handler)
        self._task_handlers[task_type] = handler
        return handler_id
    
    def register_event_handler(self, event_type: EventType,
                             handler: Callable[[EventMessage], None]) -> HandlerId:
        """Register a handler for a specific event type.
        
        Args:
            event_type: The type of event to handle
            handler: The handler function
            
        Returns:
            Handler ID
        """
        handler_id = self._message_broker.register_event_handler(event_type, handler)
        self._event_handlers[event_type] = handler
        return handler_id
    
    def process_task(self, task: TaskMessage) -> ResponseMessage:
        """Process a task message.
        
        Args:
            task: The task message to process
            
        Returns:
            Response message
        """
        span = None
        try:
            if self._tracer:
                span = self._tracer.start_span(f"process_task.{task.task_type}")
                self._tracer.set_attribute(span, "task_id", task.task_id)
                self._tracer.set_attribute(span, "task_type", task.task_type)
                self._tracer.set_attribute(span, "sender_agent_id", task.sender_agent_id)
            
            handler = self._task_handlers.get(task.task_type)
            if handler:
                # Use circuit breaker if available
                if self._circuit_breaker:
                    return self._circuit_breaker.execute(handler, task)
                else:
                    return handler(task)
            else:
                # Default implementation for unhandled task types
                return self._default_task_handler(task)
        except Exception as e:
            # Create error response
            return ResponseMessage(
                message_id=str(uuid.uuid4()),
                timestamp=datetime.now(),
                task_id=task.task_id,
                status="error",
                agent_id=self.agent_id,
                payload={"error": str(e)}
            )
        finally:
            if span and self._tracer:
                self._tracer.end_span(span)
    
    def process_event(self, event: EventMessage) -> None:
        """Process an event message.
        
        Args:
            event: The event message to process
        """
        span = None
        try:
            if self._tracer:
                span = self._tracer.start_span(f"process_event.{event.event_type}")
                self._tracer.set_attribute(span, "event_id", event.event_id)
                self._tracer.set_attribute(span, "event_type", event.event_type)
                self._tracer.set_attribute(span, "sender_agent_id", event.sender_agent_id)
            
            handler = self._event_handlers.get(event.event_type)
            if handler:
                # Use circuit breaker if available
                if self._circuit_breaker:
                    self._circuit_breaker.execute(handler, event)
                else:
                    handler(event)
            else:
                # Default implementation for unhandled event types
                self._default_event_handler(event)
        except Exception as e:
            # Log the error but don't propagate
            print(f"Error processing event {event.event_type}: {str(e)}")
        finally:
            if span and self._tracer:
                self._tracer.end_span(span)
    
    def start(self) -> None:
        """Start the agent."""
        self._message_broker.start_consuming()
    
    def stop(self) -> None:
        """Stop the agent."""
        self._message_broker.stop_consuming()
    
    def _register_default_handlers(self) -> None:
        """Register default event handlers."""
        self.register_event_handler("heartbeat", self._heartbeat_handler)
        self.register_event_handler("shutdown", self._shutdown_handler)
    
    def _default_task_handler(self, task: TaskMessage) -> ResponseMessage:
        """Default handler for unhandled task types.
        
        Args:
            task: The task message to process
            
        Returns:
            Response message
        """
        return ResponseMessage(
            message_id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            task_id=task.task_id,
            status="error",
            agent_id=self.agent_id,
            payload={"error": f"Unhandled task type: {task.task_type}"}
        )
    
    def _default_event_handler(self, event: EventMessage) -> None:
        """Default handler for unhandled event types.
        
        Args:
            event: The event message to process
        """
        # By default, ignore unhandled events
        pass
    
    def _heartbeat_handler(self, event: EventMessage) -> None:
        """Handle heartbeat events.
        
        Args:
            event: The heartbeat event
        """
        # Respond with our own heartbeat
        self.broadcast_event("heartbeat_response", {
            "agent_id": self.agent_id,
            "timestamp": datetime.now().isoformat()
        })
    
    def _shutdown_handler(self, event: EventMessage) -> None:
        """Handle shutdown events.
        
        Args:
            event: The shutdown event
        """
        self.stop()

# Create agent factory
T = TypeVar('T', bound=Agent)

class AgentFactory:
    """Factory for creating agents with dependency injection."""
    
    @staticmethod
    def create_agent(agent_class: Type[T], 
                    agent_id: AgentId, 
                    message_broker: MessageBroker,
                    cache: Optional[Cache] = None,
                    circuit_breaker: Optional[CircuitBreaker] = None,
                    tracer: Optional[TracingProvider] = None,
                    **kwargs) -> T:
        """Create a new agent instance.
        
        Args:
            agent_class: The agent class to instantiate
            agent_id: Unique identifier for the agent
            message_broker: Message broker for communication
            cache: Optional cache implementation
            circuit_breaker: Optional circuit breaker implementation
            tracer: Optional distributed tracing provider
            **kwargs: Additional arguments to pass to the agent constructor
            
        Returns:
            New agent instance
        """
        return agent_class(
            agent_id=agent_id,
            message_broker=message_broker,
            cache=cache,
            circuit_breaker=circuit_breaker,
            tracer=tracer,
            **kwargs
        )