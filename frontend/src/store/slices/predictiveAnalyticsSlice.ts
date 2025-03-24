import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as predictiveAnalyticsService from '../../services/predictiveAnalyticsService';
import { RootState } from '..';
import { 
  PerformancePrediction, 
  BudgetRecommendation, 
  CampaignPerformanceAlert 
} from '../../services/predictiveAnalyticsService';

interface PredictiveAnalyticsState {
  predictions: {
    data: Record<string, PerformancePrediction[]>; // Indexed by campaign ID
    loading: boolean;
    error: string | null;
  };
  budgetRecommendations: {
    data: Record<string, BudgetRecommendation>; // Indexed by campaign ID
    loading: boolean;
    error: string | null;
  };
  performanceAlerts: {
    data: Record<string, CampaignPerformanceAlert[]>; // Indexed by campaign ID
    loading: boolean;
    error: string | null;
  };
  historicalVsPredicted: {
    data: {
      historical: any[];
      predicted: any[];
    };
    loading: boolean;
    error: string | null;
  };
}

const initialState: PredictiveAnalyticsState = {
  predictions: {
    data: {},
    loading: false,
    error: null,
  },
  budgetRecommendations: {
    data: {},
    loading: false,
    error: null,
  },
  performanceAlerts: {
    data: {},
    loading: false,
    error: null,
  },
  historicalVsPredicted: {
    data: {
      historical: [],
      predicted: [],
    },
    loading: false,
    error: null,
  },
};

// Async Thunks for Predictive Analytics
export const fetchPredictedPerformance = createAsyncThunk(
  'predictiveAnalytics/fetchPredictedPerformance',
  async ({ campaignId, daysAhead = 14 }: { campaignId: string, daysAhead?: number }, { rejectWithValue }) => {
    try {
      const response = await predictiveAnalyticsService.getPredictedPerformance(campaignId, daysAhead);
      return { campaignId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch performance predictions');
    }
  }
);

export const fetchBudgetRecommendations = createAsyncThunk(
  'predictiveAnalytics/fetchBudgetRecommendations',
  async (campaignId: string, { rejectWithValue }) => {
    try {
      const response = await predictiveAnalyticsService.getBudgetRecommendations(campaignId);
      return { campaignId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch budget recommendations');
    }
  }
);

export const fetchCampaignPerformanceAlerts = createAsyncThunk(
  'predictiveAnalytics/fetchCampaignPerformanceAlerts',
  async (campaignId: string, { rejectWithValue }) => {
    try {
      const response = await predictiveAnalyticsService.getCampaignPerformanceAlerts(campaignId);
      return { campaignId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch performance alerts');
    }
  }
);

export const fetchHistoricalVsPredictedPerformance = createAsyncThunk(
  'predictiveAnalytics/fetchHistoricalVsPredictedPerformance',
  async ({ 
    campaignId, 
    metric, 
    timeRange 
  }: { 
    campaignId: string, 
    metric: string, 
    timeRange?: { start_date: string; end_date: string } 
  }, { rejectWithValue }) => {
    try {
      const response = await predictiveAnalyticsService.getHistoricalVsPredictedPerformance(campaignId, metric, timeRange);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch historical vs predicted data');
    }
  }
);

const predictiveAnalyticsSlice = createSlice({
  name: 'predictiveAnalytics',
  initialState,
  reducers: {
    clearPredictionsData(state) {
      state.predictions.data = {};
    },
    clearBudgetRecommendationsData(state) {
      state.budgetRecommendations.data = {};
    },
    clearPerformanceAlertsData(state) {
      state.performanceAlerts.data = {};
    },
    clearHistoricalVsPredictedData(state) {
      state.historicalVsPredicted.data = {
        historical: [],
        predicted: [],
      };
    },
  },
  extraReducers: (builder) => {
    // Performance Predictions reducers
    builder
      .addCase(fetchPredictedPerformance.pending, (state) => {
        state.predictions.loading = true;
        state.predictions.error = null;
      })
      .addCase(fetchPredictedPerformance.fulfilled, (state, action) => {
        state.predictions.loading = false;
        const { campaignId, data } = action.payload;
        state.predictions.data[campaignId] = data;
      })
      .addCase(fetchPredictedPerformance.rejected, (state, action) => {
        state.predictions.loading = false;
        state.predictions.error = action.payload as string;
      });

    // Budget Recommendations reducers
    builder
      .addCase(fetchBudgetRecommendations.pending, (state) => {
        state.budgetRecommendations.loading = true;
        state.budgetRecommendations.error = null;
      })
      .addCase(fetchBudgetRecommendations.fulfilled, (state, action) => {
        state.budgetRecommendations.loading = false;
        const { campaignId, data } = action.payload;
        state.budgetRecommendations.data[campaignId] = data;
      })
      .addCase(fetchBudgetRecommendations.rejected, (state, action) => {
        state.budgetRecommendations.loading = false;
        state.budgetRecommendations.error = action.payload as string;
      });

    // Performance Alerts reducers
    builder
      .addCase(fetchCampaignPerformanceAlerts.pending, (state) => {
        state.performanceAlerts.loading = true;
        state.performanceAlerts.error = null;
      })
      .addCase(fetchCampaignPerformanceAlerts.fulfilled, (state, action) => {
        state.performanceAlerts.loading = false;
        const { campaignId, data } = action.payload;
        state.performanceAlerts.data[campaignId] = data;
      })
      .addCase(fetchCampaignPerformanceAlerts.rejected, (state, action) => {
        state.performanceAlerts.loading = false;
        state.performanceAlerts.error = action.payload as string;
      });

    // Historical vs Predicted performance reducers
    builder
      .addCase(fetchHistoricalVsPredictedPerformance.pending, (state) => {
        state.historicalVsPredicted.loading = true;
        state.historicalVsPredicted.error = null;
      })
      .addCase(fetchHistoricalVsPredictedPerformance.fulfilled, (state, action) => {
        state.historicalVsPredicted.loading = false;
        state.historicalVsPredicted.data = action.payload;
      })
      .addCase(fetchHistoricalVsPredictedPerformance.rejected, (state, action) => {
        state.historicalVsPredicted.loading = false;
        state.historicalVsPredicted.error = action.payload as string;
      });
  },
});

// Selectors
export const selectPredictions = (state: RootState, campaignId: string) => 
  state.predictiveAnalytics.predictions.data[campaignId] || [];

export const selectPredictionsLoading = (state: RootState) => 
  state.predictiveAnalytics.predictions.loading;

export const selectBudgetRecommendation = (state: RootState, campaignId: string) => 
  state.predictiveAnalytics.budgetRecommendations.data[campaignId];

export const selectBudgetRecommendationsLoading = (state: RootState) => 
  state.predictiveAnalytics.budgetRecommendations.loading;

export const selectPerformanceAlerts = (state: RootState, campaignId: string) => 
  state.predictiveAnalytics.performanceAlerts.data[campaignId] || [];

export const selectPerformanceAlertsLoading = (state: RootState) => 
  state.predictiveAnalytics.performanceAlerts.loading;

export const selectHistoricalVsPredictedData = (state: RootState) => 
  state.predictiveAnalytics.historicalVsPredicted.data;

export const selectHistoricalVsPredictedLoading = (state: RootState) => 
  state.predictiveAnalytics.historicalVsPredicted.loading;

export const { 
  clearPredictionsData, 
  clearBudgetRecommendationsData, 
  clearPerformanceAlertsData, 
  clearHistoricalVsPredictedData 
} = predictiveAnalyticsSlice.actions;

export default predictiveAnalyticsSlice.reducer;
