import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';

const ContentCalendar = () => {
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Content Calendar
        </Typography>
        
        <Button variant="contained">
          Schedule Content
        </Button>
      </Box>
      
      <Typography variant="body1">
        Content calendar view coming soon.
      </Typography>
    </Box>
  );
};

export default ContentCalendar;