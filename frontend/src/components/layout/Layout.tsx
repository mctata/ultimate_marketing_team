import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setSidebarOpen } from '../../store/slices/uiSlice';

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const dispatch = useDispatch();
  
  const handleDrawerToggle = () => {
    dispatch(setSidebarOpen(!sidebarOpen));
  };

  // Automatically close sidebar on mobile
  if (isMobile && sidebarOpen) {
    dispatch(setSidebarOpen(false));
  }

  const drawerWidth = 280;

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Sidebar 
        open={sidebarOpen} 
        onClose={handleDrawerToggle}
        width={drawerWidth}
      />
      
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
        <Header 
          onDrawerToggle={handleDrawerToggle}
        />
        
        <Box
          sx={{
            p: 3,
            overflow: 'auto',
            flexGrow: 1,
            bgcolor: 'background.default',
          }}
        >
          <Outlet />
        </Box>
        
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;