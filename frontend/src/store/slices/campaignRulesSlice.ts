import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as campaignRulesService from '../../services/campaignRulesService';
import { RootState } from '..';
import { 
  CampaignRule, 
  RuleExecutionHistory, 
  NotificationConfig 
} from '../../services/campaignRulesService';

interface CampaignRulesState {
  rules: {
    data: CampaignRule[];
    scheduledRules: CampaignRule[];
    loading: boolean;
    error: string | null;
    selectedRule: CampaignRule | null;
  };
  executionHistory: {
    data: RuleExecutionHistory[];
    loading: boolean;
    error: string | null;
  };
  notifications: {
    data: Record<string, NotificationConfig>;
    loading: boolean;
    error: string | null;
  };
  testResults: {
    data: { would_trigger: boolean; metrics: Record<string, any> } | null;
    loading: boolean;
    error: string | null;
  };
  performanceThresholds: {
    data: Record<string, Record<string, number>>;
    loading: boolean;
    error: string | null;
  };
}

const initialState: CampaignRulesState = {
  rules: {
    data: [],
    scheduledRules: [],
    loading: false,
    error: null,
    selectedRule: null,
  },
  executionHistory: {
    data: [],
    loading: false,
    error: null,
  },
  notifications: {
    data: {},
    loading: false,
    error: null,
  },
  testResults: {
    data: null,
    loading: false,
    error: null,
  },
  performanceThresholds: {
    data: {},
    loading: false,
    error: null,
  },
};

