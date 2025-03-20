import { createContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess, logout } from '../store/slices/authSlice';
import { authService } from '../services/authService';
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

interface JwtPayload {
  exp: number;
  user_id: string;
  email: string;
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
      const token = localStorage.getItem('token');
      
      if (validateToken(token)) {
        try {
          const user = await authService.getCurrentUser();
          dispatch(loginSuccess({ user, token: token! }));
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('token');
        }
      } else {
        localStorage.removeItem('token');
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, [dispatch, validateToken]);

  const loginHandler = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const { user, token } = await authService.login(email, password);
      dispatch(loginSuccess({ user, token }));
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
      const { user, token } = await authService.register(userData);
      dispatch(loginSuccess({ user, token }));
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
      const { user, token } = await authService.googleLogin();
      dispatch(loginSuccess({ user, token }));
      setIsAuthenticated(true);
    } catch (error: any) {
      setError(error.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const facebookLoginHandler = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const { user, token } = await authService.facebookLogin();
      dispatch(loginSuccess({ user, token }));
      setIsAuthenticated(true);
    } catch (error: any) {
      setError(error.message || 'Facebook login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const linkedinLoginHandler = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const { user, token } = await authService.linkedinLogin();
      dispatch(loginSuccess({ user, token }));
      setIsAuthenticated(true);
    } catch (error: any) {
      setError(error.message || 'LinkedIn login failed');
    } finally {
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