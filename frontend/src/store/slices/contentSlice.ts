import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../index';
import contentCalendarService, { contentCalendarService as calendarService } from '../../services/contentCalendarService';

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
  dayOfWeek: number;
  timeOfDay: string;
  engagementScore: number;
  confidence: number;
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
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    type?: string;
    brandId?: string;
    searchQuery?: string;
  };
  calendar: CalendarState;
}

const initialState: ContentState = {
  items: [],
  selectedContent: null,
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
  }
};

// Async thunks for calendar operations
export const fetchCalendarItems = createAsyncThunk(
  'content/fetchCalendarItems',
  async (dateRange: { startDate: string; endDate: string; force?: boolean }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
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

export const fetchCalendarInsights = createAsyncThunk(
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

export const fetchBestTimeRecommendations = createAsyncThunk(
  'content/fetchBestTimeRecommendations',
  async (projectId: string, { rejectWithValue }) => {
    try {
      // Change brandId parameter to project_id to match API expectations
      const response = await calendarService.getBestTimeRecommendations(projectId);
      return response.data;
    } catch (error) {
      console.error('Error fetching best time recommendations:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch best time recommendations');
    }
  }
);

export const createCalendarItem = createAsyncThunk(
  'content/createCalendarItem',
  async (item: Omit<CalendarItem, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await calendarService.createCalendarEntry(item);
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create calendar item');
    }
  }
);

export const updateCalendarItem = createAsyncThunk(
  'content/updateCalendarItem',
  async (item: CalendarItem, { rejectWithValue }) => {
    try {
      const response = await calendarService.updateCalendarEntry(item.id, item);
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update calendar item');
    }
  }
);

export const deleteCalendarItem = createAsyncThunk(
  'content/deleteCalendarItem',
  async (itemId: string, { rejectWithValue }) => {
    try {
      await calendarService.deleteCalendarEntry(itemId);
      return itemId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete calendar item');
    }
  }
);

export const publishCalendarItem = createAsyncThunk(
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
        state.calendar.bestTimeRecommendations = action.payload;
      })
      .addCase(fetchBestTimeRecommendations.rejected, (state, action) => {
        state.calendar.isLoading = false;
        state.calendar.error = action.payload as string;
      })
      
      // createCalendarItem
      .addCase(createCalendarItem.fulfilled, (state, action) => {
        const item = action.payload;
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