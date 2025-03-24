import { configureStore, combineReducers } from '@reduxjs/toolkit';
import campaignReducer from './slices/campaignSlice';
import contentReducer from './slices/contentSlice';
import templateReducer from './slices/templateSlice';
import analyticsReducer from './slices/analyticsSlice';
import predictiveAnalyticsReducer from './slices/predictiveAnalyticsSlice';
import campaignRulesReducer from './slices/campaignRulesSlice';

const rootReducer = combineReducers({
  campaigns: campaignReducer,
  content: contentReducer,
  templates: templateReducer,
  analytics: analyticsReducer,
  predictiveAnalytics: predictiveAnalyticsReducer,
  campaignRules: campaignRulesReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
