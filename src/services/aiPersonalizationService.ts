import api from './api';
import { Template } from './templateService';

export interface PersonalizationSuggestion {
  field: string;
  value: string;
  confidence: number;
  reason: string;
}

export interface ImageRecommendation {
  id: string;
  url: string;
  alt: string;
  tags: string[];
  confidence: number;
  description: string;
}

export interface ToneRecommendation {
  id: string;
  name: string;
  confidence: number;
  reason: string;
}

export interface PersonalizationResponse {
  fieldSuggestions: PersonalizationSuggestion[];
  imageRecommendations: ImageRecommendation[];
  toneRecommendations: ToneRecommendation[];
  contentImprovements: string[];
}

export interface PersonalizationRequest {
  templateId: string;
  industryId?: string;
  targetAudience?: string;
  campaignObjective?: string;
  brandVoice?: string;
  previousPerformance?: boolean;
  currentValues?: Record<string, string>;
}

/**
 * Get personalization suggestions for a template based on user context
 */
export const getPersonalizationSuggestions = (request: PersonalizationRequest) =>
  api.post<PersonalizationResponse>('/ai/template-personalize', request);

/**
 * Get image recommendations for a template based on content and context
 */
export const getImageRecommendations = (templateId: string, context: {
  industry?: string;
  audience?: string;
  objective?: string;
  keywords?: string[];
  content?: string;
}) =>
  api.post<ImageRecommendation[]>('/ai/image-recommendations', {
    templateId,
    ...context
  });

/**
 * Get tone recommendations based on audience and objectives
 */
export const getToneRecommendations = (templateId: string, context: {
  industry?: string;
  audience?: string;
  objective?: string;
  brandVoice?: string;
}) =>
  api.post<ToneRecommendation[]>('/ai/tone-recommendations', {
    templateId,
    ...context
  });

/**
 * Get content improvement suggestions
 */
export const getContentImprovements = (content: string, context: {
  industry?: string;
  audience?: string;
  objective?: string;
  platform?: string;
}) =>
  api.post<string[]>('/ai/content-improvements', {
    content,
    ...context
  });

/**
 * Generate optimal headline variations for A/B testing
 */
export const generateHeadlineVariations = (
  baseHeadline: string,
  count: number = 3,
  context: {
    industry?: string;
    audience?: string;
    objective?: string;
  }
) =>
  api.post<string[]>('/ai/headline-variations', {
    baseHeadline,
    count,
    ...context
  });

/**
 * Analyze template performance data to learn what works best
 */
export const analyzeTemplatePerformance = (templateId: string) =>
  api.get<{
    topPerformingVariations: Record<string, string>[];
    learnings: string[];
    recommendations: string[];
  }>(`/ai/template-performance/${templateId}`);