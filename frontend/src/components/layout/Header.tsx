// frontend/src/components/layout/Header.tsx
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
  Divider,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { toggleDarkMode } from '../../store/slices/uiSlice';
import NotificationsMenu from '../common/NotificationsMenu';
import BrandSelector from '../common/BrandSelector';

interface HeaderProps {
  onDrawerToggle: () => void;
}

const Header = ({ onDrawerToggle }: HeaderProps) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const user = useSelector((state: RootState) => state.auth.user);
  const { darkMode, notifications } = useSelector((state: RootState) => state.ui);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleMenuClose();
    logout();
  };
  
  const handleThemeToggle = () => {
    dispatch(toggleDarkMode());
  };
  
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  
  return (
    <>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ display: { xs: 'none', sm: 'block' }, mr: 4 }}
          >
            Ultimate Marketing Team
          </Typography>
          
          {/* Brand selector only appears as dropdown */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexGrow: 1 
          }}>
            {/* Empty flexbox to push other elements right */}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            {/* Brand selector dropdown near theme toggle */}
            <Box sx={{ mr: 1 }}>
              <BrandSelector variant="dropdown" />
            </Box>
            
            <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              <IconButton onClick={handleThemeToggle} color="inherit">
                {darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Notifications">
              <IconButton 
                onClick={handleNotificationsOpen}
                color="inherit"
              >
                <Badge badgeContent={unreadNotificationsCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Account settings">
              <IconButton
                onClick={handleProfileMenuOpen}
                color="inherit"
                size="small"
                sx={{ ml: 1 }}
              >
                <Avatar 
                  sx={{ width: 32, height: 32 }}
                  alt={user?.firstName || 'User'}
                  src="/assets/avatar.png"
                />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Profile menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || 'guest@example.com'}
          </Typography>
        </Box>
        <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
        <MenuItem onClick={handleMenuClose}>My account</MenuItem>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
      
      {/* Notifications menu */}
      <NotificationsMenu
        anchorEl={notificationsAnchorEl}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsClose}
      />
    </>
  );
};

export default Header;