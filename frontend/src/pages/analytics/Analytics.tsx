import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';

const Analytics = () => {
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Analytics
        </Typography>
        
        <Button variant="contained">
          Export Report
        </Button>
      </Box>
      
      <Typography variant="body1">
        Analytics dashboard coming soon.
      </Typography>
    </Box>
  );
};

export default Analytics;