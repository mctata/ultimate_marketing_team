import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import { 
  fetchTemplateAnalytics, 
  fetchIndustryPerformance,
  fetchTopPerformingTemplates,
  selectTemplateAnalytics,
  selectIndustryPerformance,
  selectTopPerformingTemplates,
  selectTemplateAnalyticsLoading,
  selectTemplateAnalyticsError
} from '../../store/slices/analyticsSlice';

// Type definitions for analytics data
interface TemplateUsageData {
  date: string;
  count: number;
}

interface TemplatePerformance {
  templateId: string;
  templateName: string;
  usageCount: number;
  conversionRate: number;
  engagement: number;
  completionTime: number;
}

interface IndustryPerformance {
  industry: string;
  usageCount: number;
  conversionRate: number;
  engagementScore: number;
}

// TabPanel Component
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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Main component
const TemplateAnalytics: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const templateAnalytics = useSelector(selectTemplateAnalytics);
  const industryPerformance = useSelector(selectIndustryPerformance);
  const topPerformingTemplates = useSelector(selectTopPerformingTemplates);
  const loading = useSelector(selectTemplateAnalyticsLoading);
  const error = useSelector(selectTemplateAnalyticsError);

  // Component state
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('30d');

  // COLORS for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Fetch data on component mount and when timeRange changes
  useEffect(() => {
    dispatch(fetchTemplateAnalytics(timeRange));
    dispatch(fetchIndustryPerformance(timeRange));
    dispatch(fetchTopPerformingTemplates(timeRange));
  }, [dispatch, timeRange]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle time range change
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Template Analytics
        </Typography>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="time-range-label">Time Range</InputLabel>
          <Select
            labelId="time-range-label"
            id="time-range-select"
            value={timeRange}
            label="Time Range"
            onChange={handleTimeRangeChange}
            size="small"
          >
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="90d">Last 90 Days</MenuItem>
            <MenuItem value="1y">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                Total Template Usage
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold">
                {templateAnalytics?.totalUsage || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {templateAnalytics?.usageGrowth > 0 ? '+' : ''}{templateAnalytics?.usageGrowth}% vs previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                Average Conversion Rate
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold">
                {templateAnalytics?.avgConversionRate || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {templateAnalytics?.conversionGrowth > 0 ? '+' : ''}{templateAnalytics?.conversionGrowth}% vs previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                Avg Engagement Score
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold">
                {templateAnalytics?.avgEngagementScore || 0}/10
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {templateAnalytics?.engagementGrowth > 0 ? '+' : ''}{templateAnalytics?.engagementGrowth}% vs previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                Avg Completion Time
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold">
                {templateAnalytics?.avgCompletionTime || 0}m
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {templateAnalytics?.completionTimeGrowth < 0 ? '' : '+'}{templateAnalytics?.completionTimeGrowth}% vs previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="template analytics tabs">
          <Tab label="Usage Trends" id="analytics-tab-0" aria-controls="analytics-tabpanel-0" />
          <Tab label="Template Performance" id="analytics-tab-1" aria-controls="analytics-tabpanel-1" />
          <Tab label="Industry Insights" id="analytics-tab-2" aria-controls="analytics-tabpanel-2" />
        </Tabs>
      </Box>

      {/* Usage Trends Tab */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Template Usage Over Time
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={templateAnalytics?.usageOverTime || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" name="Template Usage" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Usage by Content Type
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={templateAnalytics?.usageByContentType || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {(templateAnalytics?.usageByContentType || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} uses`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Usage by Platform
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={templateAnalytics?.usageByPlatform || []}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Usage Count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Template Performance Tab */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Top Performing Templates
          </Typography>
          <TableContainer>
            <Table aria-label="template performance table">
              <TableHead>
                <TableRow>
                  <TableCell>Template Name</TableCell>
                  <TableCell align="right">Usage Count</TableCell>
                  <TableCell align="right">Conversion Rate</TableCell>
                  <TableCell align="right">Engagement Score</TableCell>
                  <TableCell align="right">Completion Time</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topPerformingTemplates?.map((template) => (
                  <TableRow key={template.templateId}>
                    <TableCell component="th" scope="row">
                      {template.templateName}
                    </TableCell>
                    <TableCell align="right">{template.usageCount}</TableCell>
                    <TableCell align="right">{template.conversionRate}%</TableCell>
                    <TableCell align="right">{template.engagement}/10</TableCell>
                    <TableCell align="right">{template.completionTime}m</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Performance Comparison
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topPerformingTemplates?.slice(0, 5) || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="templateName" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="usageCount" name="Usage Count" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="conversionRate" name="Conversion Rate (%)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </TabPanel>

      {/* Industry Insights Tab */}
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Industry Performance
          </Typography>
          <TableContainer>
            <Table aria-label="industry performance table">
              <TableHead>
                <TableRow>
                  <TableCell>Industry</TableCell>
                  <TableCell align="right">Template Usage</TableCell>
                  <TableCell align="right">Conversion Rate</TableCell>
                  <TableCell align="right">Engagement Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {industryPerformance?.map((industry) => (
                  <TableRow key={industry.industry}>
                    <TableCell component="th" scope="row">
                      {industry.industry}
                    </TableCell>
                    <TableCell align="right">{industry.usageCount}</TableCell>
                    <TableCell align="right">{industry.conversionRate}%</TableCell>
                    <TableCell align="right">{industry.engagementScore}/10</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Industry Usage Distribution
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={industryPerformance || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="usageCount"
                  nameKey="industry"
                  label={({ industry, percent }) => `${industry}: ${(percent * 100).toFixed(0)}%`}
                >
                  {(industryPerformance || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} uses`, props.payload.industry]} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </TabPanel>
    </Box>
  );
};

export default TemplateAnalytics;