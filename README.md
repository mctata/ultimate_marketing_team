# Ultimate Marketing Team Platform

Welcome to the Ultimate Marketing Team platform, powered by [Landing Pad Digital](https://landingpad.digital). This platform creates a comprehensive AI-driven marketing automation system designed to replace a traditional marketing department, handling end-to-end marketing functions for enterprise-scale operations.

## Goal

The Ultimate Marketing Team platform serves as a complete marketing department replacement, managing the entire marketing lifecycle from strategy to execution. Our integrated team of specialized AI agents collaborates seamlessly to handle content strategy, creation, publishing, engagement, and advertising while leveraging real-time data, competitor research, and predictive analytics.

The platform is designed to support multiple brands and project types with enterprise-grade IT security and seamless integrations with existing marketing technology stacks.

## System Architecture

The Ultimate Marketing Team platform utilizes a custom multi-layered architecture optimized for enterprise performance, scalability, and cost-efficiency:

### Frontend Layer
- Modern React/Redux SPA with component-based architecture
- OAuth integration for secure authentication via Google, Facebook, and LinkedIn
- WebSocket connections for real-time dashboard updates and notifications
- Responsive design supporting desktop, tablet, and mobile interfaces

### API Gateway Layer
- FastAPI-based RESTful API gateway for synchronous requests
- Authentication middleware and rate limiting for security
- Comprehensive API documentation with Swagger/OpenAPI

### Agent Orchestration Layer
- Custom Python-based multi-agent framework for precise control and optimization
- RabbitMQ for reliable asynchronous communication between agents
- Redis for efficient caching and state management
- Optimized token usage and prompt engineering to control AI costs

### AI Processing Layer
- Strategic use of OpenAI/Anthropic APIs for complex reasoning tasks
- Self-hosted open-source models for routine, high-volume operations
- Custom prompt management system for consistent agent interactions
- Fine-tuned models for specialized marketing tasks

### Data Layer
- PostgreSQL database for structured data storage
- Vector database for semantic search and content recommendations
- Object storage for digital assets and content files
- Comprehensive data pipeline for analytics and reporting

## AI Agent Team Structure

Our Ultimate Marketing Team consists of five specialized agents working together through a shared message bus and knowledge repository:

1. **Auth & Integration Agent**: Manages secure user authentication via social accounts and configures platform integrations with CMS, social media, and ad campaign platforms. Regularly verifies API connectors to ensure compliance with evolving ad and CMS APIs.

2. **Brand & Project Management Agent**: Onboards brands by capturing company information and brand guidelines, and sets up multiple project types per brand, automatically enriching data from website URLs. Implements role-based access control (RBAC) and audit trails for enhanced security as brands and projects scale.

3. **Content Strategy & Competitor Research Agent**: Analyzes content topics, performance metrics, and competitor data to develop competitive, data-driven content calendars. Leverages competitor insights to ensure your platform not only follows marketing trends but also innovates ahead of the curve.

4. **Content Creation & Testing Agent**: Uses AI language models to generate multiple content drafts that align with brand guidelines and conducts A/B testing to select top-performing variations for each project type. Iterative testing helps refine content quality over time, closely integrating audience feedback for improved conversion rates.

5. **Content & Ad Management Agent**: Handles the end-to-end process of organizing, scheduling, and publishing content across channels while managing ad campaigns through Google Ads and Facebook Ads integrations. Runs predictive analytics to forecast engagement trends and ad campaign ROI, making data-backed adjustments in real-time.

## System Inputs

The platform processes these essential inputs to customize operations for enterprise marketing needs:

* **{company_name}** – Brand or company identifier
* **{website_url}** – URL for fetching company data
* **{brand_guidelines}** – Defined voice, tone, and visual identity
* **{project_types}** – Types of projects (Email, Landing Page, Social Post, Blog)
* **{social_accounts_credentials}** – API tokens for social platforms
* **{CMS_credentials}** – API configuration for platforms like WordPress and Shopify
* **{ad_accounts_credentials}** – API credentials for Google Ads and Facebook Ads
* **{content_topic}** – Themes and topics for content generation
* **{scheduling_preferences}** – Preferred posting dates/times
* **{performance_metrics}** – Engagement, reach, SEO, and ad performance data
* **{competitor_websites}** – URLs or identifiers for key competitor companies

## Installation and Deployment

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- RabbitMQ 3.9+
- Redis 6.2+
- Docker and Docker Compose (for containerized deployment)

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/landingpad-digital/ultimate_marketing_team.git
cd ultimate-marketing-team
```

2. Set up the backend:
```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the frontend:
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

4. Set up the database:
```bash
# Start PostgreSQL and run migrations
python manage.py migrate
```

5. Start the development environment:
```bash
# Start all components using Docker Compose
docker-compose up -d

# Or start components separately
python manage.py runserver  # API server
cd frontend && npm run dev  # Frontend
```

### Production Deployment

For production environments, we recommend using Kubernetes or a similar container orchestration platform. Detailed deployment instructions are available in the `deployment/` directory.

## Enterprise Marketing Workflows

The platform operates with both sequential workflows and parallel processing patterns optimized for enterprise marketing operations:

**End-to-End Marketing Workflow:**
1. The Content Strategy Agent analyzes market data, competitor strategies, and previous campaign performance
2. Comprehensive content briefs and campaign strategies are developed based on this analysis
3. The Content Creation Agent produces multiple content variations across required channels
4. A/B testing identifies highest-performing content options before full deployment
5. Content and ad campaigns are scheduled, published and continuously optimized in real-time
6. Predictive analytics forecast outcomes and recommend strategy adjustments

**Parallel Operations:**
- Multi-brand campaign management across global markets
- Continuous competitor monitoring and strategy adjustment
- Real-time ad performance optimization and budget reallocation
- Automated content personalization based on engagement patterns
- Cross-channel attribution modeling and ROI optimization

## Enterprise-Grade Features

- **Multi-Brand Support**: Manage distinct brand identities within a single enterprise
- **Global Campaign Management**: Coordinate marketing efforts across international markets
- **Predictive Analytics**: Forecast campaign outcomes and optimize resource allocation
- **Competitive Intelligence**: Continuously monitor and respond to competitor activities
- **Ad Campaign Automation**: Manage complex advertising campaigns across multiple platforms
- **Cross-Channel Attribution**: Track marketing impact across touchpoints for accurate ROI assessment
- **Regulatory Compliance**: Ensure marketing content meets industry and regional requirements
- **Enterprise Security**: Role-based access control and comprehensive audit trails
- **Cost Optimization**: Intelligent resource allocation minimizes AI API costs while maximizing results
- **Smart Image Processing**: Focal point-based image optimization for consistent visual messaging across platforms

## Smart Image Processing with Focal Points

The Ultimate Marketing Team platform includes an advanced image optimization system that uses focal points to ensure the most important parts of your images remain visible across all platforms and formats:

### How It Works

1. **Focal Point Selection**: When uploading images, users select the most important area of the image - the part that should always remain visible regardless of cropping or resizing.

2. **Platform-Specific Variants**: The system automatically generates optimized image variants for different platforms (Facebook, Instagram, LinkedIn, Twitter, etc.) with different aspect ratios.

3. **Smart Cropping Algorithm**: Our intelligent cropping algorithm ensures the focal point remains centered whenever possible, calculating the optimal crop area based on:
   - The target platform's required dimensions
   - The original image's aspect ratio
   - The location of the focal point

4. **Cross-Platform Consistency**: This approach ensures your marketing visuals maintain consistent messaging across platforms with different image requirements.

5. **User Experience**: The intuitive focal point selector includes:
   - Click and drag functionality for selecting focal points
   - Visual crosshair indicators showing selected areas
   - Fine-tuning sliders for precise control
   - Real-time preview of results

This eliminates the need for manually creating multiple versions of images for different platforms, saving time and ensuring visual consistency in your marketing campaigns.

## Customization

The platform is highly configurable through these key files:

- `config/agents.yaml` - Defines capabilities and roles for each agent
- `config/tasks.yaml` - Specifies tasks and their assignment to agents
- `config/integrations.yaml` - Configures third-party service connections
- `config/prompts/` - Contains customizable prompt templates for AI interactions

## Support

For support, questions, or feedback regarding the Ultimate Marketing Team platform:
- Visit our [documentation](https://lab.landingpad.digital/docs)
- Reach out to us through our [Lab support](https://lab.landingpad.digital/support)
- [Chat with our docs](https://chatg.pt/DWjSBZn)

Transform your enterprise marketing operations with the Ultimate Marketing Team platform - the complete AI-driven replacement for traditional marketing departments.