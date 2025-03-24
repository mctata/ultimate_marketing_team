import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  CompareArrows as CompareArrowsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import healthWellnessTemplates from '../../healthWellnessTemplates';
import { useTemplates } from '../../hooks/useContentGeneration';
import { Generate } from '../../hooks/useContentGeneration';
import contentGenerationApi from '../../services/contentGenerationService';
import { useToast } from '../../components/common/ToastNotification';
import useApiError from '../../hooks/useApiError';

interface TestCase {
  id: string;
  name: string;
  templateId: string;
  variables: Record<string, any>;
  result?: string;
  isRunning?: boolean;
  error?: string;
  createDate: string;
}

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
      id={`test-tabpanel-${index}`}
      aria-labelledby={`test-tab-${index}`}
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

const TemplateTestWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [currentTestCase, setCurrentTestCase] = useState<TestCase | null>(null);
  const [newTestCaseName, setNewTestCaseName] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Get templates from API
  const { templatesQuery } = useTemplates();
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setApiError(null);
      
      try {
        // Fetch templates from API
        let templatesData = [];
        
        if (templatesQuery.isSuccess && templatesQuery.data) {
          templatesData = templatesQuery.data;
          setTemplates(templatesData);
        } else if (templatesQuery.isError) {
          console.error('API error loading templates, falling back to local data');
          templatesData = healthWellnessTemplates;
          setTemplates(healthWellnessTemplates);
          setApiError('Could not load templates from API, using local templates instead.');
        } else {
          // If the query is still loading, use local templates as fallback
          templatesData = healthWellnessTemplates;
          setTemplates(healthWellnessTemplates);
        }
        
        // Create some initial test cases
        if (templatesData.length > 0) {
          setSelectedTemplateId(templatesData[0].id);
          
          const template = templatesData[0];
          const initialVars: Record<string, any> = {};
          
          template.variables.forEach(v => {
            initialVars[v.name] = v.default_value || '';
          });
          
          const testCaseId = `test-${Date.now()}`;
          
          try {
            // Try to load saved test cases from localStorage
            const savedTestCases = localStorage.getItem('templateTestCases');
            if (savedTestCases) {
              const parsedTestCases = JSON.parse(savedTestCases) as TestCase[];
              setTestCases(parsedTestCases);
              
              // Find a test case for the selected template
              const templateTestCase = parsedTestCases.find(tc => tc.templateId === template.id);
              if (templateTestCase) {
                setCurrentTestCase(templateTestCase);
              } else {
                // No test case for this template, create a new one
                const newTestCase: TestCase = {
                  id: testCaseId,
                  name: 'Default Test Case',
                  templateId: template.id,
                  variables: initialVars,
                  result: template.sample_output,
                  createDate: new Date().toISOString()
                };
                
                setTestCases([...parsedTestCases, newTestCase]);
                setCurrentTestCase(newTestCase);
              }
            } else {
              // No saved test cases, create a new one
              const newTestCase: TestCase = {
                id: testCaseId,
                name: 'Default Test Case',
                templateId: template.id,
                variables: initialVars,
                result: template.sample_output,
                createDate: new Date().toISOString()
              };
              
              setTestCases([newTestCase]);
              setCurrentTestCase(newTestCase);
            }
          } catch (error) {
            console.error('Error loading saved test cases:', error);
            
            // Fallback to creating a new test case
            const newTestCase: TestCase = {
              id: testCaseId,
              name: 'Default Test Case',
              templateId: template.id,
              variables: initialVars,
              result: template.sample_output,
              createDate: new Date().toISOString()
            };
            
            setTestCases([newTestCase]);
            setCurrentTestCase(newTestCase);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setApiError('An error occurred while loading data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [templatesQuery.data, templatesQuery.isSuccess, templatesQuery.isError]);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle template change
  const handleTemplateChange = (event: SelectChangeEvent<string>) => {
    const templateId = event.target.value;
    setSelectedTemplateId(templateId);
    
    // Filter test cases for this template
    const filteredTestCases = testCases.filter(tc => tc.templateId === templateId);
    
    if (filteredTestCases.length > 0) {
      setCurrentTestCase(filteredTestCases[0]);
    } else {
      // Create a new test case for this template
      // First try to find the template in the API-loaded templates
      const template = templates.find(t => t.id === templateId);
      
      if (template) {
        const initialVars: Record<string, any> = {};
        
        template.variables.forEach(v => {
          initialVars[v.name] = v.default_value || '';
        });
        
        const newTestCase: TestCase = {
          id: `new-${Date.now()}`,
          name: `${template.name} Test`,
          templateId: template.id,
          variables: initialVars,
          createDate: new Date().toISOString()
        };
        
        // Add new test case
        const updatedTestCases = [...testCases, newTestCase];
        setTestCases(updatedTestCases);
        setCurrentTestCase(newTestCase);
        
        // Save to local storage
        try {
          localStorage.setItem('templateTestCases', JSON.stringify(updatedTestCases));
        } catch (error) {
          console.error('Error saving test cases to localStorage:', error);
        }
      }
    }
  };
  
  // Handle selecting a test case
  const handleSelectTestCase = (testCase: TestCase) => {
    setCurrentTestCase(testCase);
  };
  
  // Handle variable change
  const handleVariableChange = (variableName: string, value: any) => {
    if (!currentTestCase) return;
    
    setCurrentTestCase({
      ...currentTestCase,
      variables: {
        ...currentTestCase.variables,
        [variableName]: value
      }
    });
  };
  
  // Handle creating a new test case
  const handleCreateTestCase = () => {
    if (!selectedTemplateId || !newTestCaseName.trim()) return;
    
    const template = templates.find(t => t.id === selectedTemplateId);
    
    if (template) {
      const initialVars: Record<string, any> = {};
      
      template.variables.forEach(v => {
        initialVars[v.name] = v.default_value || '';
      });
      
      const newTestCase: TestCase = {
        id: `new-${Date.now()}`,
        name: newTestCaseName.trim(),
        templateId: template.id,
        variables: initialVars,
        createDate: new Date().toISOString()
      };
      
      const updatedTestCases = [...testCases, newTestCase];
      setTestCases(updatedTestCases);
      setCurrentTestCase(newTestCase);
      setNewTestCaseName('');
      
      // Save to local storage
      try {
        localStorage.setItem('templateTestCases', JSON.stringify(updatedTestCases));
      } catch (error) {
        console.error('Error saving test cases to localStorage:', error);
      }
    }
  };
  
  // Handle deleting a test case
  const handleDeleteTestCase = (testCaseId: string) => {
    const updatedTestCases = testCases.filter(tc => tc.id !== testCaseId);
    setTestCases(updatedTestCases);
    
    if (currentTestCase?.id === testCaseId) {
      setCurrentTestCase(updatedTestCases.length > 0 ? updatedTestCases[0] : null);
    }
    
    // Save to local storage
    try {
      localStorage.setItem('templateTestCases', JSON.stringify(updatedTestCases));
    } catch (error) {
      console.error('Error saving test cases to localStorage:', error);
    }
  };
  
  // Handle running a test case
  const handleRunTestCase = async () => {
    if (!currentTestCase) return;
    
    // Set this test case to running state
    setCurrentTestCase({
      ...currentTestCase,
      isRunning: true,
      error: undefined
    });
    
    try {
      // Use the actual API to render the template
      const template = templates.find(t => t.id === currentTestCase.templateId);
      
      if (template) {
        try {
          // Call the real template render API
          const response = await contentGenerationApi.renderTemplate(
            currentTestCase.templateId, 
            currentTestCase.variables
          );
          
          // Update the test case with the result
          const updatedTestCase = {
            ...currentTestCase,
            result: response.rendered,
            isRunning: false
          };
          
          setCurrentTestCase(updatedTestCase);
          
          // Update the test cases array
          const updatedTestCases = testCases.map(tc => 
            tc.id === currentTestCase.id ? updatedTestCase : tc
          );
          
          setTestCases(updatedTestCases);
          
          // Save to local storage
          try {
            localStorage.setItem('templateTestCases', JSON.stringify(updatedTestCases));
          } catch (error) {
            console.error('Error saving test cases to localStorage:', error);
          }
        } catch (apiError: any) {
          console.error('API error rendering template:', apiError);
          
          // Fallback to local rendering if API fails
          let result = template.template_content;
          
          Object.entries(currentTestCase.variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, String(value));
          });
          
          // Update the test case with the result
          const updatedTestCase = {
            ...currentTestCase,
            result,
            isRunning: false
          };
          
          setCurrentTestCase(updatedTestCase);
          
          // Update the test cases array
          const updatedTestCases = testCases.map(tc => 
            tc.id === currentTestCase.id ? updatedTestCase : tc
          );
          
          setTestCases(updatedTestCases);
          
          // Save to local storage
          try {
            localStorage.setItem('templateTestCases', JSON.stringify(updatedTestCases));
          } catch (error) {
            console.error('Error saving test cases to localStorage:', error);
          }
        }
      }
    } catch (error: any) {
      // Handle error
      setCurrentTestCase({
        ...currentTestCase,
        isRunning: false,
        error: error.message || 'Error running test case'
      });
    }
  };
  
  // Handle saving the test case
  const handleSaveTestCase = () => {
    if (!currentTestCase) return;
    
    // Update the test cases array
    const updatedTestCases = testCases.map(tc => 
      tc.id === currentTestCase.id ? currentTestCase : tc
    );
    
    setTestCases(updatedTestCases);
    
    // Save to local storage
    try {
      localStorage.setItem('templateTestCases', JSON.stringify(updatedTestCases));
      // Show success message (would be done with a toast in a real app)
      console.log('Test case saved:', currentTestCase);
    } catch (error) {
      console.error('Error saving test cases to localStorage:', error);
    }
  };
  
  // Get the current template
  const currentTemplate = templates.find(t => t.id === selectedTemplateId);
  
  // Filter test cases for the selected template
  const filteredTestCases = testCases.filter(tc => tc.templateId === selectedTemplateId);
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/content/templates')}
          sx={{ mr: 2 }}
        >
          Back to Templates
        </Button>
        <Typography variant="h4" component="h1" fontWeight="bold" sx={{ flexGrow: 1 }}>
          Template Test Workspace
        </Typography>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Error alert */}
          {apiError && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {apiError}
            </Alert>
          )}
          
          {/* Template Selection */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="template-select-label">Select Template</InputLabel>
                <Select
                  labelId="template-select-label"
                  value={selectedTemplateId}
                  onChange={handleTemplateChange}
                  label="Select Template"
                >
                  {templates.map(template => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {currentTemplate && (
            <>
              {/* Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="test workspace tabs">
                  <Tab label="Test Cases" />
                  <Tab label="Test Runner" />
                  <Tab label="Comparison" />
                </Tabs>
              </Box>
              
              {/* Test Cases Tab */}
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Test Cases
                      </Typography>
                      
                      {filteredTestCases.length > 0 ? (
                        <Box sx={{ mt: 2 }}>
                          {filteredTestCases.map(testCase => (
                            <Card 
                              key={testCase.id}
                              variant="outlined"
                              sx={{ 
                                mb: 2, 
                                cursor: 'pointer',
                                borderColor: currentTestCase?.id === testCase.id ? 'primary.main' : 'divider'
                              }}
                              onClick={() => handleSelectTestCase(testCase)}
                            >
                              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="subtitle2">
                                    {testCase.name}
                                  </Typography>
                                  <IconButton 
                                    size="small" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTestCase(testCase.id);
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  Created: {new Date(testCase.createDate).toLocaleDateString()}
                                </Typography>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      ) : (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          No test cases for this template yet.
                        </Alert>
                      )}
                      
                      <Divider sx={{ my: 3 }} />
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Create New Test Case
                      </Typography>
                      
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          placeholder="Test case name"
                          size="small"
                          value={newTestCaseName}
                          onChange={(e) => setNewTestCaseName(e.target.value)}
                        />
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleCreateTestCase}
                          disabled={!newTestCaseName.trim()}
                        >
                          Create
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={8}>
                    {currentTestCase ? (
                      <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                          <Typography variant="h6">
                            {currentTestCase.name}
                          </Typography>
                          <Button
                            variant="outlined"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveTestCase}
                          >
                            Save
                          </Button>
                        </Box>
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Template Variables
                        </Typography>
                        
                        <Grid container spacing={2}>
                          {currentTemplate.variables.map(variable => {
                            switch (variable.type) {
                              case 'text':
                                return (
                                  <Grid item xs={12} key={variable.name}>
                                    <TextField
                                      fullWidth
                                      multiline
                                      rows={4}
                                      label={variable.label}
                                      value={currentTestCase.variables[variable.name] || ''}
                                      onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                                      helperText={variable.description}
                                    />
                                  </Grid>
                                );
                              case 'select':
                                return (
                                  <Grid item xs={12} md={6} key={variable.name}>
                                    <FormControl fullWidth>
                                      <InputLabel>{variable.label}</InputLabel>
                                      <Select
                                        value={currentTestCase.variables[variable.name] || ''}
                                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                                        label={variable.label}
                                      >
                                        {variable.options?.map(option => (
                                          <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </Grid>
                                );
                              default:
                                return (
                                  <Grid item xs={12} md={6} key={variable.name}>
                                    <TextField
                                      fullWidth
                                      label={variable.label}
                                      value={currentTestCase.variables[variable.name] || ''}
                                      onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                                      helperText={variable.description}
                                    />
                                  </Grid>
                                );
                            }
                          })}
                        </Grid>
                      </Paper>
                    ) : (
                      <Alert severity="info">
                        Select a test case or create a new one to get started.
                      </Alert>
                    )}
                  </Grid>
                </Grid>
              </TabPanel>
              
              {/* Test Runner Tab */}
              <TabPanel value={tabValue} index={1}>
                {currentTestCase ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                      <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                          <Typography variant="h6">
                            {currentTestCase.name}
                          </Typography>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={currentTestCase.isRunning ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                            onClick={handleRunTestCase}
                            disabled={currentTestCase.isRunning}
                          >
                            {currentTestCase.isRunning ? 'Running...' : 'Run Test'}
                          </Button>
                        </Box>
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Template Variables
                        </Typography>
                        
                        {Object.entries(currentTestCase.variables).map(([key, value]) => (
                          <Box key={key} sx={{ mb: 2 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {currentTemplate.variables.find(v => v.name === key)?.label || key}:
                            </Typography>
                            <Paper 
                              variant="outlined" 
                              sx={{ 
                                p: 1, 
                                mt: 0.5, 
                                bgcolor: 'background.paper' 
                              }}
                            >
                              <Typography variant="body2">
                                {typeof value === 'string' && value.includes('\n') 
                                  ? value.split('\n').map((line, i) => (
                                      <span key={i}>
                                        {line}
                                        <br />
                                      </span>
                                    ))
                                  : value}
                              </Typography>
                            </Paper>
                          </Box>
                        ))}
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={7}>
                      <Paper elevation={0} variant="outlined" sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                          <Typography variant="h6">
                            Test Result
                          </Typography>
                          {currentTestCase.result && (
                            <IconButton 
                              onClick={() => navigator.clipboard.writeText(currentTestCase.result || '')}
                              title="Copy to clipboard"
                            >
                              <ContentCopyIcon />
                            </IconButton>
                          )}
                        </Box>
                        
                        {currentTestCase.error ? (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            {currentTestCase.error}
                          </Alert>
                        ) : currentTestCase.isRunning ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                            <CircularProgress />
                          </Box>
                        ) : currentTestCase.result ? (
                          <Paper 
                            variant="outlined" 
                            sx={{ 
                              p: 2, 
                              bgcolor: 'background.paper', 
                              whiteSpace: 'pre-line',
                              overflow: 'auto',
                              maxHeight: '500px'
                            }}
                          >
                            {currentTestCase.result}
                          </Paper>
                        ) : (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                            <Typography color="text.secondary">
                              Run the test to see results here
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                ) : (
                  <Alert severity="info">
                    Select a test case from the "Test Cases" tab to run tests.
                  </Alert>
                )}
              </TabPanel>
              
              {/* Comparison Tab */}
              <TabPanel value={tabValue} index={2}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  The comparison feature allows you to compare the outputs of different template variations.
                  This functionality will be implemented in a future update.
                </Alert>
                
                <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Comparison Tool
                  </Typography>
                  <Typography variant="body2" paragraph>
                    You'll be able to compare:
                  </Typography>
                  <ul>
                    <li>Different templates with the same input variables</li>
                    <li>The same template with different input variables</li>
                    <li>Historical results from previous test runs</li>
                  </ul>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button
                      variant="outlined"
                      startIcon={<CompareArrowsIcon />}
                      disabled
                    >
                      Compare Test Cases
                    </Button>
                  </Box>
                </Paper>
              </TabPanel>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default TemplateTestWorkspace;