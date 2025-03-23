import { useState } from 'react';
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
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, 
  ArrowForward as ArrowForwardIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  AutoStories as AutoStoriesIcon,
  CompareArrows as CompareArrowsIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Tune as TuneIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Content = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  
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
    }
  ];
  
  // Get the navigate function from react-router-dom
  const navigate = useNavigate();
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, contentId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedContentId(contentId);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedContentId(null);
  };
  
  const handleCreateContent = () => {
    // Navigate to the content generator page
    navigate('/content/generator');
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
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Content Management
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            placeholder="Search content..."
            size="small"
            sx={{ mr: 2, width: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          
          <IconButton size="small" sx={{ mr: 2 }}>
            <FilterListIcon />
          </IconButton>
          
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleCreateContent}
          >
            Create Content
          </Button>
        </Box>
      </Box>
      
      {/* AI Content Tools Section MOVED ABOVE content items */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          AI Content Tools
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card 
              variant="outlined" 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 3
                }
              }}
              onClick={handleCreateContent}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <AutoStoriesIcon color="primary" fontSize="large" />
                  <Chip label="New" color="primary" size="small" />
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  Content Generator
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Generate high-quality content using AI templates. Create blog posts, emails, social media updates, and more with customizable templates.
                </Typography>
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleCreateContent}
                >
                  Open Tool
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card 
              variant="outlined" 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <TuneIcon color="primary" fontSize="large" />
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  Content Optimizer
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Analyze and improve your existing content. Get recommendations for SEO, readability, and engagement enhancements.
                </Typography>
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                >
                  Open Tool
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card 
              variant="outlined" 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <CompareArrowsIcon color="primary" fontSize="large" />
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  A/B Testing Center
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Create and manage A/B tests for your content. Compare different versions and measure performance metrics.
                </Typography>
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                >
                  Open Tool
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      <Typography variant="h5" component="h2" fontWeight="medium" sx={{ mb: 2 }}>
        Content Library
      </Typography>
      
      <Grid container spacing={3}>
        {contentItems.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item.id}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                  startIcon={<VisibilityIcon />}
                >
                  View
                </Button>
                <Button 
                  size="small"
                  startIcon={<EditIcon />}
                >
                  Edit
                </Button>
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
      
      {/* Content Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
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
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <CompareArrowsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Create A/B Test</ListItemText>
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

export default Content;