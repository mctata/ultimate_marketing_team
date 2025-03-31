import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, AppBar, Toolbar, IconButton, Typography, Avatar, Menu, MenuItem, Badge, Tooltip } from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import Sidebar from './Sidebar';

const drawerWidth = 240;

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);

  const handleAccountMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenuClose = () => {
    setNotificationsAnchorEl(null);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Top Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={toggleSidebar}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Ultimate Marketing Team
          </Typography>
          
          {/* Notifications */}
          <Box sx={{ display: 'flex' }}>
            <Tooltip title="Notifications">
              <IconButton
                size="large"
                color="inherit"
                onClick={handleNotificationsMenuOpen}
              >
                <Badge badgeContent={4} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={notificationsAnchorEl}
              open={Boolean(notificationsAnchorEl)}
              onClose={handleNotificationsMenuClose}
              PaperProps={{
                sx: { width: 300, maxHeight: 400 },
              }}
            >
              <MenuItem onClick={handleNotificationsMenuClose}>
                <Typography variant="body2">
                  Your campaign "Summer Product Launch" is performing above expectations.
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleNotificationsMenuClose}>
                <Typography variant="body2">
                  Budget alert: "Holiday Season Sale" campaign budget is 90% spent.
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleNotificationsMenuClose}>
                <Typography variant="body2">
                  New AI-generated content recommendations are available.
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleNotificationsMenuClose}>
                <Typography variant="body2">
                  System update: New predictive analytics features are now available.
                </Typography>
              </MenuItem>
            </Menu>
            
            {/* User Account */}
            <Tooltip title="Account">
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                onClick={handleAccountMenuOpen}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>JD</Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleAccountMenuClose}
            >
              <MenuItem onClick={handleAccountMenuClose}>Profile</MenuItem>
              <MenuItem onClick={handleAccountMenuClose}>Account Settings</MenuItem>
              <MenuItem onClick={handleAccountMenuClose}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={toggleSidebar} 
        drawerWidth={drawerWidth} 
      />
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          mt: '64px', // AppBar height
          overflow: 'auto',
          height: 'calc(100vh - 64px)', // 100vh - AppBar height
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
