import api from './api';
import {
  Template,
  TemplateVariable,
  GenerationRequest,
  ContentVariation,
  GenerationResponse,
  QualityAssessment
} from '../types/templates';

export interface TaskStatusResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: ContentVariation[];
  progress?: number;
  current_step?: string;
  steps_completed?: number;
  total_steps?: number;
  error?: string;
  message?: string;
  estimated_completion_time?: string;
}

export interface ABTestRequest {
  title: string;
  content_variations: ContentVariation[];
  metrics: string[];
  brand_id?: number;
  audience?: string;
  duration_days?: number;
}

export interface ABTest {
  id: string;
  title: string;
  status: 'draft' | 'running' | 'completed' | 'canceled';
  content_variations: ContentVariation[];
  winner_id?: string;
  metrics: string[];
  results?: {
    variation_id: string;
    metrics: Record<string, number>;
  }[];
  created_at: string;
  updated_at: string;
  end_date?: string;
}

// API endpoints
const contentGenerationApi = {
  // Template endpoints
  getTemplates: () =>
    api.get<Template[]>('/content-generation/templates'),
  
  getTemplateById: (templateId: string) =>
    api.get<Template>(`/content-generation/templates/${templateId}`),
  
  renderTemplate: (templateId: string, variables: Record<string, any>) =>
    api.post<{rendered: string}>(`/content-generation/templates/${templateId}/render`, { variables }),

  createTemplate: (template: Omit<Template, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<Template>('/content-generation/templates', template),
  
  updateTemplate: (templateId: string, template: Partial<Template>) =>
    api.put<Template>(`/content-generation/templates/${templateId}`, template),
  
  deleteTemplate: (templateId: string) =>
    api.delete(`/content-generation/templates/${templateId}`),
  
  // Content generation endpoints
  generateContent: (request: GenerationRequest) =>
    api.post<GenerationResponse>('/content-generation/generate', request),
  
  generateBatchContent: (requests: GenerationRequest[]) =>
    api.post<{batch_id: string; tasks: {task_id: string; request: GenerationRequest}[]}>('/content-generation/batch', { requests }),
  
  getTaskStatus: (taskId: string) =>
    api.get<TaskStatusResponse>(`/content-generation/tasks/${taskId}`),
  
  // Quality assessment
  getQualityAssessment: (contentId: string) =>
    api.get<QualityAssessment>(`/content-generation/quality-assessment/${contentId}`),
  
  requestQualityAssessment: (content: string, contentType: string) =>
    api.post<{task_id: string}>('/content-generation/quality-assessment', { content, content_type: contentType }),
  
  // A/B Testing
  createABTest: (testData: ABTestRequest) =>
    api.post<ABTest>('/content-generation/ab-tests', testData),
  
  getABTests: () =>
    api.get<ABTest[]>('/content-generation/ab-tests'),
  
  getABTestById: (testId: string) =>
    api.get<ABTest>(`/content-generation/ab-tests/${testId}`),
  
  updateABTest: (testId: string, testData: Partial<ABTest>) =>
    api.put<ABTest>(`/content-generation/ab-tests/${testId}`, testData),
  
  deleteABTest: (testId: string) =>
    api.delete(`/content-generation/ab-tests/${testId}`),
  
  startABTest: (testId: string) =>
    api.post<ABTest>(`/content-generation/ab-tests/${testId}/start`, {}),
  
  stopABTest: (testId: string) =>
    api.post<ABTest>(`/content-generation/ab-tests/${testId}/stop`, {}),
};

// Function has been moved to useContentGeneration.ts
// Kept here as a comment to document the change
// export const Generate = async (
//   request: GenerationRequest
// ): Promise<GenerationResponse> => {
//   return contentGenerationApi.generateContent(request);
// };

export default contentGenerationApi;