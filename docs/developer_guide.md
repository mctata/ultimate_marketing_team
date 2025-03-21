# Ultimate Marketing Team Developer Guide

## Architecture Overview

The Ultimate Marketing Team platform is built with a modular, event-driven architecture:

1. **Frontend**: React application with TypeScript, Redux, and Tailwind CSS
2. **API**: FastAPI backend with JWT authentication
3. **Agents**: Specialized AI agents for different marketing functions
4. **Database**: PostgreSQL for persistent storage
5. **Messaging**: RabbitMQ for inter-agent communication
6. **Cache**: Redis for caching and session management

## Development Setup

### Environment Setup

1. Clone the repository
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment: 
   - Linux/macOS: `source venv/bin/activate`
   - Windows: `venv\Scripts\activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Install frontend dependencies: `cd frontend && npm install`

### Configuration

The application uses a settings-based configuration system:

- `src/core/settings.py` - Contains all application settings
- Environment variables can override default settings
- JWT settings for authentication are defined here

### Running the Application

#### Using Docker

Run the following command from the project root directory (NOT inside the frontend or any subdirectory):

```bash
# Must be run from project root directory
docker-compose up -d
```

#### Running Components Separately

1. Backend (run from project root):
```bash
python -m src.api.main
```

2. Frontend:
```bash
cd frontend && npm run dev
```

## Authentication System

### Implementation Details

The authentication system uses JWT tokens for stateless authentication:

1. Users register/login to obtain a JWT token
2. The token is included in the Authorization header for protected routes
3. The token is validated on the backend using the JWT secret

### Test Credentials

For development, use the test account:
- Email: `test@example.com`
- Password: `password123`

### Using the Authentication API

1. Register a new user:
```
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "secure_password",
  "full_name": "User Name"
}
```

2. Login to get a token:
```
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

3. Use the token in the Authorization header:
```
GET /api/v1/auth/me
Authorization: Bearer <your_token>
```

### Social Login (OAuth)

The system supports social login via:
- Google
- Facebook
- LinkedIn

OAuth configuration is managed by the Auth Integration Agent.

## Agent System

### Agent Architecture

All agents inherit from the `BaseAgent` class, which provides:
- Message handling
- Task execution
- Event broadcasting
- Configuration loading

### Agent Communication

Agents communicate through:
1. Direct task assignment (synchronous)
2. Event broadcasting (asynchronous)

Messages are passed through RabbitMQ, with each agent listening to its own queue.

### Configuration

Agent behavior is configured through YAML files in `src/agents/config/`:
- `agents.yaml` - Agent configuration
- `integrations.yaml` - Integration settings
- `tasks.yaml` - Task definitions
- `prompts/*.yaml` - Agent-specific prompts

## Database Schema

The database schema is defined using SQLAlchemy ORM models in the `src/models/` directory:
- `system.py` - User, Role, Permission models
- `content.py` - Content, ContentVersion, ContentMetrics models
- `project.py` - Brand, Project, Campaign models
- `advertising.py` - Ad, AdGroup, AdCampaign models
- `integration.py` - Integration, IntegrationCredential models

## Frontend Architecture

### State Management

The application uses Redux for state management:
- Store configuration in `src/store/index.ts`
- Feature slices in `src/store/slices/`

### Component Structure

Components are organized by feature:
- `src/components/common/` - Reusable components
- `src/components/layout/` - Layout components
- `src/pages/` - Page components

### Authentication on Frontend

Authentication state is managed in `src/store/slices/authSlice.ts` and hooks are provided in `src/hooks/useAuth.ts`.

### API Integration

The frontend communicates with the backend through:
- REST API client in `src/services/api.ts`
- WebSocket for real-time updates in `src/services/websocket.ts`

## Testing

### Backend Testing

Run backend tests with pytest:
```bash
python -m pytest
```

### Frontend Testing

Run frontend tests with Jest:
```bash
cd frontend && npm test
```

### Integration Testing

End-to-end tests are in the `tests/integration/` directory.

## Common Development Tasks

### Adding a New API Endpoint

1. Add a route function in the appropriate router file in `src/api/routers/`
2. Add request/response models using Pydantic
3. Implement the endpoint logic
4. Add authentication/permission requirements

### Creating a New Agent

1. Create a new agent class that inherits from `BaseAgent`
2. Define task handlers for the agent's responsibilities
3. Add configuration in `src/agents/config/agents.yaml`
4. Create prompt templates in `src/agents/config/prompts/`

### Adding a New Frontend Feature

1. Add Redux slice in `src/store/slices/`
2. Create components in `src/components/`
3. Add page components in `src/pages/`
4. Update routes in `src/App.tsx`

## Deployment

### Docker Deployment

The application can be deployed using Docker Compose (run from project root directory):
```bash
# Must be run from project root directory
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment Variables

For production deployment, set the following environment variables:
- `ENVIRONMENT=production`
- `JWT_SECRET` - A strong, unique secret key
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `RABBITMQ_URL` - RabbitMQ connection string

## Troubleshooting

### Authentication Issues

1. Check that the JWT_SECRET is consistent across all services
2. Verify that the token is correctly included in the Authorization header
3. Check that the token hasn't expired

### API Errors

1. Check the API logs for detailed error messages
2. Verify request format against API documentation
3. Use the test script to validate authentication endpoints:
```bash
python scripts/create_test_user.py
```

### Agent System

1. Verify RabbitMQ is running and accessible
2. Check agent logs for any initialization errors
3. Verify agent configuration in the YAML files