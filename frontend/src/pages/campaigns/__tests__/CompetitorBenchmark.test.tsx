import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import theme from '../../../theme';
import CompetitorBenchmark from '../CompetitorBenchmark';

// Mock all required hooks
jest.mock('../../../hooks/useCampaignBenchmark', () => {
  return jest.fn().mockImplementation(() => ({
    getShareOfVoice: jest.fn().mockReturnValue({
      data: {
        data: [
          { id: '1', label: 'Your Brand', value: 35, color: '#4CAF50' },
          { id: '2', label: 'Competitor A', value: 25, color: '#2196F3' },
        ]
      },
      isLoading: false,
      error: null
    }),
    getCompetitorAds: jest.fn().mockReturnValue({
      data: {
        data: [
          {
            id: '1',
            competitorName: 'Competitor A',
            adTitle: 'Summer Sale - 50% Off Everything',
            adContent: 'Limited time offer!',
            platform: 'Facebook',
            dateDetected: '2025-03-10T14:30:00Z',
            stats: {
              impressions: 45000,
              engagement: 3200,
              estimatedSpend: 2500,
            },
          }
        ]
      },
      isLoading: false,
      error: null
    }),
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
          }
        ]
      },
      isLoading: false,
      error: null
    }),
    getIndustryBenchmark: jest.fn().mockReturnValue({
      data: {
        data: {
          metric: 'ctr',
          timeframe: 'last7days',
          data: [
            {
              date: '2025-03-19',
              yourValue: 9.2,
              competitorAverage: 7.8,
              industryAverage: 7.5,
            },
            {
              date: '2025-03-20',
              yourValue: 9.5,
              competitorAverage: 7.9,
              industryAverage: 7.6,
            }
          ]
        }
      },
      isLoading: false,
      error: null
    })
  }));
});

// Mock the hooks/useCampaigns.ts with a minimal implementation
jest.mock('../../../hooks/useCampaigns', () => {
  return jest.fn().mockImplementation(() => ({
    getCampaignDetail: jest.fn().mockReturnValue({
      data: {
        id: 'test-campaign-id',
        name: 'Test Campaign',
        status: 'active',
        platform: 'Facebook',
        startDate: '2025-03-01',
        endDate: '2025-04-01',
        budget: 50000,
        description: 'A test campaign',
      },
      isLoading: false,
      error: null
    })
  }));
});

// Create a wrapper component with providers
const renderWithProviders = (ui: React.ReactElement, { route = '/campaigns/test-campaign-id/benchmark' } = {}) => {
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
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/campaigns/:id/benchmark" element={ui} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('CompetitorBenchmark Page', () => {
  test('renders the component with tabs and content', async () => {
    renderWithProviders(<CompetitorBenchmark />);
    
    // Check for the main title
    expect(screen.getByText(/Competitor Benchmark:/i)).toBeInTheDocument();
    
    // Check that tabs are rendered
    expect(screen.getByRole('tab', { name: /Performance Comparison/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Share of Voice/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Competitor Ads/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Industry Benchmarks/i })).toBeInTheDocument();
    
    // First tab content should be visible by default
    await waitFor(() => {
      expect(screen.getByText(/Competitor Performance Comparison/i)).toBeInTheDocument();
    });
    
    // Now click on a different tab
    fireEvent.click(screen.getByRole('tab', { name: /Share of Voice/i }));
    
    // Check that the new tab content is shown
    await waitFor(() => {
      expect(screen.getByText(/Share of Voice/i)).toBeInTheDocument();
    });
  });
  
  test('loads campaign data and shows it in the header', async () => {
    renderWithProviders(<CompetitorBenchmark />);
    
    // Check for campaign name in the header
    await waitFor(() => {
      expect(screen.getByText(/Test Campaign/i)).toBeInTheDocument();
    });
  });
});