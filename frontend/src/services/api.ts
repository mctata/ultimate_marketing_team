import axios from 'axios';

// Create API instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for handling common error patterns
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle server errors
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
  get: <T>(url: string, config = {}) => api.get<T>(url, config).then(response => response.data),
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