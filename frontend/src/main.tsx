import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistGate } from 'redux-persist/integration/react'
import { ErrorBoundary } from 'react-error-boundary'
import { store, persistor } from './store'
import App from './App'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme'
import GlobalErrorFallback from './components/common/GlobalErrorFallback'
import ToastContainer from './components/common/ToastContainer'

// Web vitals reporting for performance monitoring
const reportWebVitals = (onPerfEntry?: any) => {
  if (onPerfEntry && import.meta.env.PROD) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry); // Cumulative Layout Shift
      getFID(onPerfEntry); // First Input Delay
      getFCP(onPerfEntry); // First Contentful Paint
      getLCP(onPerfEntry); // Largest Contentful Paint
      getTTFB(onPerfEntry); // Time to First Byte
    });
  }
};

// Configure React Query with improved defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: import.meta.env.PROD, // Only in production
      retry: 1,
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: true,
      refetchOnReconnect: true,
      suspense: false, // Enable when moving to React 18 Suspense for data fetching
    },
    mutations: {
      retry: 1,
    },
  },
});

// Prefetch critical data for better user experience
const prefetchCriticalData = () => {
  // Only prefetch in production for optimal performance
  if (import.meta.env.PROD) {
    queryClient.prefetchQuery(['systemSettings'], async () => {
      try {
        const response = await fetch('/api/v1/system/settings');
        if (!response.ok) throw new Error('Failed to fetch system settings');
        return response.json();
      } catch (error) {
        console.error('Error prefetching system settings:', error);
        return null;
      }
    });
  }
};

// Initialize application with performance monitoring
const initApp = () => {
  // Render the application
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <BrowserRouter>
              <QueryClientProvider client={queryClient}>
                <AuthProvider>
                  <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <ToastContainer />
                    <App />
                  </ThemeProvider>
                </AuthProvider>
              </QueryClientProvider>
            </BrowserRouter>
          </PersistGate>
        </Provider>
      </ErrorBoundary>
    </React.StrictMode>,
  );

  // Report web vitals
  reportWebVitals(console.log);
  
  // Prefetch critical data after render
  prefetchCriticalData();
};

// Start the application
initApp();