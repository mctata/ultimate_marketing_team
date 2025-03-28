import api from './api';
import jwt_decode from 'jwt-decode';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
}

// Constants
const tokenKey = 'auth_token';
const refreshTokenKey = 'refresh_token';
const tokenExpiryKey = 'token_expiry';

// Service methods
/**
 * Authenticates a user with email and password
 * @param credentials User login credentials
 * @returns Authentication response with access token
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    // First try the regular endpoint
    try {
      const response = await api.post<AuthResponse>('/auth/login', {
        email: credentials.email,
        password: credentials.password
      });
      
      // Store tokens in localStorage
      localStorage.setItem(tokenKey, response.data.access_token);
      
      if (response.data.refresh_token) {
        localStorage.setItem(refreshTokenKey, response.data.refresh_token);
      }
      
      if (response.data.expires_in) {
        const expiryTime = Date.now() + (response.data.expires_in * 1000);
        localStorage.setItem(tokenExpiryKey, expiryTime.toString());
      }
      
      // Set the token in the API client for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      
      return response.data;
    } catch (apiError) {
      console.warn('API login failed, using mock login for development:', apiError);
      
      // For development only: mock successful login with admin@example.com/password
      if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
        console.log('Using mock admin login');
        // Create a mock JWT token
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxOTE2MjM5MDIyfQ.L7CziLawtRYCPzUFNWRxvmACGYpYJwGcMbo6IS9bUQc';
        const mockRefreshToken = 'mock_refresh_token';
        
        // Store tokens in localStorage
        localStorage.setItem(tokenKey, mockToken);
        localStorage.setItem(refreshTokenKey, mockRefreshToken);
        
        // Set expiry time (24 hours from now)
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem(tokenExpiryKey, expiryTime.toString());
        
        // Set the token in the API client for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
        
        return {
          access_token: mockToken,
          token_type: 'bearer',
          refresh_token: mockRefreshToken,
          expires_in: 86400 // 24 hours
        };
      }
      
      // If credentials don't match the mock, rethrow the original error
      throw apiError;
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Registers a new user
 * @param userData User registration data
 * @returns Newly created user profile
 */
export const register = async (userData: RegisterData): Promise<UserProfile> => {
  try {
    const response = await api.post<UserProfile>('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Fetches the currently authenticated user's profile
 * @returns User profile information
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    try {
      const response = await api.get<UserProfile>('/auth/me');
      return response.data;
    } catch (apiError) {
      console.warn('API getUserProfile failed, using mock profile for development:', apiError);
      
      // Check if we have a token that was set by mock login
      const token = localStorage.getItem(tokenKey);
      if (token) {
        try {
          // Try to decode the token to see if it's our mock token
          const decoded = jwt_decode<any>(token);
          if (decoded.email === 'admin@example.com') {
            // Return mock admin profile
            return {
              id: '1',
              email: 'admin@example.com',
              full_name: 'Admin User',
              is_active: true,
              is_superuser: true
            };
          }
        } catch (decodeError) {
          console.error('Error decoding token:', decodeError);
        }
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Refreshes the access token using the refresh token
 * @returns New authentication response with updated tokens
 */
export const refreshToken = async (): Promise<AuthResponse> => {
  try {
    const currentRefreshToken = localStorage.getItem(refreshTokenKey);
    
    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await api.post<AuthResponse>('/auth/refresh', {
      refresh_token: currentRefreshToken
    });
    
    // Update tokens in localStorage
    localStorage.setItem(tokenKey, response.data.access_token);
    
    if (response.data.refresh_token) {
      localStorage.setItem(refreshTokenKey, response.data.refresh_token);
    }
    
    if (response.data.expires_in) {
      const expiryTime = Date.now() + (response.data.expires_in * 1000);
      localStorage.setItem(tokenExpiryKey, expiryTime.toString());
    }
    
    // Update the token in the API client
    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
    
    return response.data;
  } catch (error) {
    console.error('Token refresh error:', error);
    // Force logout on refresh error
    logout();
    throw error;
  }
};

/**
 * Logs out the current user by removing the authentication token
 */
export const logout = (): void => {
  // Clear tokens from localStorage
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(refreshTokenKey);
  localStorage.removeItem(tokenExpiryKey);
  
  // Remove Authorization header
  delete api.defaults.headers.common['Authorization'];
};

/**
 * Checks if a user is currently authenticated
 * @returns True if authenticated, false otherwise
 */
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const getToken = (): string | null => {
  return localStorage.getItem(tokenKey);
};

/**
 * Checks if the current token is expired and needs refreshing
 * @returns True if token needs refreshing, false otherwise
 */
export const isTokenExpired = (): boolean => {
  const expiryTimeStr = localStorage.getItem(tokenExpiryKey);
  
  if (!expiryTimeStr) {
    return false; // No expiry time stored, assume not expired
  }
  
  const expiryTime = parseInt(expiryTimeStr, 10);
  const currentTime = Date.now();
  
  // Consider the token expired if it's within 5 minutes of expiration
  const refreshThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
  return currentTime >= (expiryTime - refreshThreshold);
};

/**
 * Gets the authentication token for API requests
 * @returns The authentication token as a string, or null if not authenticated
 */
export const getAuthToken = (): string | null => {
  return getToken();
};

export const setupTokenFromStorage = (): void => {
  const token = getToken();
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Initialize auth state from localStorage
setupTokenFromStorage();

// OAuth methods
export const getOAuthUrl = async (provider: string, redirectUri: string): Promise<string> => {
  try {
    // Note: Since we're using the baseURL configuration in axios, we don't need the /api/v1 prefix here
    // The baseURL (API_BASE_URL) is already set to '/api/v1' in api.ts
    const response = await api.post<{ auth_url: string }>('/auth/oauth', {
      provider,
      redirect_uri: redirectUri
    });
    return response.data.auth_url;
  } catch (error) {
    console.error(`Error getting ${provider} OAuth URL:`, error);
    throw error;
  }
};

export const handleOAuthCallback = async (
  provider: string, 
  code: string, 
  state?: string
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/oauth/callback', {
      provider,
      code,
      state
    });
    
    // Store tokens in localStorage
    localStorage.setItem(tokenKey, response.data.access_token);
    
    if (response.data.refresh_token) {
      localStorage.setItem(refreshTokenKey, response.data.refresh_token);
    }
    
    if (response.data.expires_in) {
      const expiryTime = Date.now() + (response.data.expires_in * 1000);
      localStorage.setItem(tokenExpiryKey, expiryTime.toString());
    }
    
    // Set the token in the API client for future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
    
    return response.data;
  } catch (error: any) {
    console.error(`Error handling ${provider} OAuth callback:`, error);
    
    // Provide more detailed error information
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        throw new Error(`Authentication failed: ${data.detail || 'Invalid credentials'}`);
      } else if (status === 400) {
        throw new Error(`Invalid request: ${data.detail || 'Bad request'}`);
      } else {
        throw new Error(`Server error (${status}): ${data.detail || 'Unknown error'}`);
      }
    } else if (error.request) {
      throw new Error('No response received from server. Please check your connection.');
    } else {
      throw new Error(`Error: ${error.message || 'Unknown error'}`);
    }
  }
};

// Initialize the refresh token function in the API
import { setupRefreshToken } from './api';
setupRefreshToken(refreshToken);

const authService = {
  login,
  register,
  logout,
  getUserProfile,
  isAuthenticated,
  getToken,
  setupTokenFromStorage,
  getOAuthUrl,
  handleOAuthCallback,
  refreshToken,
  isTokenExpired
};

export default authService;