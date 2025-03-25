import { useState, lazy, Suspense } from 'react';
import { Box, Typography, Button, Paper, Snackbar, Alert, CircularProgress } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import GlobalErrorFallback from '../../components/common/GlobalErrorFallback';

// Use lazy loading to improve initial load performance
const ContentCalendarContainer = lazy(() => 
  import('../../components/calendar/ContentCalendarContainer')
);
const SmartSchedulingRecommendations = lazy(() => 
  import('../../components/calendar/SmartSchedulingRecommendations')
);

// Loading fallback component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
    <CircularProgress />
  </Box>
);

const ContentCalendarContent = () => {
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
      {/* Smart Scheduling Recommendations Component with Suspense */}
      <Suspense fallback={<LoadingFallback />}>
        <SmartSchedulingRecommendations 
          projectId={projectId} 
          onApplyRecommendation={handleApplyRecommendation}
        />
      </Suspense>
      
      {/* Content Calendar Container with Suspense */}
      <Suspense fallback={<LoadingFallback />}>
        <ContentCalendarContainer 
          projectId={projectId} 
          recommendedDate={recommendedDate}
          recommendedPlatform={recommendedPlatform}
        />
      </Suspense>
      
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

// Wrap the component with ErrorBoundary
const ContentCalendar = () => {
  return (
    <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
      <ContentCalendarContent />
    </ErrorBoundary>
  );
};

export default ContentCalendar;