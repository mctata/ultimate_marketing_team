// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Feature flags
export const FEATURES = {
  CALENDAR_INSIGHTS: true,
  BEST_TIME_RECOMMENDATIONS: true,
  CROSS_PLATFORM_SCHEDULING: true,
  RECURRING_CONTENT: true,
  BULK_OPERATIONS: true,
};

// Default app settings
export const DEFAULT_SETTINGS = {
  schedulingTimeBuffer: 30, // minutes between scheduled posts
  showSchedulingReminders: true,
  autoRefreshInterval: 5 * 60 * 1000, // 5 minutes in milliseconds
};

// Theme configuration
export const THEME_CONFIG = {
  platformColors: {
    instagram: '#E1306C',
    facebook: '#4267B2',
    twitter: '#1DA1F2',
    linkedin: '#0077B5',
    youtube: '#FF0000',
    tiktok: '#000000',
    email: '#28A745',
    website: '#0d6efd',
  },
  contentTypeColors: {
    blog: '#0d6efd',
    social: '#6f42c1',
    email: '#28A745',
    video: '#dc3545',
    ad: '#fd7e14',
    infographic: '#17a2b8',
  },
  statusColors: {
    draft: '#6c757d',
    scheduled: '#fd7e14',
    published: '#28A745',
    failed: '#dc3545',
  },
};