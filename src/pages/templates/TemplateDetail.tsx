import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Divider,
  Chip,
  Rating,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  Star as StarIcon,
  Description as DescriptionIcon,
  DataUsage as DataUsageIcon,
  Settings as SettingsIcon,
  FormatQuote as FormatQuoteIcon,
} from '@mui/icons-material';
import { AppDispatch } from '../../store';
import {
  fetchTemplateById,
  fetchFavoriteTemplates,
  toggleFavoriteTemplate,
  useTemplate,
  selectSelectedTemplate,
  selectFavoriteTemplates,
  selectTemplatesLoading,
  selectTemplatesError,
} from '../../store/slices/templateSlice';
import { Template, TemplateCategory, TemplateIndustry } from '../../services/templateService';

// Tab panel component
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
      style={{ paddingTop: 16 }}
    >
      {value === index && children}
    </div>
  );
}

const TemplateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Redux state
  const template = useSelector(selectSelectedTemplate);
  const favoriteTemplates = useSelector(selectFavoriteTemplates);
  const loading = useSelector(selectTemplatesLoading);
  const error = useSelector(selectTemplatesError);
  
  // Component state
  const [selectedTab, setSelectedTab] = useState(0);
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState('');
  
  // Fetch template and favorites on mount
  useEffect(() => {
    if (id) {
      dispatch(fetchTemplateById(id));
      dispatch(fetchFavoriteTemplates());
    }
  }, [dispatch, id]);
  
  // Initialize customization fields when template loads
  useEffect(() => {
    if (template && template.dynamic_fields) {
      const initialCustomizations: Record<string, string> = {};
      Object.entries(template.dynamic_fields).forEach(([key, field]) => {
        initialCustomizations[key] = (field as any).default || '';
      });
      setCustomizations(initialCustomizations);
      
      // Set default tone if available
      if (template.tone_options && template.tone_options.length > 0) {
        setSelectedTone(template.tone_options[0].id);
      }
    }
  }, [template]);
  
  // Check if template is favorited
  const isFavorite = favoriteTemplates.some(t => t.id === template?.id);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };
  
  // Handle favorite toggle
  const handleToggleFavorite = () => {
    if (template) {
      dispatch(toggleFavoriteTemplate({
        templateId: template.id,
        isFavorite
      }));
    }
  };
  
  // Handle customization changes
  const handleCustomizationChange = (key: string, value: string) => {
    setCustomizations({
      ...customizations,
      [key]: value
    });
  };
  
  // Handle tone selection
  const handleToneChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedTone(event.target.value as string);
  };
  
  // Apply customizations to content
  const getCustomizedContent = () => {
    if (!template) return '';
    
    let content = template.content;
    
    // Apply customizations
    Object.entries(customizations).forEach(([key, value]) => {
      content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    
    // Apply selected tone modifications if applicable
    if (selectedTone && template.tone_options) {
      const selectedToneOption = template.tone_options.find(tone => tone.id === selectedTone);
      if (selectedToneOption && selectedToneOption.modifications) {
        Object.entries(selectedToneOption.modifications).forEach(([key, value]) => {
          content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value as string);
        });
      }
    }
    
    return content;
  };
  
  // Use template
  const handleUseTemplate = () => {
    if (template) {
      const customizedContent = getCustomizedContent();
      
      dispatch(useTemplate({
        templateId: template.id,
        customizations,
        draftData: {
          content: customizedContent,
          // You would include project_id and other required fields here
        }
      })).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          // Navigate to the content editor with the new draft
          const contentDraftId = (result.payload as any).contentDraftId;
          navigate(`/content/${contentDraftId}`);
        }
      });
      
      setUseDialogOpen(false);
    }
  };
  
  // Rate template
  const handleRateTemplate = () => {
    // This would dispatch an action to rate the template
    // For now, we just close the dialog
    setRatingDialogOpen(false);
  };
  
  // Handle back navigation
  const handleBack = () => {
    navigate('/templates');
  };
  
  // Handle edit template
  const handleEditTemplate = () => {
    if (template) {
      navigate(`/templates/edit/${template.id}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to Templates
        </Button>
      </Box>
    );
  }

  if (!template) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Template not found.</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to Templates
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Breadcrumb navigation */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer' }}
          onClick={handleBack}
        >
          Templates
        </Link>
        <Typography color="text.primary">{template.title}</Typography>
      </Breadcrumbs>
      
      {/* Template header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" sx={{ flexGrow: 1 }}>
          {template.title}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={handleToggleFavorite}
            color={isFavorite ? "error" : "default"}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
          
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEditTemplate}
            aria-label="Edit template"
          >
            Edit
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={() => setUseDialogOpen(true)}
            aria-label="Use template"
          >
            Use Template
          </Button>
        </Box>
      </Box>
      
      {/* Template information */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                variant={isMobile ? "scrollable" : "fullWidth"}
                scrollButtons={isMobile ? "auto" : undefined}
                aria-label="Template information tabs"
              >
                <Tab 
                  icon={<DescriptionIcon />} 
                  label="Preview" 
                  id="template-tab-0" 
                  aria-controls="template-tabpanel-0" 
                />
                <Tab 
                  icon={<DataUsageIcon />} 
                  label="Customization" 
                  id="template-tab-1" 
                  aria-controls="template-tabpanel-1" 
                />
                <Tab 
                  icon={<FormatQuoteIcon />} 
                  label="Tone Variations" 
                  id="template-tab-2" 
                  aria-controls="template-tabpanel-2" 
                />
              </Tabs>
            </Box>
            
            {/* Preview tab */}
            <TabPanel value={selectedTab} index={0}>
              <Box sx={{ p: 2 }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {getCustomizedContent()}
                </Typography>
                
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => navigator.clipboard.writeText(getCustomizedContent())}
                  sx={{ mt: 2 }}
                  aria-label="Copy content"
                >
                  Copy to Clipboard
                </Button>
              </Box>
            </TabPanel>
            
            {/* Customization tab */}
            <TabPanel value={selectedTab} index={1}>
              <Box sx={{ p: 2 }}>
                {template.dynamic_fields && Object.entries(template.dynamic_fields).length > 0 ? (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Customize Template
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {Object.entries(template.dynamic_fields).map(([key, field]) => (
                        <Grid item xs={12} key={key}>
                          <TextField
                            label={(field as any).label || key}
                            value={customizations[key] || ''}
                            onChange={(e) => handleCustomizationChange(key, e.target.value)}
                            fullWidth
                            helperText={(field as any).description || ''}
                            multiline={(field as any).multiline}
                            rows={(field as any).multiline ? 3 : 1}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </>
                ) : (
                  <Typography variant="body1">
                    This template has no customizable fields.
                  </Typography>
                )}
              </Box>
            </TabPanel>
            
            {/* Tone Variations tab */}
            <TabPanel value={selectedTab} index={2}>
              <Box sx={{ p: 2 }}>
                {template.tone_options && template.tone_options.length > 0 ? (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Tone Variations
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel id="tone-select-label">Select Tone</InputLabel>
                      <Select
                        labelId="tone-select-label"
                        value={selectedTone}
                        label="Select Tone"
                        onChange={(e) => setSelectedTone(e.target.value)}
                      >
                        {template.tone_options.map((tone) => (
                          <MenuItem key={tone.id} value={tone.id}>
                            {tone.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {selectedTone && (
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          Tone Description
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {template.tone_options.find(t => t.id === selectedTone)?.description || ''}
                        </Typography>
                        
                        <Typography variant="subtitle1" gutterBottom>
                          Preview with Selected Tone
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {getCustomizedContent()}
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                  </>
                ) : (
                  <Typography variant="body1">
                    This template has no tone variations.
                  </Typography>
                )}
              </Box>
            </TabPanel>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {/* Template metadata */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Template Details
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body2">
                {template.description || 'No description provided.'}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Format
              </Typography>
              <Chip label={template.format.name} size="small" sx={{ mt: 0.5 }} />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Categories
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {template.categories.length > 0 ? (
                  template.categories.map((category) => (
                    <Chip key={category.id} label={category.name} size="small" />
                  ))
                ) : (
                  <Typography variant="body2">No categories</Typography>
                )}
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Industries
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {template.industries.length > 0 ? (
                  template.industries.map((industry) => (
                    <Chip key={industry.id} label={industry.name} size="small" />
                  ))
                ) : (
                  <Typography variant="body2">No industries</Typography>
                )}
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Rating
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Rating 
                  value={template.community_rating} 
                  precision={0.5} 
                  readOnly 
                />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  ({template.community_rating.toFixed(1)})
                </Typography>
              </Box>
              <Button
                size="small"
                startIcon={<StarIcon />}
                onClick={() => setRatingDialogOpen(true)}
                sx={{ mt: 1 }}
                aria-label="Rate this template"
              >
                Rate this template
              </Button>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Usage
              </Typography>
              <Typography variant="body2">
                Used {template.usage_count} times
              </Typography>
            </Box>
          </Paper>
          
          {/* Related templates - placeholder for future functionality */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Similar Templates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Similar templates will be displayed here.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Use Template Dialog */}
      <Dialog
        open={useDialogOpen}
        onClose={() => setUseDialogOpen(false)}
        aria-labelledby="use-template-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="use-template-dialog-title">
          Use Template: {template.title}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" paragraph>
            This will create a new content draft using this template. You can further edit the content after creation.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            Preview
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto', mb: 2 }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {getCustomizedContent()}
            </Typography>
          </Paper>
          
          {/* Project selection would go here */}
          <Typography variant="body2" color="text.secondary">
            Select a project to add this content to, or create it as a standalone draft.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUseDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleUseTemplate}
          >
            Create Content
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Rating Dialog */}
      <Dialog
        open={ratingDialogOpen}
        onClose={() => setRatingDialogOpen(false)}
        aria-labelledby="rating-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="rating-dialog-title">
          Rate this Template
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              How would you rate this template?
            </Typography>
            <Rating
              name="template-rating"
              value={userRating}
              onChange={(event, newValue) => {
                setUserRating(newValue);
              }}
              size="large"
              sx={{ my: 1 }}
            />
          </Box>
          
          <TextField
            label="Comments (optional)"
            multiline
            rows={4}
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            fullWidth
            variant="outlined"
            placeholder="Share your thoughts about this template..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleRateTemplate}
            disabled={!userRating}
          >
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateDetail;
