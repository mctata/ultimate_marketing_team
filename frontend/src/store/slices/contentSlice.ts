import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../index';
import contentCalendarService, { contentCalendarService as calendarService } from '../../services/contentCalendarService';
import contentService, { ContentPerformance } from '../../services/contentService';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content: string;
  brandId: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  type: 'blog' | 'social' | 'email' | 'ad' | 'other';
  scheduledDate?: string;
  publishedDate?: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
}

interface CalendarItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  brandId: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  contentType: 'blog' | 'social' | 'email' | 'ad' | 'other';
  platform?: string[];
  scheduledDate: string;
  publishedDate?: string;
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
    endAfter?: number;
  };
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
}

interface CalendarInsight {
  id: string;
  type: 'critical' | 'warning' | 'suggestion';
  message: string;
  affectedItems?: string[];
  date?: string;
  action?: string;
}

interface BestTimeRecommendation {
  platform: string;
  day_of_week: number;
  dayOfWeek: string;
  hour_of_day: number;
  timeOfDay: string;
  average_engagement: number;
  engagementScore: number;
  confidence: number;
}

// API response interface
interface CalendarItemApiResponse {
  id: number;
  project_id: number;
  content_draft_id: number | null;
  scheduled_date: string;
  published_date?: string | null;
  status: string;
  content_type: string;
  platform?: string[] | string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

interface CalendarState {
  items: Record<string, CalendarItem>; // Keyed by ID for faster lookup
  itemsByDate: Record<string, string[]>; // Date string -> array of IDs
  insights: CalendarInsight[];
  bestTimeRecommendations: BestTimeRecommendation[];
  lastFetched: Record<string, number>; // Date range string -> timestamp
  isLoading: boolean;
  error: string | null;
}

interface ContentState {
  items: ContentItem[];
  selectedContent: ContentItem | null;
  selectedDraft: ContentItem | null;
  draftsError: string | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    type?: string;
    brandId?: string;
    searchQuery?: string;
  };
  calendar: CalendarState;
  performance: {
    data: ContentPerformance[];
    isLoading: boolean;
    error: string | null;
  };
}

const initialState: ContentState = {
  items: [],
  selectedContent: null,
  selectedDraft: null,
  draftsError: null,
  isLoading: false,
  error: null,
  filters: {},
  calendar: {
    items: {},
    itemsByDate: {},
    insights: [],
    bestTimeRecommendations: [],
    lastFetched: {},
    isLoading: false,
    error: null
  },
  performance: {
    data: [],
    isLoading: false,
    error: null
  }
};

interface DateRangeParam {
  startDate: string;
  endDate: string;
  force?: boolean;
}

interface CalendarItemsResponse {
  items: CalendarItem[];
  dateRange: string;
}

// Async thunks for calendar operations
export const fetchCalendarItems = createAsyncThunk<CalendarItemsResponse | null, DateRangeParam, { 
  rejectValue: string;
  state: RootState;
}>(
  'content/fetchCalendarItems',
  async (dateRange: DateRangeParam, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const rangeKey = `${dateRange.startDate}_${dateRange.endDate}`;
      const lastFetched = state.content.calendar.lastFetched[rangeKey] || 0;
      const CACHE_TTL = 60 * 1000; // 1 minute cache time
      
      // Use cached data if it's still fresh and force is not true
      if (!dateRange.force && (Date.now() - lastFetched < CACHE_TTL)) {
        return null; // Skip API call, use cached data
      }
      
      const response = await calendarService.getCalendarEntries({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      return {
        items: response.data,
        dateRange: rangeKey
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch calendar items');
    }
  }
);

export const fetchCalendarInsights = createAsyncThunk<CalendarInsight[], string, { rejectValue: string }>(
  'content/fetchCalendarInsights',
  async (projectId: string, { rejectWithValue }) => {
    try {
      // Change brandId parameter to project_id to match API expectations
      const response = await calendarService.getCalendarInsights(projectId);
      return response.data;
    } catch (error) {
      console.error('Error fetching calendar insights:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch calendar insights');
    }
  }
);

export const fetchBestTimeRecommendations = createAsyncThunk<BestTimeRecommendation[], string, { rejectValue: string }>(
  'content/fetchBestTimeRecommendations',
  async (projectId: string, { rejectWithValue }) => {
    try {
      // Change brandId parameter to project_id to match API expectations
      const response = await calendarService.getBestTimeRecommendations(projectId);
      return response;
    } catch (error) {
      console.error('Error fetching best time recommendations:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch best time recommendations');
    }
  }
);

interface ScheduleItemRequest {
  project_id: number;
  content_draft_id: number | null;
  scheduled_date: string;
  status: string;
  platform?: string;
  content_type: string;
}

export const createCalendarItem = createAsyncThunk<any, Omit<CalendarItem, 'id' | 'createdAt' | 'updatedAt'>, { rejectValue: string }>(
  'content/createCalendarItem',
  async (item: Omit<CalendarItem, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      // Convert to ScheduleItemRequest format
      const scheduleItem: ScheduleItemRequest = {
        project_id: parseInt(item.brandId),
        content_draft_id: null,
        scheduled_date: item.scheduledDate,
        status: item.status,
        platform: item.platform ? item.platform.join(',') : undefined,
        content_type: item.contentType
      };
      
      const response = await calendarService.createCalendarEntry(scheduleItem);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create calendar item');
    }
  }
);

interface CalendarItemUpdateRequest {
  status: string;
  scheduled_date: string;
  platform?: string;
  content_type: string;
}

export const updateCalendarItem = createAsyncThunk<any, CalendarItem, { rejectValue: string }>(
  'content/updateCalendarItem',
  async (item: CalendarItem, { rejectWithValue }) => {
    try {
      const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
      
      // Convert to the expected format for the API
      const updates: CalendarItemUpdateRequest = {
        status: item.status,
        scheduled_date: item.scheduledDate,
        platform: item.platform ? item.platform.join(',') : undefined,
        content_type: item.contentType
      };
      
      const response = await calendarService.updateCalendarEntry(itemId, updates);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update calendar item');
    }
  }
);

export const deleteCalendarItem = createAsyncThunk<string, string, { rejectValue: string }>(
  'content/deleteCalendarItem',
  async (itemId: string, { rejectWithValue }) => {
    try {
      const numericId = parseInt(itemId);
      await calendarService.deleteCalendarEntry(numericId);
      return itemId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete calendar item');
    }
  }
);

export const publishCalendarItem = createAsyncThunk<CalendarItemApiResponse, string, { rejectValue: string }>(
  'content/publishCalendarItem',
  async (itemId: string, { rejectWithValue }) => {
    try {
      const response = await calendarService.publishCalendarEntry(itemId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to publish calendar item');
    }
  }
);

// Content Draft Thunks
export const fetchDraftById = createAsyncThunk<ContentItem, string, { rejectValue: string }>(
  'content/fetchDraftById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await contentService.getDraftById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch draft content');
    }
  }
);

// Content Performance Thunks
interface ContentPerformanceParams {
  contentId: string;
  timeRange: {
    start_date: string;
    end_date: string;
  };
}

export const fetchContentPerformance = createAsyncThunk<
  ContentPerformance[],
  ContentPerformanceParams,
  { rejectValue: string }
>(
  'content/fetchContentPerformance',
  async ({ contentId, timeRange }, { rejectWithValue }) => {
    try {
      const response = await contentService.getContentPerformance(contentId, timeRange);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch content performance data');
    }
  }
);

