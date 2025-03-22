import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Tabs, 
  Tab, 
  Paper,
  Divider
} from '@mui/material';
import ApiMetrics from './ApiMetrics';
import UXAnalyticsDashboard from './UXAnalyticsDashboard';

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Analytics
        </Typography>
        
        <Button variant="contained">
          Export Report
        </Button>
      </Box>
      
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" />
          <Tab label="AI API Metrics" />
          <Tab label="UX Analytics" />
          <Tab label="Content Performance" />
          <Tab label="Campaign Analytics" />
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
    </Box>
  );
};

export default Analytics;