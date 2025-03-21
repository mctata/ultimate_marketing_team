import React from 'react';
import { FallbackProps } from 'react-error-boundary';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';

/**
 * Global error fallback component for the app
 * Used by the ErrorBoundary to display errors that occur in the app
 */
const GlobalErrorFallback: React.FC<FallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
    resetErrorBoundary();
  };

  // Log the error to the console in development
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.error('Error caught by ErrorBoundary:', error);
    }
    
    // In production, we would log this to an error tracking service like Sentry
    // if (import.meta.env.PROD) {
    //   captureException(error);
    // }
  }, [error]);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 64 }} />
          
          <Typography variant="h4" component="h1" gutterBottom>
            Something went wrong
          </Typography>
          
          <Typography variant="body1" color="text.secondary" align="center">
            We encountered an unexpected error. Our team has been notified.
          </Typography>
          
          {import.meta.env.DEV && (
            <Box 
              sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: 'grey.100', 
                borderRadius: 1,
                width: '100%',
                overflow: 'auto'
              }}
            >
              <Typography variant="subtitle2" component="h3" gutterBottom>
                Error details:
              </Typography>
              <Typography 
                variant="body2" 
                component="pre" 
                sx={{ 
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </Typography>
            </Box>
          )}
          
          <Box display="flex" gap={2} mt={2}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={resetErrorBoundary}
              startIcon={<RefreshIcon />}
            >
              Try again
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={handleGoHome}
              startIcon={<HomeIcon />}
            >
              Go to home page
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default GlobalErrorFallback;