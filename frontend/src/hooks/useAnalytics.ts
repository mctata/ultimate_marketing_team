import { useQuery, useMutation } from '@tanstack/react-query';
import metricsService from '../services/metricsService';
import contentAnalyticsService from '../services/contentAnalyticsService';

// Types from metricsService
interface DailyCost {
  date: string;
  provider: string;
  model: string;
  total_requests: number;
  cached_requests: number;
  failed_requests: number;
  total_tokens: number;
  cost_usd: number;
  cache_hit_ratio: number;
  error_rate: number;
}

interface ModelCost {
  provider: string;
  model: string;
  tokens: number;
  cost_usd: number;
  requests: number;
  cached_requests: number;
  cache_hit_ratio: number;
  cost_per_1k_tokens: number;
}

interface ProviderCost {
  [provider: string]: number;
}

interface BudgetStatus {
  [provider: string]: {
    current_spend: number;
    monthly_budget: number;
    budget_percent: number;
    projected_month_end: number;
    projected_percent: number;
    estimated_overage: number;
    warning_level: 'low' | 'medium' | 'high';
  };
}

interface CacheMetrics {
  cache_hit_ratio: number;
  estimated_savings: number;
  total_requests: number;
  cached_requests: number;
}

interface ErrorRates {
  [provider: string]: {
    error_rate: number;
    total_requests: number;
    failed_requests: number;
  };
}

interface AgentUsage {
  agent_type: string;
  request_count: number;
  total_tokens: number;
  cost_usd: number;
  avg_tokens_per_request: number;
}

// Content Analytics Types
interface ContentMetric {
  id: number;
  content_id: number;
  date: string;
  platform: string;
  views: number;
  unique_visitors: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  click_through_rate: number;
  avg_time_on_page: number;
  bounce_rate: number;
  scroll_depth: number;
  conversions: number;
  conversion_rate: number;
  leads_generated: number;
  revenue_generated: number;
  serp_position?: number;
  organic_traffic: number;
  backlinks: number;
  demographics?: Record<string, any>;
  sources?: Record<string, any>;
  devices?: Record<string, any>;
}

interface PerformanceSummary {
  total_views: number;
  total_unique_visitors: number;
  total_likes: number;
  total_shares: number;
  total_comments: number;
  total_clicks: number;
  avg_click_through_rate: number;
  avg_time_on_page: number;
  avg_bounce_rate: number;
  total_conversions: number;
  avg_conversion_rate: number;
  total_revenue: number;
  content_count: number;
}

interface TimeSeriesPoint {
  period: string;
  views: number;
  unique_visitors: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  click_through_rate: number;
  avg_time_on_page: number;
  bounce_rate: number;
  conversions: number;
  conversion_rate: number;
  revenue: number;
}

interface PerformanceSummaryResponse {
  summary?: PerformanceSummary;
  time_series?: TimeSeriesPoint[];
}

interface TopPerformingContent {
  content_id: number;
  views: number;
  conversions: number;
  revenue: number;
  metric_value: number;
}

interface ContentComparison {
  content_id: number;
  metrics: Record<string, number>;
}

interface ContentComparisonResponse {
  comparison: ContentComparison[];
}

interface AttributionData {
  content_id: number;
  attributed_conversions: number;
  attributed_value: number;
}

interface ContentAttributionResponse {
  model: string;
  total_conversions: number;
  total_value: number;
  content_attribution: AttributionData[];
}

