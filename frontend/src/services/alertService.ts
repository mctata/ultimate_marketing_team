import { api } from './api';
import { AxiosRequestConfig } from 'axios';

// Types for the alerts data
export interface PerformanceAlert {
  id: string;
  campaignId: string;
  campaignName: string;
  type: 'threshold' | 'anomaly' | 'budget' | 'trend';
  metric: string;
  value: number;
  threshold?: number;
  status: 'active' | 'resolved' | 'dismissed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface AlertPreference {
  id: string;
  metric: string;
  threshold: number;
  direction: 'above' | 'below';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notificationChannels: string[];
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'sms' | 'push' | 'webhook';
  details: {
    recipients?: string[];
    webhookUrl?: string;
    slackChannel?: string;
    phone?: string;
  };
  enabled: boolean;
}

// Mock data generators
export const generateMockAlerts = (campaignId: string): PerformanceAlert[] => [
  {
    id: '1',
    campaignId,
    campaignName: 'Spring Sale 2025',
    type: 'threshold',
    metric: 'ctr',
    value: 1.8,
    threshold: 2.5,
    status: 'active',
    severity: 'high',
    message: 'CTR has dropped below the minimum threshold of 2.5%. Current value: 1.8%',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: '2',
    campaignId,
    campaignName: 'Spring Sale 2025',
    type: 'anomaly',
    metric: 'conversion_rate',
    value: 0.8,
    status: 'active',
    severity: 'critical',
    message: 'Unusual drop in conversion rate detected. Current value: 0.8% (60% below average)',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
  },
  {
    id: '3',
    campaignId,
    campaignName: 'Spring Sale 2025',
    type: 'budget',
    metric: 'spend',
    value: 4850,
    threshold: 5000,
    status: 'active',
    severity: 'medium',
    message: 'Budget usage at 97%. Campaign budget of $5,000 will be exhausted within 24 hours.',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
  },
  {
    id: '4',
    campaignId,
    campaignName: 'Spring Sale 2025',
    type: 'threshold',
    metric: 'cpa',
    value: 42.5,
    threshold: 35,
    status: 'resolved',
    severity: 'medium',
    message: 'CPA has exceeded the maximum threshold of $35. Current value: $42.50',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    resolvedBy: 'John Smith',
    resolutionNotes: 'Adjusted bid strategy and paused underperforming ad sets',
  },
  {
    id: '5',
    campaignId,
    campaignName: 'Spring Sale 2025',
    type: 'trend',
    metric: 'engagement_rate',
    value: 3.2,
    status: 'dismissed',
    severity: 'low',
    message: 'Engagement rate is showing a downward trend over the last 7 days. Current value: 3.2%',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    id: '6',
    campaignId,
    campaignName: 'Spring Sale 2025',
    type: 'anomaly',
    metric: 'clicks',
    value: 380,
    status: 'resolved',
    severity: 'high',
    message: 'Unusual spike in clicks detected. Current value: 380 (250% above average)',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    resolvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 4 days ago + 3 hours
    resolvedBy: 'Sarah Johnson',
    resolutionNotes: 'Investigated and identified it as a result of the email campaign launch. Not a concern.',
  },
];

export const getInitialAlertPreferences = (): AlertPreference[] => [
  {
    id: '1',
    metric: 'ctr',
    threshold: 2.5,
    direction: 'below',
    severity: 'high',
    enabled: true,
    notificationChannels: ['email', 'slack'],
  },
  {
    id: '2',
    metric: 'conversion_rate',
    threshold: 1.0,
    direction: 'below',
    severity: 'critical',
    enabled: true,
    notificationChannels: ['email', 'slack', 'sms'],
  },
  {
    id: '3',
    metric: 'cpa',
    threshold: 35,
    direction: 'above',
    severity: 'medium',
    enabled: true,
    notificationChannels: ['email', 'slack'],
  },
  {
    id: '4',
    metric: 'roas',
    threshold: 2.0,
    direction: 'below',
    severity: 'high',
    enabled: true,
    notificationChannels: ['email', 'slack'],
  },
  {
    id: '5',
    metric: 'budget_utilization',
    threshold: 90,
    direction: 'above',
    severity: 'medium',
    enabled: true,
    notificationChannels: ['email'],
  },
];

