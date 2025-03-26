import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  LinearProgress,
  Paper,
  Tooltip,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  InfoOutlined as InfoIcon,
  CalendarToday as CalendarIcon,
  BarChart as BarChartIcon,
  Help as HelpIcon,
  Check as CheckIcon
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
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';
import { useAnalytics } from '../../hooks/useAnalytics';

// Types
interface Prediction {
  content_id: number;
  target_metric: string;
  prediction_date: string;
  predicted_value: number;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  model: {
    id: number;
    name: string;
    model_type: string;
    performance_metrics: Record<string, any>;
  };
}

interface HistoricalDataPoint {
  date: string;
  value: number;
}

interface ContentPredictionsProps {
  contentId: number;
  contentTitle?: string;
  contentType?: string;
  historicalData?: HistoricalDataPoint[];
  availableMetrics?: string[];
  onPredictionGenerated?: (prediction: Prediction) => void;
}

// Helper function to format numbers
const formatNumber = (num: number, metric: string): string => {
  if (metric === 'revenue' || metric === 'roi') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  }
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toFixed(0);
};

// Labels for metrics
const metricLabels: Record<string, string> = {
  'views': 'Views',
  'unique_visitors': 'Unique Visitors',
  'engagement': 'Engagement',
  'clicks': 'Clicks',
  'conversions': 'Conversions',
  'revenue': 'Revenue',
  'roi': 'ROI',
  'shares': 'Shares',
  'comments': 'Comments'
};

// Default available metrics if not provided
const defaultAvailableMetrics = ['views', 'clicks', 'conversions', 'revenue'];

/**
 * Content Predictions Component
 * 
 * Provides predictive analytics for content performance
 */
