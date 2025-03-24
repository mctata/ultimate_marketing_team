import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
  Divider,
  Tooltip,
  Slider,
  Stack,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Autorenew as AutorenewIcon,
  InfoOutlined as InfoIcon,
  AttachMoney as AttachMoneyIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { AppDispatch } from '../../store';
import { 
  fetchBudgetRecommendations,
  selectBudgetRecommendation,
  selectBudgetRecommendationsLoading
} from '../../store/slices/predictiveAnalyticsSlice';
import { selectSelectedCampaign } from '../../store/slices/campaignSlice';

// Colors for the charts
const COLORS = {
  current: '#8884d8',
  recommended: '#82ca9d',
  roi: '#ffc658',
  revenue: '#ff8042'
};

const CampaignBudgetOptimization = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  
  const campaign = useSelector(selectSelectedCampaign);
  const budgetRecommendation = useSelector((state) => selectBudgetRecommendation(state, id || ''));
  const loading = useSelector(selectBudgetRecommendationsLoading);
  
  const [customBudget, setCustomBudget] = useState<number | string>('');
  const [sliderValue, setSliderValue] = useState<number>(0);
  
  // Fetch budget recommendations when component mounts
  useEffect(() => {
    if (id) {
      dispatch(fetchBudgetRecommendations(id));
    }
  }, [dispatch, id]);
  
  // When budget recommendation is loaded or campaign changes, update the slider
  useEffect(() => {
    if (budgetRecommendation) {
      // Start with the recommended budget as selected
      setSliderValue(budgetRecommendation.recommended_budget);
      setCustomBudget(budgetRecommendation.recommended_budget);
    } else if (campaign?.budget) {
      // Use current campaign budget if no recommendation is available
      setSliderValue(campaign.budget);
      setCustomBudget(campaign.budget);
    }
  }, [budgetRecommendation, campaign]);
  
  // Generate mock budget recommendation for development
  const getMockBudgetRecommendation = () => {
    const currentBudget = campaign?.budget || 5000;
    const recommendedBudget = currentBudget * 1.15; // 15% increase
    
    return {
      campaign_id: id || '',
      current_budget: currentBudget,
      recommended_budget: recommendedBudget,
      expected_roi_change: 8.5,
      expected_revenue_change: 17.2,
      confidence: 85,
      reasoning: 'Based on historical performance data, increasing your budget by 15% could yield a significant ROI improvement. Current ad spend is performing well, but there appears to be untapped potential in your target audience. The recommended budget adjustment would allow for expanded reach while maintaining efficiency.'
    };
  };
  
  // Use mock data if API data is not available
  const recommendation = budgetRecommendation || getMockBudgetRecommendation();
  
  // Handle slider changes
  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    setSliderValue(value);
    setCustomBudget(value);
  };
  
  // Handle direct input changes
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCustomBudget(value);
    
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setSliderValue(numValue);
    }
  };
  
  // Calculate expected metrics based on custom budget setting
  const calculateExpectedMetrics = (budget: number) => {
    const budgetRatio = budget / recommendation.current_budget;
    
    // Simple linear approximation for small changes, with diminishing returns for larger increases
    let expectedROIChange, expectedRevenueChange;
    
    if (budgetRatio <= 1) {
      // Linear relationship for budget decreases
      expectedROIChange = recommendation.expected_roi_change * budgetRatio;
      expectedRevenueChange = recommendation.expected_revenue_change * budgetRatio;
    } else {
      // Diminishing returns for budget increases
      const diminishingFactor = Math.sqrt(budgetRatio);
      expectedROIChange = recommendation.expected_roi_change * diminishingFactor;
      expectedRevenueChange = recommendation.expected_revenue_change * diminishingFactor;
    }
    
    return {
      roi: expectedROIChange,
      revenue: expectedRevenueChange
    };
  };
  
  const expectedMetrics = customBudget ? calculateExpectedMetrics(Number(customBudget)) : { roi: 0, revenue: 0 };
  
  // Prepare data for the comparison chart
  const getComparisonChartData = () => {
    return [
      {
        name: 'Current',
        budget: recommendation.current_budget,
        roi: 100, // Baseline ROI (100%)
        revenue: campaign?.revenue || recommendation.current_budget * 2.5 // Estimate
      },
      {
        name: 'Recommended',
        budget: recommendation.recommended_budget,
        roi: 100 + recommendation.expected_roi_change,
        revenue: (campaign?.revenue || recommendation.current_budget * 2.5) * (1 + recommendation.expected_revenue_change / 100)
      },
      {
        name: 'Custom',
        budget: Number(customBudget) || recommendation.current_budget,
        roi: 100 + expectedMetrics.roi,
        revenue: (campaign?.revenue || recommendation.current_budget * 2.5) * (1 + expectedMetrics.revenue / 100)
      }
    ];
  };
  
  const comparisonChartData = getComparisonChartData();
  
  // Budget slider configuration
  const getSliderMarks = () => {
    const currentBudget = recommendation.current_budget;
    const maxBudget = Math.max(currentBudget * 2, recommendation.recommended_budget * 1.5);
    
    return [
      {
        value: 0,
        label: '$0'
      },
      {
        value: currentBudget,
        label: `$${currentBudget.toLocaleString()}`
      },
      {
        value: recommendation.recommended_budget,
        label: `$${recommendation.recommended_budget.toLocaleString()}`
      },
      {
        value: maxBudget,
        label: `$${maxBudget.toLocaleString()}`
      }
    ];
  };
  
  // Custom tooltip for the comparison chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      
      return (
        <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
          <Typography variant="subtitle2">{label}</Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" color="textSecondary">
            Budget: <b>${item.budget.toLocaleString()}</b>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            ROI: <b>{item.roi.toFixed(1)}%</b>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Revenue: <b>${item.revenue.toLocaleString()}</b>
          </Typography>
        </Paper>
      );
    }
    
    return null;
  };
  
  // Calculate the percentage change between current and recommended/custom budget
  const getPercentageChange = (newBudget: number) => {
    return ((newBudget - recommendation.current_budget) / recommendation.current_budget) * 100;
  };
  
  const percentChange = getPercentageChange(Number(customBudget) || recommendation.current_budget);
  
  // Format budget value with commas
  const formatBudget = (value: number) => {
    return `$${value.toLocaleString()}`;
  };
  
  // Handle apply button click
  const handleApplyRecommendation = () => {
    // In a real implementation, this would dispatch an action to update the campaign budget
    alert(`Budget updated to $${Number(customBudget).toLocaleString()}`);
  };
  
  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Budget Optimization</Typography>
        <Tooltip title="Budget recommendations are updated daily based on campaign performance">
          <InfoIcon color="action" />
        </Tooltip>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Budget Recommendation
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h5">
                      {formatBudget(recommendation.recommended_budget)}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={`${percentChange > 0 ? '+' : ''}${getPercentageChange(recommendation.recommended_budget).toFixed(1)}%`}
                      color={percentChange > 0 ? 'success' : 'error'}
                      sx={{ ml: 2 }}
                    />
                  </Box>
                  <Typography variant="body2" paragraph>
                    {recommendation.reasoning}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Chip 
                      icon={<TrendingUpIcon />} 
                      label={`ROI: ${recommendation.expected_roi_change > 0 ? '+' : ''}${recommendation.expected_roi_change.toFixed(1)}%`}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip 
                      icon={<TrendingUpIcon />} 
                      label={`Revenue: ${recommendation.expected_revenue_change > 0 ? '+' : ''}${recommendation.expected_revenue_change.toFixed(1)}%`}
                      color="success"
                      variant="outlined"
                    />
                    <Chip 
                      icon={<BarChartIcon />} 
                      label={`Confidence: ${recommendation.confidence}%`}
                      color="info"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
              
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Adjust Campaign Budget
                  </Typography>
                  <Box sx={{ mt: 2, mb: 4 }}>
                    <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
                      <Typography variant="body2" color="textSecondary">Current:</Typography>
                      <Typography variant="body1">${recommendation.current_budget.toLocaleString()}</Typography>
                      <Box sx={{ flexGrow: 1 }} />
                      <TextField
                        label="Custom budget"
                        value={customBudget}
                        onChange={handleInputChange}
                        size="small"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{ width: 150 }}
                      />
                    </Stack>
                    <Slider
                      value={sliderValue}
                      onChange={handleSliderChange}
                      aria-labelledby="budget-slider"
                      step={Math.max(100, Math.round(recommendation.current_budget * 0.02))} // 2% steps or minimum $100
                      marks={getSliderMarks()}
                      min={0}
                      max={Math.max(recommendation.current_budget * 2, recommendation.recommended_budget * 1.5)}
                      valueLabelDisplay="auto"
                      valueLabelFormat={formatBudget}
                    />
                  </Box>
                  
                  <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Projected Performance Impact
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Expected ROI Change
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {expectedMetrics.roi > 0 ? 
                              <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} /> : 
                              <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                            }
                            <Typography variant="body1" color={expectedMetrics.roi > 0 ? 'success.main' : 'error.main'}>
                              {expectedMetrics.roi > 0 ? '+' : ''}{expectedMetrics.roi.toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Expected Revenue Change
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {expectedMetrics.revenue > 0 ? 
                              <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} /> : 
                              <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                            }
                            <Typography variant="body1" color={expectedMetrics.revenue > 0 ? 'success.main' : 'error.main'}>
                              {expectedMetrics.revenue > 0 ? '+' : ''}{expectedMetrics.revenue.toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button 
                      variant="contained"
                      color="primary"
                      onClick={handleApplyRecommendation}
                      disabled={Number(customBudget) === recommendation.current_budget}
                    >
                      Apply Budget Change
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Budget Comparison
                  </Typography>
                  <Box sx={{ height: 250, mb: 3 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={comparisonChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="budget" name="Budget" fill={COLORS.current}>
                          {comparisonChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={
                              index === 0 ? COLORS.current :
                              index === 1 ? COLORS.recommended :
                              '#69b3a2'
                            } />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Projected ROI & Revenue
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={comparisonChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="roi" name="Relative ROI (%)" fill={COLORS.roi} />
                        <Bar yAxisId="right" dataKey="revenue" name="Revenue ($)" fill={COLORS.revenue} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="textSecondary" display="block">
              <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Budget recommendations are based on historical campaign performance, industry benchmarks, and predictive AI models.
              The accuracy of predictions may vary based on data availability and market conditions.
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default CampaignBudgetOptimization;
