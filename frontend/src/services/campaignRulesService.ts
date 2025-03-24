import api from './api';

export interface CampaignRule {
  id: string;
  campaign_id: string;
  name: string;
  description?: string;
  condition_type: 'metric_threshold' | 'time_based' | 'budget_depleted' | 'roi_based' | 'custom';
  condition_metric?: string; // e.g., 'cpa', 'ctr', 'roas', etc.
  condition_operator?: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'; // greater than, less than, equal, etc.
  condition_value?: number; // threshold value
  action_type: 'pause_campaign' | 'resume_campaign' | 'adjust_budget' | 'notify' | 'custom';
  action_value?: any; // e.g., budget adjustment amount, notification message, etc.
  schedule_type?: 'one_time' | 'recurring' | 'continuous';
  schedule_start_date?: string;
  schedule_end_date?: string;
  schedule_days?: string[]; // e.g., ['monday', 'wednesday', 'friday']
  schedule_time?: string; // e.g., '14:00'
  status: 'active' | 'inactive' | 'completed';
  created_at: string;
  updated_at: string;
  last_triggered_at?: string;
  auto_resume?: boolean; // New field for automatic resuming of campaigns
  auto_resume_after?: number; // Number of hours after which to auto-resume
  performance_threshold?: number; // For conditional auto-resume based on performance
}

export interface RuleExecutionHistory {
  id: string;
  rule_id: string;
  campaign_id: string;
  executed_at: string;
  trigger_condition: string;
  action_taken: string;
  status: 'success' | 'failed';
  metrics_snapshot: Record<string, any>;
}

export interface NotificationConfig {
  rule_id: string;
  notification_type: 'email' | 'sms' | 'in_app' | 'slack';
  recipients: string[];
  message_template: string;
}

// Campaign Rules API
export const getCampaignRules = (campaignId?: string) => 
  api.get<CampaignRule[]>('/campaign-rules', { params: { campaign_id: campaignId } });

export const getCampaignRuleById = (ruleId: string) => 
  api.get<CampaignRule>(`/campaign-rules/${ruleId}`);

export const createCampaignRule = (rule: Omit<CampaignRule, 'id' | 'created_at' | 'updated_at' | 'last_triggered_at'>) => 
  api.post<CampaignRule>('/campaign-rules', rule);

export const updateCampaignRule = (ruleId: string, rule: Partial<CampaignRule>) => 
  api.put<CampaignRule>(`/campaign-rules/${ruleId}`, rule);

export const deleteCampaignRule = (ruleId: string) => 
  api.delete(`/campaign-rules/${ruleId}`);

// Rule execution history
export const getRuleExecutionHistory = (ruleId: string) => 
  api.get<RuleExecutionHistory[]>(`/campaign-rules/${ruleId}/history`);

export const getCampaignRuleExecutionHistory = (campaignId: string) => 
  api.get<RuleExecutionHistory[]>(`/campaigns/${campaignId}/rule-executions`);

// Manual rule execution
export const executeRuleManually = (ruleId: string) => 
  api.post<RuleExecutionHistory>(`/campaign-rules/${ruleId}/execute`);

// Notification configuration
export const getNotificationConfig = (ruleId: string) => 
  api.get<NotificationConfig>(`/campaign-rules/${ruleId}/notifications`);

export const updateNotificationConfig = (ruleId: string, config: Omit<NotificationConfig, 'rule_id'>) => 
  api.put<NotificationConfig>(`/campaign-rules/${ruleId}/notifications`, config);

// Test rule conditions
export const testRuleCondition = (ruleData: Partial<CampaignRule>, campaignId: string) => 
  api.post<{ would_trigger: boolean; metrics: Record<string, any> }>(`/campaigns/${campaignId}/test-rule`, ruleData);

// Scheduling APIs
export const getScheduledRules = (params?: { status?: string; from_date?: string; to_date?: string }) =>
  api.get<CampaignRule[]>('/campaign-rules/scheduled', { params });

export const pauseScheduledRule = (ruleId: string) =>
  api.post<CampaignRule>(`/campaign-rules/${ruleId}/pause-schedule`);

export const resumeScheduledRule = (ruleId: string) =>
  api.post<CampaignRule>(`/campaign-rules/${ruleId}/resume-schedule`);

// Performance threshold APIs
export const getCampaignPerformanceThresholds = (campaignId: string) =>
  api.get<Record<string, number>>(`/campaigns/${campaignId}/performance-thresholds`);

export const updateCampaignPerformanceThresholds = (campaignId: string, thresholds: Record<string, number>) =>
  api.put<Record<string, number>>(`/campaigns/${campaignId}/performance-thresholds`, thresholds);
