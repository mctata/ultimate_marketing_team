import { useState } from 'react';
import { Box, Typography, Button, Paper, Snackbar, Alert } from '@mui/material';
import ContentCalendarContainer from '../../components/calendar/ContentCalendarContainer';

const ContentCalendar = () => {
  const [projectId, setProjectId] = useState(1); // Default project ID
  const [showHelpTip, setShowHelpTip] = useState(true);
  
  const handleCloseHelpTip = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowHelpTip(false);
  };

  return (
    <Box>
      <ContentCalendarContainer projectId={projectId} />
      
      {/* Help Tip Snackbar */}
      <Snackbar
        open={showHelpTip}
        autoHideDuration={10000}
        onClose={handleCloseHelpTip}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseHelpTip} 
          severity="info" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          Try the different calendar views (month, week, list) for better visualization of your content schedule
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContentCalendar;