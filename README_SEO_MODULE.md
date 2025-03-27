# SEO Module - Google Search Console Integration

This module integrates the Ultimate Marketing Team platform with Google Search Console to provide real-time search performance data for your content.

## Features

- **OAuth2 Authentication**: Secure connection to Google Search Console API
- **Search Performance Data**: Track clicks, impressions, CTR, and average position
- **Keyword Opportunities**: Identify high-potential keywords for optimization
- **Device Breakdown**: Analyze search traffic by device type
- **Performance Visualizations**: Interactive charts and graphs for search metrics
- **Content Update Recommendations**: AI-powered suggestions to improve content performance
- **Structured Data Generator**: Create and validate JSON-LD schema markup

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Library"
4. Search for "Search Console API" and enable it

### 2. Create OAuth 2.0 Credentials

1. In your Google Cloud Project, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" and select "OAuth client ID"
3. Configure the OAuth consent screen:
   - User type: External
   - Application name: "Ultimate Marketing Team"
   - Support email: your email address
   - Authorized domains: your domain
4. Add scopes: `https://www.googleapis.com/auth/webmasters.readonly`
5. For the OAuth client ID creation:
   - Application type: Web application
   - Name: "Ultimate Marketing Team SEO Integration"
   - Authorized JavaScript origins: `http://localhost:5173` (for development)
   - Authorized redirect URIs: `http://localhost:8000/api/seo/oauth2callback`
6. Note the Client ID and Client Secret provided

### 3. Configure Environment Variables

Add the following variables to your `.env` file:

```
GOOGLE_OAUTH2_CLIENT_ID=your_client_id
GOOGLE_OAUTH2_CLIENT_SECRET=your_client_secret
GOOGLE_OAUTH2_REDIRECT_URI=http://localhost:8000/api/seo/oauth2callback
TOKEN_STORAGE_DIR=.tokens
SEO_CACHE_TTL=3600
```

### 4. Verify Properties in Google Search Console

1. Make sure your website or content properties are verified in Google Search Console
2. Ensure the Google account you use has access to these properties

### 5. Connect the Integration in the UI

1. Navigate to the SEO section for any content item
2. Click "Connect to Google Search Console"
3. Follow the OAuth authorization flow
4. Once authorized, the system will begin retrieving real search data

## Usage

### Search Performance Data

The Search Performance tab displays comprehensive metrics about how your content performs in Google Search, including:

- Average position in search results
- Total clicks, impressions, and CTR (Click-Through Rate)
- Performance trends over time
- Top performing search queries
- Device breakdown statistics

### Keyword Opportunities

This tab helps you identify keywords with potential for rank improvement, including:

- Keywords that are on page 2-3 of results (positions 11-30)
- Keywords with high impressions but low CTR
- Keywords with improving trends

### Content Updates

Based on search performance data, this section provides:

- Specific recommendations to improve rankings
- Content update schedule based on performance trends
- Priority updates to focus on

### Structured Data

Generate JSON-LD structured data markup for your content:

- Automatically detect appropriate schema type
- Generate complete schema code
- Copy ready-to-use markup to clipboard

## Troubleshooting

### Authorization Issues

- **Invalid credentials error**: Verify your client ID and secret are correctly set in `.env`
- **Access denied error**: Ensure your Google account has access to the Search Console properties
- **Invalid redirect URI**: Confirm the redirect URI matches exactly in both Google Cloud Console and your configuration

### Data Not Loading

- **No data available**: Verify the content URL is registered and verified in Search Console
- **Empty results**: New content may not have search data yet; data typically takes 2-3 days to appear
- **API quota errors**: Check if you've exceeded your daily API quota (default: 2,000 queries/day)

## API Documentation

### Backend Endpoints

- `GET /api/seo/auth/google/init`: Initialize OAuth flow
- `POST /api/seo/auth/google/callback`: Process OAuth callback
- `GET /api/seo/auth/status`: Check authentication status
- `GET /api/seo/search-performance`: Get general search performance data
- `GET /api/seo/content/:content_id/search-data`: Get content-specific search data
- `GET /api/seo/content/:content_id/keyword-opportunities`: Get keyword opportunities for content
- `POST /api/seo/content/update-recommendations`: Get content update recommendations

### Frontend Integration

The SEO module integrates with the content management system through:

- `seoService.ts`: Service for interacting with SEO API endpoints
- `ContentSEO.tsx`: Main component for SEO data visualization and management

## Development

### Adding New Features

1. Update `search_console.py` to add new data retrieval methods
2. Add corresponding endpoints in `seo.py` router
3. Update `seoService.ts` to interact with new endpoints
4. Add UI components in `ContentSEO.tsx` to display and interact with the data

### Testing

- Run API tests with `python -m pytest tests/api/test_seo_api.py`
- Run integration tests with `python -m pytest tests/integration/test_google_integration.py`