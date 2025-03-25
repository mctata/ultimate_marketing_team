import { 
  sampleAudience, 
  behaviors, 
  interests, 
  lifeEvents, 
  customAudiences,
  audienceOverlap
} from '../data/audienceData';
import { AudienceTarget, AudienceOverlapData } from '../types/audience';

// Simulate API calls with delay and mock data
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const audienceService = {
  // Get audience by ID
  getAudience: async (id: string): Promise<AudienceTarget> => {
    await delay(500);
    return sampleAudience;
  },

  // Get all behaviors for targeting
  getBehaviors: async () => {
    await delay(300);
    return behaviors;
  },

  // Get all interests for targeting
  getInterests: async () => {
    await delay(300);
    return interests;
  },

  // Get all life events for targeting
  getLifeEvents: async () => {
    await delay(300);
    return lifeEvents;
  },

  // Get custom audiences
  getCustomAudiences: async () => {
    await delay(300);
    return customAudiences;
  },

  // Create or update audience
  saveAudience: async (audience: AudienceTarget): Promise<AudienceTarget> => {
    await delay(800);
    return {
      ...audience,
      estimatedReach: Math.floor(Math.random() * 2000000) + 500000,
      estimatedDailyResults: Math.floor(Math.random() * 15000) + 2000,
    };
  },

  // Delete audience
  deleteAudience: async (id: string): Promise<boolean> => {
    await delay(500);
    return true;
  },

  // Get audience reach estimate based on targeting criteria
  getReachEstimate: async (audience: Partial<AudienceTarget>): Promise<{ reach: number, dailyResults: number }> => {
    try {
      // Shorter delay in development for better UX
      await delay(300);
      
      // Calculate reach based on audience criteria with deterministic values
      let baseReach = 1000000;
      
      // Age range affects reach
      if (audience.demographic?.ageRange) {
        const range = audience.demographic.ageRange.max - audience.demographic.ageRange.min;
        baseReach = baseReach * (range / 65); // Normalize by maximum age range
      }
      
      // Gender affects reach
      if (audience.demographic?.gender && audience.demographic.gender !== 'all') {
        baseReach = baseReach * 0.5;
      }
      
      // Locations affect reach
      if (audience.demographic?.locations) {
        baseReach = baseReach * Math.min(audience.demographic.locations.length, 10) / 5;
      }
      
      // Interests, behaviors reduce reach as they're more targeted
      if (audience.interests) {
        baseReach = baseReach * (0.8 - (audience.interests.length * 0.05));
      }
      
      // Generate deterministic values based on audience properties
      // Use a hash of audience properties instead of random numbers
      const audienceHash = audience.demographic?.gender?.charCodeAt(0) || 0 +
        (audience.demographic?.ageRange?.min || 25) +
        (audience.demographic?.ageRange?.max || 65) +
        (audience.demographic?.locations?.length || 1) * 10 +
        (audience.interests?.length || 0) * 5 +
        (audience.behaviors?.length || 0) * 7;
      
      // Deterministic "random" value between 0-1 based on hash
      const deterministicRandom = (audienceHash % 1000) / 1000;
      
      // Fixed conversion rate based on deterministic value (0.5-2%)
      const conversionRate = 0.01 + (deterministicRandom * 0.015);
      
      // Round to nearest thousand for stability
      const reachValue = Math.round((baseReach + (deterministicRandom * 300000)) / 1000) * 1000;
      const dailyResultsValue = Math.round((baseReach * conversionRate) / 100) * 100;
      
      return {
        reach: reachValue,
        dailyResults: dailyResultsValue,
      };
    } catch (error) {
      console.error('Error in getReachEstimate:', error);
      // Return default values in case of error
      return {
        reach: 750000,
        dailyResults: 7500
      };
    }
  },

  // Create a lookalike audience
  createLookalikeAudience: async (sourceId: string, params: {
    similarityLevel: number;
    size: number;
    countries: string[];
  }): Promise<{ id: string; name: string; estimatedSize: number }> => {
    await delay(1000);
    return {
      id: `lookalike-${Date.now()}`,
      name: `Lookalike Audience ${new Date().toLocaleDateString()}`,
      estimatedSize: Math.floor(Math.random() * 1000000) + 200000,
    };
  },

  // Get audience overlap analysis
  getAudienceOverlap: async (audienceIds: string[]): Promise<AudienceOverlapData[]> => {
    await delay(800);
    return audienceOverlap;
  },
};

export default audienceService;
