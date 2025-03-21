import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
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
})

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
                  {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
                </ThemeProvider>
              </AuthProvider>
            </QueryClientProvider>
          </BrowserRouter>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>,
)