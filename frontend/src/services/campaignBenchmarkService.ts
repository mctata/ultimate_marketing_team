import api from './api';
import { AxiosRequestConfig } from 'axios';

// Types for the benchmark data
export interface ShareOfVoiceData {
  id: string;
  label: string;
  value: number;
  color?: string;
}

export interface CompetitorAdData {
  id: string;
  competitorName: string;
  adTitle: string;
  adContent: string;
  platform: string;
  dateDetected: string;
  imageUrl?: string;
  stats: {
    impressions?: number;
    engagement?: number;
    estimatedSpend?: number;
  };
}

export interface CompetitorPerformanceData {
  id: string;
  name: string;
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversion: number;
    cpa: number;
    spend: number;
    roas: number;
  };
}

export interface BenchmarkDataPoint {
  date: string;
  yourValue: number;
  competitorAverage: number;
  industryAverage: number;
}

export interface IndustryBenchmarkData {
  metric: string;
  timeframe: string;
  data: BenchmarkDataPoint[];
}

// Mock data generation functions
export const generateShareOfVoiceData = (): ShareOfVoiceData[] => {
  return [
    { id: '1', label: 'Your Brand', value: 35, color: '#4CAF50' },
    { id: '2', label: 'Competitor A', value: 25, color: '#2196F3' },
    { id: '3', label: 'Competitor B', value: 15, color: '#FFC107' },
    { id: '4', label: 'Competitor C', value: 10, color: '#9C27B0' },
    { id: '5', label: 'Competitor D', value: 8, color: '#E91E63' },
    { id: '6', label: 'Others', value: 7, color: '#607D8B' },
  ];
};

export const generateCompetitorAds = (): CompetitorAdData[] => {
  return [
    {
      id: '1',
      competitorName: 'Competitor A',
      adTitle: 'Summer Sale - 50% Off Everything',
      adContent: 'Limited time offer! Shop our summer collection with amazing discounts up to 50% off. Free shipping on orders over $50.',
      platform: 'Facebook',
      dateDetected: '2025-03-10T14:30:00Z',
      imageUrl: 'https://via.placeholder.com/300x200?text=Summer+Sale',
      stats: {
        impressions: 45000,
        engagement: 3200,
        estimatedSpend: 2500,
      },
    },
    {
      id: '2',
      competitorName: 'Competitor B',
      adTitle: 'New Product Launch',
      adContent: 'Introducing our revolutionary new product. Sign up for early access and get 20% off your first purchase.',
      platform: 'Instagram',
      dateDetected: '2025-03-15T09:15:00Z',
      imageUrl: 'https://via.placeholder.com/300x200?text=New+Product',
      stats: {
        impressions: 62000,
        engagement: 5100,
        estimatedSpend: 3800,
      },
    },
    {
      id: '3',
      competitorName: 'Competitor C',
      adTitle: 'Join Our Premium Membership',
      adContent: 'Get exclusive benefits with our premium membership. First month free, cancel anytime.',
      platform: 'LinkedIn',
      dateDetected: '2025-03-18T11:45:00Z',
      stats: {
        impressions: 28000,
        engagement: 1900,
        estimatedSpend: 1700,
      },
    },
    {
      id: '4',
      competitorName: 'Competitor A',
      adTitle: 'Download Our Free Guide',
      adContent: 'Learn the secrets of success in our industry with our comprehensive guide. Download for free today!',
      platform: 'Google Ads',
      dateDetected: '2025-03-20T16:20:00Z',
      stats: {
        impressions: 53000,
        engagement: 4200,
        estimatedSpend: 2900,
      },
    },
    {
      id: '5',
      competitorName: 'Competitor D',
      adTitle: 'Customer Success Story',
      adContent: 'See how our platform helped increase conversion rates by 200% for leading brands.',
      platform: 'Twitter',
      dateDetected: '2025-03-22T13:10:00Z',
      imageUrl: 'https://via.placeholder.com/300x200?text=Success+Story',
      stats: {
        impressions: 32000,
        engagement: 2700,
        estimatedSpend: 1900,
      },
    },
  ];
};

