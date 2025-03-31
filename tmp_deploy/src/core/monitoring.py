"""
Core monitoring and observability service for metrics collection and integration with
Prometheus, OpenTelemetry, and Elasticsearch/Logstash.

This module provides:
1. Metrics collection via Prometheus
2. Distributed tracing with OpenTelemetry
3. Integration with Elasticsearch through Logstash
4. Custom metrics for business processes
5. Automatic system resource monitoring
6. PagerDuty integration for alerting
"""

import time
import asyncio
import os
import socket
import json
import logging
import platform
import psutil
from datetime import datetime
from typing import Dict, Any, List, Optional, Union, Tuple
from contextlib import asynccontextmanager

# Import prometheus client
from prometheus_client import (
    Counter, Gauge, Histogram, Summary, 
    Info, CollectorRegistry, push_to_gateway,
    start_http_server, REGISTRY,
    multiprocess, generate_latest
)

# Import OpenTelemetry for distributed tracing
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
from opentelemetry.sdk.trace.sampling import TraceIdRatioBased

# Import for PagerDuty integration
import requests

# Import app-specific dependencies
from src.core.settings import settings
from src.core.logging import get_logger, LoggerAdapter

# Create logger
logger = LoggerAdapter("monitoring")

# Define Prometheus metrics
registry = REGISTRY  # Use the default registry

# HTTP Request metrics
http_requests_total = Counter(
    'http_requests_total', 
    'Total number of HTTP requests by method and endpoint',
    ['method', 'endpoint', 'status']
)

http_request_duration = Histogram(
    'http_request_duration_seconds', 
    'HTTP request duration in seconds by method and endpoint',
    ['method', 'endpoint'],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0)
)

http_request_in_progress = Gauge(
    'http_requests_in_progress',
    'Number of HTTP requests currently in progress',
    ['method']
)

# Database metrics
db_queries_total = Counter(
    'db_queries_total',
    'Total number of database queries',
    ['query_type', 'status']
)

db_query_duration = Histogram(
    'db_query_duration_seconds',
    'Database query duration in seconds',
    ['query_type'],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0)
)

db_connections_in_use = Gauge(
    'db_connections_in_use',
    'Number of database connections currently in use'
)

db_pool_size = Gauge(
    'db_pool_size',
    'Total size of the database connection pool'
)

# Redis cache metrics
cache_hits_total = Counter(
    'cache_hits_total',
    'Total number of cache hits by cache type',
    ['cache_type']
)

cache_misses_total = Counter(
    'cache_misses_total',
    'Total number of cache misses by cache type',
    ['cache_type']
)

cache_hit_ratio = Gauge(
    'cache_hit_ratio',
    'Ratio of cache hits to total cache operations',
    ['cache_type']
)

# AI API metrics
ai_requests_total = Counter(
    'ai_requests_total',
    'Total number of AI API requests',
    ['provider', 'model', 'endpoint', 'status']
)

ai_tokens_total = Counter(
    'ai_tokens_total',
    'Total number of tokens processed by AI APIs',
    ['provider', 'model', 'direction']  # direction = input|output
)

ai_request_duration = Histogram(
    'ai_request_duration_seconds',
    'AI API request duration in seconds',
    ['provider', 'model', 'endpoint'],
    buckets=(0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0, 15.0, 30.0, 60.0)
)

ai_request_cost = Counter(
    'ai_request_cost_usd',
    'Cost of AI API requests in USD',
    ['provider', 'model']
)

# Business metrics
content_creation_total = Counter(
    'content_creation_total',
    'Total number of content items created',
    ['content_type', 'status']
)

content_generation_duration = Histogram(
    'content_generation_duration_seconds',
    'Content generation duration in seconds',
    ['content_type'],
    buckets=(1.0, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0, 600.0)
)

campaign_performance = Gauge(
    'campaign_performance',
    'Campaign performance metrics',
    ['campaign_id', 'metric_type']  # metric_type = clicks, impressions, conversions, etc.
)

# System metrics
system_memory_usage = Gauge(
    'system_memory_usage_bytes',
    'Memory usage in bytes'
)

system_cpu_usage = Gauge(
    'system_cpu_usage_percent',
    'CPU usage in percent',
    ['cpu']
)

