import api from './api';
import { Template } from './templateService';

export interface TemplateCollection {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  templates_count: number;
  is_default: boolean;
  user_id: string;
}

export interface TemplateUsageData {
  id: string;
  template_id: string;
  user_id: string;
  created_at: string;
  content_draft_id?: string;
  customizations: Record<string, any>;
  performance_metrics?: {
    views?: number;
    clicks?: number;
    conversions?: number;
    engagement_score?: number;
    comments?: number;
    shares?: number;
  };
}

export interface TemplatePerformanceMetrics {
  total_usage: number;
  conversion_rate: number;
  engagement_score: number;
  average_completion_time: number;
  sentiment_score: number;
  usage_by_channel: Record<string, number>;
  usage_by_platform: Record<string, number>;
  usage_by_audience: Record<string, number>;
  usage_trends: Array<{
    date: string;
    count: number;
  }>;
}

// Template collections (bookmarks/folders)
export const getTemplateCollections = () =>
  api.get<TemplateCollection[]>('/template-management/collections');

export const getTemplateCollectionById = (id: string) =>
  api.get<TemplateCollection & { templates: Template[] }>(`/template-management/collections/${id}`);

export const createTemplateCollection = (data: {
  name: string;
  description?: string;
}) =>
  api.post<TemplateCollection>('/template-management/collections', data);

export const updateTemplateCollection = (id: string, data: {
  name?: string;
  description?: string;
}) =>
  api.put<TemplateCollection>(`/template-management/collections/${id}`, data);

export const deleteTemplateCollection = (id: string) =>
  api.delete(`/template-management/collections/${id}`);

// Add/remove templates from collections
export const addTemplateToCollection = (collectionId: string, templateId: string) =>
  api.post<{ message: string }>(`/template-management/collections/${collectionId}/templates`, {
    template_id: templateId
  });

export const removeTemplateFromCollection = (collectionId: string, templateId: string) =>
  api.delete<{ message: string }>(`/template-management/collections/${collectionId}/templates/${templateId}`);

// Template usage history and analytics
export const getTemplateUsageHistory = (templateId?: string, limit?: number) =>
  api.get<TemplateUsageData[]>('/template-management/usage-history', {
    params: { template_id: templateId, limit }
  });

export const getTemplatePerformanceMetrics = (templateId: string, timeRange?: string) =>
  api.get<TemplatePerformanceMetrics>(`/template-management/performance/${templateId}`, {
    params: { time_range: timeRange }
  });

// Template comparison
export const compareTemplates = (templateIds: string[]) =>
  api.post<Record<string, TemplatePerformanceMetrics>>('/template-management/compare', {
    template_ids: templateIds
  });

// Template tagging
export const addTagToTemplate = (templateId: string, tag: string) =>
  api.post<{ message: string }>(`/template-management/templates/${templateId}/tags`, {
    tag
  });

export const removeTagFromTemplate = (templateId: string, tag: string) =>
  api.delete<{ message: string }>(`/template-management/templates/${templateId}/tags/${tag}`);

export const getTemplatesByTag = (tag: string) =>
  api.get<Template[]>('/template-management/tags', {
    params: { tag }
  });

// Template versioning
export const getTemplateVersionHistory = (templateId: string) =>
  api.get<Array<Template & { version: number }>>(`/template-management/versions/${templateId}`);

export const revertToTemplateVersion = (templateId: string, version: number) =>
  api.post<Template>(`/template-management/versions/${templateId}/revert`, {
    version
  });

// Export usage reports
export const exportTemplateUsageReport = (templateId: string, format: 'csv' | 'json' | 'pdf') =>
  api.get<Blob>(`/template-management/reports/${templateId}/export`, {
    params: { format },
    responseType: 'blob'
  });