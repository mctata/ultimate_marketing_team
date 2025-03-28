# API Testing Scripts

This directory contains scripts for testing the Ultimate Marketing Team API.

## Available Scripts

- `test_staging_api.py` - Test API endpoints on the staging environment
- `test_templates_api.py` - Test template-specific API endpoints
- `test_seo_api.py` - Test SEO API endpoints
- `run_api_tests.py` - Helper script to run API tests with proper parameters

## Usage

To run all API tests:

```bash
python scripts/testing/api/run_api_tests.py
```

To run specific API tests:

```bash
python scripts/testing/api/run_api_tests.py --url https://staging.tangible-studios.com
python scripts/testing/api/test_staging_api.py --url https://staging.tangible-studios.com
```

All test output is automatically logged to the `/logs` directory.

## Test Configuration

The API tests support the following configuration options:

- `--url` - Base URL for API testing (default: http://localhost:8000)
- `--username` - Username for authenticated tests
- `--password` - Password for authenticated tests
- `--verbose` - Enable verbose output
- `--log-file` - Specify a custom log file name

## Adding New Tests

When adding new API tests:

1. Create a new test file in this directory
2. Follow the APITester pattern from existing tests
3. Add appropriate authentication handling
4. Include thorough assertions for both success and error cases
5. Document the purpose of the test in the file header

## Best Practices

- Use descriptive test names
- Include appropriate authentication
- Test both happy path and error cases
- Verify response status codes, headers, and body content
- Clean up any created resources after tests
- Include appropriate retries for network issues