// Helper to organize calendar items by date
const organizeCalendarItemsByDate = (items: CalendarItem[]) => {
  const itemsRecord: Record<string, CalendarItem> = {};
  const itemsByDate: Record<string, string[]> = {};
  
  items.forEach(item => {
    // Add to items record
    itemsRecord[item.id] = item;
    
    // Add to items by date
    const date = item.scheduledDate.split('T')[0]; // Just the date part
    if (!itemsByDate[date]) {
      itemsByDate[date] = [];
    }
    itemsByDate[date].push(item.id);
  });
  
  return { itemsRecord, itemsByDate };
};

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    // Original content reducers
    fetchContentStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchContentSuccess: (state, action: PayloadAction<ContentItem[]>) => {
      state.isLoading = false;
      state.items = action.payload;
    },
    fetchContentFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    selectContent: (state, action: PayloadAction<string>) => {
      state.selectedContent = state.items.find(item => item.id === action.payload) || null;
    },
    clearSelectedContent: (state) => {
      state.selectedContent = null;
    },
    createContentStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    createContentSuccess: (state, action: PayloadAction<ContentItem>) => {
      state.isLoading = false;
      state.items.push(action.payload);
    },
    createContentFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateContentItem: (state, action: PayloadAction<ContentItem>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.selectedContent && state.selectedContent.id === action.payload.id) {
        state.selectedContent = action.payload;
      }
    },
    updateContentStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    updateContentSuccess: (state, action: PayloadAction<ContentItem>) => {
      state.isLoading = false;
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.selectedContent && state.selectedContent.id === action.payload.id) {
        state.selectedContent = action.payload;
      }
    },
    updateContentFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    deleteContentStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    deleteContentSuccess: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.items = state.items.filter(item => item.id !== action.payload);
      if (state.selectedContent && state.selectedContent.id === action.payload) {
        state.selectedContent = null;
      }
    },
    deleteContentFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setContentFilters: (state, action: PayloadAction<Partial<ContentState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearContentFilters: (state) => {
      state.filters = {};
    },
    
    // Calendar-specific reducers for optimistic updates
    addCalendarItemOptimistic: (state, action: PayloadAction<CalendarItem>) => {
      const item = action.payload;
      // Add to items record
      state.calendar.items[item.id] = item;
      
      // Add to items by date
      const date = item.scheduledDate.split('T')[0]; // Just the date part
      if (!state.calendar.itemsByDate[date]) {
        state.calendar.itemsByDate[date] = [];
      }
      state.calendar.itemsByDate[date].push(item.id);
    },
    updateCalendarItemOptimistic: (state, action: PayloadAction<CalendarItem>) => {
      const item = action.payload;
      const existingItem = state.calendar.items[item.id];
      
      if (existingItem) {
        // If the scheduled date changed, we need to update itemsByDate
        if (existingItem.scheduledDate !== item.scheduledDate) {
          // Remove from old date
          const oldDate = existingItem.scheduledDate.split('T')[0];
          if (state.calendar.itemsByDate[oldDate]) {
            state.calendar.itemsByDate[oldDate] = state.calendar.itemsByDate[oldDate]
              .filter(id => id !== item.id);
          }
          
          // Add to new date
          const newDate = item.scheduledDate.split('T')[0];
          if (!state.calendar.itemsByDate[newDate]) {
            state.calendar.itemsByDate[newDate] = [];
          }
          state.calendar.itemsByDate[newDate].push(item.id);
        }
        
        // Update the item itself
        state.calendar.items[item.id] = item;
      }
    },
    deleteCalendarItemOptimistic: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const existingItem = state.calendar.items[itemId];
      
      if (existingItem) {
        // Remove from itemsByDate
        const date = existingItem.scheduledDate.split('T')[0];
        if (state.calendar.itemsByDate[date]) {
          state.calendar.itemsByDate[date] = state.calendar.itemsByDate[date]
            .filter(id => id !== itemId);
        }
        
        // Remove from items
        delete state.calendar.items[itemId];
      }
    },
    invalidateCalendarCache: (state) => {
      state.calendar.lastFetched = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCalendarItems
      .addCase(fetchCalendarItems.pending, (state) => {
        state.calendar.isLoading = true;
        state.calendar.error = null;
      })
      .addCase(fetchCalendarItems.fulfilled, (state, action) => {
        state.calendar.isLoading = false;
        
        // Skip update if we're using cached data
        if (action.payload === null) {
          return;
        }
        
        const { items, dateRange } = action.payload;
        const { itemsRecord, itemsByDate } = organizeCalendarItemsByDate(items);
        
        // Update state
        state.calendar.items = { ...state.calendar.items, ...itemsRecord };
        state.calendar.itemsByDate = { ...state.calendar.itemsByDate, ...itemsByDate };
        state.calendar.lastFetched[dateRange] = Date.now();
      })
      .addCase(fetchCalendarItems.rejected, (state, action) => {
        state.calendar.isLoading = false;
        state.calendar.error = action.payload as string;
      })
      
      // fetchCalendarInsights
      .addCase(fetchCalendarInsights.pending, (state) => {
        state.calendar.isLoading = true;
      })
      .addCase(fetchCalendarInsights.fulfilled, (state, action) => {
        state.calendar.isLoading = false;
        state.calendar.insights = action.payload;
      })
      .addCase(fetchCalendarInsights.rejected, (state, action) => {
        state.calendar.isLoading = false;
        state.calendar.error = action.payload as string;
      })
      
      // fetchBestTimeRecommendations
      .addCase(fetchBestTimeRecommendations.pending, (state) => {
        state.calendar.isLoading = true;
      })
      .addCase(fetchBestTimeRecommendations.fulfilled, (state, action) => {
        state.calendar.isLoading = false;
        
        // Map API response to expected format for compatibility
        const recommendations = action.payload.map(rec => ({
          ...rec,
          dayOfWeek: rec.dayOfWeek || rec.day_of_week.toString(),
          timeOfDay: rec.timeOfDay || `${rec.hour_of_day}:00`,
          engagementScore: rec.engagementScore || Math.round(rec.average_engagement * 100)
        }));
        
        state.calendar.bestTimeRecommendations = recommendations;
      })
      .addCase(fetchBestTimeRecommendations.rejected, (state, action) => {
        state.calendar.isLoading = false;
        state.calendar.error = action.payload as string;
      })
      
      // createCalendarItem
      .addCase(createCalendarItem.fulfilled, (state, action) => {
        const apiItem = action.payload;
        
        // Convert API response to our CalendarItem format
        const item: CalendarItem = {
          id: apiItem.id.toString(),
          project_id: apiItem.project_id,
          content_draft_id: apiItem.content_draft_id,
          scheduled_date: apiItem.scheduled_date,
          scheduledDate: apiItem.scheduled_date,
          published_date: apiItem.published_date,
          publishedDate: apiItem.published_date || undefined,
          status: apiItem.status as any,
          contentType: (apiItem.content_type || 'other') as any,
          content_type: apiItem.content_type,
          platform: apiItem.platform,
          brandId: apiItem.project_id.toString(),
          tags: [],
          author: apiItem.title || 'Unknown',
          title: apiItem.title || 'Untitled',
          description: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        state.calendar.items[item.id] = item;
        
        // Add to items by date
        const date = item.scheduledDate.split('T')[0];
        if (!state.calendar.itemsByDate[date]) {
          state.calendar.itemsByDate[date] = [];
        }
        state.calendar.itemsByDate[date].push(item.id);
      })
      
      // updateCalendarItem
      .addCase(updateCalendarItem.fulfilled, (state, action) => {
        const apiItem = action.payload;
        
        // Convert the API response to our CalendarItem format
        const item: CalendarItem = {
          id: apiItem.id.toString(),
          project_id: apiItem.project_id,
          content_draft_id: apiItem.content_draft_id,
          scheduled_date: apiItem.scheduled_date,
          scheduledDate: apiItem.scheduled_date,
          published_date: apiItem.published_date,
          publishedDate: apiItem.published_date || undefined,
          status: apiItem.status as any,
          contentType: (apiItem.content_type || 'other') as any,
          content_type: apiItem.content_type,
          platform: apiItem.platform,
          brandId: apiItem.project_id.toString(),
          tags: [],
          author: apiItem.title || 'Unknown',
          title: apiItem.title || 'Untitled',
          description: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const existingItem = state.calendar.items[item.id];
        
        if (existingItem) {
          // If the scheduled date changed, we need to update itemsByDate
          if (existingItem.scheduledDate !== item.scheduledDate) {
            // Remove from old date
            const oldDate = existingItem.scheduledDate.split('T')[0];
            if (state.calendar.itemsByDate[oldDate]) {
              state.calendar.itemsByDate[oldDate] = state.calendar.itemsByDate[oldDate]
                .filter(id => id !== item.id);
            }
            
            // Add to new date
            const newDate = item.scheduledDate.split('T')[0];
            if (!state.calendar.itemsByDate[newDate]) {
              state.calendar.itemsByDate[newDate] = [];
            }
            state.calendar.itemsByDate[newDate].push(item.id);
          }
          
          // Preserve any fields not returned by the API
          state.calendar.items[item.id] = {
            ...existingItem,
            ...item
          };
        } else {
          // Just add the new item if it doesn't exist
          state.calendar.items[item.id] = item;
          
          // Add to items by date
          const date = item.scheduledDate.split('T')[0];
          if (!state.calendar.itemsByDate[date]) {
            state.calendar.itemsByDate[date] = [];
          }
          state.calendar.itemsByDate[date].push(item.id);
        }
      })
      
      // deleteCalendarItem
      .addCase(deleteCalendarItem.fulfilled, (state, action) => {
        const itemId = action.payload;
        const existingItem = state.calendar.items[itemId];
        
        if (existingItem) {
          // Remove from itemsByDate
          const date = existingItem.scheduledDate.split('T')[0];
          if (state.calendar.itemsByDate[date]) {
            state.calendar.itemsByDate[date] = state.calendar.itemsByDate[date]
              .filter(id => id !== itemId);
          }
          
          // Remove from items
          delete state.calendar.items[itemId];
        }
      })
      
      // publishCalendarItem
      .addCase(publishCalendarItem.fulfilled, (state, action) => {
        const item = action.payload;
        if (state.calendar.items[item.id]) {
          state.calendar.items[item.id] = item;
        }
      })
      
      // Handle draft content thunks
      .addCase(fetchDraftById.pending, (state) => {
        state.isLoading = true;
        state.draftsError = null;
      })
      .addCase(fetchDraftById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedDraft = action.payload;
      })
      .addCase(fetchDraftById.rejected, (state, action) => {
        state.isLoading = false;
        state.draftsError = action.payload as string;
      })
      
      // Handle content performance thunks
      .addCase(fetchContentPerformance.pending, (state) => {
        state.performance.isLoading = true;
        state.performance.error = null;
      })
      .addCase(fetchContentPerformance.fulfilled, (state, action) => {
        state.performance.isLoading = false;
        state.performance.data = action.payload;
      })
      .addCase(fetchContentPerformance.rejected, (state, action) => {
        state.performance.isLoading = false;
        state.performance.error = action.payload as string;
      });
  },
});

