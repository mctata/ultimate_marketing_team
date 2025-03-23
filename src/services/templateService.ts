import api from './api';

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  template_count?: number;
}

export interface TemplateIndustry {
  id: string;
  name: string;
  description: string;
  icon: string;
  template_count?: number;
}

export interface TemplateFormat {
  id: string;
  name: string;
  description: string;
  platform: string;
  content_type: string;
  specs: Record<string, any>;
  template_count?: number;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  content: string;
  format_id: string;
  preview_image: string;
  dynamic_fields: Record<string, any>;
  tone_options: Array<Record<string, any>>;
  is_featured: boolean;
  is_premium: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  community_rating: number;
  usage_count: number;
  version: number;
  categories: TemplateCategory[];
  industries: TemplateIndustry[];
  format: TemplateFormat;
}

export interface TemplateRating {
  id: string;
  template_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

// Template Categories APIs
export const getTemplateCategories = () => 
  api.get<TemplateCategory[]>('/templates/categories');

export const createTemplateCategory = (category: Omit<TemplateCategory, 'id' | 'template_count'>) => 
  api.post<TemplateCategory>('/templates/categories', category);

// Template Industries APIs
export const getTemplateIndustries = () => 
  api.get<TemplateIndustry[]>('/templates/industries');

export const createTemplateIndustry = (industry: Omit<TemplateIndustry, 'id' | 'template_count'>) => 
  api.post<TemplateIndustry>('/templates/industries', industry);

// Template Formats APIs
export const getTemplateFormats = (contentType?: string) => 
  api.get<TemplateFormat[]>('/templates/formats', { params: { content_type: contentType } });

export const createTemplateFormat = (format: Omit<TemplateFormat, 'id' | 'template_count'>) => 
  api.post<TemplateFormat>('/templates/formats', format);

// Templates APIs
export const getTemplates = (params?: { 
  industry_id?: string;
  category_id?: string;
  format_id?: string;
  search?: string;
  is_featured?: boolean;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  skip?: number;
  limit?: number;
}) => 
  api.get<Template[]>('/templates', { params });

export const getTemplateById = (id: string) => 
  api.get<Template>(`/templates/${id}`);

export const createTemplate = (template: {
  title: string;
  description: string;
  content: string;
  format_id: string;
  preview_image?: string;
  dynamic_fields?: Record<string, any>;
  tone_options?: Array<Record<string, any>>;
  is_featured?: boolean;
  is_premium?: boolean;
  category_ids?: string[];
  industry_ids?: string[];
}) => 
  api.post<Template>('/templates', template);

export const updateTemplate = (id: string, template: Partial<{
  title: string;
  description: string;
  content: string;
  format_id: string;
  preview_image: string;
  dynamic_fields: Record<string, any>;
  tone_options: Array<Record<string, any>>;
  is_featured: boolean;
  is_premium: boolean;
  category_ids: string[];
  industry_ids: string[];
}>) => 
  api.put<Template>(`/templates/${id}`, template);

export const deleteTemplate = (id: string) => 
  api.delete(`/templates/${id}`);

// Template Ratings APIs
export const rateTemplate = (templateId: string, rating: { rating: number; comment?: string }) => 
  api.post<{ message: string; new_avg_rating: number }>(`/templates/${templateId}/ratings`, rating);

// Template Usage APIs
export const useTemplate = (templateId: string, 
  customizations: Record<string, any>, 
  draftData: Record<string, any>
) => 
  api.post<{ message: string; content_draft_id: string }>(`/templates/${templateId}/use`, {
    customizations,
    draft_data: draftData
  });

// Template Favorites APIs
export const favoriteTemplate = (templateId: string) => 
  api.post<{ message: string }>(`/templates/${templateId}/favorite`);

export const unfavoriteTemplate = (templateId: string) => 
  api.delete<{ message: string }>(`/templates/${templateId}/favorite`);

export const getFavoriteTemplates = () => 
  api.get<Template[]>('/templates/favorites');

// Template Analytics APIs
export const getPopularTemplates = (limit?: number) => 
  api.get<Template[]>('/templates/popular', { params: { limit } });

export const getRecommendedTemplates = (limit?: number) => 
  api.get<Template[]>('/templates/recommended', { params: { limit } });
