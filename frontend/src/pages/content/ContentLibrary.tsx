import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Chip, 
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import CreateMenu from '../../components/common/CreateMenu';
import { 
  Search as SearchIcon, 
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Share as ShareIcon,
  Archive as ArchiveIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import contentService, { ContentItem } from '../../services/contentService';

// ContentLibrary component
const ContentLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const { selectedBrand } = useSelector((state: RootState) => state.brands);

  // Load brand-specific content
  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (selectedBrand) {
          console.log('Loading content for brand:', selectedBrand.id);
          const items = await contentService.getContentItems(selectedBrand.id);
          setContentItems(items);
          setFilteredContent(items);
        } else {
          console.log('No brand selected, using all content');
          const items = await contentService.getContentItems();
          setContentItems(items);
          setFilteredContent(items);
        }
      } catch (err) {
        console.error('Error loading content:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadContent();
  }, [selectedBrand]);

  // Handle search input change
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call delay
    const timeoutId = setTimeout(() => {
      const filtered = contentItems.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContent(filtered);
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, contentItems]);

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, contentId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedContentId(contentId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedContentId(null);
  };
  
  // Helper functions for styling
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Content Library
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ width: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton 
                    aria-label="clear search" 
                    onClick={() => setSearchTerm('')} 
                    edge="end"
                    size="small"
                  >
                    <IconButton size="small">×</IconButton>
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Button 
            variant="outlined" 
            startIcon={<FilterListIcon />}
          >
            Filter
          </Button>
          
          <CreateMenu />
        </Box>
      </Box>
      
      {/* Content type filter chips */}
      <Box sx={{ mb: 4, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip 
          label="All Content" 
          onClick={() => setSearchTerm('')}
          color={!searchTerm ? "primary" : "default"}
          sx={{ borderRadius: 1.5 }}
        />
        <Chip 
          label="Blog Posts" 
          onClick={() => setSearchTerm('blog')}
          color={searchTerm === 'blog' ? "primary" : "default"}
          sx={{ borderRadius: 1.5 }}
        />
        <Chip 
          label="Social Media" 
          onClick={() => setSearchTerm('social')}
          color={searchTerm === 'social' ? "primary" : "default"}
          sx={{ borderRadius: 1.5 }}
        />
        <Chip 
          label="Email" 
          onClick={() => setSearchTerm('email')}
          color={searchTerm === 'email' ? "primary" : "default"}
          sx={{ borderRadius: 1.5 }}
        />
        <Chip 
          label="Ad Copy" 
          onClick={() => setSearchTerm('ad')}
          color={searchTerm === 'ad' ? "primary" : "default"}
          sx={{ borderRadius: 1.5 }}
        />
      </Box>
      
      {/* Loading indicator */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Error message */}
      {error && (
        <Box sx={{ my: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button 
            variant="outlined" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </Box>
      )}
      
      {/* Brand selection message */}
      {!isLoading && !error && !selectedBrand && (
        <Box sx={{ my: 4 }}>
          <Alert severity="info">
            Please select a brand from the dropdown in the header to view brand-specific content.
          </Alert>
        </Box>
      )}
      
      {/* No results message */}
      {!isLoading && !error && filteredContent.length === 0 && (
        <Box sx={{ textAlign: 'center', my: 6 }}>
          <Typography variant="h6" color="text.secondary">
            No content items found matching your search.
          </Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => setSearchTerm('')}
          >
            Clear Search
          </Button>
        </Box>
      )}
      
      {/* Content grid */}
      {!isLoading && filteredContent.length > 0 && (
        <Grid container spacing={3}>
          {filteredContent.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card 
                variant="outlined" 
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
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip 
                      label={item.type} 
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
                    startIcon={<ViewIcon />}
                    onClick={() => navigate(`/content/${item.id}`)}
                  >
                    View
                  </Button>
                  <Button 
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/content/${item.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <IconButton 
                    size="small" 
                    sx={{ ml: 'auto' }}
                    onClick={(e) => handleMenuOpen(e, item.id)}
                    aria-label="more options"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Content actions menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <DuplicateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Archive</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ContentLibrary;