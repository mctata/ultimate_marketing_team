import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryClient, QueryClientProvider } from 'react-query';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/common/LoadingScreen';
import BrandRedirector from './components/common/BrandRedirector';
import websocketService from './services/websocket';
import { setupNetworkMonitoring } from './services/api';
import { lazyPage } from './utils/lazyImport';
import GlobalErrorFallback from './components/common/GlobalErrorFallback';
import authService from './services/authService';
import { loginSuccess } from './store/slices/authSlice';
import { RootState } from './store';
import { selectBrand } from './store/slices/brandsSlice';

// Lazy-loaded route-based code splitting for better performance
const Dashboard = lazyPage(() => import('./pages/Dashboard'));
const Login = lazyPage(() => import('./pages/auth/Login'));
const Register = lazyPage(() => import('./pages/auth/Register'));
const Brands = lazyPage(() => import('./pages/brands/Brands'));
const BrandDetail = lazyPage(() => import('./pages/brands/BrandDetail'));
const BrandNew = lazyPage(() => import('./pages/brands/BrandNew'));
const Content = lazyPage(() => import('./pages/content/Content'));
const ContentLibrary = lazyPage(() => import('./pages/content/ContentLibrary'));
const ContentCalendar = lazyPage(() => import('./pages/content/ContentCalendar'));
const ContentDetail = lazyPage(() => import('./pages/content/ContentDetail'));
const Campaigns = lazyPage(() => import('./pages/campaigns/Campaigns'));
const CampaignDetail = lazyPage(() => import('./pages/campaigns/CampaignDetail'));
const ABTestingDashboard = lazyPage(() => import('./pages/campaigns/ABTestingDashboard'));
const CampaignABTestList = lazyPage(() => import('./pages/campaigns/CampaignABTestList'));
const CampaignROIAnalytics = lazyPage(() => import('./pages/campaigns/CampaignROIAnalytics'));
// New campaign feature components
const CompetitorBenchmark = lazyPage(() => import('./pages/campaigns/CompetitorBenchmark'));
const CustomReportsDashboard = lazyPage(() => import('./pages/campaigns/CustomReportsDashboard'));
const CampaignPerformanceAlerts = lazyPage(() => import('./pages/campaigns/CampaignPerformanceAlerts'));
// Import Analytics component directly to avoid "default cannot be resolved by star export" error
import Analytics from './pages/analytics/Analytics';
const AnalyticsPage = () => <Analytics />;
const Settings = lazyPage(() => import('./pages/settings/Settings'));
// Use the template components from the src directory - these should be moved to frontend later
const Templates = lazyPage(() => import('./pages/templates/Templates'));
const TemplateDetail = lazyPage(() => import('./pages/templates/TemplateDetail'));
const AdminTemplatesUtility = lazyPage(() => import('./pages/templates/AdminTemplatesUtility'));
const TemplateDiagnostics = lazyPage(() => import('./pages/templates/TemplateDiagnostics'));
const TemplateTestWorkspace = lazyPage(() => import('./pages/templates/TemplateTestWorkspace'));
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

// Brand context route component
const BrandContextRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { brands, selectedBrand } = useSelector((state: RootState) => state.brands);
  
  // Extract brandId from the URL
  const pathParts = location.pathname.split('/');
  const brandIdIndex = pathParts.indexOf('brand') + 1;
  const urlBrandId = brandIdIndex > 0 && pathParts.length > brandIdIndex ? pathParts[brandIdIndex] : null;
  
  useEffect(() => {
    // If URL contains a brand ID, select that brand
    if (urlBrandId && brands.some(brand => brand.id === urlBrandId)) {
      if (!selectedBrand || selectedBrand.id !== urlBrandId) {
        dispatch(selectBrand(urlBrandId));
      }
    } 
    // If no brand in URL but we have a selected brand, redirect to include it
    else if (selectedBrand && !urlBrandId) {
      // Construct the new URL with the selected brand
      let newPath = location.pathname;
      if (!newPath.includes('/brands')) {
        const basePath = pathParts.slice(0, 2).join('/');
        const restPath = pathParts.slice(2).join('/');
        newPath = `${basePath}/brand/${selectedBrand.id}${restPath ? '/' + restPath : ''}`;
        navigate(newPath, { replace: true });
      }
    }
    // If no brand selected and we have brands, select the first one
    else if (!selectedBrand && brands.length > 0) {
      dispatch(selectBrand(brands[0].id));
    }
  }, [urlBrandId, brands, selectedBrand, dispatch, location, navigate]);
  
  return <>{children}</>;
};

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const { brands } = useSelector((state: RootState) => state.brands);
  
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
      <QueryClientProvider client={queryClient}>
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
          <Route path="/auth/callback/google" element={<OAuthCallback provider="google" />} />
          <Route path="/auth/callback/facebook" element={<OAuthCallback provider="facebook" />} />
          <Route path="/auth/callback/linkedin" element={<OAuthCallback provider="linkedin" />} />
          
          {/* Brand management routes (not brand-specific) */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<BrandRedirector><Dashboard /></BrandRedirector>} />
            <Route path="brands" element={<Brands />} />
            <Route path="brands/new" element={<BrandNew />} />
            <Route path="brands/:id" element={<BrandDetail />} />
            <Route path="settings" element={<Settings />} />
            
            {/* Brand-specific routes */}
            <Route path="brand/:brandId/*" element={<BrandContextRoute><Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="content" element={<Content />} />
              <Route path="content/library" element={<ContentLibrary />} />
              <Route path="content/calendar" element={<ContentCalendar />} />
              <Route path="content/templates" element={<Templates />} />
              <Route path="content/templates/diagnostics" element={<TemplateDiagnostics />} />
              <Route path="content/templates/test-workspace" element={<TemplateTestWorkspace />} />
              <Route path="content/templates/admin" element={<AdminTemplatesUtility />} />
              <Route path="content/templates/:id" element={<TemplateDetail />} />
              <Route path="content/templates/:id/test" element={<TemplateDetail testMode={true} />} />
              <Route path="content/templates/:id/use" element={<TemplateDetail useMode={true} />} />
              <Route path="content/:id" element={<ContentDetail />} />
              
              {/* Campaign Routes */}
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="campaigns/:id" element={<CampaignDetail />} />
              <Route path="campaigns/:id/ab-testing" element={<ABTestingDashboard />} />
              <Route path="campaigns/:id/benchmark" element={<CompetitorBenchmark />} />
              <Route path="campaigns/:id/alerts" element={<CampaignPerformanceAlerts />} />
              <Route path="campaigns/ab-testing" element={<CampaignABTestList />} />
              <Route path="campaigns/roi-analytics" element={<CampaignROIAnalytics />} />
              <Route path="campaigns/reports" element={<CustomReportsDashboard />} />
              
              <Route path="analytics" element={<AnalyticsPage />} />
            </Routes></BrandContextRoute>} />
            
            {/* Legacy routes - redirect to new structure */}
            <Route path="content/*" element={<BrandRedirector />} />
            <Route path="campaigns/*" element={<BrandRedirector />} />
            <Route path="analytics" element={<BrandRedirector />} />
            <Route path="templates/*" element={<Navigate to="/content/templates" replace />} />
          </Route>
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;