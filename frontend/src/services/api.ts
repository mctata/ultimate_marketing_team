import axios from 'axios';

// To avoid circular dependencies, we'll set this later
let refreshTokenFn: () => Promise<any> = async () => { 
  return Promise.reject(new Error('refreshToken function not initialized')); 
};

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

// Create API instance with default config
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://staging-api.tangible-studios.com' 
    : 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set up the refresh token function
export const setupRefreshToken = (refreshFunction: () => Promise<any>) => {
  refreshTokenFn = refreshFunction;
};

// Process the queue of requests that were waiting for a token refresh
const processQueue = (error: any, token: string | null = null) => {
  refreshQueue.forEach(callback => {
    if (error) {
      callback(Promise.reject(error));
    } else if (token) {
      callback(token);
    }
  });
  
  refreshQueue = [];
};

// Request interceptor to handle token refresh
api.interceptors.request.use(async (config) => {
  // Check if we should attempt to refresh the token
  try {
    // This check should happen outside the interceptor in a real app
    // via a token monitoring service to avoid checking on every request
    const isTokenExpired = () => {
      const tokenExpiryStr = localStorage.getItem('token_expiry');
      if (!tokenExpiryStr) return false;
      
      const tokenExpiry = parseInt(tokenExpiryStr, 10);
      const currentTime = Date.now();
      const refreshThreshold = 5 * 60 * 1000; // 5 minutes
      
      return currentTime >= (tokenExpiry - refreshThreshold);
    };
    
    // If the token is expired and we're not already refreshing
    // and this is not a token refresh request itself
    const isRefreshRequest = config.url?.includes('/auth/refresh');
    
    if (isTokenExpired() && !isRefreshing && !isRefreshRequest) {
      isRefreshing = true;
      
      try {
        const response = await refreshTokenFn();
        const newToken = response.access_token;
        
        if (config.headers) {
          config.headers['Authorization'] = `Bearer ${newToken}`;
        }
        
        processQueue(null, newToken);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  } catch (err) {
    console.error('Token refresh check error:', err);
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for handling common error patterns
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is due to an unauthorized request (401)
    // and it's not already retried, attempt to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, add this request to the queue
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (typeof token === 'string') {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              reject(token);
            }
          });
        });
      } else {
        // Mark the request as retried
        originalRequest._retry = true;
        isRefreshing = true;
        
        try {
          // Attempt to refresh the token
          const response = await refreshTokenFn();
          const newToken = response.access_token;
          
          // Update the header on the failed request
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          
          // Process any queued requests
          processQueue(null, newToken);
          
          // Retry the original request
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh fails, process the queue with error
          processQueue(refreshError, null);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }
    
    // Handle other server errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API error response:', error.response.status, error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API no response:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Common API methods
export const apiMethods = {
  get: <T>(url: string, params = {}) => api.get<T>(url, { params }).then(response => response.data),
  post: <T>(url: string, data = {}, config = {}) => api.post<T>(url, data, config).then(response => response.data),
  put: <T>(url: string, data = {}, config = {}) => api.put<T>(url, data, config).then(response => response.data),
  patch: <T>(url: string, data = {}, config = {}) => api.patch<T>(url, data, config).then(response => response.data),
  delete: <T>(url: string, config = {}) => api.delete<T>(url, config).then(response => response.data)
};

// Function to handle global network monitoring
export const setupNetworkMonitoring = () => {
  const updateOnlineStatus = () => {
    if (navigator.onLine) {
      console.log('Application is online');
      // You could dispatch a Redux action here
    } else {
      console.log('Application is offline');
      // You could dispatch a Redux action here
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
  };
};

export default api;