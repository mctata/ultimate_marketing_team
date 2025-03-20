import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';

const Settings = () => {
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Settings
        </Typography>
        
        <Button variant="contained">
          Save Changes
        </Button>
      </Box>
      
      <Typography variant="body1">
        Application settings page coming soon.
      </Typography>
    </Box>
  );
};

export default Settings;