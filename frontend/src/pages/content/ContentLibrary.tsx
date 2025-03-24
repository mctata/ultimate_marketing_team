import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  FormControl,
  Select,
  InputLabel,
  Snackbar,
  Alert,
  Paper
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  FolderSpecial as FolderSpecialIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  SortByAlpha as SortByAlphaIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Mock data for content items
const contentItems = [
  {
    id: '1',
    title: 'Top 10 Marketing Trends for 2025',
    type: 'blog',
    status: 'published',
    date: '2025-03-15',
    author: 'Jane Smith',
    score: 92,
    isFavorite: true,
    categories: ['Marketing', 'Trends'],
    description: 'An in-depth analysis of the emerging marketing trends for 2025 and how to leverage them for business growth.',
    performance: {
      views: 1250,
      engagement: 4.8,
      conversion: 2.3
    }
  },
  {
    id: '2',
    title: 'March Newsletter: Product Updates',
    type: 'email',
    status: 'scheduled',
    date: '2025-03-25',
    author: 'John Doe',
    score: 88,
    isFavorite: false,
    categories: ['Newsletter', 'Product'],
    description: 'Monthly newsletter highlighting new product features, updates, and customer success stories.',
    performance: {
      views: 0,
      engagement: 0,
      conversion: 0
    }
  },
  {
    id: '3',
    title: 'Spring Sale Announcement',
    type: 'social',
    status: 'draft',
    date: '2025-03-10',
    author: 'Sarah Johnson',
    score: 76,
    isFavorite: false,
    categories: ['Promotion', 'Social Media'],
    description: 'Promotional content for the upcoming spring sale campaign, optimized for social media channels.',
    performance: {
      views: 0,
      engagement: 0,
      conversion: 0
    }
  },
  {
    id: '4',
    title: 'Product Launch: Next-Gen Platform',
    type: 'blog',
    status: 'published',
    date: '2025-03-05',
    author: 'Michael Brown',
    score: 95,
    isFavorite: true,
    categories: ['Product Launch', 'Technology'],
    description: 'Detailed product launch article showcasing features, benefits, and customer testimonials for our next-gen platform.',
    performance: {
      views: 3200,
      engagement: 5.2,
      conversion: 3.7
    }
  },
  {
    id: '5',
    title: 'Customer Success Story: Global Tech Solutions',
    type: 'case-study',
    status: 'published',
    date: '2025-02-28',
    author: 'Emma Wilson',
    score: 91,
    isFavorite: false,
    categories: ['Case Study', 'Customer Success'],
    description: 'A compelling case study highlighting how Global Tech Solutions achieved 200% ROI using our platform.',
    performance: {
      views: 850,
      engagement: 4.5,
      conversion: 3.2
    }
  },
  {
    id: '6',
    title: 'Weekly Social Media Content Plan',
    type: 'social',
    status: 'draft',
    date: '2025-03-18',
    author: 'Alex Turner',
    score: 82,
    isFavorite: false,
    categories: ['Social Media', 'Content Calendar'],
    description: 'Planned social media content for the upcoming week, including copy, images, and posting schedule.',
    performance: {
      views: 0,
      engagement: 0,
      conversion: 0
    }
  }
];

const contentTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'blog', label: 'Blog Posts' },
  { value: 'email', label: 'Email Campaigns' },
  { value: 'social', label: 'Social Media' },
  { value: 'case-study', label: 'Case Studies' },
  { value: 'whitepaper', label: 'Whitepapers' },
  { value: 'ad', label: 'Advertising' }
];

const contentStatuses = [
  { value: 'all', label: 'All Statuses' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'draft', label: 'Draft' }
];

