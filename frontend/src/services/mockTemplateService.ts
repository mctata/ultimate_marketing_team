/**
 * Mock Template Service
 * 
 * This service provides mock implementations of all template API endpoints
 * for testing and development purposes when the API is not available.
 */

import { TemplateCategory, TemplateIndustry, TemplateFormat } from './templateService';
import { Template } from '../types/templates';

// Static data for mock implementation
const CATEGORIES: TemplateCategory[] = [
  { id: 'cat1', name: 'Marketing', description: 'Marketing related templates', template_count: 12 },
  { id: 'cat2', name: 'Sales', description: 'Sales related templates', template_count: 8 },
  { id: 'cat3', name: 'Social Media', description: 'Templates for social media', template_count: 15 },
  { id: 'cat4', name: 'Email', description: 'Email templates', template_count: 7 },
  { id: 'cat5', name: 'Ads', description: 'Advertisement templates', template_count: 5 },
];

const INDUSTRIES: TemplateIndustry[] = [
  { id: 'ind1', name: 'Technology', description: 'Tech industry templates', template_count: 10 },
  { id: 'ind2', name: 'Healthcare', description: 'Healthcare industry templates', template_count: 6 },
  { id: 'ind3', name: 'Finance', description: 'Finance industry templates', template_count: 8 },
  { id: 'ind4', name: 'Retail', description: 'Retail industry templates', template_count: 7 },
  { id: 'ind5', name: 'Education', description: 'Education industry templates', template_count: 5 },
];

const FORMATS: TemplateFormat[] = [
  { id: 'fmt1', name: 'Blog Post', description: 'Blog post template', content_type: 'long-form' },
  { id: 'fmt2', name: 'Social Post', description: 'Social media post template', content_type: 'short-form' },
  { id: 'fmt3', name: 'Email', description: 'Email template', content_type: 'email' },
  { id: 'fmt4', name: 'Ad Copy', description: 'Advertisement copy template', content_type: 'ad' },
  { id: 'fmt5', name: 'Landing Page', description: 'Landing page template', content_type: 'web' },
];

// Generate mock templates
const generateMockTemplates = (count: number): Template[] => {
  const templates: Template[] = [];
  
  for (let i = 1; i <= count; i++) {
    // Select random categories (1-3)
    const numCategories = Math.floor(Math.random() * 3) + 1;
    const templateCategories: TemplateCategory[] = [];
    
    for (let j = 0; j < numCategories; j++) {
      const randomCat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      
      // Avoid duplicates
      if (!templateCategories.some(c => c.id === randomCat.id)) {
        templateCategories.push(randomCat);
      }
    }
    
    // Select random industry and format
    const randomIndustry = INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
    const randomFormat = FORMATS[Math.floor(Math.random() * FORMATS.length)];
    
    // Generate template
    templates.push({
      id: `template-${i}`,
      title: `Mock Template ${i}`,
      description: `This is a mock template description ${i} for testing purposes.`,
      content: `# Mock Template ${i}\n\nThis is the content of mock template ${i}.\n\nYou can customize {{variable1}} and {{variable2}}.`,
      variables: {
        variable1: { type: 'text', label: 'Variable 1', default: 'Default Value 1' },
        variable2: { type: 'text', label: 'Variable 2', default: 'Default Value 2' },
      },
      format: randomFormat,
      categories: templateCategories,
      industry: randomIndustry,
      preview_image: i % 3 === 0 ? `https://picsum.photos/seed/template${i}/300/200` : undefined,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
      is_featured: i % 5 === 0,
      is_premium: i % 4 === 0,
      status: 'active',
      usage_count: Math.floor(Math.random() * 100),
      community_rating: Math.round((Math.random() * 3 + 2) * 10) / 10, // 2.0 - 5.0
    });
  }
  
  return templates;
};

// Generate 30 mock templates
const TEMPLATES = generateMockTemplates(30);

// Store favorites in local state
let favoriteTemplateIds: string[] = [];

// Template Categories
export const getTemplateCategories = async (): Promise<TemplateCategory[]> => {
  console.log('Using mock getTemplateCategories');
  await simulateNetworkDelay();
  return [...CATEGORIES];
};

export const createTemplateCategory = async (category: Partial<TemplateCategory>): Promise<TemplateCategory> => {
  console.log('Using mock createTemplateCategory', category);
  await simulateNetworkDelay();
  
  const newCategory: TemplateCategory = {
    id: `cat-${Date.now()}`,
    name: category.name || 'New Category',
    description: category.description,
    template_count: 0,
  };
  
  CATEGORIES.push(newCategory);
  return newCategory;
};

// Template Industries
export const getTemplateIndustries = async (): Promise<TemplateIndustry[]> => {
  console.log('Using mock getTemplateIndustries');
  await simulateNetworkDelay();
  return [...INDUSTRIES];
};

