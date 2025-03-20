import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as campaignService from '../../services/campaignService';
import { RootState } from '..';

// Import types
import { 
  Campaign, 
  CampaignMetrics, 
  AdSet, 
  Ad
} from '../../services/campaignService';

interface CampaignState {
  campaigns: {
    data: Campaign[];
    loading: boolean;
    error: string | null;
    selectedCampaign: Campaign | null;
  };
  adSets: {
    data: AdSet[];
    loading: boolean;
    error: string | null;
    selectedAdSet: AdSet | null;
  };
  ads: {
    data: Ad[];
    loading: boolean;
    error: string | null;
    selectedAd: Ad | null;
  };
  metrics: {
    data: CampaignMetrics[];
    loading: boolean;
    error: string | null;
  };
  filters: {
    brandId?: string;
    status?: string;
    dateRange?: { startDate: string; endDate: string };
  };
}

const initialState: CampaignState = {
  campaigns: {
    data: [],
    loading: false,
    error: null,
    selectedCampaign: null,
  },
  adSets: {
    data: [],
    loading: false,
    error: null,
    selectedAdSet: null,
  },
  ads: {
    data: [],
    loading: false,
    error: null,
    selectedAd: null,
  },
  metrics: {
    data: [],
    loading: false,
    error: null,
  },
  filters: {},
};

// Async Thunks for Campaigns
export const fetchCampaigns = createAsyncThunk(
  'campaigns/fetchCampaigns',
  async (params: { brandId?: string; status?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await campaignService.getCampaigns({
        brand_id: params.brandId,
        status: params.status
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch campaigns');
    }
  }
);

export const fetchCampaignById = createAsyncThunk(
  'campaigns/fetchCampaignById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await campaignService.getCampaignById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch campaign');
    }
  }
);

export const createCampaign = createAsyncThunk(
  'campaigns/createCampaign',
  async (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>, { rejectWithValue }) => {
    try {
      const response = await campaignService.createCampaign(campaign);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create campaign');
    }
  }
);

export const updateCampaign = createAsyncThunk(
  'campaigns/updateCampaign',
  async ({ id, campaign }: { id: string; campaign: Partial<Campaign> }, { rejectWithValue }) => {
    try {
      const response = await campaignService.updateCampaign(id, campaign);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update campaign');
    }
  }
);

