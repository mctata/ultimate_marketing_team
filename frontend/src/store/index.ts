import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import brandsReducer from './slices/brandsSlice';
import contentReducer from './slices/contentSlice';
import campaignsReducer from './slices/campaignsSlice';
import analyticsReducer from './slices/analyticsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    brands: brandsReducer,
    content: contentReducer,
    campaigns: campaignsReducer,
    analytics: analyticsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;