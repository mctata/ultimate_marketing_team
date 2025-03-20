# Ultimate Marketing Team - Tests

This directory contains tests for the Ultimate Marketing Team platform. The tests are organized by component and test type.

## Implementation Status

We have implemented the following tests:

1. **Unit Tests**:
   - `tests/agents/test_base_agent.py` - Complete test coverage for BaseAgent
   - `tests/agents/test_brand_project_management_agent.py` - Comprehensive tests for BrandProjectManagementAgent

2. **Integration Tests**:
   - `tests/integration/test_agent_interaction.py` - Tests for interaction between agents
   - `tests/integration/test_end_to_end_workflow.py` - End-to-end workflow tests

## Test Structure

```
tests/
├── agents/              # Unit tests for agents
│   ├── __init__.py
│   ├── test_base_agent.py
│   └── test_brand_project_management_agent.py
├── api/                 # Unit tests for API endpoints
├── core/                # Unit tests for core infrastructure
├── integration/         # Integration tests across components
│   ├── __init__.py
│   ├── test_agent_interaction.py
│   └── test_end_to_end_workflow.py
├── models/              # Unit tests for data models
├── conftest.py          # Common pytest fixtures
└── README.md            # This file
```

## Running Tests

You can run the tests using pytest:

```bash
# Run all tests
python -m pytest

# Run specific test file
python -m pytest tests/agents/test_base_agent.py

# Run specific test
python -m pytest tests/agents/test_base_agent.py::TestBaseAgent::test_initialization

# Run with verbose output
python -m pytest -v

# Run with coverage report
python -m pytest --cov=src
```

## Test Types

### Unit Tests

Unit tests verify individual components in isolation. These tests mock external dependencies to focus on testing specific functionality.

- **Agent Tests**: Test individual agent methods, event handling, and task processing
- **API Tests**: Test API endpoints, request handlers, and validation
- **Core Tests**: Test core infrastructure components like messaging, caching, and security
- **Model Tests**: Test data models and their interactions with the database

### Integration Tests

Integration tests verify that different components work together correctly. These tests check the interaction between agents, the API, and other services.

- **Agent Interaction Tests**: Test communication between different agent types
- **End-to-End Workflow Tests**: Test complete user workflows across the system

## Mock Strategy

The tests use various mocking strategies to isolate components and avoid external dependencies:

1. **External Services**: All external services (RabbitMQ, Redis, APIs) are mocked
2. **Internal Methods**: Internal helper methods are mocked when testing higher-level workflows
3. **Database**: Database interactions are mocked to avoid test data persistence

## Adding New Tests

When adding new tests, please follow these guidelines:

1. Create unit tests for all new components
2. Add integration tests for interactions between components
3. Follow the existing test structure and naming conventions
4. Use pytest fixtures to share setup code
5. Mock external dependencies appropriately

## Test Coverage

Aim for high test coverage of all components, with special attention to:

- Error handling paths
- Edge cases in data processing
- Security and permission checks
- Agent communication pathways