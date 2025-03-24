import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Card, CardContent, Typography, Box } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * API Error Boundary Component
 * 
 * A component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 * Specialized for handling API-related errors in the application.
 */
class APIErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('API Error caught by boundary:', error, errorInfo);
    
    this.setState({
      errorInfo
    });
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    // Reset the error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Call the onRetry callback if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Check if a custom fallback is provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI
      return (
        <Card sx={{ mt: 2, mb: 2, borderLeft: 5, borderColor: 'error.main' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <ErrorOutline color="error" fontSize="large" sx={{ mr: 2 }} />
              <Typography variant="h6" component="h2" color="error">
                API Error
              </Typography>
            </Box>
            
            <Alert severity="error" sx={{ mb: 2 }}>
              {this.state.error?.message || 'An unexpected error occurred while fetching data.'}
            </Alert>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Please try again or contact support if the problem persists.
            </Typography>
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={this.handleRetry}
              sx={{ mr: 1 }}
            >
              Retry
            </Button>
            
            <Button 
              variant="outlined"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </CardContent>
        </Card>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

export default APIErrorBoundary;