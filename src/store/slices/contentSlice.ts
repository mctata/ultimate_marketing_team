import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as contentService from '../../services/contentService';
import { RootState } from '..';

// Types from contentService
import { 
  ContentDraft, 
  ContentTopic, 
  ContentCalendarItem,
  ABTest,
  ABTestVariant,
  ContentPerformance
} from '../../services/contentService';

interface ContentState {
  drafts: {
    data: ContentDraft[];
    loading: boolean;
    error: string | null;
    selectedDraft: ContentDraft | null;
  };
  topics: {
    data: ContentTopic[];
    loading: boolean;
    error: string | null;
  };
  calendar: {
    data: ContentCalendarItem[];
    loading: boolean;
    error: string | null;
  };
  abTests: {
    data: ABTest[];
    loading: boolean;
    error: string | null;
    selectedTest: ABTest | null;
    variants: ABTestVariant[];
  };
  performance: {
    data: ContentPerformance[];
    overall: Record<string, number>;
    loading: boolean;
    error: string | null;
  };
  filters: {
    brandId?: string;
    draftStatus?: string;
    dateRange?: { startDate: string; endDate: string };
  };
}

const initialState: ContentState = {
  drafts: {
    data: [],
    loading: false,
    error: null,
    selectedDraft: null,
  },
  topics: {
    data: [],
    loading: false,
    error: null,
  },
  calendar: {
    data: [],
    loading: false,
    error: null,
  },
  abTests: {
    data: [],
    loading: false,
    error: null,
    selectedTest: null,
    variants: [],
  },
  performance: {
    data: [],
    overall: {},
    loading: false,
    error: null,
  },
  filters: {},
};

// Async Thunks
export const fetchDrafts = createAsyncThunk(
  'content/fetchDrafts',
  async (params: { brandId?: string; status?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await contentService.getDrafts({ 
        brand_id: params.brandId, 
        status: params.status 
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch drafts');
    }
  }
);

export const fetchDraftById = createAsyncThunk(
  'content/fetchDraftById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await contentService.getDraftById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch draft');
    }
  }
);

export const createDraft = createAsyncThunk(
  'content/createDraft',
  async (draft: Omit<ContentDraft, 'id' | 'created_at' | 'updated_at'>, { rejectWithValue }) => {
    try {
      const response = await contentService.createDraft(draft);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create draft');
    }
  }
);

export const updateDraft = createAsyncThunk(
  'content/updateDraft',
  async ({ id, draft }: { id: string; draft: Partial<ContentDraft> }, { rejectWithValue }) => {
    try {
      const response = await contentService.updateDraft(id, draft);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update draft');
    }
  }
);