export const createTemplateIndustry = async (industry: Partial<TemplateIndustry>): Promise<TemplateIndustry> => {
  console.log('Using mock createTemplateIndustry', industry);
  await simulateNetworkDelay();
  
  const newIndustry: TemplateIndustry = {
    id: `ind-${Date.now()}`,
    name: industry.name || 'New Industry',
    description: industry.description,
    template_count: 0,
  };
  
  INDUSTRIES.push(newIndustry);
  return newIndustry;
};

// Template Formats
export const getTemplateFormats = async (contentType?: string): Promise<TemplateFormat[]> => {
  console.log('Using mock getTemplateFormats', contentType);
  await simulateNetworkDelay();
  
  if (contentType) {
    return FORMATS.filter(f => f.content_type === contentType);
  }
  
  return [...FORMATS];
};

export const createTemplateFormat = async (format: Partial<TemplateFormat>): Promise<TemplateFormat> => {
  console.log('Using mock createTemplateFormat', format);
  await simulateNetworkDelay();
  
  const newFormat: TemplateFormat = {
    id: `fmt-${Date.now()}`,
    name: format.name || 'New Format',
    description: format.description,
    content_type: format.content_type || 'other',
  };
  
  FORMATS.push(newFormat);
  return newFormat;
};

// Templates
export const getTemplates = async (params?: any): Promise<Template[]> => {
  console.log('Using mock getTemplates', params);
  await simulateNetworkDelay();
  
  let filteredTemplates = [...TEMPLATES];
  
  // Apply filtering
  if (params) {
    // Filter by search
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredTemplates = filteredTemplates.filter(t =>
        t.title.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by category
    if (params.category_id) {
      filteredTemplates = filteredTemplates.filter(t =>
        t.categories.some(c => c.id === params.category_id)
      );
    }
    
    // Filter by industry
    if (params.industry_id) {
      filteredTemplates = filteredTemplates.filter(t =>
        t.industry.id === params.industry_id
      );
    }
    
    // Filter by format
    if (params.format_id) {
      filteredTemplates = filteredTemplates.filter(t =>
        t.format.id === params.format_id
      );
    }
    
    // Filter by featured
    if (params.is_featured !== undefined) {
      filteredTemplates = filteredTemplates.filter(t =>
        t.is_featured === params.is_featured
      );
    }
    
    // Filter by premium
    if (params.is_premium !== undefined) {
      filteredTemplates = filteredTemplates.filter(t =>
        t.is_premium === params.is_premium
      );
    }
    
    // Apply sorting
    if (params.sort_by) {
      const sortDir = params.sort_dir === 'asc' ? 1 : -1;
      
      filteredTemplates.sort((a, b) => {
        if (params.sort_by === 'title') {
          return a.title.localeCompare(b.title) * sortDir;
        }
        
        if (params.sort_by === 'usage_count') {
          return (a.usage_count - b.usage_count) * sortDir;
        }
        
        if (params.sort_by === 'community_rating') {
          return (a.community_rating - b.community_rating) * sortDir;
        }
        
        if (params.sort_by === 'created_at') {
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * sortDir;
        }
        
        return 0;
      });
    }
    
    // Apply limit
    if (params.limit) {
      filteredTemplates = filteredTemplates.slice(0, params.limit);
    }
  }
  
  return filteredTemplates;
};

export const getTemplateById = async (id: string): Promise<Template> => {
  console.log('Using mock getTemplateById', id);
  await simulateNetworkDelay();
  
  const template = TEMPLATES.find(t => t.id === id);
  
  if (!template) {
    throw new Error(`Template with id ${id} not found`);
  }
  
  // Check if this template is favorited
  if (favoriteTemplateIds.includes(id)) {
    return {
      ...template,
      user_rating: 4.5, // Mock user rating
    };
  }
  
  return template;
};

export const createTemplate = async (template: Partial<Template>): Promise<Template> => {
  console.log('Using mock createTemplate', template);
  await simulateNetworkDelay();
  
  const newTemplate: Template = {
    id: `template-${Date.now()}`,
    title: template.title || 'New Template',
    description: template.description || 'A new template',
    content: template.content || 'Template content',
    variables: template.variables || {},
    format: template.format || FORMATS[0],
    categories: template.categories || [CATEGORIES[0]],
    industry: template.industry || INDUSTRIES[0],
    preview_image: template.preview_image,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: template.is_featured || false,
    is_premium: template.is_premium || false,
    status: template.status || 'active',
    usage_count: 0,
    community_rating: 0,
  };
  
  TEMPLATES.push(newTemplate);
  return newTemplate;
};

export const updateTemplate = async (id: string, templateData: Partial<Template>): Promise<Template> => {
  console.log('Using mock updateTemplate', id, templateData);
  await simulateNetworkDelay();
  
  const templateIndex = TEMPLATES.findIndex(t => t.id === id);
  
  if (templateIndex === -1) {
    throw new Error(`Template with id ${id} not found`);
  }
  
  const updatedTemplate = {
    ...TEMPLATES[templateIndex],
    ...templateData,
    updated_at: new Date().toISOString(),
  };
  
  TEMPLATES[templateIndex] = updatedTemplate;
  return updatedTemplate;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  console.log('Using mock deleteTemplate', id);
  await simulateNetworkDelay();
  
  const templateIndex = TEMPLATES.findIndex(t => t.id === id);
  
  if (templateIndex === -1) {
    throw new Error(`Template with id ${id} not found`);
  }
  
  TEMPLATES.splice(templateIndex, 1);
};

// Template Ratings
export const rateTemplate = async (templateId: string, rating: { score: number; comment?: string }): Promise<void> => {
  console.log('Using mock rateTemplate', templateId, rating);
  await simulateNetworkDelay();
  
  const templateIndex = TEMPLATES.findIndex(t => t.id === templateId);
  
  if (templateIndex === -1) {
    throw new Error(`Template with id ${templateId} not found`);
  }
  
  // Update template with new rating
  TEMPLATES[templateIndex] = {
    ...TEMPLATES[templateIndex],
    community_rating: (TEMPLATES[templateIndex].community_rating + rating.score) / 2, // Simple average
    user_rating: rating.score,
  };
};

// Template Usage
export const useTemplate = async (templateId: string, customizations: any, draftData?: any): Promise<any> => {
  console.log('Using mock useTemplate', templateId, customizations, draftData);
  await simulateNetworkDelay();
  
  const templateIndex = TEMPLATES.findIndex(t => t.id === templateId);
  
  if (templateIndex === -1) {
    throw new Error(`Template with id ${templateId} not found`);
  }
  
  // Increment usage count
  TEMPLATES[templateIndex] = {
    ...TEMPLATES[templateIndex],
    usage_count: TEMPLATES[templateIndex].usage_count + 1,
  };
  
  // Return mocked result
  return {
    id: `content-${Date.now()}`,
    templateId,
    customizations,
    content: `This is the generated content based on template ${templateId} with customizations.`,
    created_at: new Date().toISOString(),
  };
};

// Template Favorites
export const favoriteTemplate = async (templateId: string): Promise<void> => {
  console.log('Using mock favoriteTemplate', templateId);
  await simulateNetworkDelay();
  
  if (!TEMPLATES.some(t => t.id === templateId)) {
    throw new Error(`Template with id ${templateId} not found`);
  }
  
  if (!favoriteTemplateIds.includes(templateId)) {
    favoriteTemplateIds.push(templateId);
  }
};

export const unfavoriteTemplate = async (templateId: string): Promise<void> => {
  console.log('Using mock unfavoriteTemplate', templateId);
  await simulateNetworkDelay();
  
  favoriteTemplateIds = favoriteTemplateIds.filter(id => id !== templateId);
};

export const getFavoriteTemplates = async (): Promise<Template[]> => {
  console.log('Using mock getFavoriteTemplates');
  await simulateNetworkDelay();
  
  return TEMPLATES.filter(t => favoriteTemplateIds.includes(t.id));
};

// Template Analytics
export const getPopularTemplates = async (limit?: number): Promise<Template[]> => {
  console.log('Using mock getPopularTemplates', limit);
  await simulateNetworkDelay();
  
  const popularTemplates = [...TEMPLATES].sort((a, b) => b.usage_count - a.usage_count);
  
  if (limit) {
    return popularTemplates.slice(0, limit);
  }
  
  return popularTemplates;
};

export const getRecommendedTemplates = async (limit?: number): Promise<Template[]> => {
  console.log('Using mock getRecommendedTemplates', limit);
  await simulateNetworkDelay();
  
  // For mock data, just return a random selection of templates
  const shuffled = [...TEMPLATES].sort(() => 0.5 - Math.random());
  
  if (limit) {
    return shuffled.slice(0, limit);
  }
  
  return shuffled.slice(0, 10); // Default to 10
};

// Mock utilities
export const seedTemplatesIfNeeded = async (): Promise<{ success: boolean; message: string }> => {
  console.log('Using mock seedTemplatesIfNeeded');
  await simulateNetworkDelay(500, 1500);
  
  // Generate new templates
  const newTemplates = generateMockTemplates(30);
  
  // Replace existing templates
  TEMPLATES.length = 0;
  TEMPLATES.push(...newTemplates);
  
  return {
    success: true,
    message: 'Successfully seeded 30 mock templates',
  };
};

export const templatesExist = async (): Promise<boolean> => {
  console.log('Using mock templatesExist');
  await simulateNetworkDelay();
  
  return TEMPLATES.length > 0;
};

export const getTemplateStats = async (): Promise<any> => {
  console.log('Using mock getTemplateStats');
  await simulateNetworkDelay();
  
  return {
    categories: CATEGORIES,
    industries: INDUSTRIES,
    formats: FORMATS,
    totalTemplates: TEMPLATES.length,
    featuredCount: TEMPLATES.filter(t => t.is_featured).length,
    premiumCount: TEMPLATES.filter(t => t.is_premium).length,
  };
};

// Helper to simulate network delay
const simulateNetworkDelay = async (min = 100, max = 500): Promise<void> => {
  const delay = Math.random() * (max - min) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
};