// Async Thunks for Campaign Rules
export const fetchCampaignRules = createAsyncThunk(
  'campaignRules/fetchCampaignRules',
  async (params: string | { campaign_id?: string; status?: string; from_date?: string; to_date?: string } = {}, { rejectWithValue }) => {
    try {
      // Handle string (campaignId) or object (full params)
      const queryParams = typeof params === 'string' ? { campaign_id: params } : params;
      const response = await campaignRulesService.getCampaignRules(queryParams.campaign_id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch campaign rules');
    }
  }
);

export const fetchScheduledRules = createAsyncThunk(
  'campaignRules/fetchScheduledRules',
  async (params: { status?: string; from_date?: string; to_date?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await campaignRulesService.getScheduledRules(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch scheduled rules');
    }
  }
);

export const fetchCampaignRuleById = createAsyncThunk(
  'campaignRules/fetchCampaignRuleById',
  async (ruleId: string, { rejectWithValue }) => {
    try {
      const response = await campaignRulesService.getCampaignRuleById(ruleId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch campaign rule');
    }
  }
);

export const createCampaignRule = createAsyncThunk(
  'campaignRules/createCampaignRule',
  async (rule: Omit<CampaignRule, 'id' | 'created_at' | 'updated_at' | 'last_triggered_at'>, { rejectWithValue }) => {
    try {
      const response = await campaignRulesService.createCampaignRule(rule);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create campaign rule');
    }
  }
);

export const updateCampaignRule = createAsyncThunk(
  'campaignRules/updateCampaignRule',
  async ({ ruleId, rule }: { ruleId: string; rule: Partial<CampaignRule> }, { rejectWithValue }) => {
    try {
      const response = await campaignRulesService.updateCampaignRule(ruleId, rule);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update campaign rule');
    }
  }
);

export const deleteCampaignRule = createAsyncThunk(
  'campaignRules/deleteCampaignRule',
  async (ruleId: string, { rejectWithValue }) => {
    try {
      await campaignRulesService.deleteCampaignRule(ruleId);
      return ruleId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete campaign rule');
    }
  }
);

export const pauseScheduledRule = createAsyncThunk(
  'campaignRules/pauseScheduledRule',
  async (ruleId: string, { rejectWithValue }) => {
    try {
      const response = await campaignRulesService.pauseScheduledRule(ruleId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to pause scheduled rule');
    }
  }
);

export const resumeScheduledRule = createAsyncThunk(
  'campaignRules/resumeScheduledRule',
  async (ruleId: string, { rejectWithValue }) => {
    try {
      const response = await campaignRulesService.resumeScheduledRule(ruleId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resume scheduled rule');
    }
  }
);

export const fetchRuleExecutionHistory = createAsyncThunk(
  'campaignRules/fetchRuleExecutionHistory',
  async (ruleId: string, { rejectWithValue }) => {
    try {
      const response = await campaignRulesService.getRuleExecutionHistory(ruleId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rule execution history');
    }
  }
);

export const fetchCampaignRuleExecutionHistory = createAsyncThunk(
  'campaignRules/fetchCampaignRuleExecutionHistory',
  async (campaignId: string, { rejectWithValue }) => {
    try {
      const response = await campaignRulesService.getCampaignRuleExecutionHistory(campaignId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch campaign rule execution history');
    }
  }
);

export const executeRuleManually = createAsyncThunk(
  'campaignRules/executeRuleManually',
  async (ruleId: string, { rejectWithValue }) => {
    try {
      const response = await campaignRulesService.executeRuleManually(ruleId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to execute rule manually');
    }
  }
);

export const fetchNotificationConfig = createAsyncThunk(
  'campaignRules/fetchNotificationConfig',
  async (ruleId: string, { rejectWithValue }) => {
    try {
      const response = await campaignRulesService.getNotificationConfig(ruleId);
      return { ruleId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notification config');
    }
  }
);

// Keep the old name for backward compatibility
export const getNotificationConfig = fetchNotificationConfig;

export const updateNotificationConfig = createAsyncThunk(
  'campaignRules/updateNotificationConfig',
  async ({ ruleId, config }: { ruleId: string; config: Omit<NotificationConfig, 'rule_id'> }, { rejectWithValue }) => {
    try {
      const response = await campaignRulesService.updateNotificationConfig(ruleId, config);
      return { ruleId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update notification config');
    }
  }
);

export const getCampaignPerformanceThresholds = createAsyncThunk(
  'campaignRules/getCampaignPerformanceThresholds',
  async (campaignId: string, { rejectWithValue }) => {
    try {
      const response = await campaignRulesService.getCampaignPerformanceThresholds(campaignId);
      return { campaignId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch performance thresholds');
    }
  }
);

export const updateCampaignPerformanceThresholds = createAsyncThunk(
  'campaignRules/updateCampaignPerformanceThresholds',
  async ({ campaignId, thresholds }: { campaignId: string; thresholds: Record<string, number> }, { rejectWithValue }) => {
    try {
      const response = await campaignRulesService.updateCampaignPerformanceThresholds(campaignId, thresholds);
      return { campaignId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update performance thresholds');
    }
  }
);

export const testRuleCondition = createAsyncThunk(
  'campaignRules/testRuleCondition',
  async ({ ruleData, campaignId }: { ruleData: Partial<CampaignRule>; campaignId: string }, { rejectWithValue }) => {
    try {
      const response = await campaignRulesService.testRuleCondition(ruleData, campaignId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to test rule condition');
    }
  }
);

const campaignRulesSlice = createSlice({
  name: 'campaignRules',
  initialState,
  reducers: {
    clearSelectedRule(state) {
      state.rules.selectedRule = null;
    },
    clearExecutionHistory(state) {
      state.executionHistory.data = [];
    },
    clearTestResults(state) {
      state.testResults.data = null;
    },
    clearNotificationConfig(state) {
      // This doesn't remove the data, just signals we're not currently viewing it
    },
  },
  extraReducers: (builder) => {
    // Campaign Rules reducers
    builder
      .addCase(fetchCampaignRules.pending, (state) => {
        state.rules.loading = true;
        state.rules.error = null;
      })
      .addCase(fetchCampaignRules.fulfilled, (state, action) => {
        state.rules.loading = false;
        state.rules.data = action.payload;
      })
      .addCase(fetchCampaignRules.rejected, (state, action) => {
        state.rules.loading = false;
        state.rules.error = action.payload as string;
      })
      .addCase(fetchScheduledRules.pending, (state) => {
        state.rules.loading = true;
        state.rules.error = null;
      })
      .addCase(fetchScheduledRules.fulfilled, (state, action) => {
        state.rules.loading = false;
        state.rules.scheduledRules = action.payload;
      })
      .addCase(fetchScheduledRules.rejected, (state, action) => {
        state.rules.loading = false;
        state.rules.error = action.payload as string;
      })
      .addCase(fetchCampaignRuleById.pending, (state) => {
        state.rules.loading = true;
        state.rules.error = null;
      })
      .addCase(fetchCampaignRuleById.fulfilled, (state, action) => {
        state.rules.loading = false;
        state.rules.selectedRule = action.payload;
      })
      .addCase(fetchCampaignRuleById.rejected, (state, action) => {
        state.rules.loading = false;
        state.rules.error = action.payload as string;
      })
      .addCase(createCampaignRule.fulfilled, (state, action) => {
        state.rules.data.push(action.payload);
        if (action.payload.schedule_type === 'one_time' || action.payload.schedule_type === 'recurring') {
          state.rules.scheduledRules.push(action.payload);
        }
      })
      .addCase(updateCampaignRule.fulfilled, (state, action) => {
        const index = state.rules.data.findIndex(rule => rule.id === action.payload.id);
        if (index !== -1) {
          state.rules.data[index] = action.payload;
        }
        
        const scheduledIndex = state.rules.scheduledRules.findIndex(rule => rule.id === action.payload.id);
        if (scheduledIndex !== -1) {
          state.rules.scheduledRules[scheduledIndex] = action.payload;
        } else if (action.payload.schedule_type === 'one_time' || action.payload.schedule_type === 'recurring') {
          state.rules.scheduledRules.push(action.payload);
        }
        
        if (state.rules.selectedRule?.id === action.payload.id) {
          state.rules.selectedRule = action.payload;
        }
      })
      .addCase(deleteCampaignRule.fulfilled, (state, action) => {
        state.rules.data = state.rules.data.filter(rule => rule.id !== action.payload);
        state.rules.scheduledRules = state.rules.scheduledRules.filter(rule => rule.id !== action.payload);
        if (state.rules.selectedRule?.id === action.payload) {
          state.rules.selectedRule = null;
        }
      })
      .addCase(pauseScheduledRule.fulfilled, (state, action) => {
        const index = state.rules.data.findIndex(rule => rule.id === action.payload.id);
        if (index !== -1) {
          state.rules.data[index] = action.payload;
        }
        
        const scheduledIndex = state.rules.scheduledRules.findIndex(rule => rule.id === action.payload.id);
        if (scheduledIndex !== -1) {
          state.rules.scheduledRules[scheduledIndex] = action.payload;
        }
      })
      .addCase(resumeScheduledRule.fulfilled, (state, action) => {
        const index = state.rules.data.findIndex(rule => rule.id === action.payload.id);
        if (index !== -1) {
          state.rules.data[index] = action.payload;
        }
        
        const scheduledIndex = state.rules.scheduledRules.findIndex(rule => rule.id === action.payload.id);
        if (scheduledIndex !== -1) {
          state.rules.scheduledRules[scheduledIndex] = action.payload;
        }
      })
      
      // Execution History reducers
      .addCase(fetchRuleExecutionHistory.pending, (state) => {
        state.executionHistory.loading = true;
        state.executionHistory.error = null;
      })
      .addCase(fetchRuleExecutionHistory.fulfilled, (state, action) => {
        state.executionHistory.loading = false;
        state.executionHistory.data = action.payload;
      })
      .addCase(fetchRuleExecutionHistory.rejected, (state, action) => {
        state.executionHistory.loading = false;
        state.executionHistory.error = action.payload as string;
      })
      .addCase(fetchCampaignRuleExecutionHistory.pending, (state) => {
        state.executionHistory.loading = true;
        state.executionHistory.error = null;
      })
      .addCase(fetchCampaignRuleExecutionHistory.fulfilled, (state, action) => {
        state.executionHistory.loading = false;
        state.executionHistory.data = action.payload;
      })
      .addCase(fetchCampaignRuleExecutionHistory.rejected, (state, action) => {
        state.executionHistory.loading = false;
        state.executionHistory.error = action.payload as string;
      })
      .addCase(executeRuleManually.fulfilled, (state, action) => {
        state.executionHistory.data.unshift(action.payload);
      })
      
      // Notification Config reducers - we only need one set since fetchNotificationConfig and getNotificationConfig reference the same thunk
      .addCase(fetchNotificationConfig.pending, (state) => {
        state.notifications.loading = true;
        state.notifications.error = null;
      })
      .addCase(fetchNotificationConfig.fulfilled, (state, action) => {
        state.notifications.loading = false;
        state.notifications.data[action.payload.ruleId] = action.payload.data;
      })
      .addCase(fetchNotificationConfig.rejected, (state, action) => {
        state.notifications.loading = false;
        state.notifications.error = action.payload as string;
      })
      .addCase(updateNotificationConfig.fulfilled, (state, action) => {
        state.notifications.data[action.payload.ruleId] = action.payload.data;
      })
      
      // Performance Thresholds reducers
      .addCase(getCampaignPerformanceThresholds.pending, (state) => {
        state.performanceThresholds.loading = true;
        state.performanceThresholds.error = null;
      })
      .addCase(getCampaignPerformanceThresholds.fulfilled, (state, action) => {
        state.performanceThresholds.loading = false;
        state.performanceThresholds.data[action.payload.campaignId] = action.payload.data;
      })
      .addCase(getCampaignPerformanceThresholds.rejected, (state, action) => {
        state.performanceThresholds.loading = false;
        state.performanceThresholds.error = action.payload as string;
      })
      .addCase(updateCampaignPerformanceThresholds.fulfilled, (state, action) => {
        state.performanceThresholds.data[action.payload.campaignId] = action.payload.data;
      })
      
      // Test Rule Condition reducers
      .addCase(testRuleCondition.pending, (state) => {
        state.testResults.loading = true;
        state.testResults.error = null;
      })
      .addCase(testRuleCondition.fulfilled, (state, action) => {
        state.testResults.loading = false;
        state.testResults.data = action.payload;
      })
      .addCase(testRuleCondition.rejected, (state, action) => {
        state.testResults.loading = false;
        state.testResults.error = action.payload as string;
      });
  },
});

// Selectors
export const selectCampaignRules = (state: RootState) => state.campaignRules.rules.data;
export const selectScheduledRules = (state: RootState) => state.campaignRules.rules.scheduledRules;
export const selectCampaignRulesLoading = (state: RootState) => state.campaignRules.rules.loading;
export const selectCampaignRulesError = (state: RootState) => state.campaignRules.rules.error;
export const selectSelectedRule = (state: RootState) => state.campaignRules.rules.selectedRule;

export const selectRuleExecutionHistory = (state: RootState) => state.campaignRules.executionHistory.data;
export const selectRuleExecutionHistoryLoading = (state: RootState) => state.campaignRules.executionHistory.loading;
export const selectRuleExecutionHistoryError = (state: RootState) => state.campaignRules.executionHistory.error;

export const selectNotificationConfig = (state: RootState) => {
  // Get the first rule ID that has notification data
  const ruleIds = Object.keys(state.campaignRules.notifications.data);
  if (ruleIds.length > 0) {
    return state.campaignRules.notifications.data[ruleIds[0]];
  }
  return null;
};
export const selectNotificationConfigLoading = (state: RootState) => state.campaignRules.notifications.loading;
export const selectNotificationsLoading = selectNotificationConfigLoading; // Alias for backward compatibility
export const selectNotificationConfigError = (state: RootState) => state.campaignRules.notifications.error;

export const selectPerformanceThresholds = (state: RootState, campaignId: string) => 
  state.campaignRules.performanceThresholds.data[campaignId];
export const selectPerformanceThresholdsLoading = (state: RootState) => 
  state.campaignRules.performanceThresholds.loading;

export const selectTestResults = (state: RootState) => state.campaignRules.testResults.data;
export const selectTestResultsLoading = (state: RootState) => state.campaignRules.testResults.loading;

export const { 
  clearSelectedRule, 
  clearExecutionHistory, 
  clearTestResults,
  clearNotificationConfig
} = campaignRulesSlice.actions;

export default campaignRulesSlice.reducer;