export const deleteCampaign = createAsyncThunk(
  'campaigns/deleteCampaign',
  async (id: string, { rejectWithValue }) => {
    try {
      await campaignService.deleteCampaign(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete campaign');
    }
  }
);

// Async Thunks for Ad Sets
export const fetchAdSets = createAsyncThunk(
  'campaigns/fetchAdSets',
  async (campaignId: string, { rejectWithValue }) => {
    try {
      const response = await campaignService.getAdSets(campaignId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch ad sets');
    }
  }
);

export const fetchAdSetById = createAsyncThunk(
  'campaigns/fetchAdSetById',
  async ({ campaignId, adSetId }: { campaignId: string; adSetId: string }, { rejectWithValue }) => {
    try {
      const response = await campaignService.getAdSetById(campaignId, adSetId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch ad set');
    }
  }
);

export const createAdSet = createAsyncThunk(
  'campaigns/createAdSet',
  async ({ campaignId, adSet }: { campaignId: string; adSet: Omit<AdSet, 'id' | 'campaign_id' | 'ads'> }, { rejectWithValue }) => {
    try {
      const response = await campaignService.createAdSet(campaignId, adSet);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create ad set');
    }
  }
);

export const updateAdSet = createAsyncThunk(
  'campaigns/updateAdSet',
  async ({ campaignId, adSetId, adSet }: { campaignId: string; adSetId: string; adSet: Partial<AdSet> }, { rejectWithValue }) => {
    try {
      const response = await campaignService.updateAdSet(campaignId, adSetId, adSet);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update ad set');
    }
  }
);

export const deleteAdSet = createAsyncThunk(
  'campaigns/deleteAdSet',
  async ({ campaignId, adSetId }: { campaignId: string; adSetId: string }, { rejectWithValue }) => {
    try {
      await campaignService.deleteAdSet(campaignId, adSetId);
      return adSetId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete ad set');
    }
  }
);

// Async Thunks for Ads
export const fetchAds = createAsyncThunk(
  'campaigns/fetchAds',
  async ({ campaignId, adSetId }: { campaignId: string; adSetId: string }, { rejectWithValue }) => {
    try {
      const response = await campaignService.getAds(campaignId, adSetId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch ads');
    }
  }
);

export const fetchAdById = createAsyncThunk(
  'campaigns/fetchAdById',
  async ({ campaignId, adSetId, adId }: { campaignId: string; adSetId: string; adId: string }, { rejectWithValue }) => {
    try {
      const response = await campaignService.getAdById(campaignId, adSetId, adId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch ad');
    }
  }
);

export const createAd = createAsyncThunk(
  'campaigns/createAd',
  async ({ campaignId, adSetId, ad }: { campaignId: string; adSetId: string; ad: Omit<Ad, 'id' | 'ad_set_id'> }, { rejectWithValue }) => {
    try {
      const response = await campaignService.createAd(campaignId, adSetId, ad);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create ad');
    }
  }
);

export const updateAd = createAsyncThunk(
  'campaigns/updateAd',
  async ({ campaignId, adSetId, adId, ad }: { campaignId: string; adSetId: string; adId: string; ad: Partial<Ad> }, { rejectWithValue }) => {
    try {
      const response = await campaignService.updateAd(campaignId, adSetId, adId, ad);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update ad');
    }
  }
);

export const deleteAd = createAsyncThunk(
  'campaigns/deleteAd',
  async ({ campaignId, adSetId, adId }: { campaignId: string; adSetId: string; adId: string }, { rejectWithValue }) => {
    try {
      await campaignService.deleteAd(campaignId, adSetId, adId);
      return adId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete ad');
    }
  }
);

// Async Thunks for Campaign Metrics
export const fetchCampaignMetrics = createAsyncThunk(
  'campaigns/fetchCampaignMetrics',
  async ({ campaignId, timeRange }: { campaignId: string; timeRange?: { start_date: string; end_date: string } }, { rejectWithValue }) => {
    try {
      const response = await campaignService.getCampaignMetrics(campaignId, timeRange);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch campaign metrics');
    }
  }
);

const campaignSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<CampaignState['filters']>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedCampaign(state) {
      state.campaigns.selectedCampaign = null;
    },
    clearSelectedAdSet(state) {
      state.adSets.selectedAdSet = null;
    },
    clearSelectedAd(state) {
      state.ads.selectedAd = null;
    },
  },
  extraReducers: (builder) => {
    // Campaign reducers
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.campaigns.loading = true;
        state.campaigns.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.campaigns.loading = false;
        state.campaigns.data = action.payload;
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.campaigns.loading = false;
        state.campaigns.error = action.payload as string;
      })
      .addCase(fetchCampaignById.pending, (state) => {
        state.campaigns.loading = true;
        state.campaigns.error = null;
      })
      .addCase(fetchCampaignById.fulfilled, (state, action) => {
        state.campaigns.loading = false;
        state.campaigns.selectedCampaign = action.payload;
      })
      .addCase(fetchCampaignById.rejected, (state, action) => {
        state.campaigns.loading = false;
        state.campaigns.error = action.payload as string;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.campaigns.data.unshift(action.payload);
        state.campaigns.selectedCampaign = action.payload;
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        const index = state.campaigns.data.findIndex(campaign => campaign.id === action.payload.id);
        if (index !== -1) {
          state.campaigns.data[index] = action.payload;
        }
        state.campaigns.selectedCampaign = action.payload;
      })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.campaigns.data = state.campaigns.data.filter(campaign => campaign.id !== action.payload);
        if (state.campaigns.selectedCampaign?.id === action.payload) {
          state.campaigns.selectedCampaign = null;
        }
      })
      
    // Ad Set reducers
    builder
      .addCase(fetchAdSets.pending, (state) => {
        state.adSets.loading = true;
        state.adSets.error = null;
      })
      .addCase(fetchAdSets.fulfilled, (state, action) => {
        state.adSets.loading = false;
        state.adSets.data = action.payload;
      })
      .addCase(fetchAdSets.rejected, (state, action) => {
        state.adSets.loading = false;
        state.adSets.error = action.payload as string;
      })
      .addCase(fetchAdSetById.fulfilled, (state, action) => {
        state.adSets.selectedAdSet = action.payload;
      })
      .addCase(createAdSet.fulfilled, (state, action) => {
        state.adSets.data.push(action.payload);
        state.adSets.selectedAdSet = action.payload;
      })
      .addCase(updateAdSet.fulfilled, (state, action) => {
        const index = state.adSets.data.findIndex(adSet => adSet.id === action.payload.id);
        if (index !== -1) {
          state.adSets.data[index] = action.payload;
        }
        state.adSets.selectedAdSet = action.payload;
      })
      .addCase(deleteAdSet.fulfilled, (state, action) => {
        state.adSets.data = state.adSets.data.filter(adSet => adSet.id !== action.payload);
        if (state.adSets.selectedAdSet?.id === action.payload) {
          state.adSets.selectedAdSet = null;
        }
      })
      
    // Ad reducers
    builder
      .addCase(fetchAds.pending, (state) => {
        state.ads.loading = true;
        state.ads.error = null;
      })
      .addCase(fetchAds.fulfilled, (state, action) => {
        state.ads.loading = false;
        state.ads.data = action.payload;
      })
      .addCase(fetchAds.rejected, (state, action) => {
        state.ads.loading = false;
        state.ads.error = action.payload as string;
      })
      .addCase(fetchAdById.fulfilled, (state, action) => {
        state.ads.selectedAd = action.payload;
      })
      .addCase(createAd.fulfilled, (state, action) => {
        state.ads.data.push(action.payload);
        state.ads.selectedAd = action.payload;
      })
      .addCase(updateAd.fulfilled, (state, action) => {
        const index = state.ads.data.findIndex(ad => ad.id === action.payload.id);
        if (index !== -1) {
          state.ads.data[index] = action.payload;
        }
        state.ads.selectedAd = action.payload;
      })
      .addCase(deleteAd.fulfilled, (state, action) => {
        state.ads.data = state.ads.data.filter(ad => ad.id !== action.payload);
        if (state.ads.selectedAd?.id === action.payload) {
          state.ads.selectedAd = null;
        }
      })
      
    // Metrics reducers
    builder
      .addCase(fetchCampaignMetrics.pending, (state) => {
        state.metrics.loading = true;
        state.metrics.error = null;
      })
      .addCase(fetchCampaignMetrics.fulfilled, (state, action) => {
        state.metrics.loading = false;
        state.metrics.data = action.payload;
      })
      .addCase(fetchCampaignMetrics.rejected, (state, action) => {
        state.metrics.loading = false;
        state.metrics.error = action.payload as string;
      });
  },
});

// Selectors
export const selectCampaigns = (state: RootState) => state.campaigns.campaigns.data;
export const selectCampaignsLoading = (state: RootState) => state.campaigns.campaigns.loading;
export const selectCampaignsError = (state: RootState) => state.campaigns.campaigns.error;
export const selectSelectedCampaign = (state: RootState) => state.campaigns.campaigns.selectedCampaign;

export const selectAdSets = (state: RootState) => state.campaigns.adSets.data;
export const selectAdSetsLoading = (state: RootState) => state.campaigns.adSets.loading;
export const selectSelectedAdSet = (state: RootState) => state.campaigns.adSets.selectedAdSet;

export const selectAds = (state: RootState) => state.campaigns.ads.data;
export const selectAdsLoading = (state: RootState) => state.campaigns.ads.loading;
export const selectSelectedAd = (state: RootState) => state.campaigns.ads.selectedAd;

export const selectCampaignMetrics = (state: RootState) => state.campaigns.metrics.data;
export const selectMetricsLoading = (state: RootState) => state.campaigns.metrics.loading;

export const selectCampaignFilters = (state: RootState) => state.campaigns.filters;

export const { setFilters, clearSelectedCampaign, clearSelectedAdSet, clearSelectedAd } = campaignSlice.actions;

export default campaignSlice.reducer;