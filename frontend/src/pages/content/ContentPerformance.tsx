import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  Share,
  Comment,
  Visibility,
  BarChart,
  Lightbulb
} from '@mui/icons-material';
import { AppDispatch } from '../../store';
import {
  fetchContentPerformance,
  fetchDraftById,
  selectContentPerformance,
  selectPerformanceLoading,
  selectSelectedDraft
} from '../../store/slices/contentSlice';
import { ContentPerformance as ContentPerformanceType } from '../../services/contentService';
import { format, subDays } from 'date-fns';
import { LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ContentPerformanceView = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const contentDraft = useSelector(selectSelectedDraft);
  const performanceData = useSelector(selectContentPerformance);
  const loading = useSelector(selectPerformanceLoading);
  
  const [timeRange, setTimeRange] = useState('7days');
  const [tabValue, setTabValue] = useState(0);
  
  useEffect(() => {
    if (id) {
      dispatch(fetchDraftById(id));
      
      // Calculate date range based on selection
      let startDate, endDate;
      const today = new Date();
      endDate = format(today, 'yyyy-MM-dd');
      
      switch (timeRange) {
        case '7days':
          startDate = format(subDays(today, 7), 'yyyy-MM-dd');
          break;
        case '30days':
          startDate = format(subDays(today, 30), 'yyyy-MM-dd');
          break;
        case '90days':
          startDate = format(subDays(today, 90), 'yyyy-MM-dd');
          break;
        default:
          startDate = format(subDays(today, 7), 'yyyy-MM-dd');
      }
      
      dispatch(fetchContentPerformance({
        contentId: id,
        timeRange: {
          start_date: startDate,
          end_date: endDate
        }
      }));
    }
  }, [dispatch, id, timeRange]);
  
  const handleTimeRangeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTimeRange(event.target.value as string);
  };
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Calculate total metrics
  const calculateTotals = () => {
    if (!performanceData.length) return {
      views: 0,
      clicks: 0,
      shares: 0,
      comments: 0,
      engagement_rate: 0
    };
    
    const totals = performanceData.reduce((acc, curr) => {
      return {
        views: acc.views + curr.views,
        clicks: acc.clicks + curr.clicks,
        shares: acc.shares + curr.shares,
        comments: acc.comments + curr.comments,
        engagement_rate: acc.engagement_rate + curr.engagement_rate
      };
    }, {
      views: 0,
      clicks: 0,
      shares: 0,
      comments: 0,
      engagement_rate: 0
    });
    
    // Calculate average engagement rate
    totals.engagement_rate = performanceData.length 
      ? totals.engagement_rate / performanceData.length 
      : 0;
    
    return totals;
  };
  
  const totals = calculateTotals();
  
  // Format data for charts
  const getChartData = () => {
    return performanceData.map(item => ({
      date: format(new Date(item.date), 'MMM dd'),
      views: item.views,
      clicks: item.clicks,
      shares: item.shares,
      comments: item.comments,
      engagement_rate: item.engagement_rate * 100 // Convert to percentage
    }));
  };
  
  const chartData = getChartData();
  
  // Extract platform data if available
  const getPlatformData = () => {
    const platforms: Record<string, number> = {};
    
    performanceData.forEach(item => {
      if (item.platform_data) {
        Object.entries(item.platform_data).forEach(([platform, metrics]) => {
          if (typeof metrics === 'object' && metrics.views) {
            platforms[platform] = (platforms[platform] || 0) + metrics.views;
          }
        });
      }
    });
    
    return Object.entries(platforms).map(([name, value]) => ({
      name,
      value
    }));
  };
  
  const platformData = getPlatformData();
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/content')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1">Content Performance</Typography>
          {contentDraft && (
            <Typography variant="subtitle1" color="text.secondary">
              {contentDraft.title}
            </Typography>
          )}
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel id="time-range-select-label">Time Range</InputLabel>
              <Select
                labelId="time-range-select-label"
                value={timeRange}
                label="Time Range"
                onChange={handleTimeRangeChange}
              >
                <MenuItem value="7days">Last 7 Days</MenuItem>
                <MenuItem value="30days">Last 30 Days</MenuItem>
                <MenuItem value="90days">Last 90 Days</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Visibility color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      Views
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div">
                    {totals.views.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUp color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      Clicks
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div">
                    {totals.clicks.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Share color="info" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      Shares
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div">
                    {totals.shares.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Comment color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      Comments
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div">
                    {totals.comments.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Charts */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab icon={<BarChart />} label="Engagement" />
              <Tab icon={<TrendingUp />} label="Trends" />
              <Tab icon={<Lightbulb />} label="Insights" />
            </Tabs>
            
            {tabValue === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Engagement Metrics
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={chartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="views" fill="#8884d8" name="Views" />
                      <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
                      <Bar dataKey="shares" fill="#ffc658" name="Shares" />
                      <Bar dataKey="comments" fill="#ff8042" name="Comments" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            )}
            
            {tabValue === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Performance Trends
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="engagement_rate" stroke="#8884d8" name="Engagement Rate (%)" />
                      <Line type="monotone" dataKey="clicks" stroke="#82ca9d" name="Clicks" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            )}
            
            {tabValue === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Performance Insights
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Key Metrics Summary
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body1" paragraph>
                          Engagement rate: <strong>{(totals.engagement_rate * 100).toFixed(1)}%</strong>
                        </Typography>
                        <Typography variant="body1" paragraph>
                          Click-through rate: <strong>{totals.views > 0 ? ((totals.clicks / totals.views) * 100).toFixed(1) : 0}%</strong>
                        </Typography>
                        <Typography variant="body1" paragraph>
                          Average shares per day: <strong>{(totals.shares / performanceData.length).toFixed(1)}</strong>
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Recommendations
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body1" paragraph>
                          • Post similar content on {platformData[0]?.name || 'social platforms'} for higher engagement
                        </Typography>
                        <Typography variant="body1" paragraph>
                          • Consider A/B testing variations of this content
                        </Typography>
                        <Typography variant="body1" paragraph>
                          • Optimize posting time based on engagement patterns
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default ContentPerformanceView;