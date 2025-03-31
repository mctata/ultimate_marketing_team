import api from './api';
import { apiMethods } from './api';
import { categories, industries, formats, templates } from '../data/templateData';

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
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  community_rating?: number;
  usage_count?: number;
  version?: number;
  categories?: TemplateCategory[];
  industries?: TemplateIndustry[];
  format?: TemplateFormat;
}

// Mock data converters
const convertCategory = (cat: any): TemplateCategory => ({
  id: cat.id || String(Math.random()).substring(2, 8),
  name: cat.name,
  description: cat.description || "",
  icon: cat.icon || "category",
  template_count: 0 // Calculate this in frontend if needed
});

const convertIndustry = (ind: any): TemplateIndustry => ({
  id: ind.id || String(Math.random()).substring(2, 8),
  name: ind.name,
  description: ind.description || "",
  icon: ind.icon || "business",
  template_count: 0 // Calculate this in frontend if needed
});

const convertFormat = (fmt: any): TemplateFormat => ({
  id: fmt.id || String(Math.random()).substring(2, 8),
  name: fmt.name,
  description: fmt.description || "",
  platform: fmt.platform || "all",
  content_type: fmt.content_type || "text",
  specs: fmt.specs || {},
  template_count: 0 // Calculate this in frontend if needed
});

const convertTemplate = (tmpl: any): Template => {
  const now = new Date().toISOString();
  return {
    id: tmpl.id || String(Math.random()).substring(2, 8),
    title: tmpl.title,
    description: tmpl.description || "",
    content: tmpl.content || "",
    format_id: tmpl.format_id,
    preview_image: tmpl.preview_image || "",
    dynamic_fields: tmpl.dynamic_fields || {},
    tone_options: tmpl.tone_options || [],
    is_featured: tmpl.is_featured || false,
    is_premium: tmpl.is_premium || false,
    created_by: tmpl.created_by || "System",
    created_at: tmpl.created_at || now,
    updated_at: tmpl.updated_at || now,
    community_rating: tmpl.community_rating || 0,
    usage_count: tmpl.usage_count || 0,
    version: tmpl.version || 1
  };
};

// Mock data providers
const getMockCategories = (): TemplateCategory[] => 
  categories.map(cat => convertCategory(cat));

const getMockIndustries = (): TemplateIndustry[] => 
  industries.map(ind => convertIndustry(ind));

const getMockFormats = (): TemplateFormat[] => 
  formats.map(fmt => convertFormat(fmt));

const getMockTemplates = (params?: any): Template[] => {
  let result = templates.map(tmpl => ({
    ...convertTemplate(tmpl),
    // Add relationships
    categories: tmpl.categories?.map(catId => 
      categories.find(c => c.id === catId || c.name === catId))
        .filter(Boolean)
        .map(cat => convertCategory(cat)),
    industries: tmpl.industries?.map(indId => 
      industries.find(i => i.id === indId || i.name === indId))
        .filter(Boolean)
        .map(ind => convertIndustry(ind)),
    format: formats.find(f => f.id === tmpl.format_id)
      ? convertFormat(formats.find(f => f.id === tmpl.format_id))
      : undefined
  }));
  
  // Apply filters if provided
  if (params) {
    if (params.industry_id) {
      result = result.filter(t => 
        t.industries?.some(i => i.id === params.industry_id));
    }
    if (params.category_id) {
      result = result.filter(t => 
        t.categories?.some(c => c.id === params.category_id));
    }
    if (params.format_id) {
      result = result.filter(t => t.format_id === params.format_id);
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(search) || 
        t.description.toLowerCase().includes(search));
    }
    if (params.is_featured !== undefined) {
      result = result.filter(t => t.is_featured === params.is_featured);
    }
  }
  
  return result;
};

const getMockTemplateById = (id: string): Template | null => {
  const template = templates.find(t => t.id === id);
  if (!template) return null;
  
  return {
    ...convertTemplate(template),
    categories: template.categories?.map(catId => 
      categories.find(c => c.id === catId || c.name === catId))
        .filter(Boolean)
        .map(cat => convertCategory(cat)),
    industries: template.industries?.map(indId => 
      industries.find(i => i.id === indId || i.name === indId))
        .filter(Boolean)
        .map(ind => convertIndustry(ind)),
    format: formats.find(f => f.id === template.format_id)
      ? convertFormat(formats.find(f => f.id === template.format_id))
      : undefined
  };
};

const getMockPopularTemplates = (limit = 10): Template[] => {
  return getMockTemplates()
    .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
    .slice(0, limit);
};

const getMockFeaturedTemplates = (limit = 10): Template[] => {
  return getMockTemplates({ is_featured: true }).slice(0, limit);
};

// Helper to try the API first, then fall back to mock data
const tryApiThenMock = async <T>(apiCall: () => Promise<T>, mockData: T): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    console.warn('API call failed, using mock data', error);
    return mockData;
  }
};

