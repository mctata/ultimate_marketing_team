import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import ABTestComparisonChart, { 
  ABTestVariant, 
  ABTestMetric, 
  ABTestResult
} from '../../components/analytics/ABTestComparisonChart';
import { Campaign } from '../../services/campaignService';

// Mock data for the A/B test
const mockVariants: ABTestVariant[] = [
  { id: 'a', name: 'Control', color: '#3f51b5' },
  { id: 'b', name: 'Variant B', color: '#f44336' },
  { id: 'c', name: 'Variant C', color: '#4caf50' },
  { id: 'd', name: 'Variant D', color: '#ff9800' },
];

const mockMetrics: ABTestMetric[] = [
  { 
    key: 'clickRate', 
    name: 'Click Rate', 
    formatter: (value) => `${value.toFixed(2)}%`,
    higherIsBetter: true,
  },
  { 
    key: 'conversionRate', 
    name: 'Conversion Rate', 
    formatter: (value) => `${value.toFixed(2)}%`,
    higherIsBetter: true,
  },
  { 
    key: 'revenuePerVisitor', 
    name: 'Revenue/Visitor', 
    formatter: (value) => `$${value.toFixed(2)}`,
    higherIsBetter: true,
  },
  { 
    key: 'bounceRate', 
    name: 'Bounce Rate', 
    formatter: (value) => `${value.toFixed(2)}%`,
    higherIsBetter: false,
  },
];

const mockResults: ABTestResult[] = [
  { 
    variant: 'a', 
    clickRate: 5.2, 
    conversionRate: 2.1, 
    revenuePerVisitor: 1.45,
    bounceRate: 35.8,
  },
  { 
    variant: 'b', 
    clickRate: 7.3, 
    conversionRate: 2.8, 
    revenuePerVisitor: 1.95,
    bounceRate: 32.1,
  },
  { 
    variant: 'c', 
    clickRate: 6.9, 
    conversionRate: 3.2, 
    revenuePerVisitor: 2.15,
    bounceRate: 30.5,
  },
  { 
    variant: 'd', 
    clickRate: 4.8, 
    conversionRate: 1.9, 
    revenuePerVisitor: 1.35,
    bounceRate: 39.2,
  },
];

