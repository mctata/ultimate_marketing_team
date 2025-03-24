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
