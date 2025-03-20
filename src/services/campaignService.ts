import api from './api';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  start_date: string;
  end_date: string;
  budget: number;
  platform: string;
  target_audience: Record<string, any>;
  brand_id: string;
  content_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CampaignMetrics {
  campaign_id: string;
  views: number;
  clicks: number;
  conversions: number;
  cost: number;
  revenue: number;
  roi: number;
  ctr: number;
  cpc: number;
  date: string;
  platform_data: Record<string, any>;
}

export interface AdSet {
  id: string;
  campaign_id: string;
  name: string;
  status: 'active' | 'paused';
  budget: number;
  start_date: string;
  end_date: string;
  targeting: Record<string, any>;
  ads: Ad[];
}

export interface Ad {
  id: string;
  ad_set_id: string;
  name: string;
  status: 'active' | 'paused' | 'rejected';
  content_id: string;
  headline: string;
  description: string;
  image_url: string;
  image_variants?: Record<string, string>;  // Platform-specific image variants
  image_focal_point?: { x: number; y: number };  // Stored focal point
  call_to_action: string;
  url: string;
  performance: Record<string, number>;
}

// Campaign APIs
export const getCampaigns = (params?: { brand_id?: string; status?: string }) => 
  api.get<Campaign[]>('/campaigns', { params });

export const getCampaignById = (id: string) => 
  api.get<Campaign>(`/campaigns/${id}`);

export const createCampaign = (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => 
  api.post<Campaign>('/campaigns', campaign);

export const updateCampaign = (id: string, campaign: Partial<Campaign>) => 
  api.put<Campaign>(`/campaigns/${id}`, campaign);

export const deleteCampaign = (id: string) => 
  api.delete(`/campaigns/${id}`);

// Campaign Metrics APIs
export const getCampaignMetrics = (campaignId: string, timeRange?: { start_date: string; end_date: string }) => 
  api.get<CampaignMetrics[]>(`/campaigns/${campaignId}/metrics`, { params: timeRange });

// AdSet APIs
export const getAdSets = (campaignId: string) => 
  api.get<AdSet[]>(`/campaigns/${campaignId}/adsets`);

export const getAdSetById = (campaignId: string, adSetId: string) => 
  api.get<AdSet>(`/campaigns/${campaignId}/adsets/${adSetId}`);

export const createAdSet = (campaignId: string, adSet: Omit<AdSet, 'id' | 'campaign_id' | 'ads'>) => 
  api.post<AdSet>(`/campaigns/${campaignId}/adsets`, adSet);

export const updateAdSet = (campaignId: string, adSetId: string, adSet: Partial<AdSet>) => 
  api.put<AdSet>(`/campaigns/${campaignId}/adsets/${adSetId}`, adSet);

export const deleteAdSet = (campaignId: string, adSetId: string) => 
  api.delete(`/campaigns/${campaignId}/adsets/${adSetId}`);

// Ad APIs
export const getAds = (campaignId: string, adSetId: string) => 
  api.get<Ad[]>(`/campaigns/${campaignId}/adsets/${adSetId}/ads`);

export const getAdById = (campaignId: string, adSetId: string, adId: string) => 
  api.get<Ad>(`/campaigns/${campaignId}/adsets/${adSetId}/ads/${adId}`);

export const createAd = (campaignId: string, adSetId: string, ad: Omit<Ad, 'id' | 'ad_set_id'>) => 
  api.post<Ad>(`/campaigns/${campaignId}/adsets/${adSetId}/ads`, ad);

export const updateAd = (campaignId: string, adSetId: string, adId: string, ad: Partial<Ad>) => 
  api.put<Ad>(`/campaigns/${campaignId}/adsets/${adSetId}/ads/${adId}`, ad);

export const deleteAd = (campaignId: string, adSetId: string, adId: string) => 
  api.delete(`/campaigns/${campaignId}/adsets/${adSetId}/ads/${adId}`);