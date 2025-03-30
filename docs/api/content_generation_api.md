# Content Generation API Integration

This document outlines the integration between the frontend components and the backend AI content generation APIs.

## Service Architecture

The frontend/backend integration follows a layered approach:

1. **API Services Layer**: TypeScript service files with typed interfaces
2. **React Query/Hooks Layer**: Custom hooks for component integration
3. **Component Layer**: UI components that consume the hooks
4. **WebSocket Layer**: Real-time updates for long-running processes

## API Services

### Content Generation Service (`contentGenerationService.ts`)

This service provides typed interfaces and API endpoints for content generation:

- **Template Management**: 
  - List, get, create, update, delete templates
  - Render templates with variables

- **Content Generation**:
  - Generate content based on templates and variables
  - Generate content in batches
  - Monitor task status for asynchronous generation

- **Content Quality Assessment**:
  - Request quality assessment for content
  - Retrieve quality metrics, strengths, and improvement suggestions

- **A/B Testing**:
  - Create A/B tests with multiple content variations
  - Manage test lifecycle (start, stop, etc.)
  - Analyze test results

### WebSocket Service (`contentWebSocketService.ts`)

Provides real-time updates for long-running content generation operations:

- **Event Types**:
  - Content generation events (started, progress, completed, failed)
  - Quality assessment events
  - A/B testing events

- **Subscription Model**:
  - Components can subscribe to specific task/content/test IDs
  - Automatic cleanup on unmount

- **Fallback Strategy**:
  - Automatic polling fallback if WebSocket connection fails

## React Hooks

### `useTemplates`

Provides methods to work with content templates:

- List all templates
- Get template details
- Create/update/delete templates
- Render templates with variables

### `useContentGeneration`

Handles the content generation process:

- Generate content based on templates
- Monitor generation progress (WebSocket or polling)
- Access task status information
- Request and retrieve quality assessment data

### `useABTesting`

Manages A/B testing functionality:

- Create and manage A/B tests
- Start/stop tests
- View and analyze test results

## Component Integration

Components use the hooks to interact with the backend APIs:

1. **Template Selection**: Uses `useTemplates` to fetch and display templates
2. **Variable Input**: Uses template data to generate dynamic forms
3. **Generation Progress**: Uses WebSocket service for real-time updates
4. **Quality Assessment**: Displays metrics and suggestions from the API
5. **A/B Testing**: Manages test creation and monitoring

## Error Handling

The integration includes comprehensive error handling:

- API request errors with useful error messages
- WebSocket connection failures with polling fallback
- Generation failures with detailed error information
- Optimistic updates with rollback on failure

## Performance Optimizations

To ensure optimal performance:

- React Query for caching and request deduplication
- WebSockets for real-time updates to minimize polling
- Conditional fetching to prevent unnecessary requests
- Request batching for related operations

## Typed Interfaces

All API interactions use TypeScript interfaces to ensure type safety:

- `Template`: Content template structure
- `GenerationRequest`/`GenerationResponse`: Content generation
- `TaskStatusResponse`: Generation progress tracking
- `ContentVariation`: Generated content variants
- `QualityAssessment`: Content quality metrics
- `ABTest`/`ABTestRequest`: A/B testing

## Usage Example

```typescript
// In a component
const { generateContent, taskStatus, isGenerating } = useContentGeneration();
const [content, setContent] = useState('');

// Generate content
const handleGenerate = async () => {
  try {
    const response = await generateContent({
      template_id: 'template-123',
      variables: { title: 'My Content', topic: 'AI' },
      quality_assessment: true
    });
    
    // Task ID for tracking
    const taskId = response.task_id;
    
    // Content will be available in taskStatus when complete
  } catch (error) {
    console.error('Generation failed:', error);
  }
};

// Display content when ready
useEffect(() => {
  if (taskStatus?.status === 'completed' && taskStatus.result) {
    setContent(taskStatus.result[0].content);
  }
}, [taskStatus]);
```