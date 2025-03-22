# Ultimate Marketing Team

A comprehensive platform for managing marketing campaigns, content creation, and brand management with AI agents.

## Features

- AI-powered content creation and optimization
- Advanced analytics with customizable dashboards
- Predictive content performance with machine learning
- Cross-channel attribution modeling
- Content recommendation engine
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
- **Migration Verification**: Validates migration files for SQLAlchemy patterns and sequence integrity
- **Tests**: Runs Python tests, frontend tests, and migration tests
- **Performance Benchmarks**: Runs load tests and compares against baselines
- **Docker Build**: Builds and tests Docker images
- **Deployment**: Deploys to staging or production environments based on branch

The pipeline runs automatically on pull requests and pushes to main/develop branches. You can also manually trigger workflows from the GitHub Actions tab.

Performance benchmarks can be triggered manually or automatically on release candidates:

```bash
# Trigger performance benchmarks
gh workflow run performance.yml -f environment=staging -f baseline_version=v1.0.0
```

#### Migration CI/CD Flow

The migration verification is integrated into the CI/CD pipeline as follows:

1. **Static Analysis (verify-migrations job)**: 
   - Runs after code linting
   - Scans migration files for proper SQLAlchemy patterns using AST analysis
   - Validates migration sequence and dependency chain
   - Uploads verification logs as artifacts

2. **Database Testing (test-migrations job)**:
   - Runs after verification passes
   - Creates test database and applies migrations
   - Runs comprehensive integration tests for the migration system
   - Verifies database schema matches models

3. **Pre-Deployment Verification**:
   - Runs migration verification before staging/production deployment
   - Automatically performs database backups prior to migrations
   - Provides detailed logs of migration execution

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

## Performance Benchmarking

The project includes a comprehensive performance benchmarking suite:

### Running Benchmarks

```bash
# Run a benchmark
python benchmarks/runners/run_benchmark.py \
  --test-script locustfile.py \
  --host http://localhost:8000 \
  --users 100 \
  --spawn-rate 10 \
  --run-time 5m \
  --app-version dev

# Run benchmarks with Docker Compose
docker-compose -f benchmarks/docker-compose.benchmark.yml up -d

# Access Grafana dashboards
open http://localhost:3000
```

### CI Integration

Performance benchmarks are integrated into the CI/CD pipeline:

```bash
# Manually trigger benchmark workflow
gh workflow run performance.yml -f environment=staging
```

For more details, see the [Benchmarking README](benchmarks/README.md).

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

### Analytics & Recommendations System

The platform includes advanced analytics and recommendation capabilities:

1. **Content Analytics**: 
   - Customizable analytics dashboards using React Grid Layout
   - Performance metrics tracking with time-series analysis
   - Cross-channel attribution modeling (first-touch, last-touch, linear, position-based)
   - Automated reporting with scheduling and multiple export formats

2. **Predictive Analytics**:
   - Machine learning models for content performance prediction
   - Multiple model types supported (Random Forest, Gradient Boosting, Linear, etc.)
   - Confidence intervals for predictions
   - Automated model training and selection

3. **Content Recommendation Engine**:
   - Content clustering based on features and text similarity
   - Similar content recommendations
   - Performance-based recommendations
   - User-specific recommendations based on interaction history

The analytics system integrates with the content management workflow to provide real-time insights and predictive guidance for content creation and optimization.

## Database Migrations

The project uses Alembic for database migrations:

- Migrations are automatically run on application startup via Docker
- New migrations are created with `make migrate-create` or `python manage_migrations.py create`
- Migration history is tracked in the `migrations/versions` directory
- For manual control, use the `manage_migrations.py` script

### Migration Verification System

The project includes a comprehensive migration verification system to prevent common issues:

1. **Pre-migration checks**: Validate migrations before applying them
   ```bash
   python manage_migrations.py verify
   ```

2. **Migration pattern scanning**: Check for proper SQLAlchemy patterns
   ```bash
   python scripts/check_migration_patterns.py
   ```

3. **Automatic verification before migrations**: All upgrade operations run verification first
   ```bash
   # Run with checks (default)
   python manage_migrations.py upgrade

   # Skip checks if needed
   python manage_migrations.py upgrade --skip-checks
   ```

4. **Enhanced logging**: Migrations now log detailed execution information to `migration_validation.log`

5. **Docker integration**: Migration container automatically runs verification before applying migrations
   ```bash
   # Run migrations with verification (default)
   docker-compose up migrations

   # Skip verification if needed
   docker-compose run --rm migrations --skip-checks
   ```

6. **CI/CD Integration**: The verification system is integrated into the CI/CD pipeline:
   - A dedicated job (`verify-migrations`) runs before migration tests
   - Patterns are checked statically before database operations
   - Migration sequence is validated for proper dependencies
   - Migration logs are uploaded as artifacts for review
   - Deployment operations include verification steps before production deployment

7. **Deployment Integration**: The deployment process includes verification:
   ```bash
   # Deploy with verification (default)
   python scripts/deploy.py --environment staging

   # Skip verification if needed
   python scripts/deploy.py --environment staging --skip-verification
   ```

8. **Troubleshooting**: If migration verification fails, review the logs:
   ```bash
   # Check verification results
   cat migration_validation.log

   # Get detailed pattern check information
   python scripts/check_migration_patterns.py
   
   # Run only verification (no database changes)
   python manage_migrations.py verify
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.