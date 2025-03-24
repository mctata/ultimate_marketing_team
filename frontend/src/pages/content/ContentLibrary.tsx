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
  CircularProgress
} from '@mui/material';
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

// Mock content items for the library
const contentItems = [
  {
    id: '1',
    title: 'Top 10 Marketing Trends for 2025',
    type: 'blog',
    status: 'published',
    date: '2025-03-15',
    author: 'Jane Smith',
    score: 92,
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
    performance: {
      views: 3200,
      engagement: 5.2,
      conversion: 3.7
    }
  },
  {
    id: '5',
    title: 'Customer Success Story: ABC Corp',
    type: 'blog',
    status: 'published',
    date: '2025-02-28',
    author: 'Emily Chen',
    score: 90,
    performance: {
      views: 980,
      engagement: 4.1,
      conversion: 1.9
    }
  },
  {
    id: '6',
    title: 'Social Media Campaign April',
    type: 'social',
    status: 'draft',
    date: '2025-03-18',
    author: 'Chris Wilson',
    score: 82,
    performance: {
      views: 0,
      engagement: 0,
      conversion: 0
    }
  },
  {
    id: '7',
    title: 'Product Feature Announcement',
    type: 'email',
    status: 'scheduled',
    date: '2025-03-30',
    author: 'Alex Taylor',
    score: 85,
    performance: {
      views: 0,
      engagement: 0,
      conversion: 0
    }
  },
  {
    id: '8',
    title: 'How AI is Transforming Marketing',
    type: 'blog',
    status: 'published',
    date: '2025-02-20',
    author: 'Jane Smith',
    score: 91,
    performance: {
      views: 1870,
      engagement: 4.9,
      conversion: 2.8
    }
  }
];

// ContentLibrary component
const ContentLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContent, setFilteredContent] = useState(contentItems);
  const [isLoading, setIsLoading] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);

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
  }, [searchTerm]);

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
          
          <Button 
            variant="contained" 
            onClick={() => navigate('/content/create')}
          >
            Create Content
          </Button>
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
      
      {/* No results message */}
      {!isLoading && filteredContent.length === 0 && (
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