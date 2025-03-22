import api from './api';

/**
 * Content Analytics API service for interacting with content metrics, reports, and predictions
 */
class ContentAnalyticsService {
  private baseUrl = '/content-analytics';

  /**
   * Get content metrics for specified filters
   */
  async getContentMetrics(
    contentId?: number,
    startDate?: string,
    endDate?: string,
    platform?: string,
    metrics?: string
  ) {
    // Build query parameters
    const params = new URLSearchParams();
    if (contentId) params.append('content_id', contentId.toString());
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (platform) params.append('platform', platform);
    if (metrics) params.append('metrics', metrics);

    const response = await api.get(`${this.baseUrl}/metrics?${params.toString()}`);
    return response.data;
  }

  /**
   * Record content metrics
   */
  async recordContentMetric(metricData: any) {
    const response = await api.post(`${this.baseUrl}/metrics`, metricData);
    return response.data;
  }

  /**
   * Get content performance summary
   */
  async getContentPerformance(
    startDate?: string,
    endDate?: string,
    groupBy?: string,
    contentIds?: string
  ) {
    // Build query parameters
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (groupBy) params.append('group_by', groupBy);
    if (contentIds) params.append('content_ids', contentIds);

    const response = await api.get(`${this.baseUrl}/performance?${params.toString()}`);
    return response.data;
  }

  /**
   * Get top performing content
   */
  async getTopContent(
    startDate?: string,
    endDate?: string,
    metric: string = 'views',
    limit: number = 10,
    contentType?: string
  ) {
    // Build query parameters
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('metric', metric);
    params.append('limit', limit.toString());
    if (contentType) params.append('content_type', contentType);

    const response = await api.get(`${this.baseUrl}/top-performing?${params.toString()}`);
    return response.data;
  }

  /**
   * Get content comparison
   */
  async getContentComparison(
    contentIds: string,
    startDate?: string,
    endDate?: string,
    metrics?: string
  ) {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('content_ids', contentIds);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (metrics) params.append('metrics', metrics);

    const response = await api.get(`${this.baseUrl}/comparison?${params.toString()}`);
    return response.data;
  }

  /**
   * Get content attribution data
   */
  async getContentAttribution(
    contentId?: number,
    startDate?: string,
    endDate?: string,
    attributionModel: string = 'last_touch'
  ) {
    // Build query parameters
    const params = new URLSearchParams();
    if (contentId) params.append('content_id', contentId.toString());
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('attribution_model', attributionModel);

    const response = await api.get(`${this.baseUrl}/attribution?${params.toString()}`);
    return response.data;
  }

  /**
   * Get custom dashboards
   */
  async getCustomDashboards(
    dashboardId?: number,
    includeRoleDashboards: boolean = true
  ) {
    // Build query parameters
    const params = new URLSearchParams();
    if (dashboardId) params.append('dashboard_id', dashboardId.toString());
    params.append('include_role_dashboards', includeRoleDashboards.toString());

    const response = await api.get(`${this.baseUrl}/dashboards?${params.toString()}`);
    return response.data;
  }

  /**
   * Create a custom dashboard
   */
  async createCustomDashboard(dashboardData: any) {
    const response = await api.post(`${this.baseUrl}/dashboards`, dashboardData);
    return response.data;
  }

  /**
   * Update a custom dashboard
   */
  async updateCustomDashboard(dashboardId: number, updates: any) {
    const response = await api.put(`${this.baseUrl}/dashboards/${dashboardId}`, updates);
    return response.data;
  }

  /**
   * Get analytics reports
   */
  async getAnalyticsReports(
    reportId?: number,
    reportType?: string
  ) {
    // Build query parameters
    const params = new URLSearchParams();
    if (reportId) params.append('report_id', reportId.toString());
    if (reportType) params.append('report_type', reportType);

    const response = await api.get(`${this.baseUrl}/reports?${params.toString()}`);
    return response.data;
  }

  /**
   * Create an analytics report
   */
  async createAnalyticsReport(reportData: any) {
    const response = await api.post(`${this.baseUrl}/reports`, reportData);
    return response.data;
  }

  /**
   * Generate a report on demand
   */
  async generateReport(reportId: number, fileType: string = 'pdf') {
    const response = await api.post(`${this.baseUrl}/generate-report/${reportId}?file_type=${fileType}`);
    return response.data;
  }

  /**
   * Get content prediction
   */
  async getContentPrediction(contentId: number, targetMetric: string = 'views') {
    // This would typically be a GET endpoint, but we're using POST with prediction data
    const response = await api.get(`${this.baseUrl}/predict?content_id=${contentId}&target_metric=${targetMetric}`);
    return response.data;
  }

  /**
   * Create a content performance prediction
   */
  async createContentPrediction(predictionData: any) {
    const response = await api.post(`${this.baseUrl}/predict`, predictionData);
    return response.data;
  }
}

const contentAnalyticsService = new ContentAnalyticsService();
export default contentAnalyticsService;