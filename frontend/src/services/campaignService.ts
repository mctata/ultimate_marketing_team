import { apiMethods } from './api';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  budget?: number;
  platform?: string;
  brandId: string;
  kpis?: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    costPerClick?: number;
    costPerConversion?: number;
    roi?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CampaignFilters {
  status?: string;
  brandId?: string;
  platform?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface CreateCampaignInput {
  name: string;
  description: string;
  brandId: string;
  status: Campaign['status'];
  startDate: string;
  endDate?: string;
  budget?: number;
  platform?: string;
}

export interface UpdateCampaignInput extends Partial<CreateCampaignInput> {
  id: string;
}

export interface CampaignMetrics {
  campaignId: string;
  views: number;
  clicks: number;
  conversions: number;
  cost: number;
  revenue: number;
  roi: number;
  ctr: number;
  cpc: number;
  date: string;
  platformData: Record<string, any>;
}

export interface AdSet {
  id: string;
  campaignId: string;
  name: string;
  status: 'active' | 'paused';
  budget: number;
  startDate: string;
  endDate: string;
  targeting: Record<string, any>;
  ads: Ad[];
}

export interface Ad {
  id: string;
  adSetId: string;
  name: string;
  status: 'active' | 'paused' | 'rejected';
  contentId: string;
  headline: string;
  description: string;
  imageUrl: string;
  imageVariants?: Record<string, string>;  // Platform-specific image variants
  imageFocalPoint?: { x: number; y: number };  // Stored focal point
  callToAction: string;
  url: string;
  performance: Record<string, number>;
}

// Mock data for development
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Summer Collection Launch',
    description: 'Promotion for our new summer apparel line',
    status: 'active',
    startDate: '2025-04-01T00:00:00Z',
    endDate: '2025-06-30T00:00:00Z',
    budget: 5000,
    platform: 'facebook',
    brandId: '2',
    kpis: {
      impressions: 50000,
      clicks: 2500,
      conversions: 120,
      costPerClick: 1.25,
      costPerConversion: 26.04,
      roi: 2.8
    },
    createdAt: '2025-03-15T00:00:00Z',
    updatedAt: '2025-03-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'Q2 Lead Generation',
    description: 'B2B lead generation campaign targeting CTOs',
    status: 'draft',
    startDate: '2025-04-15T00:00:00Z',
    budget: 7500,
    platform: 'linkedin',
    brandId: '1',
    createdAt: '2025-03-10T00:00:00Z',
    updatedAt: '2025-03-10T00:00:00Z'
  },
  {
    id: '3',
    name: 'Product Launch: Home Fitness',
    description: 'Campaign for new home fitness product line',
    status: 'active',
    startDate: '2025-03-01T00:00:00Z',
    endDate: '2025-05-31T00:00:00Z',
    budget: 12000,
    platform: 'google,instagram',
    brandId: '3',
    kpis: {
      impressions: 120000,
      clicks: 8500,
      conversions: 320,
      costPerClick: 0.95,
      costPerConversion: 25.21,
      roi: 3.5
    },
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2025-03-05T00:00:00Z'
  },
  {
    id: '4',
    name: 'Interior Design Spring Showcase',
    description: 'Showcase of spring collection for interior design',
    status: 'paused',
    startDate: '2025-03-10T00:00:00Z',
    endDate: '2025-04-10T00:00:00Z',
    budget: 3000,
    platform: 'instagram,pinterest',
    brandId: '4',
    kpis: {
      impressions: 35000,
      clicks: 2100,
      conversions: 45,
      costPerClick: 1.05,
      costPerConversion: 49.00,
      roi: 1.8
    },
    createdAt: '2025-02-28T00:00:00Z',
    updatedAt: '2025-03-15T00:00:00Z'
  }
];

// Mock metrics data
const mockMetrics: Record<string, CampaignMetrics[]> = {
  '1': [
    {
      campaignId: '1',
      views: 15000,
      clicks: 750,
      conversions: 35,
      cost: 937.50,
      revenue: 2625,
      roi: 2.8,
      ctr: 5.0,
      cpc: 1.25,
      date: '2025-04-01T00:00:00Z',
      platformData: { platform: 'facebook' }
    }
  ],
  '3': [
    {
      campaignId: '3',
      views: 40000,
      clicks: 2800,
      conversions: 105,
      cost: 2660,
      revenue: 9310,
      roi: 3.5,
      ctr: 7.0,
      cpc: 0.95,
      date: '2025-03-01T00:00:00Z',
      platformData: { platform: 'google,instagram' }
    }
  ],
  '4': [
    {
      campaignId: '4',
      views: 35000,
      clicks: 2100,
      conversions: 45,
      cost: 2205,
      revenue: 3969,
      roi: 1.8,
      ctr: 6.0,
      cpc: 1.05,
      date: '2025-03-10T00:00:00Z',
      platformData: { platform: 'instagram,pinterest' }
    }
  ]
};

