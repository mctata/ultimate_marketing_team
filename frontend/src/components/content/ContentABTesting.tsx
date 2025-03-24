import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CompareArrows as CompareArrowsIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  BarChart as BarChartIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  ContentCopy as ContentCopyIcon,
  Insights as InsightsIcon,
  Flag as FlagIcon,
  ArrowUpward as ArrowUpwardIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  QuestionMark as QuestionMarkIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { ABTest as ApiABTest, ContentVariation } from '../../services/contentGenerationService';
import { useABTesting } from '../../hooks/useContentGeneration';

// Map API structures to component structures
export interface ContentVariant {
  id: string;
  name: string;
  content: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  metrics?: {
    impressions: number;
    clicks: number;
    conversions: number;
    engagementRate: number;
    ctr: number;
    conversionRate: number;
  };
  isOriginal?: boolean;
  isWinner?: boolean;
}

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed';
  startDate?: string;
  endDate?: string;
  variants: ContentVariant[];
  metrics?: {
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    confidence: number;
  };
  targetAudience?: string;
  conversionGoal?: string;
  trafficAllocation?: number;
}

// Map API response to component model
const mapApiTestToComponentTest = (apiTest: ApiABTest): ABTest => {
  return {
    id: apiTest.id,
    name: apiTest.title,
    description: '',
    status: apiTest.status,
    startDate: apiTest.created_at,
    endDate: apiTest.end_date,
    variants: apiTest.content_variations.map((variation: ContentVariation, index: number) => ({
      id: variation.variation_id,
      name: `Variant ${index + 1}`,
      content: variation.content,
      status: apiTest.status,
      isOriginal: index === 0,
      isWinner: apiTest.winner_id === variation.variation_id,
      metrics: apiTest.results?.find(r => r.variation_id === variation.variation_id)?.metrics ? {
        impressions: apiTest.results?.find(r => r.variation_id === variation.variation_id)?.metrics?.impressions || 0,
        clicks: apiTest.results?.find(r => r.variation_id === variation.variation_id)?.metrics?.clicks || 0,
        conversions: apiTest.results?.find(r => r.variation_id === variation.variation_id)?.metrics?.conversions || 0,
        engagementRate: apiTest.results?.find(r => r.variation_id === variation.variation_id)?.metrics?.engagement_rate || 0,
        ctr: apiTest.results?.find(r => r.variation_id === variation.variation_id)?.metrics?.ctr || 0,
        conversionRate: apiTest.results?.find(r => r.variation_id === variation.variation_id)?.metrics?.conversion_rate || 0
      } : undefined
    })),
    metrics: apiTest.results ? {
      totalImpressions: apiTest.results.reduce((sum, r) => sum + (r.metrics?.impressions || 0), 0),
      totalClicks: apiTest.results.reduce((sum, r) => sum + (r.metrics?.clicks || 0), 0),
      totalConversions: apiTest.results.reduce((sum, r) => sum + (r.metrics?.conversions || 0), 0),
      confidence: 95 // Example confidence level
    } : undefined
  };
};

interface ContentABTestingProps {
  testId: string;
  initialTestData?: ABTest;
  onUpdateTest?: (updatedTest: ABTest) => void;
  onCreateVariant?: (testId: string) => void;
  onViewContent?: (content: string) => void;
  onCompareVariants?: (variantIds: string[]) => void;
}

