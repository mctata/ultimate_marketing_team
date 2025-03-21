import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

// Components
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import ConfirmDialog from '../common/ConfirmDialog';
import ToastContainer from '../common/ToastContainer';
import GlobalErrorFallback from '../common/GlobalErrorFallback';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { RootState, useAppDispatch, useAppSelector } from '../../store';
import { setSidebarOpen, setOfflineMode } from '../../store/slices/uiSlice';

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { sidebarOpen, offlineMode } = useAppSelector((state: RootState) => state.ui);
  const dispatch = useAppDispatch();
  
  const handleDrawerToggle = () => {
    dispatch(setSidebarOpen(!sidebarOpen));
  };

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      dispatch(setOfflineMode(false));
    };
    
    const handleOffline = () => {
      dispatch(setOfflineMode(true));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial status
    if (navigator.onLine !== !offlineMode) {
      dispatch(setOfflineMode(!navigator.onLine));
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch, offlineMode]);

  // Automatically close sidebar on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      dispatch(setSidebarOpen(false));
    }
  }, [isMobile, sidebarOpen, dispatch]);

  const drawerWidth = 280;

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Global dialogs */}
      <ConfirmDialog />
      
      {/* Sidebar navigation */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={handleDrawerToggle}
        width={drawerWidth}
      />
      
      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Header with app bar */}
        <Header 
          onDrawerToggle={handleDrawerToggle}
        />
        
        {/* Main content with error boundary */}
        <Box
          sx={{
            p: 3,
            overflow: 'auto',
            flexGrow: 1,
            bgcolor: 'background.default',
          }}
        >
          <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
            <Outlet />
          </ErrorBoundary>
        </Box>
        
        {/* Footer */}
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;