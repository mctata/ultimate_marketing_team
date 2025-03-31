import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConversionFunnel } from '../../../frontend/src/components/analytics/ConversionFunnel';
import * as analyticsHooks from '../../../frontend/src/hooks/useAnalytics';

// Mock the analytics hooks
jest.mock('../../../frontend/src/hooks/useAnalytics', () => ({
  useContentMetrics: jest.fn(),
}));

// Create a new QueryClient for testing
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('ConversionFunnel Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock the hook implementation
    (analyticsHooks.useContentMetrics as jest.Mock).mockReturnValue({
      isLoading: false,
      data: [
        {
          content_id: 123,
          date: '2025-03-01',
          platform: 'website',
          views: 5000,
          unique_visitors: 4000,
          clicks: 1500,
          leads_generated: 300,
          conversions: 100,
          revenue_generated: 5000,
        },
      ],
    });
  });

  test('renders the funnel with correct stages and data', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ConversionFunnel 
          contentId={123} 
          stages={[
            { id: 'views', label: 'Views' },
            { id: 'clicks', label: 'Clicks' },
            { id: 'leads_generated', label: 'Leads' },
            { id: 'conversions', label: 'Conversions' },
          ]}
        />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Check that all stages are rendered
      expect(screen.getByText('Views')).toBeInTheDocument();
      expect(screen.getByText('Clicks')).toBeInTheDocument();
      expect(screen.getByText('Leads')).toBeInTheDocument();
      expect(screen.getByText('Conversions')).toBeInTheDocument();
      
      // Check that the data values are displayed
      expect(screen.getByText('5,000')).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument();
      expect(screen.getByText('300')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      
      // Check that conversion rates are calculated and displayed
      expect(screen.getByText('30%')).toBeInTheDocument(); // Clicks / Views
      expect(screen.getByText('20%')).toBeInTheDocument(); // Leads / Clicks
      expect(screen.getByText('33.3%')).toBeInTheDocument(); // Conversions / Leads
    });
  });

  test('renders custom stages when provided', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ConversionFunnel 
          contentId={123} 
          stages={[
            { id: 'unique_visitors', label: 'Unique Visitors' },
            { id: 'leads_generated', label: 'Leads Generated' },
            { id: 'conversions', label: 'Sales' },
          ]}
        />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Check that custom stages are rendered
      expect(screen.getByText('Unique Visitors')).toBeInTheDocument();
      expect(screen.getByText('Leads Generated')).toBeInTheDocument();
      expect(screen.getByText('Sales')).toBeInTheDocument();
      
      // Verify the data values for custom stages
      expect(screen.getByText('4,000')).toBeInTheDocument();
      expect(screen.getByText('300')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  test('displays loading state correctly', async () => {
    const queryClient = createTestQueryClient();
    
    // Mock loading state
    (analyticsHooks.useContentMetrics as jest.Mock).mockReturnValue({
      isLoading: true,
      data: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ConversionFunnel 
          contentId={123} 
          stages={[
            { id: 'views', label: 'Views' },
            { id: 'clicks', label: 'Clicks' },
            { id: 'conversions', label: 'Conversions' },
          ]}
        />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Check for loading indicator
      expect(screen.getByText(/Loading funnel data/i)).toBeInTheDocument();
    });
  });

  test('handles error states correctly', async () => {
    const queryClient = createTestQueryClient();
    
    // Mock error state
    (analyticsHooks.useContentMetrics as jest.Mock).mockReturnValue({
      isLoading: false,
      error: new Error('Failed to fetch metrics'),
      data: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ConversionFunnel 
          contentId={123} 
          stages={[
            { id: 'views', label: 'Views' },
            { id: 'clicks', label: 'Clicks' },
            { id: 'conversions', label: 'Conversions' },
          ]}
        />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Check for error message
      expect(screen.getByText(/Error loading funnel data/i)).toBeInTheDocument();
    });
  });

  test('displays empty state when no data is available', async () => {
    const queryClient = createTestQueryClient();
    
    // Mock empty data
    (analyticsHooks.useContentMetrics as jest.Mock).mockReturnValue({
      isLoading: false,
      data: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ConversionFunnel 
          contentId={123} 
          stages={[
            { id: 'views', label: 'Views' },
            { id: 'clicks', label: 'Clicks' },
            { id: 'conversions', label: 'Conversions' },
          ]}
        />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Check for empty state message
      expect(screen.getByText(/No funnel data available/i)).toBeInTheDocument();
    });
  });
});