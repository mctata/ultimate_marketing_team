import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import metricsService from '../../services/metricsService';
import { RootState } from '../index';

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  trending: 'up' | 'down' | 'stable';
  period: string;
}

interface AnalyticsChart {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  data: any[];
  labels?: string[];
  xAxisLabel?: string;
  yAxisLabel?: string;
}

// API Metrics types
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

// Template Analytics interfaces
interface TemplateUsageData {
  date: string;
  count: number;
}

interface TemplatePerformance {
  templateId: string;
  templateName: string;
  usageCount: number;
  conversionRate: number;
  engagement: number;
  completionTime: number;
}

interface TemplateAnalytics {
  totalUsage: number;
  usageGrowth: number;
  avgConversionRate: number;
  conversionGrowth: number;
  avgEngagementScore: number;
  engagementGrowth: number;
  avgCompletionTime: number;
  completionTimeGrowth: number;
  usageOverTime: TemplateUsageData[];
  usageByContentType: {name: string, value: number}[];
  usageByPlatform: {name: string, value: number}[];
}

interface IndustryPerformance {
  industry: string;
  usageCount: number;
  conversionRate: number;
  engagementScore: number;
}

interface AnalyticsState {
  dashboardMetrics: AnalyticsMetric[];
  charts: AnalyticsChart[];
  brandAnalytics: Record<string, any>;
  contentAnalytics: Record<string, any>;
  campaignAnalytics: Record<string, any>;
  dateRange: {
    start: string;
    end: string;
  };
  isLoading: boolean;
  error: string | null;
  
  // Template analytics
  templateAnalytics: TemplateAnalytics | null;
  industryPerformance: IndustryPerformance[];
  topPerformingTemplates: TemplatePerformance[];
  templateAnalyticsLoading: boolean;
  templateAnalyticsError: string | null;
  
  // API Metrics
  aiMetrics: {
    dailyCosts: DailyCost[];
    providerCosts: ProviderCost;
    modelCosts: ModelCost[];
    budgetStatus: BudgetStatus;
    cacheMetrics: CacheMetrics;
    errorRates: ErrorRates;
    agentUsage: AgentUsage[];
    isLoading: boolean;
    error: string | null;
  };
}

// Async thunks for API metrics
export const fetchDailyCosts = createAsyncThunk(
  'analytics/fetchDailyCosts',
  async ({ startDate, endDate, provider }: { startDate?: string, endDate?: string, provider?: string }) => {
    return await metricsService.getDailyCosts(startDate, endDate, provider);
  }
);

export const fetchProviderCosts = createAsyncThunk(
  'analytics/fetchProviderCosts',
  async ({ startDate, endDate }: { startDate?: string, endDate?: string }) => {
    return await metricsService.getProviderCosts(startDate, endDate);
  }
);

export const fetchModelCosts = createAsyncThunk(
  'analytics/fetchModelCosts',
  async ({ startDate, endDate, provider }: { startDate?: string, endDate?: string, provider?: string }) => {
    return await metricsService.getModelCosts(startDate, endDate, provider);
  }
);

export const fetchBudgetStatus = createAsyncThunk(
  'analytics/fetchBudgetStatus',
  async () => {
    return await metricsService.getBudgetStatus();
  }
);

export const fetchCacheMetrics = createAsyncThunk(
  'analytics/fetchCacheMetrics',
  async ({ startDate, endDate }: { startDate?: string, endDate?: string }) => {
    return await metricsService.getCacheMetrics(startDate, endDate);
  }
);

export const fetchErrorRates = createAsyncThunk(
  'analytics/fetchErrorRates',
  async ({ startDate, endDate }: { startDate?: string, endDate?: string }) => {
    return await metricsService.getErrorRates(startDate, endDate);
  }
);

export const fetchAgentUsage = createAsyncThunk(
  'analytics/fetchAgentUsage',
  async ({ startDate, endDate }: { startDate?: string, endDate?: string }) => {
    return await metricsService.getAgentUsage(startDate, endDate);
  }
);