const ContentPredictions: React.FC<ContentPredictionsProps> = ({
  contentId,
  contentTitle = 'Untitled Content',
  contentType = 'article',
  historicalData = [],
  availableMetrics = defaultAvailableMetrics,
  onPredictionGenerated
}) => {
  const theme = useTheme();
  
  // State for prediction settings
  const [selectedMetric, setSelectedMetric] = useState(availableMetrics[0] || 'views');
  const [predictionHorizon, setPredictionHorizon] = useState(30); // days
  const [isCreatingPrediction, setIsCreatingPrediction] = useState(false);
  
  // Mock data functions
  const isPredictionLoading = false;
  const isCreatingPredictionLoading = false;
  const predictionError = null;
  const createPredictionError = null;
  const prediction = {
    predicted_value: 15000,
    prediction_date: new Date().toISOString(),
    confidence_interval_lower: 12000,
    confidence_interval_upper: 18000,
    model: {
      name: 'Content Performance Model',
      model_type: 'Time Series',
      performance_metrics: { accuracy: 0.86 }
    }
  };
  
  const refetchPrediction = () => {
    console.log('Refetching prediction...');
  };
  
  const createPrediction = async () => {
    console.log('Creating prediction...');
    return prediction;
  };
  
  // Handle metric change
  const handleMetricChange = (event: SelectChangeEvent) => {
    setSelectedMetric(event.target.value);
    refetchPrediction();
  };
  
  // Handle horizon change (days to predict into future)
  const handleHorizonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > 0 && value <= 365) {
      setPredictionHorizon(value);
    }
  };
  
  // Handle generate prediction
  const handleGeneratePrediction = async () => {
    setIsCreatingPrediction(true);
    try {
      // Create sample data object for prediction - in a real app this would be more comprehensive
      const contentData = {
        content_id: contentId,
        content_type: contentType,
        title: contentTitle,
        historical_data: historicalData,
        // Example metadata that might influence predictions
        word_count: 1200,
        has_images: true,
        has_video: false,
        topics: ['marketing', 'analytics', 'content']
      };
      
      const result = await createPrediction({
        content_id: contentId,
        content_data: contentData,
        target_metric: selectedMetric,
        prediction_horizon: predictionHorizon
      });
      
      // Callback with result
      if (onPredictionGenerated) {
        onPredictionGenerated(result);
      }
      
      // Refetch the prediction
      refetchPrediction();
    } catch (error) {
      console.error('Error generating prediction:', error);
    } finally {
      setIsCreatingPrediction(false);
    }
  };
  
  // Combine historical and predicted data for chart
  const getChartData = () => {
    const chartData = [...historicalData.map(point => ({
      date: point.date,
      actual: point.value,
      predicted: null,
      lower: null,
      upper: null
    }))];
    
    // Add prediction if available
    if (prediction) {
      const predictionDate = new Date(prediction.prediction_date);
      const formattedDate = predictionDate.toISOString().split('T')[0];
      
      chartData.push({
        date: formattedDate,
        actual: null,
        predicted: prediction.predicted_value,
        lower: prediction.confidence_interval_lower,
        upper: prediction.confidence_interval_upper
      });
    }
    
    return chartData;
  };
  
  // Determine if we have a prediction or if we're loading
  const hasPrediction = !!prediction;
  const isLoading = isPredictionLoading || isCreatingPredictionLoading;
  const error = predictionError || createPredictionError;
  
  return (
    <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Content Performance Prediction"
        subheader={`Machine learning prediction for "${contentTitle}"`}
        action={
          <Tooltip title="Predictions are based on historical data and content characteristics using machine learning models">
            <IconButton>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        }
      />
      
      <Divider />
      
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Prediction settings */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Metric to Predict</InputLabel>
                <Select
                  value={selectedMetric}
                  label="Metric to Predict"
                  onChange={handleMetricChange}
                  disabled={isLoading}
                >
                  {availableMetrics.map(metric => (
                    <MenuItem key={metric} value={metric}>
                      {metricLabels[metric] || metric}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                label="Prediction Horizon (days)"
                type="number"
                value={predictionHorizon}
                onChange={handleHorizonChange}
                fullWidth
                size="small"
                disabled={isLoading}
                InputProps={{ inputProps: { min: 1, max: 365 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleGeneratePrediction}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={18} /> : <TimelineIcon />}
              >
                {hasPrediction ? 'Regenerate Prediction' : 'Generate Prediction'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Loading state */}
        {isLoading && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {isCreatingPrediction ? 'Creating prediction...' : 'Loading prediction...'}
            </Typography>
          </Box>
        )}
        
        {/* Error state */}
        {error && !isLoading && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {(error as Error).message || 'An error occurred while generating the prediction'}
          </Alert>
        )}
        
        {/* Prediction results */}
        {!isLoading && hasPrediction && (
          <Grid container spacing={3}>
            {/* Prediction summary */}
            <Grid item xs={12} md={5}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="overline" color="text.secondary">
                    Predicted {metricLabels[selectedMetric] || selectedMetric}
                  </Typography>
                  <Typography variant="h3" color="primary.main" sx={{ my: 1 }}>
                    {formatNumber(prediction.predicted_value, selectedMetric)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    by {new Date(prediction.prediction_date).toLocaleDateString()}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Confidence Interval (90%)
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip 
                      label={`Min: ${formatNumber(prediction.confidence_interval_lower, selectedMetric)}`} 
                      size="small" 
                      variant="outlined"
                    />
                    <Chip 
                      label={`Max: ${formatNumber(prediction.confidence_interval_upper, selectedMetric)}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    We expect the actual value to fall within this range with 90% confidence
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Prediction Model
                  </Typography>
                  <Typography variant="body2">
                    {prediction.model.name || 'Performance Prediction Model'} 
                    <Chip 
                      label={prediction.model.model_type} 
                      size="small" 
                      color="primary" 
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CheckIcon color="success" fontSize="small" />
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      {prediction.model.performance_metrics?.accuracy 
                        ? `${(prediction.model.performance_metrics.accuracy * 100).toFixed(1)}% accuracy`
                        : 'Model validated with historical data'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            {/* Prediction chart */}
            <Grid item xs={12} md={7}>
              <Paper
                variant="outlined"
                sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Historical Data & Prediction
                </Typography>
                
                <Box sx={{ flexGrow: 1, minHeight: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={getChartData()}
                      margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip 
                        formatter={(value, name) => {
                          if (value === null) return ['N/A', name];
                          return [formatNumber(Number(value), selectedMetric), 
                            name === 'actual' ? 'Actual' :
                            name === 'predicted' ? 'Predicted' :
                            name === 'lower' ? 'Lower Bound' : 'Upper Bound'];
                        }}
                      />
                      <Legend />
                      <ReferenceLine
                        x={historicalData[historicalData.length - 1]?.date}
                        stroke={theme.palette.divider}
                        strokeDasharray="3 3"
                        label={{ value: 'Today', position: 'top' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="actual"
                        name="Actual"
                        stroke={theme.palette.primary.main}
                        fill={alpha(theme.palette.primary.main, 0.1)}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="predicted"
                        name="Predicted"
                        stroke={theme.palette.secondary.main}
                        fill="transparent"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 6, fill: theme.palette.secondary.main }}
                      />
                      <Area
                        type="monotone"
                        dataKey="upper"
                        name="Upper Bound"
                        stroke="transparent"
                        fill={alpha(theme.palette.secondary.main, 0.1)}
                        fillOpacity={0.5}
                      />
                      <Area
                        type="monotone"
                        dataKey="lower"
                        name="Lower Bound"
                        stroke="transparent"
                        fill={alpha(theme.palette.secondary.main, 0.1)}
                        fillOpacity={0.5}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            
            {/* Recommendations */}
            <Grid item xs={12}>
              <Alert 
                severity="info"
                icon={<TrendingUpIcon />}
                sx={{ '& .MuiAlert-message': { width: '100%' } }}
              >
                <Box>
                  <Typography variant="subtitle2">
                    Recommendations based on prediction:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                    <Typography component="li" variant="body2">
                      Schedule promotional activities for optimal timing based on the prediction curve
                    </Typography>
                    <Typography component="li" variant="body2">
                      Consider A/B testing content variations to improve performance beyond predictions
                    </Typography>
                    <Typography component="li" variant="body2">
                      Set up alerts if actual performance deviates significantly from predictions
                    </Typography>
                  </Box>
                </Box>
              </Alert>
            </Grid>
          </Grid>
        )}
        
        {/* Empty state - no prediction yet */}
        {!isLoading && !hasPrediction && !error && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            py: 4 
          }}>
            <TimelineIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Predictions Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              Generate a prediction to see how your content is likely to perform over the next {predictionHorizon} days.
            </Typography>
            <Button
              variant="contained"
              onClick={handleGeneratePrediction}
              startIcon={<TimelineIcon />}
            >
              Generate Prediction
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentPredictions;