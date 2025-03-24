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
  Alert
} from '@mui/material';
import { 
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { healthWellnessTemplates } from '../../data/healthWellnessTemplates';

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
                  height="140"
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
                    onClick={() => navigate(`/content/templates/${template.id}`)}
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
                    Use
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Templates;