const contentCategories = [
  { value: 'all', label: 'All Categories' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Trends', label: 'Trends' },
  { value: 'Product', label: 'Product' },
  { value: 'Newsletter', label: 'Newsletter' },
  { value: 'Social Media', label: 'Social Media' },
  { value: 'Promotion', label: 'Promotion' },
  { value: 'Case Study', label: 'Case Study' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Customer Success', label: 'Customer Success' },
  { value: 'Product Launch', label: 'Product Launch' },
  { value: 'Content Calendar', label: 'Content Calendar' }
];

const ContentLibrary = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [filteredItems, setFilteredItems] = useState(contentItems);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Filter and sort items whenever filters or sort options change
    let filtered = [...contentItems];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.categories.includes(categoryFilter));
    }
    
    // Apply tab filter
    if (tabValue === 1) { // Favorites
      filtered = filtered.filter(item => item.isFavorite);
    } else if (tabValue === 2) { // Published
      filtered = filtered.filter(item => item.status === 'published');
    } else if (tabValue === 3) { // Drafts
      filtered = filtered.filter(item => item.status === 'draft');
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'score') {
        comparison = a.score - b.score;
      } else if (sortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredItems(filtered);
  }, [searchTerm, typeFilter, statusFilter, categoryFilter, sortBy, sortOrder, tabValue]);
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, contentId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedContentId(contentId);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedContentId(null);
  };
  
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };
  
  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };
  
  const handleToggleFavorite = (id: string) => {
    // In a real application, this would call an API
    // For now, we'll just update the mock data
    const updatedItems = contentItems.map(item => {
      if (item.id === id) {
        return { ...item, isFavorite: !item.isFavorite };
      }
      return item;
    });
    
    // Update the "contentItems" array
    contentItems.length = 0;
    contentItems.push(...updatedItems);
    
    // Refresh filtered items
    setFilteredItems([...filteredItems.map(item => {
      if (item.id === id) {
        return { ...item, isFavorite: !item.isFavorite };
      }
      return item;
    })]);
    
    setSnackbarMessage(`${contentItems.find(item => item.id === id)?.isFavorite ? 'Added to' : 'Removed from'} favorites`);
    setSnackbarOpen(true);
  };
  
  const handleCreateContent = () => {
    navigate('/content/generator');
  };
  
  const handleViewContent = (id: string) => {
    navigate(`/content/${id}`);
  };
  
  const handleEditContent = (id: string) => {
    navigate(`/content/${id}/edit`);
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return '#4caf50'; // green
      case 'scheduled':
        return '#2196f3'; // blue
      case 'draft':
        return '#ff9800'; // orange
      default:
        return '#9e9e9e'; // grey
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'blog':
        return '#4caf50'; // green
      case 'email':
        return '#2196f3'; // blue
      case 'social':
        return '#9c27b0'; // purple
      case 'ad':
        return '#f44336'; // red
      case 'case-study':
        return '#795548'; // brown
      case 'whitepaper':
        return '#607d8b'; // blue-grey
      default:
        return '#9e9e9e'; // grey
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4caf50'; // green
    if (score >= 70) return '#ff9800'; // orange
    return '#f44336'; // red
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Content Library
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            placeholder="Search content..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mr: 2, width: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          
          <IconButton 
            size="small" 
            sx={{ mr: 2 }}
            onClick={handleFilterMenuOpen}
          >
            <FilterListIcon />
          </IconButton>
          
          <Button 
            variant="contained" 
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleCreateContent}
          >
            Create Content
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Paper>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            aria-label="content library tabs"
          >
            <Tab label="All Content" />
            <Tab label="Favorites" icon={<FavoriteIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Published" />
            <Tab label="Drafts" />
          </Tabs>
        </Paper>
      </Box>
      
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
            <InputLabel id="sort-by-label">Sort By</InputLabel>
            <Select
              labelId="sort-by-label"
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
              size="small"
            >
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="title">Title</MenuItem>
              <MenuItem value="score">Score</MenuItem>
              <MenuItem value="type">Type</MenuItem>
            </Select>
          </FormControl>
          
          <IconButton size="small" onClick={toggleSortOrder}>
            {sortOrder === 'asc' ? <SortByAlphaIcon /> : <SortIcon />}
          </IconButton>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {filteredItems.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item.id}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Chip 
                    label={item.type.replace('-', ' ')} 
                    size="small" 
                    sx={{ 
                      bgcolor: getTypeColor(item.type), 
                      color: 'white',
                      textTransform: 'capitalize'
                    }} 
                  />
                  <Chip 
                    label={item.status} 
                    size="small" 
                    sx={{ 
                      bgcolor: getStatusColor(item.status), 
                      color: 'white',
                      textTransform: 'capitalize'
                    }} 
                  />
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  {item.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {item.description}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {item.categories.map((category, index) => (
                    <Chip 
                      key={index} 
                      label={category} 
                      size="small" 
                      variant="outlined" 
                      onClick={() => setCategoryFilter(category)}
                    />
                  ))}
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Created by {item.author} on {item.date}
                </Typography>
                
                {item.status === 'published' && (
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Views
                        </Typography>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {item.performance.views.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Engagement
                        </Typography>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {item.performance.engagement}%
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Conversion
                        </Typography>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {item.performance.conversion}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Quality Score:
                  </Typography>
                  <Box 
                    sx={{ 
                      display: 'inline-block',
                      ml: 1,
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      bgcolor: getScoreColor(item.score),
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.75rem',
                    }}
                  >
                    {item.score}/100
                  </Box>
                </Box>
              </CardContent>
              
              <Divider />
              
              <CardActions>
                <Button 
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleViewContent(item.id)}
                >
                  View
                </Button>
                <Button 
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditContent(item.id)}
                >
                  Edit
                </Button>
                <IconButton 
                  size="small" 
                  color={item.isFavorite ? "primary" : "default"}
                  onClick={() => handleToggleFavorite(item.id)}
                  aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {item.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
                <IconButton 
                  size="small" 
                  sx={{ ml: 'auto' }}
                  onClick={(e) => handleMenuOpen(e, item.id)}
                >
                  <MoreVertIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={handleFilterMenuClose}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">Filter By:</Typography>
        </MenuItem>
        
        <MenuItem>
          <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="content-type-label">Content Type</InputLabel>
            <Select
              labelId="content-type-label"
              value={typeFilter}
              label="Content Type"
              onChange={(e) => setTypeFilter(e.target.value)}
              size="small"
            >
              {contentTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </MenuItem>
        
        <MenuItem>
          <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="content-status-label">Status</InputLabel>
            <Select
              labelId="content-status-label"
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
            >
              {contentStatuses.map((status) => (
                <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </MenuItem>
        
        <MenuItem>
          <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="content-category-label">Category</InputLabel>
            <Select
              labelId="content-category-label"
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
              size="small"
            >
              {contentCategories.map((category) => (
                <MenuItem key={category.value} value={category.value}>{category.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => {
          setTypeFilter('all');
          setStatusFilter('all');
          setCategoryFilter('all');
          setSearchTerm('');
          handleFilterMenuClose();
        }}>
          <Button fullWidth variant="outlined" size="small">
            Reset Filters
          </Button>
        </MenuItem>
      </Menu>
      
      {/* Content Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedContentId) {
            handleViewContent(selectedContentId);
          }
          handleMenuClose();
        }}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedContentId) {
            handleEditContent(selectedContentId);
          }
          handleMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedContentId) {
            handleToggleFavorite(selectedContentId);
          }
          handleMenuClose();
        }}>
          <ListItemIcon>
            {selectedContentId && contentItems.find(item => item.id === selectedContentId)?.isFavorite 
              ? <FavoriteIcon fontSize="small" color="primary" />
              : <FavoriteBorderIcon fontSize="small" />
            }
          </ListItemIcon>
          <ListItemText>
            {selectedContentId && contentItems.find(item => item.id === selectedContentId)?.isFavorite 
              ? 'Remove from Favorites' 
              : 'Add to Favorites'
            }
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <FolderSpecialIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add to Collection</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContentLibrary;