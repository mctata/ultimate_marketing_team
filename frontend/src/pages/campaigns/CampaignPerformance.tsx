import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Divider,
  Button,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { AppDispatch } from '../../store';
import { fetchCampaigns, selectCampaigns, selectCampaignsLoading } from '../../store/slices/campaignSlice';
import CampaignPerformanceForecasting from '../../components/campaigns/CampaignPerformanceForecasting';
import CampaignBudgetOptimization from '../../components/campaigns/CampaignBudgetOptimization';
import CampaignPerformanceAlerts from '../../components/campaigns/CampaignPerformanceAlerts';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const CampaignPerformance = () => {
  const dispatch = useDispatch<AppDispatch>();
  const campaigns = useSelector(selectCampaigns);
  const loading = useSelector(selectCampaignsLoading);
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30days');
  
  useEffect(() => {
    dispatch(fetchCampaigns({}));
  }, [dispatch]);
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };
  
  const handleCampaignChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedCampaign(event.target.value as string);
  };
  
  const handleDateRangeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setDateRange(event.target.value as string);
  };
  
  // Mock data for demonstration
  const generatePerformanceData = () => {
    const data = [];
    const today = new Date();
    const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (days - i - 1));
      
      // Generate random data with some patterns
      const dayOfWeek = date.getDay();
      const weekdayMultiplier = [0, 6].includes(dayOfWeek) ? 0.8 : 1.2; // Lower on weekends
      const randomFactor = 0.85 + Math.random() * 0.3; // Random factor between 0.85 and 1.15
      
      data.push({
        date: date.toISOString().slice(0, 10),
        formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        impressions: Math.round(5000 * weekdayMultiplier * randomFactor),
        clicks: Math.round(250 * weekdayMultiplier * randomFactor),
        conversions: Math.round(25 * weekdayMultiplier * randomFactor),
        cost: Math.round(500 * weekdayMultiplier * randomFactor),
        revenue: Math.round(1500 * weekdayMultiplier * randomFactor * (1 + (i / days) * 0.5)), // Increasing trend
        roas: (1500 * randomFactor * (1 + (i / days) * 0.5)) / (500 * randomFactor)
      });
    }
    
    return data;
  };
  
  const performanceData = generatePerformanceData();
  
  // Calculate aggregated metrics
  const calculateMetrics = () => {
    const total = performanceData.reduce((acc, curr) => ({
      impressions: acc.impressions + curr.impressions,
      clicks: acc.clicks + curr.clicks,
      conversions: acc.conversions + curr.conversions,
      cost: acc.cost + curr.cost,
      revenue: acc.revenue + curr.revenue
    }), {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      cost: 0,
      revenue: 0
    });
    
    return {
      ...total,
      ctr: (total.clicks / total.impressions) * 100,
      cpc: total.cost / total.clicks,
      cpa: total.cost / total.conversions,
      roas: total.revenue / total.cost
    };
  };
  
  const metrics = calculateMetrics();
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Campaign Performance
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Analyse and optimise your marketing campaigns with AI-driven insights
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            label="Campaign"
            value={selectedCampaign}
            onChange={handleCampaignChange}
            sx={{ minWidth: 200 }}
            size="small"
          >
            <MenuItem value="all">All Campaigns</MenuItem>
            {campaigns.map((campaign) => (
              <MenuItem key={campaign.id} value={campaign.id}>
                {campaign.name}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            select
            label="Date Range"
            value={dateRange}
            onChange={handleDateRangeChange}
            sx={{ minWidth: 150 }}
            size="small"
          >
            <MenuItem value="7days">Last 7 Days</MenuItem>
            <MenuItem value="30days">Last 30 Days</MenuItem>
            <MenuItem value="90days">Last 90 Days</MenuItem>
          </TextField>
        </Box>
        
        <Box>
          <Button 
            startIcon={<FilterListIcon />} 
            variant="outlined" 
            sx={{ mr: 1 }}
          >
            Filters
          </Button>
          <Button 
            startIcon={<DownloadIcon />} 
            variant="outlined"
          >
            Export
          </Button>
        </Box>
      </Box>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Impressions
              </Typography>
              <Typography variant="h5">
                {metrics.impressions.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +5.3%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Clicks
              </Typography>
              <Typography variant="h5">
                {metrics.clicks.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  CTR: {metrics.ctr.toFixed(2)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Conversions
              </Typography>
              <Typography variant="h5">
                {metrics.conversions.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  CPA: ${metrics.cpa.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Cost
              </Typography>
              <Typography variant="h5">
                ${metrics.cost.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  CPC: ${metrics.cpc.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Revenue
              </Typography>
              <Typography variant="h5">
                ${metrics.revenue.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +12.7%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                ROAS
              </Typography>
              <Typography variant="h5">
                {metrics.roas.toFixed(2)}x
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +7.1%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Forecasting" />
        <Tab label="Budget Optimisation" />
        <Tab label="Alerts" />
      </Tabs>
      
      {/* Overview Tab */}
      {selectedTab === 0 && (
        <Box>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Performance Over Time
            </Typography>
            <Box sx={{ height: 400, mb: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={performanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="formattedDate" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="clicks" 
                    name="Clicks" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="conversions" 
                    name="Conversions" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Revenue vs. Cost
            </Typography>
            <Box sx={{ height: 400, mb: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="formattedDate" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cost" name="Cost ($)" fill="#8884d8" />
                  <Bar dataKey="revenue" name="Revenue ($)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Campaign Efficiency Metrics
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={performanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="formattedDate" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ctr" name="CTR (%)" stroke="#8884d8" />
                  <Line type="monotone" dataKey="roas" name="ROAS (x)" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Box>
      )}
      
      {/* Forecasting Tab */}
      {selectedTab === 1 && (
        <Box>
          <CampaignPerformanceForecasting />
        </Box>
      )}
      
      {/* Budget Optimization Tab */}
      {selectedTab === 2 && (
        <Box>
          <CampaignBudgetOptimization />
        </Box>
      )}
      
      {/* Alerts Tab */}
      {selectedTab === 3 && (
        <Box>
          <CampaignPerformanceAlerts />
        </Box>
      )}
    </Container>
  );
};

export default CampaignPerformance;
