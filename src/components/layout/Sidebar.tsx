import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  Typography,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Article as ContentIcon,
  Campaign as CampaignIcon,
  InsertChart as AnalyticsIcon,
  DesignServices as TemplateIcon,
  BarChart as PerformanceIcon,
  ExpandLess,
  ExpandMore,
  Settings as SettingsIcon,
  Launch as LaunchIcon,
  Edit as EditIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  drawerWidth: number;
}

const Sidebar = ({ open, onClose, drawerWidth }: SidebarProps) => {
  const location = useLocation();
  const [campaignsOpen, setCampaignsOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const handleCampaignsClick = () => {
    setCampaignsOpen(!campaignsOpen);
  };

  const handleContentClick = () => {
    setContentOpen(!contentOpen);
  };

  const handleTemplatesClick = () => {
    setTemplatesOpen(!templatesOpen);
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <Drawer
      variant="permanent"
      open={true}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          Ultimate Marketing
        </Typography>
      </Box>
      <Divider />
      <List component="nav">
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/dashboard" selected={isActive('/dashboard')}>
            <ListItemIcon>
              <DashboardIcon color={isActive('/dashboard') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        
        {/* Campaigns Section */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleCampaignsClick}>
            <ListItemIcon>
              <CampaignIcon color={isActive('/campaigns') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Campaigns" />
            {campaignsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={campaignsOpen || isActive('/campaigns')} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton 
              component={Link} 
              to="/campaigns" 
              sx={{ pl: 4 }}
              selected={location.pathname === '/campaigns'}
            >
              <ListItemIcon>
                <LaunchIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="All Campaigns" />
            </ListItemButton>
            <ListItemButton 
              component={Link} 
              to="/campaigns/new" 
              sx={{ pl: 4 }}
              selected={location.pathname === '/campaigns/new'}
            >
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Create Campaign" />
            </ListItemButton>
            <ListItemButton 
              component={Link} 
              to="/campaigns/performance" 
              sx={{ pl: 4 }}
              selected={location.pathname === '/campaigns/performance'}
            >
              <ListItemIcon>
                <PerformanceIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Performance" />
            </ListItemButton>
          </List>
        </Collapse>
        
        {/* Content Section */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleContentClick}>
            <ListItemIcon>
              <ContentIcon color={isActive('/content') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Content" />
            {contentOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={contentOpen || isActive('/content')} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton 
              component={Link} 
              to="/content" 
              sx={{ pl: 4 }}
              selected={location.pathname === '/content'}
            >
              <ListItemIcon>
                <LaunchIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="All Content" />
            </ListItemButton>
            <ListItemButton 
              component={Link} 
              to="/content/new" 
              sx={{ pl: 4 }}
              selected={location.pathname === '/content/new'}
            >
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Create Content" />
            </ListItemButton>
            <ListItemButton 
              component={Link} 
              to="/content/calendar" 
              sx={{ pl: 4 }}
              selected={location.pathname === '/content/calendar'}
            >
              <ListItemIcon>
                <TimelineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Content Calendar" />
            </ListItemButton>
          </List>
        </Collapse>
        
        {/* Templates Section */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleTemplatesClick}>
            <ListItemIcon>
              <TemplateIcon color={isActive('/templates') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Templates" />
            {templatesOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={templatesOpen || isActive('/templates')} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton 
              component={Link} 
              to="/templates" 
              sx={{ pl: 4 }}
              selected={location.pathname === '/templates'}
            >
              <ListItemIcon>
                <LaunchIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="All Templates" />
            </ListItemButton>
          </List>
        </Collapse>
        
        {/* Analytics */}
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/analytics" selected={isActive('/analytics')}>
            <ListItemIcon>
              <AnalyticsIcon color={isActive('/analytics') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Analytics" />
          </ListItemButton>
        </ListItem>
        
        <Divider sx={{ my: 1 }} />
        
        {/* Settings */}
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/settings" selected={isActive('/settings')}>
            <ListItemIcon>
              <SettingsIcon color={isActive('/settings') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
