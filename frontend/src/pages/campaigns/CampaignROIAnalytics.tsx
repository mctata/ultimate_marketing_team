import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis,
} from 'recharts';

// Mock data for ROI analytics
const mockCampaignData = [
  { month: 'Jan', spend: 3500, revenue: 9800, roi: 180 },
  { month: 'Feb', spend: 4200, revenue: 14100, roi: 235 },
  { month: 'Mar', spend: 3800, revenue: 12400, roi: 226 },
  { month: 'Apr', spend: 5100, revenue: 18300, roi: 259 },
  { month: 'May', spend: 4700, revenue: 15200, roi: 223 },
  { month: 'Jun', spend: 5300, revenue: 19800, roi: 273 },
];

// Mock data for channel comparison
const channelData = [
  { name: 'Facebook Ads', spend: 8200, revenue: 24500, roi: 198.8, cpa: 25.10 },
  { name: 'Google Ads', spend: 9300, revenue: 32800, roi: 252.7, cpa: 18.45 },
  { name: 'Instagram', spend: 6100, revenue: 18700, roi: 206.6, cpa: 21.90 },
  { name: 'LinkedIn', spend: 4200, revenue: 16800, roi: 300.0, cpa: 28.75 },
  { name: 'Email', spend: 2100, revenue: 11200, roi: 433.3, cpa: 15.30 },
];

// Mock data for conversion paths
const conversionPathData = [
  { name: 'Facebook → Website → Purchase', value: 420, avgValue: 68, percentage: 25.3 },
  { name: 'Google → Website → Cart → Purchase', value: 380, avgValue: 72, percentage: 22.9 },
  { name: 'Email → Website → Purchase', value: 290, avgValue: 75, percentage: 17.5 },
  { name: 'Instagram → Website → Cart → Abandon → Email → Purchase', value: 210, avgValue: 58, percentage: 12.6 },
  { name: 'Direct → Website → Purchase', value: 360, avgValue: 63, percentage: 21.7 },
];

// Mock data for attribution models comparison
const attributionData = {
  'First Touch': [
    { channel: 'Facebook', value: 36 },
    { channel: 'Google', value: 28 },
    { channel: 'Email', value: 12 },
    { channel: 'Instagram', value: 15 },
    { channel: 'Direct', value: 9 },
  ],
  'Last Touch': [
    { channel: 'Facebook', value: 22 },
    { channel: 'Google', value: 31 },
    { channel: 'Email', value: 24 },
    { channel: 'Instagram', value: 12 },
    { channel: 'Direct', value: 11 },
  ],
  'Linear': [
    { channel: 'Facebook', value: 28 },
    { channel: 'Google', value: 30 },
    { channel: 'Email', value: 19 },
    { channel: 'Instagram', value: 14 },
    { channel: 'Direct', value: 9 },
  ],
  'Position Based': [
    { channel: 'Facebook', value: 31 },
    { channel: 'Google', value: 29 },
    { channel: 'Email', value: 17 },
    { channel: 'Instagram', value: 13 },
    { channel: 'Direct', value: 10 },
  ],
};

// ROAS optimization recommendations
const roasRecommendations = [
  { 
    channel: 'Facebook Ads', 
    currentBudget: 8200, 
    recommendedBudget: 9500, 
    projected_roi: 215.4,
    improvement: '+8.4%',
    action: 'Increase budget for high-performing ad sets targeting 25-34 demographic'
  },
  { 
    channel: 'Google Ads', 
    currentBudget: 9300, 
    recommendedBudget: 10800, 
    projected_roi: 271.2,
    improvement: '+7.3%',
    action: 'Increase keyword bids for converting search terms; add negative keywords for non-performing terms'
  },
  { 
    channel: 'Instagram', 
    currentBudget: 6100, 
    recommendedBudget: 5500, 
    projected_roi: 223.7,
    improvement: '+8.3%',
    action: 'Reallocate budget from poorly performing stories ads to carousel posts'
  },
  { 
    channel: 'LinkedIn', 
    currentBudget: 4200, 
    recommendedBudget: 5000, 
    projected_roi: 312.6,
    improvement: '+4.2%',
    action: 'Increase sponsored content focusing on decision-makers; reduce right rail ads'
  },
  { 
    channel: 'Email', 
    currentBudget: 2100, 
    recommendedBudget: 2500, 
    projected_roi: 446.8,
    improvement: '+3.1%',
    action: 'Expand automation sequences for cart abandonment; increase frequency for active subscribers'
  },
];

