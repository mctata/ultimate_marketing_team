import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useDispatch } from 'react-redux';
import { ErrorBoundary } from 'react-error-boundary';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/common/LoadingScreen';
import websocketService from './services/websocket';
import { setupNetworkMonitoring } from './services/api';
import { lazyPage } from './utils/lazyImport';
import GlobalErrorFallback from './components/common/GlobalErrorFallback';

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
        <Route path="/auth/callback/google" element={<div>Processing Google Login...</div>} />
        <Route path="/auth/callback/facebook" element={<div>Processing Facebook Login...</div>} />
        <Route path="/auth/callback/linkedin" element={<div>Processing LinkedIn Login...</div>} />
        
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