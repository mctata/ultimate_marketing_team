"""
Distributed Tracing with OpenTelemetry
This module provides distributed tracing functionality using OpenTelemetry.
"""

import logging
import os
import uuid
from typing import Any, Dict, Optional, Union, Callable, TypeVar, cast
import functools

# Configure logging
logger = logging.getLogger(__name__)

# Type variables for decorators
F = TypeVar('F', bound=Callable[..., Any])
AsyncF = TypeVar('AsyncF', bound=Callable[..., Any])

class TracingConfig:
    """Configuration for distributed tracing."""
    
    # Environment variables for configuration
    OTEL_ENABLED = os.environ.get('OTEL_ENABLED', 'true').lower() in ('true', '1', 'yes')
    OTEL_SERVICE_NAME = os.environ.get('OTEL_SERVICE_NAME', 'ultimate-marketing-team')
    OTEL_EXPORTER_OTLP_ENDPOINT = os.environ.get('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4317')
    OTEL_EXPORTER_OTLP_PROTOCOL = os.environ.get('OTEL_EXPORTER_OTLP_PROTOCOL', 'grpc')
    OTEL_EXPORTER_OTLP_HEADERS = os.environ.get('OTEL_EXPORTER_OTLP_HEADERS', '')
    OTEL_SAMPLING_RATE = float(os.environ.get('OTEL_SAMPLING_RATE', '1.0'))
    OTEL_PROPAGATORS = os.environ.get('OTEL_PROPAGATORS', 'tracecontext,baggage')

class OpenTelemetryTracer:
    """
    OpenTelemetry tracer implementation.
    
    This class provides distributed tracing functionality using OpenTelemetry.
    It can be used to trace requests across multiple services and components.
    
    Usage example:
    ```
    # Initialize tracer
    tracer = OpenTelemetryTracer.get_instance()
    
    # Create a span
    with tracer.start_as_current_span("operation_name") as span:
        # Add attributes
        span.set_attribute("key", "value")
        
        # Add events
        span.add_event("event_name", {"key": "value"})
        
        # Perform the operation
        result = perform_operation()
    ```
    
    Alternatively, use the decorator:
    ```
    @trace("operation_name")
    def my_function(arg1, arg2):
        # Function implementation
        return result
    ```
    """
    
    _instance = None
    
    @classmethod
    def get_instance(cls) -> 'OpenTelemetryTracer':
        """Get singleton instance of the tracer."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def __init__(self):
        """Initialize the tracer."""
        self._initialized = False
        
        if not TracingConfig.OTEL_ENABLED:
            logger.info("OpenTelemetry tracing is disabled")
            return
        
        try:
            # Import OpenTelemetry modules
            from opentelemetry import trace
            from opentelemetry.sdk.trace import TracerProvider
            from opentelemetry.sdk.trace.export import BatchSpanProcessor
            from opentelemetry.sdk.resources import Resource
            from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
            from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
            
            # Create tracer provider
            resource = Resource.create({
                "service.name": TracingConfig.OTEL_SERVICE_NAME,
                "service.instance.id": str(uuid.uuid4())
            })
            
            provider = TracerProvider(resource=resource)
            
            # Create exporter
            headers = {}
            if TracingConfig.OTEL_EXPORTER_OTLP_HEADERS:
                for header in TracingConfig.OTEL_EXPORTER_OTLP_HEADERS.split(','):
                    if ':' in header:
                        key, value = header.split(':', 1)
                        headers[key.strip()] = value.strip()
            
            exporter = OTLPSpanExporter(
                endpoint=TracingConfig.OTEL_EXPORTER_OTLP_ENDPOINT,
                headers=headers
            )
            
            # Add span processor
            span_processor = BatchSpanProcessor(exporter)
            provider.add_span_processor(span_processor)
            
            # Set global tracer provider
            trace.set_tracer_provider(provider)
            
            # Initialize propagators
            propagators = []
            if 'tracecontext' in TracingConfig.OTEL_PROPAGATORS:
                from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
                propagators.append(TraceContextTextMapPropagator())
            
            if 'baggage' in TracingConfig.OTEL_PROPAGATORS:
                from opentelemetry.baggage.propagation import W3CBaggagePropagator
                propagators.append(W3CBaggagePropagator())
            
            if 'b3' in TracingConfig.OTEL_PROPAGATORS:
                from opentelemetry.propagators.b3 import B3MultiFormat
                propagators.append(B3MultiFormat())
            
            # Set global propagator
            if propagators:
                from opentelemetry.propagate import set_global_textmap
                from opentelemetry.propagators.composite import CompositePropagator
                set_global_textmap(CompositePropagator(propagators))
            
            # Get tracer
            self._tracer = trace.get_tracer(__name__)
            self._trace = trace
            self._initialized = True
            logger.info(f"OpenTelemetry tracer initialized for service: {TracingConfig.OTEL_SERVICE_NAME}")
        
        except ImportError:
            logger.warning("OpenTelemetry packages not installed. Tracing is disabled.")
    
    @property
    def initialized(self) -> bool:
        """Check if the tracer is initialized."""
        return self._initialized
    
    def start_span(self, name: str, context: Optional[Any] = None, kind: Optional[Any] = None,
                  attributes: Optional[Dict[str, Any]] = None) -> Any:
        """
        Start a new span.
        
        Args:
            name: Name of the span
            context: Parent context (optional)
            kind: Span kind (optional)
            attributes: Span attributes (optional)
            
        Returns:
            New span
        """
        if not self._initialized:
            # Return dummy span if not initialized
            return DummySpan(name)
        
        span_kind = None
        if kind:
            span_kind = getattr(self._trace.SpanKind, kind, None)
        
        if context:
            return self._tracer.start_span(
                name=name,
                context=context,
                kind=span_kind,
                attributes=attributes
            )
        else:
            return self._tracer.start_span(
                name=name,
                kind=span_kind,
                attributes=attributes
            )
    
    def start_as_current_span(self, name: str, context: Optional[Any] = None, kind: Optional[Any] = None,
                            attributes: Optional[Dict[str, Any]] = None) -> Any:
        """
        Start a new span as the current span.
        
        Args:
            name: Name of the span
            context: Parent context (optional)
            kind: Span kind (optional)
            attributes: Span attributes (optional)
            
        Returns:
            Span context manager
        """
        if not self._initialized:
            # Return dummy span if not initialized
            return DummySpanContextManager(name)
        
        span_kind = None
        if kind:
            span_kind = getattr(self._trace.SpanKind, kind, None)
        
        if context:
            return self._tracer.start_as_current_span(
                name=name,
                context=context,
                kind=span_kind,
                attributes=attributes
            )
        else:
            return self._tracer.start_as_current_span(
                name=name,
                kind=span_kind,
                attributes=attributes
            )
    
    def end_span(self, span: Any) -> None:
        """
        End a span.
        
        Args:
            span: Span to end
        """
        if not self._initialized or isinstance(span, DummySpan):
            return
        
        span.end()
    
    def add_event(self, span: Any, name: str, attributes: Optional[Dict[str, Any]] = None) -> None:
        """
        Add an event to a span.
        
        Args:
            span: Span to add the event to
            name: Event name
            attributes: Event attributes (optional)
        """
        if not self._initialized or isinstance(span, DummySpan):
            return
        
        span.add_event(name=name, attributes=attributes)
    
    def set_attribute(self, span: Any, key: str, value: Any) -> None:
        """
        Set an attribute on a span.
        
        Args:
            span: Span to set the attribute on
            key: Attribute key
            value: Attribute value
        """
        if not self._initialized or isinstance(span, DummySpan):
            return
        
        span.set_attribute(key=key, value=value)
    
    def set_status(self, span: Any, status: str, description: Optional[str] = None) -> None:
        """
        Set the status of a span.
        
        Args:
            span: Span to set the status on
            status: Status code ("OK", "ERROR")
            description: Optional status description
        """
        if not self._initialized or isinstance(span, DummySpan):
            return
        
        if status == "OK":
            span.set_status(self._trace.Status(self._trace.StatusCode.OK))
        elif status == "ERROR":
            span.set_status(self._trace.Status(self._trace.StatusCode.ERROR, description))
    
    def get_current_span(self) -> Any:
        """
        Get the current span.
        
        Returns:
            Current span
        """
        if not self._initialized:
            return DummySpan("current")
        
        return self._trace.get_current_span()
    
    def inject_context(self, carrier: Dict[str, str], context: Optional[Any] = None) -> None:
        """
        Inject tracing context into a carrier.
        
        Args:
            carrier: Dictionary to inject context into
            context: Context to inject (optional, uses current context if not provided)
        """
        if not self._initialized:
            return
        
        from opentelemetry import propagate
        
        if context:
            propagate.inject(carrier, context=context)
        else:
            propagate.inject(carrier)
    
    def extract_context(self, carrier: Dict[str, str]) -> Any:
        """
        Extract tracing context from a carrier.
        
        Args:
            carrier: Dictionary to extract context from
            
        Returns:
            Extracted context
        """
        if not self._initialized:
            return None
        
        from opentelemetry import propagate
        return propagate.extract(carrier)
    
    def record_exception(self, span: Any, exception: Exception) -> None:
        """
        Record an exception on a span.
        
        Args:
            span: Span to record the exception on
            exception: Exception to record
        """
        if not self._initialized or isinstance(span, DummySpan):
            return
        
        span.record_exception(exception)
        self.set_status(span, "ERROR", str(exception))

# Dummy implementations for when tracing is disabled
class DummySpan:
    """Dummy span implementation for when tracing is disabled."""
    
    def __init__(self, name: str):
        """Initialize with a name."""
        self.name = name
    
    def end(self) -> None:
        """End the span."""
        pass
    
    def add_event(self, name: str, attributes: Optional[Dict[str, Any]] = None) -> None:
        """Add an event to the span."""
        pass
    
    def set_attribute(self, key: str, value: Any) -> None:
        """Set an attribute on the span."""
        pass
    
    def set_status(self, status: Any) -> None:
        """Set the status of the span."""
        pass
    
    def record_exception(self, exception: Exception) -> None:
        """Record an exception on the span."""
        pass

class DummySpanContextManager:
    """Dummy span context manager for when tracing is disabled."""
    
    def __init__(self, name: str):
        """Initialize with a name."""
        self.name = name
        self.span = DummySpan(name)
    
    def __enter__(self) -> DummySpan:
        """Enter the context."""
        return self.span
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Exit the context."""
        pass

