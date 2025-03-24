import api from './api';

// Types
export interface Template {
  id: string;
  title: string;
  description: string;
  content: string;
  variables: Record<string, any>;
  format: TemplateFormat;
  categories: TemplateCategory[];
  industry: TemplateIndustry;
  preview_image?: string;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  is_premium: boolean;
  status: 'active' | 'draft' | 'archived';
  usage_count: number;
  community_rating: number;
  user_rating?: number;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  template_count?: number;
}

export interface TemplateIndustry {
  id: string;
  name: string;
  description?: string;
  template_count?: number;
}

export interface TemplateFormat {
  id: string;
  name: string;
  description?: string;
  content_type: string;
}

// Template Categories
export const getTemplateCategories = async (): Promise<TemplateCategory[]> => {
  const response = await api.get('/api/v1/templates/categories');
  return response.data;
};

export const createTemplateCategory = async (category: Partial<TemplateCategory>): Promise<TemplateCategory> => {
  const response = await api.post('/api/v1/templates/categories', category);
  return response.data;
};

// Template Industries
export const getTemplateIndustries = async (): Promise<TemplateIndustry[]> => {
  const response = await api.get('/api/v1/templates/industries');
  return response.data;
};

export const createTemplateIndustry = async (industry: Partial<TemplateIndustry>): Promise<TemplateIndustry> => {
  const response = await api.post('/api/v1/templates/industries', industry);
  return response.data;
};

// Template Formats
export const getTemplateFormats = async (contentType?: string): Promise<TemplateFormat[]> => {
  const params = contentType ? { content_type: contentType } : undefined;
  const response = await api.get('/api/v1/templates/formats', { params });
  return response.data;
};

export const createTemplateFormat = async (format: Partial<TemplateFormat>): Promise<TemplateFormat> => {
  const response = await api.post('/api/v1/templates/formats', format);
  return response.data;
};

// Templates
export const getTemplates = async (params?: any): Promise<Template[]> => {
  const response = await api.get('/api/v1/templates', { params });
  return response.data;
};

export const getTemplateById = async (id: string): Promise<Template> => {
  const response = await api.get(`/api/v1/templates/${id}`);
  return response.data;
};

export const createTemplate = async (template: Partial<Template>): Promise<Template> => {
  const response = await api.post('/api/v1/templates', template);
  return response.data;
};

export const updateTemplate = async (id: string, template: Partial<Template>): Promise<Template> => {
  const response = await api.put(`/api/v1/templates/${id}`, template);
  return response.data;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  await api.delete(`/api/v1/templates/${id}`);
};

// Template Ratings
export const rateTemplate = async (templateId: string, rating: { score: number; comment?: string }): Promise<void> => {
  await api.post(`/api/v1/templates/${templateId}/rate`, rating);
};

// Template Usage
export const useTemplate = async (templateId: string, customizations: any, draftData?: any): Promise<any> => {
  const response = await api.post(`/api/v1/templates/${templateId}/use`, { customizations, draftData });
  return response.data;
};

// Template Favorites
export const favoriteTemplate = async (templateId: string): Promise<void> => {
  await api.post(`/api/v1/templates/${templateId}/favorite`);
};

export const unfavoriteTemplate = async (templateId: string): Promise<void> => {
  await api.delete(`/api/v1/templates/${templateId}/favorite`);
};

export const getFavoriteTemplates = async (): Promise<Template[]> => {
  const response = await api.get('/api/v1/templates/favorites');
  return response.data;
};

// Template Analytics
export const getPopularTemplates = async (limit?: number): Promise<Template[]> => {
  const params = limit ? { limit } : undefined;
  const response = await api.get('/api/v1/templates/popular', { params });
  return response.data;
};

export const getRecommendedTemplates = async (limit?: number): Promise<Template[]> => {
  const params = limit ? { limit } : undefined;
  const response = await api.get('/api/v1/templates/recommended', { params });
  return response.data;
};