import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, Paper, CircularProgress, Alert } from '@mui/material';
import templateService from '../../services/templateServiceFactory';
import useAuth from '../../hooks/useAuth';

/**
 * Admin utility component for managing templates
 */
const AdminTemplatesUtility: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [hasTemplates, setHasTemplates] = useState<boolean | null>(null);
  const { user } = useAuth();
  
  // Check if templates exist on mount
  useEffect(() => {
    const checkTemplates = async () => {
      try {
        const exists = await templateService.templatesExist();
        setHasTemplates(exists);
        
        if (exists) {
          const templateStats = await templateService.getTemplateStats();
          setStats(templateStats);
        }
      } catch (error) {
        console.error('Error checking templates:', error);
        setError('Failed to check template status');
      }
    };
    
    checkTemplates();
  }, []);
  
  // Handle seeding templates
  const handleSeedTemplates = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      await templateService.seedTemplatesIfNeeded();
      setMessage('Templates seeded successfully!');
      setHasTemplates(true);
      
      // Get updated stats
      const templateStats = await templateService.getTemplateStats();
      setStats(templateStats);
    } catch (error) {
      console.error('Error seeding templates:', error);
      setError('Failed to seed templates. Check console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  // Check if user is admin
  if (!user || !user.is_admin) {
    return (
      <Alert severity="warning">
        This page is only accessible to administrators.
      </Alert>
    );
  }
  
  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Template Administration
      </Typography>
      
      <Box mt={2} mb={3}>
        <Typography variant="subtitle1">
          Template Status: {hasTemplates === null ? 'Checking...' : (hasTemplates ? 'Templates Exist' : 'No Templates Found')}
        </Typography>
        
        {stats && (
          <Box mt={2}>
            <Typography variant="subtitle2">Template Statistics:</Typography>
            <ul>
              <li>Categories: {stats.categories?.length || 0}</li>
              <li>Industries: {stats.industries?.length || 0}</li>
              <li>Formats: {stats.formats?.length || 0}</li>
              <li>Featured Templates: {stats.featuredCount || 0}</li>
              <li>Premium Templates: {stats.premiumCount || 0}</li>
              <li>Total Templates: {stats.totalTemplates || 0}</li>
            </ul>
          </Box>
        )}
      </Box>
      
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Button
        variant="contained"
        color="primary"
        onClick={handleSeedTemplates}
        disabled={loading || (hasTemplates === true)}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? 'Seeding Templates...' : 'Seed Templates'}
      </Button>
      
      {hasTemplates && (
        <Typography color="textSecondary" variant="body2" sx={{ mt: 2 }}>
          Templates already exist. If you want to re-seed, please contact a developer to clear the database first.
        </Typography>
      )}
    </Paper>
  );
};

export default AdminTemplatesUtility;