# Trace decorators
def trace(name: Optional[str] = None) -> Callable[[F], F]:
    """
    Decorator for tracing a function.
    
    Args:
        name: Name of the span (defaults to function name)
        
    Returns:
        Decorated function
    """
    def decorator(func: F) -> F:
        span_name = name or func.__name__
        tracer = OpenTelemetryTracer.get_instance()
        
        if is_async_function(func):
            @functools.wraps(func)
            async def wrapper(*args: Any, **kwargs: Any) -> Any:
                with tracer.start_as_current_span(span_name) as span:
                    try:
                        result = await func(*args, **kwargs)
                        return result
                    except Exception as e:
                        tracer.record_exception(span, e)
                        raise
        else:
            @functools.wraps(func)
            def wrapper(*args: Any, **kwargs: Any) -> Any:
                with tracer.start_as_current_span(span_name) as span:
                    try:
                        result = func(*args, **kwargs)
                        return result
                    except Exception as e:
                        tracer.record_exception(span, e)
                        raise
        
        return cast(F, wrapper)
    
    return decorator

# Utility functions
def is_async_function(func: Callable) -> bool:
    """Check if a function is an async function."""
    import inspect
    return inspect.iscoroutinefunction(func)

# Trace context utilities
class TraceContext:
    """Utility class for working with trace context."""
    
    @staticmethod
    def get_current_span_context() -> Optional[Dict[str, str]]:
        """
        Get the current span context as a dictionary.
        
        Returns:
            Dictionary with trace ID and span ID, or None if no current span
        """
        tracer = OpenTelemetryTracer.get_instance()
        if not tracer.initialized:
            return None
        
        span = tracer.get_current_span()
        if not span or isinstance(span, DummySpan):
            return None
        
        span_context = span.get_span_context()
        if not span_context:
            return None
        
        return {
            "trace_id": format(span_context.trace_id, "032x"),
            "span_id": format(span_context.span_id, "016x"),
            "trace_flags": format(span_context.trace_flags, "02x")
        }
    
    @staticmethod
    def extract_from_headers(headers: Dict[str, str]) -> Optional[Any]:
        """
        Extract trace context from HTTP headers.
        
        Args:
            headers: HTTP headers dictionary
            
        Returns:
            Extracted context, or None if extraction failed
        """
        tracer = OpenTelemetryTracer.get_instance()
        if not tracer.initialized:
            return None
        
        return tracer.extract_context(headers)
    
    @staticmethod
    def inject_into_headers(headers: Dict[str, str], context: Optional[Any] = None) -> None:
        """
        Inject trace context into HTTP headers.
        
        Args:
            headers: HTTP headers dictionary to inject into
            context: Context to inject (optional, uses current context if not provided)
        """
        tracer = OpenTelemetryTracer.get_instance()
        if not tracer.initialized:
            return
        
        tracer.inject_context(headers, context)

