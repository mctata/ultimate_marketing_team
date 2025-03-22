# Testing Guide for Ultimate Marketing Team Integrations

This document outlines best practices and procedures for testing integrations in the Ultimate Marketing Team platform.

## Testing Levels

### 1. Unit Tests

Unit tests focus on testing individual integration components in isolation:

- **Base Classes**: Test methods in abstract base classes
- **Platform Implementations**: Test platform-specific implementations
- **Factories**: Test the correct integration instance creation
- **Utility Functions**: Test helper functions and utilities

#### Key Principles:

- Mock all external dependencies (API calls, database connections)
- Test both success and failure paths
- Verify proper error handling and logging
- Test edge cases and boundary conditions

### 2. Integration Tests

Integration tests verify that different components work together correctly:

- **Cross-Platform Workflows**: Test content publishing across multiple platforms
- **API Key Authorization**: Test authentication and authorization flows
- **Webhook Events**: Test event triggering and payload delivery
- **Database Interactions**: Test integration with database models

#### Key Principles:

- Use mock responses for external API calls
- Set up realistic test scenarios that mirror production workflows
- Test full end-to-end processes
- Verify data consistency across components

### 3. End-to-End Tests

End-to-end tests verify entire user workflows:

- **Content Creation & Publishing**: From creation to multi-platform distribution
- **Analytics Collection & Reporting**: Full analytics workflow
- **Developer Platform Usage**: Complete API key and webhook lifecycle

## Testing Tools

- **pytest**: Primary testing framework
- **unittest.mock**: For mocking dependencies
- **responses**: For mocking HTTP requests
- **pytest-cov**: For code coverage reports

## Test Organization

Organize tests to match the structure of the integration system:

```
/tests/
  /agents/
    /integrations/
      /social/                # Social media integration tests
        test_instagram.py
        test_linkedin.py
        test_factory.py
      /email_marketing/       # Email marketing integration tests
        test_mailchimp.py
        test_hubspot.py
        test_email_factory.py
      /analytics/             # Analytics integration tests
        test_google_analytics.py
        test_adobe_analytics.py
        test_analytics_factory.py
      /developer/             # Developer platform tests
        test_webhook_manager.py
        test_api_key_manager.py
        test_plugin_manager.py
      test_cms_integration.py # CMS integration tests
  /integration/
    test_integration_workflow.py    # Cross-component integration tests
    test_end_to_end_workflow.py     # Full workflow tests
```

## Test Fixtures

Common test fixtures include:

- **Credentials**: Pre-configured test credentials for each platform
- **Mock Responses**: Standard API responses for each platform
- **Sample Data**: Test content, analytics requests, etc.
- **Database Session**: Mock database session for testing

## Testing Best Practices

### 1. Mock External Dependencies

```python
@responses.activate
def test_instagram_post_creation(integration, post_data):
    # Mock the API response
    responses.add(
        responses.POST,
        f"{integration.base_url}/media",
        json={"id": "media123"},
        status=200
    )
    
    # Execute the method
    result = integration.create_post(post_data)
    
    # Verify the result
    assert result["success"] is True
    assert result["data"]["id"] == "media123"
```

### 2. Test Error Handling

```python
@responses.activate
def test_api_error_handling(integration):
    # Mock an API error response
    responses.add(
        responses.GET,
        f"{integration.base_url}/user",
        json={"error": {"message": "Invalid token", "code": 190}},
        status=401
    )
    
    # Execute the method
    result = integration.get_user_info()
    
    # Verify error handling
    assert result["success"] is False
    assert "Invalid token" in result["message"]
    assert result["error"]["code"] == 190
```

### 3. Test Authentication

```python
def test_validate_api_key(api_key_manager, db_session, sample_api_key):
    # Mock database query to return test key
    db_session.query.return_value.filter.return_value.first.return_value = sample_api_key
    
    # Mock hash verification
    with patch.object(api_key_manager, 'verify_key_hash', return_value=True):
        # Execute validation
        result = api_key_manager.validate_api_key("key123.secret")
    
    # Verify validation
    assert result["valid"] is True
    assert result["permissions"] == sample_api_key.permissions
```

### 4. Test Rate Limiting

```python
def test_rate_limit_exceeded(api_key_manager, db_session, sample_api_key):
    # Mock database query
    db_session.query.return_value.filter.return_value.first.return_value = sample_api_key
    
    # Mock cache to return count at limit
    mock_cache = MagicMock()
    mock_cache.get.return_value = 100  # At limit
    api_key_manager.cache = mock_cache
    
    # Execute check
    result = api_key_manager.check_rate_limit("key123")
    
    # Verify limit checking
    assert result["allowed"] is False
    assert result["current_count"] == 100
    assert result["remaining"] == 0
```

## Running Tests

Run specific integration tests:

```bash
# Run all integration tests
python -m pytest tests/agents/integrations/

# Run tests for a specific platform
python -m pytest tests/agents/integrations/social/

# Run a specific test file
python -m pytest tests/agents/integrations/email_marketing/test_mailchimp.py

# Run with coverage report
python -m pytest tests/agents/integrations/ --cov=src.agents.integrations
```

## Continuous Integration

Tests are automatically run in the CI/CD pipeline:

1. **Pull Request Checks**: All tests run when creating or updating a PR
2. **Main Branch Builds**: All tests run before deployment to staging/production
3. **Nightly Tests**: Full test suite runs nightly to catch any regressions

## Adding Tests for New Integrations

When adding a new integration platform:

1. Create unit tests for the platform-specific implementation
2. Create unit tests for factory updates
3. Update integration tests to include the new platform
4. Update end-to-end tests for complete workflows

## Test Data Security

When testing integrations:

- Never use real production credentials in tests
- Use mock credentials and demo accounts
- Avoid storing test credentials in code (use environment variables)
- Sanitize any test data to remove sensitive information

## Test Coverage Requirements

All new integrations must meet the following test coverage requirements:

- **Unit Tests**: Minimum 90% code coverage
- **Integration Tests**: All critical workflows covered
- **Error Handling**: All error conditions tested
- **Authentication**: All authentication methods tested

## Documentation

For each integration, document the testing strategy:

- Key test scenarios
- Mock response examples
- Required fixtures
- Common test patterns