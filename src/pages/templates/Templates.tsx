import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  Divider,
  CircularProgress,
  Alert,
  Drawer,
  useTheme,
  useMediaQuery,
  Pagination,
  Rating,
  Tooltip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import { AppDispatch } from '../../store';
import {
  fetchTemplates,
  fetchCategories,
  fetchIndustries,
  fetchFormats,
  fetchFavoriteTemplates,
  fetchPopularTemplates,
  fetchRecommendedTemplates,
  toggleFavoriteTemplate,
  selectTemplates,
  selectCategories,
  selectIndustries,
  selectFormats,
  selectFavoriteTemplates,
  selectPopularTemplates,
  selectRecommendedTemplates,
  selectTemplatesLoading,
  selectTemplatesError,
} from '../../store/slices/templateSlice';
import { Template, TemplateCategory, TemplateIndustry } from '../../services/templateService';
import useAuth from '../../hooks/useAuth';

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
      id={`templates-tabpanel-${index}`}
      aria-labelledby={`templates-tab-${index}`}
      {...other}
      style={{ paddingTop: 16 }}
    >
      {value === index && children}
    </div>
  );
}

// Template card component
interface TemplateCardProps {
  template: Template;
  onFavoriteToggle: () => void;
  isFavorite: boolean;
  onViewDetails: () => void;
  onUseTemplate: () => void;
  onTestTemplate?: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onFavoriteToggle,
  isFavorite,
  onViewDetails,
  onUseTemplate,
  onTestTemplate,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleTestTemplate = () => {
    // If onTestTemplate is provided use that, otherwise navigate directly
    if (onTestTemplate) {
      onTestTemplate();
    } else {
      navigate(`/templates/${template.id}/test`);
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s', 
        '&:hover': { 
          transform: 'translateY(-4px)',
          boxShadow: 4
        },
        position: 'relative' 
      }}
    >
      {template.is_premium && (
        <Chip
          label="Premium"
          color="secondary"
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        />
      )}
      
