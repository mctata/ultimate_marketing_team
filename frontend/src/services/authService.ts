import api from './api';

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
const TOKEN_KEY = 'auth_token';

// Service methods
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    // Store token in localStorage
    localStorage.setItem(TOKEN_KEY, response.data.access_token);
    
    // Set the token in the API client for future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (userData: RegisterData): Promise<UserProfile> => {
  try {
    const response = await api.post<UserProfile>('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const response = await api.get<UserProfile>('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const logout = (): void => {
  // Clear token from localStorage
  localStorage.removeItem(TOKEN_KEY);
  
  // Remove Authorization header
  delete api.defaults.headers.common['Authorization'];
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
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
    localStorage.setItem(TOKEN_KEY, response.data.access_token);
    
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