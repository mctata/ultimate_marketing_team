# Ultimate Marketing Team API Documentation

## Overview

The Ultimate Marketing Team API provides authentication, content management, brand management, campaigns, and analytics capabilities through a RESTful interface.

## Comprehensive Documentation

We've created comprehensive API documentation using OpenAPI 3.0 specifications. The complete documentation is available at:

- **Interactive Documentation**: [/docs/api/index.html](api/index.html)

The documentation includes:

- Complete API reference with all endpoints, request/response formats
- Interactive Swagger UI for testing endpoints directly
- Code examples in Python, JavaScript, and cURL
- Detailed guides for common workflows

## Base URL

All API endpoints are accessible through the base URL:

```
http://localhost:8000/api/v1
```

For production:

```
https://api.ultimatemarketingteam.com/api/v1
```

## Authentication

The API uses JWT token-based authentication. Most endpoints require an `Authorization` header with a Bearer token.

### Authentication Endpoints

#### Register User

```
POST /auth/register
```

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword",
  "full_name": "Your Name"
}
```

**Response (201 Created):**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "full_name": "Your Name",
  "is_active": true,
  "is_superuser": false
}
```

#### Login

```
POST /auth/login
```

Login with email and password to obtain a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

## API Documentation Guides

For detailed guides on using specific features of the API, please refer to:

- [Authentication Guide](api/guides/authentication.html)
- [Content Management Guide](api/guides/content-management.html)
- [Campaign Management Guide](api/guides/campaign-management.html)
- [Analytics Data Retrieval Guide](api/guides/analytics.html)
- [API Versioning and Migration Guide](api/guides/versioning.html)

## Client Libraries

We provide official client libraries for integrating with the API:

- [Python Client](https://github.com/ultimate-marketing-team/umt-python-client)
- [JavaScript Client](https://github.com/ultimate-marketing-team/umt-js-client)

## API Versioning

The API uses URI path versioning (`/api/v1/`). For information about our versioning strategy and migration process, see the [API Versioning Guide](api/guides/versioning.html).

## Rate Limits

API requests are limited to 100 requests per minute by default. Rate limit information is provided in response headers:
- `X-RateLimit-Limit`: Maximum requests per minute
- `X-RateLimit-Remaining`: Remaining requests in the current window
- `X-RateLimit-Reset`: Time until the rate limit resets (in seconds)

## Development Notes

- For development use the test account: `test@example.com` with password `password123`
- Run the test script to verify authentication: `python scripts/create_test_user.py`
- All responses are in JSON format
- Error responses include a `detail` field with an error message