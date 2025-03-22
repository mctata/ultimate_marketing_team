import logging
import sys
import json
import time
import uuid
import contextlib
from contextvars import ContextVar
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional, Union
from loguru import logger
from src.core.settings import settings

# Context variables for correlation and request tracking
request_id_var: ContextVar[str] = ContextVar('request_id', default='')
trace_id_var: ContextVar[str] = ContextVar('trace_id', default='')
span_id_var: ContextVar[str] = ContextVar('span_id', default='')
user_id_var: ContextVar[Optional[int]] = ContextVar('user_id', default=None)
session_id_var: ContextVar[Optional[str]] = ContextVar('session_id', default=None)
component_var: ContextVar[str] = ContextVar('component', default='app')

# Configure loguru
class InterceptHandler(logging.Handler):
    def emit(self, record):
        # Get corresponding Loguru level if it exists
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Find caller from where originated the logged message
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


def setup_logging():
    """Configure logging with loguru and structured JSON format."""
    # Remove default loguru handler
    logger.remove()

    # Add new handlers based on environment
    log_level = settings.LOG_LEVEL.upper()
    
    # Configure development logger with colorized output
    if settings.ENV == "development":
        logger.add(
            sys.stderr,
            format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <blue>{extra[request_id]}</blue> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
            level=log_level,
            backtrace=True,
            diagnose=True,
        )
    else:
        # Configure production logger with JSON formatting for ELK
        log_path = Path("logs")
        log_path.mkdir(exist_ok=True)
        
        # Main application log - structured JSON format
        logger.add(
            log_path / "app.json",
            format=lambda record: format_json_log_record(record),
            serialize=True,
            rotation="100 MB",
            retention="10 days",
            level=log_level,
        )
        
        # Slow query log
        logger.add(
            log_path / "slow_query.json",
            format=lambda record: format_json_log_record(record),
            serialize=True,
            rotation="50 MB",
            retention="7 days",
            level="WARNING",
            filter=lambda record: "slow_query" in record["extra"],
        )
        
        # AI API usage log
        logger.add(
            log_path / "ai_api_usage.json",
            format=lambda record: format_json_log_record(record),
            serialize=True,
            rotation="50 MB",
            retention="30 days",
            level="INFO",
            filter=lambda record: "api_usage" in record["extra"],
        )
        
        # Health check log
        logger.add(
            log_path / "health.json",
            format=lambda record: format_json_log_record(record),
            serialize=True,
            rotation="50 MB",
            retention="14 days",
            level="INFO",
            filter=lambda record: "health" in record["extra"],
        )
        
        # Error log with all ERROR and CRITICAL events
        logger.add(
            log_path / "error.json",
            format=lambda record: format_json_log_record(record),
            serialize=True,
            rotation="50 MB",
            retention="30 days",
            level="ERROR",
        )
        
        # Also log to console in production with more compact format
        logger.add(
            sys.stderr,
            format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {extra[request_id]} | {message}",
            level=log_level,
        )
    
    # Intercept everything at the root logger
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    
    # Remove other handlers and set level for specific loggers
    for name in logging.root.manager.loggerDict.keys():
        logging.getLogger(name).handlers = []
        logging.getLogger(name).propagate = True
    
    # Configure uvicorn logging
    for uvicorn_logger in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logging.getLogger(uvicorn_logger).handlers = []
        logging.getLogger(uvicorn_logger).propagate = True


def format_json_log_record(record: Dict[str, Any]) -> str:
    """Format a log record as a JSON string suitable for Elasticsearch."""
    # Extract basic record info
    log_data = {
        "timestamp": record["time"].strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "level": record["level"].name,
        "message": record["message"],
        "name": record["name"],
        "function": record["function"],
        "line": record["line"],
        "process_id": record["process"].id,
        "thread_id": record["thread"].id,
    }
    
    # Add context tracking IDs from contextvars if they exist
    extra = record["extra"]
    for key in [
        "request_id", "trace_id", "span_id", "user_id", 
        "session_id", "component", "environment"
    ]:
        if key in extra:
            log_data[key] = extra[key]
    
    # Add exception info if available
    if record["exception"]:
        log_data["exception"] = {
            "type": record["exception"].type.__name__,
            "value": str(record["exception"].value),
            "traceback": record["exception"].traceback,
        }
    
    # Add any other extra data (excluding context keys already handled)
    for key, value in extra.items():
        if key not in log_data and key not in [
            "request_id", "trace_id", "span_id", "user_id", 
            "session_id", "component", "environment"
        ]:
            log_data[key] = value
    
    # Convert to JSON string
    return json.dumps(log_data)


