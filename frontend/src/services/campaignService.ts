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

class CampaignService {
  /**
   * Get campaigns with optional filters
   */
  async getCampaigns(filters: CampaignFilters = {}): Promise<Campaign[]> {
    return apiMethods.get<Campaign[]>('/campaigns', filters);
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaignById(id: string): Promise<Campaign> {
    return apiMethods.get<Campaign>(`/campaigns/${id}`);
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
    return apiMethods.get<CampaignMetrics[]>(`/campaigns/${campaignId}/metrics`, timeRange);
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