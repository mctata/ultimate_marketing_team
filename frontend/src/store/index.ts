import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, createTransform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import reducers
import authReducer from './slices/authSlice';
import brandsReducer from './slices/brandsSlice';
import contentReducer from './slices/contentSlice';
import campaignsReducer from './slices/campaignsSlice';
import analyticsReducer from './slices/analyticsSlice';
import uiReducer from './slices/uiSlice';
import adsReducer from './slices/adsSlice';
import projectsReducer from './slices/projectsSlice';
import predictiveAnalyticsReducer from './slices/predictiveAnalyticsSlice';
import campaignRulesReducer from './slices/campaignRulesSlice';

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  brands: brandsReducer,
  content: contentReducer,
  campaigns: campaignsReducer,
  analytics: analyticsReducer,
  ui: uiReducer,
  ads: adsReducer,
  projects: projectsReducer,
  predictiveAnalytics: predictiveAnalyticsReducer,
  campaignRules: campaignRulesReducer,
});

interface AuthPersistState {
  user?: Record<string, any>;
}

// Configuration for each persistable slice
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user'], // Only persist user data, not the entire slice
  transforms: [
    createTransform<AuthPersistState, AuthPersistState>(
      // On save
      (state) => {
        if (state?.user) {
          return {
            user: state.user
          };
        }
        return state;
      },
      // On load
      (state) => state
    )
  ]
};

interface UIPersistState {
  darkMode?: boolean;
  currentTheme?: string;
  sidebarOpen?: boolean;
}

const uiPersistConfig = {
  key: 'ui',
  storage,
  whitelist: ['darkMode', 'currentTheme', 'sidebarOpen'], // Only persist UI preferences
  transforms: [
    createTransform<UIPersistState, UIPersistState>(
      // On save
      (state) => {
        return {
          darkMode: state.darkMode,
          currentTheme: state.currentTheme,
          sidebarOpen: state.sidebarOpen
        };
      },
      // On load
      (state) => state
    )
  ]
};

interface ContentPersistState {
  calendar?: {
    items: Record<string, any>;
    itemsByDate: Record<string, string[]>;
    insights: Array<any>;
    bestTimeRecommendations: Array<any>;
    lastFetched: Record<string, number>;
  };
}

const contentPersistConfig = {
  key: 'content',
  storage,
  whitelist: ['calendar'], // Only persist calendar data
  blacklist: [],
  // Nested persist config for calendar
  transforms: [
    createTransform<ContentPersistState, ContentPersistState>(
      // On save
      (state) => {
        // Keep only what we need for caching
        if (state?.calendar) {
          return {
            calendar: {
              items: state.calendar.items,
              itemsByDate: state.calendar.itemsByDate,
              insights: state.calendar.insights,
              bestTimeRecommendations: state.calendar.bestTimeRecommendations,
              lastFetched: state.calendar.lastFetched,
            }
          };
        }
        return state;
      },
      // On load
      (state) => state,
      {
        whitelist: ['calendar'],
      }
    ),
  ],
};

// Main persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: [], // Root level persistence
  blacklist: ['auth', 'ui', 'content'], // These are handled by their own persistReducers
};

// Create persistReducers for specific slices
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedUiReducer = persistReducer(uiPersistConfig, uiReducer);
const persistedContentReducer = persistReducer(contentPersistConfig, contentReducer);

// Create the main persistedReducer
const persistedReducer = persistReducer(persistConfig, combineReducers({
  auth: persistedAuthReducer,
  brands: brandsReducer,
  content: persistedContentReducer,
  campaigns: campaignsReducer,
  analytics: analyticsReducer,
  ui: persistedUiReducer,
  ads: adsReducer,
  projects: projectsReducer,
  predictiveAnalytics: predictiveAnalyticsReducer,
  campaignRules: campaignRulesReducer,
}));

// Configure the store with the persisted reducer
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore promises and non-serializable values in specific paths
        ignoredPaths: ['ui.confirmDialog.confirmAction', 'ui.confirmDialog.onCancel', 'ui.pendingSyncActions'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create the persistor
export const persistor = persistStore(store);

// Enable listener behavior for RTK Query
setupListeners(store.dispatch);

// Export types for use throughout the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain useDispatch and useSelector
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;