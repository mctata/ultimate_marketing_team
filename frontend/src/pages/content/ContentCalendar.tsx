import React, { useState } from 'react';
import { Box, Typography, Snackbar, Alert, CircularProgress, Paper } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import GlobalErrorFallback from '../../components/common/GlobalErrorFallback';
import contentCalendarService from '../../services/contentCalendarService';

// Simple placeholder calendar component until staging environment is ready
const ContentCalendarPage = () => {
  const [showHelpTip, setShowHelpTip] = useState(true);
  
  const handleCloseHelpTip = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowHelpTip(false);
  };
  
  // Get direct access to the static mock data
  const calendarEntries = [
    { id: 1, title: "Instagram Post", scheduled_date: "2025-03-25T10:00:00Z", platform: "instagram" },
    { id: 2, title: "Facebook Promotion", scheduled_date: "2025-03-26T14:30:00Z", platform: "facebook" },
    { id: 3, title: "Monthly Newsletter", scheduled_date: "2025-03-27T09:00:00Z", platform: "email" }
  ];
  
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Content Calendar
      </Typography>
      
      {/* Insights section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Calendar Insights
        </Typography>
        {contentCalendarService._staticCalendarInsights.map(insight => (
          <Alert 
            key={insight.id} 
            severity={insight.severity as "error" | "warning" | "info" | "success"}
            sx={{ mb: 1 }}
          >
            {insight.message}
          </Alert>
        ))}
      </Paper>
      
      {/* Calendar entries */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upcoming Content
        </Typography>
        {calendarEntries.map(item => (
          <Box 
            key={item.id} 
            sx={{ 
              p: 2, 
              mb: 1, 
              border: '1px solid #eee', 
              borderRadius: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box>
              <Typography variant="subtitle1">
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Platform: {item.platform}
              </Typography>
            </Box>
            <Typography variant="body2">
              {new Date(item.scheduled_date).toLocaleString()}
            </Typography>
          </Box>
        ))}
      </Paper>
      
      {/* Note about staging */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Calendar Status
        </Typography>
        <Typography variant="body2">
          This is a simplified calendar view while the staging environment is being set up.
          The full calendar with all features will be available once connected to the backend.
        </Typography>
      </Paper>
      
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
          This is a simplified calendar view until staging is set up
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Wrap with error boundary
const ContentCalendar = () => (
  <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
    <ContentCalendarPage />
  </ErrorBoundary>
);

export default ContentCalendar;