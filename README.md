# Ultimate Marketing Team

A comprehensive platform for managing marketing campaigns, content creation, and brand management with AI agents.

## Features

- AI-powered content creation and optimization
- Campaign management and analytics
- Brand and project management
- Integration with advertising platforms
- Content calendar and scheduling
- Automated A/B testing
- Real-time collaboration and notifications

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 14+
- Docker and Docker Compose
- PostgreSQL
- Redis
- RabbitMQ

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ultimate_marketing_team.git
cd ultimate_marketing_team
```

2. Make sure you have Docker and Docker Compose installed on your system.

3. Create a `.env` file in the root directory for environment variables:

```bash
# API and Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ultimatemarketing
REDIS_URL=redis://redis:6379/0
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Services
DOMAIN=localhost
API_HOST=http://localhost:8000
FRONTEND_HOST=http://localhost:3000
```

4. Create a `.env.local` file in the frontend directory:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_WEBSOCKET_URL=ws://localhost:8000/ws
```

5. Start the application with Docker Compose:

```bash
docker-compose up -d
```

6. Run database migrations:

```bash
# Run migrations automatically with Docker
docker-compose up migrations

# Or manually using the helper script
python manage_migrations.py upgrade
```

7. Access the application:
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - RabbitMQ Management: http://localhost:15672 (guest/guest)

### Development

For development, you can use the provided Makefile commands:

```bash
# Setup development environment
make setup

# Start development services
make dev

# Run tests
make test

# Run linting
make lint

# Format code
make format

# Run migrations
make migrate-up

# Create a new migration
make migrate-create

# Run Docker tests
make docker-test
```

For more commands, check the Makefile or run `make help`.

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

- **Lint**: Checks code quality with flake8, mypy, isort, and black
- **Tests**: Runs Python tests, frontend tests, and migration tests
- **Docker Build**: Builds and tests Docker images
- **Deployment**: Deploys to staging or production environments based on branch

The pipeline runs automatically on pull requests and pushes to main/develop branches. You can also manually trigger workflows from the GitHub Actions tab.

### Troubleshooting

If you encounter issues:

1. **Missing Python packages**: Make sure all dependencies are installed:
   ```bash
   pip install -r requirements.txt
   pip install cryptography email-validator pydantic-settings
   ```

2. **Database connection issues**: Check that PostgreSQL is running and the connection string is correct:
   ```bash
   docker-compose ps postgres
   ```

3. **Database migration issues**: Check Alembic migration status and logs:
   ```bash
   # Check migration status
   python manage_migrations.py current
   
   # View migration history
   python manage_migrations.py history
   
   # Check migration logs
   docker-compose logs migrations
   ```

4. **Frontend build errors**: Resolve TypeScript errors and ensure all dependencies are installed:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

5. **Agent services failing**: Check logs to identify specific issues:
   ```bash
   docker-compose logs auth-agent
   ```

6. **CI/CD failures**: Check the GitHub Actions logs for detailed information about failures.

## API Documentation

API documentation is available at:

- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`
- Custom docs: [API Documentation](docs/api_documentation.md)

## Authentication

The system uses JWT token-based authentication:

1. Register a new user at `/auth/register`
2. Login to get a token at `/auth/login`
3. Include the token in the Authorization header: `Bearer <token>`

For development, use the test account:
- Email: test@example.com
- Password: password123

You can verify authentication using the test script:

```bash
python scripts/create_test_user.py
```

## Architecture

The Ultimate Marketing Team consists of five specialized AI agents:

1. Auth & Integration Agent: Handles authentication and platform integrations
2. Brand & Project Management Agent: Manages brand onboarding and project setup
3. Content Strategy & Research Agent: Analyzes content performance and competitors
4. Content Creation & Testing Agent: Generates and tests content variations
5. Content & Ad Management Agent: Handles publishing and ad campaign management

All agents inherit from BaseAgent, which provides core messaging and event handling functionality.

## Database Migrations

The project uses Alembic for database migrations:

- Migrations are automatically run on application startup via Docker
- New migrations are created with `make migrate-create` or `python manage_migrations.py create`
- Migration history is tracked in the `migrations/versions` directory
- For manual control, use the `manage_migrations.py` script

## License

This project is licensed under the MIT License - see the LICENSE file for details.