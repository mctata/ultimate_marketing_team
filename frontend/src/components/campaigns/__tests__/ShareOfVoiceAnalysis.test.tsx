import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../../theme';
import ShareOfVoiceAnalysis from '../ShareOfVoiceAnalysis';

// Mock the useCampaignBenchmark hook
jest.mock('../../../hooks/useCampaignBenchmark', () => {
  return jest.fn().mockImplementation(() => ({
    getShareOfVoice: jest.fn().mockReturnValue({
      data: {
        data: [
          { id: '1', label: 'Your Brand', value: 35, color: '#4CAF50' },
          { id: '2', label: 'Competitor A', value: 25, color: '#2196F3' },
          { id: '3', label: 'Competitor B', value: 15, color: '#FFC107' },
          { id: '4', label: 'Competitor C', value: 10, color: '#9C27B0' },
          { id: '5', label: 'Competitor D', value: 8, color: '#E91E63' },
          { id: '6', label: 'Others', value: 7, color: '#607D8B' },
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

describe('ShareOfVoiceAnalysis Component', () => {
  test('renders the component with pie chart by default', async () => {
    renderWithProviders(<ShareOfVoiceAnalysis campaignId="test-campaign-id" />);
    
    // Check for the title
    expect(screen.getByText(/Share of Voice/i)).toBeInTheDocument();
    
    // Check for chart type toggle
    expect(screen.getByRole('button', { name: /pie/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bar/i })).toBeInTheDocument();
    
    // Chart should be rendered but testing libraries don't expose canvas content easily
    // We can check for the canvas element
    expect(screen.getByTestId('share-of-voice-chart')).toBeInTheDocument();
    
    // Check that some of the data labels are displayed in the legend
    await waitFor(() => {
      expect(screen.getByText('Your Brand')).toBeInTheDocument();
      expect(screen.getByText('Competitor A')).toBeInTheDocument();
    });
  });
  
  test('switches to bar chart when bar button is clicked', async () => {
    renderWithProviders(<ShareOfVoiceAnalysis campaignId="test-campaign-id" />);
    
    // Click the bar chart button
    fireEvent.click(screen.getByRole('button', { name: /bar/i }));
    
    // We can check if the bar button is now active
    const barButton = screen.getByRole('button', { name: /bar/i });
    expect(barButton).toHaveAttribute('aria-pressed', 'true');
    
    // And the pie button should not be active
    const pieButton = screen.getByRole('button', { name: /pie/i });
    expect(pieButton).toHaveAttribute('aria-pressed', 'false');
  });
  
  test('displays loading state when data is loading', async () => {
    // Override the mock for this specific test
    require('../../../hooks/useCampaignBenchmark').mockImplementation(() => ({
      getShareOfVoice: jest.fn().mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      })
    }));
    
    renderWithProviders(<ShareOfVoiceAnalysis campaignId="test-campaign-id" />);
    
    // Check for loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('displays error state when there is an error', async () => {
    // Override the mock for this specific test
    require('../../../hooks/useCampaignBenchmark').mockImplementation(() => ({
      getShareOfVoice: jest.fn().mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load data')
      })
    }));
    
    renderWithProviders(<ShareOfVoiceAnalysis campaignId="test-campaign-id" />);
    
    // Check for error message
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
  });
});