// Template analytics thunks
export const fetchTemplateAnalytics = createAsyncThunk(
  'analytics/fetchTemplateAnalytics',
  async (timeRange: string) => {
    // Mock implementation - would connect to API in real implementation
    return {
      totalUsage: 1250,
      usageGrowth: 12.5,
      avgConversionRate: 8.2,
      conversionGrowth: 3.4,
      avgEngagementScore: 7.8,
      engagementGrowth: 5.2,
      avgCompletionTime: 4.5,
      completionTimeGrowth: -1.2,
      usageOverTime: [
        { date: '2023-01-01', count: 45 },
        { date: '2023-01-02', count: 52 },
        { date: '2023-01-03', count: 48 },
        { date: '2023-01-04', count: 67 },
        { date: '2023-01-05', count: 58 },
      ],
      usageByContentType: [
        { name: 'Blog', value: 450 },
        { name: 'Social', value: 380 },
        { name: 'Email', value: 250 },
        { name: 'Ad', value: 170 },
      ],
      usageByPlatform: [
        { name: 'Facebook', value: 280 },
        { name: 'Instagram', value: 240 },
        { name: 'Twitter', value: 180 },
        { name: 'LinkedIn', value: 220 },
        { name: 'Website', value: 330 },
      ],
    };
  }
);

export const fetchIndustryPerformance = createAsyncThunk(
  'analytics/fetchIndustryPerformance',
  async (timeRange: string) => {
    // Mock implementation - would connect to API in real implementation
    return [
      { industry: 'Technology', usageCount: 450, conversionRate: 8.7, engagementScore: 8.1 },
      { industry: 'Finance', usageCount: 380, conversionRate: 7.2, engagementScore: 6.9 },
      { industry: 'Healthcare', usageCount: 320, conversionRate: 8.1, engagementScore: 7.8 },
      { industry: 'Education', usageCount: 280, conversionRate: 7.9, engagementScore: 8.3 },
      { industry: 'Retail', usageCount: 340, conversionRate: 7.6, engagementScore: 7.5 },
    ];
  }
);

export const fetchTopPerformingTemplates = createAsyncThunk(
  'analytics/fetchTopPerformingTemplates',
  async (timeRange: string) => {
    // Mock implementation - would connect to API in real implementation
    return [
      { templateId: '1', templateName: 'Product Launch Email', usageCount: 215, conversionRate: 9.2, engagement: 8.7, completionTime: 3.5 },
      { templateId: '2', templateName: 'Social Media Contest', usageCount: 198, conversionRate: 8.9, engagement: 9.1, completionTime: 4.2 },
      { templateId: '3', templateName: 'Blog Post Template', usageCount: 187, conversionRate: 8.5, engagement: 8.3, completionTime: 5.1 },
      { templateId: '4', templateName: 'Weekly Newsletter', usageCount: 165, conversionRate: 7.8, engagement: 7.9, completionTime: 3.8 },
      { templateId: '5', templateName: 'Sales Promotion', usageCount: 143, conversionRate: 8.1, engagement: 7.7, completionTime: 4.0 },
    ];
  }
);

