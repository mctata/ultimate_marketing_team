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

## Authentication Flow

The OAuth2 authentication flow follows these steps:

1. **Initialization**:
   - Frontend calls `/seo/auth/google/init?brand_id={id}` endpoint
   - Backend generates an authorization URL with appropriate scopes
   - Frontend displays this URL to the user

2. **User Authorization**:
   - User clicks the authorization link and is redirected to Google's consent screen
   - User grants permissions to the application
   - Google redirects back with an authorization code

3. **Token Exchange**:
   - User inputs the authorization code in the application
   - Backend exchanges the code for access and refresh tokens via `/seo/auth/google/callback`
   - Tokens are securely stored for the specific brand

4. **Token Management**:
   - Access tokens expire after 1 hour
   - The system automatically refreshes tokens using the refresh token
   - Token state is stored persistently in the token storage directory

## Implementation Details

### Backend Components

1. **`GoogleSearchConsoleIntegration` Class**:
   - Located in `/src/agents/integrations/analytics/search_console.py`
   - Handles OAuth2 authentication and token management
   - Provides methods for retrieving search data
   - Implements automatic token refresh
   - Includes fallback to mock data for development

2. **SEO Settings**:
   - Located in `/src/core/seo_settings.py`
   - Manages environment variables and configurations
   - Handles secure token storage and retrieval

3. **Search Console Service**:
   - Located in `/src/services/search_console_service.py`
   - Provides business logic for analyzing search data
   - Implements caching for performance optimization
   - Connects integration with API endpoints

4. **SEO API Router**:
   - Located in `/src/api/routers/seo.py`
   - Exposes RESTful endpoints for frontend interaction
   - Handles authentication flow and data requests
   - Implements error handling and validation

### Frontend Components

1. **`ContentSEO.tsx` Component**:
   - Located in `/frontend/src/pages/content/ContentSEO.tsx`
   - Manages the OAuth2 flow and user interaction
   - Displays search performance data visualizations
   - Handles different tabs for various SEO features

2. **SEO Service**:
   - Located in `/frontend/src/services/seoService.ts`
   - Provides API client for interacting with backend endpoints
   - Handles error cases and data transformation
   - Implements interface types for type safety

## Testing

### Unit Testing

Run unit tests to verify the integration components:

```bash
# Test the search console integration
python -m pytest tests/agents/integrations/analytics/test_search_console.py

# Test the search console service
python -m pytest tests/services/test_search_console_service.py

# Test SEO API endpoints
python -m pytest tests/api/test_seo_api.py

# Test OAuth implementation
python -m pytest tests/api/test_seo_oauth.py
```

### Integration Testing with Real Credentials

For testing with real Google Search Console API:

```bash
# Set up environment variables for testing
export GOOGLE_OAUTH2_CLIENT_ID=your_client_id
export GOOGLE_OAUTH2_CLIENT_SECRET=your_client_secret
export TEST_GSC_REFRESH_TOKEN=your_refresh_token
export TEST_GSC_SITE_URL=your_site_url

# Run integration tests
python -m pytest tests/integration/test_search_console_integration.py -v
```

### Manual Testing

1. Start the backend and frontend services:
   ```bash
   # Start backend
   python -m src.api.main

   # Start frontend
   cd frontend && npm run dev
   ```

2. Navigate to any content item in the UI
3. Go to the SEO tab and click "Connect to Google Search Console"
4. Complete the OAuth2 flow
5. Verify that search data is retrieved and displayed correctly

### CI/CD Testing

The Search Console integration is automatically tested in our CI/CD pipeline:

1. **Standard CI Pipeline**: Unit tests run on every pull request and commit without using real credentials. Tests that require real credentials are automatically skipped.

2. **Dedicated Test Workflow**: A dedicated GitHub Actions workflow (`search-console-tests.yml`) allows testing with real credentials:
   - Can be triggered manually for pull requests that modify the Search Console integration
   - Runs automatically on a weekly schedule to verify the integration remains functional
   - Uses secure GitHub secrets to store test credentials

3. **API Monitoring**: A monitoring workflow (`search-console-monitoring.yml`) runs daily to:
   - Test the OAuth2 token refresh functionality
   - Monitor API rate limits and quotas
   - Track response times and success rates
   - Generate detailed reports
   - Send notifications if issues are detected

### Setup for CI/CD Testing

To enable testing with real credentials in CI/CD, add the following secrets to your GitHub repository:

1. `GOOGLE_OAUTH2_CLIENT_ID`: Your Google OAuth client ID
2. `GOOGLE_OAUTH2_CLIENT_SECRET`: Your Google OAuth client secret
3. `TEST_GSC_REFRESH_TOKEN`: A valid refresh token for a test account
4. `TEST_GSC_SITE_URL`: A verified site URL for testing
5. `SLACK_WEBHOOK`: (Optional) A Slack webhook URL for notifications

These secrets are used by both the test and monitoring workflows while keeping credentials secure.

## Troubleshooting

### Authorization Issues

- **Invalid credentials error**: Verify your client ID and secret are correctly set in `.env`
- **Access denied error**: Ensure your Google account has access to the Search Console properties
- **Invalid redirect URI**: Confirm the redirect URI matches exactly in both Google Cloud Console and your configuration
- **Token refresh failure**: Check if your refresh token is valid or expired

### Data Not Loading

- **No data available**: Verify the content URL is registered and verified in Search Console
- **Empty results**: New content may not have search data yet; data typically takes 2-3 days to appear
- **API quota errors**: Check if you've exceeded your daily API quota (default: 2,000 queries/day)

### Connection Issues