export const deleteDraft = createAsyncThunk(
  'content/deleteDraft',
  async (id: string, { rejectWithValue }) => {
    try {
      await contentService.deleteDraft(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete draft');
    }
  }
);

export const fetchTopics = createAsyncThunk(
  'content/fetchTopics',
  async (brandId?: string, { rejectWithValue }) => {
    try {
      const response = await contentService.getTopics(brandId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch topics');
    }
  }
);

export const fetchCalendarItems = createAsyncThunk(
  'content/fetchCalendarItems',
  async (params: { brandId?: string; startDate?: string; endDate?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await contentService.getCalendarItems({
        brand_id: params.brandId,
        start_date: params.startDate,
        end_date: params.endDate
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch calendar');
    }
  }
);

export const fetchABTests = createAsyncThunk(
  'content/fetchABTests',
  async (contentId?: string, { rejectWithValue }) => {
    try {
      const response = await contentService.getABTests(contentId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch AB tests');
    }
  }
);

export const fetchABTestById = createAsyncThunk(
  'content/fetchABTestById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await contentService.getABTestById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch AB test');
    }
  }
);

export const fetchABTestVariants = createAsyncThunk(
  'content/fetchABTestVariants',
  async (testId: string, { rejectWithValue }) => {
    try {
      const response = await contentService.getABTestVariants(testId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch AB test variants');
    }
  }
);

export const fetchContentPerformance = createAsyncThunk(
  'content/fetchContentPerformance',
  async ({ contentId, timeRange }: { contentId: string; timeRange?: { start_date: string; end_date: string } }, { rejectWithValue }) => {
    try {
      const response = await contentService.getContentPerformance(contentId, timeRange);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch content performance');
    }
  }
);

export const fetchOverallPerformance = createAsyncThunk(
  'content/fetchOverallPerformance',
  async ({ brandId, timeRange }: { brandId?: string; timeRange?: { start_date: string; end_date: string } }, { rejectWithValue }) => {
    try {
      const response = await contentService.getOverallPerformance(brandId, timeRange);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch overall performance');
    }
  }
);

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<ContentState['filters']>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedDraft(state) {
      state.drafts.selectedDraft = null;
    },
    clearSelectedABTest(state) {
      state.abTests.selectedTest = null;
      state.abTests.variants = [];
    },
  },
  extraReducers: (builder) => {
    // Drafts
    builder
      .addCase(fetchDrafts.pending, (state) => {
        state.drafts.loading = true;
        state.drafts.error = null;
      })
      .addCase(fetchDrafts.fulfilled, (state, action) => {
        state.drafts.loading = false;
        state.drafts.data = action.payload;
      })
      .addCase(fetchDrafts.rejected, (state, action) => {
        state.drafts.loading = false;
        state.drafts.error = action.payload as string;
      })
      .addCase(fetchDraftById.pending, (state) => {
        state.drafts.loading = true;
        state.drafts.error = null;
      })
      .addCase(fetchDraftById.fulfilled, (state, action) => {
        state.drafts.loading = false;
        state.drafts.selectedDraft = action.payload;
      })
      .addCase(fetchDraftById.rejected, (state, action) => {
        state.drafts.loading = false;
        state.drafts.error = action.payload as string;
      })
      .addCase(createDraft.fulfilled, (state, action) => {
        state.drafts.data.unshift(action.payload);
        state.drafts.selectedDraft = action.payload;
      })
      .addCase(updateDraft.fulfilled, (state, action) => {
        const index = state.drafts.data.findIndex(draft => draft.id === action.payload.id);
        if (index !== -1) {
          state.drafts.data[index] = action.payload;
        }
        state.drafts.selectedDraft = action.payload;
      })
      .addCase(deleteDraft.fulfilled, (state, action) => {
        state.drafts.data = state.drafts.data.filter(draft => draft.id !== action.payload);
        if (state.drafts.selectedDraft?.id === action.payload) {
          state.drafts.selectedDraft = null;
        }
      })
    
    // Topics
    builder
      .addCase(fetchTopics.pending, (state) => {
        state.topics.loading = true;
        state.topics.error = null;
      })
      .addCase(fetchTopics.fulfilled, (state, action) => {
        state.topics.loading = false;
        state.topics.data = action.payload;
      })
      .addCase(fetchTopics.rejected, (state, action) => {
        state.topics.loading = false;
        state.topics.error = action.payload as string;
      })
    
    // Calendar
    builder
      .addCase(fetchCalendarItems.pending, (state) => {
        state.calendar.loading = true;
        state.calendar.error = null;
      })
      .addCase(fetchCalendarItems.fulfilled, (state, action) => {
        state.calendar.loading = false;
        state.calendar.data = action.payload;
      })
      .addCase(fetchCalendarItems.rejected, (state, action) => {
        state.calendar.loading = false;
        state.calendar.error = action.payload as string;
      })
    
    // AB Tests
    builder
      .addCase(fetchABTests.pending, (state) => {
        state.abTests.loading = true;
        state.abTests.error = null;
      })
      .addCase(fetchABTests.fulfilled, (state, action) => {
        state.abTests.loading = false;
        state.abTests.data = action.payload;
      })
      .addCase(fetchABTests.rejected, (state, action) => {
        state.abTests.loading = false;
        state.abTests.error = action.payload as string;
      })
      .addCase(fetchABTestById.fulfilled, (state, action) => {
        state.abTests.selectedTest = action.payload;
      })
      .addCase(fetchABTestVariants.fulfilled, (state, action) => {
        state.abTests.variants = action.payload;
      })
    
    // Performance
    builder
      .addCase(fetchContentPerformance.pending, (state) => {
        state.performance.loading = true;
        state.performance.error = null;
      })
      .addCase(fetchContentPerformance.fulfilled, (state, action) => {
        state.performance.loading = false;
        state.performance.data = action.payload;
      })
      .addCase(fetchContentPerformance.rejected, (state, action) => {
        state.performance.loading = false;
        state.performance.error = action.payload as string;
      })
      .addCase(fetchOverallPerformance.fulfilled, (state, action) => {
        state.performance.overall = action.payload;
      });
  },
});

// Selectors
export const selectDrafts = (state: RootState) => state.content.drafts.data;
export const selectDraftsLoading = (state: RootState) => state.content.drafts.loading;
export const selectDraftsError = (state: RootState) => state.content.drafts.error;
export const selectSelectedDraft = (state: RootState) => state.content.drafts.selectedDraft;

export const selectTopics = (state: RootState) => state.content.topics.data;
export const selectTopicsLoading = (state: RootState) => state.content.topics.loading;

export const selectCalendarItems = (state: RootState) => state.content.calendar.data;
export const selectCalendarLoading = (state: RootState) => state.content.calendar.loading;

export const selectABTests = (state: RootState) => state.content.abTests.data;
export const selectABTestsLoading = (state: RootState) => state.content.abTests.loading;
export const selectSelectedABTest = (state: RootState) => state.content.abTests.selectedTest;
export const selectABTestVariants = (state: RootState) => state.content.abTests.variants;

export const selectContentPerformance = (state: RootState) => state.content.performance.data;
export const selectOverallPerformance = (state: RootState) => state.content.performance.overall;
export const selectPerformanceLoading = (state: RootState) => state.content.performance.loading;

export const selectContentFilters = (state: RootState) => state.content.filters;

export const { setFilters, clearSelectedDraft, clearSelectedABTest } = contentSlice.actions;

export default contentSlice.reducer;