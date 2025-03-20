import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Brand {
  id: string;
  name: string;
  description: string;
  logo?: string | null;
  industry: string;
  website: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BrandsState {
  brands: Brand[];
  selectedBrand: Brand | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: BrandsState = {
  brands: [],
  selectedBrand: null,
  isLoading: false,
  error: null,
};

const brandsSlice = createSlice({
  name: 'brands',
  initialState,
  reducers: {
    fetchBrandsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchBrandsSuccess: (state, action: PayloadAction<Brand[]>) => {
      state.isLoading = false;
      state.brands = action.payload;
    },
    fetchBrandsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    selectBrand: (state, action: PayloadAction<string>) => {
      state.selectedBrand = state.brands.find(brand => brand.id === action.payload) || null;
    },
    clearSelectedBrand: (state) => {
      state.selectedBrand = null;
    },
    createBrandStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    createBrandSuccess: (state, action: PayloadAction<Brand>) => {
      state.isLoading = false;
      state.brands.push(action.payload);
    },
    createBrandFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateBrandStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    updateBrandSuccess: (state, action: PayloadAction<Brand>) => {
      state.isLoading = false;
      const index = state.brands.findIndex(brand => brand.id === action.payload.id);
      if (index !== -1) {
        state.brands[index] = action.payload;
      }
      if (state.selectedBrand && state.selectedBrand.id === action.payload.id) {
        state.selectedBrand = action.payload;
      }
    },
    updateBrandFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    deleteBrandStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    deleteBrandSuccess: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.brands = state.brands.filter(brand => brand.id !== action.payload);
      if (state.selectedBrand && state.selectedBrand.id === action.payload) {
        state.selectedBrand = null;
      }
    },
    deleteBrandFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchBrandsStart,
  fetchBrandsSuccess,
  fetchBrandsFailure,
  selectBrand,
  clearSelectedBrand,
  createBrandStart,
  createBrandSuccess,
  createBrandFailure,
  updateBrandStart,
  updateBrandSuccess,
  updateBrandFailure,
  deleteBrandStart,
  deleteBrandSuccess,
  deleteBrandFailure,
} = brandsSlice.actions;

export default brandsSlice.reducer;