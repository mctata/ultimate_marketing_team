import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import * as templateService from '../../services/templateService';

// Types
export interface TemplatesState {
  templates: templateService.Template[];
  selectedTemplate: templateService.Template | null;
  categories: templateService.TemplateCategory[];
  industries: templateService.TemplateIndustry[];
  formats: templateService.TemplateFormat[];
  favoriteTemplates: templateService.Template[];
  popularTemplates: templateService.Template[];
  recommendedTemplates: templateService.Template[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: TemplatesState = {
  templates: [],
  selectedTemplate: null,
  categories: [],
  industries: [],
  formats: [],
  favoriteTemplates: [],
  popularTemplates: [],
  recommendedTemplates: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchTemplates = createAsyncThunk(
  'templates/fetchTemplates',
  async (params: Parameters<typeof templateService.getTemplates>[0] = {}, { rejectWithValue }) => {
    try {
      const response = await templateService.getTemplates(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch templates');
    }
  }
);

export const fetchTemplateById = createAsyncThunk(
  'templates/fetchTemplateById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await templateService.getTemplateById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch template');
    }
  }
);

export const createTemplate = createAsyncThunk(
  'templates/createTemplate',
  async (template: Parameters<typeof templateService.createTemplate>[0], { rejectWithValue }) => {
    try {
      const response = await templateService.createTemplate(template);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create template');
    }
  }
);

export const updateTemplate = createAsyncThunk(
  'templates/updateTemplate',
  async ({ id, template }: { id: string; template: Parameters<typeof templateService.updateTemplate>[1] }, { rejectWithValue }) => {
    try {
      const response = await templateService.updateTemplate(id, template);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update template');
    }
  }
);

export const deleteTemplate = createAsyncThunk(
  'templates/deleteTemplate',
  async (id: string, { rejectWithValue }) => {
    try {
      await templateService.deleteTemplate(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete template');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'templates/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await templateService.getTemplateCategories();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch categories');
    }
  }
);

export const fetchIndustries = createAsyncThunk(
  'templates/fetchIndustries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await templateService.getTemplateIndustries();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch industries');
    }
  }
);

export const fetchFormats = createAsyncThunk(
  'templates/fetchFormats',
  async (contentType: string | undefined = undefined, { rejectWithValue }) => {
    try {
      const response = await templateService.getTemplateFormats(contentType);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch formats');
    }
  }
);

export const fetchFavoriteTemplates = createAsyncThunk(
  'templates/fetchFavoriteTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await templateService.getFavoriteTemplates();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch favorite templates');
    }
  }
);

export const toggleFavoriteTemplate = createAsyncThunk(
  'templates/toggleFavoriteTemplate',
  async ({ templateId, isFavorite }: { templateId: string; isFavorite: boolean }, { rejectWithValue }) => {
    try {
      if (isFavorite) {
        await templateService.unfavoriteTemplate(templateId);
      } else {
        await templateService.favoriteTemplate(templateId);
      }
      return { templateId, isFavorite: !isFavorite };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to toggle favorite template');
    }
  }
);

export const fetchPopularTemplates = createAsyncThunk(
  'templates/fetchPopularTemplates',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await templateService.getPopularTemplates(limit);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch popular templates');
    }
  }
);

export const fetchRecommendedTemplates = createAsyncThunk(
  'templates/fetchRecommendedTemplates',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await templateService.getRecommendedTemplates(limit);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch recommended templates');
    }
  }
);

export const useTemplate = createAsyncThunk(
  'templates/useTemplate',
  async ({ templateId, customizations, draftData }: {
    templateId: string;
    customizations: Record<string, any>;
    draftData: Record<string, any>;
  }, { rejectWithValue }) => {
    try {
      const response = await templateService.useTemplate(templateId, customizations, draftData);
      return {
        templateId,
        contentDraftId: response.data.content_draft_id
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to use template');
    }
  }
);

// Slice
const templateSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    clearSelectedTemplate(state) {
      state.selectedTemplate = null;
    },
    clearTemplatesError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchTemplates
      .addCase(fetchTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // fetchTemplateById
      .addCase(fetchTemplateById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTemplateById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTemplate = action.payload;
      })
      .addCase(fetchTemplateById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // createTemplate
      .addCase(createTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.templates.unshift(action.payload);
        state.selectedTemplate = action.payload;
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // updateTemplate
      .addCase(updateTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.templates.findIndex(template => template.id === action.payload.id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        state.selectedTemplate = action.payload;
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // deleteTemplate
      .addCase(deleteTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = state.templates.filter(template => template.id !== action.payload);
        if (state.selectedTemplate && state.selectedTemplate.id === action.payload) {
          state.selectedTemplate = null;
        }
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // fetchCategories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // fetchIndustries
      .addCase(fetchIndustries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIndustries.fulfilled, (state, action) => {
        state.loading = false;
        state.industries = action.payload;
      })
      .addCase(fetchIndustries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // fetchFormats
      .addCase(fetchFormats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFormats.fulfilled, (state, action) => {
        state.loading = false;
        state.formats = action.payload;
      })
      .addCase(fetchFormats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // fetchFavoriteTemplates
      .addCase(fetchFavoriteTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavoriteTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.favoriteTemplates = action.payload;
      })
      .addCase(fetchFavoriteTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // toggleFavoriteTemplate
      .addCase(toggleFavoriteTemplate.fulfilled, (state, action) => {
        const { templateId, isFavorite } = action.payload;
        
        if (isFavorite) {
          // Add to favorites
          const template = state.templates.find(t => t.id === templateId);
          if (template && !state.favoriteTemplates.some(f => f.id === templateId)) {
            state.favoriteTemplates.push(template);
          }
        } else {
          // Remove from favorites
          state.favoriteTemplates = state.favoriteTemplates.filter(t => t.id !== templateId);
        }
      })
      
      // fetchPopularTemplates
      .addCase(fetchPopularTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPopularTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.popularTemplates = action.payload;
      })
      .addCase(fetchPopularTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // fetchRecommendedTemplates
      .addCase(fetchRecommendedTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecommendedTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.recommendedTemplates = action.payload;
      })
      .addCase(fetchRecommendedTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // useTemplate
      .addCase(useTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(useTemplate.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update usage count for the template
        const { templateId } = action.payload;
        const templateIndex = state.templates.findIndex(t => t.id === templateId);
        if (templateIndex !== -1) {
          state.templates[templateIndex].usage_count += 1;
        }
        
        // If the template is currently selected, update it too
        if (state.selectedTemplate && state.selectedTemplate.id === templateId) {
          state.selectedTemplate.usage_count += 1;
        }
      })
      .addCase(useTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Exports
export const { clearSelectedTemplate, clearTemplatesError } = templateSlice.actions;

// Selectors
export const selectTemplates = (state: RootState) => state.templates.templates;
export const selectSelectedTemplate = (state: RootState) => state.templates.selectedTemplate;
export const selectCategories = (state: RootState) => state.templates.categories;
export const selectIndustries = (state: RootState) => state.templates.industries;
export const selectFormats = (state: RootState) => state.templates.formats;
export const selectFavoriteTemplates = (state: RootState) => state.templates.favoriteTemplates;
export const selectPopularTemplates = (state: RootState) => state.templates.popularTemplates;
export const selectRecommendedTemplates = (state: RootState) => state.templates.recommendedTemplates;
export const selectTemplatesLoading = (state: RootState) => state.templates.loading;
export const selectTemplatesError = (state: RootState) => state.templates.error;

export default templateSlice.reducer;
