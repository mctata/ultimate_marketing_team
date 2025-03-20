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
python manage.py runserver  # API server
cd frontend && npm run dev  # Frontend

# Run tests
python -m pytest
python -m pytest tests/path/to/specific_test.py     # Single test file
python -m pytest tests/path/to/specific_test.py::test_function  # Single test

# Lint code
python -m flake8
python -m mypy src/
```

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

## Agent Architecture
The Ultimate Marketing Team consists of five specialized AI agents:
1. Auth & Integration Agent: Handles authentication and platform integrations
2. Brand & Project Management Agent: Manages brand onboarding and project setup
3. Content Strategy & Research Agent: Analyzes content performance and competitors
4. Content Creation & Testing Agent: Generates and tests content variations
5. Content & Ad Management Agent: Handles publishing and ad campaign management

All agents inherit from BaseAgent, which provides core messaging and event handling functionality.

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