def get_request_id() -> str:
    """Get the current request ID from context, or generate a new one."""
    try:
        request_id = request_id_var.get()
        if not request_id:
            request_id = str(uuid.uuid4())
            request_id_var.set(request_id)
        return request_id
    except Exception:
        return str(uuid.uuid4())


def get_trace_id() -> str:
    """Get the current trace ID from context, or generate a new one."""
    try:
        trace_id = trace_id_var.get()
        if not trace_id:
            trace_id = str(uuid.uuid4())
            trace_id_var.set(trace_id)
        return trace_id
    except Exception:
        return str(uuid.uuid4())


def get_span_id() -> str:
    """Get the current span ID from context, or generate a new one."""
    try:
        return span_id_var.get() or str(uuid.uuid4())
    except Exception:
        return str(uuid.uuid4())


def set_context(
    request_id: Optional[str] = None,
    trace_id: Optional[str] = None,
    span_id: Optional[str] = None,
    user_id: Optional[int] = None,
    session_id: Optional[str] = None,
    component: Optional[str] = None,
) -> None:
    """Set the current logging context variables."""
    if request_id:
        request_id_var.set(request_id)
    if trace_id:
        trace_id_var.set(trace_id)
    if span_id:
        span_id_var.set(span_id)
    if user_id is not None:
        user_id_var.set(user_id)
    if session_id:
        session_id_var.set(session_id)
    if component:
        component_var.set(component)


def get_logger(**additional_context) -> logger:
    """Get a logger with the current context already bound."""
    context = {
        "request_id": get_request_id(),
        "trace_id": get_trace_id(),
        "span_id": get_span_id(),
        "component": component_var.get(),
        "environment": settings.ENV,
    }
    
    # Add optional context if available
    user_id = user_id_var.get()
    if user_id is not None:
        context["user_id"] = user_id
    
    session_id = session_id_var.get()
    if session_id:
        context["session_id"] = session_id
    
    # Merge with any additional context provided
    context.update(additional_context)
    
    return logger.bind(**context)


@contextlib.contextmanager
def span_context(operation: str, component: Optional[str] = None):
    """Create a new span context for tracing."""
    parent_span_id = get_span_id()
    new_span_id = str(uuid.uuid4())
    span_id_var.set(new_span_id)
    
    if component:
        previous_component = component_var.get()
        component_var.set(component)
    
    span_logger = get_logger(
        parent_span_id=parent_span_id,
        span_operation=operation
    )
    
    start_time = time.time()
    span_logger.debug(f"Starting span: {operation}")
    
    try:
        yield span_logger
    except Exception as e:
        span_logger.exception(f"Exception in span: {str(e)}")
        raise
    finally:
        duration_ms = (time.time() - start_time) * 1000
        
        # Restore parent span ID
        span_id_var.set(parent_span_id)
        
        # Restore previous component if changed
        if component:
            component_var.set(previous_component)
        
        span_logger.bind(duration_ms=duration_ms).debug(f"Completed span: {operation}")


def log_slow_query(statement, parameters, execution_time):
    """Log slow database queries for performance monitoring.
    
    Args:
        statement: SQL statement that was executed
        parameters: Query parameters
        execution_time: Execution time in seconds
    """
    log_data = {
        "query": statement,
        "parameters": str(parameters),
        "execution_time_ms": round(execution_time * 1000, 2),
        "timestamp": time.time(),
        "component": "database"
    }
    
    # Log with special logger context
    get_logger(slow_query=True, **log_data).warning(f"SLOW QUERY ({log_data['execution_time_ms']}ms)")


async def log_api_usage(
    provider, 
    model, 
    tokens_in, 
    tokens_out, 
    duration_ms, 
    cost, 
    endpoint, 
    cached=False, 
    success=True,
    error_type=None,
    agent_type=None,
    task_id=None
):
    """Log AI API usage for cost monitoring and optimization.
    
    Args:
        provider: API provider (openai, anthropic, etc.)
        model: Model name (gpt-4, claude-3-opus, etc.)
        tokens_in: Input token count
        tokens_out: Output token count
        duration_ms: Request duration in milliseconds
        cost: Estimated cost in USD
        endpoint: API endpoint used (completion, chat, embeddings, etc.)
        cached: Whether the response was served from cache
        success: Whether the request succeeded
        error_type: Type of error if the request failed
        agent_type: Type of agent that made the request
        task_id: Associated task ID
    """
    log_data = {
        "provider": provider,
        "model": model,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "total_tokens": tokens_in + tokens_out,
        "duration_ms": duration_ms,
        "cost_usd": cost,
        "endpoint": endpoint,
        "cached": cached,
        "success": success,
        "error_type": error_type,
        "agent_type": agent_type,
        "task_id": task_id,
        "component": "ai_api"
    }
    
    # Log with special logger context
    get_logger(api_usage=True, **log_data).info(f"AI API: {provider}/{model}")
    
    # Store metrics in database
    try:
        from src.core.api_metrics import metrics_service
        
        # Use asyncio.create_task to avoid blocking
        import asyncio
        asyncio.create_task(
            metrics_service.record_api_usage(
                provider=provider,
                model=model,
                tokens_in=tokens_in,
                tokens_out=tokens_out,
                duration_ms=duration_ms,
                cost_usd=cost,
                endpoint=endpoint,
                cached=cached,
                success=success,
                error_type=error_type,
                agent_type=agent_type,
                task_id=task_id
            )
        )
    except ImportError:
        # Module not available yet (likely during startup)
        get_logger().debug("API metrics service not available yet, skipping database record")
    except Exception as e:
        get_logger().error(f"Error recording API metrics: {str(e)}")


