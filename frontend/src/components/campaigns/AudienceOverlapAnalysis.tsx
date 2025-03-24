import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Autocomplete,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import CompareIcon from '@mui/icons-material/Compare';
import audienceService from '../../services/audienceService';
import { AudienceOverlapData } from '../../types/audience';

interface AudienceOverlapAnalysisProps {
  initialAudienceIds?: string[];
}

const AudienceOverlapAnalysis: React.FC<AudienceOverlapAnalysisProps> = ({
  initialAudienceIds = [],
}) => {
  const [customAudiences, setCustomAudiences] = useState([]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(initialAudienceIds);
  const [overlapData, setOverlapData] = useState<AudienceOverlapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch custom audiences for overlap analysis
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

  // Analyze audience overlap
  const handleAnalyzeOverlap = async () => {
    if (selectedAudiences.length < 2) {
      setError('Please select at least two audiences to analyze overlap.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const data = await audienceService.getAudienceOverlap(selectedAudiences);
      setOverlapData(data);
    } catch (error) {
      console.error('Error analyzing audience overlap:', error);
      setError('Failed to analyze audience overlap. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Generate overlap visualization
  const renderOverlapVisualization = (data: AudienceOverlapData) => {
    const { audienceA, audienceB, overlapPercentage, overlapSize } = data;
    
    // Calculate width based on overlap percentage
    const maxWidth = 100;
    const audienceAWidth = maxWidth;
    const audienceBWidth = maxWidth;
    const overlapWidth = (overlapPercentage / 100) * maxWidth;

    return (
      <Box key={`${audienceA.id}-${audienceB.id}`} sx={{ mb: 4 }}>
        <Typography variant="subtitle1">
          {audienceA.name} ∩ {audienceB.name}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {overlapPercentage}% overlap ({overlapSize.toLocaleString()} users)
        </Typography>

        <Box sx={{ position: 'relative', height: 60, mt: 2 }}>
          {/* Audience A */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${audienceAWidth}%`,
              height: 60,
              backgroundColor: 'primary.light',
              opacity: 0.7,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <Typography variant="caption" color="white" fontWeight="bold">
              {audienceA.name} ({audienceA.size.toLocaleString()})
            </Typography>
          </Box>

          {/* Audience B */}
          <Box
            sx={{
              position: 'absolute',
              left: `${audienceAWidth - overlapWidth}%`,
              top: 0,
              width: `${audienceBWidth}%`,
              height: 60,
              backgroundColor: 'secondary.light',
              opacity: 0.7,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <Typography variant="caption" color="white" fontWeight="bold">
              {audienceB.name} ({audienceB.size.toLocaleString()})
            </Typography>
          </Box>

          {/* Overlap */}
          <Box
            sx={{
              position: 'absolute',
              left: `${audienceAWidth - overlapWidth}%`,
              top: 0,
              width: `${overlapWidth}%`,
              height: 60,
              backgroundColor: 'error.light',
              opacity: 0.9,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <Typography variant="caption" color="white" fontWeight="bold">
              {overlapSize.toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
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
        <CompareIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Audience Overlap Analysis</Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Select Audiences */}
        <Grid item xs={12}>
          <Autocomplete
            multiple
            options={customAudiences}
            getOptionLabel={(option) => option.name}
            value={customAudiences.filter(audience => selectedAudiences.includes(audience.id))}
            onChange={(_event, newValue) => {
              setSelectedAudiences(newValue.map(audience => audience.id));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Audiences to Compare"
                helperText="Select at least two audiences to analyze overlap"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.name}
                  size="small"
                />
              ))
            }
          />
        </Grid>

        {/* Analyze Button */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAnalyzeOverlap}
            disabled={analyzing || selectedAudiences.length < 2}
            fullWidth
            sx={{ mb: 3 }}
          >
            {analyzing ? <CircularProgress size={24} /> : 'Analyze Audience Overlap'}
          </Button>
        </Grid>

        {/* Results */}
        {overlapData.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Overlap Results
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ mt: 2 }}>
              {overlapData.map(data => renderOverlapVisualization(data))}
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Analysis Insights:</strong> High overlap indicates similar audiences that might be competing for the same impressions. Consider consolidating or differentiating targeting for better efficiency.
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default AudienceOverlapAnalysis;