export const {
  // Content reducers
  fetchContentStart,
  fetchContentSuccess,
  fetchContentFailure,
  selectContent,
  clearSelectedContent,
  createContentStart,
  createContentSuccess,
  createContentFailure,
  updateContentItem,
  updateContentStart,
  updateContentSuccess,
  updateContentFailure,
  deleteContentStart,
  deleteContentSuccess,
  deleteContentFailure,
  setContentFilters,
  clearContentFilters,
  
  // Calendar optimistic update reducers
  addCalendarItemOptimistic,
  updateCalendarItemOptimistic,
  deleteCalendarItemOptimistic,
  invalidateCalendarCache,
} = contentSlice.actions;

// Selectors for content
export const selectAllContent = (state: RootState) => state.content.items;
export const selectSelectedContent = (state: RootState) => state.content.selectedContent;
export const selectContentLoading = (state: RootState) => state.content.isLoading;
export const selectContentError = (state: RootState) => state.content.error;
export const selectContentFilters = (state: RootState) => state.content.filters;

// Selectors for drafts
export const selectSelectedDraft = (state: RootState) => state.content.selectedDraft;
export const selectDraftsError = (state: RootState) => state.content.draftsError;

// Selectors for content performance
export const selectContentPerformance = (state: RootState) => state.content.performance.data;
export const selectPerformanceLoading = (state: RootState) => state.content.performance.isLoading;
export const selectPerformanceError = (state: RootState) => state.content.performance.error;

// Selectors for calendar items
export const selectCalendarItems = (state: RootState) => state.content.calendar.items;
export const selectCalendarItemsByDate = (state: RootState) => state.content.calendar.itemsByDate;
export const selectCalendarInsights = (state: RootState) => state.content.calendar.insights;
export const selectBestTimeRecommendations = (state: RootState) => state.content.calendar.bestTimeRecommendations;
export const selectCalendarLoading = (state: RootState) => state.content.calendar.isLoading;
export const selectCalendarError = (state: RootState) => state.content.calendar.error;
export const selectCalendarLastFetched = (state: RootState) => state.content.calendar.lastFetched;

// Selector to get calendar items for a specific date
export const selectCalendarItemsForDate = (date: string) => (state: RootState) => {
  const dateKey = date.split('T')[0]; // Just the date part
  const itemIds = state.content.calendar.itemsByDate[dateKey] || [];
  return itemIds.map(id => state.content.calendar.items[id]);
};

// Selector to get calendar items for a date range
export const selectCalendarItemsForDateRange = (startDate: string, endDate: string) => (state: RootState) => {
  // Convert to Date objects for comparison
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const result: CalendarItem[] = [];
  
  // For each date with items
  Object.keys(state.content.calendar.itemsByDate).forEach(dateStr => {
    const date = new Date(dateStr);
    
    // If the date is within range
    if (date >= start && date <= end) {
      const itemIds = state.content.calendar.itemsByDate[dateStr] || [];
      const dateItems = itemIds
        .map(id => state.content.calendar.items[id])
        .filter(Boolean); // Filter out any undefined items
      
      result.push(...dateItems);
    }
  });
  
  return result;
};

export default contentSlice.reducer;