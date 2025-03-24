import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Chip,
  FormControl,
  FormLabel,
  FormGroup
} from '@mui/material';

interface CampaignFilterPanelProps {
  filters: {
    status: string[];
    platform: string[];
  };
  onFilterChange: (type: string, values: string[]) => void;
}

const statuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

const platforms = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'google', label: 'Google Ads' },
];

const CampaignFilterPanel: React.FC<CampaignFilterPanelProps> = ({ filters, onFilterChange }) => {
  // Toggle status filter
  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    
    onFilterChange('status', newStatuses);
  };

  // Toggle platform filter
  const handlePlatformToggle = (platform: string) => {
    const newPlatforms = filters.platform.includes(platform)
      ? filters.platform.filter(p => p !== platform)
      : [...filters.platform, platform];
    
    onFilterChange('platform', newPlatforms);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Filter Campaigns</Typography>
      
      <Grid container spacing={4}>
        {/* Status filters */}
        <Grid item xs={12} md={6}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Status</FormLabel>
            <FormGroup>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {statuses.map(status => (
                  <Chip
                    key={status.value}
                    label={status.label}
                    clickable
                    color={filters.status.includes(status.value) ? 'primary' : 'default'}
                    onClick={() => handleStatusToggle(status.value)}
                    variant={filters.status.includes(status.value) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </FormGroup>
          </FormControl>
        </Grid>

        {/* Platform filters */}
        <Grid item xs={12} md={6}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Platform</FormLabel>
            <FormGroup>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {platforms.map(platform => (
                  <Chip
                    key={platform.value}
                    label={platform.label}
                    clickable
                    color={filters.platform.includes(platform.value) ? 'primary' : 'default'}
                    onClick={() => handlePlatformToggle(platform.value)}
                    variant={filters.platform.includes(platform.value) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </FormGroup>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CampaignFilterPanel;
