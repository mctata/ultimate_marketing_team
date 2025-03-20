import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Campaign {
  id: string;
  name: string;
  description: string;
  brandId: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  budget?: number;
  platform?: string;
  kpis: {
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

interface CampaignsState {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    brandId?: string;
    platform?: string;
    searchQuery?: string;
  };
}

const initialState: CampaignsState = {
  campaigns: [],
  selectedCampaign: null,
  isLoading: false,
  error: null,
  filters: {},
};

const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    fetchCampaignsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchCampaignsSuccess: (state, action: PayloadAction<Campaign[]>) => {
      state.isLoading = false;
      state.campaigns = action.payload;
    },
    fetchCampaignsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    selectCampaign: (state, action: PayloadAction<string>) => {
      state.selectedCampaign = state.campaigns.find(campaign => campaign.id === action.payload) || null;
    },
    clearSelectedCampaign: (state) => {
      state.selectedCampaign = null;
    },
    createCampaignStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    createCampaignSuccess: (state, action: PayloadAction<Campaign>) => {
      state.isLoading = false;
      state.campaigns.push(action.payload);
    },
    createCampaignFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateCampaignStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    updateCampaignSuccess: (state, action: PayloadAction<Campaign>) => {
      state.isLoading = false;
      const index = state.campaigns.findIndex(campaign => campaign.id === action.payload.id);
      if (index !== -1) {
        state.campaigns[index] = action.payload;
      }
      if (state.selectedCampaign && state.selectedCampaign.id === action.payload.id) {
        state.selectedCampaign = action.payload;
      }
    },
    updateCampaignFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    deleteCampaignStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    deleteCampaignSuccess: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.campaigns = state.campaigns.filter(campaign => campaign.id !== action.payload);
      if (state.selectedCampaign && state.selectedCampaign.id === action.payload) {
        state.selectedCampaign = null;
      }
    },
    deleteCampaignFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setCampaignFilters: (state, action: PayloadAction<Partial<CampaignsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCampaignFilters: (state) => {
      state.filters = {};
    },
  },
});

export const {
  fetchCampaignsStart,
  fetchCampaignsSuccess,
  fetchCampaignsFailure,
  selectCampaign,
  clearSelectedCampaign,
  createCampaignStart,
  createCampaignSuccess,
  createCampaignFailure,
  updateCampaignStart,
  updateCampaignSuccess,
  updateCampaignFailure,
  deleteCampaignStart,
  deleteCampaignSuccess,
  deleteCampaignFailure,
  setCampaignFilters,
  clearCampaignFilters,
} = campaignsSlice.actions;

export default campaignsSlice.reducer;