import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Snackbar,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useQuery, useQueryClient } from 'react-query';
import { addDays, format, subDays } from 'date-fns';

// Custom components
import TimeSeriesChart from '../../components/analytics/TimeSeriesChart';
import DistributionChart from '../../components/analytics/DistributionChart';
import HeatmapChart from '../../components/analytics/HeatmapChart';
import ABTestComparisonChart from '../../components/analytics/ABTestComparisonChart';
import UserJourneyFlow from '../../components/analytics/UserJourneyFlow';
import DashboardFilters, { FilterState } from '../../components/analytics/DashboardFilters';
import CustomizableDashboard, { 
  Dashboard,
  DashboardWidget,
  WidgetDefinition
} from '../../components/analytics/CustomizableDashboard';
import AutomatedInsights from '../../components/analytics/AutomatedInsights';
import TrendDetector from '../../components/analytics/TrendDetector';
import ComparisonSummary from '../../components/analytics/ComparisonSummary';

// Services & Utilities
import { useAnalytics } from '../../hooks/useAnalytics';
import * as exportUtils from '../../utils/exportUtils';

// Define the tab interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab Panel component
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ux-analytics-tabpanel-${index}`}
      aria-labelledby={`ux-analytics-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ pt: 3, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Define available filter definitions
const filterDefinitions = [
  {
    id: 'dateRange',
    name: 'Date Range',
    type: 'date-range' as const,
    defaultValue: [subDays(new Date(), 30), new Date()]
  },
  {
    id: 'userType',
    name: 'User Type',
    type: 'select' as const,
    options: [
      { id: 'all', label: 'All Users' },
      { id: 'authenticated', label: 'Authenticated Users' },
      { id: 'anonymous', label: 'Anonymous Users' }
    ],
    defaultValue: 'all'
  },
  {
    id: 'features',
    name: 'Features',
    type: 'multi-select' as const,
    options: [
      { id: 'aiAssistant', label: 'AI Assistant' },
      { id: 'collaboration', label: 'Collaboration' },
      { id: 'contentCreation', label: 'Content Creation' },
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'analytics', label: 'Analytics' }
    ]
  },
  {
    id: 'platform',
    name: 'Platform',
    type: 'toggle' as const,
    options: [
      { id: 'all', label: 'All' },
      { id: 'web', label: 'Web' },
      { id: 'mobile', label: 'Mobile' }
    ],
    defaultValue: 'all'
  }
];

// Define saved filters
const savedFilters = [
  {
    id: 'last-30-days',
    name: 'Last 30 Days - All Users',
    filters: {
      dateRange: [subDays(new Date(), 30), new Date()],
      userType: 'all'
    }
  },
  {
    id: 'ai-assistant-usage',
    name: 'AI Assistant Usage - Last 7 Days',
    filters: {
      dateRange: [subDays(new Date(), 7), new Date()],
      features: ['aiAssistant'],
      userType: 'authenticated'
    }
  },
  {
    id: 'collaboration-metrics',
    name: 'Collaboration Metrics - Last 14 Days',
    filters: {
      dateRange: [subDays(new Date(), 14), new Date()],
      features: ['collaboration'],
      platform: 'web'
    }
  }
];

