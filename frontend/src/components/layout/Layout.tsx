// frontend/src/components/layout/Layout.tsx
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme, useMediaQuery, Toolbar } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import theme, { darkTheme } from '../../theme';
import { BrandProvider } from '../../context/BrandContext';

const drawerWidth = 280;

const Layout = () => {
  const [open, setOpen] = useState(true);
  const { darkMode } = useSelector((state: RootState) => state.ui);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const isMobile = useMediaQuery('(max-width:960px)');
  const location = useLocation();
  
  // Set the drawer to closed on mobile
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [isMobile]);
  
  // Close the drawer when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [location.pathname, isMobile]);
  
  const handleDrawerToggle = () => {
    setOpen(!open);
  };
  
  // Use the theme based on the user preference or system preference
  const currentTheme = darkMode ? darkTheme : theme;
  
  return (
    <ThemeProvider theme={currentTheme}>
      <BrandProvider>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <CssBaseline />
          
          {/* App Header */}
          <Header onDrawerToggle={handleDrawerToggle} />
          
          {/* Sidebar Navigation */}
          <Sidebar open={open} onClose={handleDrawerToggle} width={drawerWidth} />
          
          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              padding: (theme) => theme.spacing(3),
              width: { sm: `calc(100% - ${open ? drawerWidth : 0}px)` },
              marginLeft: { sm: open ? `${drawerWidth}px` : 0 },
              marginTop: '64px', // Header height
              transition: (theme) =>
                theme.transitions.create(['margin', 'width'], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.leavingScreen,
                }),
            }}
          >
            <Toolbar /> {/* This creates space for the fixed AppBar */}
            <Box sx={{ minHeight: 'calc(100vh - 212px)' }}> {/* 64px header + 64px toolbar spacer + 24px padding + 60px footer */}
              <Outlet />
            </Box>
            
            {/* App Footer */}
            <Footer />
          </Box>
        </Box>
      </BrandProvider>
    </ThemeProvider>
  );
};

export default Layout;