system_disk_usage = Gauge(
    'system_disk_usage_bytes',
    'Disk usage in bytes',
    ['mountpoint', 'type']  # type = free, used, total
)

# Service information
service_info = Info('service_info', 'Information about the service')

# Error metrics
error_count = Counter(
    'error_count_total',
    'Total number of errors',
    ['type', 'component']
)

# Custom business process metrics
business_process_duration = Histogram(
    'business_process_duration_seconds',
    'Business process duration in seconds',
    ['process_name', 'status'],
    buckets=(0.1, 0.5, 1.0, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0, 600.0)
)

# WebSocket metrics
websocket_connections_total = Counter(
    'websocket_connections_total',
    'Total number of WebSocket connections',
    ['status']  # status = connected, disconnected, error
)

websocket_messages_total = Counter(
    'websocket_messages_total',
    'Total number of WebSocket messages',
    ['direction', 'message_type']  # direction = sent, received
)

websocket_connections_active = Gauge(
    'websocket_connections_active',
    'Number of active WebSocket connections'
)

# OpenTelemetry setup
tracer_provider = None
tracer = None

# PagerDuty integration
def send_pagerduty_alert(
    summary: str,
    severity: str = "critical",
    component: str = "api",
    group: str = "production",
    source: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> bool:
    """Send an alert to PagerDuty."""
    if not settings.PAGERDUTY_ROUTING_KEY:
        logger.warning("PagerDuty routing key not configured, alert not sent")
        return False
    
    if source is None:
        source = socket.gethostname()
    
    payload = {
        "routing_key": settings.PAGERDUTY_ROUTING_KEY,
        "event_action": "trigger",
        "payload": {
            "summary": summary,
            "severity": severity,
            "source": source,
            "component": component,
            "group": group,
            "custom_details": details or {}
        }
    }
    
    try:
        response = requests.post(
            "https://events.pagerduty.com/v2/enqueue",
            json=payload,
            timeout=5
        )
        
        if response.status_code == 202:
            logger.info(f"PagerDuty alert sent: {summary}")
            return True
        else:
            logger.error(f"Failed to send PagerDuty alert: {response.status_code}, {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error sending PagerDuty alert: {str(e)}")
        return False

# Initialize Prometheus metrics server
def setup_prometheus_server(port: int = 9090) -> None:
    """Start a Prometheus metrics server on the specified port."""
    try:
        # Set up multiprocess mode if using workers
        if os.environ.get('PROMETHEUS_MULTIPROC_DIR'):
            multiprocess.MultiProcessCollector(registry)
        
        # Start the server
        start_http_server(port, registry=registry)
        logger.info(f"Prometheus metrics server started on port {port}")
    except Exception as e:
        logger.error(f"Failed to start Prometheus server: {str(e)}")

# Initialize OpenTelemetry
def setup_opentelemetry() -> None:
    """Set up OpenTelemetry for distributed tracing."""
    global tracer_provider, tracer
    
    if not settings.OPENTELEMETRY_ENABLED:
        logger.info("OpenTelemetry is disabled, skipping setup")
        return
    
    try:
        # Create a resource with service info
        resource = Resource.create({
            "service.name": settings.APP_NAME,
            "service.version": settings.APP_VERSION,
            "deployment.environment": settings.ENV
        })
        
        # Set up tracer provider with the resource
        tracer_provider = TracerProvider(
            resource=resource,
            sampler=TraceIdRatioBased(settings.OPENTELEMETRY_SAMPLING_RATE)
        )
        
        # Configure exporter if endpoint is provided
        if settings.OPENTELEMETRY_ENDPOINT:
            # Create OTLP exporter
            otlp_exporter = OTLPSpanExporter(endpoint=settings.OPENTELEMETRY_ENDPOINT)
            
            # Add span processor for exporting spans
            tracer_provider.add_span_processor(
                BatchSpanProcessor(otlp_exporter)
            )
        
        # Set global tracer provider
        trace.set_tracer_provider(tracer_provider)
        
        # Create a tracer
        tracer = trace.get_tracer(__name__)
        
        logger.info("OpenTelemetry initialized successfully")
    except Exception as e:
        logger.error(f"Failed to set up OpenTelemetry: {str(e)}")

# Initialize all monitoring services
async def setup_monitoring() -> None:
    """Initialize all monitoring and observability services."""
    # Set up service information
    hostname = socket.gethostname()
    service_info.info({
        'name': settings.APP_NAME,
        'version': settings.APP_VERSION,
        'environment': settings.ENV,
        'hostname': hostname,
        'platform': platform.platform(),
        'python_version': platform.python_version()
    })
    
    # Start Prometheus server if enabled
    if settings.PROMETHEUS_ENABLED:
        setup_prometheus_server(settings.PROMETHEUS_PORT)
    
    # Set up OpenTelemetry for distributed tracing
    if settings.OPENTELEMETRY_ENABLED:
        setup_opentelemetry()
    
    # Start system metrics collection
    asyncio.create_task(collect_system_metrics_periodically())
    
    logger.info("Monitoring services initialized")

# Shutdown monitoring
async def shutdown_monitoring() -> None:
    """Shut down monitoring services cleanly."""
    logger.info("Shutting down monitoring services")
    
    # Shutdown OpenTelemetry
    if tracer_provider:
        # This will ensure all pending spans are exported
        pass
    
    logger.info("Monitoring services shutdown complete")

# System metrics collection
async def collect_system_metrics_periodically(interval_seconds: int = 15) -> None:
    """Collect system metrics periodically."""
    while True:
        try:
            # Collect memory metrics
            memory = psutil.virtual_memory()
            system_memory_usage.set(memory.used)
            
            # Collect CPU metrics
            cpu_percent = psutil.cpu_percent(interval=None, percpu=True)
            for i, percent in enumerate(cpu_percent):
                system_cpu_usage.labels(cpu=f"cpu{i}").set(percent)
            
            # Collect disk metrics
            disk = psutil.disk_usage('/')
            system_disk_usage.labels(mountpoint='/', type='used').set(disk.used)
            system_disk_usage.labels(mountpoint='/', type='free').set(disk.free)
            system_disk_usage.labels(mountpoint='/', type='total').set(disk.total)
            
            # Collect process metrics (future enhancement)
            
        except Exception as e:
            logger.error(f"Error collecting system metrics: {str(e)}")
        
        # Wait for next collection
        await asyncio.sleep(interval_seconds)


# Trace context utilities
@asynccontextmanager
async def trace_span(name: str, attributes: Optional[Dict[str, str]] = None, parent=None):
    """Create a traced span for a specific operation."""
    if tracer is None or not settings.OPENTELEMETRY_ENABLED:
        # No-op if tracer is not configured
        yield None
        return
    
    with tracer.start_as_current_span(
        name, 
        attributes=attributes, 
        kind=trace.SpanKind.INTERNAL
    ) as span:
        try:
            yield span
        except Exception as e:
            span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
            span.record_exception(e)
            raise

# Metrics recording functions
async def record_http_latency(
    method: str,
    path: str,
    duration_ms: float,
    status_code: int
) -> None:
    """Record HTTP request latency metrics."""
    try:
        # Normalize path to remove IDs for better aggregation
        endpoint = normalize_path_template(path)
        
        # Record request count
        status_category = f"{status_code // 100}xx"
        http_requests_total.labels(method=method, endpoint=endpoint, status=status_category).inc()
        
        # Record request duration in seconds
        http_request_duration.labels(method=method, endpoint=endpoint).observe(duration_ms / 1000.0)
    except Exception as e:
        logger.error(f"Error recording HTTP metrics: {str(e)}")

async def record_db_query(
    query_type: str,
    duration_ms: float,
    success: bool
) -> None:
    """Record database query metrics."""
    try:
        # Record query count
        status = "success" if success else "error"
        db_queries_total.labels(query_type=query_type, status=status).inc()
        
        # Record query duration in seconds
        db_query_duration.labels(query_type=query_type).observe(duration_ms / 1000.0)
    except Exception as e:
        logger.error(f"Error recording DB query metrics: {str(e)}")

async def record_cache_operation(
    cache_type: str,
    hit: bool
) -> None:
    """Record cache hit/miss metrics."""
    try:
        if hit:
            cache_hits_total.labels(cache_type=cache_type).inc()
        else:
            cache_misses_total.labels(cache_type=cache_type).inc()
        
        # Update cache hit ratio (this is approximate)
        hits = cache_hits_total.labels(cache_type=cache_type)._value.get()
        misses = cache_misses_total.labels(cache_type=cache_type)._value.get()
        
        if hits + misses > 0:
            ratio = hits / (hits + misses)
            cache_hit_ratio.labels(cache_type=cache_type).set(ratio)
    except Exception as e:
        logger.error(f"Error recording cache metrics: {str(e)}")

async def record_ai_request(
    provider: str,
    model: str,
    endpoint: str,
    duration_ms: float,
    tokens_in: int,
    tokens_out: int,
    cost_usd: float,
    success: bool
) -> None:
    """Record AI API request metrics."""
    try:
        # Record request count
        status = "success" if success else "error"
        ai_requests_total.labels(
            provider=provider, 
            model=model, 
            endpoint=endpoint, 
            status=status
        ).inc()
        
        # Record token counts
        ai_tokens_total.labels(provider=provider, model=model, direction="input").inc(tokens_in)
        ai_tokens_total.labels(provider=provider, model=model, direction="output").inc(tokens_out)
        
        # Record request duration in seconds
        ai_request_duration.labels(
            provider=provider, 
            model=model, 
            endpoint=endpoint
        ).observe(duration_ms / 1000.0)
        
        # Record cost
        ai_request_cost.labels(provider=provider, model=model).inc(cost_usd)
    except Exception as e:
        logger.error(f"Error recording AI request metrics: {str(e)}")

async def record_content_creation(
    content_type: str,
    duration_ms: float,
    success: bool
) -> None:
    """Record content creation metrics."""
    try:
        # Record creation count
        status = "success" if success else "error"
        content_creation_total.labels(content_type=content_type, status=status).inc()
        
        # Record generation duration in seconds
        content_generation_duration.labels(content_type=content_type).observe(duration_ms / 1000.0)
    except Exception as e:
        logger.error(f"Error recording content creation metrics: {str(e)}")

async def record_campaign_metric(
    campaign_id: str,
    metric_type: str,
    value: float
) -> None:
    """Record campaign performance metrics."""
    try:
        campaign_performance.labels(campaign_id=campaign_id, metric_type=metric_type).set(value)
    except Exception as e:
        logger.error(f"Error recording campaign metrics: {str(e)}")

async def record_websocket_connection(status: str) -> None:
    """Record WebSocket connection metrics."""
    try:
        websocket_connections_total.labels(status=status).inc()
        
        if status == "connected":
            websocket_connections_active.inc()
        elif status == "disconnected":
            websocket_connections_active.dec()
    except Exception as e:
        logger.error(f"Error recording WebSocket connection metrics: {str(e)}")

async def record_websocket_message(direction: str, message_type: str) -> None:
    """Record WebSocket message metrics."""
    try:
        websocket_messages_total.labels(direction=direction, message_type=message_type).inc()
    except Exception as e:
        logger.error(f"Error recording WebSocket message metrics: {str(e)}")

async def record_business_process(
    process_name: str,
    duration_ms: float,
    success: bool
) -> None:
    """Record business process metrics."""
    try:
        status = "success" if success else "error"
        business_process_duration.labels(
            process_name=process_name, 
            status=status
        ).observe(duration_ms / 1000.0)
    except Exception as e:
        logger.error(f"Error recording business process metrics: {str(e)}")

async def record_exception(
    exception_type: str,
    message: str,
    traceback: str,
    path: Optional[str] = None,
    method: Optional[str] = None,
) -> None:
    """Record exception metrics and potentially send alerts."""
    try:
        component = "api" if path else "unknown"
        error_count.labels(type=exception_type, component=component).inc()
        
        # Log the exception (already done by exception handler)
        
        # Check for critical errors that should trigger alerts
        if exception_type in settings.CRITICAL_EXCEPTIONS or (
            path and any(critical_path in path for critical_path in settings.CRITICAL_ENDPOINTS)
        ):
            summary = f"{exception_type}: {message[:100]}..."
            details = {
                "exception_type": exception_type,
                "message": message,
                "path": path,
                "method": method,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Send alert to PagerDuty if enabled
            if settings.PAGERDUTY_ENABLED:
                asyncio.create_task(
                    asyncio.to_thread(
                        send_pagerduty_alert,
                        summary=summary,
                        severity="critical",
                        component=component,
                        details=details
                    )
                )
    except Exception as e:
        logger.error(f"Error recording exception metrics: {str(e)}")

# Helper functions
def normalize_path_template(path: str) -> str:
    """Normalize a path by replacing IDs with placeholders."""
    import re
    
    # Replace UUIDs with {id}
    path = re.sub(
        r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
        '{id}',
        path
    )
    
    # Replace numeric IDs with {id}
    path = re.sub(r'/\d+', '/{id}', path)
    
    return path

# SLO/SLA tracking
class SLOTracker:
    """Track Service Level Objectives and Service Level Agreements."""
    
    def __init__(self):
        self.slo_metrics = {}
    
    def register_slo(
        self, 
        name: str, 
        description: str, 
        target: float, 
        window_days: int = 30
    ) -> None:
        """Register a new SLO to track."""
        # Create Prometheus metrics for this SLO
        success_counter = Counter(
            f'slo_{name}_success_total',
            f'Total number of successful {description}',
        )
        
        failure_counter = Counter(
            f'slo_{name}_failure_total',
            f'Total number of failed {description}',
        )
        
        slo_ratio = Gauge(
            f'slo_{name}_ratio',
            f'Current ratio of {description}',
        )
        
        self.slo_metrics[name] = {
            'description': description,
            'target': target,
            'window_days': window_days,
            'success_counter': success_counter,
            'failure_counter': failure_counter,
            'slo_ratio': slo_ratio
        }
        
        logger.info(f"Registered SLO: {name} with target {target}")
    
    def record_success(self, name: str) -> None:
        """Record a successful event for an SLO."""
        if name in self.slo_metrics:
            self.slo_metrics[name]['success_counter'].inc()
            self._update_ratio(name)
        else:
            logger.warning(f"Attempted to record success for unregistered SLO: {name}")
    
    def record_failure(self, name: str) -> None:
        """Record a failed event for an SLO."""
        if name in self.slo_metrics:
            self.slo_metrics[name]['failure_counter'].inc()
            self._update_ratio(name)
        else:
            logger.warning(f"Attempted to record failure for unregistered SLO: {name}")
    
    def _update_ratio(self, name: str) -> None:
        """Update the current ratio for an SLO."""
        slo = self.slo_metrics[name]
        success = slo['success_counter']._value.get()
        failure = slo['failure_counter']._value.get()
        
        if success + failure > 0:
            ratio = success / (success + failure)
            slo['slo_ratio'].set(ratio)
    
    def get_slo_status(self, name: str) -> Dict[str, Any]:
        """Get the current status of an SLO."""
        if name not in self.slo_metrics:
            return {"error": f"SLO {name} not found"}
        
        slo = self.slo_metrics[name]
        success = slo['success_counter']._value.get()
        failure = slo['failure_counter']._value.get()
        ratio = 1.0 if success + failure == 0 else success / (success + failure)
        
        return {
            "name": name,
            "description": slo['description'],
            "target": slo['target'],
            "current_ratio": ratio,
            "success_count": success,
            "failure_count": failure,
            "meeting_target": ratio >= slo['target'],
            "window_days": slo['window_days']
        }
    
    def get_all_slo_statuses(self) -> Dict[str, Dict[str, Any]]:
        """Get the current status of all SLOs."""
        return {name: self.get_slo_status(name) for name in self.slo_metrics}

# Create a global SLO tracker
slo_tracker = SLOTracker()

# Register default SLOs
def register_default_slos() -> None:
    """Register the default SLOs for the application."""
    slo_tracker.register_slo(
        name="api_availability",
        description="API availability",
        target=0.995,  # 99.5% uptime
        window_days=30
    )
    
    slo_tracker.register_slo(
        name="api_latency",
        description="API requests completing under 500ms",
        target=0.95,  # 95% of requests
        window_days=30
    )
    
    slo_tracker.register_slo(
        name="content_generation",
        description="Content generation completing successfully",
        target=0.98,  # 98% success rate
        window_days=30
    )
    
    slo_tracker.register_slo(
        name="db_query_latency",
        description="Database queries completing under 100ms",
        target=0.99,  # 99% of queries
        window_days=30
    )

# Register the default SLOs on module import
register_default_slos()