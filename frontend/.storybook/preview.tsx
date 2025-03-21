import React from "react";
import type { Preview } from "@storybook/react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { withThemeFromJSXProvider } from "@storybook/addon-themes";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

// Import theme and reducers
import theme from "../src/theme";
import uiReducer from '../src/store/slices/uiSlice';
import authReducer from '../src/store/slices/authSlice';

// Create a mock store for Redux
const mockStore = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    // Add other reducers as needed
  },
  preloadedState: {
    ui: {
      darkMode: false,
      sidebarOpen: true,
      notifications: [],
      toasts: [],
      currentTheme: 'default',
      loading: {},
      confirmDialog: {
        open: false,
        title: '',
        message: '',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        confirmAction: null,
      },
      offlineMode: false,
      pendingSyncActions: [],
    },
    auth: {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    },
  },
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
  },
});

// Configure viewports for responsive testing
const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '360px',
            height: '640px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1366px',
            height: '768px',
          },
        },
        widescreen: {
          name: 'Widescreen',
          styles: {
            width: '1920px',
            height: '1080px',
          },
        },
      },
      defaultViewport: 'desktop',
    },
  },
  decorators: [
    // Add React Router for navigation in stories
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
    // Add React Query for data fetching
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
    // Add Redux Provider
    (Story) => (
      <Provider store={mockStore}>
        <Story />
      </Provider>
    ),
    // Add Material UI Theme
    withThemeFromJSXProvider({
      themes: {
        light: theme,
      },
      defaultTheme: 'light',
      Provider: ThemeProvider,
      GlobalStyles: CssBaseline,
    }),
  ],
};

export default preview;