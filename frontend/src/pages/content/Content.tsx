import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';

const Content = () => {
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Content
        </Typography>
        
        <Button variant="contained">
          Create Content
        </Button>
      </Box>
      
      <Typography variant="body1">
        Content management page coming soon.
      </Typography>
    </Box>
  );
};

export default Content;