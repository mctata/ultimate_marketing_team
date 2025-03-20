import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
}

const initialState: ContentState = {
  items: [],
  selectedContent: null,
  isLoading: false,
  error: null,
  filters: {},
};

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
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
  },
});

export const {
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
} = contentSlice.actions;

export default contentSlice.reducer;