"""
Interface-based dependency injection for agents using Protocol.

This module defines the interfaces for agent components using Python's Protocol
class, enabling better dependency injection, testability, and decoupling.
"""

from abc import ABC, abstractmethod
from typing import Any, Callable, Dict, List, Optional, Protocol, TypeVar, Union
import uuid
from datetime import datetime

T = TypeVar('T')  # Generic type for cache values
K = TypeVar('K')  # Generic type for cache keys

class MessageBroker(Protocol):
    """Protocol for message broker implementations."""
    
    def connect(self) -> None:
        """Establish connection to the message broker."""
        ...
    
    def disconnect(self) -> None:
        """Close connection to the message broker."""
        ...
    
    def declare_queue(self, queue_name: str) -> None:
        """Declare a queue in the message broker."""
        ...
    
    def declare_exchange(self, exchange_name: str, exchange_type: str = 'topic') -> None:
        """Declare an exchange in the message broker."""
        ...
    
    def bind_queue(self, queue_name: str, exchange_name: str, routing_key: str) -> None:
        """Bind a queue to an exchange with a routing key."""
        ...
    
    def publish(self, exchange: str, routing_key: str, message: Dict[str, Any]) -> None:
        """Publish a message to an exchange with a routing key."""
        ...
    
    def consume(self, queue_name: str, callback: Callable[[Dict[str, Any]], None]) -> None:
        """Consume messages from a queue with a callback function."""
        ...

class Cache(Protocol):
    """Protocol for cache implementations."""
    
    def get(self, key: K) -> Optional[T]:
        """Get a value from the cache."""
        ...
    
    def set(self, key: K, value: T, ttl: Optional[int] = None) -> None:
        """Set a value in the cache with optional TTL in seconds."""
        ...
    
    def delete(self, key: K) -> None:
        """Delete a value from the cache."""
        ...
    
    def clear(self, pattern: Optional[str] = None) -> None:
        """Clear the cache, optionally by pattern."""
        ...

class CircuitBreaker(Protocol):
    """Protocol for circuit breaker implementations."""
    
    def execute(self, func: Callable[..., T], *args: Any, **kwargs: Any) -> T:
        """Execute a function with circuit breaker protection."""
        ...
    
    def success(self) -> None:
        """Record a successful execution."""
        ...
    
    def failure(self) -> None:
        """Record a failed execution."""
        ...
    
    @property
    def state(self) -> str:
        """Get the current state of the circuit breaker."""
        ...

class TracingProvider(Protocol):
    """Protocol for distributed tracing providers."""
    
    def start_span(self, name: str, parent_context: Optional[Any] = None) -> Any:
        """Start a new span."""
        ...
    
    def inject_context(self, carrier: Dict[str, str], context: Any) -> None:
        """Inject tracing context into a carrier for propagation."""
        ...
    
    def extract_context(self, carrier: Dict[str, str]) -> Any:
        """Extract tracing context from a carrier."""
        ...
    
    def add_event(self, name: str, attributes: Optional[Dict[str, Any]] = None) -> None:
        """Add an event to the current span."""
        ...
    
    def add_attribute(self, key: str, value: Any) -> None:
        """Add an attribute to the current span."""
        ...
    
    def end_span(self) -> None:
        """End the current span."""
        ...

