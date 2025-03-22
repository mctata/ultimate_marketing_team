# Compliance Feature Testing

This document outlines the testing strategy for the compliance features in the Ultimate Marketing Team platform.

## Overview

The compliance features are tested at multiple levels to ensure correctness, security, and regulatory compliance:

- **Unit Tests**: Verify individual service classes and functions in isolation
- **API Tests**: Verify the API endpoints and request/response handling
- **Integration Tests**: Verify interactions between components and end-to-end workflows
- **Security Tests**: Verify field-level encryption and data protection

## Test Structure

The tests are organized into the following directories:

- `tests/core/compliance/`: Unit tests for core compliance services
- `tests/api/test_compliance_api.py`: API tests for compliance endpoints
- `tests/integration/test_data_retention_workflow.py`: Integration tests for data retention workflow
- `tests/integration/test_data_export.py`: Integration tests for data export functionality

## Running Tests

You can run the compliance tests using the `run_compliance_tests.py` script:

```bash
# Run all compliance tests
./run_compliance_tests.py

# Run only unit tests
./run_compliance_tests.py --unit

# Run only API tests
./run_compliance_tests.py --api

# Run only integration tests
./run_compliance_tests.py --integration

# Run tests for a specific module
./run_compliance_tests.py --unit --module data_retention_service

# Run tests with verbose output
./run_compliance_tests.py --verbose
```

You can also run the tests using pytest directly:

```bash
# Run all compliance unit tests
python -m pytest tests/core/compliance/

# Run a specific test file
python -m pytest tests/core/compliance/test_data_retention_service.py

# Run API tests
python -m pytest tests/api/test_compliance_api.py

# Run integration tests
python -m pytest tests/integration/test_data_retention_workflow.py
python -m pytest tests/integration/test_data_export.py
```

## Test Coverage

The tests cover the following areas:

### Data Retention

- Creating, updating, and deleting retention policies
- Creating, checking, and deleting retention exemptions
- Applying retention policies to entities
- Enforcing retention exemptions
- Archiving and deleting expired records
- Logging retention executions

### Consent Management

- Recording user consent decisions
- Checking consent status
- Tracking consent for specific data categories
- Retrieving consent history
- Revoking consent

### Data Subject Requests

- Creating data subject requests (access, deletion, etc.)
- Processing requests through their lifecycle
- Executing data access requests
- Executing data deletion requests
- Anonymizing user data

### Compliance Documents

- Creating and versioning compliance documents
- Setting current document versions
- Retrieving document history

### Data Classification

- Creating and managing data classifications
- Classifying database fields
- Enforcing field-level security rules

### Field-Level Encryption

- Encrypting sensitive fields
- Decrypting fields when needed
- Handling encrypted fields during export
- Proper salt generation and management

### Privacy Impact Assessments

- Creating and updating assessments
- Managing assessment lifecycle
- Reviewing and approving assessments

### Data Export

- Exporting data in different formats (JSON, CSV)
- Respecting field-level security during export
- Masking sensitive fields
- Batch exporting multiple records

## Testing Best Practices

When writing new tests for compliance features, follow these best practices:

1. **Test both happy paths and edge cases**
   - Test successful operations
   - Test error handling and validation
   - Test boundary conditions

2. **Mock external dependencies**
   - Use pytest fixtures to mock database sessions
   - Mock service classes when testing API endpoints

3. **Test security constraints**
   - Verify that sensitive data is protected
   - Verify that access controls are enforced

4. **Test regulatory requirements**
   - Verify that GDPR requirements are met
   - Verify that CCPA/CPRA requirements are met

5. **Maintain test independence**
   - Each test should be able to run independently
   - Tests should not depend on the state left by other tests

## Test Fixtures

The tests use several fixtures to simplify test setup:

- `mock_db`: Mock database session
- `sample_policy`: Sample data retention policy
- `sample_exemption`: Sample data retention exemption
- `sample_consent_record`: Sample consent record
- `sample_data_subject_request`: Sample data subject request
- `sample_compliance_document`: Sample compliance document
- `sample_data_classification`: Sample data classification
- `sample_field_classification`: Sample field classification
- `sample_privacy_assessment`: Sample privacy impact assessment
- `sample_user_data`: Sample user data for export testing
- `sample_classifications`: Sample data classification service

## Integration with CI/CD

The compliance tests are integrated into the CI/CD pipeline:

1. Tests run automatically on pull requests
2. Tests run automatically on pushes to `main` and `develop`
3. Test results are reported in the GitHub Actions interface
4. Test coverage is tracked over time