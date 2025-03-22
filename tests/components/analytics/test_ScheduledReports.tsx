import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScheduledReports } from '../../../frontend/src/components/analytics/ScheduledReports';
import * as analyticsHooks from '../../../frontend/src/hooks/useAnalytics';

// Mock the analytics hooks
jest.mock('../../../frontend/src/hooks/useAnalytics', () => ({
  useAnalyticsReports: jest.fn(),
}));

// Create a new QueryClient for testing
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('ScheduledReports Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Sample reports data
    const reportsData = [
      {
        id: 1,
        name: 'Monthly Content Report',
        description: 'Monthly performance summary',
        report_type: 'content',
        schedule_type: 'monthly',
        schedule_config: { day: 1, time: '09:00' },
        recipients: ['user@example.com'],
        last_generated: '2025-03-01T09:00:00',
        file_path: '/reports/monthly_report_2025-03-01.pdf',
        file_type: 'pdf',
        created_at: '2025-02-01T12:00:00',
      },
      {
        id: 2,
        name: 'Weekly Social Media Report',
        description: 'Weekly social media performance',
        report_type: 'social',
        schedule_type: 'weekly',
        schedule_config: { day: 'monday', time: '08:00' },
        recipients: ['user@example.com', 'manager@example.com'],
        last_generated: '2025-03-04T08:00:00',
        file_path: '/reports/social_report_2025-03-04.pdf',
        file_type: 'pdf',
        created_at: '2025-02-15T10:00:00',
      },
    ];
    
    // Mock the hook implementation with create and delete functions
    const createReport = jest.fn().mockResolvedValue({ id: 3, name: 'New Report' });
    const deleteReport = jest.fn().mockResolvedValue({ success: true });
    const generateReport = jest.fn().mockResolvedValue({ status: 'Report generation started' });
    
    (analyticsHooks.useAnalyticsReports as jest.Mock).mockReturnValue({
      isLoading: false,
      data: reportsData,
      createReport,
      deleteReport,
      generateReport,
    });
  });

  test('renders the reports list correctly', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ScheduledReports />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Check that report names are displayed
      expect(screen.getByText('Monthly Content Report')).toBeInTheDocument();
      expect(screen.getByText('Weekly Social Media Report')).toBeInTheDocument();
      
      // Check that schedule info is displayed
      expect(screen.getByText(/Monthly/)).toBeInTheDocument();
      expect(screen.getByText(/Weekly/)).toBeInTheDocument();
      
      // Check that last generated date is displayed
      expect(screen.getByText(/Mar 1, 2025/)).toBeInTheDocument();
      expect(screen.getByText(/Mar 4, 2025/)).toBeInTheDocument();
    });
  });

  test('opens create report form when add button is clicked', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ScheduledReports />
      </QueryClientProvider>
    );

    // Find and click the add report button
    const addButton = screen.getByRole('button', { name: /Create Report/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      // Check that the form dialog appears
      expect(screen.getByText(/Create New Report/i)).toBeInTheDocument();
      
      // Check that form fields are present
      expect(screen.getByLabelText(/Report Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Report Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Schedule/i)).toBeInTheDocument();
    });
  });

  test('submits form with correct data', async () => {
    const queryClient = createTestQueryClient();
    const createReport = jest.fn().mockResolvedValue({ id: 3, name: 'New Report' });
    
    // Override the hook mock for this test
    (analyticsHooks.useAnalyticsReports as jest.Mock).mockReturnValue({
      isLoading: false,
      data: [],
      createReport,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ScheduledReports />
      </QueryClientProvider>
    );

    // Open form
    const addButton = screen.getByRole('button', { name: /Create Report/i });
    fireEvent.click(addButton);

    // Fill out form
    fireEvent.change(screen.getByLabelText(/Report Name/i), { target: { value: 'Test Report' } });
    fireEvent.change(screen.getByLabelText(/Report Type/i), { target: { value: 'content' } });
    fireEvent.change(screen.getByLabelText(/Schedule/i), { target: { value: 'weekly' } });
    
    // Add recipient
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    const addEmailButton = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addEmailButton);
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Check that createReport was called with correct data
      expect(createReport).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Report',
        report_type: 'content',
        schedule_type: 'weekly',
        recipients: ['test@example.com'],
      }));
    });
  });

  test('generates report when generate button is clicked', async () => {
    const queryClient = createTestQueryClient();
    const generateReport = jest.fn().mockResolvedValue({ status: 'Report generation started' });
    
    // Override the hook mock for this test
    (analyticsHooks.useAnalyticsReports as jest.Mock).mockReturnValue({
      isLoading: false,
      data: [
        {
          id: 1,
          name: 'Monthly Content Report',
          report_type: 'content',
          schedule_type: 'monthly',
        },
      ],
      generateReport,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ScheduledReports />
      </QueryClientProvider>
    );

    // Find and click the generate button
    const generateButton = screen.getByRole('button', { name: /Generate Now/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      // Check that generateReport was called with correct ID
      expect(generateReport).toHaveBeenCalledWith(1, expect.any(String));
      
      // Check for success message
      expect(screen.getByText(/Report generation started/i)).toBeInTheDocument();
    });
  });

  test('displays loading state correctly', async () => {
    const queryClient = createTestQueryClient();
    
    // Mock loading state
    (analyticsHooks.useAnalyticsReports as jest.Mock).mockReturnValue({
      isLoading: true,
      data: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ScheduledReports />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Check for loading indicator
      expect(screen.getByText(/Loading reports/i)).toBeInTheDocument();
    });
  });

  test('handles error states correctly', async () => {
    const queryClient = createTestQueryClient();
    
    // Mock error state
    (analyticsHooks.useAnalyticsReports as jest.Mock).mockReturnValue({
      isLoading: false,
      error: new Error('Failed to fetch reports'),
      data: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ScheduledReports />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Check for error message
      expect(screen.getByText(/Error loading reports/i)).toBeInTheDocument();
    });
  });
});