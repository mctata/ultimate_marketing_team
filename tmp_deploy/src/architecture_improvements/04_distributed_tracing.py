"""
Distributed tracing implementation using OpenTelemetry.

This module provides a comprehensive distributed tracing solution using
OpenTelemetry, allowing for end-to-end tracking of requests across service
boundaries and visualizing the flow of requests through the system.
"""

import functools
import logging
import os
import time
from contextlib import contextmanager
from typing import Any, Callable, Dict, Generator, Optional, TypeVar, cast, List, Union
import uuid
import inspect
from contextvars import ContextVar

# OpenTelemetry imports
try:
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import (
        BatchSpanProcessor, ConsoleSpanExporter
    )
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.semconv.resource import ResourceAttributes
    from opentelemetry.trace import Span, StatusCode
    from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
    from opentelemetry.baggage.propagation import W3CBaggagePropagator
    from opentelemetry.propagators import composite
    OTEL_AVAILABLE = True
except ImportError:
    OTEL_AVAILABLE = False
    # Define stub classes for type checking
    class Span:
        pass
    
    class StatusCode:
        OK = "OK"
        ERROR = "ERROR"

T = TypeVar('T')  # Return type of decorated functions
logger = logging.getLogger(__name__)

# Context variable to store the current trace context
current_span_ctx: ContextVar[Optional[Span]] = ContextVar('current_span', default=None)


