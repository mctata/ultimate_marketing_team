import { useCallback } from 'react';
import axios from 'axios';

// Define the base API URL
const API_URL = '/api';

// Analytics query parameter types
interface DateRangeParams {
  startDate: string;
  endDate: string;
  userType?: string;
  features?: string;
  platform?: string;
}

// Mock data function for development
const getMockData = (type: string) => {
  // Mock feature usage data
  if (type === 'featureUsage') {
    const dailyUsage = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      aiAssistant: Math.floor(Math.random() * 1000) + 500,
      collaboration: Math.floor(Math.random() * 800) + 300,
      contentCreation: Math.floor(Math.random() * 1200) + 600,
      dashboard: Math.floor(Math.random() * 500) + 200
    }));

    const userTypeDistribution = [
      { name: 'Authenticated', value: 2341, percentage: 65.3 },
      { name: 'Anonymous', value: 892, percentage: 24.9 },
      { name: 'API', value: 351, percentage: 9.8 }
    ];

    const heatmapData = [];
    const heatmapXLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heatmapYLabels = ['0-4', '4-8', '8-12', '12-16', '16-20', '20-24'];
    
    for (let day = 0; day < heatmapXLabels.length; day++) {
      for (let hour = 0; hour < heatmapYLabels.length; hour++) {
        heatmapData.push({
          x: heatmapXLabels[day],
          y: heatmapYLabels[hour],
          value: Math.floor(Math.random() * 100) + 5
        });
      }
    }

    const adoptionRates = [
      { feature: 'AI Assistant', rate: 78 },
      { feature: 'Collaboration', rate: 64 },
      { feature: 'Content Creation', rate: 92 },
      { feature: 'Dashboard', rate: 81 }
    ];

    const keyMetrics = [
      { name: 'Total Users', value: '3,584', change: 12.5 },
      { name: 'Avg. Session Duration', value: '8:24', change: 5.2 },
      { name: 'Features Used Per Session', value: '3.2', change: 0.8 },
      { name: 'Collaboration Rate', value: '72%', change: 18.3 }
    ];

    return {
      dailyUsage,
      userTypeDistribution,
      heatmapData,
      heatmapXLabels,
      heatmapYLabels,
      adoptionRates,
      keyMetrics
    };
  }
  
  // Mock AI assistant data
  if (type === 'aiAssistant') {
    const dailyMetrics = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      acceptanceRate: Math.floor(Math.random() * 30) + 60,
      qualityScore: Math.floor(Math.random() * 20) + 70
    }));

    const suggestionTypes = [
      { name: 'Grammar', value: 3218, percentage: 42.3 },
      { name: 'Rephrase', value: 1672, percentage: 22.0 },
      { name: 'Expand', value: 1254, percentage: 16.5 },
      { name: 'Summarize', value: 947, percentage: 12.5 },
      { name: 'Other', value: 513, percentage: 6.7 }
    ];

    const responseTimes = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      averageResponseTime: Math.floor(Math.random() * 200) + 100
    }));

    const cachePerformance = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      hitRate: Math.floor(Math.random() * 30) + 40
    }));

    const insights = [
      {
        title: 'Highest Acceptance Rates',
        description: 'Grammar suggestions have the highest acceptance rate at 78%, while expansion suggestions are only accepted 42% of the time.',
        metrics: { label: 'Acceptance Rate Gap', value: '36%' }
      },
      {
        title: 'Cache Performance',
        description: 'The suggestion cache is currently providing a 62% hit rate, reducing average response time by 248ms.',
        metrics: { label: 'Time Saved', value: '248ms' }
      },
      {
        title: 'Quality Improvement',
        description: 'The perceived quality score has increased by 12 points over the past month, correlating with the new model deployment.',
        metrics: { label: 'Quality Increase', value: '+12 pts' }
      }
    ];

    return {
      dailyMetrics,
      suggestionTypes,
      responseTimes,
      cachePerformance,
      insights
    };
  }
  
  // Mock WebSocket metrics
  if (type === 'websocket') {
    const connectionCounts = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      activeConnections: Math.floor(Math.random() * 500) + 200
    }));

    const messageVolume = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sent: Math.floor(Math.random() * 10000) + 5000,
      received: Math.floor(Math.random() * 8000) + 3000
    }));

    const latency = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      averageLatency: Math.floor(Math.random() * 80) + 20
    }));

    const errorRate = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      errorRate: Math.random() * 2
    }));

    const summary = [
      { metric: 'Peak Connections', value: '754' },
      { metric: 'Avg. Latency', value: '48ms' },
      { metric: 'Messages/Day', value: '15.2K' },
      { metric: 'Error Rate', value: '0.8%' }
    ];

    return {
      connectionCounts,
      messageVolume,
      latency,
      errorRate,
      summary
    };
  }
  
  // Mock user journey data
  if (type === 'userJourneys') {
    const nodes = [
      { id: 'entry', type: 'entry', name: 'Login/Entry', count: 5000, conversionRate: 100 },
      { id: 'dashboard', type: 'page', name: 'Dashboard', count: 4850, conversionRate: 97, dropoffRate: 3 },
      { id: 'content', type: 'page', name: 'Content List', count: 3200, conversionRate: 66, dropoffRate: 34 },
      { id: 'create', type: 'action', name: 'Create Content', count: 2100, conversionRate: 65.6, dropoffRate: 34.4 },
      { id: 'editor', type: 'page', name: 'Content Editor', count: 2000, conversionRate: 95.2, dropoffRate: 4.8 },
      { id: 'aiAssist', type: 'action', name: 'Use AI Assistant', count: 1650, conversionRate: 82.5, dropoffRate: 17.5 },
      { id: 'collaborate', type: 'action', name: 'Invite Collaborator', count: 780, conversionRate: 39, dropoffRate: 61 },
      { id: 'review', type: 'decision', name: 'Review Content', count: 1850, conversionRate: 92.5, dropoffRate: 7.5 },
      { id: 'publish', type: 'action', name: 'Publish Content', count: 1720, conversionRate: 93, dropoffRate: 7 },
      { id: 'exit', type: 'exit', name: 'Exit', count: 5000, dropoffRate: 100 }
    ];

    const connections = [
      { source: 'entry', target: 'dashboard', value: 4850, percentage: 97 },
      { source: 'dashboard', target: 'content', value: 3200, percentage: 66 },
      { source: 'content', target: 'create', value: 2100, percentage: 65.6 },
      { source: 'create', target: 'editor', value: 2000, percentage: 95.2 },
      { source: 'editor', target: 'aiAssist', value: 1650, percentage: 82.5 },
      { source: 'aiAssist', target: 'collaborate', value: 780, percentage: 47.3 },
      { source: 'aiAssist', target: 'review', value: 870, percentage: 52.7 },
      { source: 'collaborate', target: 'review', value: 780, percentage: 100 },
      { source: 'review', target: 'publish', value: 1720, percentage: 93 },
      { source: 'review', target: 'editor', value: 130, percentage: 7 },
      { source: 'publish', target: 'exit', value: 1720, percentage: 100 },
      { source: 'dashboard', target: 'exit', value: 150, percentage: 3.1 },
      { source: 'content', target: 'exit', value: 1100, percentage: 34.4 },
      { source: 'editor', target: 'exit', value: 100, percentage: 5 },
      { source: 'aiAssist', target: 'exit', value: 0, percentage: 0 }
    ];

    const conversionRates = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contentCreation: Math.floor(Math.random() * 20) + 60,
      collaboration: Math.floor(Math.random() * 30) + 40,
      publishing: Math.floor(Math.random() * 15) + 75
    }));

    const journeyTimes = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contentCreation: Math.floor(Math.random() * 300) + 600,
      collaboration: Math.floor(Math.random() * 500) + 1200,
      publishing: Math.floor(Math.random() * 200) + 300
    }));

    return {
      nodes,
      connections,
      conversionRates,
      journeyTimes
    };
  }
  
  // Mock A/B test data
  if (type === 'abTest') {
    const variants = [
      { id: 'control', name: 'Control', description: 'Current UI' },
      { id: 'variantA', name: 'Variant A', description: 'Simplified UI' },
      { id: 'variantB', name: 'Variant B', description: 'Enhanced Collaboration' }
    ];

    const metrics = [
      { key: 'conversionRate', name: 'Conversion Rate', formatter: (v: number) => `${v.toFixed(1)}%`, higherIsBetter: true },
      { key: 'timeOnTask', name: 'Time on Task', formatter: (v: number) => `${v}s`, higherIsBetter: false },
      { key: 'engagementScore', name: 'Engagement Score', formatter: (v: number) => `${v.toFixed(1)}`, higherIsBetter: true },
      { key: 'errorRate', name: 'Error Rate', formatter: (v: number) => `${v.toFixed(1)}%`, higherIsBetter: false }
    ];

    const results = [
      { variant: 'control', conversionRate: 24.3, timeOnTask: 127, engagementScore: 6.2, errorRate: 3.8 },
      { variant: 'variantA', conversionRate: 29.7, timeOnTask: 103, engagementScore: 7.1, errorRate: 2.9 },
      { variant: 'variantB', conversionRate: 31.2, timeOnTask: 118, engagementScore: 8.4, errorRate: 3.2 }
    ];

    // Generate time series data for each metric
    const timeSeriesData: Record<string, any[]> = {};
    metrics.forEach(metric => {
      timeSeriesData[metric.key] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const dataPoint: any = { date };
        
        variants.forEach(variant => {
          // Base value from results
          const baseValue = results.find(r => r.variant === variant.id)?.[metric.key as keyof typeof results[0]] || 0;
          
          // Add some random variation day by day
          const randomFactor = 0.9 + Math.random() * 0.2; // Between 0.9 and 1.1
          dataPoint[variant.id] = baseValue * randomFactor;
        });
        
        return dataPoint;
      });
    });

    const insights = [
      { 
        title: 'Variant B Shows Highest Engagement',
        description: 'Variant B demonstrates a 35.5% increase in engagement score compared to control, suggesting that enhanced collaboration features significantly improve user engagement.',
        isPositive: true,
        confidence: 98
      },
      { 
        title: 'Variant A Reduces Time on Task',
        description: 'The simplified UI in Variant A reduces time on task by 18.9% compared to control, improving efficiency without sacrificing quality of output.',
        isPositive: true,
        confidence: 95
      },
      { 
        title: 'Error Rates Improved in Both Variants',
        description: 'Both test variants show lower error rates than control, with Variant A showing the largest improvement at 23.7% reduction.',
        isPositive: true,
        confidence: 91
      }
    ];

    return {
      variants,
      metrics,
      results,
      timeSeriesData,
      insights
    };
  }
  
  // Mock UX insights data
  if (type === 'uxInsights') {
    const now = new Date();
    
    return [
      {
        id: 'insight-1',
        title: 'AI Assistant Suggestions Boost Productivity',
        description: 'Users who actively utilize AI assistant suggestions complete content creation 43% faster than users who don\'t. The highest impact is seen with grammar and rephrasing suggestions.',
        category: 'performance',
        severity: 'high',
        trend: 'up',
        percent: 43,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        metrics: [
          { name: 'Time Saved', value: '18 min/article', change: 43, trend: 'up' },
          { name: 'Acceptance Rate', value: '76%', change: 12, trend: 'up' },
          { name: 'Quality Improvement', value: '8.2/10', change: 18, trend: 'up' }
        ],
        isNew: true
      },
      {
        id: 'insight-2',
        title: 'Collaborative Editing Drop-offs',
        description: 'There\'s a 24% drop-off rate when users attempt to initiate collaborative editing sessions. Session logs indicate confusion around permission settings may be the cause.',
        category: 'anomaly',
        severity: 'medium',
        trend: 'down',
        percent: 24,
        createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        metrics: [
          { name: 'Initiation Success Rate', value: '76%', change: -24, trend: 'down' },
          { name: 'Error Rate', value: '18%', change: 130, trend: 'up' },
          { name: 'Avg Session Duration', value: '14 min', change: -8, trend: 'down' }
        ]
      },
      {
        id: 'insight-3',
        title: 'Increasing Mobile Usage Trend',
        description: 'Mobile usage of the platform has increased by 37% over the past month, but mobile sessions are 28% shorter than desktop sessions. Consider optimizing mobile collaboration features.',
        category: 'trend',
        severity: 'medium',
        trend: 'up',
        percent: 37,
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        metrics: [
          { name: 'Mobile Traffic', value: '32%', change: 37, trend: 'up' },
          { name: 'Mobile Session Length', value: '8.4 min', change: -28, trend: 'down' },
          { name: 'Mobile Conversion', value: '18%', change: -12, trend: 'down' }
        ],
        isNew: true
      },
      {
        id: 'insight-4',
        title: 'Content Template Usage Opportunity',
        description: 'Only 23% of users utilize content templates, but those who do complete content 58% faster with 32% higher quality scores. Increasing template visibility could significantly improve productivity.',
        category: 'opportunity',
        severity: 'high',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        metrics: [
          { name: 'Template Usage', value: '23%', change: 5, trend: 'up' },
          { name: 'Time Saving', value: '58%', change: 0, trend: 'flat' },
          { name: 'Quality Increase', value: '32%', change: 0, trend: 'flat' }
        ]
      },
      {
        id: 'insight-5',
        title: 'Predicted Impact of New Feature Rollout',
        description: 'Based on user behavior analysis and A/B test results, the new collaborative commenting feature is predicted to increase user engagement by 27% and reduce revision cycles by 14% when fully rolled out.',
        category: 'prediction',
        severity: 'medium',
        trend: 'up',
        percent: 27,
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        metrics: [
          { name: 'Engagement Increase', value: '27%', change: 0, trend: 'flat' },
          { name: 'Revision Reduction', value: '14%', change: 0, trend: 'flat' },
          { name: 'User Satisfaction', value: '8.7/10', change: 12, trend: 'up' }
        ]
      }
    ];
  }
  
  return null;
};

