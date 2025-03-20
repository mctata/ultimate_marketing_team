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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Button
} from '@mui/material';
import {
  ArrowBack,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { AppDispatch } from '../../store';
import {
  fetchCampaignById,
  fetchCampaignMetrics,
  selectSelectedCampaign,
  selectCampaignMetrics,
  selectCampaignsLoading
} from '../../store/slices/campaignSlice';
import { format, subDays, parseISO } from 'date-fns';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CampaignMetrics = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const campaign = useSelector(selectSelectedCampaign);
  const metrics = useSelector(selectCampaignMetrics);
  const loading = useSelector(selectCampaignsLoading);
  
  const [timeRange, setTimeRange] = useState('7days');
  const [activeTab, setActiveTab] = useState(0);
  
  useEffect(() => {
    if (id) {
      dispatch(fetchCampaignById(id));
      
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
      
      dispatch(fetchCampaignMetrics({
        campaignId: id,
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
    setActiveTab(newValue);
  };
  
  // Mock data for demo purposes
  const generateMockMetrics = () => {
    const result = [];
    const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    
    const baseViews = 500;
    const baseClicks = 25;
    const baseConversions = 2;
    
    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), days - i - 1), 'yyyy-MM-dd');
      
      // Add some randomness to the data
      const dayVariance = Math.sin(i * 0.5) * 0.3 + 1; // Creates a wave pattern
      const weekdayBoost = [1, 2, 3, 4, 5].includes(parseISO(date).getDay()) ? 1.2 : 0.8; // Weekdays get a boost
      
      const views = Math.floor(baseViews * dayVariance * weekdayBoost);
      const clicks = Math.floor(baseClicks * dayVariance * weekdayBoost);
      const conversions = Math.floor(baseConversions * dayVariance * weekdayBoost);
      const cost = Math.floor((baseViews / 1000) * 2 * dayVariance); // $2 CPM
      const revenue = conversions * 25 * dayVariance; // $25 per conversion
      
      result.push({
        date,
        views,
        clicks,
        conversions,
        cost,
        revenue,
        ctr: (clicks / views) * 100,
        cpc: cost / clicks,
        roi: (revenue / cost) - 1
      });
    }
    
    return result;
  };
  
  const mockMetrics = generateMockMetrics();
  
  // Format data for charts
  const getChartData = () => {
    // Use mock data for now
    return mockMetrics.map(item => ({
      date: format(parseISO(item.date), 'MMM dd'),
      views: item.views,
      clicks: item.clicks,
      conversions: item.conversions,
      cost: item.cost,
      revenue: item.revenue,
      ctr: parseFloat(item.ctr.toFixed(2)),
      cpc: parseFloat(item.cpc.toFixed(2)),
      roi: parseFloat((item.roi * 100).toFixed(2)) // Convert to percentage
    }));
  };
  
  const chartData = getChartData();
  
  // Calculate totals and averages
  const calculateMetrics = () => {
    const totals = mockMetrics.reduce((acc, curr) => ({
      views: acc.views + curr.views,
      clicks: acc.clicks + curr.clicks,
      conversions: acc.conversions + curr.conversions,
      cost: acc.cost + curr.cost,
      revenue: acc.revenue + curr.revenue
    }), {
      views: 0,
      clicks: 0,
      conversions: 0,
      cost: 0,
      revenue: 0
    });
    
    const days = mockMetrics.length;
    
    return {
      ...totals,
      ctr: totals.views > 0 ? (totals.clicks / totals.views) * 100 : 0,
      cpc: totals.clicks > 0 ? totals.cost / totals.clicks : 0,
      cpm: totals.views > 0 ? (totals.cost / totals.views) * 1000 : 0,
      roi: totals.cost > 0 ? ((totals.revenue / totals.cost) - 1) * 100 : 0,
      daily_average: {
        views: totals.views / days,
        clicks: totals.clicks / days,
        conversions: totals.conversions / days,
        cost: totals.cost / days,
        revenue: totals.revenue / days
      }
    };
  };
  
  const calculatedMetrics = calculateMetrics();
  
  // Platform breakdown data (mock)
  const platformData = [
    { name: 'Facebook', value: 35 },
    { name: 'Instagram', value: 25 },
    { name: 'Google', value: 20 },
    { name: 'LinkedIn', value: 10 },
    { name: 'Twitter', value: 10 }
  ];
  
  // Demographics data (mock)
  const demographicsData = [
    { name: '18-24', male: 15, female: 20 },
    { name: '25-34', male: 30, female: 35 },
    { name: '35-44', male: 25, female: 20 },
    { name: '45-54', male: 15, female: 10 },
    { name: '55+', male: 15, female: 15 }
  ];
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(`/campaigns/${id}`)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1">Campaign Metrics</Typography>
          {campaign && (
            <Typography variant="subtitle1" color="text.secondary">
              {campaign.name}
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
            
            <Button 
              variant="outlined" 
              startIcon={<FileDownloadIcon />}
            >
              Export Report
            </Button>
          </Box>
          
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Impressions
                  </Typography>
                  <Typography variant="h4">
                    {calculatedMetrics.views.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg. {Math.round(calculatedMetrics.daily_average.views).toLocaleString()} per day
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Clicks
                  </Typography>
                  <Typography variant="h4">
                    {calculatedMetrics.clicks.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    CTR: {calculatedMetrics.ctr.toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Spend
                  </Typography>
                  <Typography variant="h4">
                    ${calculatedMetrics.cost.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    CPC: ${calculatedMetrics.cpc.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    ROI
                  </Typography>
                  <Typography variant="h4">
                    {calculatedMetrics.roi.toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Revenue: ${calculatedMetrics.revenue.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Chart Section */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab label="Performance" />
              <Tab label="Audience" />
              <Tab label="Platforms" />
              <Tab label="Content" />
            </Tabs>
            
            {/* Performance Tab */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Campaign Performance Over Time
                </Typography>
                <Box sx={{ height: 400, mb: 4 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#8884d8" activeDot={{ r: 8 }} name="Clicks" />
                      <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#82ca9d" name="Conversions" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  Daily Cost and Revenue
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cost" fill="#8884d8" name="Cost ($)" />
                      <Bar dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            )}
            
            {/* Audience Tab */}
            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Audience Demographics
                </Typography>
                <Box sx={{ height: 400, mb: 4 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={demographicsData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="male" fill="#8884d8" name="Male" />
                      <Bar dataKey="female" fill="#82ca9d" name="Female" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  Engagement by Audience Segment
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: '18-24', ctr: 3.2, conversion_rate: 1.1 },
                        { name: '25-34', ctr: 4.5, conversion_rate: 1.8 },
                        { name: '35-44', ctr: 3.8, conversion_rate: 1.5 },
                        { name: '45-54', ctr: 2.9, conversion_rate: 1.2 },
                        { name: '55+', ctr: 2.1, conversion_rate: 0.8 }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ctr" fill="#8884d8" name="CTR (%)" />
                      <Bar dataKey="conversion_rate" fill="#82ca9d" name="Conversion Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            )}
            
            {/* Platforms Tab */}
            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Performance by Platform
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={platformData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={150}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {platformData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Facebook', ctr: 2.7, cpc: 1.25, conversion_rate: 1.2 },
                            { name: 'Instagram', ctr: 3.5, cpc: 1.45, conversion_rate: 1.4 },
                            { name: 'Google', ctr: 2.2, cpc: 1.05, conversion_rate: 0.8 },
                            { name: 'LinkedIn', ctr: 1.5, cpc: 2.25, conversion_rate: 0.7 },
                            { name: 'Twitter', ctr: 1.8, cpc: 1.35, conversion_rate: 0.5 }
                          ]}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="ctr" fill="#8884d8" name="CTR (%)" />
                          <Bar dataKey="conversion_rate" fill="#82ca9d" name="Conversion Rate (%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Content Tab */}
            {activeTab === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Top Performing Content
                </Typography>
                <Grid container spacing={3}>
                  {[1, 2, 3, 4].map((index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Content {index}: Sample Title {index}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="body1" fontWeight="bold">
                                {(Math.random() * 5 + 1).toFixed(1)}%
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                CTR
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="body1" fontWeight="bold">
                                ${(Math.random() * 2 + 0.5).toFixed(2)}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                CPC
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="body1" fontWeight="bold">
                                {(Math.random() * 2 + 0.5).toFixed(1)}%
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Conv. Rate
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => navigate(`/content/${index}`)}
                            >
                              View Content
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                  Content Performance Comparison
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Content 1', views: 12000, clicks: 600, conversions: 60 },
                        { name: 'Content 2', views: 9000, clicks: 450, conversions: 45 },
                        { name: 'Content 3', views: 15000, clicks: 675, conversions: 54 },
                        { name: 'Content 4', views: 7500, clicks: 300, conversions: 23 }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="views" fill="#8884d8" name="Views" />
                      <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
                      <Bar dataKey="conversions" fill="#ffc658" name="Conversions" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            )}
          </Paper>
          
          {/* Recommendations */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Campaign Insights
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Performance Summary
                    </Typography>
                    <Typography variant="body2" paragraph>
                      This campaign is performing {calculatedMetrics.roi > 50 ? 'above' : 'below'} average with an ROI of {calculatedMetrics.roi.toFixed(2)}%.
                    </Typography>
                    <Typography variant="body2">
                      Key metrics:
                    </Typography>
                    <ul>
                      <li>
                        <Typography variant="body2">
                          Click-through rate: <strong>{calculatedMetrics.ctr.toFixed(2)}%</strong>
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2">
                          Cost per click: <strong>${calculatedMetrics.cpc.toFixed(2)}</strong>
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2">
                          Cost per thousand impressions: <strong>${calculatedMetrics.cpm.toFixed(2)}</strong>
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2">
                          Conversion rate: <strong>{(calculatedMetrics.conversions / calculatedMetrics.clicks * 100).toFixed(2)}%</strong>
                        </Typography>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Recommendations
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Based on campaign performance, consider the following adjustments:
                    </Typography>
                    <ul>
                      <li>
                        <Typography variant="body2" paragraph>
                          <strong>Audience Targeting:</strong> Focus more budget on the 25-34 age group which has the highest conversion rate.
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2" paragraph>
                          <strong>Platform Optimization:</strong> Increase spend on Instagram which is delivering the best ROI.
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2" paragraph>
                          <strong>Content Strategy:</strong> Content #3 is performing best - create more similar content.
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2">
                          <strong>Budget Allocation:</strong> Consider {calculatedMetrics.roi > 50 ? 'increasing' : 'decreasing'} daily budget by 15% to {calculatedMetrics.roi > 50 ? 'capitalize on' : 'minimize impact of'} current performance.
                        </Typography>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default CampaignMetrics;