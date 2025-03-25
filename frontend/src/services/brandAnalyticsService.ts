import { apiMethods } from './api';

export interface BrandAnalyticsOverview {
  brandId: string;
  contentMetrics: {
    totalContentItems: number;
    publishedItems: number;
    averageScore: number;
    topPerformingType: string;
    engagementRate: number;
    conversionRate: number;
    totalViews: number;
  };
  campaignMetrics: {
    activeCampaigns: number;
    totalSpend: number;
    totalRevenue: number;
    averageROI: number;
    bestPerformingPlatform: string;
    conversionRate: number;
    clickThroughRate: number;
  };
  socialMetrics: {
    totalFollowers: number;
    followersGrowth: number;
    engagementRate: number;
    topPerformingPlatform: string;
    averageReach: number;
    averageImpressions: number;
  };
  websiteMetrics: {
    visitors: number;
    pageViews: number;
    averageSessionDuration: number;
    bounceRate: number;
    topReferrer: string;
    organicTraffic: number;
    paidTraffic: number;
  };
}

// Mock data by brand
const mockAnalyticsByBrand: Record<string, BrandAnalyticsOverview> = {
  // TechPro Solutions
  '1': {
    brandId: '1',
    contentMetrics: {
      totalContentItems: 24,
      publishedItems: 18,
      averageScore: 87,
      topPerformingType: 'blog',
      engagementRate: 5.2,
      conversionRate: 2.7,
      totalViews: 47500
    },
    campaignMetrics: {
      activeCampaigns: 3,
      totalSpend: 15000,
      totalRevenue: 42000,
      averageROI: 2.8,
      bestPerformingPlatform: 'linkedin',
      conversionRate: 3.2,
      clickThroughRate: 4.5
    },
    socialMetrics: {
      totalFollowers: 24500,
      followersGrowth: 8.3,
      engagementRate: 3.7,
      topPerformingPlatform: 'linkedin',
      averageReach: 12000,
      averageImpressions: 18500
    },
    websiteMetrics: {
      visitors: 35000,
      pageViews: 105000,
      averageSessionDuration: 2.5,
      bounceRate: 42,
      topReferrer: 'google',
      organicTraffic: 22000,
      paidTraffic: 13000
    }
  },
  
  // GreenLife Organics
  '2': {
    brandId: '2',
    contentMetrics: {
      totalContentItems: 32,
      publishedItems: 25,
      averageScore: 92,
      topPerformingType: 'social',
      engagementRate: 7.8,
      conversionRate: 3.4,
      totalViews: 67800
    },
    campaignMetrics: {
      activeCampaigns: 2,
      totalSpend: 8500,
      totalRevenue: 27200,
      averageROI: 3.2,
      bestPerformingPlatform: 'instagram',
      conversionRate: 4.1,
      clickThroughRate: 5.7
    },
    socialMetrics: {
      totalFollowers: 42000,
      followersGrowth: 12.5,
      engagementRate: 6.2,
      topPerformingPlatform: 'instagram',
      averageReach: 28000,
      averageImpressions: 42500
    },
    websiteMetrics: {
      visitors: 28500,
      pageViews: 84300,
      averageSessionDuration: 3.2,
      bounceRate: 38,
      topReferrer: 'instagram',
      organicTraffic: 17800,
      paidTraffic: 10700
    }
  },
  
  // Urban Fitness
  '3': {
    brandId: '3',
    contentMetrics: {
      totalContentItems: 29,
      publishedItems: 22,
      averageScore: 94,
      topPerformingType: 'video',
      engagementRate: 8.4,
      conversionRate: 4.2,
      totalViews: 82400
    },
    campaignMetrics: {
      activeCampaigns: 4,
      totalSpend: 18700,
      totalRevenue: 65450,
      averageROI: 3.5,
      bestPerformingPlatform: 'facebook',
      conversionRate: 5.3,
      clickThroughRate: 6.8
    },
    socialMetrics: {
      totalFollowers: 56000,
      followersGrowth: 15.2,
      engagementRate: 7.5,
      topPerformingPlatform: 'facebook',
      averageReach: 35000,
      averageImpressions: 52000
    },
    websiteMetrics: {
      visitors: 42000,
      pageViews: 136500,
      averageSessionDuration: 4.1,
      bounceRate: 32,
      topReferrer: 'facebook',
      organicTraffic: 24800,
      paidTraffic: 17200
    }
  },
  
  // DreamHome Interiors
  '4': {
    brandId: '4',
    contentMetrics: {
      totalContentItems: 18,
      publishedItems: 14,
      averageScore: 89,
      topPerformingType: 'image',
      engagementRate: 6.7,
      conversionRate: 2.9,
      totalViews: 36200
    },
    campaignMetrics: {
      activeCampaigns: 2,
      totalSpend: 10200,
      totalRevenue: 28560,
      averageROI: 2.8,
      bestPerformingPlatform: 'pinterest',
      conversionRate: 3.8,
      clickThroughRate: 5.2
    },
    socialMetrics: {
      totalFollowers: 32500,
      followersGrowth: 10.8,
      engagementRate: 5.4,
      topPerformingPlatform: 'pinterest',
      averageReach: 23500,
      averageImpressions: 34600
    },
    websiteMetrics: {
      visitors: 22800,
      pageViews: 76500,
      averageSessionDuration: 3.8,
      bounceRate: 35,
      topReferrer: 'pinterest',
      organicTraffic: 14600,
      paidTraffic: 8200
    }
  }
};