export const generateCompetitorPerformanceData = (): CompetitorPerformanceData[] => {
  return [
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
    },
    {
      id: '4',
      name: 'Competitor C',
      metrics: {
        impressions: 320000,
        clicks: 25000,
        ctr: 7.81,
        conversion: 3.4,
        cpa: 30.2,
        spend: 25000,
        roas: 4.1,
      },
    },
    {
      id: '5',
      name: 'Competitor D',
      metrics: {
        impressions: 410000,
        clicks: 33000,
        ctr: 8.05,
        conversion: 2.9,
        cpa: 33.7,
        spend: 32000,
        roas: 3.6,
      },
    },
  ];
};

export const generateIndustryBenchmarkData = (metric: string, timeframe: string): IndustryBenchmarkData => {
  // Generate dates based on timeframe
  const dates: string[] = [];
  const now = new Date();
  let interval = 1;
  let format: 'day' | 'week' | 'month' = 'day';
  
  switch (timeframe) {
    case 'last7days':
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
      break;
    case 'last30days':
      interval = 3;
      for (let i = 0; i < 10; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - (30 - i * interval));
        dates.push(date.toISOString().split('T')[0]);
      }
      break;
    case 'last90days':
      format = 'week';
      for (let i = 0; i < 13; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - (90 - i * 7));
        dates.push(`Week ${i + 1}`);
      }
      break;
    case 'last12months':
      format = 'month';
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(now.getMonth() - i);
        dates.push(date.toLocaleString('default', { month: 'short', year: '2-digit' }));
      }
      break;
    default:
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
  }
  
  // Generate values based on metric
  let baseValue = 0;
  let variance = 0;
  
  switch (metric) {
    case 'ctr':
      baseValue = 8.5;
      variance = 1.5;
      break;
    case 'conversion':
      baseValue = 3.0;
      variance = 0.8;
      break;
    case 'cpa':
      baseValue = 30;
      variance = 8;
      break;
    case 'roas':
      baseValue = 4.2;
      variance = 1.2;
      break;
    case 'impressions':
      baseValue = 400000;
      variance = 100000;
      break;
    default:
      baseValue = 10;
      variance = 2;
  }
  
  // Generate data points
  const data: BenchmarkDataPoint[] = dates.map(date => {
    const yourValue = baseValue + (Math.random() * variance * 2 - variance);
    const competitorAverage = baseValue - (Math.random() * variance * 0.5);
    const industryAverage = baseValue - (Math.random() * variance);
    
    return {
      date,
      yourValue: Number(yourValue.toFixed(2)),
      competitorAverage: Number(competitorAverage.toFixed(2)),
      industryAverage: Number(industryAverage.toFixed(2)),
    };
  });
  
  return {
    metric,
    timeframe,
    data,
  };
};

// Mock API endpoints
const campaignBenchmarkService = {
  // Get share of voice data for a specific campaign
  getShareOfVoice: async (campaignId: string, config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.get(`/api/campaigns/${campaignId}/benchmark/share-of-voice`, config);
    // return response.data;
    
    // For now, return mock data
    return new Promise<{ data: ShareOfVoiceData[] }>(resolve => {
      setTimeout(() => {
        resolve({ data: generateShareOfVoiceData() });
      }, 500);
    });
  },
  
  // Get competitor ads for a specific campaign
  getCompetitorAds: async (campaignId: string, config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.get(`/api/campaigns/${campaignId}/benchmark/competitor-ads`, config);
    // return response.data;
    
    // For now, return mock data
    return new Promise<{ data: CompetitorAdData[] }>(resolve => {
      setTimeout(() => {
        resolve({ data: generateCompetitorAds() });
      }, 500);
    });
  },
  
  // Get competitor performance metrics
  getCompetitorPerformance: async (campaignId: string, config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.get(`/api/campaigns/${campaignId}/benchmark/competitor-performance`, config);
    // return response.data;
    
    // For now, return mock data
    return new Promise<{ data: CompetitorPerformanceData[] }>(resolve => {
      setTimeout(() => {
        resolve({ data: generateCompetitorPerformanceData() });
      }, 500);
    });
  },
  
  // Get industry benchmark data for a specific metric and timeframe
  getIndustryBenchmark: async (campaignId: string, metric: string, timeframe: string, config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.get(`/api/campaigns/${campaignId}/benchmark/industry-metrics?metric=${metric}&timeframe=${timeframe}`, config);
    // return response.data;
    
    // For now, return mock data
    return new Promise<{ data: IndustryBenchmarkData }>(resolve => {
      setTimeout(() => {
        resolve({ data: generateIndustryBenchmarkData(metric, timeframe) });
      }, 500);
    });
  },
};

export default campaignBenchmarkService;