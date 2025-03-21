import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  CardHeader,
  Button,
  Divider,
  Tab,
  Tabs,
  Alert,
  LinearProgress,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  useTheme
} from '@mui/material';
import { 
  BarChart, 
  LineChart, 
  PieChart,
  Bar, 
  Line, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  fetchDailyCosts,
  fetchProviderCosts,
  fetchModelCosts,
  fetchBudgetStatus,
  fetchCacheMetrics,
  fetchErrorRates,
  fetchAgentUsage
} from '../../store/slices/analyticsSlice';
import { RootState } from '../../store';

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

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#48C9B0'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`api-metrics-tabpanel-${index}`}
      aria-labelledby={`api-metrics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const ApiMetrics = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { aiMetrics } = useSelector((state: RootState) => state.analytics);
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  
  // Load data on mount and when filters change
  useEffect(() => {
    loadData();
  }, [dispatch, startDate, endDate, selectedProvider]);
  
  const loadData = () => {
    const dateParams = { startDate, endDate };
    dispatch(fetchDailyCosts({ ...dateParams, provider: selectedProvider || undefined }));
    dispatch(fetchProviderCosts(dateParams));
    dispatch(fetchModelCosts({ ...dateParams, provider: selectedProvider || undefined }));
    dispatch(fetchBudgetStatus());
    dispatch(fetchCacheMetrics(dateParams));
    dispatch(fetchErrorRates(dateParams));
    dispatch(fetchAgentUsage(dateParams));
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleRefresh = () => {
    loadData();
  };

  // Transform daily cost data for charting
  const dailyCostChartData = aiMetrics.dailyCosts.reduce((acc: any[], cost) => {
    // Check if we already have an entry for this date
    const existingEntry = acc.find(entry => entry.date === cost.date);
    
    if (existingEntry) {
      // Add cost to existing date entry
      existingEntry[cost.provider] = (existingEntry[cost.provider] || 0) + cost.cost_usd;
    } else {
      // Create new date entry
      const newEntry = { 
        date: cost.date,
        [cost.provider]: cost.cost_usd
      };
      acc.push(newEntry);
    }
    
    return acc;
  }, []);
  
  // Sort daily costs by date
  dailyCostChartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Extract providers for chart legend
  const providers = Object.keys(aiMetrics.providerCosts || {});
  
  // Prepare model costs for chart
  const modelCostChartData = aiMetrics.modelCosts.map(model => ({
    name: `${model.provider}: ${model.model}`,
    cost: model.cost_usd,
    tokens: model.tokens,
    provider: model.provider
  }));
  
  // Prepare cache metrics data for pie chart
  const cacheChartData = aiMetrics.cacheMetrics.total_requests ? [
    { name: 'Cached Requests', value: aiMetrics.cacheMetrics.cached_requests },
    { name: 'API Requests', value: aiMetrics.cacheMetrics.total_requests - aiMetrics.cacheMetrics.cached_requests }
  ] : [];
  
  // Prepare agent usage data for chart
  const agentUsageChartData = aiMetrics.agentUsage.map(agent => ({
    name: agent.agent_type,
    tokens: agent.total_tokens,
    cost: agent.cost_usd,
    requests: agent.request_count
  }));
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          AI API Usage Metrics
        </Typography>
        
        <Button variant="contained" onClick={handleRefresh}>
          Refresh Data
        </Button>
      </Box>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Provider</InputLabel>
              <Select
                value={selectedProvider}
                label="Provider"
                onChange={(e) => setSelectedProvider(e.target.value)}
              >
                <MenuItem value="">All Providers</MenuItem>
                {providers.map(provider => (
                  <MenuItem key={provider} value={provider}>{provider}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button variant="outlined" fullWidth onClick={loadData}>
              Apply Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {aiMetrics.isLoading && <LinearProgress sx={{ mb: 2 }} />}
      
      {aiMetrics.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {aiMetrics.error}
        </Alert>
      )}
      
      {/* Budget Status Cards */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Budget Status
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(aiMetrics.budgetStatus).map(([provider, budget]) => (
            <Grid item xs={12} md={6} key={provider}>
              <Card>
                <CardHeader 
                  title={`${provider.charAt(0).toUpperCase() + provider.slice(1)} Budget`}
                  subheader={`Monthly Budget: ${formatCurrency(budget.monthly_budget)}`}
                />
                <CardContent>
                  <Typography variant="h4" color="text.secondary" gutterBottom>
                    {formatCurrency(budget.current_spend)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {budget.budget_percent.toFixed(1)}% of monthly budget used
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(budget.budget_percent, 100)}
                    color={
                      budget.warning_level === 'high' ? 'error' :
                      budget.warning_level === 'medium' ? 'warning' : 'success'
                    }
                    sx={{ height: 10, borderRadius: 5, mb: 2 }}
                  />
                  <Typography 
                    variant="body2" 
                    color={budget.projected_percent > 100 ? 'error' : 'text.secondary'}
                  >
                    Projected End of Month: {formatCurrency(budget.projected_month_end)}
                    {budget.projected_percent > 100 && (
                      <span> ({formatCurrency(budget.estimated_overage)} over budget)</span>
                    )}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      {/* Tabs for different metric views */}
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Cost Overview" />
          <Tab label="Model Usage" />
          <Tab label="Cache Performance" />
          <Tab label="Error Rates" />
          <Tab label="Agent Usage" />
        </Tabs>
        
        {/* Cost Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>Daily Cost Trend</Typography>
          <Box sx={{ height: 400, mb: 4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyCostChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                {providers.map((provider, index) => (
                  <Line
                    key={provider}
                    type="monotone"
                    dataKey={provider}
                    stroke={COLORS[index % COLORS.length]}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
          
          <Typography variant="h6" gutterBottom>Provider Cost Distribution</Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  dataKey="value"
                  nameKey="name"
                  data={Object.entries(aiMetrics.providerCosts).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {Object.keys(aiMetrics.providerCosts).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </TabPanel>
        
        {/* Model Usage Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Cost by Model</Typography>
          <Box sx={{ height: 400, mb: 4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelCostChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  dataKey="tokens" 
                  tickFormatter={formatNumber}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'cost' ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                    name === 'cost' ? 'Cost' : 'Tokens'
                  ]}
                />
                <Legend />
                <Bar 
                  yAxisId="left" 
                  dataKey="cost" 
                  name="Cost" 
                  fill="#8884d8"
                >
                  {modelCostChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[
                        providers.indexOf(entry.provider) % COLORS.length
                      ]} 
                    />
                  ))}
                </Bar>
                <Bar 
                  yAxisId="right" 
                  dataKey="tokens" 
                  name="Tokens" 
                  fill="#82ca9d" 
                  opacity={0.7}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          
          <Typography variant="h6" gutterBottom>Model Details</Typography>
          <Grid container spacing={2}>
            {aiMetrics.modelCosts.map(model => (
              <Grid item xs={12} md={6} lg={4} key={`${model.provider}-${model.model}`}>
                <Card>
                  <CardHeader
                    title={model.model}
                    subheader={model.provider}
                  />
                  <CardContent>
                    <Typography variant="body1" color="text.primary">
                      Cost: {formatCurrency(model.cost_usd)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tokens: {formatNumber(model.tokens)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cost per 1K tokens: {formatCurrency(model.cost_per_1k_tokens)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Requests: {model.requests} ({model.cached_requests} cached)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cache Hit Rate: {formatPercentage(model.cache_hit_ratio)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
        
        {/* Cache Performance Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Cache Metrics" />
                <CardContent>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {formatPercentage(aiMetrics.cacheMetrics.cache_hit_ratio)}
                  </Typography>
                  <Typography variant="body1">
                    Cache Hit Ratio
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Estimated Savings: {formatCurrency(aiMetrics.cacheMetrics.estimated_savings)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Requests: {aiMetrics.cacheMetrics.total_requests}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cached Requests: {aiMetrics.cacheMetrics.cached_requests}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cacheChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      <Cell fill={theme.palette.primary.main} />
                      <Cell fill={theme.palette.grey[400]} />
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Error Rates Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>API Error Rates by Provider</Typography>
          <Grid container spacing={3}>
            {Object.entries(aiMetrics.errorRates).map(([provider, data]) => (
              <Grid item xs={12} md={6} key={provider}>
                <Card>
                  <CardHeader 
                    title={`${provider.charAt(0).toUpperCase() + provider.slice(1)} Errors`}
                    subheader={`Total Requests: ${data.total_requests}`}
                  />
                  <CardContent>
                    <Typography variant="h4" color={data.error_rate > 0.05 ? 'error' : 'text.secondary'} gutterBottom>
                      {formatPercentage(data.error_rate)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Failed Requests: {data.failed_requests}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(data.error_rate * 100 * 10, 100)} // Scale for better visibility
                      color={data.error_rate > 0.05 ? 'error' : 'success'}
                      sx={{ height: 10, borderRadius: 5, mt: 2 }}
                    />
                    {data.error_rate > 0.05 && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        Error rate exceeds recommended threshold (5%)
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
        
        {/* Agent Usage Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>Agent Usage</Typography>
          <Box sx={{ height: 400, mb: 4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentUsageChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  dataKey="tokens" 
                  tickFormatter={formatNumber}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'cost' ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                    name === 'cost' ? 'Cost' : name === 'tokens' ? 'Tokens' : 'Requests'
                  ]}
                />
                <Legend />
                <Bar 
                  yAxisId="left" 
                  dataKey="cost" 
                  name="Cost" 
                  fill="#8884d8"
                />
                <Bar 
                  yAxisId="right" 
                  dataKey="tokens" 
                  name="Tokens" 
                  fill="#82ca9d" 
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          
          <Typography variant="h6" gutterBottom>Agent Details</Typography>
          <Grid container spacing={2}>
            {aiMetrics.agentUsage.map((agent, index) => (
              <Grid item xs={12} md={6} lg={4} key={agent.agent_type}>
                <Card>
                  <CardHeader
                    title={agent.agent_type}
                    subheader={`${agent.request_count} Requests`}
                  />
                  <CardContent>
                    <Typography variant="body1" color="text.primary">
                      Cost: {formatCurrency(agent.cost_usd)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Tokens: {formatNumber(agent.total_tokens)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg. Tokens per Request: {agent.avg_tokens_per_request.toFixed(0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ApiMetrics;