// Multi-touch attribution scatter plot data
const touchpointData = [
  { x: 1, y: 120, z: 18, name: 'Facebook 1st' },
  { x: 1, y: 90, z: 12, name: 'Google 1st' },
  { x: 1, y: 40, z: 5, name: 'Email 1st' },
  { x: 2, y: 150, z: 21, name: 'Facebook 2nd' },
  { x: 2, y: 180, z: 24, name: 'Google 2nd' },
  { x: 2, y: 90, z: 14, name: 'Email 2nd' },
  { x: 3, y: 60, z: 10, name: 'Facebook 3rd' },
  { x: 3, y: 150, z: 19, name: 'Google 3rd' },
  { x: 3, y: 130, z: 17, name: 'Email 3rd' },
  { x: 4, y: 40, z: 7, name: 'Facebook 4th' },
  { x: 4, y: 160, z: 22, name: 'Google 4th' },
  { x: 4, y: 110, z: 15, name: 'Email 4th' },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`roi-analytics-tabpanel-${index}`}
      aria-labelledby={`roi-analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `roi-analytics-tab-${index}`,
    'aria-controls': `roi-analytics-tabpanel-${index}`,
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const CampaignROIAnalytics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState('last30days');
  const [attributionModel, setAttributionModel] = useState('Last Touch');
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDateRangeChange = (event: SelectChangeEvent) => {
    setDateRange(event.target.value);
  };

  const handleAttributionModelChange = (
    event: React.MouseEvent<HTMLElement>,
    newModel: string,
  ) => {
    if (newModel !== null) {
      setAttributionModel(newModel);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Campaign ROI Analytics
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Comprehensive ROI tracking and attribution analysis
          </Typography>
        </Box>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="date-range-label">Date Range</InputLabel>
          <Select
            labelId="date-range-label"
            value={dateRange}
            label="Date Range"
            onChange={handleDateRangeChange}
            size="small"
          >
            <MenuItem value="last7days">Last 7 Days</MenuItem>
            <MenuItem value="last30days">Last 30 Days</MenuItem>
            <MenuItem value="last90days">Last 90 Days</MenuItem>
            <MenuItem value="ytd">Year to Date</MenuItem>
            <MenuItem value="custom">Custom Range</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* KPI Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Ad Spend
              </Typography>
              <Typography variant="h4" component="div">
                $29,900
              </Typography>
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                +12.4% vs previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" component="div">
                $104,000
              </Typography>
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                +19.2% vs previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Average ROAS
              </Typography>
              <Typography variant="h4" component="div">
                3.48x
              </Typography>
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                +6.1% vs previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Conversion Rate
              </Typography>
              <Typography variant="h4" component="div">
                3.26%
              </Typography>
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                +0.4% vs previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Main Tabs */}
      <Card sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="ROI analytics tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="ROI Overview" {...a11yProps(0)} />
            <Tab label="Channel Comparison" {...a11yProps(1)} />
            <Tab label="Attribution Models" {...a11yProps(2)} />
            <Tab label="Conversion Paths" {...a11yProps(3)} />
            <Tab label="ROAS Optimization" {...a11yProps(4)} />
          </Tabs>
        </Box>
        
        {/* ROI Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Monthly Performance
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={mockCampaignData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip 
                      formatter={(value: number) => ['$' + value.toLocaleString(), '']}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="spend" name="Ad Spend" fill="#8884d8" />
                    <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#82ca9d" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="roi"
                      name="ROI %"
                      stroke="#ff7300"
                      strokeWidth={2}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                ROI by Channel
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={channelData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 500]} />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={(value: number) => [value.toFixed(1) + '%', 'ROI']} />
                    <Bar dataKey="roi" fill="#8884d8">
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Revenue Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="revenue"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => ['$' + value.toLocaleString(), 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Channel Comparison Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Channel Performance Comparison
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Channel</TableCell>
                      <TableCell align="right">Spend</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">ROI</TableCell>
                      <TableCell align="right">CPA</TableCell>
                      <TableCell align="right">Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {channelData.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell component="th" scope="row">
                          {row.name}
                        </TableCell>
                        <TableCell align="right">${row.spend.toLocaleString()}</TableCell>
                        <TableCell align="right">${row.revenue.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`${row.roi.toFixed(1)}%`} 
                            color={row.roi > 200 ? "success" : "primary"} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="right">${row.cpa.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={row.roi > 300 ? "Excellent" : row.roi > 200 ? "Good" : "Average"} 
                            color={
                              row.roi > 300 ? "success" : 
                              row.roi > 200 ? "primary" : 
                              "default"
                            } 
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Spend vs. Revenue by Channel
              </Typography>
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={channelData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => ['$' + value.toLocaleString(), '']} />
                    <Legend />
                    <Bar dataKey="spend" name="Spend" fill="#8884d8" />
                    <Bar dataKey="revenue" name="Revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                ROI vs. CPA Analysis
              </Typography>
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid />
                    <XAxis 
                      type="number" 
                      dataKey="cpa" 
                      name="CPA" 
                      domain={[10, 35]}
                      label={{ value: 'CPA ($)', position: 'bottom' }} 
                    />
                    <YAxis 
                      type="number" 
                      dataKey="roi" 
                      name="ROI" 
                      domain={[150, 450]}
                      label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }} 
                    />
                    <ZAxis type="number" range={[100, 500]} dataKey="spend" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value) => value} />
                    <Legend />
                    <Scatter name="Channels" data={channelData} fill="#8884d8">
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Attribution Models Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <ToggleButtonGroup
                  value={attributionModel}
                  exclusive
                  onChange={handleAttributionModelChange}
                  aria-label="attribution model"
                >
                  <ToggleButton value="First Touch">First Touch</ToggleButton>
                  <ToggleButton value="Last Touch">Last Touch</ToggleButton>
                  <ToggleButton value="Linear">Linear</ToggleButton>
                  <ToggleButton value="Position Based">Position Based</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Attribution Model: {attributionModel}
              </Typography>
              
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={attributionData[attributionModel as keyof typeof attributionData]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis domain={[0, 40]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Conversion Attribution']} />
                    <Legend />
                    <Bar dataKey="value" name="Attribution %" fill="#8884d8">
                      {attributionData[attributionModel as keyof typeof attributionData].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Conversion Paths Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Top Conversion Paths
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Path</TableCell>
                      <TableCell align="right">Conversions</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                      <TableCell align="right">Avg. Value</TableCell>
                      <TableCell align="right">Total Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {conversionPathData.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell component="th" scope="row">
                          {row.name}
                        </TableCell>
                        <TableCell align="right">{row.value}</TableCell>
                        <TableCell align="right">{row.percentage}%</TableCell>
                        <TableCell align="right">${row.avgValue}</TableCell>
                        <TableCell align="right">${(row.value * row.avgValue).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* ROAS Optimization Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                ROAS Optimization Recommendations
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Channel</TableCell>
                      <TableCell align="right">Current Budget</TableCell>
                      <TableCell align="right">Recommended Budget</TableCell>
                      <TableCell align="right">Projected ROI</TableCell>
                      <TableCell align="right">Improvement</TableCell>
                      <TableCell>Recommendation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roasRecommendations.map((row) => (
                      <TableRow key={row.channel}>
                        <TableCell component="th" scope="row">
                          {row.channel}
                        </TableCell>
                        <TableCell align="right">${row.currentBudget}</TableCell>
                        <TableCell align="right">${row.recommendedBudget}</TableCell>
                        <TableCell align="right">{row.projected_roi.toFixed(1)}%</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={row.improvement} 
                            color="success" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{row.action}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default CampaignROIAnalytics;