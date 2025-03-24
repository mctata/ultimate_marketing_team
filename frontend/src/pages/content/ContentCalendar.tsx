import { useState } from 'react';
import { Box, Typography, Button, Paper, Snackbar, Alert } from '@mui/material';
import ContentCalendarContainer from '../../components/calendar/ContentCalendarContainer';
import SmartSchedulingRecommendations from '../../components/calendar/SmartSchedulingRecommendations';

const ContentCalendar = () => {
  const [projectId, setProjectId] = useState(1); // Default project ID
  const [showHelpTip, setShowHelpTip] = useState(true);
  const [recommendedDate, setRecommendedDate] = useState<Date | null>(null);
  const [recommendedPlatform, setRecommendedPlatform] = useState<string | null>(null);
  
  // Handle recommendation application
  const handleApplyRecommendation = (date: Date, platform: string) => {
    setRecommendedDate(date);
    setRecommendedPlatform(platform);
    // Show success message
    setShowHelpTip(true);
  };
  
  const handleCloseHelpTip = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowHelpTip(false);
  };

  return (
    <Box>
      {/* Smart Scheduling Recommendations Component */}
      <SmartSchedulingRecommendations 
        projectId={projectId} 
        onApplyRecommendation={handleApplyRecommendation}
      />
      
      {/* Content Calendar Container */}
      <ContentCalendarContainer 
        projectId={projectId} 
        recommendedDate={recommendedDate}
        recommendedPlatform={recommendedPlatform}
      />
      
      {/* Help Tip Snackbar */}
      <Snackbar
        open={showHelpTip}
        autoHideDuration={8000}
        onClose={handleCloseHelpTip}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseHelpTip} 
          severity="info" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {recommendedDate ? 
            `Optimal posting time applied: ${recommendedDate.toLocaleString()} for ${recommendedPlatform}` :
            'Try the different calendar views (month, week, list) for better visualization of your content schedule'
          }
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContentCalendar;