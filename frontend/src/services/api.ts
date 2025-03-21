import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';
import { addToast, setOfflineMode } from '../store/slices/uiSlice';
import { QueryClient } from '@tanstack/react-query';

// Constants
const tokenKey = 'auth_token';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Create axios instance with improved defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
  timeoutErrorMessage: 'Request timeout - please try again later',
  withCredentials: true, // Include cookies for CSRF protection
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Track when request was started for performance monitoring
    config.meta = { ...config.meta, requestStartedAt: Date.now() };
    
    // Add auth token to headers if available
    const token = localStorage.getItem(tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracing
    config.headers['X-Request-ID'] = crypto.randomUUID();
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and performance tracking
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calculate request duration for performance tracking
    if (response.config.meta?.requestStartedAt) {
      const duration = Date.now() - response.config.meta.requestStartedAt;
      // We could log this, send to analytics, etc.
      if (import.meta.env.DEV && duration > 1000) {
        console.warn(`Slow request (${duration}ms):`, response.config.url);
      }
    }
    
    return response;
  },
  (error: AxiosError) => {
    // Check for network errors indicating offline state
    if (error.code === 'ERR_NETWORK' || !navigator.onLine) {
      store.dispatch(setOfflineMode(true));
      
      // Store failed requests for later retry
      if (error.config) {
        store.dispatch({
          type: 'ui/addPendingSyncAction',
          payload: {
            id: crypto.randomUUID(),
            config: error.config,
            timestamp: Date.now(),
          },
        });
      }
    }
    
    // Handle specific HTTP error codes
    if (error.response) {
      const { status } = error.response;
      
      switch (status) {
        case 401: // Unauthorized
          // Dispatch logout action
          store.dispatch(logout());
          break;
          
        case 403: // Forbidden
          store.dispatch(addToast({
            type: 'error',
            title: 'Permission Denied',
            message: 'You do not have permission to perform this action',
          }));
          break;
          
        case 429: // Too Many Requests
          store.dispatch(addToast({
            type: 'warning',
            title: 'Rate Limit Exceeded',
            message: 'Please slow down and try again in a moment',
          }));
          break;
          
        case 500: // Server Error
        case 502: // Bad Gateway
        case 503: // Service Unavailable
        case 504: // Gateway Timeout
          store.dispatch(addToast({
            type: 'error',
            title: 'Server Error',
            message: 'The server encountered an error, please try again later',
          }));
          break;
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Enhanced API request function with typed response and error handling
 * @template T The expected response data type
 * @param config Axios request configuration
 * @returns Promise resolving to the response data
 * @throws Error with API error message
 */
export const apiRequest = async <T>(
  config: AxiosRequestConfig
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await api(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Extract error message from API response with fallback support
      const errorResponse = error.response?.data;
      let errorMessage = error.message;
      
      if (errorResponse) {
        if (typeof errorResponse === 'string') {
          errorMessage = errorResponse;
        } else if (errorResponse.message) {
          errorMessage = errorResponse.message;
        } else if (errorResponse.error) {
          errorMessage = errorResponse.error;
        } else if (Array.isArray(errorResponse.errors)) {
          errorMessage = errorResponse.errors.join(', ');
        }
      }
      
      throw new Error(errorMessage);
    }
    throw error;
  }
};

// Network status monitoring
export const setupNetworkMonitoring = () => {
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;
    store.dispatch(setOfflineMode(!isOnline));
    
    // If coming back online, process any pending requests
    if (isOnline) {
      processPendingRequests();
    }
  };
  
  // Listen for online/offline events
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial check
  updateOnlineStatus();
  
  return () => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
  };
};

// Process pending requests when coming back online
const processPendingRequests = async () => {
  const pendingActions = store.getState().ui.pendingSyncActions;
  
  if (pendingActions.length > 0) {
    // Show a toast notification that we're syncing
    store.dispatch(addToast({
      type: 'info',
      title: 'Syncing',
      message: `Syncing ${pendingActions.length} pending request(s)...`,
    }));
    
    // Process each pending request
    for (const action of pendingActions) {
      try {
        await api(action.config);
        store.dispatch({ type: 'ui/removePendingSyncAction', payload: action.id });
      } catch (error) {
        console.error('Failed to process pending request', error);
      }
    }
    
    // Show completion toast
    store.dispatch(addToast({
      type: 'success',
      title: 'Sync Complete',
      message: 'All pending changes have been synchronized',
    }));
  }
};

// Configure the query client for React Query
export const configureQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: (failureCount, error) => {
          // Don't retry on specific HTTP status codes
          if (axios.isAxiosError(error) && error.response) {
            const status = error.response.status;
            if (status === 404 || status === 401 || status === 403) {
              return false;
            }
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  });
};

// API methods for common operations
export const apiMethods = {
  get: <T>(url: string, params?: any, config?: AxiosRequestConfig) => 
    apiRequest<T>({ ...config, method: 'GET', url, params }),
    
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiRequest<T>({ ...config, method: 'POST', url, data }),
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiRequest<T>({ ...config, method: 'PUT', url, data }),
    
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiRequest<T>({ ...config, method: 'PATCH', url, data }),
    
  delete: <T>(url: string, config?: AxiosRequestConfig) => 
    apiRequest<T>({ ...config, method: 'DELETE', url }),
};

export default api;