interface CustomDashboard {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  layout: Record<string, any>;
  widgets: Record<string, any>[];
  is_default: boolean;
  role_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface DashboardCreateInput {
  name: string;
  description?: string;
  layout?: Record<string, any>;
  widgets?: Record<string, any>[];
  is_default?: boolean;
  role_id?: number;
}

interface DashboardUpdateInput {
  name?: string;
  description?: string;
  layout?: Record<string, any>;
  widgets?: Record<string, any>[];
  is_default?: boolean;
  role_id?: number;
}

interface AnalyticsReport {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  report_type: string;
  template_id?: string;
  config: Record<string, any>;
  schedule_type?: string;
  schedule_config?: Record<string, any>;
  recipients?: string[];
  last_generated?: string;
  file_path?: string;
  file_type?: string;
  created_at?: string;
  updated_at?: string;
}

interface AnalyticsReportInput {
  name: string;
  report_type: string;
  config: Record<string, any>;
  description?: string;
  template_id?: string;
  schedule_type?: string;
  schedule_config?: Record<string, any>;
  recipients?: string[];
}

interface ContentPredictionInput {
  content_id: number;
  content_data: Record<string, any>;
  target_metric: string;
  prediction_horizon: number;
}

interface ContentPrediction {
  content_id: number;
  target_metric: string;
  prediction_date: string;
  predicted_value: number;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  model: Record<string, any>;
}

// Query keys for React Query
export const analyticsKeys = {
  all: ['analytics'] as const,
  // API metrics keys
  dailyCosts: (startDate?: string, endDate?: string, provider?: string) => 
    [...analyticsKeys.all, 'dailyCosts', { startDate, endDate, provider }] as const,
  providerCosts: (startDate?: string, endDate?: string) => 
    [...analyticsKeys.all, 'providerCosts', { startDate, endDate }] as const,
  modelCosts: (startDate?: string, endDate?: string, provider?: string) => 
    [...analyticsKeys.all, 'modelCosts', { startDate, endDate, provider }] as const,
  budgetStatus: () => [...analyticsKeys.all, 'budgetStatus'] as const,
  cacheMetrics: (startDate?: string, endDate?: string) => 
    [...analyticsKeys.all, 'cacheMetrics', { startDate, endDate }] as const,
  errorRates: (startDate?: string, endDate?: string) => 
    [...analyticsKeys.all, 'errorRates', { startDate, endDate }] as const,
  agentUsage: (startDate?: string, endDate?: string) => 
    [...analyticsKeys.all, 'agentUsage', { startDate, endDate }] as const,
  
  // Content analytics keys
  contentMetrics: (contentId?: number, startDate?: string, endDate?: string, platform?: string, metrics?: string) =>
    [...analyticsKeys.all, 'contentMetrics', { contentId, startDate, endDate, platform, metrics }] as const,
  contentPerformance: (contentIds?: string, startDate?: string, endDate?: string, groupBy?: string) =>
    [...analyticsKeys.all, 'contentPerformance', { contentIds, startDate, endDate, groupBy }] as const,
  topContent: (startDate?: string, endDate?: string, metric?: string, limit?: number, contentType?: string) =>
    [...analyticsKeys.all, 'topContent', { startDate, endDate, metric, limit, contentType }] as const,
  contentComparison: (contentIds: string, startDate?: string, endDate?: string, metrics?: string) =>
    [...analyticsKeys.all, 'contentComparison', { contentIds, startDate, endDate, metrics }] as const,
  contentAttribution: (contentId?: number, startDate?: string, endDate?: string, model?: string) =>
    [...analyticsKeys.all, 'contentAttribution', { contentId, startDate, endDate, model }] as const,
  dashboards: (dashboardId?: number, includeRoleDashboards?: boolean) =>
    [...analyticsKeys.all, 'dashboards', { dashboardId, includeRoleDashboards }] as const,
  reports: (reportId?: number, reportType?: string) =>
    [...analyticsKeys.all, 'reports', { reportId, reportType }] as const,
  contentPrediction: (contentId: number, targetMetric: string) =>
    [...analyticsKeys.all, 'contentPrediction', { contentId, targetMetric }] as const,
};

/**
 * Hook for working with analytics data
 */
export const useAnalytics = () => {
  // ===== API Metrics =====
  
  // Get daily costs data
  const useDailyCosts = (startDate?: string, endDate?: string, provider?: string) => {
    return useQuery<DailyCost[]>({
      queryKey: analyticsKeys.dailyCosts(startDate, endDate, provider),
      queryFn: () => metricsService.getDailyCosts(startDate, endDate, provider),
    });
  };

  // Get provider costs data
  const useProviderCosts = (startDate?: string, endDate?: string) => {
    return useQuery<ProviderCost>({
      queryKey: analyticsKeys.providerCosts(startDate, endDate),
      queryFn: () => metricsService.getProviderCosts(startDate, endDate),
    });
  };

  // Get model costs data
  const useModelCosts = (startDate?: string, endDate?: string, provider?: string) => {
    return useQuery<ModelCost[]>({
      queryKey: analyticsKeys.modelCosts(startDate, endDate, provider),
      queryFn: () => metricsService.getModelCosts(startDate, endDate, provider),
    });
  };

  // Get budget status data
  const useBudgetStatus = () => {
    return useQuery<BudgetStatus>({
      queryKey: analyticsKeys.budgetStatus(),
      queryFn: () => metricsService.getBudgetStatus(),
    });
  };

  // Get cache metrics data
  const useCacheMetrics = (startDate?: string, endDate?: string) => {
    return useQuery<CacheMetrics>({
      queryKey: analyticsKeys.cacheMetrics(startDate, endDate),
      queryFn: () => metricsService.getCacheMetrics(startDate, endDate),
    });
  };

  // Get error rates data
  const useErrorRates = (startDate?: string, endDate?: string) => {
    return useQuery<ErrorRates>({
      queryKey: analyticsKeys.errorRates(startDate, endDate),
      queryFn: () => metricsService.getErrorRates(startDate, endDate),
    });
  };

  // Get agent usage data
  const useAgentUsage = (startDate?: string, endDate?: string) => {
    return useQuery<AgentUsage[]>({
      queryKey: analyticsKeys.agentUsage(startDate, endDate),
      queryFn: () => metricsService.getAgentUsage(startDate, endDate),
    });
  };

  // ===== Content Analytics =====
  
  // Get content metrics data
  const useContentMetrics = (
    contentId?: number, 
    startDate?: string, 
    endDate?: string, 
    platform?: string,
    metrics?: string
  ) => {
    return useQuery<ContentMetric[]>({
      queryKey: analyticsKeys.contentMetrics(contentId, startDate, endDate, platform, metrics),
      queryFn: () => contentAnalyticsService.getContentMetrics(contentId, startDate, endDate, platform, metrics),
    });
  };

  // Get content performance summary
  const useContentPerformance = (
    startDate?: string, 
    endDate?: string,
    groupBy?: string,
    contentIds?: string
  ) => {
    return useQuery<PerformanceSummaryResponse>({
      queryKey: analyticsKeys.contentPerformance(contentIds, startDate, endDate, groupBy),
      queryFn: () => contentAnalyticsService.getContentPerformance(startDate, endDate, groupBy, contentIds),
    });
  };

  // Get top performing content
  const useTopContent = (
    startDate?: string, 
    endDate?: string,
    metric: string = 'views',
    limit: number = 10,
    contentType?: string
  ) => {
    return useQuery<TopPerformingContent[]>({
      queryKey: analyticsKeys.topContent(startDate, endDate, metric, limit, contentType),
      queryFn: () => contentAnalyticsService.getTopContent(startDate, endDate, metric, limit, contentType),
    });
  };

  // Get content comparison
  const useContentComparison = (
    contentIds: string,
    startDate?: string, 
    endDate?: string,
    metrics?: string
  ) => {
    return useQuery<ContentComparisonResponse>({
      queryKey: analyticsKeys.contentComparison(contentIds, startDate, endDate, metrics),
      queryFn: () => contentAnalyticsService.getContentComparison(contentIds, startDate, endDate, metrics),
    });
  };

  // Get content attribution
  const useContentAttribution = (
    contentId?: number,
    startDate?: string, 
    endDate?: string,
    attributionModel: string = 'last_touch'
  ) => {
    return useQuery<ContentAttributionResponse>({
      queryKey: analyticsKeys.contentAttribution(contentId, startDate, endDate, attributionModel),
      queryFn: () => contentAnalyticsService.getContentAttribution(contentId, startDate, endDate, attributionModel),
    });
  };

  // Get custom dashboards
  const useCustomDashboards = (
    dashboardId?: number,
    includeRoleDashboards: boolean = true
  ) => {
    return useQuery<CustomDashboard[]>({
      queryKey: analyticsKeys.dashboards(dashboardId, includeRoleDashboards),
      queryFn: () => contentAnalyticsService.getCustomDashboards(dashboardId, includeRoleDashboards),
    });
  };

  // Create custom dashboard
  const useCreateDashboard = () => {
    return useMutation({
      mutationFn: (dashboardData: DashboardCreateInput) => 
        contentAnalyticsService.createCustomDashboard(dashboardData),
    });
  };

  // Update custom dashboard
  const useUpdateDashboard = () => {
    return useMutation({
      mutationFn: ({ dashboardId, updates }: { dashboardId: number, updates: DashboardUpdateInput }) => 
        contentAnalyticsService.updateCustomDashboard(dashboardId, updates),
    });
  };

  // Get analytics reports
  const useAnalyticsReports = (
    reportId?: number,
    reportType?: string
  ) => {
    return useQuery<AnalyticsReport[]>({
      queryKey: analyticsKeys.reports(reportId, reportType),
      queryFn: () => contentAnalyticsService.getAnalyticsReports(reportId, reportType),
    });
  };

  // Create analytics report
  const useCreateReport = () => {
    return useMutation({
      mutationFn: (reportData: AnalyticsReportInput) => 
        contentAnalyticsService.createAnalyticsReport(reportData),
    });
  };

  // Generate report
  const useGenerateReport = () => {
    return useMutation({
      mutationFn: ({ reportId, fileType }: { reportId: number, fileType: string }) => 
        contentAnalyticsService.generateReport(reportId, fileType),
    });
  };

  // Get content predictions
  const useContentPredictions = (
    contentId: number,
    targetMetric: string = 'views'
  ) => {
    return useQuery<ContentPrediction>({
      queryKey: analyticsKeys.contentPrediction(contentId, targetMetric),
      queryFn: () => contentAnalyticsService.getContentPrediction(contentId, targetMetric),
      enabled: false, // Don't run automatically
    });
  };

  // Create content prediction
  const useCreatePrediction = () => {
    return useMutation({
      mutationFn: (predictionData: ContentPredictionInput) => 
        contentAnalyticsService.createContentPrediction(predictionData),
    });
  };

  return {
    // API Metrics
    useDailyCosts,
    useProviderCosts,
    useModelCosts,
    useBudgetStatus,
    useCacheMetrics,
    useErrorRates,
    useAgentUsage,
    
    // Content Analytics
    useContentMetrics,
    useContentPerformance,
    useTopContent,
    useContentComparison,
    useContentAttribution,
    useCustomDashboards,
    useCreateDashboard,
    useUpdateDashboard,
    useAnalyticsReports,
    useCreateReport,
    useGenerateReport,
    useContentPredictions,
    useCreatePrediction
  };
};

export default useAnalytics;