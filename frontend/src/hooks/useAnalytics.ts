import { useQuery } from '@tanstack/react-query';
import metricsService from '../services/metricsService';

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

// Query keys for React Query
export const analyticsKeys = {
  all: ['analytics'] as const,
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
};

/**
 * Hook for working with analytics data
 */
export const useAnalytics = () => {
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

  return {
    useDailyCosts,
    useProviderCosts,
    useModelCosts,
    useBudgetStatus,
    useCacheMetrics,
    useErrorRates,
    useAgentUsage
  };
};

export default useAnalytics;