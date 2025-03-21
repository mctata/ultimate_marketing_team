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

2. Set up the Python environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend:

```bash
cd frontend
npm install
```

4. Start the application with Docker Compose:

```bash
docker-compose up -d
```

### Development

For development, you can run the components separately:

```bash
# Start the API server
python -m src.api.main

# Start the frontend
cd frontend && npm run dev
```

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.