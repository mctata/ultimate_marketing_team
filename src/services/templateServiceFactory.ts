/**
 * Template Service Factory
 * 
 * This module handles the selection between real API and mock data for templates.
 * It checks API availability and falls back to mock data when the API is unavailable.
 */

import * as realTemplateService from './templateService';
import * as mockTemplateService from './mockTemplateService';
import api from './api';

// Cache for API check
let isApiAvailable: boolean | null = null;
let apiCheckPromise: Promise<boolean> | null = null;

/**
 * Check if the template API is available
 * @returns Promise resolving to true if API is available, false otherwise
 */
export const checkTemplateApiAvailability = async (): Promise<boolean> => {
  // If we already have a result, return it
  if (isApiAvailable !== null) {
    return isApiAvailable;
  }
  
  // If there's already a check in progress, wait for it
  if (apiCheckPromise) {
    return apiCheckPromise;
  }
  
  // Start a new check
  apiCheckPromise = new Promise<boolean>(async (resolve) => {
    try {
      // Try to access a test endpoint
      const response = await api.get('/api/v1/templates/test');
      isApiAvailable = response.status === 200;
      console.log('Template API availability check:', isApiAvailable ? 'Available' : 'Unavailable');
      resolve(isApiAvailable);
    } catch (error) {
      // On any error, consider the API unavailable
      console.warn('Template API availability check failed:', error);
      isApiAvailable = false;
      resolve(false);
    } finally {
      // Clear the promise
      apiCheckPromise = null;
    }
  });
  
  return apiCheckPromise;
};

/**
 * Reset the API availability cache - useful for retrying after a failure
 */
export const resetApiAvailabilityCheck = () => {
  isApiAvailable = null;
  apiCheckPromise = null;
};

// Export these functions for monitoring tools
export { checkTemplateApiAvailability };

/**
 * Get the appropriate template service based on API availability
 * @param forceMock Force using mock data even if API is available
 * @returns The template service (real or mock)
 */
export const getTemplateService = async (forceMock = false) => {
  // If force mock is enabled, skip the check
  if (forceMock) {
    console.log('Forcing mock template service');
    return mockTemplateService;
  }
  
  // Check API availability
  const apiAvailable = await checkTemplateApiAvailability();
  
  // Return the appropriate service
  return apiAvailable ? realTemplateService : mockTemplateService;
};

// Export a combined service that automatically selects the implementation
// This is a simpler API for components that don't need to handle the fallback logic
export default {
  // Seed templates functionality
  templatesExist: async () => {
    try {
      const service = await getTemplateService();
      // This function might not exist in the real service
      if ('templatesExist' in service) {
        return (service as any).templatesExist();
      }
      // Fallback: check if there are any templates
      const templates = await service.getTemplates();
      return templates && templates.length > 0;
    } catch (error) {
      console.warn('Error checking if templates exist:', error);
      return false;
    }
  },
  
  seedTemplatesIfNeeded: async () => {
    try {
      const service = await getTemplateService();
      // This function might not exist in the real service
      if ('seedTemplatesIfNeeded' in service) {
        return (service as any).seedTemplatesIfNeeded();
      }
      // No fallback implementation for seeding
      console.warn('seedTemplatesIfNeeded not available in the selected service');
      return { success: false, message: 'Seeding not supported' };
    } catch (error) {
      console.warn('Error seeding templates:', error);
      return { success: false, message: String(error) };
    }
  },
  
  getTemplateStats: async () => {
    try {
      const service = await getTemplateService();
      // This function might not exist in the real service
      if ('getTemplateStats' in service) {
        return (service as any).getTemplateStats();
      }
      // Fallback: build stats manually
      const templates = await service.getTemplates();
      const categories = await service.getTemplateCategories();
      const industries = await service.getTemplateIndustries();
      const formats = await service.getTemplateFormats();
      
      return {
        categories,
        industries,
        formats,
        totalTemplates: templates.length,
        featuredCount: templates.filter(t => t.is_featured).length,
        premiumCount: templates.filter(t => t.is_premium).length
      };
    } catch (error) {
      console.warn('Error getting template stats:', error);
      return null;
    }
  },
  
  // Template Categories
  getTemplateCategories: async () => {
    const service = await getTemplateService();
    return service.getTemplateCategories();
  },
  
  createTemplateCategory: async (category: any) => {
    const service = await getTemplateService();
    return service.createTemplateCategory(category);
  },
  
  // Template Industries
  getTemplateIndustries: async () => {
    const service = await getTemplateService();
    return service.getTemplateIndustries();
  },
  
  createTemplateIndustry: async (industry: any) => {
    const service = await getTemplateService();
    return service.createTemplateIndustry(industry);
  },
  
  // Template Formats
  getTemplateFormats: async (contentType?: string) => {
    const service = await getTemplateService();
    return service.getTemplateFormats(contentType);
  },
  
  createTemplateFormat: async (format: any) => {
    const service = await getTemplateService();
    return service.createTemplateFormat(format);
  },
  
  // Templates
  getTemplates: async (params?: any) => {
    const service = await getTemplateService();
    return service.getTemplates(params);
  },
  
  getTemplateById: async (id: string) => {
    const service = await getTemplateService();
    return service.getTemplateById(id);
  },
  
  createTemplate: async (template: any) => {
    const service = await getTemplateService();
    return service.createTemplate(template);
  },
  
  updateTemplate: async (id: string, template: any) => {
    const service = await getTemplateService();
    return service.updateTemplate(id, template);
  },
  
  deleteTemplate: async (id: string) => {
    const service = await getTemplateService();
    return service.deleteTemplate(id);
  },
  
  // Template Ratings
  rateTemplate: async (templateId: string, rating: any) => {
    const service = await getTemplateService();
    return service.rateTemplate(templateId, rating);
  },
  
  // Template Usage
  useTemplate: async (templateId: string, customizations: any, draftData: any) => {
    const service = await getTemplateService();
    return service.useTemplate(templateId, customizations, draftData);
  },
  
  // Template Favorites
  favoriteTemplate: async (templateId: string) => {
    const service = await getTemplateService();
    return service.favoriteTemplate(templateId);
  },
  
  unfavoriteTemplate: async (templateId: string) => {
    const service = await getTemplateService();
    return service.unfavoriteTemplate(templateId);
  },
  
  getFavoriteTemplates: async () => {
    const service = await getTemplateService();
    return service.getFavoriteTemplates();
  },
  
  // Template Analytics
  getPopularTemplates: async (limit?: number) => {
    const service = await getTemplateService();
    return service.getPopularTemplates(limit);
  },
  
  getRecommendedTemplates: async (limit?: number) => {
    const service = await getTemplateService();
    return service.getRecommendedTemplates(limit);
  }
};