# Integration with RabbitMQ
class RabbitMQTracing:
    """Utility class for RabbitMQ tracing integration."""
    
    CARRIER_PROPERTY = "opentelemetry"
    
    @staticmethod
    def inject_span_context(message_properties: Any) -> None:
        """
        Inject span context into RabbitMQ message properties.
        
        Args:
            message_properties: RabbitMQ message properties
        """
        tracer = OpenTelemetryTracer.get_instance()
        if not tracer.initialized:
            return
        
        carrier = {}
        tracer.inject_context(carrier)
        
        if hasattr(message_properties, "headers") and message_properties.headers is None:
            message_properties.headers = {}
        
        if hasattr(message_properties, "headers"):
            message_properties.headers[RabbitMQTracing.CARRIER_PROPERTY] = carrier
    
    @staticmethod
    def extract_span_context(message_properties: Any) -> Optional[Any]:
        """
        Extract span context from RabbitMQ message properties.
        
        Args:
            message_properties: RabbitMQ message properties
            
        Returns:
            Extracted context, or None if extraction failed
        """
        tracer = OpenTelemetryTracer.get_instance()
        if not tracer.initialized:
            return None
        
        headers = getattr(message_properties, "headers", {}) or {}
        carrier = headers.get(RabbitMQTracing.CARRIER_PROPERTY, {})
        
        if not carrier:
            return None
        
        return tracer.extract_context(carrier)

# Integration with FastAPI
class FastAPITracing:
    """Utility class for FastAPI tracing integration."""
    
    @staticmethod
    def setup_tracing(app: Any) -> None:
        """
        Setup tracing for a FastAPI application.
        
        Args:
            app: FastAPI application
        """
        tracer = OpenTelemetryTracer.get_instance()
        if not tracer.initialized:
            return
        
        @app.middleware("http")
        async def tracing_middleware(request: Any, call_next: Callable) -> Any:
            # Extract context from request headers
            context = tracer.extract_context(dict(request.headers))
            
            # Get request details
            method = request.method
            url = str(request.url)
            
            # Start span
            with tracer.start_as_current_span(
                f"{method} {request.url.path}",
                context=context,
                kind="SERVER",
                attributes={
                    "http.method": method,
                    "http.url": url,
                    "http.scheme": request.url.scheme,
                    "http.host": request.url.hostname,
                    "http.target": request.url.path,
                }
            ) as span:
                try:
                    # Call next middleware
                    response = await call_next(request)
                    
                    # Add response attributes
                    tracer.set_attribute(span, "http.status_code", response.status_code)
                    if response.status_code >= 400:
                        tracer.set_status(span, "ERROR", f"HTTP status code: {response.status_code}")
                    else:
                        tracer.set_status(span, "OK")
                    
                    return response
                except Exception as e:
                    # Record exception
                    tracer.record_exception(span, e)
                    raise
        
        logger.info("FastAPI tracing middleware registered")

