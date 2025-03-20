import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import Layout from './components/layout/Layout';
import RequireAuth from './components/auth/RequireAuth';

// Lazy loaded components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Content Management
const ContentList = lazy(() => import('./pages/content/ContentList'));
const ContentEditor = lazy(() => import('./pages/content/ContentEditor'));
const ContentCalendar = lazy(() => import('./pages/content/ContentCalendar'));
const ContentPerformance = lazy(() => import('./pages/content/ContentPerformance'));
const ContentABTest = lazy(() => import('./pages/content/ContentABTest'));

// Campaign Management
const CampaignList = lazy(() => import('./pages/campaigns/CampaignList'));
const CampaignEditor = lazy(() => import('./pages/campaigns/CampaignEditor'));
const CampaignMetrics = lazy(() => import('./pages/campaigns/CampaignMetrics'));
const AdSetDetail = lazy(() => import('./pages/campaigns/AdSetDetail'));

// Loading component
const LoadingScreen = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Content Management Routes */}
              <Route path="/content" element={<ContentList />} />
              <Route path="/content/new" element={<ContentEditor />} />
              <Route path="/content/:id" element={<ContentEditor />} />
              <Route path="/content/:id/performance" element={<ContentPerformance />} />
              <Route path="/content/:id/abtests" element={<ContentABTest />} />
              <Route path="/content/:id/abtests/:testId" element={<ContentABTest />} />
              <Route path="/content/calendar" element={<ContentCalendar />} />
              
              {/* Campaign Management Routes */}
              <Route path="/campaigns" element={<CampaignList />} />
              <Route path="/campaigns/new" element={<CampaignEditor />} />
              <Route path="/campaigns/:id" element={<CampaignEditor />} />
              <Route path="/campaigns/:id/metrics" element={<CampaignMetrics />} />
              <Route path="/campaigns/:campaignId/adsets/:adSetId" element={<AdSetDetail />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;