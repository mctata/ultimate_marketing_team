"""
Adapter implementations for integrating with existing components.

This module provides adapter classes that implement the new interfaces and
wrap existing implementations, enabling gradual migration to the new architecture.
"""

from typing import Any, Callable, Dict, List, Optional, Union
import time
import json
from datetime import datetime

# Import interfaces from architecture improvements
from src.architecture_improvements.01_interface_based_agents import (
    MessageBroker, Cache, CircuitBreaker, TracingProvider, Agent
)
from src.architecture_improvements.02_message_format_specification import (
    Message, TaskMessage, EventMessage, ResponseMessage, MessageFactory
)

# Import existing implementations (for reference only)
from src.core.messaging import RabbitMQClient
from src.core.cache import RedisCache
from src.core.rate_limiting import CircuitBreaker as LegacyCircuitBreaker
from src.core.monitoring import TraceManager
from src.agents.base_agent import BaseAgent as LegacyBaseAgent


class RabbitMQMessageBrokerAdapter(MessageBroker):
    """Adapter for existing RabbitMQ client implementing the MessageBroker interface."""
    
    def __init__(self, legacy_client: RabbitMQClient) -> None:
        """
        Initialize a new RabbitMQ adapter.
        
        Args:
            legacy_client: Existing RabbitMQ client to wrap
        """
        self._client = legacy_client
    
    def connect(self) -> None:
        """Establish connection to the message broker."""
        if not self._client.is_connected:
            self._client.connect()
    
    def disconnect(self) -> None:
        """Close connection to the message broker."""
        if self._client.is_connected:
            self._client.disconnect()
    
    def declare_queue(self, queue_name: str) -> None:
        """
        Declare a queue in the message broker.
        
        Args:
            queue_name: Name of the queue to declare
        """
        self._client.declare_queue(queue_name)
    
    def declare_exchange(self, exchange_name: str, exchange_type: str = 'topic') -> None:
        """
        Declare an exchange in the message broker.
        
        Args:
            exchange_name: Name of the exchange to declare
            exchange_type: Type of the exchange
        """
        self._client.declare_exchange(exchange_name, exchange_type)
    
    def bind_queue(self, queue_name: str, exchange_name: str, routing_key: str) -> None:
        """
        Bind a queue to an exchange with a routing key.
        
        Args:
            queue_name: Name of the queue to bind
            exchange_name: Name of the exchange to bind to
            routing_key: Routing key for the binding
        """
        self._client.bind_queue(queue_name, exchange_name, routing_key)
    
    def publish(self, exchange: str, routing_key: str, message: Dict[str, Any]) -> None:
        """
        Publish a message to an exchange with a routing key.
        
        Args:
            exchange: Name of the exchange to publish to
            routing_key: Routing key for the message
            message: Message to publish
        """
        # Convert new message format to legacy format if needed
        if isinstance(message, dict) and "message_type" in message:
            # Already in the right format, just publish
            self._client.publish(exchange, routing_key, message)
        else:
            # Convert to legacy format
            legacy_message = self._convert_to_legacy_format(message)
            self._client.publish(exchange, routing_key, legacy_message)
    
    def consume(self, queue_name: str, callback: Callable[[Dict[str, Any]], None]) -> None:
        """
        Consume messages from a queue with a callback function.
        
        Args:
            queue_name: Name of the queue to consume from
            callback: Callback function to handle messages
        """
        # Wrap the callback to convert legacy messages to new format
        def wrapped_callback(message: Dict[str, Any]) -> None:
            # Convert legacy message format to new format if needed
            if "message_type" not in message:
                message = self._convert_to_new_format(message)
            callback(message)
        
        self._client.consume(queue_name, wrapped_callback)
    
    def _convert_to_legacy_format(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert a new format message to legacy format.
        
        Args:
            message: New format message
            
        Returns:
            Legacy format message
        """
        # Basic conversion logic - would need to be expanded for production
        legacy_message = {}
        
        if "task_id" in message:
            legacy_message["task_id"] = message["task_id"]
            legacy_message["task_type"] = message.get("task_type", "unknown")
        elif "event_id" in message:
            legacy_message["event_id"] = message["event_id"]
            legacy_message["event_type"] = message.get("event_type", "unknown")
        elif "response_to" in message:
            legacy_message["response_to"] = message["response_to"]
            legacy_message["status"] = message.get("status", "success")
        
        legacy_message["message_id"] = message.get("message_id", str(time.time()))
        legacy_message["timestamp"] = message.get("timestamp", datetime.utcnow().isoformat())
        legacy_message["sender_agent_id"] = message.get("sender_agent_id", "unknown")
        legacy_message["payload"] = message.get("payload", {})
        
        return legacy_message
    
    def _convert_to_new_format(self, legacy_message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert a legacy format message to new format.
        
        Args:
            legacy_message: Legacy format message
            
        Returns:
            New format message
        """
        # Basic conversion logic - would need to be expanded for production
        if "task_id" in legacy_message and "task_type" in legacy_message:
            message = MessageFactory.create_task(
                sender_agent_id=legacy_message.get("sender_agent_id", "unknown"),
                target_agent_id=legacy_message.get("target_agent_id", "unknown"),
                task_type=legacy_message["task_type"],
                payload=legacy_message.get("payload", {}),
            )
        elif "event_id" in legacy_message and "event_type" in legacy_message:
            message = MessageFactory.create_event(
                sender_agent_id=legacy_message.get("sender_agent_id", "unknown"),
                event_type=legacy_message["event_type"],
                payload=legacy_message.get("payload", {}),
            )
        else:
            # Default to system message if we can't determine type
            message = MessageFactory.create_system(
                sender_agent_id=legacy_message.get("sender_agent_id", "unknown"),
                message="Legacy message conversion",
                system_type="info",
            )
        
        return message.to_dict()


class RedisCacheAdapter(Cache):
    """Adapter for existing Redis cache implementing the Cache interface."""
    
    def __init__(self, legacy_cache: RedisCache) -> None:
        """
        Initialize a new Redis cache adapter.
        
        Args:
            legacy_cache: Existing Redis cache to wrap
        """
        self._cache = legacy_cache
    
    def get(self, key: Any) -> Optional[Any]:
        """
        Get a value from the cache.
        
        Args:
            key: Key to get
            
        Returns:
            Value if found, None otherwise
        """
        return self._cache.get(str(key))
    
    def set(self, key: Any, value: Any, ttl: Optional[int] = None) -> None:
        """
        Set a value in the cache with optional TTL in seconds.
        
        Args:
            key: Key to set
            value: Value to set
            ttl: Time to live in seconds
        """
        self._cache.set(str(key), value, ttl=ttl)
    
    def delete(self, key: Any) -> None:
        """
        Delete a value from the cache.
        
        Args:
            key: Key to delete
        """
        self._cache.delete(str(key))
    
    def clear(self, pattern: Optional[str] = None) -> None:
        """
        Clear the cache, optionally by pattern.
        
        Args:
            pattern: Pattern to match keys for deletion
        """
        self._cache.clear(pattern=pattern)


class LegacyCircuitBreakerAdapter(CircuitBreaker):
    """Adapter for existing circuit breaker implementing the CircuitBreaker interface."""
    
    def __init__(self, legacy_breaker: LegacyCircuitBreaker) -> None:
        """
        Initialize a new circuit breaker adapter.
        
        Args:
            legacy_breaker: Existing circuit breaker to wrap
        """
        self._breaker = legacy_breaker
    
    def execute(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        """
        Execute a function with circuit breaker protection.
        
        Args:
            func: Function to execute
            *args: Positional arguments for the function
            **kwargs: Keyword arguments for the function
            
        Returns:
            Result of the function call
            
        Raises:
            Exception: If the circuit is open or the function raises
        """
        return self._breaker.call(func, *args, **kwargs)
    
    def success(self) -> None:
        """Record a successful execution."""
        self._breaker.record_success()
    
    def failure(self) -> None:
        """Record a failed execution."""
        self._breaker.record_failure()
    
    @property
    def state(self) -> str:
        """Get the current state of the circuit breaker."""
        return self._breaker.get_state().value


class TracingProviderAdapter(TracingProvider):
    """Adapter for existing tracing provider implementing the TracingProvider interface."""
    
    def __init__(self, legacy_tracer: TraceManager) -> None:
        """
        Initialize a new tracing provider adapter.
        
        Args:
            legacy_tracer: Existing tracer to wrap
        """
        self._tracer = legacy_tracer
    
    def start_span(self, name: str, parent_context: Optional[Any] = None) -> Any:
        """
        Start a new span.
        
        Args:
            name: Name of the span
            parent_context: Parent span context, if any
            
        Returns:
            A span object
        """
        if parent_context:
            return self._tracer.start_span(name, parent_id=parent_context.span_id)
        return self._tracer.start_span(name)
    
    def inject_context(self, carrier: Dict[str, str], context: Any = None) -> None:
        """
        Inject tracing context into a carrier for propagation.
        
        Args:
            carrier: Dictionary to inject context into
            context: Span context to inject, or None for current context
        """
        span = context or self._tracer.get_current_span()
        if span:
            carrier["trace_id"] = span.trace_id
            carrier["span_id"] = span.span_id
    
    def extract_context(self, carrier: Dict[str, str]) -> Any:
        """
        Extract tracing context from a carrier.
        
        Args:
            carrier: Dictionary containing context information
            
        Returns:
            Extracted context, or None if not found
        """
        if "trace_id" in carrier and "span_id" in carrier:
            return self._tracer.create_span_context(
                trace_id=carrier["trace_id"],
                span_id=carrier["span_id"],
            )
        return None
    
    def add_event(self, name: str, attributes: Optional[Dict[str, Any]] = None) -> None:
        """
        Add an event to the current span.
        
        Args:
            name: Name of the event
            attributes: Event attributes
        """
        self._tracer.add_event(name, attributes or {})
    
    def add_attribute(self, key: str, value: Any) -> None:
        """
        Add an attribute to the current span.
        
        Args:
            key: Attribute name
            value: Attribute value
        """
        self._tracer.add_attribute(key, value)
    
    def end_span(self) -> None:
        """End the current span."""
        self._tracer.end_span()


class LegacyAgentAdapter(Agent):
    """Adapter for existing agent implementing the Agent interface."""
    
    def __init__(
        self,
        legacy_agent: LegacyBaseAgent,
        broker: MessageBroker,
        cache: Cache,
        circuit_breaker: CircuitBreaker,
        tracer: TracingProvider,
    ) -> None:
        """
        Initialize a new agent adapter.
        
        Args:
            legacy_agent: Existing agent to wrap
            broker: Message broker implementation
            cache: Cache implementation
            circuit_breaker: Circuit breaker implementation
            tracer: Tracing provider implementation
        """
        super().__init__(
            agent_id=legacy_agent.agent_id,
            broker=broker,
            cache=cache,
            circuit_breaker=circuit_breaker,
            tracer=tracer,
        )
        self._legacy_agent = legacy_agent
    
    def _initialize(self) -> None:
        """Initialize the agent and register handlers."""
        # Map legacy task handlers to new format
        for task_type, handler in self._legacy_agent.task_handlers.items():
            self.register_task_handler(task_type, self._wrap_task_handler(handler))
        
        # Map legacy event handlers to new format
        for event_type, handler in self._legacy_agent.event_handlers.items():
            self.register_event_handler(event_type, self._wrap_event_handler(handler))
    
    def _wrap_task_handler(self, handler: Callable) -> Callable:
        """
        Wrap a legacy task handler to work with the new message format.
        
        Args:
            handler: Legacy task handler
            
        Returns:
            Wrapped handler
        """
        def wrapped_handler(message: Dict[str, Any]) -> Any:
            # Convert to legacy format if needed
            if isinstance(message, dict) and "payload" in message:
                legacy_message = {
                    "task_id": message.get("task_id", ""),
                    "task_type": message.get("task_type", ""),
                    "sender_agent_id": message.get("sender_agent_id", ""),
                    "target_agent_id": message.get("target_agent_id", ""),
                    "payload": message.get("payload", {}),
                }
                return handler(legacy_message)
            return handler(message)
        
        return wrapped_handler
    
    def _wrap_event_handler(self, handler: Callable) -> Callable:
        """
        Wrap a legacy event handler to work with the new message format.
        
        Args:
            handler: Legacy event handler
            
        Returns:
            Wrapped handler
        """
        def wrapped_handler(message: Dict[str, Any]) -> None:
            # Convert to legacy format if needed
            if isinstance(message, dict) and "payload" in message:
                legacy_message = {
                    "event_id": message.get("event_id", ""),
                    "event_type": message.get("event_type", ""),
                    "sender_agent_id": message.get("sender_agent_id", ""),
                    "payload": message.get("payload", {}),
                }
                handler(legacy_message)
            else:
                handler(message)
        
        return wrapped_handler