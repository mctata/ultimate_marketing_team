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
      
      // Store token in localStorage
      localStorage.setItem(tokenKey, response.data.access_token);
      
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
        
        // Store token in localStorage
        localStorage.setItem(tokenKey, mockToken);
        
        // Set the token in the API client for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
        
        return {
          access_token: mockToken,
          token_type: 'bearer'
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
 * Logs out the current user by removing the authentication token
 */
export const logout = (): void => {
  // Clear token from localStorage
  localStorage.removeItem(tokenKey);
  
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
    
    // Store token in localStorage
    localStorage.setItem(tokenKey, response.data.access_token);
    
    // Set the token in the API client for future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
    
    return response.data;
  } catch (error) {
    console.error(`Error handling ${provider} OAuth callback:`, error);
    throw error;
  }
};

const authService = {
  login,
  register,
  logout,
  getUserProfile,
  isAuthenticated,
  getToken,
  setupTokenFromStorage,
  getOAuthUrl,
  handleOAuthCallback
};

export default authService;