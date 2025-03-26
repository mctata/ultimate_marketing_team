/**
 * Template Types - Centralized interfaces for templates
 * This file provides a single source of truth for all template-related type definitions
 */

// Base Template Interface
export interface BaseTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  content_type: string;
  format_id: string;
  categories: string[];
  industries: string[];
  is_premium: boolean;
  preview_image?: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  is_featured: boolean;
  sample_output?: string;
  author?: string;
}

// Template Variable Definition
export interface TemplateVariable {
  name: string;
  label: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'text' | 'select';
  required: boolean;
  default_value?: string | number | boolean;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  validation?: string;
}

// Template with full details
export interface Template extends BaseTemplate {
  template_content: string;
  variables: TemplateVariable[];
  category: string;
  tags: string[];
  version: string;
  dynamic_fields?: Record<string, {
    label: string;
    description: string;
    default: string;
    multiline: boolean;
  }>;
  tone_options?: Array<{
    id: string;
    name: string;
    description: string;
    modifications: Record<string, any>;
  }>;
}

// Template as displayed in the UI
export interface DisplayTemplate extends BaseTemplate {
  format: {
    id: string;
    name: string;
  };
  categories: Array<{
    id: string;
    name: string;
  }>;
  industries: Array<{
    id: string;
    name: string;
  }>;
  community_rating?: number;
  usage_count?: number;
}

// Template Collection
export interface TemplateCollection {
  id: string;
  name: string;
  description: string;
  templates_count: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  templates?: DisplayTemplate[];
}

// Template Generation Request
export interface GenerationRequest {
  content_type: string;
  template_id: string;
  variables: Record<string, any>;
  language?: string;
  industry?: string;
  model_preferences?: Record<string, any>;
  quality_assessment?: boolean;
  brand_id?: number;
  seo_keywords?: string[];
  batch_id?: string;
}

// Template Content Variation
export interface ContentVariation {
  variation_id: string;
  content: string;
  quality_score?: number;
  quality_assessment?: Record<string, any>;
  strengths?: string[];
  improvement_areas?: string[];
}

// Template Generation Response
export interface GenerationResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  variations?: ContentVariation[];
  error?: string;
  message?: string;
  estimated_completion_time?: string;
  progress?: number;
}

// Quality Assessment Results
export interface QualityAssessment {
  content_id: string;
  overall_score: number;
  metrics: {
    readability: number;
    engagement: number;
    seo_alignment: number;
    brand_alignment: number;
    factual_accuracy: number;
    grammar_spelling: number;
  };
  strengths: string[];
  improvement_areas: string[];
  improvement_suggestions: string[];
  keywords_analysis?: {
    keyword: string;
    frequency: number;
    density: number;
    prominence: number;
  }[];
}