// Available widgets for customizable dashboard
const availableWidgets: WidgetDefinition[] = [
  {
    type: 'featureUsage',
    title: 'Feature Usage Trends',
    description: 'Track usage trends across different features',
    component: TimeSeriesChart,
    defaultSize: 'medium',
    defaultOptions: {
      dataKeys: ['aiAssistant', 'collaboration', 'contentCreation', 'dashboard'],
      formatValue: (value: number) => `${value}`,
      yAxisLabel: 'Usage Count',
      showControls: true
    }
  },
  {
    type: 'userDistribution',
    title: 'User Type Distribution',
    description: 'Breakdown of usage by user type',
    component: DistributionChart,
    defaultSize: 'small',
    defaultOptions: {
      showLegend: true,
      formatValue: (value: number) => `${value.toLocaleString()} users`
    }
  },
  {
    type: 'aiAssistantMetrics',
    title: 'AI Assistant Effectiveness',
    description: 'Track AI suggestion acceptance rates and quality',
    component: TimeSeriesChart,
    defaultSize: 'medium',
    defaultOptions: {
      dataKeys: ['acceptanceRate', 'qualityScore'],
      formatValue: (value: number) => `${value.toFixed(1)}%`,
      yAxisLabel: 'Rate',
      showControls: true
    }
  },
  {
    type: 'featureHeatmap',
    title: 'Feature Usage Heatmap',
    description: 'Usage patterns by time of day and day of week',
    component: HeatmapChart,
    defaultSize: 'medium',
    defaultOptions: {
      formatValue: (value: number) => `${value}`,
      colorScale: ['#e0f7fa', '#006064']
    }
  },
  {
    type: 'userJourney',
    title: 'User Journey Flow',
    description: 'Visualize common user paths through the application',
    component: UserJourneyFlow,
    defaultSize: 'large',
    defaultOptions: {}
  },
  {
    type: 'abTestResults',
    title: 'A/B Test Results',
    description: 'Compare performance of different UX variants',
    component: ABTestComparisonChart,
    defaultSize: 'medium',
    defaultOptions: {
      showRelativeChange: true
    }
  },
  {
    type: 'uxInsights',
    title: 'UX Insights',
    description: 'Automated insights and recommendations',
    component: AutomatedInsights,
    defaultSize: 'medium',
    defaultOptions: {
      showCategories: ['performance', 'opportunity']
    }
  },
  {
    type: 'trendAnalysis',
    title: 'UX Trend Analysis',
    description: 'Automatically detected trends and patterns',
    component: TrendDetector,
    defaultSize: 'medium',
    defaultOptions: {
      trends: [
        {
          metric: "Collaboration Feature Usage",
          currentValue: 3240,
          previousValue: 2150,
          changePercent: 50.7,
          changeType: "increase",
          isPositive: true
        },
        {
          metric: "WebSocket Error Rate",
          currentValue: 0.8,
          previousValue: 2.3,
          changePercent: -65.2,
          changeType: "decrease",
          isPositive: true,
          unit: "%"
        },
        {
          metric: "Mobile Session Duration",
          currentValue: 432,
          previousValue: 520,
          changePercent: -16.9,
          changeType: "decrease",
          isPositive: false,
          isCritical: true,
          unit: "s"
        }
      ],
      patterns: [
        {
          patternType: "seasonal",
          description: "Weekly pattern detected with higher usage on Wednesdays and Thursdays",
          confidence: 93,
          metric: "Daily Active Users",
          suggestion: "Consider scheduling feature releases on Mondays to maximize weekly exposure"
        },
        {
          patternType: "anomaly",
          description: "Unexpected drop in collaboration session duration on mobile devices",
          confidence: 87,
          metric: "Mobile Collaboration Time",
          suggestion: "Investigate mobile interface issues in collaborative editing"
        }
      ]
    }
  },
  {
    type: 'periodComparison',
    title: 'Period Comparison',
    description: 'Compare metrics between different time periods',
    component: ComparisonSummary,
    defaultSize: 'medium',
    defaultOptions: {
      baselinePeriod: "Previous Month",
      currentPeriod: "Current Month",
      comparisonItems: [
        {
          metric: "User Engagement",
          baseline: { value: 6320, label: "Previous" },
          current: { value: 8150, label: "Current" },
          changePercent: 28.96,
          isPositive: true,
          target: 9000,
          goalCompletion: 90.5
        },
        {
          metric: "Average Session Duration",
          baseline: { value: 720, label: "Previous" },
          current: { value: 852, label: "Current" },
          changePercent: 18.33,
          isPositive: true,
          unit: "s",
          target: 900,
          goalCompletion: 94.7
        },
        {
          metric: "AI Suggestions Accepted",
          baseline: { value: 62.4, label: "Previous" },
          current: { value: 75.8, label: "Current" },
          changePercent: 21.47,
          isPositive: true,
          unit: "%",
          target: 80,
          goalCompletion: 94.75
        }
      ]
    }
  }
];

