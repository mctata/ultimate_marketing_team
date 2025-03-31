import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import ContentCalendarContainer from '../../frontend/src/components/calendar/ContentCalendarContainer';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { format } from 'date-fns';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock theme
const theme = createTheme();

// Mock data
const mockCalendarItems = [
  {
    id: 1,
    title: 'Test Content 1',
    scheduled_date: '2025-03-15T10:00:00Z',
    status: 'scheduled',
    content_type: 'blog',
    platform: 'website',
    project_id: 1,
    content_draft_id: 1,
    created_at: '2025-03-10T00:00:00Z',
    updated_at: '2025-03-10T00:00:00Z'
  },
  {
    id: 2,
    title: 'Test Content 2',
    scheduled_date: '2025-03-20T14:00:00Z',
    status: 'draft',
    content_type: 'social',
    platform: 'facebook',
    project_id: 1,
    content_draft_id: 2,
    created_at: '2025-03-11T00:00:00Z',
    updated_at: '2025-03-11T00:00:00Z'
  }
];

const mockInsights = [
  {
    insight_type: 'gap',
    description: 'Gap of 5 days without scheduled content',
    severity: 'info',
    start_date: '2025-03-20T00:00:00Z',
    end_date: '2025-03-25T00:00:00Z',
    recommendation: 'Consider adding content during this period to maintain audience engagement'
  }
];

const mockBestTimes = [
  {
    platform: 'facebook',
    day_of_week: 2,
    hour_of_day: 14,
    average_engagement: 320,
    confidence: 0.75
  }
];

describe('ContentCalendarContainer', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock API responses
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/content-calendar/?project_id=1')) {
        return Promise.resolve({ data: mockCalendarItems });
      } else if (url.includes('/insights/best-times')) {
        return Promise.resolve({ data: mockBestTimes });
      } else if (url.includes('/insights/conflicts')) {
        return Promise.resolve({ data: mockInsights });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders calendar container with title', async () => {
    render(
      <ThemeProvider theme={theme}>
        <ContentCalendarContainer projectId={1} />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Content Calendar')).toBeInTheDocument();
    expect(screen.getByText('Schedule Content')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });
  });

  it('changes view mode when view buttons are clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <ContentCalendarContainer projectId={1} />
      </ThemeProvider>
    );
    
    // Default is month view
    // Click on week view
    const weekViewButton = screen.getByLabelText('week view');
    fireEvent.click(weekViewButton);
    
    // Check if week view is rendered
    await waitFor(() => {
      // Week view shows the date range
      const today = new Date();
      expect(screen.getByText(/\w+ \d+ - \w+ \d+, \d{4}/)).toBeInTheDocument();
    });
    
    // Click on list view
    const listViewButton = screen.getByLabelText('list view');
    fireEvent.click(listViewButton);
    
    // Check if list view is rendered
    await waitFor(() => {
      // List view has a search box
      expect(screen.getByPlaceholderText('Search content...')).toBeInTheDocument();
    });
  });

  it('fetches data from the API on initial load', async () => {
    render(
      <ThemeProvider theme={theme}>
        <ContentCalendarContainer projectId={1} />
      </ThemeProvider>
    );
    
    await waitFor(() => {
      // Calendar entries endpoint
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/content-calendar/?project_id=1')
      );
      
      // Best times endpoint
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/insights/best-times?project_id=1')
      );
      
      // Insights endpoint
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/insights/conflicts?project_id=1')
      );
    });
  });

  it('opens schedule dialog when Schedule Content button is clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <ContentCalendarContainer projectId={1} />
      </ThemeProvider>
    );
    
    // Click on Schedule Content button
    const scheduleButton = screen.getByText('Schedule Content');
    fireEvent.click(scheduleButton);
    
    // Check if dialog is opened
    await waitFor(() => {
      expect(screen.getByText('Schedule Content')).toBeInTheDocument();
      expect(screen.getByText('Content Draft')).toBeInTheDocument();
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <ContentCalendarContainer projectId={1} />
      </ThemeProvider>
    );
    
    // Wait for initial data load
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });
    
    // Clear mocks
    mockedAxios.get.mockClear();
    
    // Click on refresh button
    const refreshButton = screen.getByLabelText('Refresh calendar data');
    fireEvent.click(refreshButton);
    
    // Check if data is refreshed
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });
  });

  it('shows insights in the calendar header', async () => {
    render(
      <ThemeProvider theme={theme}>
        <ContentCalendarContainer projectId={1} />
      </ThemeProvider>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });
    
    // Check if insights are displayed
    expect(screen.getByText('Calendar Insights')).toBeInTheDocument();
    expect(screen.getByText('1 Suggestions')).toBeInTheDocument();
  });

  // Add more tests as needed for other functionality
});