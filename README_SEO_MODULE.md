# Google Search Optimization Module

## Overview

The Google Search Optimization Module provides comprehensive SEO capabilities for the Ultimate Marketing Team platform, enabling marketers to optimize content for better search engine rankings, analyze search performance, and generate structured data markup.

## Features

### 1. Content SEO Validation

The module can validate content against SEO best practices, including:

- Title optimization
- Content structure analysis
- Keyword usage and density
- Readability metrics
- E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signals
- URL optimization

### 2. Search Performance Analysis

Retrieves and analyzes search performance data from Google Search Console:

- Query performance metrics (clicks, impressions, CTR, position)
- Time-series trend analysis
- Device and country breakdowns
- Page-specific performance data

### 3. Keyword Opportunity Analysis

Identifies keyword opportunities for content:

- Detects declining keyword rankings
- Suggests new keywords to target
- Analyzes keyword competition
- Assigns opportunity scores

### 4. Structured Data Generation

Automatically generates Schema.org JSON-LD structured data markup for various content types:

- Article
- BlogPosting
- FAQPage
- HowTo
- Product

The system can also automatically detect the most appropriate schema type for a given piece of content.

### 5. Content Update Recommendations

Generates actionable recommendations for updating content based on performance:

- Structured content recommendations
- Keyword usage recommendations
- Format recommendations (images, tables, videos)
- Prioritized list of changes

### 6. Update Scheduling

Suggests optimal update schedules based on content age and performance:

- Recommends update frequency
- Assigns update priority
- Creates detailed update schedules

## Architecture

The module consists of four main services:

1. **SEO Validation Service**: Analyzes content against SEO best practices and provides optimization recommendations.
2. **Search Console Service**: Integrates with Google Search Console API to retrieve and analyze search performance data.
3. **Structured Data Service**: Generates Schema.org JSON-LD markup for various content types.
4. **Ranking Performance Analyzer**: Analyzes ranking trends and generates content update recommendations.

## Database Schema

The module uses the following database tables (all in the `umt` schema):

- `seo_audit_logs`: Stores SEO validation and audit history
- `seo_content_metrics`: Stores SEO performance metrics for content
- `seo_keyword_opportunities`: Stores keyword opportunities for content
- `seo_content_update_recommendations`: Stores content update recommendations
- `search_console_properties`: Stores Google Search Console property information

## API Endpoints

### Search Performance

- `GET /api/v1/seo/search-performance`: Get search performance data
- `GET /api/v1/seo/content/{content_id}/search-data`: Get comprehensive search data for specific content
- `GET /api/v1/seo/content/{content_id}/keyword-opportunities`: Get keyword opportunities for content
- `GET /api/v1/seo/indexation-status`: Check URL indexation status
- `GET /api/v1/seo/mobile-usability`: Check mobile usability for URL

### Content Validation and Analysis

- `POST /api/v1/seo/validate-content`: Validate content against SEO best practices
- `POST /api/v1/seo/analyze-search-intent`: Analyze search intent for keywords
- `POST /api/v1/seo/content/analyze-performance`: Analyze content performance
- `GET /api/v1/seo/content/{content_id}/declining-rankings`: Get declining rankings for content
- `POST /api/v1/seo/content/update-recommendations`: Get content update recommendations
- `GET /api/v1/seo/content/{content_id}/update-schedule`: Get content update schedule

### Structured Data

- `POST /api/v1/seo/structured-data`: Generate structured data markup
- `POST /api/v1/seo/detect-schema-type`: Detect best schema type for content

## Integration

### Google Search Console Integration

To integrate with Google Search Console:

1. Create a Google Cloud project and enable the Search Console API
2. Create API credentials (OAuth client ID)
3. Add your credentials to the platform
4. Verify your properties in Search Console
5. Connect your properties to the Ultimate Marketing Team platform

## Usage Examples

### Validating Content

```python
# Example request to validate content
request_body = {
    "content_text": "Your content text here...",
    "content_type": "blog_post",
    "title": "10 Ways to Improve Your Marketing Strategy",
    "primary_keyword": "marketing strategy",
    "secondary_keywords": ["digital marketing", "strategy improvement"],
    "url": "https://example.com/blog/improve-marketing-strategy"
}

response = requests.post(
    "https://api.example.com/api/v1/seo/validate-content", 
    json=request_body
)
```

### Generating Structured Data

```python
# Example request to generate BlogPosting schema
request_body = {
    "content_text": "Your blog post content here...",
    "schema_type": "BlogPosting",
    "metadata": {
        "title": "10 Ways to Improve Your Marketing Strategy",
        "description": "Learn how to improve your marketing strategy with these 10 actionable tips.",
        "author": {
            "name": "Jane Doe",
            "url": "https://example.com/authors/jane-doe"
        },
        "publisher": {
            "name": "Example Marketing Blog",
            "logo": "https://example.com/logo.png"
        },
        "datePublished": "2025-03-26T10:00:00Z",
        "featuredImage": "https://example.com/images/marketing-strategy.jpg",
        "url": "https://example.com/blog/improve-marketing-strategy",
        "keywords": ["marketing strategy", "digital marketing", "business growth"]
    }
}

response = requests.post(
    "https://api.example.com/api/v1/seo/structured-data", 
    json=request_body
)
```

## Frontend Integration

The module provides a comprehensive SEO interface with tabs for:

1. SEO Validation
2. Search Performance
3. Keyword Opportunities
4. Content Updates
5. Structured Data

## Limitations

- The module currently supports English content only
- Real-time validation may be limited for very large documents (>10,000 words)
- Some features require Google Search Console integration

## Future Enhancements

- Multi-language support
- Competitor analysis
- AI-generated content recommendations
- Automated A/B testing for SEO improvements
- Integration with additional search engines