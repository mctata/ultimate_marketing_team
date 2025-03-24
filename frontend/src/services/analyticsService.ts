import api from './api';

export interface AnalyticsEvent {
  event_name: string;
  event_data: Record<string, any>;
  timestamp?: string;
  user_id?: string | number;
  session_id?: string;
}

export interface TemplateAnalytics {
  templateId: string;
  templateName: string;
  usageCount: number;
  successRate: number;
  averageGenerationTime: number;
  errorFrequency: number;
  popularVariables: Array<{ name: string; usageCount: number }>;
  errorTypes: Array<{ type: string; count: number }>;
}

export interface AnalyticsFilter {
  startDate?: string;
  endDate?: string;
  userId?: string | number;
  eventType?: string;
  limit?: number;
  page?: number;
}

const analyticsService = {
  /**
   * Track an analytics event
   */
  trackEvent: (event: Omit<AnalyticsEvent, 'timestamp'>) => {
    return api.post<{ success: boolean }>('/analytics/events', {
      ...event,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Track template usage
   */
  trackTemplateUsage: (
    templateId: string,
    templateName: string,
    success: boolean,
    generationTime: number,
    variables: Record<string, any>,
    errorType?: string
  ) => {
    return analyticsService.trackEvent({
      event_name: 'template_usage',
      event_data: {
        template_id: templateId,
        template_name: templateName,
        success,
        generation_time_ms: generationTime,
        variables,
        error_type: errorType,
      },
    });
  },

  /**
   * Track template error
   */
  trackTemplateError: (templateId: string, errorType: string, errorMessage: string) => {
    return analyticsService.trackEvent({
      event_name: 'template_error',
      event_data: {
        template_id: templateId,
        error_type: errorType,
        error_message: errorMessage,
      },
    });
  },

  /**
   * Get template analytics
   */
  getTemplateAnalytics: (templateId: string) => {
    return api.get<TemplateAnalytics>(`/analytics/templates/${templateId}`);
  },

  /**
   * Get all templates analytics
   */
  getAllTemplatesAnalytics: (filters?: AnalyticsFilter) => {
    return api.get<TemplateAnalytics[]>('/analytics/templates', { params: filters });
  },
  
  /**
   * Get user activity analytics
   */
  getUserAnalytics: (userId: string | number) => {
    return api.get<any>(`/analytics/users/${userId}`);
  },

  /**
   * Get event analytics 
   */
  getEvents: (filters?: AnalyticsFilter) => {
    return api.get<AnalyticsEvent[]>('/analytics/events', { params: filters });
  },
};

export default analyticsService;