class CampaignService {
  /**
   * Get campaigns with optional filters
   */
  async getCampaigns(filters: CampaignFilters = {}): Promise<Campaign[]> {
    try {
      // First try API
      return await apiMethods.get<Campaign[]>('/campaigns', filters);
    } catch (error) {
      console.log('Using mock campaigns data for development');
      // Fall back to mock data for development
      let filtered = [...mockCampaigns];
      
      // Apply filters
      if (filters.brandId) {
        filtered = filtered.filter(c => c.brandId === filters.brandId);
      }
      
      if (filters.status) {
        filtered = filtered.filter(c => c.status === filters.status);
      }
      
      if (filters.platform) {
        filtered = filtered.filter(c => c.platform?.includes(filters.platform));
      }
      
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(c => 
          c.name.toLowerCase().includes(query) || 
          c.description.toLowerCase().includes(query)
        );
      }
      
      return Promise.resolve(filtered);
    }
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaignById(id: string): Promise<Campaign> {
    try {
      // First try API
      return await apiMethods.get<Campaign>(`/campaigns/${id}`);
    } catch (error) {
      console.log(`Using mock campaign data for ID: ${id}`);
      // Fall back to mock data for development
      const campaign = mockCampaigns.find(c => c.id === id);
      if (!campaign) {
        throw new Error(`Campaign with ID ${id} not found`);
      }
      return Promise.resolve({...campaign});
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(campaignData: CreateCampaignInput): Promise<Campaign> {
    return apiMethods.post<Campaign>('/campaigns', campaignData);
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(id: string, campaignData: Partial<CreateCampaignInput>): Promise<Campaign> {
    return apiMethods.put<Campaign>(`/campaigns/${id}`, campaignData);
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(id: string): Promise<void> {
    return apiMethods.delete<void>(`/campaigns/${id}`);
  }

  /**
   * Change campaign status
   */
  async updateCampaignStatus(id: string, status: Campaign['status']): Promise<Campaign> {
    return apiMethods.patch<Campaign>(`/campaigns/${id}/status`, { status });
  }

  /**
   * Get campaign metrics
   */
  async getCampaignMetrics(campaignId: string, timeRange?: { startDate: string; endDate: string }): Promise<CampaignMetrics[]> {
    try {
      // First try API
      return await apiMethods.get<CampaignMetrics[]>(`/campaigns/${campaignId}/metrics`, timeRange);
    } catch (error) {
      console.log(`Using mock metrics data for campaign ID: ${campaignId}`);
      // Fall back to mock data for development
      const metrics = mockMetrics[campaignId] || [];
      return Promise.resolve([...metrics]);
    }
  }

  /**
   * Get all ad sets for a campaign
   */
  async getAdSets(campaignId: string): Promise<AdSet[]> {
    return apiMethods.get<AdSet[]>(`/campaigns/${campaignId}/adsets`);
  }

  /**
   * Get a single ad set by ID
   */
  async getAdSetById(campaignId: string, adSetId: string): Promise<AdSet> {
    return apiMethods.get<AdSet>(`/campaigns/${campaignId}/adsets/${adSetId}`);
  }

  /**
   * Create a new ad set
   */
  async createAdSet(campaignId: string, adSetData: Omit<AdSet, 'id' | 'campaignId' | 'ads'>): Promise<AdSet> {
    return apiMethods.post<AdSet>(`/campaigns/${campaignId}/adsets`, adSetData);
  }

  /**
   * Update an existing ad set
   */
  async updateAdSet(campaignId: string, adSetId: string, adSetData: Partial<AdSet>): Promise<AdSet> {
    return apiMethods.put<AdSet>(`/campaigns/${campaignId}/adsets/${adSetId}`, adSetData);
  }

  /**
   * Delete an ad set
   */
  async deleteAdSet(campaignId: string, adSetId: string): Promise<void> {
    return apiMethods.delete<void>(`/campaigns/${campaignId}/adsets/${adSetId}`);
  }

  /**
   * Get all ads for an ad set
   */
  async getAds(campaignId: string, adSetId: string): Promise<Ad[]> {
    return apiMethods.get<Ad[]>(`/campaigns/${campaignId}/adsets/${adSetId}/ads`);
  }

  /**
   * Get a single ad by ID
   */
  async getAdById(campaignId: string, adSetId: string, adId: string): Promise<Ad> {
    return apiMethods.get<Ad>(`/campaigns/${campaignId}/adsets/${adSetId}/ads/${adId}`);
  }

  /**
   * Create a new ad
   */
  async createAd(campaignId: string, adSetId: string, adData: Omit<Ad, 'id' | 'adSetId'>): Promise<Ad> {
    return apiMethods.post<Ad>(`/campaigns/${campaignId}/adsets/${adSetId}/ads`, adData);
  }

  /**
   * Update an existing ad
   */
  async updateAd(campaignId: string, adSetId: string, adId: string, adData: Partial<Ad>): Promise<Ad> {
    return apiMethods.put<Ad>(`/campaigns/${campaignId}/adsets/${adSetId}/ads/${adId}`, adData);
  }

  /**
   * Delete an ad
   */
  async deleteAd(campaignId: string, adSetId: string, adId: string): Promise<void> {
    return apiMethods.delete<void>(`/campaigns/${campaignId}/adsets/${adSetId}/ads/${adId}`);
  }
}

export default new CampaignService();