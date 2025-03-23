import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useDispatch } from 'react-redux';
import { ErrorBoundary } from 'react-error-boundary';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/common/LoadingScreen';
import websocketService from './services/websocket';
import { setupNetworkMonitoring } from './services/api';
import { lazyPage } from './utils/lazyImport';
import GlobalErrorFallback from './components/common/GlobalErrorFallback';
import authService from './services/authService';
import { loginSuccess } from './store/slices/authSlice';

// Lazy-loaded route-based code splitting for better performance
const Dashboard = lazyPage(() => import('./pages/Dashboard'));
const Login = lazyPage(() => import('./pages/auth/Login'));
const Register = lazyPage(() => import('./pages/auth/Register'));
const Brands = lazyPage(() => import('./pages/brands/Brands'));
const BrandDetail = lazyPage(() => import('./pages/brands/BrandDetail'));
const Content = lazyPage(() => import('./pages/content/Content'));
const ContentCalendar = lazyPage(() => import('./pages/content/ContentCalendar'));
const ContentDetail = lazyPage(() => import('./pages/content/ContentDetail'));
const Campaigns = lazyPage(() => import('./pages/campaigns/Campaigns'));
const CampaignDetail = lazyPage(() => import('./pages/campaigns/CampaignDetail'));
const Analytics = lazyPage(() => import('./pages/analytics/Analytics'));
const Settings = lazyPage(() => import('./pages/settings/Settings'));
const NotFound = lazyPage(() => import('./pages/NotFound'));

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public only route component (for login/register)
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  
  // Initialize WebSocket connection when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      websocketService.connect();
      
      // Cleanup on unmount
      return () => {
        websocketService.disconnect();
      };
    }
  }, [isAuthenticated]);
  
  // Setup network monitoring for offline support
  useEffect(() => {
    const cleanupNetworkMonitoring = setupNetworkMonitoring();
    return () => cleanupNetworkMonitoring();
  }, []);
  
  // Prefetch critical resources for faster interactions
  useEffect(() => {
    if (isAuthenticated) {
      // Prefetch important data using React Query prefetchQuery
      // This would typically be done in the QueryClient configuration
    }
  }, [isAuthenticated]);

  // OAuth callback handler component
  const OAuthCallback = ({ provider }: { provider: string }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
      const handleCallback = async () => {
        try {
          // Get code from URL query params
          const params = new URLSearchParams(location.search);
          const code = params.get('code');
          const state = params.get('state');
          
          if (!code) {
            throw new Error('Authentication code not found in the URL');
          }
          
          // Exchange code for token
          const authResponse = await authService.handleOAuthCallback(
            provider,
            code,
            state || undefined
          );
          
          // Get user profile
          const userProfile = await authService.getUserProfile();
          
          // Dispatch login success and redirect to dashboard
          dispatch(loginSuccess({
            user: {
              id: userProfile.id,
              email: userProfile.email,
              firstName: userProfile.full_name?.split(' ')[0] || '',
              lastName: userProfile.full_name?.split(' ').slice(1).join(' ') || '',
              role: userProfile.is_superuser ? 'admin' : 'user'
            },
            token: authResponse.access_token
          }));
          
          navigate('/dashboard');
        } catch (err: any) {
          console.error('OAuth callback error:', err);
          setError(err.message || 'Authentication failed');
          
          // Redirect to login after error
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      };
      
      handleCallback();
    }, [location, navigate, provider, dispatch]);
    
    if (error) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h3>Authentication Error</h3>
          <p>{error}</p>
          <p>Redirecting to login page...</p>
        </div>
      );
    }
    
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <h3>Processing {provider.charAt(0).toUpperCase() + provider.slice(1)} login...</h3>
        <p>Please wait while we complete your authentication</p>
      </div>
    );
  };
  
  return (
    <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        } />
        <Route path="/register" element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        } />
        
        {/* OAuth callback routes */}
        <Route path="/api/v1/auth/callback/google" element={<OAuthCallback provider="google" />} />
        <Route path="/api/v1/auth/callback/facebook" element={<OAuthCallback provider="facebook" />} />
        <Route path="/api/v1/auth/callback/linkedin" element={<OAuthCallback provider="linkedin" />} />
        
        {/* Protected routes with layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="brands" element={<Brands />} />
          <Route path="brands/:id" element={<BrandDetail />} />
          <Route path="content" element={<Content />} />
          <Route path="content/calendar" element={<ContentCalendar />} />
          <Route path="content/:id" element={<ContentDetail />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="campaigns/:id" element={<CampaignDetail />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;