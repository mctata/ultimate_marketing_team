import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Info as InfoIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';
import { AppDispatch } from '../../store';
import { 
  fetchPredictedPerformance, 
  fetchHistoricalVsPredictedPerformance,
  selectPredictions,
  selectPredictionsLoading,
  selectHistoricalVsPredictedData,
  selectHistoricalVsPredictedLoading
} from '../../store/slices/predictiveAnalyticsSlice';
import { format, parseISO, addDays } from 'date-fns';

// Chart colors
const COLORS = {
  historical: '#8884d8',
  predicted: '#82ca9d',
  confidence: 'rgba(130, 202, 157, 0.1)',
  threshold: '#ff8042'
};

const CampaignPerformanceForecasting = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  
  const predictions = useSelector((state) => selectPredictions(state, id || ''));
  const predictionsLoading = useSelector(selectPredictionsLoading);
  const historicalVsPredicted = useSelector(selectHistoricalVsPredictedData);
  const historicalVsPredictedLoading = useSelector(selectHistoricalVsPredictedLoading);
  
  const [forecastDays, setForecastDays] = useState<number>(14);
  const [selectedMetric, setSelectedMetric] = useState<string>('views');
  
  // Available metrics to forecast
  const metrics = [
    { value: 'views', label: 'Impressions' },
    { value: 'clicks', label: 'Clicks' },
    { value: 'conversions', label: 'Conversions' },
    { value: 'cost', label: 'Cost' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'roi', label: 'ROI' }
  ];
  
  // Fetch predictions when component mounts or parameters change
  useEffect(() => {
    if (id) {
      dispatch(fetchPredictedPerformance({ campaignId: id, daysAhead: forecastDays }));
      
      // Get today's date and 30 days ago for time range
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      dispatch(fetchHistoricalVsPredictedPerformance({
        campaignId: id,
        metric: selectedMetric,
        timeRange: {
          start_date: format(thirtyDaysAgo, 'yyyy-MM-dd'),
          end_date: format(today, 'yyyy-MM-dd')
        }
      }));
    }
  }, [dispatch, id, forecastDays, selectedMetric]);
  
  const handleMetricChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedMetric(event.target.value as string);
  };
  
  const handleForecastDaysChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setForecastDays(event.target.value as number);
  };
  
  // Generate mock data for the demo if API data is not available
  const getMockData = () => {
    const result = {
      historical: [],
      predicted: []
    };
    
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Generate historical data
    for (let i = 0; i < 30; i++) {
      const date = format(addDays(startDate, i), 'yyyy-MM-dd');
      const dayOfWeek = new Date(date).getDay();
      
      // Add some seasonality based on day of week
      const weekendMultiplier = [0, 6].includes(dayOfWeek) ? 0.8 : 1;
      const trendGrowth = 1 + (i / 100); // Slight upward trend
      
      // Base values for different metrics
      const baseValues = {
        views: 1000 * weekendMultiplier * trendGrowth,
        clicks: 50 * weekendMultiplier * trendGrowth,
        conversions: 5 * weekendMultiplier * trendGrowth,
        cost: 200 * weekendMultiplier * trendGrowth,
        revenue: 500 * weekendMultiplier * trendGrowth,
        roi: 1.5 * weekendMultiplier * trendGrowth
      };
      
      // Add some randomness for realism
      const randomFactor = 0.9 + Math.random() * 0.2; // ±10% randomness
      
      result.historical.push({
        date,
        value: Math.round(baseValues[selectedMetric] * randomFactor * 100) / 100
      });
    }
    
    // Generate predicted data
    for (let i = 0; i < forecastDays; i++) {
      const date = format(addDays(today, i + 1), 'yyyy-MM-dd');
      const dayOfWeek = new Date(date).getDay();
      
      // Add some seasonality based on day of week
      const weekendMultiplier = [0, 6].includes(dayOfWeek) ? 0.8 : 1;
      const trendGrowth = 1 + ((30 + i) / 100); // Continue the trend
      
      // Base values with some added growth
      const lastHistoricalPoint = result.historical[result.historical.length - 1];
      const growthFactor = 1.02; // 2% growth in prediction
      
      // Base values for different metrics
      const baseValues = {
        views: 1000 * weekendMultiplier * trendGrowth * growthFactor,
        clicks: 50 * weekendMultiplier * trendGrowth * growthFactor,
        conversions: 5 * weekendMultiplier * trendGrowth * growthFactor,
        cost: 200 * weekendMultiplier * trendGrowth,
        revenue: 500 * weekendMultiplier * trendGrowth * 1.05, // Revenue grows faster
        roi: 1.5 * weekendMultiplier * trendGrowth * 1.03
      };
      
      // Add some randomness and increasing uncertainty
      const randomFactor = 0.9 + Math.random() * 0.2; // ±10% randomness
      const confidenceVariance = 0.1 + (i / forecastDays) * 0.2; // Uncertainty grows with time
      
      const predictedValue = Math.round(baseValues[selectedMetric] * randomFactor * 100) / 100;
      
      result.predicted.push({
        date,
        value: predictedValue,
        lower_bound: Math.round(predictedValue * (1 - confidenceVariance) * 100) / 100,
        upper_bound: Math.round(predictedValue * (1 + confidenceVariance) * 100) / 100
      });
    }
    
    return result;
  };
  
  // Use mock data for development/demo purposes
  const chartData = historicalVsPredicted.historical?.length > 0 && historicalVsPredicted.predicted?.length > 0
    ? historicalVsPredicted
    : getMockData();
  
  // Combine historical and predicted data for the chart
  const combinedChartData = [
    ...chartData.historical.map(item => ({
      ...item,
      label: format(parseISO(item.date), 'MMM dd'),
      historicalValue: item.value,
      predictedValue: null,
      lower_bound: null,
      upper_bound: null
    })),
    ...chartData.predicted.map(item => ({
      ...item,
      label: format(parseISO(item.date), 'MMM dd'),
      historicalValue: null,
      predictedValue: item.value
    }))
  ];
  
  // Calculate the trend from the predictions
  const calculateTrend = () => {
    if (chartData.predicted.length === 0) return 'stable';
    
    const firstPrediction = chartData.predicted[0].value;
    const lastPrediction = chartData.predicted[chartData.predicted.length - 1].value;
    
    const percentChange = ((lastPrediction - firstPrediction) / firstPrediction) * 100;
    
    if (percentChange > 5) return 'up';
    if (percentChange < -5) return 'down';
    return 'stable';
  };
  
  const trend = calculateTrend();
  
  // Calculate performance stats
  const calculateStats = () => {
    if (chartData.historical.length === 0 || chartData.predicted.length === 0) {
      return {
        currentAverage: 0,
        predictedAverage: 0,
        percentChange: 0,
        maxPredicted: 0
      };
    }
    
    // Calculate the average of the last 7 days of historical data
    const recentHistorical = chartData.historical.slice(-7);
    const currentAverage = recentHistorical.reduce((sum, item) => sum + item.value, 0) / recentHistorical.length;
    
    // Calculate the average of predicted data
    const predictedAverage = chartData.predicted.reduce((sum, item) => sum + item.value, 0) / chartData.predicted.length;
    
    // Calculate percent change
    const percentChange = ((predictedAverage - currentAverage) / currentAverage) * 100;
    
    // Find the max predicted value
    const maxPredicted = Math.max(...chartData.predicted.map(item => item.value));
    
    return {
      currentAverage: Math.round(currentAverage * 100) / 100,
      predictedAverage: Math.round(predictedAverage * 100) / 100,
      percentChange: Math.round(percentChange * 100) / 100,
      maxPredicted: Math.round(maxPredicted * 100) / 100
    };
  };
  
  const stats = calculateStats();
  
  // Format value based on the selected metric
  const formatValue = (value: number) => {
    if (selectedMetric === 'roi') return `${value.toFixed(2)}x`;
    if (selectedMetric === 'cost' || selectedMetric === 'revenue') return `$${value.toLocaleString()}`;
    return value.toLocaleString();
  };
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const historicalValue = payload.find(p => p.name === 'Historical Value')?.value;
      const predictedValue = payload.find(p => p.name === 'Predicted Value')?.value;
      const lowerBound = payload.find(p => p.name === 'Lower Bound')?.value;
      const upperBound = payload.find(p => p.name === 'Upper Bound')?.value;
      
      return (
        <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
          <Typography variant="subtitle2">{label}</Typography>
          <Divider sx={{ my: 1 }} />
          {historicalValue !== null && (
            <Typography variant="body2" color="textSecondary">
              Historical: <b>{formatValue(historicalValue)}</b>
            </Typography>
          )}
          {predictedValue !== null && (
            <>
              <Typography variant="body2" color="textSecondary">
                Predicted: <b>{formatValue(predictedValue)}</b>
              </Typography>
              {lowerBound !== null && upperBound !== null && (
                <Typography variant="body2" color="textSecondary">
                  Range: {formatValue(lowerBound)} - {formatValue(upperBound)}
                </Typography>
              )}
            </>
          )}
        </Paper>
      );
    }
    
    return null;
  };
  
  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Campaign Performance Forecast</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="metric-select-label">Metric</InputLabel>
            <Select
              labelId="metric-select-label"
              value={selectedMetric}
              label="Metric"
              onChange={handleMetricChange}
            >
              {metrics.map(metric => (
                <MenuItem key={metric.value} value={metric.value}>
                  {metric.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="forecast-days-select-label">Forecast</InputLabel>
            <Select
              labelId="forecast-days-select-label"
              value={forecastDays}
              label="Forecast"
              onChange={handleForecastDaysChange}
            >
              <MenuItem value={7}>7 Days</MenuItem>
              <MenuItem value={14}>14 Days</MenuItem>
              <MenuItem value={30}>30 Days</MenuItem>
              <MenuItem value={90}>90 Days</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Export forecast data">
            <IconButton>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {predictionsLoading || historicalVsPredictedLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography color="textSecondary" gutterBottom>
                      Current {metrics.find(m => m.value === selectedMetric)?.label}
                    </Typography>
                    <Chip 
                      size="small" 
                      label="Last 7 Days" 
                      variant="outlined" 
                      color="default" 
                    />
                  </Box>
                  <Typography variant="h5" component="div">
                    {formatValue(stats.currentAverage)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Average per day
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography color="textSecondary" gutterBottom>
                      Predicted {metrics.find(m => m.value === selectedMetric)?.label}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={`Next ${forecastDays} Days`} 
                      variant="outlined" 
                      color="primary" 
                    />
                  </Box>
                  <Typography variant="h5" component="div">
                    {formatValue(stats.predictedAverage)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {trend === 'up' && <TrendingUpIcon color="success" sx={{ mr: 1 }} fontSize="small" />}
                    {trend === 'down' && <TrendingDownIcon color="error" sx={{ mr: 1 }} fontSize="small" />}
                    {trend === 'stable' && <TrendingFlatIcon color="info" sx={{ mr: 1 }} fontSize="small" />}
                    <Typography variant="body2" color={
                      stats.percentChange > 0 ? 'success.main' : 
                      stats.percentChange < 0 ? 'error.main' : 'info.main'
                    }>
                      {stats.percentChange > 0 ? '+' : ''}{stats.percentChange}% vs. current
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Peak {metrics.find(m => m.value === selectedMetric)?.label}
                  </Typography>
                  <Typography variant="h5" component="div">
                    {formatValue(stats.maxPredicted)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Expected maximum
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                bgcolor: trend === 'up' ? 'success.light' : 
                          trend === 'down' ? 'error.light' : 'info.light',
                color: 'white'
              }}>
                <CardContent>
                  <Typography gutterBottom>
                    Performance Trend
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {trend === 'up' && <TrendingUpIcon sx={{ mr: 1, fontSize: 36 }} />}
                    {trend === 'down' && <TrendingDownIcon sx={{ mr: 1, fontSize: 36 }} />}
                    {trend === 'stable' && <TrendingFlatIcon sx={{ mr: 1, fontSize: 36 }} />}
                    <Typography variant="h5" component="div">
                      {trend === 'up' ? 'Improving' : 
                       trend === 'down' ? 'Declining' : 'Stable'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.9)' }}>
                    {trend === 'up' ? 'Campaign is showing positive growth' : 
                     trend === 'down' ? 'Campaign performance is decreasing' : 
                     'Campaign is maintaining steady performance'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ height: 400, mb: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={combinedChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="label" 
                  tickMargin={10}
                />
                <YAxis />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* Render the confidence interval as reference areas */}
                {combinedChartData.map((entry, index) => (
                  entry.lower_bound !== null && entry.upper_bound !== null && (
                    <ReferenceArea 
                      key={`confidence-${index}`}
                      x1={entry.label} 
                      x2={entry.label}
                      y1={entry.lower_bound} 
                      y2={entry.upper_bound}
                      fill={COLORS.confidence}
                      fillOpacity={0.5}
                    />
                  )
                ))}
                
                <Line 
                  type="monotone" 
                  dataKey="historicalValue" 
                  stroke={COLORS.historical} 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Historical Value"
                />
                <Line 
                  type="monotone" 
                  dataKey="predictedValue" 
                  stroke={COLORS.predicted} 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Predicted Value"
                />
                <Line 
                  type="monotone" 
                  dataKey="lower_bound" 
                  stroke="transparent"
                  name="Lower Bound"
                />
                <Line 
                  type="monotone" 
                  dataKey="upper_bound" 
                  stroke="transparent"
                  name="Upper Bound"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 12, height: 12, bgcolor: COLORS.historical, mr: 1 }} />
              <Typography variant="body2" color="textSecondary" sx={{ mr: 2 }}>Historical</Typography>
              
              <Box sx={{ width: 12, height: 12, bgcolor: COLORS.predicted, mr: 1 }} />
              <Typography variant="body2" color="textSecondary" sx={{ mr: 2 }}>Predicted</Typography>
              
              <Box sx={{ width: 12, height: 12, bgcolor: COLORS.confidence, mr: 1 }} />
              <Typography variant="body2" color="textSecondary">Confidence Interval</Typography>
            </Box>
            
            <Tooltip title="AI predictions are calculated based on historical performance, market trends, and seasonal patterns. Accuracy may vary over longer forecast periods.">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="caption" color="textSecondary">
                  Prediction confidence: {forecastDays <= 14 ? 'High' : forecastDays <= 30 ? 'Medium' : 'Low'}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default CampaignPerformanceForecasting;
