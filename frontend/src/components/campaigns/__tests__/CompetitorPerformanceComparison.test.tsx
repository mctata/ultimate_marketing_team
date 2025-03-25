import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../../theme';
import CompetitorPerformanceComparison from '../CompetitorPerformanceComparison';

// Mock the useCampaignBenchmark hook
jest.mock('../../../hooks/useCampaignBenchmark', () => {
  return jest.fn().mockImplementation(() => ({
    getCompetitorPerformance: jest.fn().mockReturnValue({
      data: {
        data: [
          {
            id: '1',
            name: 'Your Brand',
            metrics: {
              impressions: 420000,
              clicks: 38000,
              ctr: 9.05,
              conversion: 3.2,
              cpa: 28.5,
              spend: 34000,
              roas: 4.8,
            },
          },
          {
            id: '2',
            name: 'Competitor A',
            metrics: {
              impressions: 380000,
              clicks: 29000,
              ctr: 7.63,
              conversion: 2.8,
              cpa: 32.1,
              spend: 26000,
              roas: 3.9,
            },
          },
          {
            id: '3',
            name: 'Competitor B',
            metrics: {
              impressions: 490000,
              clicks: 42000,
              ctr: 8.57,
              conversion: 2.5,
              cpa: 35.6,
              spend: 37000,
              roas: 3.2,
            },
          }
        ]
      },
      isLoading: false,
      error: null
    })
  }));
});

// Create a wrapper component with providers
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {ui}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('CompetitorPerformanceComparison Component', () => {
  test('renders the component with performance data', async () => {
    renderWithProviders(<CompetitorPerformanceComparison campaignId="test-campaign-id" />);
    
    // Check for the title
    expect(screen.getByText(/Competitor Performance Comparison/i)).toBeInTheDocument();
    
    // Check for the table headers
    expect(screen.getByText(/Metric/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Brand/i)).toBeInTheDocument();
    expect(screen.getByText(/Competitor A/i)).toBeInTheDocument();
    expect(screen.getByText(/Competitor B/i)).toBeInTheDocument();
    
    // Check for some metric names
    expect(screen.getByText(/Impressions/i)).toBeInTheDocument();
    expect(screen.getByText(/Clicks/i)).toBeInTheDocument();
    expect(screen.getByText(/CTR/i)).toBeInTheDocument();
    
    // Check for some of the actual metric values
    await waitFor(() => {
      expect(screen.getByText('420,000')).toBeInTheDocument(); // Your Brand impressions
      expect(screen.getByText('38,000')).toBeInTheDocument();  // Your Brand clicks
      expect(screen.getByText('9.05%')).toBeInTheDocument();   // Your Brand CTR
    });
  });
  
  test('displays loading state when data is loading', async () => {
    // Override the mock for this specific test
    require('../../../hooks/useCampaignBenchmark').mockImplementation(() => ({
      getCompetitorPerformance: jest.fn().mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      })
    }));
    
    renderWithProviders(<CompetitorPerformanceComparison campaignId="test-campaign-id" />);
    
    // Check for loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('displays error state when there is an error', async () => {
    // Override the mock for this specific test
    require('../../../hooks/useCampaignBenchmark').mockImplementation(() => ({
      getCompetitorPerformance: jest.fn().mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load data')
      })
    }));
    
    renderWithProviders(<CompetitorPerformanceComparison campaignId="test-campaign-id" />);
    
    // Check for error message
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
  });
});