class OpenTelemetryTracer:
    """
    Tracer implementation using OpenTelemetry.
    
    This class provides a wrapper around OpenTelemetry to simplify its usage
    and integrate it with the rest of the system.
    """
    
    def __init__(
        self,
        service_name: str,
        instance_id: Optional[str] = None,
        exporter_endpoint: Optional[str] = None,
        sample_rate: float = 1.0,
        console_export: bool = False,
    ) -> None:
        """
        Initialize a new OpenTelemetry tracer.
        
        Args:
            service_name: Name of the service being traced
            instance_id: Unique identifier for this service instance
            exporter_endpoint: OTLP exporter endpoint (default: use env var)
            sample_rate: Sampling rate for traces (0.0-1.0)
            console_export: Whether to also export traces to console
        """
        self.service_name = service_name
        self.instance_id = instance_id or str(uuid.uuid4())[:8]
        
        if not OTEL_AVAILABLE:
            logger.warning("OpenTelemetry not available. Distributed tracing disabled.")
            return
        
        # Create a resource describing this service
        resource = Resource.create({
            ResourceAttributes.SERVICE_NAME: service_name,
            ResourceAttributes.SERVICE_INSTANCE_ID: self.instance_id,
            ResourceAttributes.DEPLOYMENT_ENVIRONMENT: os.environ.get("DEPLOYMENT_ENV", "development"),
        })
        
        # Create a tracer provider
        trace_provider = TracerProvider(resource=resource)
        
        # Configure exporters
        if exporter_endpoint or os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT"):
            endpoint = exporter_endpoint or os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "")
            otlp_exporter = OTLPSpanExporter(endpoint=endpoint)
            trace_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
        
        if console_export:
            console_exporter = ConsoleSpanExporter()
            trace_provider.add_span_processor(BatchSpanProcessor(console_exporter))
        
        # Set the global tracer provider
        trace.set_tracer_provider(trace_provider)
        
        # Get a tracer instance for this component
        self.tracer = trace.get_tracer(service_name)
        
        # Set up propagators for context extraction/injection
        self.propagator = composite.CompositePropagator([
            TraceContextTextMapPropagator(),
            W3CBaggagePropagator(),
        ])
    
    def start_span(
        self,
        name: str,
        parent_context: Optional[Any] = None,
        attributes: Optional[Dict[str, Any]] = None,
        kind: Optional[Any] = None,
    ) -> Any:
        """
        Start a new span.
        
        Args:
            name: Name of the span
            parent_context: Parent span context, if any
            attributes: Initial span attributes
            kind: Span kind
            
        Returns:
            A span object
        """
        if not OTEL_AVAILABLE:
            return DummySpan(name, attributes)
        
        # If no parent is provided, check if we have a current span in context
        if parent_context is None:
            current = current_span_ctx.get()
            if current is not None:
                parent_context = current
        
        # Start a new span, using the provided context if available
        context_kwargs = {}
        if parent_context is not None:
            context_kwargs["context"] = parent_context
        
        kind_param = None
        if kind is not None:
            kind_param = kind
        
        span = self.tracer.start_span(
            name,
            attributes=attributes or {},
            kind=kind_param,
            **context_kwargs,
        )
        
        # Update the context variable
        token = current_span_ctx.set(span)
        span._token = token  # Store the token to reset later
        
        return span
    
    def inject_context(self, carrier: Dict[str, str], context: Any = None) -> None:
        """
        Inject tracing context into a carrier for propagation.
        
        Args:
            carrier: Dictionary to inject context into
            context: Span context to inject, or None for current context
        """
        if not OTEL_AVAILABLE:
            return
        
        if context is None:
            context = trace.get_current_span().get_span_context()
        
        self.propagator.inject(carrier, context=context)
    
    def extract_context(self, carrier: Dict[str, str]) -> Any:
        """
        Extract tracing context from a carrier.
        
        Args:
            carrier: Dictionary containing context information
            
        Returns:
            Extracted context, or None if not found
        """
        if not OTEL_AVAILABLE:
            return None
        
        return self.propagator.extract(carrier=carrier)
    
    def add_event(
        self,
        name: str,
        attributes: Optional[Dict[str, Any]] = None,
        span: Optional[Any] = None,
    ) -> None:
        """
        Add an event to a span.
        
        Args:
            name: Name of the event
            attributes: Event attributes
            span: Span to add the event to, or None for current span
        """
        if not OTEL_AVAILABLE:
            return
        
        if span is None:
            span = trace.get_current_span()
        
        span.add_event(name, attributes=attributes or {})
    
    def add_attribute(
        self,
        key: str,
        value: Any,
        span: Optional[Any] = None,
    ) -> None:
        """
        Add an attribute to a span.
        
        Args:
            key: Attribute name
            value: Attribute value
            span: Span to add the attribute to, or None for current span
        """
        if not OTEL_AVAILABLE:
            return
        
        if span is None:
            span = trace.get_current_span()
        
        span.set_attribute(key, value)
    
    def record_exception(
        self,
        exception: Exception,
        attributes: Optional[Dict[str, Any]] = None,
        span: Optional[Any] = None,
    ) -> None:
        """
        Record an exception in a span.
        
        Args:
            exception: Exception to record
            attributes: Additional attributes about the exception
            span: Span to record the exception in, or None for current span
        """
        if not OTEL_AVAILABLE:
            return
        
        if span is None:
            span = trace.get_current_span()
        
        span.record_exception(exception, attributes=attributes or {})
        span.set_status(StatusCode.ERROR, str(exception))
    
    def end_span(self, span: Optional[Any] = None) -> None:
        """
        End a span.
        
        Args:
            span: Span to end, or None for current span
        """
        if not OTEL_AVAILABLE:
            return
        
        if span is None:
            span = trace.get_current_span()
        
        # Reset the context variable if this is the current span
        if hasattr(span, "_token"):
            current_span_ctx.reset(span._token)
        
        span.end()


