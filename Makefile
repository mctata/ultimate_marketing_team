.PHONY: setup dev test lint format clean migrate-up migrate-down migrate-create docker-test docker-build docs

# Variables
PYTHON := python
VENV := venv
PYTEST := pytest
ALEMBIC := alembic
PIP := pip
NPM := npm
DOCKER_COMPOSE := docker-compose

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