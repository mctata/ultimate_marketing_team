import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Divider,
  Alert,
  Autocomplete,
  Slider,
  CircularProgress,
} from '@mui/material';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import { Demographic, BehavioralTarget, InterestTarget, LifeEventTarget } from '../../types/audience';
import audienceService from '../../services/audienceService';

interface AudienceSegmentProps {
  initialDemographic?: Demographic;
  initialBehaviors?: BehavioralTarget[];
  initialInterests?: InterestTarget[];
  initialLifeEvents?: LifeEventTarget[];
  onChange?: (data: {
    demographic: Demographic;
    behaviors: BehavioralTarget[];
    interests: InterestTarget[];
    lifeEvents: LifeEventTarget[];
  }) => void;
}

const defaultDemographic: Demographic = {
  ageRange: { min: 18, max: 65 },
  gender: 'all',
  locations: [],
  languages: [],
  education: [],
  workStatus: [],
  relationshipStatus: [],
  income: null,
};

const AudienceSegment: React.FC<AudienceSegmentProps> = ({
  initialDemographic = defaultDemographic,
  initialBehaviors = [],
  initialInterests = [],
  initialLifeEvents = [],
  onChange,
}) => {
  const [demographic, setDemographic] = useState<Demographic>(initialDemographic);
  const [behaviors, setBehaviors] = useState<BehavioralTarget[]>(initialBehaviors);
  const [interests, setInterests] = useState<InterestTarget[]>(initialInterests);
  const [lifeEvents, setLifeEvents] = useState<LifeEventTarget[]>(initialLifeEvents);
  const [selectedBehaviors, setSelectedBehaviors] = useState<BehavioralTarget[]>(initialBehaviors);
  const [selectedInterests, setSelectedInterests] = useState<InterestTarget[]>(initialInterests);
  const [selectedLifeEvents, setSelectedLifeEvents] = useState<LifeEventTarget[]>(initialLifeEvents);
  const [loading, setLoading] = useState(true);
  
  // Fetch targeting options
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [behaviorsData, interestsData, lifeEventsData] = await Promise.all([
          audienceService.getBehaviors(),
          audienceService.getInterests(),
          audienceService.getLifeEvents(),
        ]);
        
        setBehaviors(behaviorsData);
        setInterests(interestsData);
        setLifeEvents(lifeEventsData);
      } catch (error) {
        console.error('Error loading audience targeting options:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Notify parent component when data changes
  useEffect(() => {
    if (onChange) {
      onChange({
        demographic,
        behaviors: selectedBehaviors,
        interests: selectedInterests,
        lifeEvents: selectedLifeEvents,
      });
    }
  }, [demographic, selectedBehaviors, selectedInterests, selectedLifeEvents, onChange]);
  
  // Handle demographic changes
  const handleDemographicChange = (field: keyof Demographic, value: any) => {
    setDemographic(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  // Handle age range changes
  const handleAgeRangeChange = (_event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setDemographic(prev => ({
        ...prev,
        ageRange: {
          min: newValue[0],
          max: newValue[1],
        },
      }));
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
        <PeopleOutlineIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Audience Segmentation</Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Demographics Section */}
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Demographics
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Age Range */}
        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Age Range: {demographic.ageRange.min} - {demographic.ageRange.max}</Typography>
          <Slider
            value={[demographic.ageRange.min, demographic.ageRange.max]}
            onChange={handleAgeRangeChange}
            valueLabelDisplay="auto"
            min={13}
            max={65}
            sx={{ width: '95%' }}
          />
        </Grid>
        
        {/* Gender */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Gender</InputLabel>
            <Select
              value={demographic.gender}
              label="Gender"
              onChange={(e) => handleDemographicChange('gender', e.target.value)}
            >
              <MenuItem value="all">All Genders</MenuItem>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Locations */}
        <Grid item xs={12}>
          <Autocomplete
            multiple
            options={[
              { id: 'uk', name: 'United Kingdom', type: 'country' },
              { id: 'us', name: 'United States', type: 'country' },
              { id: 'ca', name: 'Canada', type: 'country' },
              { id: 'au', name: 'Australia', type: 'country' },
              { id: 'london', name: 'London', type: 'city' },
              { id: 'nyc', name: 'New York', type: 'city' },
              { id: 'la', name: 'Los Angeles', type: 'city' }
            ]}
            getOptionLabel={(option) => option.name}
            value={demographic.locations}
            onChange={(_, newValue) => handleDemographicChange('locations', newValue)}
            renderInput={(params) => <TextField {...params} label="Locations" />}
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
        
        {/* Languages */}
        <Grid item xs={12} md={6}>
          <Autocomplete
            multiple
            options={['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic']}
            value={demographic.languages}
            onChange={(_, newValue) => handleDemographicChange('languages', newValue)}
            renderInput={(params) => <TextField {...params} label="Languages" />}
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
        
        {/* Education */}
        <Grid item xs={12} md={6}>
          <Autocomplete
            multiple
            options={['High School', 'College', 'Graduate School', 'Doctorate']}
            value={demographic.education}
            onChange={(_, newValue) => handleDemographicChange('education', newValue)}
            renderInput={(params) => <TextField {...params} label="Education" />}
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
      </Grid>
      
      {/* Behaviors Section */}
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Behaviours
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Autocomplete
            multiple
            options={behaviors}
            getOptionLabel={(option) => option.name}
            value={selectedBehaviors}
            onChange={(_, newValue) => setSelectedBehaviors(newValue)}
            renderInput={(params) => <TextField {...params} label="Select Behaviours" />}
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
            groupBy={(option) => option.category}
          />
        </Grid>
      </Grid>
      
      {/* Interests Section */}
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Interests
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Autocomplete
            multiple
            options={interests}
            getOptionLabel={(option) => option.name}
            value={selectedInterests}
            onChange={(_, newValue) => setSelectedInterests(newValue)}
            renderInput={(params) => <TextField {...params} label="Select Interests" />}
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
            groupBy={(option) => option.category}
          />
        </Grid>
      </Grid>
      
      {/* Life Events Section */}
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Life Events
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Autocomplete
            multiple
            options={lifeEvents}
            getOptionLabel={(option) => option.name}
            value={selectedLifeEvents}
            onChange={(_, newValue) => setSelectedLifeEvents(newValue)}
            renderInput={(params) => <TextField {...params} label="Select Life Events" />}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={`${option.name} (${option.timeframe})`}
                  size="small"
                />
              ))
            }
            groupBy={(option) => option.timeframe}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AudienceSegment;
