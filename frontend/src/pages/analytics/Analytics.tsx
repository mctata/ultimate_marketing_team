import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Tabs, 
  Tab, 
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import ApiMetrics from './ApiMetrics';
import UXAnalyticsDashboard from './UXAnalyticsDashboard';
import AccessibilityIcon from '@mui/icons-material/Accessibility';
import { ChartAccessibilityProvider } from '../../context/ChartAccessibilityContext';
import ChartAccessibilitySettings from '../../components/analytics/ChartAccessibilitySettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Analytics = () => {
  const [tabValue, setTabValue] = useState(0);
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const toggleAccessibilitySettings = () => {
    setShowAccessibilitySettings(!showAccessibilitySettings);
  };

  return (
    <ChartAccessibilityProvider>
      <Box>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Analytics
          </Typography>
          
          <Box display="flex" alignItems="center">
            <Tooltip title="Accessibility Settings">
              <IconButton 
                onClick={toggleAccessibilitySettings} 
                aria-label="Open chart accessibility settings"
                sx={{ mr: 2 }}
              >
                <AccessibilityIcon />
              </IconButton>
            </Tooltip>
            <Button variant="contained">
              Export Report
            </Button>
          </Box>
        </Box>
        
        <Paper sx={{ width: '100%', mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Analytics dashboard tabs"
          >
            <Tab label="Overview" id="analytics-tab-0" aria-controls="analytics-tabpanel-0" />
            <Tab label="AI API Metrics" id="analytics-tab-1" aria-controls="analytics-tabpanel-1" />
            <Tab label="UX Analytics" id="analytics-tab-2" aria-controls="analytics-tabpanel-2" />
            <Tab label="Content Performance" id="analytics-tab-3" aria-controls="analytics-tabpanel-3" />
            <Tab label="Campaign Analytics" id="analytics-tab-4" aria-controls="analytics-tabpanel-4" />
          </Tabs>
          
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h5" component="h2" gutterBottom>
              Dashboard Overview
            </Typography>
            <Typography variant="body1">
              Select a tab to view detailed analytics for different aspects of your marketing efforts.
            </Typography>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <ApiMetrics />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <UXAnalyticsDashboard />
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h5" component="h2" gutterBottom>
              Content Performance
            </Typography>
            <Typography variant="body1">
              Content performance analytics coming soon.
            </Typography>
          </TabPanel>
          
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h5" component="h2" gutterBottom>
              Campaign Analytics
            </Typography>
            <Typography variant="body1">
              Campaign analytics coming soon.
            </Typography>
          </TabPanel>
        </Paper>
        
        {/* Accessibility Settings Dialog */}
        {showAccessibilitySettings && (
          <Box 
            sx={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0, 0, 0, 0.5)', 
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                toggleAccessibilitySettings();
              }
            }}
          >
            <Box 
              sx={{ 
                width: '100%', 
                maxWidth: 600, 
                maxHeight: '90vh', 
                overflow: 'auto',
                borderRadius: 1
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <ChartAccessibilitySettings onClose={toggleAccessibilitySettings} />
            </Box>
          </Box>
        )}
      </Box>
    </ChartAccessibilityProvider>
  );
};

export default Analytics;