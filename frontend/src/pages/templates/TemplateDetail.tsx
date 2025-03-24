import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Button, 
  Grid, 
  Chip, 
  TextField, 
  CircularProgress, 
  Alert, 
  Tabs, 
  Tab, 
  Card, 
  CardContent, 
  Rating, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Modal
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  Favorite as FavoriteIcon, 
  FavoriteBorder as FavoriteBorderIcon,
  ContentCopy as ContentCopyIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Preview as PreviewIcon,
  AutoAwesome as GenerateIcon,
  Save as SaveIcon,
  Image as ImageIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import contentGenerationApi, { 
  Template, 
  GenerationResponse, 
  TemplateVariable 
} from '../../services/contentGenerationService';
import healthWellnessTemplates from '../../healthWellnessTemplates';

// Simple markdown to HTML converter for preview purposes
const markdownToHtml = (markdown: string): string => {
  let html = markdown;
  
  // Convert headers
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  
  // Convert bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert lists
  html = html.replace(/^\s*-\s*(.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>');
  
  // Convert paragraph breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/<\/p><p>$/, '');
  
  // Wrap in paragraphs if not already
  if (!html.startsWith('<h1>') && !html.startsWith('<ul>') && !html.startsWith('<p>')) {
    html = '<p>' + html + '</p>';
  }
  
  return html;
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
      id={`template-tabpanel-${index}`}
      aria-labelledby={`template-tab-${index}`}
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

interface TemplateDetailProps {
  testMode?: boolean;
  useMode?: boolean;
}

const TemplateDetail: React.FC<TemplateDetailProps> = ({ testMode = false, useMode = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(useMode ? 1 : 0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [generationLoading, setGenerationLoading] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [variableErrors, setVariableErrors] = useState<Record<string, string>>({});
  const [isContentCopied, setIsContentCopied] = useState(false);
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load template data
  useEffect(() => {
    const fetchTemplate = async () => {
      setLoading(true);
      try {
        // For development purposes, we're using local data
        // In production, this would be an API call
        // const response = await contentGenerationApi.getTemplateById(id!);
        // setTemplate(response.data);
        
        // For now, we find the template in our local data
        const foundTemplate = healthWellnessTemplates.find(t => t.id === id);
        
        if (foundTemplate) {
          setTemplate(foundTemplate);
          
          // Initialize form values with default values from template
          const initialValues: Record<string, any> = {};
          foundTemplate.variables.forEach(variable => {
            initialValues[variable.name] = variable.default_value || '';
          });
          setFormValues(initialValues);
          
          // Initialize tone if available in template variables
          const toneVariable = foundTemplate.variables.find(v => v.name === 'tone');
          if (toneVariable && toneVariable.type === 'select' && toneVariable.options) {
            setSelectedTone(toneVariable.options[0].value);
          }
        } else {
          setError('Template not found');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading template');
        console.error('Error loading template:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle form value changes
  const handleFormValueChange = (name: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (variableErrors[name]) {
      setVariableErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };
  
  // Handle tone selection
  const handleToneChange = (event: SelectChangeEvent<string>) => {
    setSelectedTone(event.target.value);
    
    // Update form values if tone is a variable
    if (template?.variables.some(v => v.name === 'tone')) {
      handleFormValueChange('tone', event.target.value);
    }
  };
  
  // Toggle favorite status
  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        // await contentGenerationApi.unfavoriteTemplate(id!);
        console.log('Unfavorited template:', id);
      } else {
        // await contentGenerationApi.favoriteTemplate(id!);
        console.log('Favorited template:', id);
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Error toggling favorite status:', err);
    }
  };
  
  // Generate content from template
  const handleGenerateContent = async () => {
    // Validate required fields
    const errors: Record<string, string> = {};
    template?.variables.forEach(variable => {
      if (variable.required && !formValues[variable.name]) {
        errors[variable.name] = 'This field is required';
      }
    });
    
    if (Object.keys(errors).length > 0) {
      setVariableErrors(errors);
      return;
    }
    
    setGenerationLoading(true);
    setGenerationError(null);
    
    try {
      // For implementing an actual API call in the future
      // const response = await contentGenerationApi.generateContent({
      //   content_type: template!.content_type,
      //   template_id: template!.id,
      //   variables: formValues,
      // });
      
      // For demo purposes, process the content with variable replacement
      let generatedResult = template!.content;
      
      // First, apply selected tone modifications if applicable
      if (selectedTone && template!.tone_options) {
        const toneOption = template!.tone_options.find(t => t.id === selectedTone);
        if (toneOption && toneOption.modifications && toneOption.modifications.content) {
          generatedResult = toneOption.modifications.content;
        }
      }
      
      // Replace all dynamic field placeholders
      Object.entries(formValues).forEach(([key, value]) => {
        const regex = new RegExp(`{${key}}`, 'g');
        generatedResult = generatedResult.replace(regex, String(value));
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGeneratedContent(generatedResult);
    } catch (err: any) {
      setGenerationError(err.message || 'Error generating content');
      console.error('Error generating content:', err);
    } finally {
      setGenerationLoading(false);
    }
  };
  
  // Copy generated content to clipboard
  const handleCopyContent = () => {
    navigator.clipboard.writeText(generatedContent)
      .then(() => {
        setIsContentCopied(true);
        setTimeout(() => setIsContentCopied(false), 2000);
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
      });
  };
  
  // Handle image search
  const handleOpenImageSearch = () => {
    setImageSearchOpen(true);
    if (searchQuery === '') {
      // Initialize with a default query based on template type
      if (template?.content_type === 'blog') {
        setSearchQuery('wellness blog');
      } else if (template?.content_type === 'email') {
        setSearchQuery('healthy food');
      } else if (template?.content_type === 'social') {
        setSearchQuery('fitness lifestyle');
      } else {
        setSearchQuery('wellness');
      }
      handleImageSearch();
    }
  };
  
  const handleImageSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      // Mock API call to Unsplash or similar service
      // In production, this would be a real API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock search results
      const mockResults = [
        'https://images.unsplash.com/photo-1545205597-3d9d02c29597?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'https://images.unsplash.com/photo-1517971129774-8a2b38fa128e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'https://images.unsplash.com/photo-1487530811176-3780de880c2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'https://images.unsplash.com/photo-1455853659719-4b521eebc76d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
      ];
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error searching for images:', error);
    } finally {
      setSearchLoading(false);
    }
  };
  
  const handleSelectImage = (imageUrl: string) => {
    // Find the image-related field in form values and update it
    if (formValues['main_image_url']) {
      setFormValues({
        ...formValues,
        main_image_url: imageUrl
      });
    } else if (formValues['preview_image']) {
      setFormValues({
        ...formValues,
        preview_image: imageUrl
      });
    } else if (template?.preview_image) {
      // Create a copy of the template with the new image
      setTemplate({
        ...template,
        preview_image: imageUrl
      });
    }
    
    setImageSearchOpen(false);
  };
  
  // Submit rating
  const handleSubmitRating = async (newValue: number | null) => {
    if (newValue === null) return;
    
    try {
      setUserRating(newValue);
      // In production this would call the API
      // await contentGenerationApi.rateTemplate(id!, { score: newValue });
      console.log('Submitted rating:', newValue);
    } catch (err) {
      console.error('Error submitting rating:', err);
    }
  };
  
  // Render variable input based on type
  const renderVariableInput = (variable: TemplateVariable) => {
    const error = variableErrors[variable.name];
    
    switch (variable.type) {
      case 'text':
        return (
          <TextField
            multiline
            rows={4}
            fullWidth
            label={variable.label}
            value={formValues[variable.name] || ''}
            onChange={(e) => handleFormValueChange(variable.name, e.target.value)}
            placeholder={variable.description}
            margin="normal"
            error={!!error}
            helperText={error}
            required={variable.required}
          />
        );
      case 'select':
        return (
          <FormControl 
            fullWidth 
            margin="normal"
            error={!!error}
            required={variable.required}
          >
            <InputLabel id={`${variable.name}-label`}>{variable.label}</InputLabel>
            <Select
              labelId={`${variable.name}-label`}
              value={formValues[variable.name] || ''}
              onChange={(e) => handleFormValueChange(variable.name, e.target.value)}
              label={variable.label}
            >
              {variable.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && (
              <Typography variant="caption" color="error">
                {error}
              </Typography>
            )}
          </FormControl>
        );
      default:
        return (
          <TextField
            fullWidth
            label={variable.label}
            value={formValues[variable.name] || ''}
            onChange={(e) => handleFormValueChange(variable.name, e.target.value)}
            placeholder={variable.description}
            margin="normal"
            error={!!error}
            helperText={error}
            required={variable.required}
          />
        );
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !template) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Template not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/content/templates')}
        >
          Back to Templates
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header with back button */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/content/templates')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {template.name}
        </Typography>
        <IconButton 
          onClick={handleToggleFavorite}
          color={isFavorite ? 'error' : 'default'}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>
        <IconButton aria-label="Share template">
          <ShareIcon />
        </IconButton>
      </Box>
      
      {/* Template metadata */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {template.description}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={template.content_type} color="primary" size="small" />
            {template.tags.map((tag, index) => (
              <Chip key={index} label={tag} size="small" />
            ))}
            {template.is_featured && (
              <Chip label="Featured" color="secondary" size="small" />
            )}
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Template Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Category:</strong> {template.category}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Version:</strong> {template.version}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Created:</strong> {new Date(template.created_at).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Last Updated:</strong> {new Date(template.updated_at).toLocaleDateString()}
              </Typography>
              {template.author && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Created by:</strong> {template.author}
                </Typography>
              )}
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>Rate this template:</Typography>
                <Rating
                  name="template-rating"
                  value={userRating}
                  onChange={(event, newValue) => {
                    handleSubmitRating(newValue);
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs for Preview and Customize */}
      <Box sx={{ width: '100%' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="template tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Preview" icon={<PreviewIcon />} iconPosition="start" />
          <Tab label="Customize & Generate" icon={<EditIcon />} iconPosition="start" />
          {testMode && <Tab label="Test Variations" icon={<ContentCopyIcon />} iconPosition="start" />}
        </Tabs>
        
        {/* Preview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
            {template.preview_image && (
              <Box sx={{ mb: 3, textAlign: 'center', position: 'relative' }}>
                <img 
                  src={template.preview_image} 
                  alt={`Preview of ${template.title}`}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px', 
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                {template.preview_image.includes('unsplash.com') && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Photo via <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
                  </Typography>
                )}
                <IconButton
                  onClick={handleOpenImageSearch}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                    }
                  }}
                  size="small"
                >
                  <ImageIcon />
                </IconButton>
              </Box>
            )}
            <Typography variant="h6" gutterBottom>Template Structure</Typography>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word', 
              backgroundColor: '#f5f5f5', 
              padding: '1rem', 
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: 1.5
            }}>
              {template.template_content}
            </pre>
            
            {template.sample_output && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Sample Output</Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    backgroundColor: '#f9f9f9',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {template.sample_output}
                </Paper>
              </>
            )}
          </Paper>
        </TabPanel>
        
        {/* Customize & Generate Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Customize Template</Typography>
                
                {/* Tone selection if available */}
                {template.variables.some(v => v.name === 'tone' && v.type === 'select') && (
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="tone-select-label">Content Tone</InputLabel>
                    <Select
                      labelId="tone-select-label"
                      value={selectedTone}
                      onChange={handleToneChange}
                      label="Content Tone"
                    >
                      {template.variables
                        .find(v => v.name === 'tone')?.options?.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                )}
                
                {/* Dynamic form inputs based on template variables */}
                {template.variables.map((variable) => (
                  <Box key={variable.name}>
                    {variable.name !== 'tone' && renderVariableInput(variable)}
                  </Box>
                ))}
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleGenerateContent}
                    disabled={generationLoading}
                    startIcon={generationLoading ? <CircularProgress size={20} /> : <GenerateIcon />}
                  >
                    {generationLoading ? 'Generating...' : 'Generate Content'}
                  </Button>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper elevation={0} variant="outlined" sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Generated Content</Typography>
                  {generatedContent && (
                    <IconButton 
                      onClick={handleCopyContent} 
                      size="small"
                      color={isContentCopied ? 'success' : 'default'}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  )}
                </Box>
                
                {generationError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {generationError}
                  </Alert>
                )}
                
                {generationLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    {generatedContent ? (
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          backgroundColor: '#f9f9f9',
                          overflowY: 'auto',
                          height: '100%'
                        }}
                      >
                        {generatedContent.includes('<html') || generatedContent.includes('<!DOCTYPE') ? (
                          <Box sx={{ height: '100%' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                              HTML Email Preview:
                            </Typography>
                            <Box sx={{ 
                              border: '1px solid #ddd', 
                              borderRadius: '4px',
                              height: 'calc(100% - 30px)',
                              overflow: 'auto'
                            }}>
                              <iframe 
                                srcDoc={generatedContent}
                                title="HTML Email Preview"
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  border: 'none' 
                                }}
                              />
                            </Box>
                          </Box>
                        ) : generatedContent.startsWith('#') || generatedContent.includes('##') ? (
                          <Box sx={{ 
                            p: 1, 
                            whiteSpace: 'pre-line',
                            '& h1': { fontSize: '1.5rem', mt: 0, mb: 2 },
                            '& h2': { fontSize: '1.25rem', mt: 2, mb: 1 },
                            '& h3': { fontSize: '1.1rem', fontWeight: 'bold', mt: 1.5, mb: 0.75 },
                            '& p': { mb: 1.5 },
                            '& ul, & ol': { pl: 2.5, mb: 1.5 }
                          }} 
                          dangerouslySetInnerHTML={{ __html: markdownToHtml(generatedContent) }} 
                          />
                        ) : generatedContent.includes('📷') ? (
                          <Box sx={{ whiteSpace: 'pre-line' }}>
                            <Box sx={{ 
                              border: '1px dashed #ccc', 
                              p: 2, 
                              mb: 2, 
                              borderRadius: '4px',
                              backgroundColor: '#f0f0f0',
                              textAlign: 'center'
                            }}>
                              <Typography variant="caption" color="text.secondary">Instagram Post Preview</Typography>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {generatedContent.split('\n\n')[0]}
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {generatedContent.split('\n\n')[1]}
                            </Typography>
                            <Typography>
                              {generatedContent.split('\n\n').slice(2).join('\n\n')}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography sx={{ whiteSpace: 'pre-line' }}>
                            {generatedContent}
                          </Typography>
                        )}
                      </Paper>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100%',
                        color: 'text.secondary',
                        textAlign: 'center',
                        p: 3,
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px'
                      }}>
                        <Typography>
                          Fill in the template variables and click "Generate Content" to see your customized content here.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
                
                {generatedContent && (
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Button 
                      variant="outlined" 
                      onClick={handleCopyContent}
                      startIcon={<ContentCopyIcon />}
                    >
                      {isContentCopied ? 'Copied!' : 'Copy to Clipboard'}
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<SaveIcon />}
                    >
                      Save as Draft
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Test Variations Tab (only shown in test mode) */}
        {testMode && (
          <TabPanel value={tabValue} index={2}>
            <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Test Template Variations
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This area allows creating and testing different variations of this template.
                Testing functionality will be implemented in future iterations.
              </Typography>
            </Paper>
          </TabPanel>
        )}
      </Box>
      
      {/* Image Search Modal */}
      <Dialog 
        open={imageSearchOpen} 
        onClose={() => setImageSearchOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Search Stock Images
          <IconButton
            onClick={() => setImageSearchOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Search for images (e.g., wellness, healthy food, yoga)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleImageSearch()}
              sx={{ flexGrow: 1 }}
            />
            <Button 
              variant="contained" 
              onClick={handleImageSearch}
              startIcon={<SearchIcon />}
              disabled={searchLoading}
            >
              Search
            </Button>
          </Box>
          
          {searchLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {searchResults.map((imageUrl, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Box
                    sx={{
                      position: 'relative',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      borderRadius: 1,
                      '&:hover': {
                        '& .overlay': {
                          opacity: 1
                        },
                        '& img': {
                          transform: 'scale(1.05)'
                        }
                      }
                    }}
                    onClick={() => handleSelectImage(imageUrl)}
                  >
                    <img
                      src={imageUrl}
                      alt={`Search result ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                    <Box
                      className="overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      <Button variant="contained" color="primary" size="small">
                        Select
                      </Button>
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                    Unsplash
                  </Typography>
                </Grid>
              ))}
            </Grid>
          )}
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
            Images provided by Unsplash. Images are for preview purposes only.
            <br />
            Usage may require proper licensing and attribution.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageSearchOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateDetail;