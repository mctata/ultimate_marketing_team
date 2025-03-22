import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  Tab,
  Tabs,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  Lightbulb as LightbulbIcon,
  Save as SaveIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

// Import our custom components
import TemplateSelector from '../../components/content/TemplateSelector';
import TemplateVariables from '../../components/content/TemplateVariables';
import GenerationProgress from '../../components/content/GenerationProgress';
import ContentQualityMetrics from '../../components/content/ContentQualityMetrics';
import PromptLibrary from '../../components/content/PromptLibrary';
import RichTextEditor from '../../components/content/RichTextEditor';
import ContentABTesting from '../../components/content/ContentABTesting';

// Import API services and hooks
import { useTemplates, useContentGeneration, useABTesting } from '../../hooks/useContentGeneration';
import contentGenerationApi, { 
  GenerationRequest, 
  GenerationResponse,
  ContentVariation,
  QualityAssessment,
  ABTest,
  ABTestRequest
} from '../../services/contentGenerationService';

// Example mock data for A/B test
const mockABTest: ABTest = {
  id: 'test-1',
  name: 'Landing Page Headline Test',
  description: 'Testing different headline variations for the new landing page',
  status: 'running',
  startDate: '2025-03-15',
  endDate: '2025-03-22',
  variants: [
    {
      id: 'var-1',
      name: 'Original Headline',
      content: 'Create Amazing Content with AI',
      status: 'running',
      isOriginal: true,
      metrics: {
        impressions: 1245,
        clicks: 87,
        conversions: 12,
        engagementRate: 65.4,
        ctr: 6.99,
        conversionRate: 13.79,
      },
    },
    {
      id: 'var-2',
      name: 'Benefit-focused Headline',
      content: 'Save 10 Hours Every Week with AI-Powered Content',
      status: 'running',
      metrics: {
        impressions: 1251,
        clicks: 106,
        conversions: 18,
        engagementRate: 72.1,
        ctr: 8.47,
        conversionRate: 16.98,
      },
    },
  ],
  metrics: {
    totalImpressions: 2496,
    totalClicks: 193,
    totalConversions: 30,
    confidence: 89,
  },
  targetAudience: 'Marketing professionals',
  conversionGoal: 'Free trial signup',
  trafficAllocation: 50,
};

// Example mock quality metrics
const mockQualityData: ContentQualityData = {
  overallScore: 84,
  metrics: {
    readability: 92,
    grammar: 95,
    seo: 78,
    engagement: 81,
    brandConsistency: 85,
  },
  strengths: [
    'Clear and concise language throughout',
    'Excellent grammar and punctuation',
    'Good use of heading structure for SEO',
    'Consistent brand voice and terminology',
  ],
  improvements: [
    'Could use more engaging introductory paragraph',
    'Consider adding more industry-specific keywords',
    'Some sentences are too long and complex',
  ],
  suggestions: [
    'Break up the third paragraph into smaller chunks for better readability',
    'Add a call-to-action at the end of each major section',
    'Include 2-3 more internal links to related content',
    'Consider using bulleted lists to highlight key benefits',
  ],
};

const ContentGenerator = () => {
  // API hooks
  const { templatesQuery } = useTemplates();
  const { generateContent, taskStatus, isGenerating, clearTaskStatus, assessContent, getQualityAssessment } = useContentGeneration();
  const { createABTest, abTestsQuery } = useABTesting();

  // UI state
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [generationTaskId, setGenerationTaskId] = useState<string>('');
  const [generationComplete, setGenerationComplete] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [generatedVariations, setGeneratedVariations] = useState<ContentVariation[]>([]);
  const [assessmentId, setAssessmentId] = useState<string>('');
  const [qualityAssessment, setQualityAssessment] = useState<QualityAssessment | null>(null);
  const [isLoadingAssessment, setIsLoadingAssessment] = useState(false);
  const [abTest, setAbTest] = useState<ABTest | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const steps = ['Select Template', 'Customize Variables', 'Generate Content', 'Review & Enhance'];
  
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };
  
  const handleVariablesChange = (variables: Record<string, string>) => {
    setTemplateVariables(variables);
  };
  
  // Watch for taskStatus updates
  useEffect(() => {
    if (taskStatus) {
      if (taskStatus.status === 'completed' && taskStatus.result) {
        setGeneratedVariations(taskStatus.result);
        setGeneratedContent(taskStatus.result[0]?.content || '');
        setGenerationComplete(true);
        
        // Request quality assessment for the generated content
        if (taskStatus.result[0]?.content) {
          setIsLoadingAssessment(true);
          
          // Determine content type from the template
          const contentType = templatesQuery.data?.find(t => t.id === selectedTemplate)?.content_type || 'blog';
          
          // Request quality assessment
          assessContent({ 
            content: taskStatus.result[0].content, 
            contentType 
          }).then((response) => {
            if (response && response.task_id) {
              setAssessmentId(response.task_id);
              
              // Wait a moment and then fetch the assessment
              setTimeout(() => {
                getQualityAssessment(response.task_id)
                  .then(assessmentData => {
                    setQualityAssessment(assessmentData);
                    setIsLoadingAssessment(false);
                  })
                  .catch(err => {
                    console.error('Error fetching quality assessment:', err);
                    setIsLoadingAssessment(false);
                  });
              }, 2000); // Give the backend some time to complete the assessment
            }
          }).catch(err => {
            console.error('Error requesting quality assessment:', err);
            setIsLoadingAssessment(false);
          });
        }
      } else if (taskStatus.status === 'failed') {
        setError(taskStatus.error || 'Content generation failed');
      }
    }
  }, [taskStatus, assessContent, getQualityAssessment, selectedTemplate, templatesQuery.data]);

  const startContentGeneration = useCallback(() => {
    // Clear any previous errors
    setError(null);
    setGenerationComplete(false);
    clearTaskStatus();
    
    // Prepare the request
    const request: GenerationRequest = {
      content_type: templatesQuery.data?.find(t => t.id === selectedTemplate)?.content_type || 'blog',
      template_id: selectedTemplate,
      variables: templateVariables,
      quality_assessment: true
    };
    
    // Generate content
    generateContent(request)
      .then(response => {
        if (response.task_id) {
          setGenerationTaskId(response.task_id);
        } else {
          setError('No task ID returned from generation request');
        }
      })
      .catch(err => {
        console.error('Error starting content generation:', err);
        setError('Failed to start content generation. Please try again.');
      });
  }, [selectedTemplate, templateVariables, generateContent, clearTaskStatus, templatesQuery.data]);

  const handleNext = () => {
    if (activeStep === 2) {
      // Start content generation
      startContentGeneration();
    }
    
    if (activeStep === 3) {
      // Create an A/B test with the generated content
      if (generatedVariations.length > 0) {
        const abTestRequest: ABTestRequest = {
          title: `A/B Test for ${templateVariables.title || 'Content'}`,
          content_variations: generatedVariations,
          metrics: ['clicks', 'conversions', 'engagement'],
          duration_days: 7
        };
        
        createABTest(abTestRequest)
          .then(response => {
            setAbTest(response);
          })
          .catch(err => {
            console.error('Error creating A/B test:', err);
            setError('Failed to create A/B test. Using mock data instead.');
            setAbTest(mockABTest);
          });
      } else {
        // Fallback to mock data if no real variations available
        setAbTest(mockABTest);
      }
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const handleReset = () => {
    setActiveStep(0);
    setSelectedTemplate('');
    setTemplateVariables({});
    setGenerationTaskId('');
    setGenerationComplete(false);
    setGeneratedContent('');
    setGeneratedVariations([]);
    setQualityAssessment(null);
    setAbTest(null);
    setError(null);
    clearTaskStatus();
  };
  
  const handleContentChange = (content: string) => {
    setGeneratedContent(content);
    
    // Update the variation array as well
    if (generatedVariations.length > 0) {
      const updatedVariations = [...generatedVariations];
      updatedVariations[0].content = content;
      setGeneratedVariations(updatedVariations);
    }
  };
  
  const handleApplySuggestion = (suggestion: string) => {
    // In a real application, this would intelligently apply the suggestion
    // For now, we'll just append it as a comment
    const updatedContent = generatedContent + `\n\n<!-- Applied suggestion: ${suggestion} -->`;
    setGeneratedContent(updatedContent);
    
    // Update the variation array as well
    if (generatedVariations.length > 0) {
      const updatedVariations = [...generatedVariations];
      updatedVariations[0].content = updatedContent;
      setGeneratedVariations(updatedVariations);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select a Template
            </Typography>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Featured Templates" />
              <Tab label="Prompt Library" />
            </Tabs>
            
            {tabValue === 0 ? (
              <TemplateSelector
                onSelect={handleTemplateSelect}
                selectedTemplateId={selectedTemplate}
              />
            ) : (
              <PromptLibrary
                onUsePrompt={(prompt) => {
                  // In a real app, we would convert the prompt to a template
                  handleTemplateSelect('blog-standard');
                }}
              />
            )}
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Customize Template Variables
            </Typography>
            <TemplateVariables
              templateId={selectedTemplate}
              onChange={handleVariablesChange}
              initialValues={templateVariables}
            />
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Content Generation
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <AlertTitle>Error</AlertTitle>
                {error}
              </Alert>
            )}
            
            {!generationComplete ? (
              <GenerationProgress
                taskId={generationTaskId}
                onCancel={() => {
                  // Reset to variables step
                  clearTaskStatus();
                  setActiveStep(1);
                }}
                onComplete={(result) => {
                  // Handle completion callback from progress component
                  if (result && result.length > 0) {
                    setGeneratedVariations(result);
                    setGeneratedContent(result[0].content);
                    setGenerationComplete(true);
                  }
                }}
              />
            ) : (
              <Alert severity="success" sx={{ mb: 3 }}>
                <AlertTitle>Generation Complete</AlertTitle>
                Your content has been successfully generated. Proceed to the next step to review and enhance your content.
              </Alert>
            )}
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Enhance
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle1" gutterBottom>
                  Generated Content
                </Typography>
                <RichTextEditor value={generatedContent} onChange={handleContentChange} />
              </Grid>
              
              <Grid item xs={12} md={4}>
                {isLoadingAssessment ? (
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" gutterBottom>
                      Analyzing content quality...
                    </Typography>
                    <CircularProgress size={40} />
                  </Paper>
                ) : (
                  <ContentQualityMetrics
                    assessment={qualityAssessment}
                    data={mockQualityData} // Fallback to mock data if no assessment
                    isLoading={isLoadingAssessment}
                    onApplySuggestion={handleApplySuggestion}
                  />
                )}
              </Grid>
            </Grid>
          </Box>
        );
      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              A/B Testing
            </Typography>
            
            {abTest ? (
              <ContentABTesting
                testId={abTest.id}
                initialTestData={abTest}
                onUpdateTest={(updatedTest) => {
                  setAbTest(updatedTest);
                }}
                onCreateVariant={(testId) => {
                  // Create a new variant from the existing content with modifications
                  if (generatedContent) {
                    const newContent = generatedContent.replace(
                      /(#\s.+)/,
                      "$1 - Alternative Version"
                    );
                    
                    // In a real app, we would make an API call here
                    alert('Creating new variant: ' + newContent.substring(0, 50) + '...');
                  }
                }}
                onViewContent={(content) => {
                  // Show content in a modal or edit view
                  alert('Viewing content: ' + content.substring(0, 50) + '...');
                }}
                onCompareVariants={(variantIds) => {
                  // Compare variants in a modal or dedicated view
                  alert('Comparing variants: ' + variantIds.join(', '));
                }}
              />
            ) : (
              <Alert severity="info">
                <AlertTitle>No A/B Test Created</AlertTitle>
                You haven't created any A/B tests yet. Create one to start testing different versions of your content.
              </Alert>
            )}
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton
            onClick={() => {
              // Navigate back to content list in a real app
            }}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Typography variant="h4" component="h1">
            AI Content Generator
          </Typography>
          
          <Tooltip title="Help and documentation">
            <IconButton sx={{ ml: 'auto' }}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Generator settings">
            <IconButton>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Generation history">
            <IconButton>
              <HistoryIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          {getStepContent(activeStep)}
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex' }}>
            <Button
              variant="outlined"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            
            <Box sx={{ flex: '1 1 auto' }} />
            
            {activeStep === steps.length && (
              <Button onClick={handleReset} variant="outlined" sx={{ mr: 1 }}>
                Create New Content
              </Button>
            )}
            
            {activeStep === 3 && (
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                sx={{ mr: 1 }}
                onClick={() => {
                  // Save the generated content
                  alert('Content saved!');
                }}
              >
                Save Draft
              </Button>
            )}
            
            {activeStep < steps.length && (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={(activeStep === 0 && !selectedTemplate) || 
                          (activeStep === 1 && Object.keys(templateVariables).length === 0) ||
                          (activeStep === 2 && (!generationComplete || isGenerating))}
              >
                {activeStep === steps.length - 1 ? 'Create A/B Test' : 'Next'}
              </Button>
            )}
          </Box>
        </Paper>
        
        {activeStep === 0 && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LightbulbIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Tips for Effective Content Generation</Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Choose the Right Template
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Select a template that best matches your content goal. Templates are designed for specific content types and purposes.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Be Specific with Variables
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      The more detailed and specific your variable inputs, the better your generated content will be. Provide clear context and details.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Review and Refine
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Always review and edit the generated content. Add your personal touch and ensure it aligns with your brand voice and style.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default ContentGenerator;