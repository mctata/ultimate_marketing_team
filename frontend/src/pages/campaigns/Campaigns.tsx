import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';

const Campaigns = () => {
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Campaigns
        </Typography>
        
        <Button variant="contained">
          Create Campaign
        </Button>
      </Box>
      
      <Typography variant="body1">
        Campaigns management page coming soon.
      </Typography>
    </Box>
  );
};

export default Campaigns;