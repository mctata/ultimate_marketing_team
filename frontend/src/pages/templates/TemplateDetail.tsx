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
  FormGroup,
  FormControlLabel,
  Checkbox,
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
  Close as CloseIcon,
  Upload as UploadIcon,
  Collections as CollectionsIcon,
  Palette as PaletteIcon,
  PhotoCamera as PhotoCameraIcon,
  ImageSearch as ImageSearchIcon,
  CalendarToday as CalendarIcon,
  Send as SendIcon,
  Check as CheckIcon,
  ColorLens as ColorLensIcon
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
  const [tabValue, setTabValue] = useState(0); // Only one tab now (Customize & Generate)
  const [isFavorite, setIsFavorite] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [preGeneratedContent, setPreGeneratedContent] = useState<string>('');
  const [generationLoading, setGenerationLoading] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [variableErrors, setVariableErrors] = useState<Record<string, string>>({});
  const [isContentCopied, setIsContentCopied] = useState(false);
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [imageSearchTab, setImageSearchTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#0277bd');
  const [suggestedColor, setSuggestedColor] = useState('#4caf50');
  const [useRecommendedColor, setUseRecommendedColor] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');

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
      // In production, we would use the API call:
      // const response = await contentGenerationApi.generateContent({
      //   content_type: template!.content_type,
      //   template_id: template!.id,
      //   variables: formValues,
      // });
      // setGeneratedContent(response.data.content);
      
      // But for demo purposes, we'll process the content with variable replacement
      let generatedResult = '';
      
      // First determine the source content based on template or tone
      if (selectedTone && template!.tone_options) {
        const toneOption = template!.tone_options.find(t => t.id === selectedTone);
        if (toneOption && toneOption.modifications && toneOption.modifications.content) {
          generatedResult = toneOption.modifications.content;
        } else {
          generatedResult = template!.content;
        }
      } else {
        generatedResult = template!.content;
      }
      
      // Then replace all dynamic field placeholders with actual values
      Object.entries(formValues).forEach(([key, value]) => {
        if (value) { // Only replace if value exists
          const placeholder = `{${key}}`;
          const regex = new RegExp(escapeRegExp(placeholder), 'g');
          generatedResult = generatedResult.replace(regex, String(value));
        }
      });
      
      // Helper function to escape special regex characters
      function escapeRegExp(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setGeneratedContent(generatedResult);
      
      // If no content was generated, show an error
      if (!generatedResult.trim()) {
        setGenerationError('Failed to generate content. Please check your inputs and try again.');
      }
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
  
  // Handle image search modal open
  const handleOpenImageSearch = () => {
    setImageSearchOpen(true);
    setImageSearchTab(0); // Default to stock images tab
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
  
  // Handle image search tab change
  const handleImageSearchTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setImageSearchTab(newValue);
    
    // Initialize appropriate content based on tab
    if (newValue === 0 && searchResults.length === 0) {
      // Stock images tab
      handleImageSearch();
    } else if (newValue === 2 && generatedImages.length === 0) {
      // Image generation tab - set default prompt
      setImagePrompt(`${template?.title || 'Wellness'} image in professional style`);
    }
  };
  
  // Handle stock image search
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
  
  // Handle image selection from any source
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
  
  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setUploadedImage(file);
      
      // Create a preview URL for the uploaded image
      const imageUrl = URL.createObjectURL(file);
      handleSelectImage(imageUrl);
    }
  };
  
  // Handle image generation
  const handleGenerateImages = async () => {
    if (!imagePrompt.trim()) return;
    
    setIsGeneratingImages(true);
    try {
      // Mock API call to image generation service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock generated images
      const mockGeneratedImages = [
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'https://images.unsplash.com/photo-1447710441604-5bdc41bc6517?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
      ];
      
      setGeneratedImages(mockGeneratedImages);
    } catch (error) {
      console.error('Error generating images:', error);
    } finally {
      setIsGeneratingImages(false);
    }
  };
  
  // Open color picker dialog
  const handleOpenColorPicker = () => {
    setColorPickerOpen(true);
    
    // Generate a suggested complementary color
    const complementaryColor = generateComplementaryColor(selectedColor);
    setSuggestedColor(complementaryColor);
  };
  
  // Generate a complementary color (mock implementation)
  const generateComplementaryColor = (hexColor: string) => {
    // Simple implementation - real version would use color theory
    // Convert hex to RGB
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    
    // Generate complementary RGB
    const compR = 255 - r;
    const compG = 255 - g;
    const compB = 255 - b;
    
    // Convert back to hex
    return `#${compR.toString(16).padStart(2, '0')}${compG.toString(16).padStart(2, '0')}${compB.toString(16).padStart(2, '0')}`;
  };
  
  // Toggle using recommended color
  const handleToggleRecommendedColor = () => {
    setUseRecommendedColor(!useRecommendedColor);
    
    // Update form value with the selected color
    handleFormValueChange('primaryColor', useRecommendedColor ? selectedColor : suggestedColor);
  };
  
  // Apply color change
  const handleApplyColor = () => {
    const colorToUse = useRecommendedColor ? suggestedColor : selectedColor;
    handleFormValueChange('primaryColor', colorToUse);
    setColorPickerOpen(false);
  };
  
  // Open schedule dialog
  const handleOpenScheduleDialog = () => {
    setScheduleDialogOpen(true);
  };
  
  // Schedule content for posting
  const handleScheduleContent = () => {
    // Mock implementation - would call API to schedule in real app
    console.log('Scheduling content for posting');
    setScheduleDialogOpen(false);
  };
  
  // Generate a pre-generated content preview for immediate display
  useEffect(() => {
    if (template && formValues) {
      try {
        let previewContent = '';
        
        // First determine the source content based on template or tone
        if (selectedTone && template.tone_options) {
          const toneOption = template.tone_options.find(t => t.id === selectedTone);
          if (toneOption && toneOption.modifications && toneOption.modifications.content) {
            previewContent = toneOption.modifications.content;
          } else {
            previewContent = template.content;
          }
        } else {
          previewContent = template.content;
        }
        
        // Replace placeholders with actual values where available
        Object.entries(formValues).forEach(([key, value]) => {
          if (value) { // Only replace if value exists
            const placeholder = `{${key}}`;
            try {
              const regex = new RegExp(escapeRegExp(placeholder), 'g');
              previewContent = previewContent.replace(regex, String(value));
            } catch (e) {
              console.error(`Error replacing ${placeholder}:`, e);
            }
          }
        });
        
        // Helper function to escape special regex characters
        function escapeRegExp(string: string) {
          return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        
        setPreGeneratedContent(previewContent);
      } catch (e) {
        console.error('Error generating preview:', e);
      }
    }
  }, [template, formValues, selectedTone]);
  
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
      
      {/* Customize & Generate section */}
      <Box sx={{ width: '100%', mt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Customize Template</Typography>
                
                {/* Image Selection */}
                <Box sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="subtitle1" gutterBottom>Template Image</Typography>
                  <Box sx={{ position: 'relative', width: '100%', maxWidth: '300px', mb: 2 }}>
                    <img 
                      src={template.preview_image} 
                      alt={`Preview of ${template.title}`}
                      style={{ 
                        width: '100%',
                        aspectRatio: '16/9',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                    {template.preview_image.includes('unsplash.com') && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}>
                        <a 
                          href={`https://unsplash.com/photos/${template.preview_image.split('/').pop()?.split('?')[0]}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          Photo via Unsplash
                        </a>
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<ImageIcon />}
                      onClick={handleOpenImageSearch}
                      size="small"
                    >
                      Change Image
                    </Button>
                    <input
                      accept="image/*"
                      type="file"
                      id="image-upload"
                      style={{ display: 'none' }}
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<UploadIcon />}
                        size="small"
                      >
                        Upload
                      </Button>
                    </label>
                  </Box>
                </Box>
                
                {/* Color picker for newsletter templates */}
                {template.content_type === 'email' && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>Brand Colors</Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              borderRadius: '4px', 
                              backgroundColor: selectedColor,
                              mr: 1,
                              cursor: 'pointer',
                              border: '1px solid #ccc'
                            }}
                            onClick={handleOpenColorPicker}
                          />
                          <Typography variant="body2">Primary Brand Color</Typography>
                          <IconButton size="small" onClick={handleOpenColorPicker} sx={{ ml: 1 }}>
                            <ColorLensIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              borderRadius: '4px', 
                              backgroundColor: suggestedColor,
                              mr: 1,
                              border: '1px solid #ccc'
                            }}
                          />
                          <Typography variant="body2">Suggested Accent Color</Typography>
                          <IconButton 
                            size="small" 
                            color={useRecommendedColor ? "primary" : "default"}
                            onClick={handleToggleRecommendedColor}
                            sx={{ ml: 1 }}
                          >
                            {useRecommendedColor ? <CheckIcon fontSize="small" /> : <PaletteIcon fontSize="small" />}
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                
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
                  <Typography variant="h6">Content Preview & Generation</Typography>
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
                
                {/* Pre-generated content preview */}
                {preGeneratedContent && !generatedContent && !generationLoading && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Live Preview (as you type)
                    </Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        backgroundColor: '#f9f9f9',
                        overflowY: 'auto',
                        maxHeight: '150px',
                        position: 'relative'
                      }}
                    >
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        backgroundColor: 'rgba(255,255,255,0.7)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        zIndex: 1,
                        cursor: 'pointer'
                      }}>
                        <Typography variant="body2" color="text.secondary">
                          Preliminary preview. Click "Generate Content" for full rendering.
                        </Typography>
                      </Box>
                      
                      <Typography sx={{ whiteSpace: 'pre-line', zIndex: 0, opacity: 0.6 }}>
                        {preGeneratedContent.substring(0, 300)}
                        {preGeneratedContent.length > 300 && '...'}
                      </Typography>
                    </Paper>
                  </Box>
                )}
                
                {generationLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <CircularProgress sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Generating high-quality content for you...
                      </Typography>
                    </Box>
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
                
                {!generatedContent && !generationLoading ? (
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleGenerateContent}
                      disabled={generationLoading}
                      startIcon={<GenerateIcon />}
                    >
                      Generate Content
                    </Button>
                  </Box>
                ) : generatedContent && (
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Button 
                      variant="outlined" 
                      onClick={handleCopyContent}
                      startIcon={<ContentCopyIcon />}
                    >
                      {isContentCopied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Box>
                      <Button 
                        variant="outlined" 
                        startIcon={<CalendarIcon />}
                        onClick={handleOpenScheduleDialog}
                        sx={{ mr: 1 }}
                      >
                        Schedule
                      </Button>
                      <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={<SendIcon />}
                      >
                        Post Now
                      </Button>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
      </Box>
      
      {/* Image Search Modal with Tabs */}
      <Dialog 
        open={imageSearchOpen} 
        onClose={() => setImageSearchOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Select Image
          <IconButton
            onClick={() => setImageSearchOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Tabs
            value={imageSearchTab}
            onChange={handleImageSearchTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            variant="fullWidth"
          >
            <Tab icon={<ImageSearchIcon />} label="Stock Images" />
            <Tab icon={<CollectionsIcon />} label="Media Gallery" />
            <Tab icon={<PhotoCameraIcon />} label="Generate Image" />
          </Tabs>
          
          {/* Stock Images Tab */}
          {imageSearchTab === 0 && (
            <>
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
            </>
          )}
          
          {/* Media Gallery Tab */}
          {imageSearchTab === 1 && (
            <>
              <Box sx={{ textAlign: 'left', mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Brand Media Library</Typography>
                <Typography variant="body2" color="text.secondary">
                  Select from your previously uploaded brand images and media.
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <Grid item xs={12} sm={4} key={item}>
                    <Box
                      sx={{
                        position: 'relative',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        borderRadius: 1,
                        backgroundColor: '#f5f5f5',
                        height: '150px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e0e0e0',
                        '&:hover': {
                          boxShadow: 2
                        }
                      }}
                      onClick={() => handleSelectImage(`https://source.unsplash.com/random/300x200?sig=${item}`)}
                    >
                      <img
                        src={`https://source.unsplash.com/random/300x200?sig=${item}`}
                        alt={`Brand media ${item}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                      Brand Image {item}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
              
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <input
                  accept="image/*"
                  type="file"
                  id="media-upload"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <label htmlFor="media-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                  >
                    Upload New Media
                  </Button>
                </label>
              </Box>
            </>
          )}
          
          {/* Generate Image Tab */}
          {imageSearchTab === 2 && (
            <>
              <Box sx={{ textAlign: 'left', mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>AI Image Generation</Typography>
                <Typography variant="body2" color="text.secondary">
                  Describe the image you want to create, and our AI will generate unique options.
                </Typography>
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Describe the image you want (e.g., 'A serene yoga scene with ocean backdrop, professional photo, bright lighting')"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                sx={{ mb: 3 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Button 
                  variant="contained" 
                  onClick={handleGenerateImages}
                  disabled={isGeneratingImages || !imagePrompt.trim()}
                  startIcon={isGeneratingImages ? <CircularProgress size={20} /> : <PhotoCameraIcon />}
                >
                  {isGeneratingImages ? 'Generating...' : 'Generate Images'}
                </Button>
              </Box>
              
              {isGeneratingImages ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Creating unique images based on your description...
                  </Typography>
                </Box>
              ) : generatedImages.length > 0 && (
                <Grid container spacing={2}>
                  {generatedImages.map((imageUrl, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Box
                        sx={{
                          position: 'relative',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          borderRadius: 1,
                          '&:hover': {
                            boxShadow: 3
                          }
                        }}
                        onClick={() => handleSelectImage(imageUrl)}
                      >
                        <img
                          src={imageUrl}
                          alt={`Generated image ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '180px',
                            objectFit: 'cover'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '4px 8px',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                        >
                          AI Generated - Option {index + 1}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
              
              {!isGeneratingImages && generatedImages.length === 0 && (
                <Box sx={{ 
                  height: '200px', 
                  backgroundColor: '#f5f5f5', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  borderRadius: 1,
                  border: '1px dashed #ccc',
                  p: 2,
                  textAlign: 'center'
                }}>
                  <Typography color="text.secondary">
                    Enter a detailed description above and click "Generate Images" to create unique visuals
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageSearchOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
      {/* Schedule Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Schedule Content
          <IconButton
            onClick={() => setScheduleDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom>
            Select Date and Time to Publish
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose when you want this content to be published to your channels.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Time"
                type="time"
                defaultValue="12:00"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Recommended Times
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Based on your audience engagement patterns
            </Typography>
            
            <Grid container spacing={1}>
              {['Mon 9:30 AM', 'Tue 12:15 PM', 'Wed 5:45 PM', 'Thu 8:00 AM'].map((time, index) => (
                <Grid item key={index}>
                  <Chip 
                    label={time} 
                    onClick={() => {
                      // Logic to set the date/time fields
                      console.log('Selected recommended time:', time);
                    }}
                    clickable
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Channels
            </Typography>
            
            <FormGroup>
              <FormControlLabel control={<Checkbox defaultChecked />} label="Website" />
              <FormControlLabel control={<Checkbox defaultChecked />} label="Email Newsletter" />
              <FormControlLabel control={<Checkbox />} label="Instagram" />
              <FormControlLabel control={<Checkbox />} label="Facebook" />
              <FormControlLabel control={<Checkbox />} label="Twitter" />
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained"
            color="primary"
            onClick={handleScheduleContent}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Color Picker Dialog */}
      <Dialog
        open={colorPickerOpen}
        onClose={() => setColorPickerOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Brand Color Settings
          <IconButton
            onClick={() => setColorPickerOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Primary Brand Color
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '4px', 
                  backgroundColor: selectedColor,
                  mr: 2,
                  border: '1px solid #ccc'
                }}
              />
              <TextField
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                size="small"
                placeholder="#000000"
                sx={{ width: 120 }}
              />
            </Box>
            
            <Typography variant="subtitle1" gutterBottom>
              Suggested Accent Color
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '4px', 
                  backgroundColor: suggestedColor,
                  mr: 2,
                  border: '1px solid #ccc'
                }}
              />
              <TextField
                value={suggestedColor}
                disabled
                size="small"
                sx={{ width: 120 }}
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={useRecommendedColor}
                    onChange={handleToggleRecommendedColor}
                  />
                }
                label="Use recommended color"
                sx={{ ml: 2 }}
              />
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            The accent color is algorithmically generated to complement your brand color while maintaining accessibility standards.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setColorPickerOpen(false)}>Cancel</Button>
          <Button 
            variant="contained"
            color="primary"
            onClick={handleApplyColor}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateDetail;