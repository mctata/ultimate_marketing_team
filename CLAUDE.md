# Ultimate Marketing Team Helper Guide

## Development Commands
```bash
# Setup virtual environment
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start application
docker-compose up -d

# Start components separately
python -m src.api.main  # API server
cd frontend && npm run dev  # Frontend

# Run tests
python -m pytest               # Run all tests
python -m pytest tests/agents/ # Run all agent tests
python -m pytest tests/integration/test_migrations.py  # Run migration tests
python -m pytest tests/path/to/specific_test.py     # Single test file
python -m pytest tests/path/to/specific_test.py::test_function  # Single test
python -m pytest -v            # Verbose output
python -m pytest -xvs          # Verbose with stdout captured
python -m pytest --cov=src     # Run with coverage report

# Lint and format code
python -m flake8
python -m mypy src/
python -m black src/ tests/
python -m isort src/ tests/

# Database migrations
# Run migrations in Docker
docker-compose up migrations

# Test migrations in Docker
docker-compose -f docker-compose.test.yml up migrations

# Local migration commands with helper script
python manage_migrations.py create --message "Description" --autogenerate  # Create new migration
python manage_migrations.py upgrade                                        # Apply all migrations
python manage_migrations.py downgrade <revision>                           # Rollback to revision
python manage_migrations.py history                                        # View migration history
python manage_migrations.py current                                        # Show current version

# Raw Alembic commands (if needed)
alembic revision --autogenerate -m "Description"  # Create migration
alembic upgrade head                              # Apply migrations
alembic downgrade -1                              # Rollback one version
alembic history                                   # View history

# Makefile shortcuts
make setup                # Setup development environment
make dev                  # Start development services
make test                 # Run all tests
make test-migrations      # Run migration tests
make test-with-coverage   # Run tests with coverage
make lint                 # Run linting checks
make format               # Format code
make migrate-up           # Apply migrations
make migrate-down         # Rollback migration
make migrate-create       # Create new migration
make docker-test          # Run tests in Docker
make docker-build         # Build Docker images
make clean                # Clean build artifacts
make docs                 # Generate documentation
```

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

### Workflow Structure
- `.github/workflows/ci-cd.yml`: Main CI/CD pipeline configuration

### Pipeline Stages
1. **Lint**: Code quality checks
   - flake8: Python syntax and style
   - mypy: Type checking
   - isort: Import sorting
   - black: Code formatting

2. **Test**: Run automated tests
   - Python tests: Unit and integration tests 
   - Frontend tests: React component tests
   - Migration tests: Database schema tests

3. **Docker Build**: Verify Docker configuration
   - Build all Docker images
   - Run containerized tests
   - Verify Docker networking

4. **Deploy**: Environment deployment
   - Staging: Automatic deployment from develop branch
   - Production: Automatic deployment from main branch

### Running the Pipeline
- Automatically runs on pull requests to main/develop
- Automatically runs on pushes to main/develop
- Manually trigger from GitHub Actions tab (workflow_dispatch)

## Code Style Guidelines
- **Naming**: Snake case for functions/variables (`handle_request`), PascalCase for classes (`BaseAgent`)
- **Imports**: Group imports: 1) stdlib, 2) third-party, 3) local imports; alphabetize within groups
- **Typing**: Use typing annotations for all parameters and return values (from typing import Dict, Any, List, Optional)
- **Docstrings**: All classes and methods need descriptive docstrings with param/return descriptions
- **Error Handling**: Use try/except with specific exceptions, log with loguru, propagate errors when appropriate
- **Architecture**: 
  - Follow dependency injection pattern
  - Use abstract base classes and inheritance (BaseAgent)
  - Event-driven architecture with message passing (RabbitMQ)

## Project Organization
- `/src/agents/`: Agent implementation classes
  - `/src/agents/config/`: YAML configuration for agents, tasks, prompts, integrations
- `/src/api/`: FastAPI routes and endpoints 
- `/src/core/`: Core infrastructure services (cache, database, logging, messaging, security)
- `/src/models/`: SQLAlchemy database models for different domain entities
- `/migrations/`: Alembic database migration scripts
  - `/migrations/versions/`: Individual migration files
  - `/migrations/env.py`: Alembic environment configuration
- `/manage_migrations.py`: Helper script for managing database migrations
- `/tests/`: Test suite
  - `/tests/unit/`: Unit tests for individual components
  - `/tests/integration/`: Integration tests across components
  - `/tests/integration/test_migrations.py`: Migration system tests
- `/.github/workflows/`: CI/CD pipeline configuration
- `/docker/`: Docker configuration files
- `/scripts/`: Utility scripts
- `/docs/`: Documentation

## Database Migrations

### Migration Architecture
- Alembic for schema version control
- Custom schema name: "umt"
- Dockerized migration service in production
- Migration testing integrated into CI/CD

### Migration Best Practices
- Create migrations with `python manage_migrations.py create`
- Always include both upgrade and downgrade paths
- Run test database before applying to production
- Never modify existing migration files after deployment
- Include meaningful descriptions with each migration
- Use transactions to ensure atomicity

### Migration Testing
- Isolated test database for each test run
- Verify forward and backward migrations
- Test data preservation during migrations
- Compare schema to SQLAlchemy models
- Docker environment testing

## Agent Architecture
The Ultimate Marketing Team consists of five specialized AI agents:
1. Auth & Integration Agent: Handles authentication and platform integrations
2. Brand & Project Management Agent: Manages brand onboarding and project setup
3. Content Strategy & Research Agent: Analyzes content performance and competitors
4. Content Creation & Testing Agent: Generates and tests content variations
5. Content & Ad Management Agent: Handles publishing and ad campaign management

All agents inherit from BaseAgent, which provides core messaging and event handling functionality.

### Agent Communication Pattern
- Agents communicate through a message broker (RabbitMQ)
- Two primary communication patterns:
  1. Direct task assignment (`send_task` method) - for specific work requests
  2. Event broadcasting (`broadcast_event` method) - for system-wide notifications
- Each agent has a dedicated message queue
- Agents register handlers for specific task and event types
- Support for synchronous (with response) and asynchronous (fire and forget) interactions

### Testing Approach
- Unit tests for individual agent methods and handlers
- Integration tests for agent interactions
- End-to-end workflow tests for complete user journeys
- Mock external dependencies (RabbitMQ, Redis, etc.)
- Use pytest fixtures for common test setup

## Integration & Data Flow
- Each module operates independently but communicates via RabbitMQ.
- Brand data from the Brand & Project Management module informs the Content Strategy module.
- The Content Strategy module's output guides the Content Creation module, whose variants undergo A/B testing.
- Final approved content and strategy feed into the Content & Ad Management module for publishing and ad optimization.
- All performance and engagement data are consolidated in PostgreSQL, enabling real-time dashboards and predictive analytics.

## Expected Outputs
- A unified, interactive dashboard with real-time insights on content performance, competitor benchmarks, ad campaign ROI, and overall marketing effectiveness for {company}.
- A dynamically generated content calendar coupled with data-rich reports that continuously adjust strategies.
- Automated execution of ad campaigns on Google Ads and Facebook Ads and streamlined content distribution across CMS and social platforms.

## Additional Considerations
- Ensure role-based access control (RBAC) and audit trails are implemented for security and compliance.
- Design the UI/UX to be fully accessible (WCAG 2.1 compliant), responsive, and user-friendly.
- Build modularity into the system so each component can be updated or replaced independently, facilitating continuous improvement as market demands evolve in 2025.