/**
 * Custom hook for analytics data fetching and management
 */
const useAnalytics = () => {
  // Feature usage metrics
  const getFeatureUsageMetrics = useCallback(async (params: DateRangeParams) => {
    try {
      // In production, this would fetch from the API
      // const response = await axios.get(`${API_URL}/metrics/ux/feature-usage`, { params });
      // return response.data;
      
      // For development, return mock data
      return getMockData('featureUsage');
    } catch (error) {
      console.error('Error fetching feature usage metrics:', error);
      throw error;
    }
  }, []);
  
  // AI assistant metrics
  const getAIAssistantMetrics = useCallback(async (params: DateRangeParams) => {
    try {
      // In production, this would fetch from the API
      // const response = await axios.get(`${API_URL}/metrics/ux/ai-assistant`, { params });
      // return response.data;
      
      // For development, return mock data
      return getMockData('aiAssistant');
    } catch (error) {
      console.error('Error fetching AI assistant metrics:', error);
      throw error;
    }
  }, []);
  
  // WebSocket metrics
  const getWebSocketMetrics = useCallback(async (params: DateRangeParams) => {
    try {
      // In production, this would fetch from the API
      // const response = await axios.get(`${API_URL}/metrics/ux/websocket-metrics`, { params });
      // return response.data;
      
      // For development, return mock data
      return getMockData('websocket');
    } catch (error) {
      console.error('Error fetching WebSocket metrics:', error);
      throw error;
    }
  }, []);
  
  // User journeys
  const getUserJourneys = useCallback(async (params: DateRangeParams) => {
    try {
      // In production, this would fetch from the API
      // const response = await axios.get(`${API_URL}/metrics/ux/journeys`, { params });
      // return response.data;
      
      // For development, return mock data
      return getMockData('userJourneys');
    } catch (error) {
      console.error('Error fetching user journeys:', error);
      throw error;
    }
  }, []);
  
  // A/B test results
  const getABTestResults = useCallback(async (params: DateRangeParams) => {
    try {
      // In production, this would fetch from the API
      // const response = await axios.get(`${API_URL}/metrics/ux/ab-test`, { params });
      // return response.data;
      
      // For development, return mock data
      return getMockData('abTest');
    } catch (error) {
      console.error('Error fetching A/B test results:', error);
      throw error;
    }
  }, []);
  
  // UX insights
  const getUXInsights = useCallback(async (params: DateRangeParams) => {
    try {
      // In production, this would fetch from the API
      // const response = await axios.get(`${API_URL}/metrics/ux/insights`, { params });
      // return response.data;
      
      // For development, return mock data
      return getMockData('uxInsights');
    } catch (error) {
      console.error('Error fetching UX insights:', error);
      throw error;
    }
  }, []);
  
  // Dashboard data (aggregated metrics for dashboard)
  const getDashboardData = useCallback(async (params: DateRangeParams) => {
    try {
      // In production, this would fetch from the API
      // const response = await axios.get(`${API_URL}/metrics/dashboard/ux`, { params });
      // return response.data;
      
      // For development, return mock data with combined data
      return {
        featureUsage: getMockData('featureUsage'),
        aiAssistant: getMockData('aiAssistant'),
        websocket: getMockData('websocket'),
        userJourneys: getMockData('userJourneys'),
        abTest: getMockData('abTest'),
        insights: getMockData('uxInsights')
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }, []);

  return {
    getFeatureUsageMetrics,
    getAIAssistantMetrics,
    getWebSocketMetrics,
    getUserJourneys,
    getABTestResults,
    getUXInsights,
    getDashboardData
  };
};

// Export as both default and named export for compatibility
export default useAnalytics;
export { useAnalytics };