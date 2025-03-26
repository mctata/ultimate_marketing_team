import { useState, useEffect, useCallback } from 'react';
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
  AlertTitle,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Snackbar
} from '@mui/material';
import ApiMetrics from './ApiMetrics';
import UXAnalyticsDashboard from './UXAnalyticsDashboard';
import AccessibilityIcon from '@mui/icons-material/Accessibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { ChartAccessibilityProvider } from '../../context/ChartAccessibilityContext';
import ChartAccessibilitySettings from '../../components/analytics/ChartAccessibilitySettings';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import brandAnalyticsService, { BrandAnalyticsOverview } from '../../services/brandAnalyticsService';
import axios, { AxiosError } from 'axios';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Define specific error types for better error handling
enum ErrorType {
  NETWORK = 'network',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  UNKNOWN = 'unknown',
  TIMEOUT = 'timeout',
  DATA_PARSING = 'data_parsing'
}

interface AnalyticsError {
  type: ErrorType;
  message: string;
  details?: string;
  retry?: boolean;
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
  const [error, setError] = useState<AnalyticsError | null>(null);
  const [toast, setToast] = useState<{show: boolean, message: string, severity: 'success' | 'info' | 'warning' | 'error'}>({
    show: false,
    message: '',
    severity: 'info'
  });
  const { selectedBrand } = useSelector((state: RootState) => state.brands);
  
