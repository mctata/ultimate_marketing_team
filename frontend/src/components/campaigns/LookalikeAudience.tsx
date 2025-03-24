import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Autocomplete,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import audienceService from '../../services/audienceService';
import { LookalikeAudienceSettings } from '../../types/audience';

interface LookalikeAudienceProps {
  onCreateLookalike?: (lookalike: { id: string; name: string; estimatedSize: number }) => void;
}

const LookalikeAudience: React.FC<LookalikeAudienceProps> = ({ onCreateLookalike }) => {
  const [customAudiences, setCustomAudiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<LookalikeAudienceSettings>({
    sourceAudienceId: '',
    sourceAudienceName: '',
    similarityLevel: 5,
    size: 1000000,
    countries: [],
  });

  // Fetch custom audiences for source selection
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const audiencesData = await audienceService.getCustomAudiences();
        setCustomAudiences(audiencesData);
      } catch (error) {
        console.error('Error loading custom audiences:', error);
        setError('Failed to load custom audiences. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle settings changes
  const handleSettingChange = (field: keyof LookalikeAudienceSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle source audience selection
  const handleSourceAudienceChange = (audience: any) => {
    if (audience) {
      setSettings(prev => ({
        ...prev,
        sourceAudienceId: audience.id,
        sourceAudienceName: audience.name,
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        sourceAudienceId: '',
        sourceAudienceName: '',
      }));
    }
  };

  // Create lookalike audience
  const handleCreateLookalike = async () => {
    setCreating(true);
    setSuccess(false);
    setError(null);

    try {
      const result = await audienceService.createLookalikeAudience(
        settings.sourceAudienceId,
        {
          similarityLevel: settings.similarityLevel,
          size: settings.size,
          countries: settings.countries,
        }
      );

      setSuccess(true);
      if (onCreateLookalike) {
        onCreateLookalike(result);
      }
    } catch (error) {
      console.error('Error creating lookalike audience:', error);
      setError('Failed to create lookalike audience. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <ContentCopyIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Create Lookalike Audience</Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Lookalike audience created successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Source Audience */}
        <Grid item xs={12}>
          <Autocomplete
            options={customAudiences}
            getOptionLabel={(option) => option.name}
            onChange={(_event, newValue) => handleSourceAudienceChange(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Source Audience"
                helperText="Select a custom audience to use as the source for your lookalike"
                required
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant="body1">{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.description} • {option.size.toLocaleString()} users
                  </Typography>
                </Box>
              </li>
            )}
          />
        </Grid>

        {/* Similarity Level */}
        <Grid item xs={12} md={6}>
          <Typography gutterBottom>
            Similarity Level: {settings.similarityLevel}
          </Typography>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            Higher values create audiences more similar to your source audience. Lower values reach broader audiences.
          </Typography>
          <Slider
            value={settings.similarityLevel}
            onChange={(_event, newValue) => 
              handleSettingChange('similarityLevel', newValue as number)
            }
            valueLabelDisplay="auto"
            step={1}
            marks
            min={1}
            max={10}
          />
        </Grid>

        {/* Audience Size */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Estimated Audience Size"
            value={settings.size}
            onChange={(e) => 
              handleSettingChange('size', Number(e.target.value))
            }
            fullWidth
            type="number"
            inputProps={{ min: 100000, step: 100000 }}
            helperText="Estimated reach of your lookalike audience"
          />
        </Grid>

        {/* Countries */}
        <Grid item xs={12}>
          <Autocomplete
            multiple
            options={[
              'United Kingdom',
              'United States',
              'Canada',
              'Australia',
              'Germany',
              'France',
              'Spain',
              'Italy',
              'Japan',
              'Brazil',
              'Mexico'
            ]}
            value={settings.countries}
            onChange={(_event, newValue) => handleSettingChange('countries', newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Countries"
                helperText="Select countries where you want to find similar users"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  label={option}
                  size="small"
                />
              ))
            }
          />
        </Grid>

        {/* Create Button */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateLookalike}
            disabled={creating || !settings.sourceAudienceId || settings.countries.length === 0}
            fullWidth
          >
            {creating ? <CircularProgress size={24} /> : 'Create Lookalike Audience'}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default LookalikeAudience;
