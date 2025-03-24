import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  Avatar,
  styled,
  Theme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Article as ArticleIcon,
  Campaign as CampaignIcon,
  BarChart as AnalyticsIcon,
  Settings as SettingsIcon,
  Event as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Description as TemplateIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Science as ScienceIcon,
  MonetizationOn as MonetizationOnIcon,
  FormatListBulleted as ListIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  width: number;
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Brands', icon: <BusinessIcon />, path: '/brands' },
  { 
    text: 'Content', 
    icon: <ArticleIcon />, 
    path: '/content',
    subItems: [
      { text: 'Content Library', path: '/content/library' },
      { text: 'Content Calendar', path: '/content/calendar' },
      { text: 'Templates Library', path: '/content/templates' },
      { text: 'Template Diagnostics', path: '/content/templates/diagnostics' },
      { text: 'Template Test Workspace', path: '/content/templates/test-workspace' },
      { text: 'Template Admin (Admin Only)', path: '/content/templates/admin' }
    ]
  },
  { 
    text: 'Campaigns', 
    icon: <CampaignIcon />, 
    path: '/campaigns',
    subItems: [
      { text: 'Campaign List', icon: <ListIcon />, path: '/campaigns' },
      { text: 'A/B Testing', icon: <ScienceIcon />, path: '/campaigns/:id/ab-testing' },
      { text: 'ROI Analytics', icon: <MonetizationOnIcon />, path: '/campaigns/roi-analytics' }
    ]
  },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const Sidebar = ({ open, onClose, width }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const theme = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const user = useSelector((state: RootState) => state.auth.user);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  
  // Check if current location is under a parent path
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.subItems && item.subItems.some(sub => {
        const path = sub.path.replace(':id', ''); // Handle dynamic routes like :id
        return location.pathname.startsWith(path);
      })) {
        setExpandedItem(item.text);
      }
    });
  }, [location.pathname]);
  
  const handleNavigation = (path: string) => {
    // Only navigate if the path doesn't contain a :id parameter
    if (!path.includes(':id')) {
      navigate(path);
      if (theme) {
        onClose();
      }
    }
  };
  
  const toggleExpand = (itemText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedItem(expandedItem === itemText ? null : itemText);
  };
  
  const drawerContent = (
    <>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: [1],
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #0066cc 30%, #ff7961 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Ultimate Marketing
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          {theme ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Toolbar>
      
      <Divider />
      
      <Box sx={{ mt: 2, px: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{ width: 40, height: 40, mr: 2 }}
            alt={user?.firstName || 'User'}
            src="/assets/avatar.png"
          />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.role || 'User'}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Divider />
      
      <List component="nav" sx={{ px: 2 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
              <ListItemButton
                onClick={item.subItems ? (e) => toggleExpand(item.text, e) : () => handleNavigation(item.path)}
                selected={location.pathname === item.path || (item.subItems && item.subItems.some(sub => location.pathname === sub.path))}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  borderRadius: 1,
                  px: 2.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 102, 204, 0.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : 'auto',
                    justifyContent: 'center',
                    color: location.pathname === item.path ? 'primary.contrastText' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{ opacity: open ? 1 : 0 }}
                />
                {open && item.subItems && (
                  expandedItem === item.text ? 
                  <ExpandLessIcon fontSize="small" /> : 
                  <ExpandMoreIcon fontSize="small" />
                )}
              </ListItemButton>
            </ListItem>
            
            {/* Sub-items */}
            {item.subItems && open && expandedItem === item.text && (
              <Box sx={{ pl: 4 }}>
                {item.subItems.map((subItem) => {
                  // Only show admin items to users with admin role
                  if (subItem.text.includes('Admin') && user?.role !== 'admin') {
                    return null;
                  }
                  
                  return (
                    <ListItem key={subItem.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => handleNavigation(subItem.path)}
                        selected={location.pathname.includes(subItem.path.replace(':id', ''))}
                        sx={{
                          minHeight: 36,
                          justifyContent: 'initial',
                          borderRadius: 1,
                          px: 2,
                          '&.Mui-selected': {
                            backgroundColor: 'primary.light',
                            color: 'primary.contrastText',
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(0, 102, 204, 0.08)',
                          },
                        }}
                      >
                        {subItem.icon && (
                          <ListItemIcon 
                            sx={{
                              minWidth: 0,
                              mr: 1.5,
                              fontSize: '1.25rem'
                            }}
                          >
                            {subItem.icon}
                          </ListItemIcon>
                        )}
                        <ListItemText
                          primary={subItem.text}
                          primaryTypographyProps={{ fontSize: '0.875rem' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </Box>
            )}
          </React.Fragment>
        ))}
      </List>
      
      <Divider sx={{ mt: 2 }} />
      
      <Box sx={{ p: 2, mt: 'auto' }}>
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: 1,
            '&:hover': {
              backgroundColor: 'rgba(244, 67, 54, 0.08)',
            },
          }}
        >
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: open ? width : 0 }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: width,
            boxShadow: 3,
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="persistent"
        open={open}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: width,
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            boxShadow: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;