  // Helper function to parse errors
  const parseError = (err: unknown): AnalyticsError => {
    // Check if it's an Axios error
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError;
      
      if (axiosError.code === 'ECONNABORTED') {
        return {
          type: ErrorType.TIMEOUT,
          message: 'Request timed out. Please try again.',
          retry: true
        };
      }
      
      if (!axiosError.response) {
        return {
          type: ErrorType.NETWORK,
          message: 'Network error. Please check your internet connection.',
          details: axiosError.message,
          retry: true
        };
      }
      
      // Handle different status codes
      switch (axiosError.response.status) {
        case 401:
        case 403:
          return {
            type: ErrorType.AUTHORIZATION,
            message: 'You do not have permission to access this data.',
            details: 'Please check your login credentials or contact an administrator.',
            retry: false
          };
        case 404:
          return {
            type: ErrorType.NOT_FOUND,
            message: 'Analytics data not found for this brand.',
            details: 'The requested analytics data could not be found.',
            retry: false
          };
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            type: ErrorType.SERVER,
            message: 'Server error. Our team has been notified.',
            details: `Status: ${axiosError.response.status}. Please try again later.`,
            retry: true
          };
        default:
          return {
            type: ErrorType.UNKNOWN,
            message: 'An unexpected error occurred.',
            details: axiosError.message,
            retry: true
          };
      }
    }
    
    // Handle TypeError (often for JSON parsing issues)
    if (err instanceof TypeError) {
      return {
        type: ErrorType.DATA_PARSING,
        message: 'Error processing the data.',
        details: err.message,
        retry: true
      };
    }
    
    // Default case
    return {
      type: ErrorType.UNKNOWN,
      message: 'An unexpected error occurred.',
      details: err instanceof Error ? err.message : String(err),
      retry: true
    };
  };

  // Load brand-specific analytics data
  const loadAnalytics = useCallback(async () => {
    if (!selectedBrand?.id) {
      setAnalyticsData(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading analytics for brand:', selectedBrand.id);
      const data = await brandAnalyticsService.getAnalyticsOverview(selectedBrand.id);
      
      // Validate required data properties
      if (!data || !data.contentMetrics || !data.campaignMetrics || 
          !data.socialMetrics || !data.websiteMetrics) {
        throw new TypeError('Incomplete analytics data received');
      }
      
      setAnalyticsData(data);
      
      // Show success message if previously had an error
      if (error) {
        setToast({
          show: true,
          message: 'Analytics data loaded successfully',
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      const parsedError = parseError(err);
      setError(parsedError);
      setAnalyticsData(null);
      
      // Track error to analytics/monitoring service
      console.error(`[Analytics Error] Type: ${parsedError.type}, Message: ${parsedError.message}`);
      // Here you would normally call a tracking service like:
      // errorTrackingService.logError('analytics_load_failure', parsedError);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBrand, error]);
  
  useEffect(() => {
    loadAnalytics();
    
    // Set up a periodic refresh for the data (every 5 minutes)
    const refreshInterval = setInterval(() => {
      if (selectedBrand?.id) {
        console.log('Refreshing analytics data automatically');
        loadAnalytics();
      }
    }, 5 * 60 * 1000);
    
    // Clean up on unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, [selectedBrand, loadAnalytics]);
  
  // Handle network status changes
  useEffect(() => {
    const handleOnline = () => {
      if (error?.type === ErrorType.NETWORK && selectedBrand?.id) {
        setToast({
          show: true,
          message: 'You are back online. Refreshing data...',
          severity: 'info'
        });
        loadAnalytics();
      }
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [error, selectedBrand, loadAnalytics]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const toggleAccessibilitySettings = () => {
    setShowAccessibilitySettings(!showAccessibilitySettings);
  };
  
  const handleRetry = () => {
    loadAnalytics();
  };
  
  const handleToastClose = () => {
    setToast({...toast, show: false});
  };

  // Render error UI based on error type
  const renderErrorUI = () => {
    if (!error) return null;
    
    return (
      <Alert 
        severity="error" 
        sx={{ mb: 3 }}
        action={
          error.retry ? (
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRetry}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          ) : undefined
        }
        icon={<ErrorOutlineIcon />}
      >
        <AlertTitle>{error.message}</AlertTitle>
        {error.details && <Typography variant="body2">{error.details}</Typography>}
        
        {error.type === ErrorType.NETWORK && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please check your internet connection and try again.
          </Typography>
        )}
        
        {error.type === ErrorType.AUTHORIZATION && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            If you believe this is an error, please contact support.
          </Typography>
        )}
      </Alert>
    );
  };

  // Render content with defensive checks
  const renderMetricSafely = (value: any, formatter?: (val: any) => string) => {
    if (value === undefined || value === null) {
      return 'N/A';
    }
    
    try {
      return formatter ? formatter(value) : value;
    } catch (e) {
      console.error('Error formatting metric:', e);
      return 'Error';
    }
  };

  return (
    <ChartAccessibilityProvider>
      <Box>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Analytics
          </Typography>
          
          <Box display="flex" alignItems="center">
            <Tooltip title="Refresh data">
              <IconButton 
                onClick={handleRetry} 
                disabled={isLoading || !selectedBrand}
                aria-label="Refresh analytics data"
                sx={{ mr: 1 }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Accessibility Settings">
              <IconButton 
                onClick={toggleAccessibilitySettings} 
                aria-label="Open chart accessibility settings"
                sx={{ mr: 2 }}
              >
                <AccessibilityIcon />
              </IconButton>
            </Tooltip>
            <Button 
              variant="contained"
              disabled={!analyticsData}
            >
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
            {error && renderErrorUI()}
            
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
                            {renderMetricSafely(analyticsData.contentMetrics.totalContentItems)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Published Items
                          </Typography>
                          <Typography variant="h6">
                            {renderMetricSafely(analyticsData.contentMetrics.publishedItems)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Average Score
                          </Typography>
                          <Typography variant="h6">
                            {renderMetricSafely(analyticsData.contentMetrics.averageScore, val => `${val}/100`)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Top Performing Type
                          </Typography>
                          <Typography variant="h6">
                            {renderMetricSafely(analyticsData.contentMetrics.topPerformingType)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Views
                          </Typography>
                          <Typography variant="h6">
                            {renderMetricSafely(analyticsData.contentMetrics.totalViews, val => val.toLocaleString())}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Engagement Rate
                          </Typography>
                          <Typography variant="h6">
                            {renderMetricSafely(analyticsData.contentMetrics.engagementRate, val => `${val}%`)}
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
        
        {/* Toast notifications */}
        <Snackbar
          open={toast.show}
          autoHideDuration={6000}
          onClose={handleToastClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleToastClose} severity={toast.severity}>
            {toast.message}
          </Alert>
        </Snackbar>
      </Box>
    </ChartAccessibilityProvider>
  );
};

export default Analytics;