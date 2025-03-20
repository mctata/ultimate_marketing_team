import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress } from '@mui/material';

const ContentDetail = () => {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Content Detail
        </Typography>
        
        <Button variant="contained">
          Edit Content
        </Button>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Typography variant="body1">
          Content details for ID: {id} will be displayed here.
        </Typography>
      )}
    </Box>
  );
};

export default ContentDetail;