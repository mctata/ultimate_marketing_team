import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
}

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

export default analyticsSlice.reducer;