const initialState: AnalyticsState = {
  dashboardMetrics: [],
  charts: [],
  brandAnalytics: {},
  contentAnalytics: {},
  campaignAnalytics: {},
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0], // today
  },
  isLoading: false,
  error: null,
  
  // Template analytics initial state
  templateAnalytics: null,
  industryPerformance: [],
  topPerformingTemplates: [],
  templateAnalyticsLoading: false,
  templateAnalyticsError: null,
  
  // API Metrics initial state
  aiMetrics: {
    dailyCosts: [],
    providerCosts: {},
    modelCosts: [],
    budgetStatus: {},
    cacheMetrics: {
      cache_hit_ratio: 0,
      estimated_savings: 0,
      total_requests: 0,
      cached_requests: 0
    },
    errorRates: {},
    agentUsage: [],
    isLoading: false,
    error: null
  }
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    fetchAnalyticsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchAnalyticsSuccess: (state, action: PayloadAction<{
      metrics?: AnalyticsMetric[];
      charts?: AnalyticsChart[];
    }>) => {
      state.isLoading = false;
      if (action.payload.metrics) {
        state.dashboardMetrics = action.payload.metrics;
      }
      if (action.payload.charts) {
        state.charts = action.payload.charts;
      }
    },
    fetchAnalyticsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    fetchBrandAnalyticsSuccess: (state, action: PayloadAction<{
      brandId: string;
      data: any;
    }>) => {
      state.brandAnalytics[action.payload.brandId] = action.payload.data;
    },
    fetchContentAnalyticsSuccess: (state, action: PayloadAction<{
      contentId: string;
      data: any;
    }>) => {
      state.contentAnalytics[action.payload.contentId] = action.payload.data;
    },
    fetchCampaignAnalyticsSuccess: (state, action: PayloadAction<{
      campaignId: string;
      data: any;
    }>) => {
      state.campaignAnalytics[action.payload.campaignId] = action.payload.data;
    },
    setDateRange: (state, action: PayloadAction<{
      start: string;
      end: string;
    }>) => {
      state.dateRange = action.payload;
    },
    clearAnalytics: (state) => {
      state.dashboardMetrics = [];
      state.charts = [];
      state.brandAnalytics = {};
      state.contentAnalytics = {};
      state.campaignAnalytics = {};
    },
  },
  extraReducers: (builder) => {
    // Daily costs
    builder
      .addCase(fetchDailyCosts.pending, (state) => {
        state.aiMetrics.isLoading = true;
        state.aiMetrics.error = null;
      })
      .addCase(fetchDailyCosts.fulfilled, (state, action) => {
        state.aiMetrics.isLoading = false;
        state.aiMetrics.dailyCosts = action.payload;
      })
      .addCase(fetchDailyCosts.rejected, (state, action) => {
        state.aiMetrics.isLoading = false;
        state.aiMetrics.error = action.error.message || 'Failed to fetch daily costs';
      });
      
    // Provider costs
    builder
      .addCase(fetchProviderCosts.pending, (state) => {
        state.aiMetrics.isLoading = true;
        state.aiMetrics.error = null;
      })
      .addCase(fetchProviderCosts.fulfilled, (state, action) => {
        state.aiMetrics.isLoading = false;
        state.aiMetrics.providerCosts = action.payload;
      })
      .addCase(fetchProviderCosts.rejected, (state, action) => {
        state.aiMetrics.isLoading = false;
        state.aiMetrics.error = action.error.message || 'Failed to fetch provider costs';
      });
      
    // Model costs
    builder
      .addCase(fetchModelCosts.pending, (state) => {
        state.aiMetrics.isLoading = true;
        state.aiMetrics.error = null;
      })
      .addCase(fetchModelCosts.fulfilled, (state, action) => {
        state.aiMetrics.isLoading = false;
        state.aiMetrics.modelCosts = action.payload;
      })
      .addCase(fetchModelCosts.rejected, (state, action) => {
        state.aiMetrics.isLoading = false;
        state.aiMetrics.error = action.error.message || 'Failed to fetch model costs';
      });
      
    // Budget status
    builder
      .addCase(fetchBudgetStatus.pending, (state) => {
        state.aiMetrics.isLoading = true;
        state.aiMetrics.error = null;
      })
      .addCase(fetchBudgetStatus.fulfilled, (state, action) => {
        state.aiMetrics.isLoading = false;
        state.aiMetrics.budgetStatus = action.payload;
      })
      .addCase(fetchBudgetStatus.rejected, (state, action) => {
        state.aiMetrics.isLoading = false;
        state.aiMetrics.error = action.error.message || 'Failed to fetch budget status';
      });
      
    // Cache metrics
    builder
      .addCase(fetchCacheMetrics.pending, (state) => {
        state.aiMetrics.isLoading = true;
        state.aiMetrics.error = null;
      })
      .addCase(fetchCacheMetrics.fulfilled, (state, action) => {
        state.aiMetrics.isLoading = false;
        state.aiMetrics.cacheMetrics = action.payload;
      })
      .addCase(fetchCacheMetrics.rejected, (state, action) => {
        state.aiMetrics.isLoading = false;
        state.aiMetrics.error = action.error.message || 'Failed to fetch cache metrics';
      });
      
    // Error rates
    builder
      .addCase(fetchErrorRates.pending, (state) => {
        state.aiMetrics.isLoading = true;
        state.aiMetrics.error = null;
      })
      .addCase(fetchErrorRates.fulfilled, (state, action) => {
        state.aiMetrics.isLoading = false;
        state.aiMetrics.errorRates = action.payload;
      })
      .addCase(fetchErrorRates.rejected, (state, action) => {
        state.aiMetrics.isLoading = false;
        state.aiMetrics.error = action.error.message || 'Failed to fetch error rates';
      });
      
    // Agent usage
    builder
      .addCase(fetchAgentUsage.pending, (state) => {
        state.aiMetrics.isLoading = true;
        state.aiMetrics.error = null;
      })
      .addCase(fetchAgentUsage.fulfilled, (state, action) => {
        state.aiMetrics.isLoading = false;
        state.aiMetrics.agentUsage = action.payload;
      })
      .addCase(fetchAgentUsage.rejected, (state, action) => {
        state.aiMetrics.isLoading = false;
        state.aiMetrics.error = action.error.message || 'Failed to fetch agent usage';
      });
      
    // Template analytics reducers
    builder
      // Template analytics
      .addCase(fetchTemplateAnalytics.pending, (state) => {
        state.templateAnalyticsLoading = true;
        state.templateAnalyticsError = null;
      })
      .addCase(fetchTemplateAnalytics.fulfilled, (state, action) => {
        state.templateAnalyticsLoading = false;
        state.templateAnalytics = action.payload;
      })
      .addCase(fetchTemplateAnalytics.rejected, (state, action) => {
        state.templateAnalyticsLoading = false;
        state.templateAnalyticsError = action.error.message || 'Failed to fetch template analytics';
      })
      
      // Industry performance
      .addCase(fetchIndustryPerformance.pending, (state) => {
        state.templateAnalyticsLoading = true;
      })
      .addCase(fetchIndustryPerformance.fulfilled, (state, action) => {
        state.templateAnalyticsLoading = false;
        state.industryPerformance = action.payload;
      })
      .addCase(fetchIndustryPerformance.rejected, (state, action) => {
        state.templateAnalyticsLoading = false;
        state.templateAnalyticsError = action.error.message || 'Failed to fetch industry performance';
      })
      
      // Top performing templates
      .addCase(fetchTopPerformingTemplates.pending, (state) => {
        state.templateAnalyticsLoading = true;
      })
      .addCase(fetchTopPerformingTemplates.fulfilled, (state, action) => {
        state.templateAnalyticsLoading = false;
        state.topPerformingTemplates = action.payload;
      })
      .addCase(fetchTopPerformingTemplates.rejected, (state, action) => {
        state.templateAnalyticsLoading = false;
        state.templateAnalyticsError = action.error.message || 'Failed to fetch top performing templates';
      });
  },
});

export const {
  fetchAnalyticsStart,
  fetchAnalyticsSuccess,
  fetchAnalyticsFailure,
  fetchBrandAnalyticsSuccess,
  fetchContentAnalyticsSuccess,
  fetchCampaignAnalyticsSuccess,
  setDateRange,
  clearAnalytics,
} = analyticsSlice.actions;

// Selectors for template analytics
export const selectTemplateAnalytics = (state: RootState) => state.analytics.templateAnalytics;
export const selectIndustryPerformance = (state: RootState) => state.analytics.industryPerformance;
export const selectTopPerformingTemplates = (state: RootState) => state.analytics.topPerformingTemplates;
export const selectTemplateAnalyticsLoading = (state: RootState) => state.analytics.templateAnalyticsLoading;
export const selectTemplateAnalyticsError = (state: RootState) => state.analytics.templateAnalyticsError;

export default analyticsSlice.reducer;