export interface DailyMetric {
  date: string;
  value: number;
}

export interface TimeSeriesMetrics {
  views: DailyMetric[];
  engagement: DailyMetric[];
  conversions: DailyMetric[];
  followers: DailyMetric[];
}

// Generate mock time series data
const generateTimeSeriesData = (baseline: number, variance: number, days: number): DailyMetric[] => {
  const today = new Date();
  const result: DailyMetric[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - i - 1));
    
    // Random value with slight upward trend
    const trendFactor = 1 + (i / (days * 2)); // Small upward trend
    const randomFactor = 0.8 + (Math.random() * 0.4); // Random variance between 0.8 and 1.2
    const value = Math.round(baseline * trendFactor * randomFactor * variance);
    
    result.push({
      date: date.toISOString().split('T')[0],
      value
    });
  }
  
  return result;
};

// Mock time series data by brand
const mockTimeSeriesData: Record<string, TimeSeriesMetrics> = {
  '1': {
    views: generateTimeSeriesData(1500, 1, 30),
    engagement: generateTimeSeriesData(75, 1, 30),
    conversions: generateTimeSeriesData(40, 1, 30),
    followers: generateTimeSeriesData(800, 1, 30)
  },
  '2': {
    views: generateTimeSeriesData(2200, 1, 30),
    engagement: generateTimeSeriesData(170, 1, 30),
    conversions: generateTimeSeriesData(75, 1, 30),
    followers: generateTimeSeriesData(1400, 1, 30)
  },
  '3': {
    views: generateTimeSeriesData(2700, 1, 30),
    engagement: generateTimeSeriesData(230, 1, 30),
    conversions: generateTimeSeriesData(125, 1, 30),
    followers: generateTimeSeriesData(1850, 1, 30)
  },
  '4': {
    views: generateTimeSeriesData(1200, 1, 30),
    engagement: generateTimeSeriesData(80, 1, 30),
    conversions: generateTimeSeriesData(45, 1, 30),
    followers: generateTimeSeriesData(1050, 1, 30)
  }
};

class BrandAnalyticsService {
  /**
   * Get analytics overview for a specific brand
   */
  async getAnalyticsOverview(brandId: string): Promise<BrandAnalyticsOverview> {
    try {
      // First try API
      return await apiMethods.get<BrandAnalyticsOverview>(`/analytics/brands/${brandId}/overview`);
    } catch (error) {
      console.log(`Using mock analytics data for brand ID: ${brandId}`);
      
      // Fall back to mock data for development
      if (mockAnalyticsByBrand[brandId]) {
        return Promise.resolve({...mockAnalyticsByBrand[brandId]});
      }
      
      // If brand not found, return default data
      return Promise.resolve({...mockAnalyticsByBrand['1']});
    }
  }
  
  /**
   * Get time series data for a specific brand
   */
  async getTimeSeriesData(brandId: string, metric: string, timeRange: { start: string, end: string }): Promise<DailyMetric[]> {
    try {
      // First try API
      return await apiMethods.get<DailyMetric[]>(`/analytics/brands/${brandId}/timeseries/${metric}`, { params: timeRange });
    } catch (error) {
      console.log(`Using mock time series data for brand ID: ${brandId}, metric: ${metric}`);
      
      // Fall back to mock data for development
      const brandData = mockTimeSeriesData[brandId] || mockTimeSeriesData['1'];
      
      switch (metric) {
        case 'views':
          return Promise.resolve([...brandData.views]);
        case 'engagement':
          return Promise.resolve([...brandData.engagement]);
        case 'conversions':
          return Promise.resolve([...brandData.conversions]);
        case 'followers':
          return Promise.resolve([...brandData.followers]);
        default:
          return Promise.resolve([...brandData.views]);
      }
    }
  }
}

export default new BrandAnalyticsService();