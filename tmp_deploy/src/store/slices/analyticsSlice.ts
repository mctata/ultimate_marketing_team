import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Define types for analytics data
interface TemplateAnalytics {
  totalUsage: number;
  usageGrowth: number;
  avgConversionRate: number;
  conversionGrowth: number;
  avgEngagementScore: number;
  engagementGrowth: number;
  avgCompletionTime: number;
  completionTimeGrowth: number;
  usageOverTime: Array<{ date: string; count: number }>;
  usageByContentType: Array<{ name: string; value: number }>;
  usageByPlatform: Array<{ name: string; value: number }>;
}

interface TopPerformingTemplate {
  templateId: string;
  templateName: string;
  usageCount: number;
  conversionRate: number;
  engagement: number;
  completionTime: number;
}

interface IndustryPerformance {
  industry: string;
  usageCount: number;
  conversionRate: number;
  engagementScore: number;
}

interface AnalyticsState {
  templateAnalytics: TemplateAnalytics | null;
  topPerformingTemplates: TopPerformingTemplate[];
  industryPerformance: IndustryPerformance[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: AnalyticsState = {
  templateAnalytics: null,
  topPerformingTemplates: [],
  industryPerformance: [],
  loading: false,
  error: null
};

// Mock API responses for development
// In a real implementation, these would be replaced with actual API calls
const getMockTemplateAnalytics = (timeRange: string): Promise<TemplateAnalytics> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalUsage: 1248,
        usageGrowth: 15.3,
        avgConversionRate: 8.7,
        conversionGrowth: 2.1,
        avgEngagementScore: 7.4,
        engagementGrowth: 5.8,
        avgCompletionTime: 12.5,
        completionTimeGrowth: -3.2,
        usageOverTime: [
          { date: '2023-04-01', count: 35 },
          { date: '2023-04-02', count: 42 },
          { date: '2023-04-03', count: 38 },
          { date: '2023-04-04', count: 40 },
          { date: '2023-04-05', count: 45 },
          { date: '2023-04-06', count: 48 },
          { date: '2023-04-07', count: 52 },
          { date: '2023-04-08', count: 60 },
          { date: '2023-04-09', count: 58 },
          { date: '2023-04-10', count: 65 },
        ],
        usageByContentType: [
          { name: 'Social Media', value: 450 },
          { name: 'Email', value: 320 },
          { name: 'Blog Posts', value: 280 },
          { name: 'Ads', value: 198 },
        ],
        usageByPlatform: [
          { name: 'Instagram', value: 320 },
          { name: 'Facebook', value: 250 },
          { name: 'Twitter', value: 180 },
          { name: 'LinkedIn', value: 150 },
          { name: 'Email', value: 350 },
        ]
      });
    }, 500);
  });
};

const getMockTopPerformingTemplates = (timeRange: string): Promise<TopPerformingTemplate[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          templateId: '1',
          templateName: 'Instagram Carousel - Health Tips',
          usageCount: 145,
          conversionRate: 8.2,
          engagement: 7.8,
          completionTime: 10.2
        },
        {
          templateId: '2',
          templateName: 'Email Newsletter - Product Updates',
          usageCount: 120,
          conversionRate: 9.5,
          engagement: 6.9,
          completionTime: 15.6
        },
        {
          templateId: '3',
          templateName: 'Blog Post - How-To Guide',
          usageCount: 98,
          conversionRate: 7.8,
          engagement: 8.1,
          completionTime: 22.3
        },
        {
          templateId: '4',
          templateName: 'Facebook Ad - Limited Time Offer',
          usageCount: 85,
          conversionRate: 10.2,
          engagement: 7.5,
          completionTime: 8.7
        },
        {
          templateId: '5',
          templateName: 'Twitter Thread - Industry Insights',
          usageCount: 72,
          conversionRate: 6.5,
          engagement: 8.3,
          completionTime: 12.1
        },
      ]);
    }, 700);
  });
};

const getMockIndustryPerformance = (timeRange: string): Promise<IndustryPerformance[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          industry: 'Health & Wellness',
          usageCount: 325,
          conversionRate: 9.2,
          engagementScore: 8.4
        },
        {
          industry: 'Food & Beverage',
          usageCount: 280,
          conversionRate: 8.7,
          engagementScore: 7.9
        },
        {
          industry: 'Professional Services',
          usageCount: 230,
          conversionRate: 7.5,
          engagementScore: 7.1
        },
        {
          industry: 'Home Services',
          usageCount: 210,
          conversionRate: 8.1,
          engagementScore: 7.6
        },
        {
          industry: 'Education & Training',
          usageCount: 185,
          conversionRate: 6.8,
          engagementScore: 7.3
        },
      ]);
    }, 600);
  });
};

// Async thunks
export const fetchTemplateAnalytics = createAsyncThunk(
  'analytics/fetchTemplateAnalytics',
  async (timeRange: string, { rejectWithValue }) => {
    try {
      return await getMockTemplateAnalytics(timeRange);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch template analytics');
    }
  }
);

export const fetchTopPerformingTemplates = createAsyncThunk(
  'analytics/fetchTopPerformingTemplates',
  async (timeRange: string, { rejectWithValue }) => {
    try {
      return await getMockTopPerformingTemplates(timeRange);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch top performing templates');
    }
  }
);

export const fetchIndustryPerformance = createAsyncThunk(
  'analytics/fetchIndustryPerformance',
  async (timeRange: string, { rejectWithValue }) => {
    try {
      return await getMockIndustryPerformance(timeRange);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch industry performance');
    }
  }
);

// Create slice
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalyticsError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Handle fetchTemplateAnalytics
    builder.addCase(fetchTemplateAnalytics.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTemplateAnalytics.fulfilled, (state, action: PayloadAction<TemplateAnalytics>) => {
      state.loading = false;
      state.templateAnalytics = action.payload;
    });
    builder.addCase(fetchTemplateAnalytics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Handle fetchTopPerformingTemplates
    builder.addCase(fetchTopPerformingTemplates.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTopPerformingTemplates.fulfilled, (state, action: PayloadAction<TopPerformingTemplate[]>) => {
      state.loading = false;
      state.topPerformingTemplates = action.payload;
    });
    builder.addCase(fetchTopPerformingTemplates.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Handle fetchIndustryPerformance
    builder.addCase(fetchIndustryPerformance.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchIndustryPerformance.fulfilled, (state, action: PayloadAction<IndustryPerformance[]>) => {
      state.loading = false;
      state.industryPerformance = action.payload;
    });
    builder.addCase(fetchIndustryPerformance.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

// Export actions
export const { clearAnalyticsError } = analyticsSlice.actions;

// Export selectors
export const selectTemplateAnalytics = (state: RootState) => state.analytics.templateAnalytics;
export const selectTopPerformingTemplates = (state: RootState) => state.analytics.topPerformingTemplates;
export const selectIndustryPerformance = (state: RootState) => state.analytics.industryPerformance;
export const selectTemplateAnalyticsLoading = (state: RootState) => state.analytics.loading;
export const selectTemplateAnalyticsError = (state: RootState) => state.analytics.error;

// Export reducer
export default analyticsSlice.reducer;