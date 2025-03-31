import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Card,
  CardContent,
  IconButton,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  ContentCopy as ContentCopyIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Edit as EditIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { healthWellnessTemplates } from '../../data/healthWellnessTemplates';

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
      id={`template-test-tabpanel-${index}`}
      aria-labelledby={`template-test-tab-${index}`}
      {...other}
      style={{ paddingTop: 16 }}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const TemplateTestWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Component state
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [viewMode, setViewMode] = useState<string>('preview');
  const [renderedContent, setRenderedContent] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  
  // Fetch template data
  useEffect(() => {
    setLoading(true);
    try {
      // In a real app, this would be an API call
      // For now, we'll use the imported data
      const foundTemplate = healthWellnessTemplates.find(t => t.id === id);
      if (foundTemplate) {
        setTemplate(foundTemplate);
        
        // Initialize customization fields
        const initialCustomizations: Record<string, string> = {};
        if (foundTemplate.dynamic_fields) {
          Object.entries(foundTemplate.dynamic_fields).forEach(([key, field]) => {
            initialCustomizations[key] = (field as any).default || '';
          });
        }
        setCustomizations(initialCustomizations);
        
        // Set default tone if available
        if (foundTemplate.tone_options && foundTemplate.tone_options.length > 0) {
          setSelectedTone(foundTemplate.tone_options[0].id);
        }
      } else {
        setError('Template not found');
      }
    } catch (err) {
      setError('Error loading template');
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };
  
  // Handle customization changes
  const handleCustomizationChange = (key: string, value: string) => {
    setCustomizations(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle tone selection
  const handleToneChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedTone(event.target.value as string);
  };
  
  // Handle view mode change
  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: string) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };
  
  // Apply customizations to get the rendered content
  useEffect(() => {
    if (!template) return;
    
    let content = template.content;
    
    // Apply selected tone modifications if applicable
    if (selectedTone && template.tone_options) {
      const selectedToneOption = template.tone_options.find(tone => tone.id === selectedTone);
      if (selectedToneOption?.modifications?.content) {
        content = selectedToneOption.modifications.content;
      }
    }
    
    // Apply customizations
    Object.entries(customizations).forEach(([key, value]) => {
      content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    
    setRenderedContent(content);
  }, [template, customizations, selectedTone]);
  
  // Get the formatted content for display
  const getDisplayContent = () => {
    if (viewMode === 'code') {
      return renderedContent;
    } else {
      // For emails or HTML content, we need to sanitize and render HTML
      if (template?.format_id?.includes('email')) {
        return (
          <div 
            dangerouslySetInnerHTML={{ __html: renderedContent }} 
            style={{ maxWidth: '100%', overflow: 'auto' }}
          />
        );
      } else if (template?.format_id?.includes('blog')) {
        // For markdown content
        return (
          <div style={{ maxWidth: '100%', fontFamily: 'Georgia, serif', lineHeight: 1.6 }}>
            {renderedContent.split('\n').map((line, i) => {
              // Very basic markdown-like rendering
              if (line.startsWith('# ')) {
                return <h1 key={i} style={{ fontSize: '2em', marginBottom: '0.5em' }}>{line.substring(2)}</h1>;
              } else if (line.startsWith('## ')) {
                return <h2 key={i} style={{ fontSize: '1.5em', marginBottom: '0.5em', marginTop: '1em' }}>{line.substring(3)}</h2>;
              } else if (line.startsWith('### ')) {
                return <h3 key={i} style={{ fontSize: '1.25em', marginBottom: '0.5em', marginTop: '1em' }}>{line.substring(4)}</h3>;
              } else if (line.startsWith('> ')) {
                return <blockquote key={i} style={{ borderLeft: '4px solid #ccc', paddingLeft: '1em', fontStyle: 'italic' }}>{line.substring(2)}</blockquote>;
              } else if (line.startsWith('* ')) {
                return <li key={i} style={{ marginLeft: '1.5em' }}>{line.substring(2)}</li>;
              } else if (line.startsWith('- ')) {
                return <li key={i} style={{ marginLeft: '1.5em' }}>{line.substring(2)}</li>;
              } else if (line.startsWith('![')) {
                const altEndIndex = line.indexOf('](');
                const srcEndIndex = line.indexOf(')');
                if (altEndIndex > 0 && srcEndIndex > altEndIndex) {
                  const alt = line.substring(2, altEndIndex);
                  const src = line.substring(altEndIndex + 2, srcEndIndex);
                  return <img key={i} src={src} alt={alt} style={{ maxWidth: '100%', margin: '1em 0' }} />;
                }
              }
              return line ? <p key={i} style={{ marginBottom: '1em' }}>{line}</p> : <br key={i} />;
            })}
          </div>
        );
      } else if (template?.format_id?.includes('social')) {
        // For social media content
        return (
          <div style={{ 
            maxWidth: '100%',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: template?.format_id?.includes('instagram') ? '#fafafa' : 
                             template?.format_id?.includes('facebook') ? '#f0f2f5' : 
                             template?.format_id?.includes('twitter') ? '#f5f8fa' : '#f0f0f0',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          }}>
            {renderedContent.split('\n').map((line, i) => (
              line ? <p key={i} style={{ marginBottom: '0.75em' }}>{line}</p> : <br key={i} />
            ))}
          </div>
        );
      } else {
        // For other content types
        return (
          <div>
            {renderedContent.split('\n').map((line, i) => (
              line ? <p key={i}>{line}</p> : <br key={i} />
            ))}
          </div>
        );
      }
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    navigate('/templates');
  };
  
  // Handle copy to clipboard
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(renderedContent);
    setSnackbarMessage('Template copied to clipboard!');
    setSnackbarOpen(true);
  };
  
  // Handle download
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([renderedContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${template?.title || 'template'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    setSnackbarMessage('Template downloaded successfully!');
    setSnackbarOpen(true);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
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
        <Typography color="text.primary">Test Workspace</Typography>
      </Breadcrumbs>
      
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" sx={{ flexGrow: 1 }}>
          {template.title}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyToClipboard}
          >
            Copy
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
          >
            Download
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={() => {
              setSnackbarMessage('Draft saved successfully!');
              setSnackbarOpen(true);
            }}
          >
            Save as Draft
          </Button>
        </Box>
      </Box>
      
      {/* Main content */}
      <Grid container spacing={3}>
        {/* Template editor */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                variant={isMobile ? "scrollable" : "fullWidth"}
                scrollButtons={isMobile ? "auto" : undefined}
                aria-label="Template test workspace tabs"
              >
                <Tab label="Edit" id="template-test-tab-0" aria-controls="template-test-tabpanel-0" />
                <Tab label="Preview" id="template-test-tab-1" aria-controls="template-test-tabpanel-1" />
              </Tabs>
            </Box>
            
            {/* Edit tab */}
            <TabPanel value={selectedTab} index={0}>
              {template.dynamic_fields && Object.entries(template.dynamic_fields).length > 0 ? (
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
              ) : (
                <Typography variant="body1">
                  This template has no customizable fields.
                </Typography>
              )}
              
              {template.tone_options && template.tone_options.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Tone Selection
                  </Typography>
                  
                  <FormControl fullWidth>
                    <InputLabel id="tone-select-label">Select Tone</InputLabel>
                    <Select
                      labelId="tone-select-label"
                      value={selectedTone}
                      label="Select Tone"
                      onChange={(e) => setSelectedTone(e.target.value as string)}
                    >
                      {template.tone_options.map((tone) => (
                        <MenuItem key={tone.id} value={tone.id}>
                          {tone.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  {selectedTone && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {template.tone_options.find(t => t.id === selectedTone)?.description || ''}
                    </Typography>
                  )}
                </Box>
              )}
            </TabPanel>
            
            {/* Preview tab */}
            <TabPanel value={selectedTab} index={1}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={handleViewModeChange}
                  aria-label="content view mode"
                  size="small"
                >
                  <ToggleButton value="preview" aria-label="preview mode">
                    <PreviewIcon sx={{ mr: 1 }} />
                    Preview
                  </ToggleButton>
                  <ToggleButton value="code" aria-label="code mode">
                    <CodeIcon sx={{ mr: 1 }} />
                    Raw
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 3, 
                  whiteSpace: viewMode === 'code' ? 'pre-wrap' : 'pre-line',
                  fontFamily: viewMode === 'code' ? 'monospace' : 'inherit',
                  minHeight: '400px',
                  maxHeight: '600px',
                  overflow: 'auto',
                  backgroundColor: viewMode === 'preview' && template?.format_id?.includes('social') ? 
                    '#fafafa' : '#ffffff',
                  border: viewMode === 'preview' && template?.format_id?.includes('social') ? 
                    '1px solid #dbdbdb' : '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: viewMode === 'preview' && template?.format_id?.includes('social') ? 
                    '8px' : '4px',
                  boxShadow: viewMode === 'preview' && !template?.format_id?.includes('email') ? 
                    '0 2px 10px rgba(0, 0, 0, 0.05)' : 'none',
                }}
              >
                {viewMode === 'preview' && template?.format_id?.includes('social-instagram') && (
                  <Box sx={{ 
                    mb: 2, 
                    pb: 2, 
                    borderBottom: '1px solid #efefef',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Box 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main',
                        mr: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      B
                    </Box>
                    <Typography variant="subtitle2">Your Business</Typography>
                  </Box>
                )}
                
                {viewMode === 'preview' && template?.format_id?.includes('social-facebook') && (
                  <Box sx={{ 
                    mb: 2, 
                    pb: 2, 
                    borderBottom: '1px solid #e4e6eb',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Box 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main',
                        mr: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      B
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Your Business</Typography>
                      <Typography variant="caption" color="text.secondary">Sponsored · </Typography>
                    </Box>
                  </Box>
                )}
                
                {viewMode === 'preview' && template?.format_id?.includes('social-twitter') && (
                  <Box sx={{ 
                    mb: 2, 
                    pb: 2, 
                    borderBottom: '1px solid #e6ecf0',
                    display: 'flex',
                  }}>
                    <Box 
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main',
                        mr: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      B
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Your Business</Typography>
                      <Typography variant="caption" color="text.secondary">@YourBusiness</Typography>
                    </Box>
                  </Box>
                )}
                
                {getDisplayContent()}
                
                {viewMode === 'preview' && template?.format_id?.includes('social') && (
                  <Box sx={{ 
                    mt: 2, 
                    pt: 2, 
                    borderTop: '1px solid #efefef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around'
                  }}>
                    <Typography variant="caption" color="text.secondary">Like</Typography>
                    <Typography variant="caption" color="text.secondary">Comment</Typography>
                    <Typography variant="caption" color="text.secondary">Share</Typography>
                  </Box>
                )}
              </Paper>
            </TabPanel>
          </Paper>
        </Grid>
        
        {/* Template details */}
        <Grid item xs={12} md={4}>
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
              <Typography variant="body2">
                {template.format_id}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Categories
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {template.categories && template.categories.length > 0 ? (
                  template.categories.map((category) => (
                    <Typography key={category} variant="body2">
                      {category}
                    </Typography>
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
                {template.industries && template.industries.length > 0 ? (
                  template.industries.map((industry) => (
                    <Typography key={industry} variant="body2">
                      {industry}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2">No industries</Typography>
                )}
              </Box>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Usage Tips
            </Typography>
            
            <Typography variant="body2" paragraph>
              <strong>1. Customize content:</strong> Use the Edit tab to personalize all fields marked with {'{curly_braces}'}. The template will update in real-time.
            </Typography>
            
            <Typography variant="body2" paragraph>
              <strong>2. Try different tones:</strong> Select from the available tone options to see how they change your content's voice and style.
            </Typography>
            
            <Typography variant="body2" paragraph>
              <strong>3. Preview formats:</strong> Switch between Preview and Raw modes to see how your content will look when published versus the actual text.
            </Typography>
            
            <Typography variant="body2" paragraph>
              <strong>4. Copy or download:</strong> When you're satisfied with your template, use the Copy or Download buttons to save your work.
            </Typography>
            
            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom color="info.dark">
                Pro Tip
              </Typography>
              <Typography variant="body2" color="info.dark">
                For the best results, customize all fields to match your brand voice and target audience. Don't forget to preview across different devices before publishing!
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default TemplateTestWorkspace;