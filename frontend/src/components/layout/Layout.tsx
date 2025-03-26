// frontend/src/components/layout/Layout.tsx
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme, useMediaQuery, Toolbar, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import theme, { darkTheme } from '../../theme';
import { BrandProvider } from '../../context/BrandContext';

const drawerWidth = 280;

const Layout = (): JSX.Element => {
  const [open, setOpen] = useState<boolean>(true);
  const { darkMode } = useSelector((state: RootState) => state.ui);
  const muiTheme = useTheme();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
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
              p: 0,
              width: '100%',
              overflow: 'hidden', // Contain overflow at the main level
              display: 'flex',
              flexDirection: 'column',
              transition: (theme) =>
                theme.transitions.create(['margin'], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.leavingScreen,
                }),
            }}
          >
            <Toolbar /> {/* This creates space for the fixed AppBar */}
            <Box sx={{ 
              minHeight: 'calc(100vh - 200px)',
              p: { xs: 2, sm: 3 },
              ml: { md: open ? 0 : 0 }, // No left margin
              width: '100%', // Full width
              overflow: 'auto', // Add overflow auto to enable scrolling
              height: 'calc(100vh - 64px - 56px)' // Subtract AppBar and Footer heights
            }}> 
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