// Template Categories APIs with fallback
export const getTemplateCategories = () => 
  tryApiThenMock(
    () => apiMethods.get<TemplateCategory[]>('/templates/categories'),
    getMockCategories()
  );

export const createTemplateCategory = (category: Omit<TemplateCategory, 'id' | 'template_count'>) => 
  tryApiThenMock(
    () => apiMethods.post<TemplateCategory>('/templates/categories', category),
    convertCategory({ ...category, id: String(Math.random()).substring(2, 8) })
  );

// Template Industries APIs with fallback
export const getTemplateIndustries = () => 
  tryApiThenMock(
    () => apiMethods.get<TemplateIndustry[]>('/templates/industries'),
    getMockIndustries()
  );

export const createTemplateIndustry = (industry: Omit<TemplateIndustry, 'id' | 'template_count'>) => 
  tryApiThenMock(
    () => apiMethods.post<TemplateIndustry>('/templates/industries', industry),
    convertIndustry({ ...industry, id: String(Math.random()).substring(2, 8) })
  );

// Template Formats APIs with fallback
export const getTemplateFormats = (contentType?: string) => 
  tryApiThenMock(
    () => apiMethods.get<TemplateFormat[]>('/templates/formats', { content_type: contentType }),
    contentType 
      ? getMockFormats().filter(f => f.content_type === contentType)
      : getMockFormats()
  );

export const createTemplateFormat = (format: Omit<TemplateFormat, 'id' | 'template_count'>) => 
  tryApiThenMock(
    () => apiMethods.post<TemplateFormat>('/templates/formats', format),
    convertFormat({ ...format, id: String(Math.random()).substring(2, 8) })
  );

// Templates APIs with fallback
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
  tryApiThenMock(
    () => apiMethods.get<Template[]>('/templates', params),
    getMockTemplates(params)
  );

export const getTemplateById = (id: string) => 
  tryApiThenMock(
    () => apiMethods.get<Template>(`/templates/${id}`),
    getMockTemplateById(id) as Template
  );

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
  tryApiThenMock(
    () => apiMethods.post<Template>('/templates', template),
    convertTemplate({
      ...template,
      id: String(Math.random()).substring(2, 8),
      categories: template.category_ids,
      industries: template.industry_ids
    })
  );

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
  tryApiThenMock(
    () => apiMethods.put<Template>(`/templates/${id}`, template),
    {
      ...getMockTemplateById(id),
      ...template,
      categories: template.category_ids 
        ? template.category_ids.map(catId => 
            categories.find(c => c.id === catId || c.name === catId))
              .filter(Boolean)
              .map(cat => convertCategory(cat))
        : getMockTemplateById(id)?.categories,
      industries: template.industry_ids
        ? template.industry_ids.map(indId => 
            industries.find(i => i.id === indId || i.name === indId))
              .filter(Boolean)
              .map(ind => convertIndustry(ind))
        : getMockTemplateById(id)?.industries
    } as Template
  );

export const deleteTemplate = (id: string) => 
  tryApiThenMock(
    () => apiMethods.delete(`/templates/${id}`),
    { success: true, message: "Template deleted successfully" }
  );

// Template Ratings APIs with fallback
export const rateTemplate = (templateId: string, rating: { rating: number; comment?: string }) => 
  tryApiThenMock(
    () => apiMethods.post<{ message: string; new_avg_rating: number }>(`/templates/${templateId}/ratings`, rating),
    { message: "Rating submitted successfully", new_avg_rating: rating.rating }
  );

// Template Usage APIs with fallback
export const useTemplate = (templateId: string, 
  customizations: Record<string, any>, 
  draftData: Record<string, any>
) => 
  tryApiThenMock(
    () => apiMethods.post<{ message: string; content_draft_id: string }>(`/templates/${templateId}/use`, {
      customizations,
      draft_data: draftData
    }),
    { message: "Template used successfully", content_draft_id: String(Math.random()).substring(2, 10) }
  );

// Template Favorites APIs with fallback
export const favoriteTemplate = (templateId: string) => 
  tryApiThenMock(
    () => apiMethods.post<{ message: string }>(`/templates/${templateId}/favorite`),
    { message: "Template added to favorites" }
  );

export const unfavoriteTemplate = (templateId: string) => 
  tryApiThenMock(
    () => apiMethods.delete<{ message: string }>(`/templates/${templateId}/favorite`),
    { message: "Template removed from favorites" }
  );

export const getFavoriteTemplates = () => 
  tryApiThenMock(
    () => apiMethods.get<Template[]>('/templates/favorites'),
    [] // Can't mock this without user state
  );

// Template Analytics APIs with fallback
export const getPopularTemplates = (limit?: number) => 
  tryApiThenMock(
    () => apiMethods.get<Template[]>('/templates/popular', { limit }),
    getMockPopularTemplates(limit)
  );

export const getRecommendedTemplates = (limit?: number) => 
  tryApiThenMock(
    () => apiMethods.get<Template[]>('/templates/recommended', { limit }),
    getMockFeaturedTemplates(limit) // Use featured as recommended
  );