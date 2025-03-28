import { createContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess, logout } from '../store/slices/authSlice';
import authService, { UserProfile } from '../services/authService';
import jwt_decode from 'jwt-decode';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  googleLogin: () => Promise<void>;
  facebookLogin: () => Promise<void>;
  linkedinLogin: () => Promise<void>;
  logout: () => void;
  error: string | null;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// This is the User type expected by the authSlice
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface JwtPayload {
  exp: number;
  user_id: string;
  email: string;
}

// Convert UserProfile from API to User for Redux store
const mapUserProfileToUser = (profile: UserProfile): User => {
  return {
    id: profile.id,
    email: profile.email,
    firstName: profile.full_name?.split(' ')[0] || '',
    lastName: profile.full_name?.split(' ').slice(1).join(' ') || '',
    role: profile.is_superuser ? 'admin' : 'user'
  };
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  googleLogin: async () => {},
  facebookLogin: async () => {},
  linkedinLogin: async () => {},
  logout: () => {},
  error: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  // Check if token is valid and not expired
  const validateToken = useCallback((token: string | null) => {
    if (!token) return false;
    
    try {
      const decoded = jwt_decode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (validateToken(token)) {
        try {
          // Check if token needs refreshing
          if (authService.isTokenExpired() && refreshToken) {
            try {
              // Attempt to refresh the token
              await authService.refreshToken();
              // Get the new token
              const newToken = localStorage.getItem('auth_token');
              const userProfile = await authService.getUserProfile();
              const user = mapUserProfileToUser(userProfile);
              dispatch(loginSuccess({ user, token: newToken! }));
              setIsAuthenticated(true);
            } catch (refreshError) {
              console.error('Token refresh failed during initialization', refreshError);
              // Clear tokens on refresh error
              localStorage.removeItem('auth_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('token_expiry');
            }
          } else {
            // Token is valid and not expired, just use it
            const userProfile = await authService.getUserProfile();
            const user = mapUserProfileToUser(userProfile);
            dispatch(loginSuccess({ user, token: token! }));
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Error initializing auth state:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('token_expiry');
        }
      } else {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_expiry');
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, [dispatch, validateToken]);

  const loginHandler = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const auth = await authService.login({ email, password });
      const userProfile = await authService.getUserProfile();
      const user = mapUserProfileToUser(userProfile);
      dispatch(loginSuccess({ user, token: auth.access_token }));
      setIsAuthenticated(true);
    } catch (error: any) {
      setError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const registerHandler = async (userData: RegisterData) => {
    setError(null);
    setIsLoading(true);
    
    try {
      await authService.register({
        email: userData.email,
        password: userData.password,
        full_name: `${userData.firstName} ${userData.lastName}`
      });
      // After registration, login to get token
      const auth = await authService.login({ email: userData.email, password: userData.password });
      const userProfile = await authService.getUserProfile();
      const user = mapUserProfileToUser(userProfile);
      dispatch(loginSuccess({ user, token: auth.access_token }));
      setIsAuthenticated(true);
    } catch (error: any) {
      setError(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const googleLoginHandler = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Initiate OAuth flow
      const redirectUri = window.location.origin + '/auth/callback/google';
      const authUrl = await authService.getOAuthUrl('google', redirectUri);
      
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (error: any) {
      setError(error.message || 'Google login failed');
      setIsLoading(false);
    }
  };

  const facebookLoginHandler = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Initiate OAuth flow
      const redirectUri = window.location.origin + '/auth/callback/facebook';
      const authUrl = await authService.getOAuthUrl('facebook', redirectUri);
      
      // Redirect to Facebook OAuth
      window.location.href = authUrl;
    } catch (error: any) {
      setError(error.message || 'Facebook login failed');
      setIsLoading(false);
    }
  };

  const linkedinLoginHandler = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Initiate OAuth flow
      const redirectUri = window.location.origin + '/auth/callback/linkedin';
      const authUrl = await authService.getOAuthUrl('linkedin', redirectUri);
      
      // Redirect to LinkedIn OAuth
      window.location.href = authUrl;
    } catch (error: any) {
      setError(error.message || 'LinkedIn login failed');
      setIsLoading(false);
    }
  };

  const logoutHandler = () => {
    dispatch(logout());
    setIsAuthenticated(false);
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    login: loginHandler,
    register: registerHandler,
    googleLogin: googleLoginHandler,
    facebookLogin: facebookLoginHandler,
    linkedinLogin: linkedinLoginHandler,
    logout: logoutHandler,
    error,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};