const ContentABTesting = ({
  testId,
  initialTestData,
  onUpdateTest,
  onCreateVariant,
  onViewContent,
  onCompareVariants,
}: ContentABTestingProps) => {
  const { getABTest, updateABTest, startABTest, stopABTest } = useABTesting();
  const [test, setTest] = useState<ABTest | undefined>(initialTestData);
  const [loading, setLoading] = useState(!initialTestData);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedVariantsForComparison, setSelectedVariantsForComparison] = useState<string[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [testName, setTestName] = useState(initialTestData?.name || '');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // Fetch test data if not provided
  useEffect(() => {
    if (!initialTestData) {
      setLoading(true);
      getABTest(testId)
        .then(apiTestData => {
          const mappedTest = mapApiTestToComponentTest(apiTestData);
          setTest(mappedTest);
          setTestName(mappedTest.name);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching A/B test data:', err);
          setError('Failed to load A/B test data');
          setLoading(false);
        });
    }
  }, [testId, initialTestData, getABTest]);
  
  // If loading or no test data available, show loading state
  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1">
          Loading A/B test data...
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Paper>
    );
  }
  
  if (error || !test) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="error">
          {error || 'A/B test data not available'}
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Paper>
    );
  }
  
  const handleVariantChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedVariantIndex(newValue);
  };
  
  const toggleVariantForComparison = (variantId: string) => {
    if (selectedVariantsForComparison.includes(variantId)) {
      setSelectedVariantsForComparison(selectedVariantsForComparison.filter(id => id !== variantId));
    } else {
      if (selectedVariantsForComparison.length < 2) {
        setSelectedVariantsForComparison([...selectedVariantsForComparison, variantId]);
      }
    }
  };
  
  const handleCompare = () => {
    if (selectedVariantsForComparison.length === 2 && onCompareVariants) {
      onCompareVariants(selectedVariantsForComparison);
    }
  };
  
  const handleNameEdit = () => {
    if (testName.trim() === '') {
      return;
    }
    
    const updatedTest = { ...test, name: testName };
    
    // Update both local state and API
    setTest(updatedTest);
    
    // Call API update function
    updateABTest(testId, { 
      title: testName 
    }).catch(err => {
      console.error('Error updating test name:', err);
      // Revert on error
      setTest(test);
      setTestName(test.name);
    });
    
    // Call parent's update callback if provided
    if (onUpdateTest) {
      onUpdateTest(updatedTest);
    }
    
    setIsEditingName(false);
  };
  
  const handleStatusChange = (event: any) => {
    const newStatus = event.target.value;
    const updatedTest = { ...test, status: newStatus };
    
    // Update local state
    setTest(updatedTest);
    
    // Call appropriate API functions based on status change
    if (newStatus === 'running') {
      startABTest(testId).catch(err => {
        console.error('Error starting test:', err);
        // Revert on error
        setTest(test);
      });
    } else if (newStatus === 'paused' || newStatus === 'completed') {
      stopABTest(testId).catch(err => {
        console.error('Error stopping test:', err);
        // Revert on error
        setTest(test);
      });
    } else {
      // For other status changes, use the general update function
      updateABTest(testId, { 
        status: newStatus 
      }).catch(err => {
        console.error('Error updating test status:', err);
        // Revert on error
        setTest(test);
      });
    }
    
    // Call parent's update callback if provided
    if (onUpdateTest) {
      onUpdateTest(updatedTest);
    }
  };
  
  const renderMetricDifference = (variant: ContentVariant, metricName: keyof ContentVariant['metrics'], isBetter: boolean = true) => {
    if (!variant.metrics || !test.variants[0].metrics) return null;
    
    const originalMetric = test.variants.find(v => v.isOriginal)?.metrics?.[metricName] || 0;
    const variantMetric = variant.metrics[metricName];
    
    if (originalMetric === 0) return null;
    
    const difference = (variantMetric - originalMetric) / originalMetric * 100;
    const isPositive = difference > 0;
    const isNegative = difference < 0;
    
    // Only show if the difference is significant and in the "better" direction
    if (Math.abs(difference) < 0.5 || (isBetter && !isPositive) || (!isBetter && !isNegative)) {
      return null;
    }
    
    return (
      <Chip
        label={`${isPositive ? '+' : ''}${difference.toFixed(1)}%`}
        size="small"
        color={isPositive ? 'success' : 'error'}
        sx={{ ml: 1, height: 20, fontWeight: 'bold' }}
      />
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CompareArrowsIcon sx={{ mr: 1, color: 'primary.main' }} />
          
          {isEditingName ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                variant="standard"
                size="small"
                sx={{ mr: 1 }}
                autoFocus
              />
              <Button size="small" onClick={handleNameEdit}>Save</Button>
              <Button size="small" onClick={() => {
                setTestName(test.name);
                setIsEditingName(false);
              }}>Cancel</Button>
            </Box>
          ) : (
            <>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {test.name}
              </Typography>
              <IconButton size="small" onClick={() => setIsEditingName(true)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </>
          )}
          
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
            <Tooltip title="View test details">
              <IconButton size="small" onClick={() => setShowDetailsDialog(true)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <FormControl size="small" sx={{ ml: 2, minWidth: 120 }}>
              <InputLabel id="test-status-label">Status</InputLabel>
              <Select
                labelId="test-status-label"
                value={test.status}
                label="Status"
                onChange={handleStatusChange}
                size="small"
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="running">Running</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              startIcon={<CompareArrowsIcon />}
              size="small"
              onClick={() => setIsCompareMode(!isCompareMode)}
              sx={{ ml: 2 }}
            >
              {isCompareMode ? 'Exit Compare' : 'Compare'}
            </Button>
          </Box>
        </Box>
        
        {test.status === 'running' && (
          <Box sx={{ mb: 2, p: 1, bgcolor: '#f0f7ff', borderRadius: 1, display: 'flex', alignItems: 'center' }}>
            <InsightsIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body2">
              Test is currently running. Data is being collected and analyzed in real-time.
            </Typography>
            {test.metrics && (
              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  <strong>{test.metrics.totalImpressions.toLocaleString()}</strong> impressions
                </Typography>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                <Typography variant="body2" sx={{ mr: 1 }}>
                  <strong>{test.metrics.totalClicks.toLocaleString()}</strong> clicks
                </Typography>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                <Typography variant="body2">
                  <strong>{test.metrics.totalConversions.toLocaleString()}</strong> conversions
                </Typography>
              </Box>
            )}
          </Box>
        )}
        
        {test.status === 'completed' && test.variants.some(v => v.isWinner) && (
          <Box sx={{ mb: 2, p: 1, bgcolor: '#f1f8e9', borderRadius: 1, display: 'flex', alignItems: 'center' }}>
            <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
            <Typography variant="body2">
              Test completed. Variant <strong>{test.variants.find(v => v.isWinner)?.name}</strong> is the winner with {test.variants.find(v => v.isWinner)?.metrics?.conversionRate.toFixed(2)}% conversion rate.
            </Typography>
            <Button size="small" sx={{ ml: 'auto' }} startIcon={<FlagIcon />}>
              Implement Winner
            </Button>
          </Box>
        )}
        
        <Box sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={selectedVariantIndex} 
              onChange={handleVariantChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              {test.variants.map((variant, index) => (
                <Tab 
                  key={variant.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {isCompareMode ? (
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVariantForComparison(variant.id);
                          }}
                          sx={{ mr: 1 }}
                        >
                          {selectedVariantsForComparison.includes(variant.id) ? (
                            <CheckCircleIcon color="primary" fontSize="small" />
                          ) : (
                            <RadioButtonUncheckedIcon fontSize="small" />
                          )}
                        </IconButton>
                      ) : null}
                      
                      {variant.isOriginal ? (
                        <Chip label="Original" size="small" sx={{ mr: 1, height: 20 }} />
                      ) : (
                        <Chip label={`Variant ${index}`} size="small" sx={{ mr: 1, height: 20 }} />
                      )}
                      
                      {variant.name}
                      
                      {variant.isWinner && (
                        <Chip 
                          label="Winner" 
                          size="small" 
                          color="success" 
                          sx={{ ml: 1, height: 20 }} 
                          icon={<CheckCircleIcon fontSize="small" />}
                        />
                      )}
                    </Box>
                  }
                />
              ))}
              
              {onCreateVariant && (
                <Tab 
                  icon={<AddCircleOutlineIcon />} 
                  aria-label="add variant"
                  sx={{ minWidth: 'auto' }}
                  onClick={() => onCreateVariant(test.id)}
                />
              )}
            </Tabs>
          </Box>
          
          {isCompareMode && selectedVariantsForComparison.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">
                  Compare Variants ({selectedVariantsForComparison.length}/2 selected)
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleCompare}
                  disabled={selectedVariantsForComparison.length !== 2}
                  sx={{ ml: 'auto' }}
                >
                  Compare Selected
                </Button>
              </Box>
              
              {selectedVariantsForComparison.length === 2 && (
                <Grid container spacing={2}>
                  {selectedVariantsForComparison.map((variantId) => {
                    const variant = test.variants.find(v => v.id === variantId)!;
                    return (
                      <Grid item xs={12} md={6} key={variant.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              {variant.name}
                              {variant.isOriginal && (
                                <Chip label="Original" size="small" sx={{ ml: 1, height: 20 }} />
                              )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {variant.content.substring(0, 100)}...
                            </Typography>
                            
                            {variant.metrics && (
                              <Box sx={{ mt: 2 }}>
                                <Grid container spacing={1}>
                                  <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                      Click-through Rate:
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                      {variant.metrics.ctr.toFixed(2)}%
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                      Conversion Rate:
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                      {variant.metrics.conversionRate.toFixed(2)}%
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </Box>
                            )}
                          </CardContent>
                          <CardActions>
                            <Button 
                              size="small" 
                              onClick={() => onViewContent && onViewContent(variant.content)}
                            >
                              View Content
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          ) : (
            <>
              {test.variants.map((variant, index) => (
                <Box
                  key={variant.id}
                  role="tabpanel"
                  hidden={selectedVariantIndex !== index}
                  id={`variant-tabpanel-${index}`}
                  aria-labelledby={`variant-tab-${index}`}
                  sx={{ py: 2 }}
                >
                  {selectedVariantIndex === index && (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={8}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Typography variant="subtitle1">
                                {variant.name}
                              </Typography>
                              {variant.isOriginal && (
                                <Chip label="Original" size="small" sx={{ ml: 1, height: 20 }} />
                              )}
                              {variant.isWinner && (
                                <Chip 
                                  label="Winner" 
                                  size="small" 
                                  color="success" 
                                  sx={{ ml: 1, height: 20 }} 
                                  icon={<CheckCircleIcon fontSize="small" />}
                                />
                              )}
                              <Chip 
                                label={variant.status} 
                                size="small" 
                                color={
                                  variant.status === 'running' ? 'success' :
                                  variant.status === 'paused' ? 'warning' :
                                  variant.status === 'completed' ? 'info' : 'default'
                                }
                                sx={{ ml: 1, height: 20 }} 
                              />
                            </Box>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                              {variant.content.substring(0, 300)}
                              {variant.content.length > 300 && '...'}
                            </Typography>
                            
                            <Button 
                              size="small" 
                              onClick={() => onViewContent && onViewContent(variant.content)}
                              startIcon={<VisibilityIcon />}
                            >
                              View Full Content
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              Performance Metrics
                            </Typography>
                            
                            {variant.metrics ? (
                              <Box>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Impressions
                                  </Typography>
                                  <Typography variant="body1" fontWeight="medium">
                                    {variant.metrics.impressions.toLocaleString()}
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ mb: 2 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Click-through Rate (CTR)
                                    </Typography>
                                    {variant.isOriginal === false && renderMetricDifference(variant, 'ctr', true)}
                                  </Box>
                                  <Typography variant="body1" fontWeight="medium">
                                    {variant.metrics.ctr.toFixed(2)}%
                                  </Typography>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={Math.min(variant.metrics.ctr * 5, 100)} 
                                    sx={{ 
                                      height: 4, 
                                      borderRadius: 2,
                                      mt: 0.5
                                    }} 
                                  />
                                </Box>
                                
                                <Box sx={{ mb: 2 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Conversion Rate
                                    </Typography>
                                    {variant.isOriginal === false && renderMetricDifference(variant, 'conversionRate', true)}
                                  </Box>
                                  <Typography variant="body1" fontWeight="medium">
                                    {variant.metrics.conversionRate.toFixed(2)}%
                                  </Typography>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={Math.min(variant.metrics.conversionRate * 5, 100)} 
                                    sx={{ 
                                      height: 4, 
                                      borderRadius: 2,
                                      mt: 0.5
                                    }} 
                                  />
                                </Box>
                                
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Engagement Rate
                                    </Typography>
                                    {variant.isOriginal === false && renderMetricDifference(variant, 'engagementRate', true)}
                                  </Box>
                                  <Typography variant="body1" fontWeight="medium">
                                    {variant.metrics.engagementRate.toFixed(2)}%
                                  </Typography>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={Math.min(variant.metrics.engagementRate * 2, 100)} 
                                    sx={{ 
                                      height: 4, 
                                      borderRadius: 2,
                                      mt: 0.5
                                    }} 
                                  />
                                </Box>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                No metrics available yet. Start the test to collect data.
                              </Typography>
                            )}
                          </CardContent>
                          <CardActions>
                            <Button 
                              size="small" 
                              startIcon={<BarChartIcon />}
                              disabled={!variant.metrics}
                            >
                              Detailed Analytics
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    </Grid>
                  )}
                </Box>
              ))}
            </>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            startIcon={<DownloadIcon />}
            sx={{ mr: 1 }}
          >
            Export Results
          </Button>
          
          <Button 
            startIcon={<ShareIcon />}
          >
            Share Test
          </Button>
        </Box>
      </Paper>
      
      {/* Test Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CompareArrowsIcon sx={{ mr: 1 }} />
            Test Details: {test.name}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                General Information
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                        Description
                      </TableCell>
                      <TableCell>{test.description || 'No description provided'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                        Status
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={test.status} 
                          size="small" 
                          color={
                            test.status === 'running' ? 'success' :
                            test.status === 'paused' ? 'warning' :
                            test.status === 'completed' ? 'info' : 'default'
                          }
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                        Start Date
                      </TableCell>
                      <TableCell>{test.startDate || 'Not started'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                        End Date
                      </TableCell>
                      <TableCell>{test.endDate || 'Not completed'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                        Target Audience
                      </TableCell>
                      <TableCell>{test.targetAudience || 'All visitors'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                        Conversion Goal
                      </TableCell>
                      <TableCell>{test.conversionGoal || 'Not specified'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                        Traffic Allocation
                      </TableCell>
                      <TableCell>{test.trafficAllocation ? `${test.trafficAllocation}%` : '100%'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Test Results
              </Typography>
              
              {test.metrics ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }} variant="outlined">
                          <Typography variant="h6" fontWeight="bold">
                            {test.metrics.totalImpressions.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total Impressions
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }} variant="outlined">
                          <Typography variant="h6" fontWeight="bold">
                            {test.metrics.totalClicks.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total Clicks
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }} variant="outlined">
                          <Typography variant="h6" fontWeight="bold">
                            {test.metrics.totalConversions.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total Conversions
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Variant Performance
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Variant</TableCell>
                          <TableCell align="right">CTR</TableCell>
                          <TableCell align="right">Conv. Rate</TableCell>
                          <TableCell align="right">Engagement</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {test.variants.map((variant) => (
                          <TableRow key={variant.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {variant.name}
                                {variant.isOriginal && (
                                  <Chip label="Original" size="small" sx={{ ml: 1, height: 20 }} />
                                )}
                                {variant.isWinner && (
                                  <Chip label="Winner" size="small" color="success" sx={{ ml: 1, height: 20 }} />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              {variant.metrics?.ctr.toFixed(2)}%
                            </TableCell>
                            <TableCell align="right">
                              {variant.metrics?.conversionRate.toFixed(2)}%
                            </TableCell>
                            <TableCell align="right">
                              {variant.metrics?.engagementRate.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {test.metrics.confidence > 0 && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#f1f8e9', borderRadius: 1 }}>
                      <Typography variant="body2">
                        Statistical Confidence: <strong>{test.metrics.confidence.toFixed(2)}%</strong>
                        {test.metrics.confidence >= 95 && (
                          <> - Statistically significant result</>
                        )}
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center' }} variant="outlined">
                  <Typography variant="body2" color="text.secondary">
                    No test results available yet. Start the test to collect data.
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          <Button 
            variant="contained" 
            startIcon={<BarChartIcon />}
            disabled={!test.metrics}
          >
            Full Analytics
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentABTesting;