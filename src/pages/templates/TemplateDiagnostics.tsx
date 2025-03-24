import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Alert, 
  CircularProgress, 
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid
} from '@mui/material';
import { 
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import templateApiMonitor from '../../../frontend/src/services/templateApiMonitor';
import { resetApiAvailabilityCheck } from '../../../frontend/src/services/templateServiceFactory';

/**
 * Template API diagnostics component
 * Provides an interface for checking template API health and viewing stats
 */
const TemplateDiagnostics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [checkResults, setCheckResults] = useState<Record<string, boolean> | null>(null);
  const [apiStats, setApiStats] = useState(templateApiMonitor.getTemplateApiStats());
  const [error, setError] = useState('');
  
  const runDiagnostics = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Reset API availability cache
      resetApiAvailabilityCheck();
      
      // Test all endpoints
      const results = await templateApiMonitor.testAllTemplateEndpoints();
      setCheckResults(results);
      
      // Update stats
      setApiStats(templateApiMonitor.getTemplateApiStats());
    } catch (error) {
      console.error('Error running diagnostics:', error);
      setError('Error running diagnostics. Check console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  // Run diagnostics on mount
  useEffect(() => {
    runDiagnostics();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      runDiagnostics();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate overall availability
  const getOverallStatus = (): boolean => {
    if (!checkResults) return false;
    const results = Object.values(checkResults);
    return results.some(result => result === true);
  };
  
  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Template API Diagnostics
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Endpoint Status
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                onClick={runDiagnostics}
                disabled={loading}
              >
                {loading ? 'Checking...' : 'Run Diagnostics'}
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {loading && !checkResults ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Box mb={2} display="flex" alignItems="center">
                  <Typography variant="subtitle1" mr={1}>
                    Overall Status:
                  </Typography>
                  {getOverallStatus() ? (
                    <Chip
                      icon={<CheckIcon />}
                      label="Available"
                      color="success"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      icon={<CancelIcon />}
                      label="Unavailable"
                      color="error"
                      variant="outlined"
                    />
                  )}
                </Box>
                
                <List>
                  {checkResults && Object.entries(checkResults).map(([key, value]) => (
                    <ListItem key={key}>
                      <ListItemText primary={`${key.charAt(0).toUpperCase() + key.slice(1)} Endpoint`} />
                      {value ? (
                        <Chip
                          icon={<CheckIcon />}
                          label="OK"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<CancelIcon />}
                          label="Failed"
                          color="error"
                          size="small"
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              API Statistics
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <List>
              <ListItem>
                <ListItemText 
                  primary="Success Rate" 
                  secondary={`${apiStats.uptime.toFixed(1)}%`} 
                />
                <Chip
                  label={apiStats.uptime > 90 ? "Healthy" : apiStats.uptime > 70 ? "Degraded" : "Unhealthy"}
                  color={apiStats.uptime > 90 ? "success" : apiStats.uptime > 70 ? "warning" : "error"}
                  size="small"
                />
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Successful Requests" 
                  secondary={apiStats.successCount.toString()} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Failed Requests" 
                  secondary={apiStats.errorCount.toString()} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Average Response Time" 
                  secondary={apiStats.averageDuration ? `${apiStats.averageDuration.toFixed(1)} ms` : "N/A"} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Last Success" 
                  secondary={apiStats.lastSuccess ? apiStats.lastSuccess.toLocaleString() : "N/A"} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Last Error" 
                  secondary={apiStats.lastError ? apiStats.lastError.toLocaleString() : "N/A"} 
                />
              </ListItem>
            </List>
            
            {apiStats.errorMessages.length > 0 && (
              <>
                <Typography variant="subtitle1" mt={2} mb={1}>
                  Recent Errors
                </Typography>
                <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                  {apiStats.errorMessages.map((msg, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary={msg.length > 100 ? `${msg.substring(0, 100)}...` : msg}
                        primaryTypographyProps={{ variant: 'body2', color: 'error.main' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      <Box mt={3}>
        <Typography variant="body2" color="textSecondary">
          * The template service uses mock data as a fallback when the API is unavailable. This page helps diagnose connectivity issues with the actual template API. Even if the API is down, the application will continue to function with mock data.
        </Typography>
      </Box>
    </Box>
  );
};

export default TemplateDiagnostics;