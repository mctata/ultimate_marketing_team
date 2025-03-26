import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Tabs, 
  Tab, 
  Paper,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import ApiMetrics from './ApiMetrics';
import UXAnalyticsDashboard from './UXAnalyticsDashboard';
import AccessibilityIcon from '@mui/icons-material/Accessibility';
import { ChartAccessibilityProvider } from '../../context/ChartAccessibilityContext';
import ChartAccessibilitySettings from '../../components/analytics/ChartAccessibilitySettings';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import brandAnalyticsService, { BrandAnalyticsOverview } from '../../services/brandAnalyticsService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      style={{ overflow: 'auto' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Analytics = () => {
  const [tabValue, setTabValue] = useState(0);
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<BrandAnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedBrand } = useSelector((state: RootState) => state.brands);
  
  // Load brand-specific analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!selectedBrand?.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Loading analytics for brand:', selectedBrand.id);
        const data = await brandAnalyticsService.getAnalyticsOverview(selectedBrand.id);
        setAnalyticsData(data);
      } catch (err) {
        console.error('Error loading analytics:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAnalytics();
  }, [selectedBrand]);

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
            
            {/* Brand selection message */}
            {!selectedBrand && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Please select a brand from the dropdown in the header to view brand-specific analytics.
              </Alert>
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            )}
            
            {/* Error message */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {/* Analytics overview */}
            {!isLoading && analyticsData && (
              <Grid container spacing={3}>
                {/* Content metrics */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Content Performance
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Content Items
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.contentMetrics.totalContentItems}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Published Items
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.contentMetrics.publishedItems}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Average Score
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.contentMetrics.averageScore}/100
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Top Performing Type
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.contentMetrics.topPerformingType}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Views
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.contentMetrics.totalViews.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Engagement Rate
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.contentMetrics.engagementRate}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Campaign metrics */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Campaign Performance
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Active Campaigns
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.campaignMetrics.activeCampaigns}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Spend
                          </Typography>
                          <Typography variant="h6">
                            ${analyticsData.campaignMetrics.totalSpend.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Revenue
                          </Typography>
                          <Typography variant="h6">
                            ${analyticsData.campaignMetrics.totalRevenue.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Average ROI
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.campaignMetrics.averageROI}x
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Best Platform
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.campaignMetrics.bestPerformingPlatform}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Conversion Rate
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.campaignMetrics.conversionRate}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Social metrics */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Social Media Performance
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Followers
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.socialMetrics.totalFollowers.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Followers Growth
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.socialMetrics.followersGrowth}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Engagement Rate
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.socialMetrics.engagementRate}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Top Platform
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.socialMetrics.topPerformingPlatform}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Average Reach
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.socialMetrics.averageReach.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Average Impressions
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.socialMetrics.averageImpressions.toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Website metrics */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Website Performance
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Visitors
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.websiteMetrics.visitors.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Page Views
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.websiteMetrics.pageViews.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Avg. Session Duration
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.websiteMetrics.averageSessionDuration} min
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Bounce Rate
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.websiteMetrics.bounceRate}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Organic Traffic
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.websiteMetrics.organicTraffic.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Paid Traffic
                          </Typography>
                          <Typography variant="h6">
                            {analyticsData.websiteMetrics.paidTraffic.toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
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