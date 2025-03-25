import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import GlobalErrorFallback from '../../components/common/GlobalErrorFallback';
import contentCalendarService from '../../services/contentCalendarService';

// Super lightweight calendar component - bare minimum implementation
const SimpleContentCalendar = () => {
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Load basic data
  const loadCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      // Get static data directly from service without API calls
      const insightsData = await contentCalendarService.getCalendarInsights('1');
      setInsights(insightsData.data);
      
      // Minimal calendar data
      setCalendarData([
        { id: 1, title: "Instagram Post", scheduled_date: "2025-03-25T10:00:00Z", platform: "instagram" },
        { id: 2, title: "Facebook Promotion", scheduled_date: "2025-03-26T14:30:00Z", platform: "facebook" },
        { id: 3, title: "Monthly Newsletter", scheduled_date: "2025-03-27T09:00:00Z", platform: "email" }
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Load data on mount
  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }
  
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
        {insights.map(insight => (
          <Alert 
            key={insight.id} 
            severity={insight.severity || "info"} 
            sx={{ mb: 1 }}
          >
            {insight.message}
          </Alert>
        ))}
      </Paper>
      
      {/* Simple calendar entries */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upcoming Content
        </Typography>
        {calendarData.map(item => (
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
    </Box>
  );
};

// Wrap with error boundary
const ContentCalendar = () => (
  <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
    <SimpleContentCalendar />
  </ErrorBoundary>
);

export default ContentCalendar;