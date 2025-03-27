import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SearchPerformanceChart } from '../SearchPerformanceChart';
import { KeywordOpportunitiesTable } from '../KeywordOpportunitiesTable';
import { SEODashboard } from '../SEODashboard';

// Mock data
const mockSearchData = {
  dates: ['2025-03-01', '2025-03-02', '2025-03-03', '2025-03-04', '2025-03-05'],
  clicks: [120, 132, 145, 160, 138],
  impressions: [2500, 2600, 2750, 2900, 2650],
  ctr: [4.8, 5.1, 5.3, 5.5, 5.2],
  position: [3.2, 3.1, 2.9, 2.8, 3.0]
};

const mockKeywordOpportunities = [
  {
    keyword: 'content marketing strategy',
    current_position: 11.2,
    impressions: 2500,
    clicks: 120,
    ctr: 4.8,
    opportunity_type: 'position_improvement',
    opportunity_score: 85,
    recommendation: 'Update content with more specific examples and case studies'
  },
  {
    keyword: 'marketing automation tools',
    current_position: 15.5,
    impressions: 1800,
    clicks: 67,
    ctr: 3.7,
    opportunity_type: 'click_through_rate',
    opportunity_score: 72,
    recommendation: 'Improve title and meta description to increase CTR'
  }
];

// Mock the SEO service
jest.mock('../../../services/seoService', () => ({
  getSearchPerformance: jest.fn().mockResolvedValue({
    status: 'success',
    data: mockSearchData
  }),
  getKeywordOpportunities: jest.fn().mockResolvedValue({
    status: 'success',
    opportunities: mockKeywordOpportunities
  }),
  checkAuthorizationStatus: jest.fn().mockResolvedValue({
    status: 'success',
    is_authorized: true
  })
}));

describe('Search Console Visualization Components', () => {
  test('SearchPerformanceChart renders correctly with data', async () => {
    render(<SearchPerformanceChart data={mockSearchData} isLoading={false} />);
    
    // Check that chart elements are rendered
    await waitFor(() => {
      expect(screen.getByText(/Performance Trends/i)).toBeInTheDocument();
      expect(screen.getByText(/Clicks/i)).toBeInTheDocument();
      expect(screen.getByText(/Impressions/i)).toBeInTheDocument();
    });
  });
  
  test('SearchPerformanceChart shows loading state', () => {
    render(<SearchPerformanceChart data={null} isLoading={true} />);
    expect(screen.getByText(/Loading data/i)).toBeInTheDocument();
  });
  
  test('SearchPerformanceChart handles empty data gracefully', () => {
    render(<SearchPerformanceChart data={null} isLoading={false} />);
    expect(screen.getByText(/No data available/i)).toBeInTheDocument();
  });
  
  test('KeywordOpportunitiesTable renders opportunities correctly', () => {
    render(<KeywordOpportunitiesTable opportunities={mockKeywordOpportunities} isLoading={false} />);
    
    expect(screen.getByText(/Keyword Opportunities/i)).toBeInTheDocument();
    expect(screen.getByText(/content marketing strategy/i)).toBeInTheDocument();
    expect(screen.getByText(/marketing automation tools/i)).toBeInTheDocument();
    expect(screen.getByText(/11.2/)).toBeInTheDocument(); // Position for first keyword
    expect(screen.getByText(/position_improvement/i)).toBeInTheDocument();
    expect(screen.getByText(/click_through_rate/i)).toBeInTheDocument();
  });
  
  test('KeywordOpportunitiesTable shows loading state', () => {
    render(<KeywordOpportunitiesTable opportunities={[]} isLoading={true} />);
    expect(screen.getByText(/Loading opportunities/i)).toBeInTheDocument();
  });
  
  test('KeywordOpportunitiesTable handles empty data gracefully', () => {
    render(<KeywordOpportunitiesTable opportunities={[]} isLoading={false} />);
    expect(screen.getByText(/No keyword opportunities found/i)).toBeInTheDocument();
  });
  
  test('SEODashboard integrates charts and tables', async () => {
    render(<SEODashboard brandId={123} contentId={456} />);
    
    // Check loading state first
    expect(screen.getByText(/Loading SEO data/i)).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/SEO Performance/i)).toBeInTheDocument();
      expect(screen.getByText(/Performance Trends/i)).toBeInTheDocument();
      expect(screen.getByText(/Keyword Opportunities/i)).toBeInTheDocument();
    });
  });
  
  test('SEODashboard shows authorization prompt when not authorized', async () => {
    // Override the mock to return not authorized
    require('../../../services/seoService').checkAuthorizationStatus.mockResolvedValueOnce({
      status: 'success',
      is_authorized: false
    });
    
    render(<SEODashboard brandId={123} contentId={456} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Connect to Google Search Console/i)).toBeInTheDocument();
      expect(screen.getByText(/To see search performance data, you need to authorize/i)).toBeInTheDocument();
    });
  });
});