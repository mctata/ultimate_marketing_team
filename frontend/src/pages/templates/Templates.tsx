import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Radio,
  RadioGroup,
  Modal,
  MenuItem,
  Select,
  SelectChangeEvent,
  Divider
} from '@mui/material';
import { 
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Language as LanguageIcon,
  FormatListBulleted as ListIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import healthWellnessTemplates from '../../healthWellnessTemplates';

// Mock template categories
const templateCategories = [
  { id: "social-proof", name: "Social Proof", template_count: 5 },
  { id: "customer-acquisition", name: "Customer Acquisition", template_count: 12 },
  { id: "educational-content", name: "Educational Content", template_count: 8 },
  { id: "brand-awareness", name: "Brand Awareness", template_count: 7 },
  { id: "community-building", name: "Community Building", template_count: 4 }
];

// Template formats
const templateFormats = [
  { id: "social-instagram", name: "Instagram Post", template_count: 8 },
  { id: "social-facebook", name: "Facebook Post", template_count: 6 },
  { id: "social-twitter", name: "Twitter Post", template_count: 4 },
  { id: "blog-how-to", name: "Blog Post", template_count: 7 },
  { id: "email-promotional", name: "Email", template_count: 5 }
];

// Template industries
const templateIndustries = [
  { id: "health-wellness", name: "Health & Wellness", template_count: 15 },
  { id: "fitness", name: "Fitness", template_count: 10 },
  { id: "nutrition", name: "Nutrition", template_count: 7 },
  { id: "yoga", name: "Yoga", template_count: 4 },
  { id: "mental-health", name: "Mental Health", template_count: 8 }
];

// Adapt the template data structure for display
const adaptedTemplates = healthWellnessTemplates.map(template => {
  const formatObj = templateFormats.find(f => f.id === template.format_id) || { name: "Unknown" };
  const categoryObjs = template.categories.map(catId => 
    templateCategories.find(c => c.id === catId) || { id: catId, name: catId }
  );
  const industryObjs = template.industries.map(indId => 
    templateIndustries.find(i => i.id === indId) || { id: indId, name: indId }
  );
  
  return {
    ...template,
    format: { id: template.format_id, name: formatObj.name },
    categories: categoryObjs,
    industries: industryObjs,
    community_rating: 4.5,
    usage_count: Math.floor(Math.random() * 1000),
    preview_image: template.preview_image || `https://picsum.photos/seed/${template.id}/300/200`
  };
});

// Templates Page Component
const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [templates, setTemplates] = useState(adaptedTemplates);
  const [favoriteTemplates, setFavoriteTemplates] = useState<string[]>([]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [fromScratchDialogOpen, setFromScratchDialogOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  // Define a proper type for the template instead of using any
  interface ExtendedTemplate {
    id: string;
    name: string;
    title: string;
    description: string;
    format_id: string;
    format: {
      id: string;
      name: string;
    };
    categories: Array<{
      id: string;
      name: string;
    }>;
    industries: Array<{
      id: string;
      name: string;
    }>;
    is_premium: boolean;
    preview_image?: string;
    content?: string;
    community_rating?: number;
    usage_count?: number;
  }
  
  const [selectedTemplate, setSelectedTemplate] = useState<ExtendedTemplate | null>(null);
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  
  // From scratch states
  const [contentType, setContentType] = useState('blog');
  const [contentDescription, setContentDescription] = useState('');
  const [isGeneratingFromScratch, setIsGeneratingFromScratch] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generatedContentType, setGeneratedContentType] = useState<string | null>(null);
  const [previewFromScratchOpen, setPreviewFromScratchOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  
  // Simulate loading state
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, []);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };
  
  // Handle search
  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      const filtered = adaptedTemplates.filter(template => 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.format.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setTemplates(filtered);
      setLoading(false);
    }, 500);
  };
  
  // Handle filter logic
  const applyFilters = () => {
    setLoading(true);
    setTimeout(() => {
      let filtered = [...adaptedTemplates];
      
      // Apply category filter
      if (selectedCategories.length > 0) {
        filtered = filtered.filter(template => 
          template.categories.some(cat => selectedCategories.includes(cat.id))
        );
      }
      
      // Apply format filter
      if (selectedFormats.length > 0) {
        filtered = filtered.filter(template => 
          selectedFormats.includes(template.format.id)
        );
      }
      
      // Apply industry filter
      if (selectedIndustries.length > 0) {
        filtered = filtered.filter(template => 
          template.industries.some(ind => selectedIndustries.includes(ind.id))
        );
      }
      
      // Apply search query if present
      if (searchQuery) {
        filtered = filtered.filter(template => 
          template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.format.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setTemplates(filtered);
      setFilterDialogOpen(false);
      setLoading(false);
    }, 500);
  };
  
  // Handle category checkbox change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };
  
  // Handle format checkbox change
  const handleFormatChange = (formatId: string) => {
    setSelectedFormats(prev => {
      if (prev.includes(formatId)) {
        return prev.filter(id => id !== formatId);
      } else {
        return [...prev, formatId];
      }
    });
  };
  
  // Handle industry checkbox change
  const handleIndustryChange = (industryId: string) => {
    setSelectedIndustries(prev => {
      if (prev.includes(industryId)) {
        return prev.filter(id => id !== industryId);
      } else {
        return [...prev, industryId];
      }
    });
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedFormats([]);
    setSelectedIndustries([]);
  };
  
  // Handle from scratch content generation
  const handleGenerateFromScratch = () => {
    if (!contentDescription.trim()) return;
    
    setIsGeneratingFromScratch(true);
    
    // Mock API call for content generation
    setTimeout(() => {
      setGeneratedContentType(contentType);
      
      // Generate mock content based on type
      let mockContent = '';
      if (contentType === 'blog') {
        mockContent = `# ${contentDescription.split(' ').slice(0, 5).join(' ')}...\n\n${contentDescription}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.`;
      } else if (contentType === 'email') {
        mockContent = `Subject: ${contentDescription.split(' ').slice(0, 5).join(' ')}...\n\nDear valued customer,\n\n${contentDescription}\n\nBest regards,\nYour Brand Team`;
      } else if (contentType === 'social') {
        mockContent = `📷 ${contentDescription.split(' ').slice(0, 3).join(' ')}...\n\n#trending #viral\n\n${contentDescription}`;
      }
      
      setGeneratedContent(mockContent);
      setIsGeneratingFromScratch(false);
    }, 2000);
  };
  
  // A simple markdown to HTML converter for preview
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
  
  // Handle preview for template
  const handleOpenPreview = (template: ExtendedTemplate) => {
    setSelectedTemplate(template);
    setPreviewModalOpen(true);
  };
  
  // Handle favorite toggle
  const handleToggleFavorite = (templateId: string) => {
    if (favoriteTemplates.includes(templateId)) {
      setFavoriteTemplates(favoriteTemplates.filter(id => id !== templateId));
    } else {
      setFavoriteTemplates([...favoriteTemplates, templateId]);
    }
  };
  
  // Get templates for the current tab
  const getCurrentTemplates = () => {
    switch (selectedTab) {
      case 0: // All templates
        return templates;
      case 1: // Popular templates
        return [...templates].sort((a, b) => b.usage_count - a.usage_count).slice(0, 8);
      case 2: // Recommended templates
        return templates.filter(t => t.is_premium).slice(0, 8);
      case 3: // Favorites
        return templates.filter(t => favoriteTemplates.includes(t.id));
      default:
        return templates;
    }
  };
  
  // Check if a template is favorited
  const isTemplateFavorited = (templateId: string) => {
    return favoriteTemplates.includes(templateId);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Templates Library
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            size="small"
            sx={{ width: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          
          <Button 
            variant="outlined" 
            startIcon={<FilterListIcon />}
            onClick={() => setFilterDialogOpen(true)}
          >
            Filters
          </Button>
          
          <Button 
            variant="contained"
            onClick={handleSearch}
          >
            Search
          </Button>
        </Box>
      </Box>
      
      {/* Creation Options */}
      <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f7fa', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          What do you want to create?
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Paper 
              sx={{ 
                p: 2, 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={() => navigate('/content/templates')}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                From Template
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                Choose from professionally designed templates for emails, social posts, blog articles, and more.
              </Typography>
              <Button variant="outlined" size="small" sx={{ alignSelf: 'flex-start' }}>
                Browse Templates
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper 
              sx={{ 
                p: 2, 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={() => setFromScratchDialogOpen(true)}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                From Scratch
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                Describe what you want to create and we'll generate custom content based on your needs.
              </Typography>
              <Button variant="outlined" size="small" sx={{ alignSelf: 'flex-start' }}>
                Start Creating
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="All Templates" />
          <Tab label="Popular" />
          <Tab label="Recommended" />
          <Tab label="Favorites" />
        </Tabs>
      </Box>
      
      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* No results message */}
      {!loading && getCurrentTemplates().length === 0 && (
        <Box sx={{ textAlign: 'center', my: 6 }}>
          {selectedTab === 3 ? (
            <Typography variant="h6" color="text.secondary">
              You haven't favorited any templates yet.
            </Typography>
          ) : (
            <Typography variant="h6" color="text.secondary">
              No templates found matching your criteria.
            </Typography>
          )}
          {searchQuery && (
            <Button 
              variant="outlined" 
              sx={{ mt: 2 }}
              onClick={() => {
                setSearchQuery('');
                setTemplates(adaptedTemplates);
              }}
            >
              Clear Search
            </Button>
          )}
        </Box>
      )}
      
      {/* Templates grid */}
      {!loading && getCurrentTemplates().length > 0 && (
        <Grid container spacing={3}>
          {getCurrentTemplates().map((template) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="180"
                  sx={{
                    objectFit: "cover",
                    aspectRatio: "16/9"
                  }}
                  image={template.preview_image}
                  alt={template.title}
                />
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="h2" sx={{ 
                      fontSize: '1rem', 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      height: 48,
                      lineHeight: 1.2
                    }}>
                      {template.title}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleToggleFavorite(template.id)}
                      sx={{ ml: 1 }}
                    >
                      {isTemplateFavorited(template.id) ? (
                        <FavoriteIcon fontSize="small" color="error" />
                      ) : (
                        <FavoriteBorderIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      mb: 1.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      height: 40
                    }}
                  >
                    {template.description}
                  </Typography>
                  
                  <Box sx={{ mb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip 
                      label={template.format.name} 
                      size="small" 
                      color="primary"
                      sx={{ fontSize: '0.7rem' }}
                    />
                    {template.categories.slice(0, 1).map(category => (
                      <Chip 
                        key={category.id}
                        label={category.name} 
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                    {template.is_premium && (
                      <Chip 
                        label="Premium" 
                        size="small" 
                        color="secondary"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    size="small"
                    onClick={() => handleOpenPreview(template)}
                  >
                    Preview
                  </Button>
                  <Button 
                    size="small"
                    color="primary"
                    variant="contained"
                    onClick={() => navigate(`/content/templates/${template.id}/use`)}
                    sx={{ ml: 'auto' }}
                  >
                    Choose
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Filter Dialog */}
      <Dialog 
        open={filterDialogOpen} 
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Filter Templates
          <IconButton
            onClick={() => setFilterDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Categories
              </Typography>
              <FormGroup>
                {templateCategories.map(category => (
                  <FormControlLabel
                    key={category.id}
                    control={
                      <Checkbox 
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryChange(category.id)}
                      />
                    }
                    label={`${category.name} (${category.template_count})`}
                  />
                ))}
              </FormGroup>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Content Format
              </Typography>
              <FormGroup>
                {templateFormats.map(format => (
                  <FormControlLabel
                    key={format.id}
                    control={
                      <Checkbox 
                        checked={selectedFormats.includes(format.id)}
                        onChange={() => handleFormatChange(format.id)}
                      />
                    }
                    label={`${format.name} (${format.template_count})`}
                  />
                ))}
              </FormGroup>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Industries
              </Typography>
              <FormGroup>
                {templateIndustries.map(industry => (
                  <FormControlLabel
                    key={industry.id}
                    control={
                      <Checkbox 
                        checked={selectedIndustries.includes(industry.id)}
                        onChange={() => handleIndustryChange(industry.id)}
                      />
                    }
                    label={`${industry.name} (${industry.template_count})`}
                  />
                ))}
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetFilters}>Reset</Button>
          <Button onClick={applyFilters} variant="contained" color="primary">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* From Scratch Dialog */}
      <Dialog
        open={fromScratchDialogOpen}
        onClose={() => !isGeneratingFromScratch && setFromScratchDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Create Content From Scratch
          {!isGeneratingFromScratch && (
            <IconButton
              onClick={() => setFromScratchDialogOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent>
          {!generatedContent ? (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Select content type:
              </Typography>
              
              <RadioGroup
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                sx={{ mb: 3 }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        borderColor: contentType === 'blog' ? 'primary.main' : 'grey.300',
                        borderWidth: 2,
                        borderStyle: 'solid'
                      }}
                    >
                      <FormControlLabel 
                        value="blog" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                              <Typography variant="subtitle2">Blog Post</Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Long-form content with headings, paragraphs and formatting
                            </Typography>
                          </Box>
                        }
                        sx={{ alignItems: 'flex-start', m: 0 }}
                      />
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        borderColor: contentType === 'email' ? 'primary.main' : 'grey.300',
                        borderWidth: 2,
                        borderStyle: 'solid'
                      }}
                    >
                      <FormControlLabel 
                        value="email" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <EmailIcon color="primary" sx={{ mr: 1 }} />
                              <Typography variant="subtitle2">Email</Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Professional email with subject line and formatted content
                            </Typography>
                          </Box>
                        }
                        sx={{ alignItems: 'flex-start', m: 0 }}
                      />
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        borderColor: contentType === 'social' ? 'primary.main' : 'grey.300',
                        borderWidth: 2,
                        borderStyle: 'solid'
                      }}
                    >
                      <FormControlLabel 
                        value="social" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <InstagramIcon color="primary" sx={{ mr: 1 }} />
                              <Typography variant="subtitle2">Social Post</Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Short, engaging content for social media with hashtags
                            </Typography>
                          </Box>
                        }
                        sx={{ alignItems: 'flex-start', m: 0 }}
                      />
                    </Paper>
                  </Grid>
                </Grid>
              </RadioGroup>
              
              <Typography variant="subtitle1" gutterBottom>
                Describe what you want to create:
              </Typography>
              <TextField
                multiline
                rows={4}
                fullWidth
                placeholder="Describe your content in detail. For example: 'Create a blog post about the benefits of meditation for stress reduction, targeting busy professionals.'"
                value={contentDescription}
                onChange={(e) => setContentDescription(e.target.value)}
                sx={{ mb: 3 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  disabled={!contentDescription.trim() || isGeneratingFromScratch}
                  onClick={handleGenerateFromScratch}
                >
                  {isGeneratingFromScratch ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                      Generating...
                    </>
                  ) : (
                    'Generate Content'
                  )}
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Content has been generated successfully!
              </Alert>
              
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Generated {generatedContentType === 'blog' ? 'Blog Post' : 
                          generatedContentType === 'email' ? 'Email' : 'Social Media Post'}
              </Typography>
              
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 3, 
                  maxHeight: '300px', 
                  overflow: 'auto',
                  whiteSpace: 'pre-line',
                  mb: 3
                }}
              >
                {generatedContent}
              </Paper>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  onClick={() => {
                    setGeneratedContent(null);
                    setGeneratedContentType(null);
                  }}
                >
                  Create Another
                </Button>
                <Box>
                  <Button sx={{ mr: 2 }}>
                    Edit
                  </Button>
                  <Button 
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      setPreviewFromScratchOpen(true);
                    }}
                    sx={{ mr: 2 }}
                  >
                    Preview
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => setScheduleDialogOpen(true)}
                  >
                    Schedule Post
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Template Preview Modal */}
      <Modal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
      >
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxWidth: '900px',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 1,
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          {selectedTemplate && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2">
                  {selectedTemplate.title}
                </Typography>
                <IconButton onClick={() => setPreviewModalOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
              
              {selectedTemplate.preview_image && (
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <img 
                    src={selectedTemplate.preview_image} 
                    alt={`Preview of ${selectedTemplate.title}`}
                    style={{ 
                      width: '100%',
                      maxHeight: '400px',
                      objectFit: 'cover',
                      borderRadius: '4px'
                    }}
                  />
                  {selectedTemplate.preview_image.includes('unsplash.com') && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                      <a 
                        href={`https://unsplash.com/photos/${selectedTemplate.preview_image.split('/').pop()?.split('?')[0]}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Photo via Unsplash
                      </a>
                    </Typography>
                  )}
                </Box>
              )}
              
              <Typography variant="subtitle1" gutterBottom>
                {selectedTemplate.description}
              </Typography>
              
              <Box sx={{ mt: 2, mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={selectedTemplate.format.name} 
                  size="small" 
                  color="primary"
                />
                {selectedTemplate.categories.slice(0, 2).map(category => (
                  <Chip 
                    key={category.id} 
                    label={category.name} 
                    size="small" 
                  />
                ))}
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Sample Content
              </Typography>
              <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ p: 3, whiteSpace: 'pre-line', mb: 3 }}
              >
                {selectedTemplate.content || 
                  "This is a sample of the content structure this template will help you create."}
              </Paper>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => {
                    setPreviewModalOpen(false);
                    navigate(`/content/templates/${selectedTemplate.id}/use`);
                  }}
                >
                  Use This Template
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      {/* From Scratch Content Preview Modal */}
      <Modal
        open={previewFromScratchOpen}
        onClose={() => setPreviewFromScratchOpen(false)}
      >
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxWidth: '900px',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 1,
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2">
              Content Preview
            </Typography>
            <IconButton onClick={() => setPreviewFromScratchOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ mb: 3 }}>
            {generatedContentType === 'blog' && (
              <>
                <Paper 
                  elevation={0} 
                  variant="outlined" 
                  sx={{ p: 3, mb: 3 }}
                >
                  <Box 
                    sx={{ 
                      '& h1': { fontSize: '1.8rem', mb: 2 },
                      '& h2': { fontSize: '1.4rem', mb: 1.5, mt: 2 },
                      '& p': { mb: 1.5 },
                    }}
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(generatedContent || '') }} 
                  />
                </Paper>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <img 
                    src="https://source.unsplash.com/random/800x600/?nature"
                    alt="Featured blog image"
                    style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px', marginRight: '16px' }}
                  />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Featured Image Preview
                    </Typography>
                    <Typography variant="body2">
                      This is how your post will appear in the blog listing
                    </Typography>
                  </Box>
                </Box>
              </>
            )}

            {generatedContentType === 'email' && (
              <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ p: 3, mb: 3, borderRadius: 1 }}
              >
                <Box sx={{ p: 2, backgroundColor: '#f5f5f5', mb: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle2">
                    Email Preview
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
                    From: Your Brand &lt;noreply@yourbrand.com&gt;<br />
                    To: Recipient &lt;recipient@example.com&gt;<br />
                    Subject: {generatedContent?.split('\n')[0].replace('Subject: ', '')}
                  </Typography>
                </Box>
                <Box sx={{ p: 2, whiteSpace: 'pre-line' }}>
                  {generatedContent?.split('\n').slice(1).join('\n')}
                </Box>
              </Paper>
            )}

            {generatedContentType === 'social' && (
              <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ p: 3, mb: 3 }}
              >
                <Box sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: '50%', 
                          bgcolor: 'primary.main', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          mr: 1.5
                        }}
                      >
                        YB
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">Your Brand</Typography>
                        <Typography variant="caption" color="text.secondary">@yourbrand • Just now</Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                      {generatedContent}
                    </Typography>
                    
                    <Box 
                      sx={{ 
                        height: 250, 
                        bgcolor: '#f5f5f5', 
                        borderRadius: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mb: 2
                      }}
                    >
                      <Typography color="text.secondary">[Post Image Will Appear Here]</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">♥ 0 Likes</Typography>
                      <Typography variant="caption" color="text.secondary">0 Comments</Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" gutterBottom>
            Publishing Options
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Chip icon={<FacebookIcon />} label="Facebook" variant="outlined" />
            <Chip icon={<InstagramIcon />} label="Instagram" variant="outlined" />
            <Chip icon={<TwitterIcon />} label="Twitter" variant="outlined" /> 
            <Chip icon={<LanguageIcon />} label="Website" variant="outlined" />
            <Chip icon={<EmailIcon />} label="Email" variant="outlined" />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button 
              onClick={() => setPreviewFromScratchOpen(false)} 
              sx={{ mr: 2 }}
            >
              Edit Content
            </Button>
            <Button
              variant="outlined"
              color="primary"
              sx={{ mr: 2 }}
              onClick={() => {
                setPreviewFromScratchOpen(false);
                setScheduleDialogOpen(true);
              }}
            >
              Schedule
            </Button>
            <Button
              variant="contained"
              color="primary"
            >
              Publish Now
            </Button>
          </Box>
        </Box>
      </Modal>

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
            onClick={() => {
              setScheduleDialogOpen(false);
              setFromScratchDialogOpen(false);
              setGeneratedContent(null);
              setGeneratedContentType(null);
              // Show a success message or redirect
            }}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Templates;