- **Network errors**: Verify internet connectivity and proper API endpoint configuration
- **Timeout errors**: The Google API may be slow to respond; consider increasing request timeout
- **CORS issues**: Ensure proper CORS configuration for development environments

## Error Handling

The integration implements comprehensive error handling:

1. **Token Management**:
   - Automatic token refresh when expired
   - Fallback to mock data if authentication fails
   - Error logs for troubleshooting

2. **API Request Errors**:
   - Rate limit handling with exponential backoff
   - Retry logic for transient failures
   - Meaningful error messages for debugging

3. **Data Validation**:
   - Validation of response data structure
   - Handling of empty or malformed responses
   - Default values for missing data

## API Documentation

### Backend Endpoints

#### Authentication

- `GET /seo/auth/google/init?brand_id={brand_id}`
  - Initiates OAuth flow
  - Returns: `{ "auth_url": string, "state": string }`

- `POST /seo/auth/google/callback`
  - Process OAuth callback
  - Body: `{ "code": string, "state": string, "brand_id": number }`
  - Returns: `{ "status": string, "message": string }`

- `GET /seo/auth/status?brand_id={brand_id}`
  - Check authentication status
  - Returns: `{ "status": string, "is_authorized": boolean, "brand_id": number, "expiration_time"?: string }`

#### Search Data

- `GET /seo/search-performance?brand_id={brand_id}&start_date={start_date}&end_date={end_date}&dimension={dimension}`
  - Get search performance data
  - Dimensions: query, page, device, country
  - Returns: `{ "status": string, "data": Array<SearchPerformanceData> }`

- `GET /seo/content/{content_id}/search-data?brand_id={brand_id}`
  - Get comprehensive search data for a specific content
  - Returns: `{ "status": string, "data": ContentSearchData }`

- `GET /seo/content/{content_id}/keyword-opportunities?brand_id={brand_id}`
  - Get keyword opportunities for content
  - Returns: `{ "status": string, "opportunities": Array<KeywordOpportunity> }`

#### SEO Analysis

- `GET /seo/indexation-status?brand_id={brand_id}&url={url}`
  - Check indexation status for URL
  - Returns: `{ "status": string, "is_indexed": boolean, ... }`

- `GET /seo/mobile-usability?brand_id={brand_id}&url={url}`
  - Check mobile usability for URL
  - Returns: `{ "status": string, "usability_status": string, ... }`

- `POST /seo/validate-content`
  - Validate content for SEO best practices
  - Body: `ContentSEOValidationRequest`
  - Returns: `ContentSEOValidationResponse`

- `POST /seo/structured-data`
  - Generate structured data markup
  - Body: `StructuredDataRequest`
  - Returns: `StructuredDataResponse`

### Frontend Integration

The SEO module integrates with the content management system through:

- `seoService.ts`: Service for interacting with SEO API endpoints
- `ContentSEO.tsx`: Main component for SEO data visualization and management
- Interface types for type safety and developer experience

## Development

### Adding New Features

1. Update `search_console.py` to add new data retrieval methods
2. Add corresponding endpoints in `seo.py` router
3. Update `seoService.ts` to interact with new endpoints
4. Add UI components in `ContentSEO.tsx` to display and interact with the data

### Security Considerations

- Tokens are stored securely with restricted file permissions
- OAuth flow uses state parameter to prevent CSRF attacks
- All API requests are authenticated
- Sensitive data is never exposed to frontend
- Rate limiting is implemented to prevent API abuse

## Performance Optimization

- API responses are cached to reduce API calls
- Token refresh is performed only when necessary
- Batch requests are used where possible
- Data is paginated for large result sets
- Frontend implements virtualized lists for large datasets

## API Monitoring System

The Search Console integration includes a comprehensive monitoring system to detect issues before they affect production:

### Features

- **Token Refresh Monitoring**: Verifies OAuth2 tokens can be refreshed successfully
- **API Health Checks**: Regularly tests all API endpoints to ensure availability
- **Rate Limit Tracking**: Detects when the application approaches API quota limits
- **Performance Metrics**: Tracks response times and success rates over time
- **Automatic Notifications**: Sends alerts when issues are detected
- **Detailed Reports**: Generates comprehensive reports for troubleshooting

### Running the Monitor

The monitor can be run manually:

```bash
# Basic monitoring
python scripts/monitor_search_console_api.py --brand-id 123

# With notifications
python scripts/monitor_search_console_api.py --brand-id 123 --notify

# With custom site URL
python scripts/monitor_search_console_api.py --brand-id 123 --site-url "sc-domain:example.com" --notify
```

### Automated Monitoring

The monitoring system runs automatically via GitHub Actions:

1. **Scheduled Monitoring**: Runs daily to ensure continuous operation
2. **Manual Triggering**: Can be triggered on-demand from GitHub Actions interface
3. **Artifact Generation**: Creates log files and metrics reports as downloadable artifacts
4. **Slack Notifications**: Sends alerts to a configured Slack channel when issues are detected

### Responding to Alerts

When an alert is received:

1. Check the monitoring logs for specific error details
2. Review the metrics report to identify patterns (response times, success rates)
3. Verify Google Search Console API status in the Google API Dashboard
4. Check if credential refresh is working correctly
5. Test with the Search Console UI to confirm if issues are specific to our integration

Common issues addressed by monitoring:
- OAuth token expiration or refresh failures
- API rate limit or quota exhaustion
- Changes to API response formats
- Network or latency issues
- Credential permission changes

## References

- [Google Search Console API Documentation](https://developers.google.com/webmaster-tools/search-console-api-original/v3/how-tos/authorizing)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google API Client Library for Python](https://github.com/googleapis/google-api-python-client)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)