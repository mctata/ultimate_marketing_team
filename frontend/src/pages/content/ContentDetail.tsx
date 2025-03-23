import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Paper, 
  Divider, 
  Grid, 
  Chip,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const ContentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState<any>(null);
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // If id is "new", set up a new content creation view
      if (id === "new") {
        setContent({
          isNew: true,
          title: "",
          type: "",
          status: "draft"
        });
      } else {
        // Mock content for demo purposes
        setContent({
          id,
          title: "Sample Content Title",
          type: "blog",
          status: "published",
          date: "2025-03-15",
          author: "Jane Smith",
          content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Sed euismod, nisl nec ultricies lacinia, nisl nisl aliquet nisl, nec aliquet nisl nisl nec nisl.",
          score: 92,
          performance: {
            views: 1250,
            engagement: 4.8,
            conversion: 2.3
          }
        });
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, [id]);
  
  const handleBack = () => {
    navigate('/content');
  };
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {id === 'new' ? 'Create New Content' : 'Content Detail'}
          </Typography>
        </Box>
        
        {id !== 'new' && (
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<DeleteIcon />} 
              color="error"
              sx={{ mr: 2 }}
            >
              Delete
            </Button>
            <Button 
              variant="contained" 
              startIcon={<EditIcon />}
            >
              Edit Content
            </Button>
          </Box>
        )}
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : id === 'new' ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          This is where the content creation form will be displayed. You'll be able to create new content items here.
        </Alert>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight="medium" gutterBottom>
              {content?.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={content?.type} size="small" color="primary" />
              <Chip label={content?.status} size="small" color="success" />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Created by {content?.author} on {content?.date}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body1" paragraph>
            {content?.content}
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Content Performance
          </Typography>
          
          <Grid container spacing={4} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Views
                  </Typography>
                  <Typography variant="h4">
                    {content?.performance?.views.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Engagement Rate
                  </Typography>
                  <Typography variant="h4">
                    {content?.performance?.engagement}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Conversion Rate
                  </Typography>
                  <Typography variant="h4">
                    {content?.performance?.conversion}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default ContentDetail;