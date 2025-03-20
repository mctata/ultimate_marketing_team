import { apiRequest } from './api';

interface LoginResponse {
  user: User;
  token: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>({
      method: 'POST',
      url: '/auth/login',
      data: { email, password },
    });
  },
  
  register: async (userData: RegisterData): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>({
      method: 'POST',
      url: '/auth/register',
      data: userData,
    });
  },
  
  googleLogin: async (): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>({
      method: 'POST',
      url: '/auth/google',
    });
  },
  
  facebookLogin: async (): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>({
      method: 'POST',
      url: '/auth/facebook',
    });
  },
  
  linkedinLogin: async (): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>({
      method: 'POST',
      url: '/auth/linkedin',
    });
  },
  
  getCurrentUser: async (): Promise<User> => {
    return apiRequest<User>({
      method: 'GET',
      url: '/auth/me',
    });
  },
  
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    return apiRequest<void>({
      method: 'POST',
      url: '/auth/change-password',
      data: { oldPassword, newPassword },
    });
  },
  
  requestPasswordReset: async (email: string): Promise<void> => {
    return apiRequest<void>({
      method: 'POST',
      url: '/auth/forgot-password',
      data: { email },
    });
  },
  
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    return apiRequest<void>({
      method: 'POST',
      url: '/auth/reset-password',
      data: { token, newPassword },
    });
  },
};