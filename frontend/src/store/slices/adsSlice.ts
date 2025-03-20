import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Ad {
  id: string;
  title: string;
  description: string;
  content: string;
  brandId: string;
  campaignId?: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  type: 'display' | 'search' | 'social' | 'video';
  platform: 'google' | 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'youtube' | 'other';
  budget?: number;
  startDate?: string;
  endDate?: string;
  metrics?: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    ctr: number;
    cpc: number;
    conversionRate: number;
  };
  targeting?: {
    locations?: string[];
    ageRange?: string[];
    gender?: string[];
    interests?: string[];
    keywords?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface AdsState {
  ads: Ad[];
  selectedAd: Ad | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    type?: string;
    platform?: string;
    brandId?: string;
    campaignId?: string;
    searchQuery?: string;
  };
}

const initialState: AdsState = {
  ads: [],
  selectedAd: null,
  isLoading: false,
  error: null,
  filters: {},
};

const adsSlice = createSlice({
  name: 'ads',
  initialState,
  reducers: {
    fetchAdsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchAdsSuccess: (state, action: PayloadAction<Ad[]>) => {
      state.isLoading = false;
      state.ads = action.payload;
    },
    fetchAdsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    selectAd: (state, action: PayloadAction<string>) => {
      state.selectedAd = state.ads.find(ad => ad.id === action.payload) || null;
    },
    clearSelectedAd: (state) => {
      state.selectedAd = null;
    },
    createAdStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    createAdSuccess: (state, action: PayloadAction<Ad>) => {
      state.isLoading = false;
      state.ads.push(action.payload);
    },
    createAdFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateAd: (state, action: PayloadAction<Ad>) => {
      const index = state.ads.findIndex(ad => ad.id === action.payload.id);
      if (index !== -1) {
        state.ads[index] = action.payload;
      }
      if (state.selectedAd && state.selectedAd.id === action.payload.id) {
        state.selectedAd = action.payload;
      }
    },
    updateAdStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    updateAdSuccess: (state, action: PayloadAction<Ad>) => {
      state.isLoading = false;
      const index = state.ads.findIndex(ad => ad.id === action.payload.id);
      if (index !== -1) {
        state.ads[index] = action.payload;
      }
      if (state.selectedAd && state.selectedAd.id === action.payload.id) {
        state.selectedAd = action.payload;
      }
    },
    updateAdFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    deleteAdStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    deleteAdSuccess: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.ads = state.ads.filter(ad => ad.id !== action.payload);
      if (state.selectedAd && state.selectedAd.id === action.payload) {
        state.selectedAd = null;
      }
    },
    deleteAdFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setAdFilters: (state, action: PayloadAction<Partial<AdsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearAdFilters: (state) => {
      state.filters = {};
    },
  },
});

export const {
  fetchAdsStart,
  fetchAdsSuccess,
  fetchAdsFailure,
  selectAd,
  clearSelectedAd,
  createAdStart,
  createAdSuccess,
  createAdFailure,
  updateAd,
  updateAdStart,
  updateAdSuccess,
  updateAdFailure,
  deleteAdStart,
  deleteAdSuccess,
  deleteAdFailure,
  setAdFilters,
  clearAdFilters,
} = adsSlice.actions;

export default adsSlice.reducer;