class DummySpan:
    """Dummy span implementation for when OpenTelemetry is not available."""
    
    def __init__(self, name: str, attributes: Optional[Dict[str, Any]] = None) -> None:
        """Initialize a new dummy span."""
        self.name = name
        self.attributes = attributes or {}
        self._token = None
    
    def __enter__(self) -> 'DummySpan':
        """Enter the context manager."""
        return self
    
    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Exit the context manager."""
        pass
    
    def set_attribute(self, key: str, value: Any) -> None:
        """Set an attribute on the span."""
        self.attributes[key] = value
    
    def add_event(self, name: str, attributes: Optional[Dict[str, Any]] = None) -> None:
        """Add an event to the span."""
        pass
    
    def record_exception(
        self, exception: Exception, attributes: Optional[Dict[str, Any]] = None
    ) -> None:
        """Record an exception in the span."""
        pass
    
    def set_status(self, status: str, description: Optional[str] = None) -> None:
        """Set the status of the span."""
        pass
    
    def end(self) -> None:
        """End the span."""
        pass


@contextmanager
def trace_span(
    name: str,
    tracer: Optional[OpenTelemetryTracer] = None,
    attributes: Optional[Dict[str, Any]] = None,
    kind: Optional[Any] = None,
) -> Generator[Any, None, None]:
    """
    Context manager for creating and managing spans.
    
    Args:
        name: Name of the span
        tracer: Tracer to use, or None to use the global tracer
        attributes: Initial span attributes
        kind: Span kind
        
    Yields:
        The span
    """
    span = None
    if tracer is not None:
        span = tracer.start_span(name=name, attributes=attributes, kind=kind)
    elif OTEL_AVAILABLE:
        tracer_from_provider = trace.get_tracer(__name__)
        span = tracer_from_provider.start_span(name=name, attributes=attributes, kind=kind)
        token = current_span_ctx.set(span)
        span._token = token
    else:
        span = DummySpan(name=name, attributes=attributes)
    
    try:
        yield span
    except Exception as e:
        if tracer is not None:
            tracer.record_exception(e, span=span)
        elif OTEL_AVAILABLE and isinstance(span, Span):
            span.record_exception(e)
            span.set_status(StatusCode.ERROR, str(e))
        raise
    finally:
        if tracer is not None:
            tracer.end_span(span)
        elif OTEL_AVAILABLE and isinstance(span, Span):
            if hasattr(span, "_token"):
                current_span_ctx.reset(span._token)
            span.end()
        else:
            span.end()


def trace_method(
    name: Optional[str] = None,
    attributes_from_args: Optional[List[str]] = None,
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """
    Decorator for tracing methods.
    
    Args:
        name: Name of the span, defaults to method name
        attributes_from_args: List of parameter names to include as span attributes
        
    Returns:
        Decorated method
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            # Get the instance (self) for methods
            instance = args[0] if args else None
            
            # Get the tracer from the instance or use global
            tracer = getattr(instance, "_tracer", None)
            
            # Generate the span name
            if name is not None:
                span_name = name
            else:
                if instance is not None:
                    span_name = f"{instance.__class__.__name__}.{func.__name__}"
                else:
                    span_name = func.__name__
            
            # Extract attributes from arguments
            extracted_attributes = {}
            if attributes_from_args:
                # Get the function signature
                sig = inspect.signature(func)
                param_names = list(sig.parameters.keys())
                
                # Map positional args to their parameter names
                for i, arg in enumerate(args[1:], 1):  # Skip self
                    if i < len(param_names) and param_names[i] in attributes_from_args:
                        # Only include simple types as attributes
                        if isinstance(arg, (str, int, float, bool)) or arg is None:
                            extracted_attributes[param_names[i]] = arg
                
                # Add keyword args
                for param_name, value in kwargs.items():
                    if param_name in attributes_from_args:
                        # Only include simple types as attributes
                        if isinstance(value, (str, int, float, bool)) or value is None:
                            extracted_attributes[param_name] = value
            
            # Add function name as an attribute
            extracted_attributes["function"] = func.__qualname__
            
            # Create and manage a span
            with trace_span(span_name, tracer, extracted_attributes) as span:
                # Record start time for calculating duration
                start_time = time.time()
                
                try:
                    # Call the original function
                    result = func(*args, **kwargs)
                    
                    # Record duration
                    duration = time.time() - start_time
                    if tracer is not None:
                        tracer.add_attribute("duration_seconds", duration, span)
                    elif OTEL_AVAILABLE and isinstance(span, Span):
                        span.set_attribute("duration_seconds", duration)
                    
                    # Record success status
                    if tracer is not None:
                        tracer.add_attribute("status", "success", span)
                    elif OTEL_AVAILABLE and isinstance(span, Span):
                        span.set_status(StatusCode.OK)
                    
                    return result
                except Exception as e:
                    # Record exception details
                    if tracer is not None:
                        tracer.record_exception(e, span=span)
                        tracer.add_attribute("status", "error", span)
                        tracer.add_attribute("error.type", e.__class__.__name__, span)
                        tracer.add_attribute("error.message", str(e), span)
                    elif OTEL_AVAILABLE and isinstance(span, Span):
                        span.record_exception(e)
                        span.set_status(StatusCode.ERROR, str(e))
                        span.set_attribute("error.type", e.__class__.__name__)
                        span.set_attribute("error.message", str(e))
                    
                    # Re-raise the exception
                    raise
        
        return wrapper
    
    return decorator


class TracingRabbitMQMiddleware:
    """Middleware for tracing RabbitMQ messages."""
    
    def __init__(self, tracer: OpenTelemetryTracer) -> None:
        """
        Initialize a new RabbitMQ tracing middleware.
        
        Args:
            tracer: Tracer to use for spans
        """
        self.tracer = tracer
    
    def before_publish(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a message before it is published.
        
        Args:
            message: Message to be published
            
        Returns:
            Processed message
        """
        # Ensure trace_context exists in the message
        if "trace_context" not in message:
            message["trace_context"] = {}
        
        # Inject current trace context
        self.tracer.inject_context(message["trace_context"])
        
        return message
    
    def after_receive(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a message after it is received.
        
        Args:
            message: Received message
            
        Returns:
            Processed message
        """
        # Extract trace context if present
        if "trace_context" in message:
            context = self.tracer.extract_context(message["trace_context"])
            
            # Start a new span as child of the extracted context
            with self.tracer.start_span(
                f"process_message_{message.get('message_type', 'unknown')}",
                parent_context=context,
                attributes={
                    "message_id": message.get("message_id", "unknown"),
                    "sender": message.get("sender_agent_id", "unknown"),
                    "message_type": message.get("message_type", "unknown"),
                },
            ) as span:
                # Store the span in the message for handlers
                message["_span"] = span
        
        return message


class TracingSQLAlchemyMiddleware:
    """Middleware for tracing SQLAlchemy database operations."""
    
    def __init__(self, tracer: OpenTelemetryTracer) -> None:
        """
        Initialize a new SQLAlchemy tracing middleware.
        
        Args:
            tracer: Tracer to use for spans
        """
        self.tracer = tracer
    
    def before_execute(
        self, conn: Any, cursor: Any, statement: str, parameters: Any, context: Any, executemany: bool
    ) -> None:
        """
        Process a statement before it is executed.
        
        Args:
            conn: Connection
            cursor: Cursor
            statement: SQL statement
            parameters: Statement parameters
            context: Execution context
            executemany: Whether this is an executemany operation
        """
        # Start a new span for this database operation
        span = self.tracer.start_span(
            "db_execute",
            attributes={
                "db.statement": statement[:1000],  # Truncate to avoid huge spans
                "db.executemany": executemany,
                "db.operation": statement.split()[0].upper() if statement else "",
            },
        )
        
        # Store the span in the execution context
        if context is not None:
            context._span = span
    
    def after_execute(
        self, conn: Any, cursor: Any, statement: str, parameters: Any, context: Any, executemany: bool
    ) -> None:
        """
        Process a statement after it is executed.
        
        Args:
            conn: Connection
            cursor: Cursor
            statement: SQL statement
            parameters: Statement parameters
            context: Execution context
            executemany: Whether this is an executemany operation
        """
        # End the span if it exists
        if context is not None and hasattr(context, "_span"):
            # Add row count if available
            if cursor is not None and hasattr(cursor, "rowcount"):
                self.tracer.add_attribute("db.rows_affected", cursor.rowcount, context._span)
            
            # End the span
            self.tracer.end_span(context._span)


class TracingRedisMiddleware:
    """Middleware for tracing Redis operations."""
    
    def __init__(self, tracer: OpenTelemetryTracer) -> None:
        """
        Initialize a new Redis tracing middleware.
        
        Args:
            tracer: Tracer to use for spans
        """
        self.tracer = tracer
    
    def before_command(self, command: str, args: List[Any]) -> Any:
        """
        Process a command before it is executed.
        
        Args:
            command: Redis command
            args: Command arguments
            
        Returns:
            Span for the command
        """
        # Start a new span for this Redis operation
        return self.tracer.start_span(
            f"redis_{command.lower()}",
            attributes={
                "redis.command": command,
                "redis.args": str(args)[:100],  # Truncate to avoid huge spans
            },
        )
    
    def after_command(self, span: Any, result: Any) -> None:
        """
        Process a command after it is executed.
        
        Args:
            span: Span for the command
            result: Command result
        """
        # Add result type to the span
        self.tracer.add_attribute("redis.result_type", type(result).__name__, span)
        
        # End the span
        self.tracer.end_span(span)