// Default dashboard configuration
const defaultDashboard: Dashboard = {
  id: 'default-ux-dashboard',
  name: 'UX Analytics Dashboard',
  widgets: [
    {
      id: 'widget-1',
      type: 'featureUsage',
      title: 'Feature Usage Trends',
      size: 'medium',
      position: 0,
      options: {
        dataKeys: ['aiAssistant', 'collaboration', 'contentCreation', 'dashboard'],
        formatValue: (value: number) => `${value}`,
        yAxisLabel: 'Usage Count'
      }
    },
    {
      id: 'widget-2',
      type: 'userDistribution',
      title: 'User Type Distribution',
      size: 'small',
      position: 1,
      options: {
        showLegend: true,
        formatValue: (value: number) => `${value.toLocaleString()} users`
      }
    },
    {
      id: 'widget-3',
      type: 'aiAssistantMetrics',
      title: 'AI Assistant Effectiveness',
      size: 'medium',
      position: 2,
      options: {
        dataKeys: ['acceptanceRate', 'qualityScore'],
        formatValue: (value: number) => `${value.toFixed(1)}%`,
        yAxisLabel: 'Rate'
      }
    },
    {
      id: 'widget-4',
      type: 'abTestResults',
      title: 'A/B Test Results',
      size: 'medium',
      position: 3,
      options: {
        showRelativeChange: true
      }
    },
    {
      id: 'widget-5',
      type: 'uxInsights',
      title: 'UX Insights',
      size: 'medium',
      position: 4,
      options: {
        showCategories: ['performance', 'opportunity']
      }
    }
  ]
};

const UXAnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  // State
  const [currentTab, setCurrentTab] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: [subDays(new Date(), 30), new Date()],
    userType: 'all'
  });
  const [dashboard, setDashboard] = useState<Dashboard>(defaultDashboard);
  const [isEditMode, setIsEditMode] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(0);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [selectedAbMetric, setSelectedAbMetric] = useState('conversionRate');
  
  // Custom hooks
  const {
    getFeatureUsageMetrics,
    getAIAssistantMetrics,
    getWebSocketMetrics,
    getUserJourneys,
    getABTestResults,
    getUXInsights
  } = useAnalytics();
  
  // Format date for API calls
  const formatDateForApi = (date: Date) => format(date, 'yyyy-MM-dd');
  
  // Parse filters for API calls
  const getDateRange = useCallback(() => {
    const dateRange = filters.dateRange as Date[];
    if (dateRange && dateRange[0] && dateRange[1]) {
      return {
        startDate: formatDateForApi(dateRange[0]),
        endDate: formatDateForApi(dateRange[1])
      };
    }
    // Default to last 30 days
    return {
      startDate: formatDateForApi(subDays(new Date(), 30)),
      endDate: formatDateForApi(new Date())
    };
  }, [filters.dateRange]);
  
  // Create query parameters
  const createQueryParams = useCallback(() => {
    const { startDate, endDate } = getDateRange();
    return {
      startDate,
      endDate,
      userType: filters.userType || 'all',
      features: Array.isArray(filters.features) ? filters.features.join(',') : undefined,
      platform: filters.platform !== 'all' ? filters.platform : undefined
    };
  }, [filters, getDateRange]);
  
  // Queries
  const featureUsageQuery = useQuery(
    ['featureUsage', createQueryParams()],
    () => getFeatureUsageMetrics(createQueryParams()),
    {
      refetchInterval: isAutoRefreshEnabled ? refreshInterval * 1000 : false,
      keepPreviousData: true
    }
  );
  
  const aiAssistantQuery = useQuery(
    ['aiAssistant', createQueryParams()],
    () => getAIAssistantMetrics(createQueryParams()),
    {
      refetchInterval: isAutoRefreshEnabled ? refreshInterval * 1000 : false,
      keepPreviousData: true
    }
  );
  
  const websocketMetricsQuery = useQuery(
    ['websocketMetrics', createQueryParams()],
    () => getWebSocketMetrics(createQueryParams()),
    {
      refetchInterval: isAutoRefreshEnabled ? refreshInterval * 1000 : false,
      keepPreviousData: true
    }
  );
  
  const userJourneysQuery = useQuery(
    ['userJourneys', createQueryParams()],
    () => getUserJourneys(createQueryParams()),
    {
      refetchInterval: isAutoRefreshEnabled ? refreshInterval * 1000 : false,
      keepPreviousData: true
    }
  );
  
  const abTestResultsQuery = useQuery(
    ['abTestResults', createQueryParams()],
    () => getABTestResults(createQueryParams()),
    {
      refetchInterval: isAutoRefreshEnabled ? refreshInterval * 1000 : false,
      keepPreviousData: true
    }
  );
  
  const uxInsightsQuery = useQuery(
    ['uxInsights', createQueryParams()],
    () => getUXInsights(createQueryParams()),
    {
      refetchInterval: isAutoRefreshEnabled ? refreshInterval * 1000 : false,
      keepPreviousData: true
    }
  );
  
  // Check if any query is loading
  const isLoading = featureUsageQuery.isLoading || 
                   aiAssistantQuery.isLoading || 
                   websocketMetricsQuery.isLoading ||
                   userJourneysQuery.isLoading ||
                   abTestResultsQuery.isLoading ||
                   uxInsightsQuery.isLoading;
  
  // Combine all data for dashboard widgets
  const dashboardData = {
    featureUsage: featureUsageQuery.data?.dailyUsage || [],
    userDistribution: featureUsageQuery.data?.userTypeDistribution || [],
    aiAssistantMetrics: aiAssistantQuery.data?.dailyMetrics || [],
    featureHeatmap: featureUsageQuery.data?.heatmapData || [],
    userJourney: userJourneysQuery.data || { nodes: [], connections: [] },
    abTestResults: abTestResultsQuery.data || { variants: [], metrics: [], results: [] },
    uxInsights: uxInsightsQuery.data || []
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };
  
  // Handle filter changes
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };
  
  // Handle load saved filter
  const handleLoadFilter = (filterId: string) => {
    const savedFilter = savedFilters.find(f => f.id === filterId);
    if (savedFilter) {
      setFilters(savedFilter.filters);
      setSnackbar({
        open: true,
        message: `Loaded filter: ${savedFilter.name}`,
        severity: 'success'
      });
    }
  };
  
  // Handle save filter
  const handleSaveFilter = (name: string) => {
    // In a real app, this would save to backend
    setSnackbar({
      open: true,
      message: `Filter saved as: ${name}`,
      severity: 'success'
    });
  };
  
  // Handle add widget
  const handleAddWidget = (widget: DashboardWidget) => {
    setDashboard(prev => ({
      ...prev,
      widgets: [...prev.widgets, widget]
    }));
  };
  
  // Handle update widget
  const handleUpdateWidget = (id: string, updates: Partial<DashboardWidget>) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget => 
        widget.id === id ? { ...widget, ...updates } : widget
      )
    }));
  };
  
  // Handle remove widget
  const handleRemoveWidget = (id: string) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.filter(widget => widget.id !== id)
    }));
  };
  
  // Handle update layout
  const handleUpdateLayout = (widgets: DashboardWidget[]) => {
    setDashboard(prev => ({
      ...prev,
      widgets
    }));
  };
  
  // Handle save dashboard
  const handleSaveDashboard = (name: string) => {
    setDashboard(prev => ({
      ...prev,
      name
    }));
    // In a real app, this would save to backend
    setSnackbar({
      open: true,
      message: `Dashboard saved as: ${name}`,
      severity: 'success'
    });
  };
  
  // Handle export dashboard
  const handleExportDashboard = () => {
    if (!dashboardRef.current) return;
    
    exportUtils.exportAsPDF(
      'dashboard-container',
      'ux-analytics-dashboard',
      dashboard.name,
      'landscape'
    ).then(() => {
      setSnackbar({
        open: true,
        message: 'Dashboard exported successfully',
        severity: 'success'
      });
    }).catch(error => {
      setSnackbar({
        open: true,
        message: `Error exporting dashboard: ${error.message}`,
        severity: 'error'
      });
    });
  };
  
  // Handle data refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries(['featureUsage']);
    queryClient.invalidateQueries(['aiAssistant']);
    queryClient.invalidateQueries(['websocketMetrics']);
    queryClient.invalidateQueries(['userJourneys']);
    queryClient.invalidateQueries(['abTestResults']);
    queryClient.invalidateQueries(['uxInsights']);
  };
  
  // Handle auto refresh toggle
  const handleAutoRefreshToggle = () => {
    setIsAutoRefreshEnabled(prev => !prev);
  };
  
  // Handle refresh interval change
  const handleRefreshIntervalChange = (interval: number) => {
    setRefreshInterval(interval);
  };
  
  // Handle save insight
  const handleSaveInsight = (insightId: string, isSaved: boolean) => {
    // In a real app, this would save to backend
    setSnackbar({
      open: true,
      message: isSaved ? 'Insight saved' : 'Insight unsaved',
      severity: 'success'
    });
  };
  
  // Handle create alert
  const handleCreateAlert = (insightId: string) => {
    // In a real app, this would create an alert
    setSnackbar({
      open: true,
      message: 'Alert created for this insight',
      severity: 'success'
    });
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          variant="scrollable" 
          scrollButtons="auto"
        >
          <Tab label="Dashboard" />
          <Tab label="Feature Usage" />
          <Tab label="AI Assistant" />
          <Tab label="WebSocket Metrics" />
          <Tab label="User Journeys" />
          <Tab label="A/B Testing" />
          <Tab label="Automated Insights" />
        </Tabs>
      </Box>
      
      {/* Filters (shared across all tabs) */}
      <DashboardFilters
        filterDefinitions={filterDefinitions}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        savedFilters={savedFilters}
        onSaveFilter={handleSaveFilter}
        onLoadFilter={handleLoadFilter}
        onExport={handleExportDashboard}
        refreshInterval={refreshInterval}
        onRefreshIntervalChange={handleRefreshIntervalChange}
        isAutoRefreshEnabled={isAutoRefreshEnabled}
        onAutoRefreshToggle={handleAutoRefreshToggle}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />
      
      {/* Main Tab Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* Dashboard Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={7}>
              <ComparisonSummary
                title="Performance Overview"
                description="Comparison of key metrics between periods"
                baselinePeriod="Previous Month"
                currentPeriod="Current Month"
                comparisonItems={[
                  {
                    metric: "User Engagement",
                    baseline: { value: 6320, label: "Previous" },
                    current: { value: 8150, label: "Current" },
                    changePercent: 28.96,
                    isPositive: true,
                    target: 9000,
                    goalCompletion: 90.5,
                    notes: "User engagement significantly increased after new features release"
                  },
                  {
                    metric: "Average Session Duration",
                    baseline: { value: 720, label: "Previous" },
                    current: { value: 852, label: "Current" },
                    changePercent: 18.33,
                    isPositive: true,
                    unit: "s",
                    target: 900,
                    goalCompletion: 94.7
                  },
                  {
                    metric: "AI Suggestions Accepted",
                    baseline: { value: 62.4, label: "Previous" },
                    current: { value: 75.8, label: "Current" },
                    changePercent: 21.47,
                    isPositive: true,
                    unit: "%",
                    target: 80,
                    goalCompletion: 94.75
                  }
                ]}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <TrendDetector
                title="UX Trends & Patterns"
                description="Automatically detected trends and patterns in UX metrics"
                trends={[
                  {
                    metric: "Collaboration Feature Usage",
                    currentValue: 3240,
                    previousValue: 2150,
                    changePercent: 50.7,
                    changeType: "increase",
                    isPositive: true
                  },
                  {
                    metric: "WebSocket Error Rate",
                    currentValue: 0.8,
                    previousValue: 2.3,
                    changePercent: -65.2,
                    changeType: "decrease",
                    isPositive: true,
                    unit: "%"
                  },
                  {
                    metric: "Mobile Session Duration",
                    currentValue: 432,
                    previousValue: 520,
                    changePercent: -16.9,
                    changeType: "decrease",
                    isPositive: false,
                    isCritical: true,
                    unit: "s",
                    notes: "Mobile sessions are getting shorter despite increased user engagement"
                  }
                ]}
                patterns={[
                  {
                    patternType: "seasonal",
                    description: "Weekly pattern detected with higher usage on Wednesdays and Thursdays",
                    confidence: 93,
                    metric: "Daily Active Users",
                    suggestion: "Consider scheduling feature releases on Mondays to maximize weekly exposure"
                  },
                  {
                    patternType: "anomaly",
                    description: "Unexpected drop in collaboration session duration on mobile devices",
                    confidence: 87,
                    metric: "Mobile Collaboration Time",
                    suggestion: "Investigate mobile interface issues in collaborative editing"
                  }
                ]}
              />
            </Grid>
          </Grid>
          
          <Box 
            id="dashboard-container" 
            ref={dashboardRef}
            sx={{ height: '100%' }}
          >
            <CustomizableDashboard
              availableWidgets={availableWidgets}
              dashboard={dashboard}
              isEditing={isEditMode}
              onAddWidget={handleAddWidget}
              onUpdateWidget={handleUpdateWidget}
              onRemoveWidget={handleRemoveWidget}
              onSaveDashboard={handleSaveDashboard}
              onUpdateLayout={handleUpdateLayout}
              data={dashboardData}
              isLoading={isLoading}
              onExport={handleExportDashboard}
              onToggleEditMode={() => setIsEditMode(prev => !prev)}
            />
          </Box>
        </TabPanel>
        
        {/* Feature Usage Tab */}
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TimeSeriesChart
                title="Feature Usage Trends"
                description="Daily usage of different features over time"
                data={featureUsageQuery.data?.dailyUsage || []}
                dataKeys={['aiAssistant', 'collaboration', 'contentCreation', 'dashboard']}
                yAxisLabel="Usage Count"
                height={400}
                formatValue={(value) => `${value.toLocaleString()}`}
                showControls={true}
                referenceLines={[
                  { value: 800, label: 'Target Usage', color: '#4caf50' }
                ]}
                annotations={[
                  { date: featureUsageQuery.data?.dailyUsage?.[20]?.date || '', text: 'New Feature Launch', color: '#f44336' },
                  { date: featureUsageQuery.data?.dailyUsage?.[25]?.date || '', text: 'Marketing Campaign', color: '#2196f3' }
                ]}
                onExport={(format) => {
                  setSnackbar({
                    open: true,
                    message: `Chart exported as ${format.toUpperCase()}`,
                    severity: 'success'
                  });
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DistributionChart
                title="User Type Distribution"
                description="Breakdown of usage by user type"
                data={featureUsageQuery.data?.userTypeDistribution || []}
                height={400}
                formatValue={(value) => `${value.toLocaleString()} users`}
              />
            </Grid>
            <Grid item xs={12}>
              <HeatmapChart
                title="Feature Usage Heatmap"
                description="Usage patterns by time of day and day of week"
                data={featureUsageQuery.data?.heatmapData || []}
                xLabels={featureUsageQuery.data?.heatmapXLabels || []}
                yLabels={featureUsageQuery.data?.heatmapYLabels || []}
                colorScale={['#e0f7fa', '#006064']}
                height={450}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Feature Adoption Rate
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Percentage of users who used each feature at least once in the selected period
                  </Typography>
                  {featureUsageQuery.isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py:, 2 }}>
                      <CircularProgress size={40} />
                    </Box>
                  ) : (
                    <Box sx={{ mt: 2 }}>
                      {(featureUsageQuery.data?.adoptionRates || []).map((item: any) => (
                        <Box key={item.feature} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">{item.feature}</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {item.rate}%
                            </Typography>
                          </Box>
                          <Box sx={{ width: '100%', backgroundColor: theme.palette.grey[200], borderRadius: 1 }}>
                            <Box
                              sx={{
                                height: 8,
                                borderRadius: 1,
                                backgroundColor: theme.palette.primary.main,
                                width: `${item.rate}%`,
                              }}
                            />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Key Metrics
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Summary of feature usage and performance metrics
                  </Typography>
                  {featureUsageQuery.isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={40} />
                    </Box>
                  ) : (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {(featureUsageQuery.data?.keyMetrics || []).map((metric: any) => (
                        <Grid item xs={6} key={metric.name}>
                          <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {metric.name}
                            </Typography>
                            <Typography variant="h5" component="div" sx={{ mt: 1 }}>
                              {metric.value}
                            </Typography>
                            {metric.change && (
                              <Box 
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  color: metric.change > 0 ? 'success.main' : 'error.main',
                                  mt: 0.5
                                }}
                              >
                                {metric.change > 0 ? '↑' : '↓'}
                                <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                                  {Math.abs(metric.change)}%
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* AI Assistant Tab */}
        <TabPanel value={currentTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TimeSeriesChart
                title="AI Assistant Performance"
                description="Acceptance rate and quality score over time"
                data={aiAssistantQuery.data?.dailyMetrics || []}
                dataKeys={['acceptanceRate', 'qualityScore']}
                yAxisLabel="Rate (%)"
                height={400}
                formatValue={(value) => `${value.toFixed(1)}%`}
                showControls={true}
                compareWith={{
                  label: "Previous Month",
                  startDate: aiAssistantQuery.data?.dailyMetrics?.[0]?.date || '',
                  endDate: aiAssistantQuery.data?.dailyMetrics?.[7]?.date || '',
                  color: '#673ab7'
                }}
                referencePoints={[
                  { 
                    date: aiAssistantQuery.data?.dailyMetrics?.[15]?.date || '', 
                    value: aiAssistantQuery.data?.dailyMetrics?.[15]?.qualityScore || 0, 
                    label: 'AI Model Update', 
                    color: '#009688'
                  }
                ]}
                onExport={(format) => {
                  setSnackbar({
                    open: true,
                    message: `Chart exported as ${format.toUpperCase()}`,
                    severity: 'success'
                  });
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DistributionChart
                title="Suggestion Type Distribution"
                description="Breakdown of AI suggestions by type"
                data={aiAssistantQuery.data?.suggestionTypes || []}
                height={400}
                formatValue={(value) => `${value.toLocaleString()}`}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TimeSeriesChart
                title="AI Assistant Response Time"
                description="Average time to generate suggestions"
                data={aiAssistantQuery.data?.responseTimes || []}
                dataKeys={['averageResponseTime']}
                yAxisLabel="Time (ms)"
                height={300}
                formatValue={(value) => `${value.toFixed(0)} ms`}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TimeSeriesChart
                title="Cache Performance"
                description="Cache hit rate for AI suggestions"
                data={aiAssistantQuery.data?.cachePerformance || []}
                dataKeys={['hitRate']}
                yAxisLabel="Hit Rate (%)"
                height={300}
                formatValue={(value) => `${value.toFixed(1)}%`}
              />
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    AI Assistant Usage Insights
                  </Typography>
                  {aiAssistantQuery.isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={40} />
                    </Box>
                  ) : (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {(aiAssistantQuery.data?.insights || []).map((insight: any, index: number) => (
                        <Grid item xs={12} md={4} key={index}>
                          <Box sx={{ 
                            p: 2, 
                            border: `1px solid ${theme.palette.divider}`, 
                            borderRadius: 1,
                            height: '100%'
                          }}>
                            <Typography variant="subtitle1" gutterBottom>
                              {insight.title}
                            </Typography>
                            <Typography variant="body2" paragraph>
                              {insight.description}
                            </Typography>
                            
                            {insight.metrics && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {insight.metrics.label}:
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  {insight.metrics.value}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* WebSocket Metrics Tab */}
        <TabPanel value={currentTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TimeSeriesChart
                title="WebSocket Connection Count"
                description="Number of active connections over time"
                data={websocketMetricsQuery.data?.connectionCounts || []}
                dataKeys={['activeConnections']}
                yAxisLabel="Connections"
                height={300}
                formatValue={(value) => `${value.toLocaleString()}`}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TimeSeriesChart
                title="WebSocket Message Volume"
                description="Number of messages sent and received"
                data={websocketMetricsQuery.data?.messageVolume || []}
                dataKeys={['sent', 'received']}
                yAxisLabel="Messages"
                height={300}
                formatValue={(value) => `${value.toLocaleString()}`}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TimeSeriesChart
                title="WebSocket Latency"
                description="Average message latency over time"
                data={websocketMetricsQuery.data?.latency || []}
                dataKeys={['averageLatency']}
                yAxisLabel="Latency (ms)"
                height={300}
                formatValue={(value) => `${value.toFixed(1)} ms`}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TimeSeriesChart
                title="Error Rate"
                description="Percentage of failed WebSocket operations"
                data={websocketMetricsQuery.data?.errorRate || []}
                dataKeys={['errorRate']}
                yAxisLabel="Error Rate (%)"
                height={300}
                formatValue={(value) => `${value.toFixed(2)}%`}
              />
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    WebSocket Performance Summary
                  </Typography>
                  {websocketMetricsQuery.isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={40} />
                    </Box>
                  ) : (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {(websocketMetricsQuery.data?.summary || []).map((item: any) => (
                        <Grid item xs={6} md={3} key={item.metric}>
                          <Box sx={{ 
                            p: 2, 
                            border: `1px solid ${theme.palette.divider}`, 
                            borderRadius: 1,
                            textAlign: 'center'
                          }}>
                            <Typography variant="h5" component="div">
                              {item.value}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.metric}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* User Journeys Tab */}
        <TabPanel value={currentTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ height: 600 }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom>
                    User Journey Flow
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Visualization of common user paths through the application
                  </Typography>
                  
                  {userJourneysQuery.isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                      <CircularProgress size={40} />
                    </Box>
                  ) : (
                    <Box sx={{ flexGrow: 1 }}>
                      <UserJourneyFlow
                        title="User Journey Map"
                        nodes={userJourneysQuery.data?.nodes || []}
                        connections={userJourneysQuery.data?.connections || []}
                        height="100%"
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <TimeSeriesChart
                title="User Journey Conversion Rate"
                description="Percentage of users completing key journeys"
                data={userJourneysQuery.data?.conversionRates || []}
                dataKeys={['contentCreation', 'collaboration', 'publishing']}
                yAxisLabel="Conversion Rate (%)"
                height={300}
                formatValue={(value) => `${value.toFixed(1)}%`}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TimeSeriesChart
                title="Average Journey Time"
                description="Time taken to complete key user journeys"
                data={userJourneysQuery.data?.journeyTimes || []}
                dataKeys={['contentCreation', 'collaboration', 'publishing']}
                yAxisLabel="Time (seconds)"
                height={300}
                formatValue={(value) => `${value.toFixed(0)}s`}
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* A/B Testing Tab */}
        <TabPanel value={currentTab} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ABTestComparisonChart
                title="A/B Test Results"
                description="Performance comparison of different UX variants"
                variants={abTestResultsQuery.data?.variants || []}
                metrics={abTestResultsQuery.data?.metrics || []}
                results={abTestResultsQuery.data?.results || []}
                height={500}
                showRelativeChange={true}
                selectedMetric={selectedAbMetric}
                onSelectMetric={setSelectedAbMetric}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TimeSeriesChart
                title="A/B Test Performance Over Time"
                description={`Daily ${selectedAbMetric} by variant`}
                data={abTestResultsQuery.data?.timeSeriesData?.[selectedAbMetric] || []}
                dataKeys={abTestResultsQuery.data?.variants?.map(v => v.id) || []}
                yAxisLabel="Value"
                height={350}
                formatValue={(value) => 
                  selectedAbMetric.includes('Rate') ? `${value.toFixed(1)}%` : value.toString()
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Test Insights
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Key findings and statistical analysis
                  </Typography>
                  
                  {abTestResultsQuery.isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={40} />
                    </Box>
                  ) : (
                    <Box>
                      {(abTestResultsQuery.data?.insights || []).map((insight: any, index: number) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            p: 2, 
                            mb: 2, 
                            border: `1px solid ${theme.palette.divider}`,
                            borderLeft: `4px solid ${insight.isPositive ? theme.palette.success.main : theme.palette.warning.main}`,
                            borderRadius: 1
                          }}
                        >
                          <Typography variant="subtitle1" gutterBottom>
                            {insight.title}
                          </Typography>
                          <Typography variant="body2">
                            {insight.description}
                          </Typography>
                          {insight.confidence && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Confidence: {insight.confidence}%
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Automated Insights Tab */}
        <TabPanel value={currentTab} index={6}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <AutomatedInsights
                insights={uxInsightsQuery.data || []}
                isLoading={uxInsightsQuery.isLoading}
                onInsightSave={handleSaveInsight}
                onRefresh={() => queryClient.invalidateQueries(['uxInsights'])}
                onCreateAlert={handleCreateAlert}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Insight Categories
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Filter insights by category
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {['performance', 'anomaly', 'trend', 'opportunity', 'prediction'].map((category) => {
                      // Count insights in each category
                      const count = (uxInsightsQuery.data || []).filter(
                        (insight: any) => insight.category === category
                      ).length;
                      
                      return (
                        <Button
                          key={category}
                          variant="outlined"
                          sx={{
                            justifyContent: 'space-between',
                            textTransform: 'capitalize',
                            py: 1.5
                          }}
                          onClick={() => {
                            // This would filter insights in a real app
                          }}
                        >
                          {category}
                          <Box
                            sx={{
                              backgroundColor: theme.palette.action.hover,
                              borderRadius: '50%',
                              width: 24,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '0.75rem'
                            }}
                          >
                            {count}
                          </Box>
                        </Button>
                      );
                    })}
                  </Box>
                  
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Export Insights
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Download insights as a report
                    </Typography>
                    
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => {
                        // This would export insights in a real app
                        setSnackbar({
                          open: true,
                          message: 'Insights exported successfully',
                          severity: 'success'
                        });
                      }}
                    >
                      Export as PDF
                    </Button>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ mt: 1 }}
                      onClick={() => {
                        // This would export insights as CSV in a real app
                        setSnackbar({
                          open: true,
                          message: 'Insights exported as CSV',
                          severity: 'success'
                        });
                      }}
                    >
                      Export as CSV
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UXAnalyticsDashboard;