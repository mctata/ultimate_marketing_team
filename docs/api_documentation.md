# Ultimate Marketing Team API Documentation

## Overview

The Ultimate Marketing Team API provides authentication, content management, and brand management capabilities through a RESTful interface.

## Base URL

All API endpoints are accessible through the base URL:

```
http://localhost:8000/api/v1
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

#### OAuth2 Token (Form-based)

```
POST /auth/token
```

Standard OAuth2 token endpoint for form-based authentication.

**Request Body (form-urlencoded):**
```
username=user@example.com
password=yourpassword
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### Get Current User

```
GET /auth/me
```

Get information about the currently authenticated user.

**Headers:**
```
Authorization: Bearer <your_token>
```

**Response (200 OK):**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "full_name": "Your Name",
  "is_active": true,
  "is_superuser": false
}
```

### OAuth Authentication

#### Initiate OAuth Flow

```
POST /auth/oauth
```

Start an OAuth authentication flow with a third-party provider.

**Request Body:**
```json
{
  "provider": "google",
  "redirect_uri": "http://localhost:3000/oauth/callback"
}
```

**Response (200 OK):**
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/auth?..."
}
```

#### OAuth Callback

```
POST /auth/oauth/callback
```

Handle OAuth callback and generate JWT token.

**Request Body:**
```json
{
  "provider": "google",
  "code": "authorization_code_from_provider",
  "state": "state_from_oauth_request"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

## Brands

### Get Brands

```
GET /brands
```

Retrieve a list of brands.

**Headers:**
```
Authorization: Bearer <your_token>
```

**Response (200 OK):**
```json
[
  {
    "id": "brand-uuid",
    "name": "Brand Name",
    "description": "Brand description",
    "logo_url": "https://example.com/logo.png",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
]
```

## Content

### Get Content Items

```
GET /content
```

Retrieve a list of content items.

**Headers:**
```
Authorization: Bearer <your_token>
```

**Response (200 OK):**
```json
[
  {
    "id": "content-uuid",
    "title": "Content Title",
    "description": "Content description",
    "content_type": "article",
    "status": "draft",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
]
```

## Testing Authentication

To test the authentication system:

1. Register a new user:
```
POST /auth/register
```

2. Login to get a JWT token:
```
POST /auth/login
```

3. Use the token to access protected endpoints:
```
GET /auth/me
GET /brands
GET /content
```

## Development Notes

- For development use the test account: `test@example.com` with password `password123`
- Run the test script to verify authentication: `python scripts/create_test_user.py`
- All responses are in JSON format
- Error responses include a `detail` field with an error message