      {template.preview_image ? (
        <CardMedia
          component="img"
          height="140"
          image={template.preview_image}
          alt={template.title}
        />
      ) : (
        <Box 
          sx={{ 
            height: 140, 
            bgcolor: 'grey.100', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'text.secondary'
          }}
        >
          <Typography variant="body2">{template.format.name}</Typography>
        </Box>
      )}
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="h2" noWrap title={template.title}>
            {template.title}
          </Typography>
          <IconButton size="small" onClick={onFavoriteToggle} aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}>
            {isFavorite ? (
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
            mb: 2, 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            height: '40px' 
          }}
        >
          {template.description}
        </Typography>
        
        <Box sx={{ mb: 1.5 }}>
          <Chip
            size="small"
            label={template.format.name}
            sx={{ mr: 0.5, mb: 0.5 }}
          />
          {template.categories.slice(0, 2).map((category) => (
            <Chip
              key={category.id}
              size="small"
              label={category.name}
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Rating
              value={template.community_rating}
              precision={0.5}
              size="small"
              readOnly
            />
            <Typography variant="body2" sx={{ ml: 0.5 }}>
              ({template.community_rating.toFixed(1)})
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Used {template.usage_count} times
          </Typography>
        </Box>
      </CardContent>
      
      <CardActions sx={{ p: 2, pt: 0, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Button 
          size="small" 
          onClick={onViewDetails}
          aria-label={`View details for ${template.title}`}
        >
          Details
        </Button>
        
        <Button 
          size="small"
          onClick={handleTestTemplate}
          color="info"
          aria-label={`Test ${template.title} template`}
        >
          Test
        </Button>
        
        <Button 
          size="small" 
          color="primary" 
          variant="contained" 
          onClick={onUseTemplate}
          endIcon={<ArrowForwardIcon />}
          sx={{ ml: 'auto' }}
          aria-label={`Use ${template.title} template`}
        >
          Use
        </Button>
      </CardActions>
    </Card>
  );
};

// Filter drawer component
interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  categories: TemplateCategory[];
  industries: TemplateIndustry[];
  selectedCategory: string;
  selectedIndustry: string;
  onCategoryChange: (event: SelectChangeEvent) => void;
  onIndustryChange: (event: SelectChangeEvent) => void;
  onClearFilters: () => void;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  open,
  onClose,
  categories,
  industries,
  selectedCategory,
  selectedIndustry,
  onCategoryChange,
  onIndustryChange,
  onClearFilters,
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 320 }, p: 2 },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <IconButton onClick={onClose} aria-label="Close filters">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            labelId="category-label"
            id="category-select"
            value={selectedCategory}
            label="Category"
            onChange={onCategoryChange}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name} ({category.template_count || 0})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth>
          <InputLabel id="industry-label">Industry</InputLabel>
          <Select
            labelId="industry-label"
            id="industry-select"
            value={selectedIndustry}
            label="Industry"
            onChange={onIndustryChange}
          >
            <MenuItem value="">All Industries</MenuItem>
            {industries.map((industry) => (
              <MenuItem key={industry.id} value={industry.id}>
                {industry.name} ({industry.template_count || 0})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Box sx={{ mt: 'auto', pt: 2 }}>
        <Button 
          fullWidth 
          variant="contained" 
          onClick={onClose}
          aria-label="Apply filters"
        >
          Apply Filters
        </Button>
        <Button 
          fullWidth 
          sx={{ mt: 1 }} 
          onClick={onClearFilters}
          aria-label="Clear filters"
        >
          Clear Filters
        </Button>
      </Box>
    </Drawer>
  );
};

// Main Templates Page
const Templates: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  
  // Redux state
  const templates = useSelector(selectTemplates);
  const categories = useSelector(selectCategories);
  const industries = useSelector(selectIndustries);
  const formats = useSelector(selectFormats);
  const favoriteTemplates = useSelector(selectFavoriteTemplates);
  const popularTemplates = useSelector(selectPopularTemplates);
  const recommendedTemplates = useSelector(selectRecommendedTemplates);
  const loading = useSelector(selectTemplatesLoading);
  const error = useSelector(selectTemplatesError);
  
  // Component state
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const templatesPerPage = 12;
  
  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchIndustries());
    dispatch(fetchFormats());
    dispatch(fetchFavoriteTemplates());
    dispatch(fetchPopularTemplates());
    dispatch(fetchRecommendedTemplates());
    
    // Fetch templates with default filters
    dispatch(fetchTemplates({
      is_featured: true,
      sort_by: 'usage_count',
      sort_dir: 'desc',
      limit: 20
    }));
  }, [dispatch]);
  
  // Handle search
  const handleSearch = () => {
    dispatch(fetchTemplates({
      search: searchQuery,
      category_id: selectedCategory || undefined,
      industry_id: selectedIndustry || undefined
    }));
  };
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    setCurrentPage(1);
    
    // Fetch templates based on selected tab
    if (newValue === 0) {
      // All Templates
      dispatch(fetchTemplates({
        category_id: selectedCategory || undefined,
        industry_id: selectedIndustry || undefined,
        sort_by: 'created_at',
        sort_dir: 'desc'
      }));
    } else if (newValue === 1) {
      // Popular Templates
      dispatch(fetchPopularTemplates(20));
    } else if (newValue === 2) {
      // Recommended Templates
      dispatch(fetchRecommendedTemplates(20));
    } else if (newValue === 3) {
      // Favorites
      dispatch(fetchFavoriteTemplates());
    }
  };
  
  // Handle filter changes
  const handleCategoryChange = (event: SelectChangeEvent) => {
    setSelectedCategory(event.target.value);
  };
  
  const handleIndustryChange = (event: SelectChangeEvent) => {
    setSelectedIndustry(event.target.value);
  };
  
  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedIndustry('');
    setSearchQuery('');
    
    // Re-fetch templates with cleared filters
    dispatch(fetchTemplates({
      sort_by: 'created_at',
      sort_dir: 'desc'
    }));
  };
  
  // Apply filters
  const handleApplyFilters = () => {
    dispatch(fetchTemplates({
      search: searchQuery,
      category_id: selectedCategory || undefined,
      industry_id: selectedIndustry || undefined
    }));
    setFilterDrawerOpen(false);
  };
  
  // Handle pagination
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };
  
  // Calculate pagination
  const getCurrentTemplates = () => {
    let currentTemplates: Template[] = [];
    
    switch (selectedTab) {
      case 0: // All templates
        currentTemplates = templates;
        break;
      case 1: // Popular templates
        currentTemplates = popularTemplates;
        break;
      case 2: // Recommended templates
        currentTemplates = recommendedTemplates;
        break;
      case 3: // Favorite templates
        currentTemplates = favoriteTemplates;
        break;
      default:
        currentTemplates = templates;
    }
    
    const indexOfLastTemplate = currentPage * templatesPerPage;
    const indexOfFirstTemplate = indexOfLastTemplate - templatesPerPage;
    return currentTemplates.slice(indexOfFirstTemplate, indexOfLastTemplate);
  };
  
  // Check if a template is favorited
  const isTemplateFavorited = (templateId: string) => {
    return favoriteTemplates.some(template => template.id === templateId);
  };
  
  // Handle favorite toggle
  const handleToggleFavorite = (templateId: string) => {
    dispatch(toggleFavoriteTemplate({
      templateId,
      isFavorite: isTemplateFavorited(templateId)
    }));
  };
  
  // Handle view template details
  const handleViewDetails = (templateId: string) => {
    navigate(`/templates/${templateId}`);
  };
  
  // Handle use template
  const handleUseTemplate = (templateId: string) => {
    navigate(`/templates/${templateId}/use`);
  };
  
  // Create new template
  const handleCreateTemplate = () => {
    navigate('/templates/new');
  };
  
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Templates Library
          </Typography>
          {user?.is_admin && (
            <Button
              variant="text"
              size="small"
              color="secondary"
              onClick={() => navigate('/templates/admin')}
              sx={{ mt: 0.5 }}
            >
              Admin Tools
            </Button>
          )}
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateTemplate}
          aria-label="Create new template"
        >
          Create Template
        </Button>
      </Box>
      
      {/* Search and filter bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          gap: 2,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <TextField
          placeholder="Search templates..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          aria-label="Search templates"
        />
        
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => setFilterDrawerOpen(true)}
          sx={{ minWidth: 120 }}
          aria-label="Open filter options"
        >
          Filters
        </Button>
        
        <Button
          variant="contained"
          onClick={handleSearch}
          sx={{ minWidth: 120 }}
          aria-label="Search"
        >
          Search
        </Button>
      </Paper>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : undefined}
          aria-label="Template categories tabs"
        >
          <Tab label="All Templates" id="templates-tab-0" aria-controls="templates-tabpanel-0" />
          <Tab label="Popular" id="templates-tab-1" aria-controls="templates-tabpanel-1" />
          <Tab label="Recommended" id="templates-tab-2" aria-controls="templates-tabpanel-2" />
          <Tab label="Favorites" id="templates-tab-3" aria-controls="templates-tabpanel-3" />
        </Tabs>
      </Box>
      
      {/* Error message */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mt: 2, mb: 2 }} 
          action={
            <Button color="inherit" size="small" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          }
        >
          {error}
          {error.includes("Failed to fetch") && (
            <Box mt={1}>
              <Typography variant="body2">
                This could be due to a connection issue or because the template database hasn't been seeded yet.
              </Typography>
              {user?.is_admin && (
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => navigate('/templates/admin')}
                  sx={{ mt: 1 }}
                >
                  Go to Admin Tools
                </Button>
              )}
            </Box>
          )}
        </Alert>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Templates grid */}
      {!loading && (
        <>
          <TabPanel value={selectedTab} index={0}>
            <Grid container spacing={3}>
              {getCurrentTemplates().length === 0 ? (
                <Box sx={{ p: 4, width: '100%', textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    No templates found matching your criteria.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    sx={{ mt: 2 }}
                    aria-label="Clear filters"
                  >
                    Clear Filters
                  </Button>
                </Box>
              ) : (
                getCurrentTemplates().map((template) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
                    <TemplateCard
                      template={template}
                      isFavorite={isTemplateFavorited(template.id)}
                      onFavoriteToggle={() => handleToggleFavorite(template.id)}
                      onViewDetails={() => handleViewDetails(template.id)}
                      onUseTemplate={() => handleUseTemplate(template.id)}
                    />
                  </Grid>
                ))
              )}
            </Grid>
          </TabPanel>
          
          <TabPanel value={selectedTab} index={1}>
            <Grid container spacing={3}>
              {popularTemplates.length === 0 ? (
                <Box sx={{ p: 4, width: '100%', textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    No popular templates available.
                  </Typography>
                </Box>
              ) : (
                getCurrentTemplates().map((template) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
                    <TemplateCard
                      template={template}
                      isFavorite={isTemplateFavorited(template.id)}
                      onFavoriteToggle={() => handleToggleFavorite(template.id)}
                      onViewDetails={() => handleViewDetails(template.id)}
                      onUseTemplate={() => handleUseTemplate(template.id)}
                    />
                  </Grid>
                ))
              )}
            </Grid>
          </TabPanel>
          
          <TabPanel value={selectedTab} index={2}>
            <Grid container spacing={3}>
              {recommendedTemplates.length === 0 ? (
                <Box sx={{ p: 4, width: '100%', textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    No recommended templates available.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Use more templates to get personalized recommendations.
                  </Typography>
                </Box>
              ) : (
                getCurrentTemplates().map((template) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
                    <TemplateCard
                      template={template}
                      isFavorite={isTemplateFavorited(template.id)}
                      onFavoriteToggle={() => handleToggleFavorite(template.id)}
                      onViewDetails={() => handleViewDetails(template.id)}
                      onUseTemplate={() => handleUseTemplate(template.id)}
                    />
                  </Grid>
                ))
              )}
            </Grid>
          </TabPanel>
          
          <TabPanel value={selectedTab} index={3}>
            <Grid container spacing={3}>
              {favoriteTemplates.length === 0 ? (
                <Box sx={{ p: 4, width: '100%', textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    No favorite templates yet.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Click the heart icon on templates you like to save them here.
                  </Typography>
                </Box>
              ) : (
                getCurrentTemplates().map((template) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
                    <TemplateCard
                      template={template}
                      isFavorite={true}
                      onFavoriteToggle={() => handleToggleFavorite(template.id)}
                      onViewDetails={() => handleViewDetails(template.id)}
                      onUseTemplate={() => handleUseTemplate(template.id)}
                    />
                  </Grid>
                ))
              )}
            </Grid>
          </TabPanel>
          
          {/* Pagination */}
          {getCurrentTemplates().length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
              <Pagination
                count={Math.ceil(
                  (selectedTab === 0
                    ? templates.length
                    : selectedTab === 1
                    ? popularTemplates.length
                    : selectedTab === 2
                    ? recommendedTemplates.length
                    : favoriteTemplates.length) / templatesPerPage
                )}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          )}
        </>
      )}
      
      {/* Filter drawer */}
      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        categories={categories}
        industries={industries}
        selectedCategory={selectedCategory}
        selectedIndustry={selectedIndustry}
        onCategoryChange={handleCategoryChange}
        onIndustryChange={handleIndustryChange}
        onClearFilters={handleClearFilters}
      />
    </Box>
  );
};

export default Templates;