// Campaign mock data
const mockCampaigns: Record<string, Campaign> = {
  '1': {
    id: '1',
    name: 'Summer Collection Launch',
    description: 'Promotion for our new summer apparel line',
    status: 'active',
    startDate: '2025-04-01T00:00:00Z',
    endDate: '2025-06-30T00:00:00Z',
    budget: 5000,
    platform: 'facebook',
    brandId: '2',
    createdAt: '2025-03-15T00:00:00Z',
    updatedAt: '2025-03-15T00:00:00Z'
  },
  '2': {
    id: '2',
    name: 'Q2 Lead Generation',
    description: 'B2B lead generation campaign targeting CTOs',
    status: 'draft',
    startDate: '2025-04-15T00:00:00Z',
    budget: 7500,
    platform: 'linkedin',
    brandId: '1',
    createdAt: '2025-03-10T00:00:00Z',
    updatedAt: '2025-03-10T00:00:00Z'
  },
  '3': {
    id: '3',
    name: 'Product Launch: Home Fitness',
    description: 'Campaign for new home fitness product line',
    status: 'active',
    startDate: '2025-03-01T00:00:00Z',
    endDate: '2025-05-31T00:00:00Z',
    budget: 12000,
    platform: 'google,instagram',
    brandId: '3',
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2025-03-05T00:00:00Z'
  },
  '4': {
    id: '4',
    name: 'Interior Design Spring Showcase',
    description: 'Showcase of spring collection for interior design',
    status: 'paused',
    startDate: '2025-03-10T00:00:00Z',
    endDate: '2025-04-10T00:00:00Z',
    budget: 3000,
    platform: 'instagram,pinterest',
    brandId: '4',
    createdAt: '2025-02-28T00:00:00Z',
    updatedAt: '2025-03-15T00:00:00Z'
  }
};

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
      id={`ab-test-tabpanel-${index}`}
      aria-labelledby={`ab-test-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `ab-test-tab-${index}`,
    'aria-controls': `ab-test-tabpanel-${index}`,
  };
}

const ABTestingDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState(mockMetrics[0].key);
  const [confidenceLevel, setConfidenceLevel] = useState('95');
  const [testRunning, setTestRunning] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading campaign data
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (id && mockCampaigns[id]) {
        setCampaign(mockCampaigns[id]);
      }
      
      // Mock winning variant detection
      const winningVariant = mockVariants.find(v => v.id === 'c');
      setWinner(winningVariant?.id || null);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMetricSelect = (metric: string) => {
    setSelectedMetric(metric);
  };

  const handleConfidenceLevelChange = (event: SelectChangeEvent) => {
    setConfidenceLevel(event.target.value);
  };

  const handleTestToggle = () => {
    setTestRunning(!testRunning);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!campaign) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">Campaign not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            A/B Testing Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {campaign.name}
          </Typography>
        </Box>
        
        <Box>
          <Button 
            variant={testRunning ? "outlined" : "contained"} 
            color={testRunning ? "error" : "success"}
            onClick={handleTestToggle}
            sx={{ mr: 2 }}
          >
            {testRunning ? "Stop Test" : "Resume Test"}
          </Button>
          
          <Button variant="contained" disabled={!winner}>
            Apply Winner
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Test Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip 
                  label={testRunning ? "Running" : "Paused"} 
                  color={testRunning ? "success" : "default"} 
                  sx={{ mr: 1 }} 
                />
                <Typography variant="body2" color="text.secondary">
                  {testRunning ? "Test in progress" : "Test is paused"}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Confidence Level
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel id="confidence-level-label">Confidence</InputLabel>
                <Select
                  labelId="confidence-level-label"
                  value={confidenceLevel}
                  label="Confidence"
                  onChange={handleConfidenceLevelChange}
                >
                  <MenuItem value="90">90%</MenuItem>
                  <MenuItem value="95">95%</MenuItem>
                  <MenuItem value="99">99%</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Variants
              </Typography>
              <Typography variant="h5">
                {mockVariants.length}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {mockVariants.map(variant => (
                  <Chip key={variant.id} label={variant.name} size="small" />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Winning Variant
              </Typography>
              {winner ? (
                <>
                  <Typography variant="h5">
                    {mockVariants.find(v => v.id === winner)?.name}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    Significantly better for {mockMetrics.find(m => m.key === 'conversionRate')?.name}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Not enough data yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Card sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="A/B test tabs">
            <Tab label="Results" {...a11yProps(0)} />
            <Tab label="Variants" {...a11yProps(1)} />
            <Tab label="Settings" {...a11yProps(2)} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ABTestComparisonChart
                title="Test Results"
                description="Performance comparison between variants"
                variants={mockVariants}
                metrics={mockMetrics}
                results={mockResults}
                height={400}
                selectedMetric={selectedMetric}
                onSelectMetric={handleMetricSelect}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Detailed Results
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Variant</TableCell>
                      {mockMetrics.map(metric => (
                        <TableCell key={metric.key} align="right">
                          {metric.name}
                        </TableCell>
                      ))}
                      <TableCell align="right">Sample Size</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockResults.map((result) => {
                      const variantName = mockVariants.find(v => v.id === result.variant)?.name || '';
                      
                      return (
                        <TableRow
                          key={result.variant}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell component="th" scope="row">
                            {variantName}
                            {result.variant === winner && (
                              <Chip 
                                label="Winner" 
                                color="success" 
                                size="small" 
                                sx={{ ml: 1 }} 
                              />
                            )}
                          </TableCell>
                          {mockMetrics.map(metric => (
                            <TableCell key={metric.key} align="right">
                              {metric.formatter?.(result[metric.key]) || result[metric.key]}
                            </TableCell>
                          ))}
                          <TableCell align="right">1,250</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Variant Content
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            The following variants are currently being tested in this campaign.
          </Alert>
          
          <Grid container spacing={3}>
            {mockVariants.map((variant) => (
              <Grid item xs={12} md={6} key={variant.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">
                        {variant.name}
                      </Typography>
                      {variant.id === winner && (
                        <Chip label="Winner" color="success" size="small" />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {variant.id === 'a' 
                        ? 'Original campaign content with standard copy and imagery.' 
                        : `Modified version with ${variant.id === 'b' 
                            ? 'stronger call-to-action and red button' 
                            : variant.id === 'c' 
                              ? 'testimonials and social proof elements' 
                              : 'simplified layout with fewer distractions'}.`}
                    </Typography>
                    
                    <Box 
                      sx={{ 
                        height: 200, 
                        backgroundColor: 'grey.100', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mb: 2 
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        [Variant Preview]
                      </Typography>
                    </Box>
                    
                    <Button variant="outlined" size="small">
                      Edit Variant
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Test Settings
          </Typography>
          
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Traffic Allocation
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Percentage of campaign traffic sent to each variant:
              </Typography>
              
              <Grid container spacing={2}>
                {mockVariants.map(variant => (
                  <Grid item xs={12} sm={6} md={3} key={variant.id}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2">{variant.name}</Typography>
                      <Typography variant="h6">25%</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
          
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Primary Metrics
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                The metrics used to determine the winning variant:
              </Typography>
              
              <Grid container spacing={2}>
                {mockMetrics.map(metric => (
                  <Grid item xs={12} sm={6} md={3} key={metric.key}>
                    <Paper 
                      sx={{ 
                        p: 2,
                        textAlign: 'center',
                        border: metric.key === 'conversionRate' ? 2 : 0,
                        borderColor: metric.key === 'conversionRate' ? 'primary.main' : 'transparent'
                      }}
                    >
                      <Typography variant="subtitle2">
                        {metric.name}
                        {metric.key === 'conversionRate' && (
                          <Chip label="Primary" color="primary" size="small" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {metric.higherIsBetter ? 'Higher is better' : 'Lower is better'}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
          
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Statistical Significance
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure how statistical significance is calculated:
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Confidence Level</Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={confidenceLevel}
                        onChange={handleConfidenceLevelChange}
                      >
                        <MenuItem value="90">90%</MenuItem>
                        <MenuItem value="95">95%</MenuItem>
                        <MenuItem value="99">99%</MenuItem>
                      </Select>
                    </FormControl>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Minimum Sample Size</Typography>
                    <Typography variant="h6">1,000</Typography>
                    <Typography variant="body2" color="text.secondary">
                      per variant
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Required Lift</Typography>
                    <Typography variant="h6">5%</Typography>
                    <Typography variant="body2" color="text.secondary">
                      minimum improvement
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default ABTestingDashboard;