class Agent(ABC):
    """Abstract base class for agent implementations."""
    
    def __init__(
        self,
        agent_id: str,
        broker: MessageBroker,
        cache: Cache,
        circuit_breaker: CircuitBreaker,
        tracer: TracingProvider,
    ) -> None:
        self.agent_id = agent_id
        self._broker = broker
        self._cache = cache
        self._circuit_breaker = circuit_breaker
        self._tracer = tracer
        self._task_handlers: Dict[str, Callable] = {}
        self._event_handlers: Dict[str, Callable] = {}
        self._initialize()

    @abstractmethod
    def _initialize(self) -> None:
        """Initialize the agent and register handlers."""
        pass

    def register_task_handler(self, task_type: str, handler: Callable) -> None:
        """Register a handler for a specific task type."""
        self._task_handlers[task_type] = handler

    def register_event_handler(self, event_type: str, handler: Callable) -> None:
        """Register a handler for a specific event type."""
        self._event_handlers[event_type] = handler

    def handle_message(self, message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Handle an incoming message based on its type."""
        with self._tracer.start_span(f"{self.agent_id}.handle_message") as span:
            self._tracer.add_attribute("message.id", message.get("message_id", "unknown"))
            
            if "task_id" in message:
                task_type = message.get("task_type", "unknown")
                self._tracer.add_attribute("task.type", task_type)
                
                handler = self._task_handlers.get(task_type)
                if handler:
                    try:
                        result = self._circuit_breaker.execute(handler, message)
                        self._circuit_breaker.success()
                        return self._create_response(message, result)
                    except Exception as e:
                        self._circuit_breaker.failure()
                        self._tracer.add_event("task.error", {"error": str(e)})
                        return self._create_error_response(message, str(e))
                else:
                    error_msg = f"No handler registered for task type: {task_type}"
                    self._tracer.add_event("task.error", {"error": error_msg})
                    return self._create_error_response(message, error_msg)
            
            elif "event_id" in message:
                event_type = message.get("event_type", "unknown")
                self._tracer.add_attribute("event.type", event_type)
                
                handler = self._event_handlers.get(event_type)
                if handler:
                    try:
                        self._circuit_breaker.execute(handler, message)
                        self._circuit_breaker.success()
                    except Exception as e:
                        self._circuit_breaker.failure()
                        self._tracer.add_event("event.error", {"error": str(e)})
                return None
            
            else:
                error_msg = "Unknown message type"
                self._tracer.add_event("message.error", {"error": error_msg})
                return self._create_error_response(message, error_msg)

    def send_task(
        self, 
        target_agent_id: str, 
        task_type: str, 
        payload: Dict[str, Any],
        wait_for_response: bool = False,
        timeout: int = 30
    ) -> Optional[Dict[str, Any]]:
        """Send a task to another agent."""
        message = {
            "message_id": str(uuid.uuid4()),
            "task_id": str(uuid.uuid4()),
            "task_type": task_type,
            "timestamp": datetime.utcnow().isoformat(),
            "sender_agent_id": self.agent_id,
            "target_agent_id": target_agent_id,
            "payload": payload,
            "trace_context": {},  # Will be filled by tracer
        }
        
        with self._tracer.start_span(f"{self.agent_id}.send_task") as span:
            self._tracer.add_attribute("task.type", task_type)
            self._tracer.add_attribute("target.agent", target_agent_id)
            self._tracer.inject_context(message["trace_context"], span)
            
            # Implement sending logic depending on wait_for_response
            self._broker.publish("tasks", target_agent_id, message)
            self._tracer.add_event("task.sent")
            
            if wait_for_response:
                # Implement waiting for response
                # This would depend on the specific message broker implementation
                self._tracer.add_event("waiting.for.response", {"timeout": timeout})
                # ... wait for response logic ...
                return {"status": "success", "message": "Response placeholder"}
                
            return None

    def broadcast_event(
        self, 
        event_type: str, 
        payload: Dict[str, Any]
    ) -> None:
        """Broadcast an event to all listening agents."""
        message = {
            "message_id": str(uuid.uuid4()),
            "event_id": str(uuid.uuid4()),
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "sender_agent_id": self.agent_id,
            "payload": payload,
            "trace_context": {},  # Will be filled by tracer
        }
        
        with self._tracer.start_span(f"{self.agent_id}.broadcast_event") as span:
            self._tracer.add_attribute("event.type", event_type)
            self._tracer.inject_context(message["trace_context"], span)
            
            self._broker.publish("events", event_type, message)
            self._tracer.add_event("event.broadcast")

    def _create_response(self, original_message: Dict[str, Any], result: Any) -> Dict[str, Any]:
        """Create a response message for a task."""
        return {
            "message_id": str(uuid.uuid4()),
            "response_to": original_message.get("message_id", "unknown"),
            "task_id": original_message.get("task_id", "unknown"),
            "timestamp": datetime.utcnow().isoformat(),
            "sender_agent_id": self.agent_id,
            "target_agent_id": original_message.get("sender_agent_id", "unknown"),
            "status": "success",
            "result": result,
            "trace_context": {},  # Will be filled by tracer
        }

    def _create_error_response(self, original_message: Dict[str, Any], error: str) -> Dict[str, Any]:
        """Create an error response message."""
        return {
            "message_id": str(uuid.uuid4()),
            "response_to": original_message.get("message_id", "unknown"),
            "task_id": original_message.get("task_id", "unknown"),
            "timestamp": datetime.utcnow().isoformat(),
            "sender_agent_id": self.agent_id,
            "target_agent_id": original_message.get("sender_agent_id", "unknown"),
            "status": "error",
            "error": error,
            "trace_context": {},  # Will be filled by tracer
        }

class AgentFactory:
    """Factory for creating agent instances with dependencies."""
    
    @staticmethod
    def create_agent(
        agent_class: type,
        agent_id: str,
        broker: MessageBroker,
        cache: Cache,
        circuit_breaker: CircuitBreaker,
        tracer: TracingProvider,
    ) -> Agent:
        """Create an agent instance with the required dependencies."""
        return agent_class(
            agent_id=agent_id,
            broker=broker,
            cache=cache,
            circuit_breaker=circuit_breaker,
            tracer=tracer,
        )