# Integration with SQLAlchemy
class SQLAlchemyTracing:
    """Utility class for SQLAlchemy tracing integration."""
    
    @staticmethod
    def setup_tracing(engine: Any) -> None:
        """
        Setup tracing for a SQLAlchemy engine.
        
        Args:
            engine: SQLAlchemy engine
        """
        tracer = OpenTelemetryTracer.get_instance()
        if not tracer.initialized:
            return
        
        try:
            from sqlalchemy import event
            
            @event.listens_for(engine, "before_cursor_execute")
            def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
                # Start span
                span = tracer.start_span(
                    "database",
                    kind="CLIENT",
                    attributes={
                        "db.system": "postgresql",
                        "db.statement": statement,
                        "db.operation": statement.split()[0].lower() if statement else "",
                    }
                )
                
                if not hasattr(conn, "_otel_spans"):
                    conn._otel_spans = []
                
                conn._otel_spans.append(span)
            
            @event.listens_for(engine, "after_cursor_execute")
            def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
                if hasattr(conn, "_otel_spans") and conn._otel_spans:
                    span = conn._otel_spans.pop()
                    tracer.set_status(span, "OK")
                    tracer.end_span(span)
            
            @event.listens_for(engine, "handle_error")
            def handle_error(context):
                if hasattr(context.connection, "_otel_spans") and context.connection._otel_spans:
                    span = context.connection._otel_spans.pop()
                    tracer.record_exception(span, context.original_exception)
                    tracer.end_span(span)
            
            logger.info("SQLAlchemy tracing listeners registered")
        
        except ImportError:
            logger.warning("SQLAlchemy not installed. Database tracing is disabled.")

# Integration with Redis
class RedisTracing:
    """Utility class for Redis tracing integration."""
    
    @staticmethod
    def patch_redis_client(redis_client: Any) -> Any:
        """
        Patch a Redis client to add tracing.
        
        Args:
            redis_client: Redis client to patch
            
        Returns:
            Patched Redis client
        """
        tracer = OpenTelemetryTracer.get_instance()
        if not tracer.initialized:
            return redis_client
        
        # Get the original execute_command method
        original_execute_command = redis_client.execute_command
        
        def traced_execute_command(self, *args, **kwargs):
            # Start span
            with tracer.start_as_current_span(
                f"redis:{args[0] if args else 'command'}",
                kind="CLIENT",
                attributes={
                    "db.system": "redis",
                    "db.statement": str(args),
                    "db.operation": args[0] if args else "",
                }
            ):
                # Call original method
                return original_execute_command(*args, **kwargs)
        
        # Replace the execute_command method
        redis_client.execute_command = traced_execute_command.__get__(redis_client)
        
        logger.info("Redis client patched for tracing")
        
        return redis_client

# Integration with Axios (for frontend)
class AxiosTracing:
    """Utility class for Axios tracing integration (frontend)."""
    
    @staticmethod
    def get_tracing_interceptors() -> Dict[str, Callable]:
        """
        Get Axios request and response interceptors for tracing.
        
        Returns:
            Dictionary with request and response interceptors
        """
        return {
            "requestInterceptor": """
function(config) {
  const traceparent = window.traceparent || '';
  if (traceparent) {
    config.headers = config.headers || {};
    config.headers['traceparent'] = traceparent;
  }
  return config;
}
            """,
            "responseInterceptor": """
function(response) {
  const traceparent = response.headers['traceparent'];
  if (traceparent) {
    window.traceparent = traceparent;
  }
  return response;
}
            """
        }