# For backward compatibility with non-async code
def log_api_usage_sync(
    provider, 
    model, 
    tokens_in, 
    tokens_out, 
    duration_ms, 
    cost, 
    endpoint, 
    cached=False,
    success=True,
    error_type=None,
    agent_type=None,
    task_id=None
):
    """Synchronous version of log_api_usage for non-async contexts."""
    log_data = {
        "provider": provider,
        "model": model,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "total_tokens": tokens_in + tokens_out,
        "duration_ms": duration_ms,
        "cost_usd": cost,
        "endpoint": endpoint,
        "cached": cached,
        "success": success,
        "error_type": error_type,
        "agent_type": agent_type,
        "task_id": task_id,
        "component": "ai_api"
    }
    
    # Log with special logger context
    get_logger(api_usage=True, **log_data).info(f"AI API: {provider}/{model}")
    
    # Schedule async task using asyncio.create_task if in event loop
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(
                log_api_usage(
                    provider=provider,
                    model=model,
                    tokens_in=tokens_in,
                    tokens_out=tokens_out,
                    duration_ms=duration_ms,
                    cost=cost,
                    endpoint=endpoint,
                    cached=cached,
                    success=success,
                    error_type=error_type,
                    agent_type=agent_type,
                    task_id=task_id
                )
            )
    except (RuntimeError, ValueError):
        # No event loop available, just log to file
        pass


def log_exception(e: Exception, context: Optional[Dict[str, Any]] = None):
    """Log an exception with additional context."""
    ctx = context or {}
    get_logger(**ctx).exception(f"Exception: {str(e)}")


def log_request(
    method: str,
    path: str, 
    status_code: int,
    duration_ms: float,
    user_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    params: Optional[Dict] = None,
    extra: Optional[Dict] = None
):
    """Log HTTP request details."""
    log_data = {
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration_ms": duration_ms,
        "component": "http"
    }
    
    if ip_address:
        log_data["ip_address"] = ip_address
    if user_agent:
        log_data["user_agent"] = user_agent
    if user_id is not None:
        log_data["user_id"] = user_id
    if params:
        # Filter out sensitive parameters
        filtered_params = {k: v for k, v in params.items() if k.lower() not in 
                         ["password", "token", "secret", "key", "authorization", "api_key"]}
        log_data["params"] = filtered_params
    if extra:
        log_data.update(extra)
    
    level = "WARNING" if status_code >= 400 else "INFO" if status_code >= 300 else "DEBUG"
    get_logger(**log_data).log(level, f"{method} {path} {status_code} ({duration_ms:.2f}ms)")


def log_health_check(
    component: str,
    status: str,
    details: Optional[Dict] = None,
    duration_ms: Optional[float] = None
):
    """Log a health check result."""
    log_data = {
        "component": component,
        "status": status,
        "details": details or {},
        "health": True
    }
    
    if duration_ms is not None:
        log_data["duration_ms"] = duration_ms
    
    level = "WARNING" if status != "healthy" else "INFO"
    get_logger(**log_data).log(level, f"Health check: {component} is {status}")


class LoggerAdapter:
    """Adapter for supporting both loguru and OpenTelemetry logging."""
    
    def __init__(self, component: str = "app"):
        self.component = component
    
    def debug(self, message, **extra):
        get_logger(component=self.component, **extra).debug(message)
    
    def info(self, message, **extra):
        get_logger(component=self.component, **extra).info(message)
    
    def warning(self, message, **extra):
        get_logger(component=self.component, **extra).warning(message)
    
    def error(self, message, **extra):
        get_logger(component=self.component, **extra).error(message)
    
    def critical(self, message, **extra):
        get_logger(component=self.component, **extra).critical(message)
    
    def exception(self, message, **extra):
        get_logger(component=self.component, **extra).exception(message)
    
    def span(self, operation: str):
        """Create a new span context for tracing."""
        return span_context(operation, component=self.component)
