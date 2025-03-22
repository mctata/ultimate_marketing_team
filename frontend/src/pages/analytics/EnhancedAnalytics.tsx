import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  useTheme,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  Assignment as AssignmentIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import useAnalytics from '../../hooks/useAnalytics';
import ContentAnalyticsDashboard from './ContentAnalyticsDashboard';
import ConversionFunnel from '../../components/analytics/ConversionFunnel';
import ContentPredictions from '../../components/analytics/ContentPredictions';
import ScheduledReports from '../../components/analytics/ScheduledReports';

// Mock data for components
const mockHistoricalData = Array.from({ length: 14 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (13 - i));
  return {
    date: date.toISOString().split('T')[0],
    value: Math.floor(Math.random() * 5000) + 1000
  };
});

const mockTemplates = [
  { id: 'template1', name: 'Content Performance Report', description: 'Comprehensive content analytics report', type: 'content_performance' },
  { id: 'template2', name: 'Executive Summary', description: 'High-level overview for executives', type: 'executive_summary' },
  { id: 'template3', name: 'Conversion Analytics', description: 'Detailed conversion funnel analysis', type: 'conversion_funnel' }
];

const mockFunnelStages = [
  { name: 'Page Views', value: 100000, description: 'Total page views across all content' },
  { name: 'Engaged Visitors', value: 45000, description: 'Visitors who spent >30 seconds or scrolled >50%' },
  { name: 'Clicks', value: 22000, description: 'Clicked a CTA or navigated to another page' },
  { name: 'Form Views', value: 10500, description: 'Viewed a lead generation form' },
  { name: 'Form Submissions', value: 3200, description: 'Completed and submitted a form' },
  { name: 'Conversions', value: 1800, description: 'Completed a high-value conversion action' },
];

/**
 * Enhanced Analytics Page
 * 
 * Main page for enhanced content analytics capabilities
 */
const EnhancedAnalytics: React.FC = () => {
  const theme = useTheme();
  
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // In a real app, this would refresh data from APIs
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle prediction generation
  const handlePredictionGenerated = (prediction: any) => {
    console.log('New prediction generated:', prediction);
    // In a real app, this might update state or trigger a notification
  };
  
  // Handle report generation
  const handleReportGenerated = (report: any) => {
    console.log('Report generated:', report);
    // In a real app, this might navigate to the report viewer
  };
  
  // Render tab panel
  const renderTabPanel = (index: number) => {
    switch (index) {
      case 0: // Dashboards
        return <ContentAnalyticsDashboard />;
      case 1: // Predictive Analytics
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <ContentPredictions
                contentId={123}
                contentTitle="Ultimate Guide to Content Marketing"
                contentType="blog_post"
                historicalData={mockHistoricalData}
                onPredictionGenerated={handlePredictionGenerated}
              />
            </Grid>
            <Grid item xs={12} lg={4}>
              <ConversionFunnel
                title="Conversion Path Analysis"
                subtitle="Total conversions by stage"
                stages={mockFunnelStages}
                showConversionRates
                startWidth={90}
                endWidth={30}
              />
            </Grid>
          </Grid>
        );
      case 2: // Reports
        return (
          <ScheduledReports
            availableTemplates={mockTemplates}
            onGenerateReport={handleReportGenerated}
          />
        );
      default:
        return <Box>Unknown tab</Box>;
    }
  };
  
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 2 }}
        >
          <Link 
            color="inherit" 
            href="/" 
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Typography color="text.primary">Analytics</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Content Analytics
          </Typography>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              sx={{ mr: 1 }}
            >
              Share
            </Button>
            <Button
              variant="outlined"
              startIcon={isRefreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </Box>
      
      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message || 'An error occurred'}
        </Alert>
      )}
      
      {/* Tab navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            label="Dashboards" 
            icon={<DashboardIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Predictive Analytics" 
            icon={<TimelineIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Reports" 
            icon={<AssignmentIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>
      
      {/* Tab panels */}
      <Box sx={{ mb: 3 }}>
        {renderTabPanel(activeTab)}
      </Box>
    </Box>
  );
};

export default EnhancedAnalytics;