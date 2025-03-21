import api from './api';

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

class MetricsService {
  async getDailyCosts(startDate?: string, endDate?: string, provider?: string): Promise<DailyCost[]> {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (provider) params.provider = provider;
    
    try {
      const response = await api.get('/metrics/ai/daily-costs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching daily costs:', error);
      return [];
    }
  }

  async getProviderCosts(startDate?: string, endDate?: string): Promise<ProviderCost> {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    try {
      const response = await api.get('/metrics/ai/provider-costs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching provider costs:', error);
      return {};
    }
  }

  async getModelCosts(startDate?: string, endDate?: string, provider?: string): Promise<ModelCost[]> {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (provider) params.provider = provider;
    
    try {
      const response = await api.get('/metrics/ai/model-costs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching model costs:', error);
      return [];
    }
  }

  async getBudgetStatus(): Promise<BudgetStatus> {
    try {
      const response = await api.get('/metrics/ai/budget-status');
      return response.data;
    } catch (error) {
      console.error('Error fetching budget status:', error);
      return {};
    }
  }

  async getCacheMetrics(startDate?: string, endDate?: string): Promise<CacheMetrics> {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    try {
      const response = await api.get('/metrics/ai/cache-metrics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching cache metrics:', error);
      return {
        cache_hit_ratio: 0,
        estimated_savings: 0,
        total_requests: 0,
        cached_requests: 0
      };
    }
  }

  async getErrorRates(startDate?: string, endDate?: string): Promise<ErrorRates> {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    try {
      const response = await api.get('/metrics/ai/error-rates', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching error rates:', error);
      return {};
    }
  }

  async getAgentUsage(startDate?: string, endDate?: string): Promise<AgentUsage[]> {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    try {
      const response = await api.get('/metrics/ai/agent-usage', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching agent usage:', error);
      return [];
    }
  }
}

export default new MetricsService();