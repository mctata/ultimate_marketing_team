import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContentPredictions } from '../../../frontend/src/components/analytics/ContentPredictions';
import * as analyticsHooks from '../../../frontend/src/hooks/useAnalytics';

// Mock the API hooks
jest.mock('../../../frontend/src/hooks/useAnalytics', () => ({
  useContentPerformance: jest.fn(),
  useContentPrediction: jest.fn(),
}));

// Create a new QueryClient for testing
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('ContentPredictions Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock the hook implementations
    (analyticsHooks.useContentPerformance as jest.Mock).mockReturnValue({
      isLoading: false,
      data: {
        time_series: [
          {
            period: '2025-02-01',
            views: 500,
            conversions: 10,
            revenue: 250,
          },
          {
            period: '2025-02-02',
            views: 550,
            conversions: 12,
            revenue: 275,
          },
          {
            period: '2025-02-03',
            views: 600,
            conversions: 15,
            revenue: 300,
          },
        ],
      },
    });
    
    (analyticsHooks.useContentPrediction as jest.Mock).mockReturnValue({
      isLoading: false,
      data: {
        content_id: 123,
        target_metric: 'views',
        prediction_date: '2025-03-01T00:00:00.000Z',
        predicted_value: 800,
        confidence_interval_lower: 650,
        confidence_interval_upper: 950,
        model: {
          name: 'Views Predictor',
          type: 'random_forest',
          performance: {
            r2: 0.85,
            rmse: 100,
          },
        },
      },
      predictContent: jest.fn().mockResolvedValue({
        content_id: 123,
        target_metric: 'views',
        prediction_date: '2025-03-01T00:00:00.000Z',
        predicted_value: 800,
        confidence_interval_lower: 650,
        confidence_interval_upper: 950,
      }),
    });
  });

  test('renders the component correctly', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ContentPredictions contentId={123} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Check that the title is rendered
      expect(screen.getByText(/Content Performance Prediction/i)).toBeInTheDocument();
      
      // Check for predicted value in the component
      expect(screen.getByText(/800/)).toBeInTheDocument();
      
      // Check for confidence interval
      expect(screen.getByText(/650 - 950/i)).toBeInTheDocument();
      
      // Check for the chart (this may vary based on your implementation)
      expect(screen.getByText(/Historical vs. Predicted/i)).toBeInTheDocument();
    });
  });

  test('allows changing the target metric', async () => {
    const queryClient = createTestQueryClient();
    const predictContent = jest.fn().mockResolvedValue({});
    
    // Override the hook mock for this test
    (analyticsHooks.useContentPrediction as jest.Mock).mockReturnValue({
      isLoading: false,
      data: {
        content_id: 123,
        target_metric: 'views',
        prediction_date: '2025-03-01T00:00:00.000Z',
        predicted_value: 800,
        confidence_interval_lower: 650,
        confidence_interval_upper: 950,
      },
      predictContent,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ContentPredictions contentId={123} />
      </QueryClientProvider>
    );

    // Find and interact with the metric selector
    const metricSelect = screen.getByLabelText(/Metric to Predict/i);
    fireEvent.change(metricSelect, { target: { value: 'conversions' } });

    await waitFor(() => {
      // Check that the predict function was called with the right parameters
      expect(predictContent).toHaveBeenCalledWith({
        content_id: 123,
        target_metric: 'conversions',
        prediction_horizon: 30,
        content_data: expect.any(Object),
      });
    });
  });

  test('displays loading state correctly', async () => {
    const queryClient = createTestQueryClient();
    
    // Mock loading state
    (analyticsHooks.useContentPrediction as jest.Mock).mockReturnValue({
      isLoading: true,
      data: null,
      predictContent: jest.fn(),
    });
    
    (analyticsHooks.useContentPerformance as jest.Mock).mockReturnValue({
      isLoading: true,
      data: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ContentPredictions contentId={123} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Check for loading indicators
      expect(screen.getByText(/Loading prediction data/i)).toBeInTheDocument();
    });
  });

  test('handles error states correctly', async () => {
    const queryClient = createTestQueryClient();
    
    // Mock error state
    (analyticsHooks.useContentPrediction as jest.Mock).mockReturnValue({
      isLoading: false,
      error: new Error('Failed to fetch prediction'),
      data: null,
      predictContent: jest.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ContentPredictions contentId={123} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Check for error message
      expect(screen.getByText(/Error loading prediction data/i)).toBeInTheDocument();
    });
  });
});