export const getNotificationChannels = (): NotificationChannel[] => [
  {
    id: '1',
    name: 'Team Email',
    type: 'email',
    details: {
      recipients: ['marketing@example.com', 'campaigns@example.com'],
    },
    enabled: true,
  },
  {
    id: '2',
    name: 'Marketing Slack',
    type: 'slack',
    details: {
      slackChannel: '#marketing-alerts',
    },
    enabled: true,
  },
  {
    id: '3',
    name: 'Campaign Manager SMS',
    type: 'sms',
    details: {
      phone: '+1234567890',
    },
    enabled: true,
  },
  {
    id: '4',
    name: 'Analytics API',
    type: 'webhook',
    details: {
      webhookUrl: 'https://analytics.example.com/api/alerts',
    },
    enabled: false,
  },
];

// Mock API Service
const alertService = {
  // Get all alerts for a campaign
  getCampaignAlerts: async (campaignId: string, config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.get(`/api/campaigns/${campaignId}/alerts`, config);
    // return response.data;
    
    // For now, return mock data
    return new Promise<{ data: PerformanceAlert[] }>(resolve => {
      setTimeout(() => {
        resolve({ data: generateMockAlerts(campaignId) });
      }, 500);
    });
  },
  
  // Get alert preferences for a specific campaign
  getAlertPreferences: async (campaignId: string, config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.get(`/api/campaigns/${campaignId}/alert-preferences`, config);
    // return response.data;
    
    // For now, return mock data
    return new Promise<{ data: AlertPreference[] }>(resolve => {
      setTimeout(() => {
        resolve({ data: getInitialAlertPreferences() });
      }, 500);
    });
  },
  
  // Update alert preferences for a campaign
  updateAlertPreferences: async (campaignId: string, preferences: AlertPreference[], config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.put(`/api/campaigns/${campaignId}/alert-preferences`, { preferences }, config);
    // return response.data;
    
    // For now, return mock success
    return new Promise<{ success: boolean }>(resolve => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  },
  
  // Get all notification channels
  getNotificationChannels: async (config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.get('/api/notification-channels', config);
    // return response.data;
    
    // For now, return mock data
    return new Promise<{ data: NotificationChannel[] }>(resolve => {
      setTimeout(() => {
        resolve({ data: getNotificationChannels() });
      }, 500);
    });
  },
  
  // Create a new notification channel
  createNotificationChannel: async (channel: Omit<NotificationChannel, 'id'>, config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.post('/api/notification-channels', channel, config);
    // return response.data;
    
    // For now, return mock success
    return new Promise<{ success: boolean, data: NotificationChannel }>(resolve => {
      setTimeout(() => {
        const newChannel: NotificationChannel = {
          ...channel,
          id: Math.random().toString(36).substring(2, 15),
        };
        resolve({ success: true, data: newChannel });
      }, 500);
    });
  },
  
  // Resolve an alert
  resolveAlert: async (alertId: string, notes: string, config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.put(`/api/alerts/${alertId}/resolve`, { notes }, config);
    // return response.data;
    
    // For now, return mock success
    return new Promise<{ success: boolean }>(resolve => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  },
  
  // Dismiss an alert
  dismissAlert: async (alertId: string, config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.put(`/api/alerts/${alertId}/dismiss`, {}, config);
    // return response.data;
    
    // For now, return mock success
    return new Promise<{ success: boolean }>(resolve => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  },
  
  // Test notification channel
  testNotificationChannel: async (channelId: string, config?: AxiosRequestConfig) => {
    // In a real app, this would call the API
    // const response = await api.post(`/api/notification-channels/${channelId}/test`, {}, config);
    // return response.data;
    
    // For now, return mock success
    return new Promise<{ success: boolean, message?: string }>(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Test notification sent successfully',
        });
      }, 1000);
    });
  },
};

export default alertService;