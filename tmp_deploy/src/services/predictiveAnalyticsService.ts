import api from './api';
import { CampaignMetrics } from './campaignService';

export interface PerformancePrediction {
  campaign_id: string;
  date: string;
  predicted_views: number;
  predicted_clicks: number;
  predicted_conversions: number;
  predicted_cost: number;
  predicted_revenue: number;
  predicted_roi: number;
  prediction_confidence: number;
  trend_direction: 'up' | 'down' | 'stable';
}

export interface BudgetRecommendation {
  campaign_id: string;
  current_budget: number;
  recommended_budget: number;
  expected_roi_change: number;
  expected_revenue_change: number;
  confidence: number;
  reasoning: string;
}

export interface CampaignPerformanceAlert {
  campaign_id: string;
  alert_type: 'underperforming' | 'overperforming' | 'budget_depleting' | 'trend_change';
  severity: 'low' | 'medium' | 'high';
  message: string;
  metrics_affected: string[];
  recommendation: string;
}

export const getPredictedPerformance = (campaignId: string, daysAhead: number = 14) =>
  api.get<PerformancePrediction[]>(`/campaigns/${campaignId}/predictions`, { params: { days_ahead: daysAhead } });

export const getBudgetRecommendations = (campaignId: string) =>
  api.get<BudgetRecommendation>(`/campaigns/${campaignId}/budget-recommendations`);

export const getCampaignPerformanceAlerts = (campaignId: string) =>
  api.get<CampaignPerformanceAlert[]>(`/campaigns/${campaignId}/performance-alerts`);

export const getHistoricalVsPredictedPerformance = (campaignId: string, metric: string, timeRange?: { start_date: string; end_date: string }) =>
  api.get<{ historical: CampaignMetrics[]; predicted: PerformancePrediction[] }>(`/campaigns/${campaignId}/historical-vs-predicted`, { 
    params: { 
      metric, 
      ...timeRange 
    } 
  });
