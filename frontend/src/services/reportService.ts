import api from './api';
import { AxiosRequestConfig } from 'axios';

// Types for the reports data
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  metrics: string[];
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
  thumbnail?: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  type: string;
  metrics: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  createdAt: string;
  nextDelivery: string;
  lastDelivery?: string;
  status: 'active' | 'paused' | 'failed';
}

export interface SavedReport {
  id: string;
  name: string;
  description: string;
  type: string;
  metrics: string[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  createdAt: string;
  createdBy: string;
  campaigns?: string[];
  formats: string[];
  thumbnail?: string;
}

export interface ReportMetric {
  id: string;
  name: string;
  category: string;
  description: string;
  dataPoints?: number;
}

// Mock data
export const getReportTemplatesMock = (): ReportTemplate[] => [
  {
    id: '1',
    name: 'Campaign Performance Overview',
    description: 'Standard report showing key campaign metrics including conversions, spend, and ROI',
    type: 'campaign',
    metrics: ['impressions', 'clicks', 'conversions', 'spend', 'roi'],
    createdAt: '2025-01-15T09:30:00Z',
    lastUsed: '2025-03-20T14:45:00Z',
    usageCount: 24,
    thumbnail: 'https://via.placeholder.com/160x90?text=Performance',
  },
  {
    id: '2',
    name: 'Audience Insights',
    description: 'Detailed breakdown of audience demographics, interests, and engagement patterns',
    type: 'audience',
    metrics: ['age_groups', 'gender', 'interests', 'devices', 'engagement_rate'],
    createdAt: '2025-01-20T11:15:00Z',
    lastUsed: '2025-03-18T09:20:00Z',
    usageCount: 18,
    thumbnail: 'https://via.placeholder.com/160x90?text=Audience',
  },
  {
    id: '3',
    name: 'ROI Analysis',
    description: 'Comprehensive analysis of return on investment across all campaigns and channels',
    type: 'financial',
    metrics: ['spend', 'revenue', 'roi', 'cpc', 'cpa', 'ltv'],
    createdAt: '2025-02-05T15:40:00Z',
    lastUsed: '2025-03-21T10:30:00Z',
    usageCount: 12,
    thumbnail: 'https://via.placeholder.com/160x90?text=ROI',
  },
  {
    id: '4',
    name: 'Content Performance',
    description: 'Analysis of content engagement metrics across all distribution channels',
    type: 'content',
    metrics: ['views', 'shares', 'comments', 'avg_time', 'bounce_rate'],
    createdAt: '2025-02-10T13:20:00Z',
    lastUsed: '2025-03-15T16:45:00Z',
    usageCount: 9,
    thumbnail: 'https://via.placeholder.com/160x90?text=Content',
  },
  {
    id: '5',
    name: 'Channel Comparison',
    description: 'Side-by-side comparison of performance across different marketing channels',
    type: 'channel',
    metrics: ['impressions', 'clicks', 'conversions', 'cpc', 'ctr', 'roi'],
    createdAt: '2025-02-18T10:00:00Z',
    lastUsed: '2025-03-19T11:15:00Z',
    usageCount: 15,
    thumbnail: 'https://via.placeholder.com/160x90?text=Channels',
  },
];

export const getScheduledReportsMock = (): ScheduledReport[] => [
  {
    id: '1',
    name: 'Weekly Performance Summary',
    description: 'Summarizes key performance metrics across all active campaigns',
    type: 'campaign',
    metrics: ['impressions', 'clicks', 'conversions', 'spend', 'roi'],
    frequency: 'weekly',
    recipients: ['marketing@example.com', 'john.smith@example.com'],
    createdAt: '2025-01-10T14:30:00Z',
    nextDelivery: '2025-03-25T08:00:00Z',
    lastDelivery: '2025-03-18T08:00:00Z',
    status: 'active',
  },
  {
    id: '2',
    name: 'Monthly ROI Analysis',
    description: 'Detailed ROI breakdown for all campaigns with comparison to previous month',
    type: 'financial',
    metrics: ['spend', 'revenue', 'roi', 'cpc', 'cpa'],
    frequency: 'monthly',
    recipients: ['finance@example.com', 'ceo@example.com', 'marketing@example.com'],
    createdAt: '2025-01-15T09:45:00Z',
    nextDelivery: '2025-04-01T08:00:00Z',
    lastDelivery: '2025-03-01T08:00:00Z',
    status: 'active',
  },
  {
    id: '3',
    name: 'Daily Campaign Alerts',
    description: 'Daily performance updates highlighting significant changes or anomalies',
    type: 'campaign',
    metrics: ['impressions', 'clicks', 'conversions', 'ctr', 'cpc'],
    frequency: 'daily',
    recipients: ['campaign-team@example.com'],
    createdAt: '2025-02-20T11:20:00Z',
    nextDelivery: '2025-03-25T08:00:00Z',
    lastDelivery: '2025-03-24T08:00:00Z',
    status: 'active',
  },
  {
    id: '4',
    name: 'Quarterly Business Review',
    description: 'Comprehensive analysis of marketing performance for quarterly business reviews',
    type: 'business',
    metrics: ['impressions', 'conversions', 'spend', 'revenue', 'roi', 'market_share'],
    frequency: 'quarterly',
    recipients: ['executive-team@example.com', 'board@example.com'],
    createdAt: '2025-01-05T15:10:00Z',
    nextDelivery: '2025-04-01T08:00:00Z',
    lastDelivery: '2025-01-01T08:00:00Z',
    status: 'active',
  },
  {
    id: '5',
    name: 'Social Media Engagement',
    description: 'Analysis of social media campaign performance across all platforms',
    type: 'social',
    metrics: ['impressions', 'clicks', 'shares', 'comments', 'followers_growth'],
    frequency: 'weekly',
    recipients: ['social-team@example.com', 'marketing@example.com'],
    createdAt: '2025-02-10T13:40:00Z',
    nextDelivery: '2025-03-25T08:00:00Z',
    lastDelivery: '2025-03-18T08:00:00Z',
    status: 'paused',
  },
];

export const getSavedReportsMock = (): SavedReport[] => [
  {
    id: '1',
    name: 'Q1 2025 Campaign Performance',
    description: 'Complete analysis of all campaign performance for Q1 2025',
    type: 'campaign',
    metrics: ['impressions', 'clicks', 'conversions', 'spend', 'roi', 'ctr', 'cpc'],
    dateRange: {
      startDate: '2025-01-01',
      endDate: '2025-03-31',
    },
    createdAt: '2025-04-02T10:15:00Z',
    createdBy: 'John Smith',
    campaigns: ['all'],
    formats: ['pdf', 'excel'],
    thumbnail: 'https://via.placeholder.com/160x90?text=Q1Report',
  },
  {
    id: '2',
    name: 'Facebook Campaign Analysis',
    description: 'Detailed performance metrics for all Facebook campaigns in March',
    type: 'channel',
    metrics: ['impressions', 'clicks', 'conversions', 'spend', 'ctr', 'cpc', 'frequency'],
    dateRange: {
      startDate: '2025-03-01',
      endDate: '2025-03-31',
    },
    createdAt: '2025-04-01T14:30:00Z',
    createdBy: 'Sarah Johnson',
    campaigns: ['fb_spring_promo', 'fb_product_launch', 'fb_retargeting'],
    formats: ['pdf'],
    thumbnail: 'https://via.placeholder.com/160x90?text=Facebook',
  },
  {
    id: '3',
    name: 'Product Launch Impact',
    description: 'Analysis of marketing performance during the new product launch',
    type: 'campaign',
    metrics: ['impressions', 'clicks', 'conversions', 'revenue', 'roi', 'market_reach'],
    dateRange: {
      startDate: '2025-02-15',
      endDate: '2025-03-15',
    },
    createdAt: '2025-03-20T11:45:00Z',
    createdBy: 'Mike Williams',
    campaigns: ['product_launch_email', 'product_launch_social', 'product_launch_display'],
    formats: ['pdf', 'csv', 'pptx'],
    thumbnail: 'https://via.placeholder.com/160x90?text=Launch',
  },
  {
    id: '4',
    name: 'Competitor Benchmark',
    description: 'Comparison of our campaign performance against key competitors',
    type: 'benchmark',
    metrics: ['market_share', 'share_of_voice', 'engagement_rate', 'sentiment', 'conversion_rate'],
    dateRange: {
      startDate: '2025-01-01',
      endDate: '2025-03-31',
    },
    createdAt: '2025-04-03T09:20:00Z',
    createdBy: 'Lisa Chen',
    formats: ['pdf', 'pptx'],
    thumbnail: 'https://via.placeholder.com/160x90?text=Benchmark',
  },
  {
    id: '5',
    name: 'ROI by Channel',
    description: 'Detailed breakdown of ROI across all marketing channels',
    type: 'financial',
    metrics: ['spend', 'revenue', 'roi', 'cpa', 'ltv', 'profit_margin'],
    dateRange: {
      startDate: '2025-03-01',
      endDate: '2025-03-31',
    },
    createdAt: '2025-04-05T15:10:00Z',
    createdBy: 'David Brown',
    formats: ['pdf', 'excel'],
    thumbnail: 'https://via.placeholder.com/160x90?text=ROI',
  },
];

export const getAvailableMetricsMock = (): ReportMetric[] => [
  { id: 'impressions', name: 'Impressions', category: 'reach', description: 'Number of times your ad was displayed' },
  { id: 'clicks', name: 'Clicks', category: 'engagement', description: 'Number of clicks on your ad' },
  { id: 'ctr', name: 'Click-Through Rate', category: 'engagement', description: 'Percentage of impressions that resulted in a click' },
  { id: 'conversions', name: 'Conversions', category: 'conversion', description: 'Number of completed desired actions' },
  { id: 'conversion_rate', name: 'Conversion Rate', category: 'conversion', description: 'Percentage of clicks that resulted in a conversion' },
  { id: 'spend', name: 'Ad Spend', category: 'financial', description: 'Total amount spent on the campaign' },
  { id: 'cpc', name: 'Cost per Click', category: 'financial', description: 'Average cost for each click' },
  { id: 'cpa', name: 'Cost per Acquisition', category: 'financial', description: 'Average cost for each conversion' },
  { id: 'revenue', name: 'Revenue', category: 'financial', description: 'Total revenue attributed to the campaign' },
  { id: 'roi', name: 'Return on Investment', category: 'financial', description: 'Ratio of revenue to cost expressed as a percentage' },
  { id: 'roas', name: 'Return on Ad Spend', category: 'financial', description: 'Ratio of revenue to ad spend' },
  { id: 'ltv', name: 'Customer Lifetime Value', category: 'financial', description: 'Predicted revenue from a customer over their lifetime' },
  { id: 'frequency', name: 'Frequency', category: 'reach', description: 'Average number of times a user saw your ad' },
  { id: 'reach', name: 'Reach', category: 'reach', description: 'Number of unique users who saw your ad' },
  { id: 'engagement_rate', name: 'Engagement Rate', category: 'engagement', description: 'Percentage of users who engaged with your content' },
  { id: 'bounce_rate', name: 'Bounce Rate', category: 'engagement', description: 'Percentage of visitors who navigate away after viewing only one page' },
  { id: 'avg_time', name: 'Average Time on Page', category: 'engagement', description: 'Average amount of time users spend on a page' },
  { id: 'market_share', name: 'Market Share', category: 'benchmark', description: 'Your brand\'s percentage of total market sales' },
  { id: 'share_of_voice', name: 'Share of Voice', category: 'benchmark', description: 'Your brand\'s visibility compared to competitors' },
  { id: 'sentiment', name: 'Sentiment Score', category: 'engagement', description: 'Measure of positive/negative sentiment in response to your content' },
];

// Mock API Service
const reportService = {
  // Get all report templates
  getReportTemplates: async (config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.get('/api/reports/templates', config);
    // return response.data;
    
    // For now, return mock data
    return new Promise<{ data: ReportTemplate[] }>(resolve => {
      setTimeout(() => {
        resolve({ data: getReportTemplatesMock() });
      }, 500);
    });
  },
  
  // Get a specific report template
  getReportTemplate: async (id: string, config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.get(`/api/reports/templates/${id}`, config);
    // return response.data;
    
    // For now, return mock data
    return new Promise<{ data: ReportTemplate }>(resolve => {
      setTimeout(() => {
        const templates = getReportTemplatesMock();
        const template = templates.find(t => t.id === id) || templates[0];
        resolve({ data: template });
      }, 500);
    });
  },
  
  // Create a new report template
  createReportTemplate: async (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'usageCount'>, config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.post('/api/reports/templates', template, config);
    // return response.data;
    
    // For now, return mock data
    return new Promise<{ data: ReportTemplate }>(resolve => {
      setTimeout(() => {
        const newTemplate: ReportTemplate = {
          ...template,
          id: Math.random().toString(36).substring(2, 15),
          createdAt: new Date().toISOString(),
          usageCount: 0,
        };
        resolve({ data: newTemplate });
      }, 500);
    });
  },
  
  // Get all scheduled reports
  getScheduledReports: async (config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.get('/api/reports/scheduled', config);
    // return response.data;
    
    // For now, return mock data
    return new Promise<{ data: ScheduledReport[] }>(resolve => {
      setTimeout(() => {
        resolve({ data: getScheduledReportsMock() });
      }, 500);
    });
  },
  
  // Create a new scheduled report
  createScheduledReport: async (report: Omit<ScheduledReport, 'id' | 'createdAt' | 'lastDelivery'>, config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.post('/api/reports/scheduled', report, config);
    // return response.data;
    
    // For now, return mock data
    return new Promise<{ data: ScheduledReport }>(resolve => {
      setTimeout(() => {
        const newReport: ScheduledReport = {
          ...report,
          id: Math.random().toString(36).substring(2, 15),
          createdAt: new Date().toISOString(),
          lastDelivery: undefined,
        };
        resolve({ data: newReport });
      }, 500);
    });
  },
  
  // Get all saved reports
  getSavedReports: async (config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.get('/api/reports/saved', config);
    // return response.data;
    
    // For now, return mock data
    return new Promise<{ data: SavedReport[] }>(resolve => {
      setTimeout(() => {
        resolve({ data: getSavedReportsMock() });
      }, 500);
    });
  },
  
  // Get all available metrics for reports
  getAvailableMetrics: async (config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.get('/api/reports/metrics', config);
    // return response.data;
    
    // For now, return mock data
    return new Promise<{ data: ReportMetric[] }>(resolve => {
      setTimeout(() => {
        resolve({ data: getAvailableMetricsMock() });
      }, 500);
    });
  },
  
  // Generate a report based on template
  generateReport: async (templateId: string, params: any, config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.post(`/api/reports/generate/${templateId}`, params, config);
    // return response.data;
    
    // For now, return mock success
    return new Promise<{ success: boolean, reportUrl?: string }>(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          reportUrl: `https://example.com/reports/download/${Math.random().toString(36).substring(2, 15)}`,
        });
      }, 1500);
    });
  },
  
  // Export a saved report
  exportReport: async (reportId: string, format: string, config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.get(`/api/reports/export/${reportId}?format=${format}`, config);
    // return response.data;
    
    // For now, return mock success
    return new Promise<{ success: boolean, downloadUrl?: string }>(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          downloadUrl: `https://example.com/reports/download/${reportId}?format=${format}`,
        });
      }, 1000);
    });
  },
};

export default reportService;