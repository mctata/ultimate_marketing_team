import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  Button, 
  Menu,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import { 
  DatePicker 
} from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area,
  ScatterChart,
  Scatter,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  Sankey,
  RadialBarChart,
  RadialBar
} from 'recharts';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  ShowChart as ShowChartIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GridView as GridViewIcon,
  Settings as SettingsIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  CompareArrows as CompareArrowsIcon,
  FormatShapes as FormatShapesIcon,
  DragIndicator as DragIndicatorIcon,
  MoreHoriz as MoreHorizIcon
} from '@mui/icons-material';
import { GridLayout, Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import useAnalytics from '../../hooks/useAnalytics';
import { ErrorBoundary } from 'react-error-boundary';
import GlobalErrorFallback from '../../components/common/GlobalErrorFallback';

// Make the react-grid-layout responsive
const ResponsiveGridLayout = WidthProvider(Responsive);

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#48C9B0'];

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Helper function to format percentages
const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

// Helper function to format large numbers
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Default widget types
const widgetTypes = [
  { id: 'summary', name: 'Summary Cards', icon: <GridViewIcon /> },
  { id: 'barChart', name: 'Bar Chart', icon: <BarChartIcon /> },
  { id: 'lineChart', name: 'Line Chart', icon: <ShowChartIcon /> },
  { id: 'pieChart', name: 'Pie Chart', icon: <PieChartIcon /> },
  { id: 'areaChart', name: 'Area Chart', icon: <TimelineIcon /> },
  { id: 'topContent', name: 'Top Content', icon: <FormatShapesIcon /> },
  { id: 'conversionFunnel', name: 'Conversion Funnel', icon: <ArrowDownwardIcon /> },
  { id: 'comparison', name: 'Content Comparison', icon: <CompareArrowsIcon /> },
];

// Sample widget data
const defaultWidgets = [
  // Summary cards
  {
    i: 'summary-views',
    x: 0,
    y: 0,
    w: 3,
    h: 2,
    widget_type: 'summary',
    title: 'Total Views',
    settings: {
      metric: 'views',
      comparison: true,
      icon: 'visibility'
    },
    static: false
  },
  {
    i: 'summary-engagement',
    x: 3,
    y: 0,
    w: 3,
    h: 2,
    widget_type: 'summary',
    title: 'Engagement Rate',
    settings: {
      metric: 'engagement_rate',
      comparison: true,
      icon: 'thumb_up'
    },
    static: false
  },
  {
    i: 'summary-conversions',
    x: 6,
    y: 0,
    w: 3,
    h: 2,
    widget_type: 'summary',
    title: 'Conversions',
    settings: {
      metric: 'conversions',
      comparison: true,
      icon: 'check_circle'
    },
    static: false
  },
  {
    i: 'summary-revenue',
    x: 9,
    y: 0,
    w: 3,
    h: 2,
    widget_type: 'summary',
    title: 'Revenue',
    settings: {
      metric: 'revenue',
      comparison: true,
      format: 'currency',
      icon: 'attach_money'
    },
    static: false
  },
  // Performance chart
  {
    i: 'performance-trend',
    x: 0,
    y: 2,
    w: 8,
    h: 4,
    widget_type: 'lineChart',
    title: 'Performance Trend',
    settings: {
      metrics: ['views', 'clicks', 'conversions'],
      timeframe: 'daily',
      comparison: false
    },
    static: false
  },
  // Top content
  {
    i: 'top-content',
    x: 8,
    y: 2,
    w: 4,
    h: 4,
    widget_type: 'topContent',
    title: 'Top Performing Content',
    settings: {
      metric: 'views',
      limit: 5
    },
    static: false
  },
  // Conversion funnel
  {
    i: 'conversion-funnel',
    x: 0,
    y: 6,
    w: 4,
    h: 4,
    widget_type: 'conversionFunnel',
    title: 'Conversion Funnel',
    settings: {
      stages: ['views', 'clicks', 'leads', 'conversions'],
      showPercentages: true
    },
    static: false
  },
  // Content comparison
  {
    i: 'content-comparison',
    x: 4,
    y: 6,
    w: 8,
    h: 4,
    widget_type: 'comparison',
    title: 'Content Comparison',
    settings: {
      content_ids: [1, 2, 3],
      metrics: ['views', 'clicks', 'conversions', 'revenue']
    },
    static: false
  }
];

// Default layouts configuration
const defaultLayouts = {
  lg: defaultWidgets
};

// Interface for widget props
interface WidgetProps {
  id: string;
  type: string;
  title: string;
  settings: any;
  data?: any;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// Widget component
const Widget = ({ id, type, title, settings, data, isEditing, onEdit, onDelete }: WidgetProps) => {
  const theme = useTheme();
  
  // Render widget content based on type
  const renderWidgetContent = () => {
    if (!data) return <CircularProgress />;
    
    switch (type) {
      case 'summary':
        return renderSummaryWidget(data, settings);
      case 'barChart':
        return renderBarChart(data, settings);
      case 'lineChart':
        return renderLineChart(data, settings);
      case 'pieChart':
        return renderPieChart(data, settings);
      case 'areaChart':
        return renderAreaChart(data, settings);
      case 'topContent':
        return renderTopContent(data, settings);
      case 'conversionFunnel':
        return renderConversionFunnel(data, settings);
      case 'comparison':
        return renderComparison(data, settings);
      default:
        return <Typography>Unknown widget type</Typography>;
    }
  };
  
  // Summary widget
  const renderSummaryWidget = (data: any, settings: any) => {
    const metric = settings.metric;
    const value = data[metric] || 0;
    const previousValue = data[`previous_${metric}`] || 0;
    const change = previousValue > 0 ? ((value - previousValue) / previousValue) : 0;
    const isPositive = change >= 0;
    
    let formattedValue = value.toString();
    if (settings.format === 'currency') {
      formattedValue = formatCurrency(value);
    } else if (settings.format === 'percentage') {
      formattedValue = formatPercentage(value);
    } else if (value >= 1000) {
      formattedValue = formatNumber(value);
    }
    
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
          {formattedValue}
        </Typography>
        
        {settings.comparison && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 1 }}>
            {isPositive ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />}
            <Typography 
              variant="body2" 
              color={isPositive ? 'success.main' : 'error.main'}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              {isPositive ? '+' : ''}{(change * 100).toFixed(1)}%
            </Typography>
          </Box>
        )}
      </Box>
    );
  };
  
  // Bar chart
  const renderBarChart = (data: any, settings: any) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={settings.xAxis || 'name'} />
          <YAxis />
          <RechartsTooltip />
          <Legend />
          {settings.metrics && settings.metrics.map((metric: string, index: number) => (
            <Bar key={metric} dataKey={metric} fill={COLORS[index % COLORS.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };
  
  // Line chart
  const renderLineChart = (data: any, settings: any) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={settings.xAxis || 'name'} />
          <YAxis />
          <RechartsTooltip />
          <Legend />
          {settings.metrics && settings.metrics.map((metric: string, index: number) => (
            <Line 
              key={metric} 
              type="monotone" 
              dataKey={metric} 
              stroke={COLORS[index % COLORS.length]}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  // Pie chart
  const renderPieChart = (data: any, settings: any) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={settings.value || 'value'}
            nameKey={settings.name || 'name'}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            label={settings.showLabels !== false}
          >
            {data.map((_: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend />
          <RechartsTooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };
  
  // Area chart
  const renderAreaChart = (data: any, settings: any) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={settings.xAxis || 'name'} />
          <YAxis />
          <RechartsTooltip />
          <Legend />
          {settings.metrics && settings.metrics.map((metric: string, index: number) => (
            <Area 
              key={metric} 
              type="monotone" 
              dataKey={metric} 
              stackId="1"
              stroke={COLORS[index % COLORS.length]}
              fill={alpha(COLORS[index % COLORS.length], 0.5)}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  };
  
  // Top content widget
  const renderTopContent = (data: any, settings: any) => {
    if (!data || !Array.isArray(data)) return <Typography>No data available</Typography>;
    
    return (
      <Box sx={{ height: '100%', overflow: 'auto' }}>
        {data.map((item: any, index: number) => (
          <Box 
            key={index}
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              p: 1,
              borderBottom: index < data.length - 1 ? `1px solid ${theme.palette.divider}` : 'none'
            }}
          >
            <Box 
              sx={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%',
                bgcolor: COLORS[index % COLORS.length],
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}
            >
              {index + 1}
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" noWrap sx={{ maxWidth: '150px' }}>
                {item.title || `Content ${item.content_id}`}
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold">
              {settings.format === 'currency' 
                ? formatCurrency(item[settings.metric]) 
                : formatNumber(item[settings.metric])}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };
  
  // Conversion funnel widget
  const renderConversionFunnel = (data: any, settings: any) => {
    const stages = settings.stages || ['views', 'clicks', 'leads', 'conversions'];
    const funnelData = stages.map((stage: string) => ({
      name: stage.charAt(0).toUpperCase() + stage.slice(1),
      value: data[stage] || 0
    }));
    
    const maxValue = Math.max(...funnelData.map(d => d.value));
    
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {funnelData.map((stage, index) => {
          const nextStage = index < funnelData.length - 1 ? funnelData[index + 1] : null;
          const conversionRate = nextStage && stage.value > 0 
            ? (nextStage.value / stage.value) * 100 
            : 0;
          
          return (
            <Box key={stage.name} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">{stage.name}</Typography>
                <Typography variant="body2">{formatNumber(stage.value)}</Typography>
              </Box>
              <Box sx={{ position: 'relative', height: 24 }}>
                <Box 
                  sx={{ 
                    position: 'absolute',
                    height: '100%',
                    width: '100%',
                    bgcolor: 'grey.300',
                    borderRadius: 1
                  }}
                />
                <Box 
                  sx={{ 
                    position: 'absolute',
                    height: '100%',
                    width: `${(stage.value / maxValue) * 100}%`,
                    bgcolor: COLORS[index % COLORS.length],
                    borderRadius: 1,
                    transition: 'width 0.5s ease-in-out'
                  }}
                />
              </Box>
              {nextStage && settings.showPercentages && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {conversionRate.toFixed(1)}% → {nextStage.name}
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    );
  };
  
  // Content comparison widget
  const renderComparison = (data: any, settings: any) => {
    if (!data || !data.comparison) return <Typography>No data available</Typography>;
    
    const metrics = settings.metrics || ['views', 'clicks', 'conversions', 'revenue'];
    const metricLabels = {
      'views': 'Views',
      'clicks': 'Clicks',
      'conversions': 'Conversions',
      'revenue': 'Revenue'
    };
    
    // Transform data for the bar chart
    const chartData = metrics.map((metric: string) => {
      const result: any = { name: metricLabels[metric as keyof typeof metricLabels] || metric };
      data.comparison.forEach((item: any) => {
        result[`Content ${item.content_id}`] = item.metrics[metric] || 0;
      });
      return result;
    });
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={80} />
          <RechartsTooltip />
          <Legend />
          {data.comparison.map((item: any, index: number) => (
            <Bar 
              key={`content-${item.content_id}`} 
              dataKey={`Content ${item.content_id}`} 
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };
  
  return (
    <Paper
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: isEditing ? `0 0 0 2px ${theme.palette.primary.main}` : 'none'
      }}
    >
      {/* Widget header */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: isEditing ? alpha(theme.palette.primary.main, 0.05) : 'transparent'
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex' }}>
          {isEditing && (
            <>
              <IconButton size="small" onClick={() => onEdit(id)}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => onDelete(id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
          {isEditing && (
            <Box 
              sx={{ 
                ml: 1,
                cursor: 'move',
                color: theme.palette.text.secondary,
                display: 'flex',
                alignItems: 'center'
              }}
              className="drag-handle"
            >
              <DragIndicatorIcon fontSize="small" />
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Widget content */}
      <Box sx={{ p: 1, flexGrow: 1, overflow: 'hidden' }}>
        {renderWidgetContent()}
      </Box>
    </Paper>
  );
};

// Main Content Analytics Dashboard Component
const ContentAnalyticsDashboard = () => {
  const theme = useTheme();
  
  // Get analytics data
  const { 
    useContentMetrics, 
    useContentPerformance, 
    useTopContent, 
    useContentComparison,
    useContentAttribution,
    useCustomDashboards,
    useContentPredictions
  } = useAnalytics();
  
  // State for dashboard settings
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedDashboard, setSelectedDashboard] = useState<string>('default');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [layouts, setLayouts] = useState<any>(defaultLayouts);
  const [widgets, setWidgets] = useState<any[]>(defaultWidgets);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [addWidgetMenuAnchor, setAddWidgetMenuAnchor] = useState<null | HTMLElement>(null);
  const [widgetData, setWidgetData] = useState<{[key: string]: any}>({});
  
  // Get content performance data
  const {
    data: performanceData,
    isLoading: isLoadingPerformance,
    error: performanceError,
    refetch: refetchPerformance
  } = useContentPerformance(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], 'daily');
  
  // Get top content data
  const {
    data: topContentData,
    isLoading: isLoadingTopContent,
    error: topContentError,
    refetch: refetchTopContent
  } = useTopContent(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], 'views', 5);
  
  // Get content comparison data
  const {
    data: comparisonData,
    isLoading: isLoadingComparison,
    error: comparisonError,
    refetch: refetchComparison
  } = useContentComparison('1,2,3', startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle add widget menu
  const handleAddWidgetClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAddWidgetMenuAnchor(event.currentTarget);
  };
  
  const handleAddWidgetClose = () => {
    setAddWidgetMenuAnchor(null);
  };
  
  const handleAddWidget = (type: string) => {
    const newWidget = {
      i: `widget-${Date.now()}`,
      x: 0,
      y: Infinity,  // Places it at the bottom
      w: 4,
      h: 3,
      widget_type: type,
      title: widgetTypes.find(w => w.id === type)?.name || 'New Widget',
      settings: {},
      static: false
    };
    
    setWidgets([...widgets, newWidget]);
    setAddWidgetMenuAnchor(null);
  };
  
  // Handle layout change
  const handleLayoutChange = (currentLayout: any) => {
    // Update layouts if in edit mode
    if (isEditing) {
      setLayouts({ ...layouts, lg: currentLayout });
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };
  
  // Handle dashboard change
  const handleDashboardChange = (event: SelectChangeEvent) => {
    setSelectedDashboard(event.target.value);
  };
  
  // Handle edit widget
  const handleEditWidget = (id: string) => {
    // TODO: Open widget settings modal
    console.log(`Edit widget ${id}`);
  };
  
  // Handle delete widget
  const handleDeleteWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.i !== id));
  };
  
  // Handle refresh data
  const handleRefreshData = () => {
    refetchPerformance();
    refetchTopContent();
    refetchComparison();
  };
  
  // Handle date change
  const handleDateChange = () => {
    refetchPerformance();
    refetchTopContent();
    refetchComparison();
  };
  
  // Calculate loading and error states
  const isLoading = isLoadingPerformance || isLoadingTopContent || isLoadingComparison;
  const error = performanceError || topContentError || comparisonError;
  
  // Update widget data when API data changes
  useEffect(() => {
    if (performanceData && topContentData && comparisonData) {
      const newWidgetData: {[key: string]: any} = {};
      
      // Summary data
      if (performanceData.summary) {
        newWidgetData['summary-views'] = {
          views: performanceData.summary.total_views || 0,
          previous_views: (performanceData.summary.total_views || 0) * 0.8 // Mock previous data
        };
        
        newWidgetData['summary-engagement'] = {
          engagement_rate: (performanceData.summary.total_likes + performanceData.summary.total_shares + performanceData.summary.total_comments) / 
                           (performanceData.summary.total_views || 1),
          previous_engagement_rate: ((performanceData.summary.total_likes + performanceData.summary.total_shares + performanceData.summary.total_comments) / 
                                    (performanceData.summary.total_views || 1)) * 0.9 // Mock previous data
        };
        
        newWidgetData['summary-conversions'] = {
          conversions: performanceData.summary.total_conversions || 0,
          previous_conversions: (performanceData.summary.total_conversions || 0) * 0.75 // Mock previous data
        };
        
        newWidgetData['summary-revenue'] = {
          revenue: performanceData.summary.total_revenue || 0,
          previous_revenue: (performanceData.summary.total_revenue || 0) * 0.85 // Mock previous data
        };
      }
      
      // Performance trend data
      if (performanceData.time_series) {
        newWidgetData['performance-trend'] = performanceData.time_series;
      }
      
      // Top content data
      if (topContentData) {
        newWidgetData['top-content'] = topContentData;
      }
      
      // Comparison data
      if (comparisonData) {
        newWidgetData['content-comparison'] = comparisonData;
      }
      
      // Conversion funnel data
      newWidgetData['conversion-funnel'] = {
        views: performanceData.summary?.total_views || 0,
        clicks: performanceData.summary?.total_clicks || 0,
        leads: performanceData.summary?.total_unique_visitors || 0,
        conversions: performanceData.summary?.total_conversions || 0
      };
      
      setWidgetData(newWidgetData);
    }
  }, [performanceData, topContentData, comparisonData]);
  
  return (
    <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
      <Box>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Content Analytics Dashboard
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button 
              variant={isEditing ? "contained" : "outlined"}
              onClick={toggleEditMode}
              startIcon={<EditIcon />}
              color={isEditing ? "primary" : "inherit"}
            >
              {isEditing ? "Save Layout" : "Edit Layout"}
            </Button>
            
            {isEditing && (
              <Button
                variant="outlined"
                onClick={handleAddWidgetClick}
                startIcon={<AddIcon />}
              >
                Add Widget
              </Button>
            )}
            
            <Button
              variant="outlined"
              onClick={handleRefreshData}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          </Box>
        </Box>
        
        {/* Dashboard selector and date range */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Dashboard</InputLabel>
                <Select
                  value={selectedDashboard}
                  label="Dashboard"
                  onChange={handleDashboardChange}
                >
                  <MenuItem value="default">Default Dashboard</MenuItem>
                  <MenuItem value="performance">Performance Dashboard</MenuItem>
                  <MenuItem value="conversion">Conversion Dashboard</MenuItem>
                  <MenuItem value="custom">Custom Dashboard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      setStartDate(newValue);
                    }
                  }}
                  sx={{ width: '100%' }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      setEndDate(newValue);
                    }
                  }}
                  sx={{ width: '100%' }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleDateChange}
              >
                Apply
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Loading and error states */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {(error as Error).message || 'An error occurred while fetching data'}
          </Alert>
        )}
        
        {/* Dashboard grid */}
        {!isLoading && !error && (
          <Box sx={{ mb: 3 }}>
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={100}
              onLayoutChange={handleLayoutChange}
              isDraggable={isEditing}
              isResizable={isEditing}
              draggableHandle=".drag-handle"
            >
              {widgets.map((widget) => (
                <div key={widget.i}>
                  <Widget
                    id={widget.i}
                    type={widget.widget_type}
                    title={widget.title}
                    settings={widget.settings}
                    data={widgetData[widget.i] || null}
                    isEditing={isEditing}
                    onEdit={handleEditWidget}
                    onDelete={handleDeleteWidget}
                  />
                </div>
              ))}
            </ResponsiveGridLayout>
          </Box>
        )}
        
        {/* Add widget menu */}
        <Menu
          anchorEl={addWidgetMenuAnchor}
          open={Boolean(addWidgetMenuAnchor)}
          onClose={handleAddWidgetClose}
        >
          {widgetTypes.map((type) => (
            <MenuItem key={type.id} onClick={() => handleAddWidget(type.id)}>
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                {type.icon}
              </Box>
              {type.name}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </ErrorBoundary>
  );
};

export default ContentAnalyticsDashboard;