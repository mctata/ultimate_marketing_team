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
}

const initialState: CampaignRulesState = {
  rules: {
    data: [],
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
};

// Async Thunks for Campaign Rules
export const fetchCampaignRules = createAsyncThunk(
  'campaignRules/fetchCampaignRules',
  async (campaignId: string | undefined, { rejectWithValue }) => {
    try {
      const response = await campaignRulesService.getCampaignRules(campaignId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch campaign rules');
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
      })
      .addCase(updateCampaignRule.fulfilled, (state, action) => {
        const index = state.rules.data.findIndex(rule => rule.id === action.payload.id);
        if (index !== -1) {
          state.rules.data[index] = action.payload;
        }
        if (state.rules.selectedRule?.id === action.payload.id) {
          state.rules.selectedRule = action.payload;
        }
      })
      .addCase(deleteCampaignRule.fulfilled, (state, action) => {
        state.rules.data = state.rules.data.filter(rule => rule.id !== action.payload);
        if (state.rules.selectedRule?.id === action.payload) {
          state.rules.selectedRule = null;
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
      
      // Notification Config reducers
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
export const selectCampaignRulesLoading = (state: RootState) => state.campaignRules.rules.loading;
export const selectCampaignRulesError = (state: RootState) => state.campaignRules.rules.error;
export const selectSelectedRule = (state: RootState) => state.campaignRules.rules.selectedRule;

export const selectRuleExecutionHistory = (state: RootState) => state.campaignRules.executionHistory.data;
export const selectRuleExecutionHistoryLoading = (state: RootState) => state.campaignRules.executionHistory.loading;

export const selectNotificationConfig = (state: RootState, ruleId: string) => 
  state.campaignRules.notifications.data[ruleId];
export const selectNotificationsLoading = (state: RootState) => state.campaignRules.notifications.loading;

export const selectTestResults = (state: RootState) => state.campaignRules.testResults.data;
export const selectTestResultsLoading = (state: RootState) => state.campaignRules.testResults.loading;

export const { clearSelectedRule, clearExecutionHistory, clearTestResults } = campaignRulesSlice.actions;

export default campaignRulesSlice.reducer;
