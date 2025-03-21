import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

// Create axios instance
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Constants
const tokenKey = 'auth_token';

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized errors by logging the user out
    if (error.response?.status === 401) {
      // Dispatch logout action
      store.dispatch(logout());
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Generic API request function with typed response
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
      // Extract error message from API response
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }
    throw error;
  }
};

export default api;