import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  BarChart,
  Timeline
} from '@mui/icons-material';
import { AppDispatch } from '../../store';
import { 
  fetchDraftById, 
  fetchABTests, 
  fetchABTestById, 
  fetchABTestVariants,
  selectSelectedDraft, 
  selectABTests, 
  selectSelectedABTest, 
  selectABTestVariants, 
  selectABTestsLoading 
} from '../../store/slices/contentSlice';
import { ABTest, ABTestVariant } from '../../services/contentService';
import RichTextEditor from '../../components/content/RichTextEditor';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ContentABTest = () => {
  const { id, testId } = useParams<{ id: string; testId?: string }>();
  const isNewTest = testId === 'new';
  const isViewingTest = testId && !isNewTest;
  
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const contentDraft = useSelector(selectSelectedDraft);
  const abTests = useSelector(selectABTests);
  const selectedTest = useSelector(selectSelectedABTest);
  const testVariants = useSelector(selectABTestVariants);
  const loading = useSelector(selectABTestsLoading);
  
  const [testForm, setTestForm] = useState<{
    name: string;
    metrics: string[];
  }>({
    name: '',
    metrics: ['clicks', 'views', 'engagement']
  });
  
  const [variants, setVariants] = useState<{
    id?: string;
    variant_name: string;
    content: string;
    is_control: boolean;
  }[]>([]);
  
  const [activeTab, setActiveTab] = useState(0);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  
  // Fetch content and tests data
  useEffect(() => {
    if (id) {
      dispatch(fetchDraftById(id));
      dispatch(fetchABTests(id));
      
      if (isViewingTest && testId) {
        dispatch(fetchABTestById(testId));
        dispatch(fetchABTestVariants(testId));
      }
    }
  }, [dispatch, id, testId, isViewingTest]);
  
  // Initialize form with content draft data
  useEffect(() => {
    if (contentDraft && isNewTest) {
      // For new test, create initial control variant with content draft's content
      setVariants([
        {
          variant_name: 'Control',
          content: contentDraft.body,
          is_control: true
        }
      ]);
    }
  }, [contentDraft, isNewTest]);
  
  // Initialize form with existing test data
  useEffect(() => {
    if (selectedTest && isViewingTest) {
      setTestForm({
        name: selectedTest.name,
        metrics: selectedTest.metrics
      });
    }
  }, [selectedTest, isViewingTest]);
  
  // Initialize variants with existing test variants
  useEffect(() => {
    if (testVariants.length > 0 && isViewingTest) {
      setVariants(testVariants.map(variant => ({
        id: variant.id,
        variant_name: variant.variant_name,
        content: variant.content,
        is_control: variant.is_control
      })));
    }
  }, [testVariants, isViewingTest]);
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setTestForm(prev => ({
      ...prev,
      [name as string]: value
    }));
  };
  
  const handleMetricChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setTestForm(prev => ({
      ...prev,
      metrics: checked 
        ? [...prev.metrics, value] 
        : prev.metrics.filter(m => m !== value)
    }));
  };
  
  const handleAddVariant = () => {
    if (variants.length >= 5) {
      setFormError('Maximum of 5 variants allowed per test');
      return;
    }
    
    setVariants([
      ...variants, 
      {
        variant_name: `Variant ${variants.length}`,
        content: contentDraft?.body || '',
        is_control: false
      }
    ]);
    setEditingVariantIndex(variants.length);
  };
  
  const handleDeleteVariant = (index: number) => {
    if (variants[index].is_control) {
      setFormError('Cannot delete the control variant');
      return;
    }
    
    setVariants(variants.filter((_, i) => i !== index));
    if (editingVariantIndex === index) {
      setEditingVariantIndex(null);
    }
  };
  
  const handleEditVariant = (index: number) => {
    setEditingVariantIndex(index);
  };
  
  const handleVariantNameChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newVariants = [...variants];
    newVariants[index].variant_name = e.target.value;
    setVariants(newVariants);
  };
  
  const handleVariantContentChange = (content: string, index: number) => {
    const newVariants = [...variants];
    newVariants[index].content = content;
    setVariants(newVariants);
  };
  
  const handleControlChange = (index: number) => {
    const newVariants = variants.map((variant, i) => ({
      ...variant,
      is_control: i === index
    }));
    setVariants(newVariants);
  };
  
  const validateForm = () => {
    if (!testForm.name) {
      setFormError('Test name is required');
      return false;
    }
    
    if (variants.length < 2) {
      setFormError('At least two variants are required (control + test)');
      return false;
    }
    
    if (!testForm.metrics.length) {
      setFormError('At least one metric must be selected');
      return false;
    }
    
    return true;
  };
  
  const handleSaveTest = () => {
    if (!validateForm()) return;
    
    // In a real app, this would dispatch actions to save the test
    console.log('Saving test:', {
      name: testForm.name,
      content_draft_id: id,
      metrics: testForm.metrics,
      variants
    });
    
    navigate(`/content/${id}`);
  };
  
  const handleStartTest = (testId: string) => {
    // In a real app, this would dispatch an action to start the test
    console.log('Starting test:', testId);
  };
  
  const handleStopTest = (testId: string) => {
    // In a real app, this would dispatch an action to stop the test
    console.log('Stopping test:', testId);
  };
  
  // Mock performance data for visualization
  const getPerformanceData = () => {
    // In a real app, this would come from the API
    if (!testVariants.length) return [];
    
    return testVariants.map(variant => ({
      name: variant.variant_name,
      value: variant.performance?.clicks || Math.floor(Math.random() * 500) + 50
    }));
  };
  
  const getDailyPerformanceData = () => {
    // Mock daily performance data
    const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
    
    return days.map(day => {
      const data: any = { day };
      testVariants.forEach(variant => {
        data[variant.variant_name] = Math.floor(Math.random() * 100) + 10;
      });
      return data;
    });
  };
  
  const performanceData = getPerformanceData();
  const dailyData = getDailyPerformanceData();
  
  // Test overview component
  const TestOverview = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Active A/B Tests
      </Typography>
      {abTests.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No A/B tests found for this content. Create a new test to get started.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Test Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Variants</TableCell>
                <TableCell>Metrics</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {abTests.map((test) => (
                <TableRow key={test.id} hover>
                  <TableCell>{test.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                      color={test.status === 'active' ? 'success' : test.status === 'completed' ? 'info' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{testVariants.length || '...'}</TableCell>
                  <TableCell>
                    {test.metrics.map((metric, index) => (
                      <Chip
                        key={index}
                        label={metric}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => navigate(`/content/${id}/abtests/${test.id}`)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    {test.status === 'active' ? (
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleStopTest(test.id)}
                      >
                        <StopIcon fontSize="small" />
                      </IconButton>
                    ) : (
                      <IconButton 
                        size="small" 
                        color="success"
                        onClick={() => handleStartTest(test.id)}
                        disabled={test.status === 'completed'}
                      >
                        <StartIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Button 
        variant="contained" 
        color="primary" 
        startIcon={<AddIcon />}
        onClick={() => navigate(`/content/${id}/abtests/new`)}
      >
        Create New A/B Test
      </Button>
    </Box>
  );
  
  // Test editor component
  const TestEditor = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        {isNewTest ? 'Create New A/B Test' : 'Edit A/B Test'}
      </Typography>
      
      {formError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {formError}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Test Name"
            name="name"
            value={testForm.name}
            onChange={handleInputChange}
            required
            sx={{ mb: 3 }}
          />
          
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">Metrics to Track</FormLabel>
            <RadioGroup row>
              <FormControlLabel
                control={<Radio checked={testForm.metrics.includes('clicks')} onChange={handleMetricChange} value="clicks" />}
                label="Clicks"
              />
              <FormControlLabel
                control={<Radio checked={testForm.metrics.includes('views')} onChange={handleMetricChange} value="views" />}
                label="Views"
              />
              <FormControlLabel
                control={<Radio checked={testForm.metrics.includes('engagement')} onChange={handleMetricChange} value="engagement" />}
                label="Engagement"
              />
              <FormControlLabel
                control={<Radio checked={testForm.metrics.includes('shares')} onChange={handleMetricChange} value="shares" />}
                label="Shares"
              />
            </RadioGroup>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Content Information
              </Typography>
              <Typography variant="body2">
                <strong>Title:</strong> {contentDraft?.title}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {contentDraft?.status}
              </Typography>
              <Typography variant="body2">
                <strong>Topics:</strong> {contentDraft?.topics.join(', ')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Test Variants
          </Typography>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2}>
              {variants.map((variant, index) => (
                <Grid item xs={12} key={index}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardHeader
                      title={
                        editingVariantIndex === index ? (
                          <TextField
                            fullWidth
                            value={variant.variant_name}
                            onChange={(e) => handleVariantNameChange(e, index)}
                            size="small"
                          />
                        ) : variant.variant_name
                      }
                      action={
                        <>
                          <IconButton size="small" onClick={() => handleEditVariant(index)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          {!variant.is_control && (
                            <IconButton size="small" color="error" onClick={() => handleDeleteVariant(index)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </>
                      }
                      subheader={
                        <FormControlLabel
                          control={
                            <Radio
                              checked={variant.is_control}
                              onChange={() => handleControlChange(index)}
                              disabled={isViewingTest}
                            />
                          }
                          label="Control Variant"
                        />
                      }
                    />
                    {editingVariantIndex === index ? (
                      <CardContent>
                        <FormLabel>Variant Content</FormLabel>
                        <RichTextEditor
                          value={variant.content}
                          onChange={(content) => handleVariantContentChange(content, index)}
                        />
                      </CardContent>
                    ) : (
                      <CardContent sx={{ maxHeight: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Typography noWrap variant="body2" color="text.secondary">
                          {variant.content.substring(0, 150)}...
                        </Typography>
                      </CardContent>
                    )}
                  </Card>
                </Grid>
              ))}
              
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddVariant}
                  disabled={variants.length >= 5}
                >
                  Add Variant
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveTest}
            sx={{ mt: 2 }}
          >
            Save A/B Test
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
  
  // Test results component
  const TestResults = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Test Results
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Overall Performance</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={performanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Daily Performance</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {testVariants.map((variant, index) => (
                      <Line
                        key={variant.id}
                        type="monotone"
                        dataKey={variant.variant_name}
                        stroke={COLORS[index % COLORS.length]}
                        activeDot={{ r: 8 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recommendations
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" paragraph>
                Based on the current test results:
              </Typography>
              <ul>
                <li>
                  <Typography variant="body1">
                    {testVariants.length > 0 && 
                      `"${performanceData[0]?.name}" is currently performing best with ${performanceData[0]?.value} clicks.`}
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1">
                    Consider running the test for at least 7 more days to get statistically significant results.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1">
                    For future tests, try testing different headlines to improve initial engagement.
                  </Typography>
                </li>
              </ul>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(`/content/${id}`)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1">A/B Testing</Typography>
          {contentDraft && (
            <Typography variant="subtitle1" color="text.secondary">
              {contentDraft.title}
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
          {isViewingTest ? (
            <Paper sx={{ p: 3, mb: 4 }}>
              <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab icon={<EditIcon />} label="Test Setup" />
                <Tab icon={<BarChart />} label="Results" />
              </Tabs>
              
              {activeTab === 0 && <TestEditor />}
              {activeTab === 1 && <TestResults />}
            </Paper>
          ) : isNewTest ? (
            <Paper sx={{ p: 3, mb: 4 }}>
              <TestEditor />
            </Paper>
          ) : (
            <TestOverview />
          )}
        </>
      )}
    </Box>
  );
};

export default ContentABTest;