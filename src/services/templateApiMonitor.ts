/**
 * Template API monitor
 * 
 * Utility for monitoring the availability of the template API endpoints
 * and tracking statistics about API calls.
 */
import templateService from './templateServiceFactory';
import { checkTemplateApiAvailability, resetApiAvailabilityCheck } from './templateServiceFactory';

// Track general API statistics
interface ApiStats {
  successCount: number;
  errorCount: number;
  lastSuccess: Date | null;
  lastError: Date | null;
  lastDuration: number | null;
  averageDuration: number | null;
  uptime: number; // percentage
  errorMessages: string[];
}

// Statistics container
const stats: ApiStats = {
  successCount: 0,
  errorCount: 0,
  lastSuccess: null,
  lastError: null,
  lastDuration: null,
  averageDuration: null,
  uptime: 100,
  errorMessages: []
};

/**
 * Check if template API is available
 * @returns Promise resolving to true if API is available
 */
export const checkTemplateApi = async (): Promise<boolean> => {
  try {
    // Reset the availability cache to force a fresh check
    resetApiAvailabilityCheck();
    return await checkTemplateApiAvailability();
  } catch (error) {
    console.error('Error checking template API:', error);
    return false;
  }
};

/**
 * Get template API stats
 * @returns Current API stats
 */
export const getTemplateApiStats = (): ApiStats => {
  return { ...stats };
};

/**
 * Record a successful API call
 * @param duration Duration of the call in milliseconds
 */
export const recordApiSuccess = (duration: number): void => {
  stats.successCount++;
  stats.lastSuccess = new Date();
  stats.lastDuration = duration;
  
  // Calculate average duration
  if (stats.averageDuration === null) {
    stats.averageDuration = duration;
  } else {
    stats.averageDuration = (stats.averageDuration * (stats.successCount - 1) + duration) / stats.successCount;
  }
  
  // Calculate uptime percentage
  stats.uptime = (stats.successCount / (stats.successCount + stats.errorCount)) * 100;
};

/**
 * Record a failed API call
 * @param error Error message or object
 * @param duration Duration of the call in milliseconds
 */
export const recordApiError = (error: any, duration: number): void => {
  stats.errorCount++;
  stats.lastError = new Date();
  stats.lastDuration = duration;
  
  // Store error message
  const errorMessage = error?.message || String(error);
  stats.errorMessages.unshift(errorMessage);
  
  // Only keep last 10 error messages
  if (stats.errorMessages.length > 10) {
    stats.errorMessages.pop();
  }
  
  // Calculate uptime percentage
  stats.uptime = (stats.successCount / (stats.successCount + stats.errorCount)) * 100;
};

/**
 * Test all template endpoint types
 * @returns Object with test results for each endpoint type
 */
export const testAllTemplateEndpoints = async (): Promise<Record<string, boolean>> => {
  const results: Record<string, boolean> = {};
  
  try {
    // Try each endpoint type
    const startTime = Date.now();
    
    try {
      await templateService.getTemplateCategories();
      results.categories = true;
      recordApiSuccess(Date.now() - startTime);
    } catch (error) {
      results.categories = false;
      recordApiError(error, Date.now() - startTime);
    }
    
    try {
      await templateService.getTemplateIndustries();
      results.industries = true;
      recordApiSuccess(Date.now() - startTime);
    } catch (error) {
      results.industries = false;
      recordApiError(error, Date.now() - startTime);
    }
    
    try {
      await templateService.getTemplateFormats();
      results.formats = true;
      recordApiSuccess(Date.now() - startTime);
    } catch (error) {
      results.formats = false;
      recordApiError(error, Date.now() - startTime);
    }
    
    try {
      await templateService.getTemplates();
      results.templates = true;
      recordApiSuccess(Date.now() - startTime);
    } catch (error) {
      results.templates = false;
      recordApiError(error, Date.now() - startTime);
    }
    
    try {
      await templateService.getPopularTemplates();
      results.popular = true;
      recordApiSuccess(Date.now() - startTime);
    } catch (error) {
      results.popular = false;
      recordApiError(error, Date.now() - startTime);
    }
    
    return results;
  } catch (error) {
    console.error('Error testing template endpoints:', error);
    return { all: false };
  }
};

export default {
  checkTemplateApi,
  getTemplateApiStats,
  testAllTemplateEndpoints
};