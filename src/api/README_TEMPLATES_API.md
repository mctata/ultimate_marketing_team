# Templates API Documentation

This document provides an overview of the Templates API implementation that powers the Template Testing feature in the Ultimate Marketing Team application.

## Overview

The Templates API provides a comprehensive set of endpoints for managing marketing templates across different industries and formats. It allows users to:

- Browse templates by industry, category, and format
- View detailed template information with customizable fields and tone options
- Create, update, and delete templates
- Rate templates and mark them as favorites
- Use templates to create content drafts
- Get personalized template recommendations

## API Endpoints

### Template Categories

- `GET /templates/categories`: List all template categories
- `POST /templates/categories`: Create a new template category

### Template Industries

- `GET /templates/industries`: List all template industries
- `POST /templates/industries`: Create a new template industry

### Template Formats

- `GET /templates/formats`: List all template formats (with optional filtering)
- `POST /templates/formats`: Create a new template format

### Templates

- `GET /templates`: List templates with extensive filtering and pagination options
- `GET /templates/{template_id}`: Get a specific template by ID
- `POST /templates`: Create a new template
- `PUT /templates/{template_id}`: Update a template
- `DELETE /templates/{template_id}`: Delete a template

### Template Interactions

- `POST /templates/{template_id}/ratings`: Rate a template
- `POST /templates/{template_id}/use`: Use a template to create content
- `POST /templates/{template_id}/favorite`: Add a template to favorites
- `DELETE /templates/{template_id}/favorite`: Remove a template from favorites
- `GET /templates/favorites`: Get user's favorite templates

### Template Analytics

- `GET /templates/popular`: Get popular templates
- `GET /templates/recommended`: Get personalized template recommendations

## Database Schema

The Templates API is built on top of a comprehensive database schema that includes:

- `Template`: Main template data including content, dynamic fields, and tone options
- `TemplateCategory`: Categories for classifying templates
- `TemplateIndustry`: Industries templates are intended for
- `TemplateFormat`: Format specifications for different content types
- `TemplateRating`: User ratings for templates
- `TemplateUsage`: Track template usage
- `TemplateVersion`: Version history for templates
- `TemplateFavorite`: User favorite templates

## Authentication and Authorization

All Templates API endpoints require authentication through JWT tokens. The authentication is implemented using the OAuth2 Bearer scheme with the `get_current_user` dependency from `src.core.security`.

## Data Seeding

To populate the database with initial template data, you can use:

1. The Python script: `scripts/seed_templates.py`
2. The frontend service: `src/services/seedTemplateService.ts`

The Python script is more suitable for backend development and testing, while the frontend service can be used to seed templates from the application UI.

## Integration with Frontend

The Templates API is integrated with the frontend through the following services:

- `templateService.ts`: Provides functions for interacting with all template endpoints
- `seedTemplateService.ts`: Provides functions for seeding and initializing the templates library

## Error Handling

The API implements comprehensive error handling, including:

- 404 Not Found errors for missing templates
- 403 Forbidden errors for unauthorized template deletion
- Appropriate error responses for database operations

## Implementation Details

### Template Router

The Templates API router is implemented in `src/api/templates.py` and registered in `src/api/main.py` with the prefix `/api/v1/templates`.

### Database Models

The database models for templates are defined in `src/models/template.py` with SQLAlchemy ORM.

### API Schemas

The request and response schemas for templates are defined in `src/schemas/template.py` using Pydantic.

## Usage Examples

### Get Templates with Filtering

```typescript
// Get templates for a specific industry
const healthWellnessTemplates = await templateService.getTemplates({ 
  industry_id: "1", 
  sort_by: "community_rating",
  sort_dir: "desc"
});
```

### Get Template Detail

```typescript
// Get a specific template by ID
const template = await templateService.getTemplateById("123");
```

### Use a Template

```typescript
// Use a template to create content
const result = await templateService.useTemplate(
  "123",
  { client_name: "Acme Inc", product: "Super Widget" },
  { project_id: "456", content: "Customized content..." }
);
```