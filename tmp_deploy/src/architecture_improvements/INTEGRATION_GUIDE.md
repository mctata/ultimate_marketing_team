# Integration Guide: Architecture Improvements

This guide provides step-by-step instructions for integrating the architecture improvements into the existing Ultimate Marketing Team codebase.

## Overview

The architectural improvements are designed to be integrated gradually using the Strangler Fig pattern. This allows the team to migrate components one at a time while maintaining system functionality.

## Prerequisites

- Python 3.10+
- Understanding of the existing Ultimate Marketing Team codebase
- Familiarity with concepts in the architectural improvements (interfaces, DDD, circuit breakers, etc.)

## Steps for Integration

### 1. Add Dependencies

First, add any new dependencies to `requirements.txt`:

```
# OpenTelemetry dependencies
opentelemetry-api>=1.18.0
opentelemetry-sdk>=1.18.0
opentelemetry-exporter-otlp>=1.18.0
opentelemetry-instrumentation>=0.39b0
```

### 2. Use Adapters for Existing Components

The provided adapters allow you to wrap existing components with the new interfaces:

```python
from src.core.messaging import RabbitMQClient
from src.core.cache import RedisCache
from src.core.rate_limiting import CircuitBreaker as LegacyCircuitBreaker
from src.core.monitoring import TraceManager
from src.agents.base_agent import BaseAgent

from src.architecture_improvements.adapters import (
    RabbitMQMessageBrokerAdapter,
    RedisCacheAdapter,
    LegacyCircuitBreakerAdapter,
    TracingProviderAdapter,
    LegacyAgentAdapter,
)

# Create legacy components
legacy_broker = RabbitMQClient()
legacy_cache = RedisCache()
legacy_breaker = LegacyCircuitBreaker("example")
legacy_tracer = TraceManager()
legacy_agent = BaseAgent(agent_id="example_agent")

# Wrap with adapters
broker = RabbitMQMessageBrokerAdapter(legacy_broker)
cache = RedisCacheAdapter(legacy_cache)
circuit_breaker = LegacyCircuitBreakerAdapter(legacy_breaker)
tracer = TracingProviderAdapter(legacy_tracer)
agent = LegacyAgentAdapter(
    legacy_agent=legacy_agent,
    broker=broker,
    cache=cache,
    circuit_breaker=circuit_breaker,
    tracer=tracer,
)
```

### 3. Create New Components with New Interfaces

For new components, you can use the new interfaces directly:

```python
from src.architecture_improvements.01_interface_based_agents import Agent, AgentFactory
from src.architecture_improvements.02_message_format_specification import MessageFactory
from src.architecture_improvements.03_circuit_breaker import CircuitBreaker

# Use the agent factory to create a new agent
agent = AgentFactory.create_agent(
    agent_class=MyNewAgentClass,
    agent_id="new_agent",
    broker=broker,  # Use the adapter for backward compatibility
    cache=cache,    # Use the adapter for backward compatibility
    circuit_breaker=CircuitBreaker(name="new_agent_breaker"),  # Use new implementation
    tracer=tracer,  # Use the adapter for backward compatibility
)

# Use the message factory to create standardized messages
task_message = MessageFactory.create_task(
    sender_agent_id="new_agent",
    target_agent_id="legacy_agent",
    task_type="process_data",
    payload={"data": "example"},
)
```

### 4. Implement Domain Model

Gradually implement the domain model for each bounded context:

```python
from src.architecture_improvements.05_domain_driven_design import (
    Brand, Industry, StylingProperties, BrandColor, BrandRepository
)

# Create value objects
industry = Industry(
    name="Technology",
    vertical="B2B",
    competitive_index=0.8,
)

brand_color = BrandColor(
    primary="#FF5733",
    secondary="#33FF57",
    accent="#3357FF",
)

styling = StylingProperties(
    colors=brand_color,
    font_primary="Roboto",
    font_secondary="Open Sans",
    logo_url="https://example.com/logo.png",
)

# Create aggregate
brand = Brand(
    brand_id="123",
    name="Example Brand",
    industry=industry,
    website="https://example.com",
    styling=styling,
)

# Use repository
brand_repository = BrandRepository()
brand_repository.save(brand)
```

### 5. Add Circuit Breakers

Protect critical functions with circuit breakers:

```python
from src.architecture_improvements.03_circuit_breaker import circuit_breaker, retry_with_backoff

# Use as a decorator
@circuit_breaker(name="external_api_call", failure_threshold=3)
def call_external_api(data):
    # Implementation...
    pass

# Use with retry mechanism
@retry_with_backoff(retries=3, backoff_factor=0.5)
@circuit_breaker(name="database_operation")
def save_to_database(data):
    # Implementation...
    pass

# Use as a context manager
from src.architecture_improvements.03_circuit_breaker import CircuitBreaker, CircuitBreakerContextManager

breaker = CircuitBreaker(name="api_client")
with CircuitBreakerContextManager(breaker):
    # Protected code...
    pass
```

### 6. Add Distributed Tracing

Instrument code with distributed tracing:

```python
from src.architecture_improvements.04_distributed_tracing import trace_method, trace_span

# Use as a decorator
@trace_method(attributes_from_args=["user_id", "action"])
def process_user_action(user_id, action, data):
    # Implementation...
    pass

# Use as a context manager
from src.architecture_improvements.04_distributed_tracing import OpenTelemetryTracer

tracer = OpenTelemetryTracer(service_name="marketing_platform")
with trace_span("important_operation", tracer=tracer, attributes={"priority": "high"}):
    # Traced code...
    pass
```

### 7. Configure OpenTelemetry

Set up the OpenTelemetry collector in your environment:

```python
from src.architecture_improvements.04_distributed_tracing import OpenTelemetryTracer

# Create a tracer with OTLP exporter
tracer = OpenTelemetryTracer(
    service_name="marketing_platform",
    instance_id="instance-1",
    exporter_endpoint="http://otel-collector:4317",
    sample_rate=0.1,  # 10% sampling rate
    console_export=True,  # Also export to console in development
)
```

## Migration Strategy

Follow this phased approach for migration:

1. **Phase 1: Infrastructure Components**
   - Add circuit breakers to critical external API calls
   - Implement distributed tracing for key flows
   - Wrap existing message broker with the adapter

2. **Phase 2: Agent Framework**
   - Update the base agent to use the new interfaces
   - Migrate one agent at a time to the new architecture
   - Add tests for each migrated component

3. **Phase 3: Domain Model**
   - Implement one bounded context at a time
   - Start with the Brand context, then Content, Campaign, etc.
   - Use repositories to abstract data access

4. **Phase 4: Message Standardization**
   - Migrate to standardized message formats
   - Update message handling code
   - Add validation for messages

## Testing

When integrating these improvements, follow these testing guidelines:

1. Add unit tests for all new components
2. Create integration tests for adapters
3. Test circuit breakers with forced failures
4. Verify distributed traces in development environment
5. Test backward compatibility with existing components

## Monitoring

Set up monitoring for the new components:

1. Configure Jaeger or Zipkin for trace visualization
2. Add Prometheus metrics for circuit breaker states
3. Create Grafana dashboards for system health
4. Set up alerts for open circuit breakers

## Rollback Plan

If issues arise during integration:

1. Each adapter can be removed individually
2. The strangler fig pattern allows for component-by-component rollback
3. Keep old implementations until new ones are proven in production

## Next Steps

After initial integration:

1. Refine the domain model based on real-world usage
2. Expand circuit breaker coverage to more areas
3. Enhance tracing with more detailed spans
4. Implement missing bounded contexts
5. Add performance benchmarks to compare old and new implementations