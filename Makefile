.PHONY: setup dev test test-health lint format clean migrate-up migrate-down migrate-create docker-test docker-build docs help

# Variables
PYTHON := python
VENV := venv
PYTEST := pytest
ALEMBIC := alembic
PIP := pip
NPM := npm
DOCKER_COMPOSE := docker-compose

# Help command
help:
	@echo "Ultimate Marketing Team - Development Commands"
	@echo ""
	@echo "Available targets:"
	@echo "  setup              - Create virtual environment and install dependencies"
	@echo "  dev                - Start all development services with Docker Compose"
	@echo "  test               - Run all tests"
	@echo "  test-migrations    - Run migration tests only"
	@echo "  test-with-coverage - Run tests with coverage report"
	@echo "  test-health        - Check API health status"
	@echo "  lint               - Run linting checks"
	@echo "  format             - Format code with black and isort"
	@echo "  migrate-up         - Apply all pending migrations"
	@echo "  migrate-down       - Rollback the most recent migration"
	@echo "  migrate-create     - Create a new migration"
	@echo "  docker-test        - Run tests in Docker environment"
	@echo "  docker-build       - Build all Docker images"
	@echo "  docs               - Generate documentation"
	@echo "  clean              - Remove build artifacts and caches"
	@echo ""
	@echo "For more information, see README.md and CLAUDE.md"

# Python setup
setup:
	$(PYTHON) -m venv $(VENV)
	$(VENV)/bin/$(PIP) install -r requirements.txt
	@echo "Virtual environment created. Activate with 'source venv/bin/activate'"

# Development server
dev:
	$(DOCKER_COMPOSE) up -d

# Testing
test:
	$(PYTEST) -xvs tests/

test-migrations:
	$(PYTEST) -xvs tests/integration/test_migrations.py

test-with-coverage:
	$(PYTEST) --cov=src tests/
	
test-health:
	$(PYTHON) scripts/check_api_health.py --url http://localhost:8000/api/health --retries 5 --delay 2

# Linting and formatting
lint:
	flake8 src/ tests/
	mypy src/
	cd frontend && $(NPM) run lint

format:
	black src/ tests/
	isort src/ tests/
	cd frontend && $(NPM) run format

# Database migrations
migrate-up:
	$(ALEMBIC) upgrade head

migrate-down:
	$(ALEMBIC) downgrade -1

migrate-create:
	@read -p "Enter migration message: " message; \
	$(ALEMBIC) revision --autogenerate -m "$$message"

# Docker operations
docker-test:
	$(DOCKER_COMPOSE) -f docker-compose.test.yml up -d
	@echo "Running test migration container..."
	@sleep 5
	$(DOCKER_COMPOSE) -f docker-compose.test.yml logs migrations
	$(DOCKER_COMPOSE) -f docker-compose.test.yml down

docker-build:
	$(DOCKER_COMPOSE) build

# Documentation
docs:
	@if [ ! -d "docs" ]; then mkdir docs; fi
	sphinx-apidoc -o docs/source src
	cd docs && make html

# Cleanup
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	find . -type f -name ".coverage" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name "*.egg" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".coverage" -exec rm -rf {} +
	find . -type d -name "htmlcov" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type d -name ".vscode" -exec rm -rf {} +
	rm -rf build/
	rm -rf dist/
	rm -rf .eggs/
	rm -rf .tox/