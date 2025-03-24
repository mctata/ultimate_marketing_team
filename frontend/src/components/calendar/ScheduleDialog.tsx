import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Box,
  Typography,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  CircularProgress
} from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers-pro';
import InfoIcon from '@mui/icons-material/Info';
import { format, addDays, addWeeks, parse, set } from 'date-fns';

// Best time recommendation interface
interface BestTimeRecommendation {
  platform: string;
  day_of_week: number;
  hour_of_day: number;
  average_engagement: number;
  confidence: number;
}

// Interface for schedule dialog props
interface ScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (scheduleData: ScheduleFormData) => void;
  initialData?: Partial<ScheduleFormData>;
  contentDrafts?: Array<{ id: number; title: string }>;
  platforms?: string[];
  contentTypes?: string[];
  projectId: number;
  bestTimeRecommendations?: BestTimeRecommendation[];
  loading?: boolean;
}

// Interface for schedule form data
export interface ScheduleFormData {
  content_draft_id: number;
  platform: string;
  content_type: string;
  scheduled_date: Date;
  project_id: number;
  is_recurring: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: Date;
  cross_platform?: boolean;
  cross_platform_delay?: number;
  additional_platforms?: string[];
}

const ScheduleDialog: React.FC<ScheduleDialogProps> = ({
  open,
  onClose,
  onSchedule,
  initialData,
  contentDrafts = [],
  platforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'email', 'website'],
  contentTypes = ['blog', 'social', 'email', 'video', 'ad', 'infographic'],
  projectId,
  bestTimeRecommendations = [],
  loading = false
}) => {
  // Form state
  const [formData, setFormData] = useState<ScheduleFormData>({
    content_draft_id: initialData?.content_draft_id || 0,
    platform: initialData?.platform || '',
    content_type: initialData?.content_type || '',
    scheduled_date: initialData?.scheduled_date || new Date(),
    project_id: projectId,
    is_recurring: initialData?.is_recurring || false,
    recurrence_pattern: initialData?.recurrence_pattern || 'weekly',
    recurrence_end_date: initialData?.recurrence_end_date || addWeeks(new Date(), 4),
    cross_platform: initialData?.cross_platform || false,
    cross_platform_delay: initialData?.cross_platform_delay || 30,
    additional_platforms: initialData?.additional_platforms || []
  });
  
  // Form validation state
  const [errors, setErrors] = useState<Partial<Record<keyof ScheduleFormData, string>>>({});
  
  // Reset form when dialog opens/closes or initial data changes
  useEffect(() => {
    if (open && initialData) {
      setFormData({
        content_draft_id: initialData.content_draft_id || 0,
        platform: initialData.platform || '',
        content_type: initialData.content_type || '',
        scheduled_date: initialData.scheduled_date || new Date(),
        project_id: projectId,
        is_recurring: initialData.is_recurring || false,
        recurrence_pattern: initialData.recurrence_pattern || 'weekly',
        recurrence_end_date: initialData.recurrence_end_date || addWeeks(new Date(), 4),
        cross_platform: initialData.cross_platform || false,
        cross_platform_delay: initialData.cross_platform_delay || 30,
        additional_platforms: initialData.additional_platforms || []
      });
    } else if (open) {
      // Reset form for new scheduling
      setFormData({
        content_draft_id: 0,
        platform: '',
        content_type: '',
        scheduled_date: new Date(),
        project_id: projectId,
        is_recurring: false,
        recurrence_pattern: 'weekly',
        recurrence_end_date: addWeeks(new Date(), 4),
        cross_platform: false,
        cross_platform_delay: 30,
        additional_platforms: []
      });
    }
    
    // Reset errors
    setErrors({});
  }, [open, initialData, projectId]);
  
  // Handle form input changes
  const handleChange = (name: keyof ScheduleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ScheduleFormData, string>> = {};
    
    if (!formData.content_draft_id) {
      newErrors.content_draft_id = 'Please select content to schedule';
    }
    
    if (!formData.platform) {
      newErrors.platform = 'Please select a platform';
    }
    
    if (!formData.content_type) {
      newErrors.content_type = 'Please select a content type';
    }
    
    if (formData.is_recurring && !formData.recurrence_pattern) {
      newErrors.recurrence_pattern = 'Please select a recurrence pattern';
    }
    
    if (formData.is_recurring && !formData.recurrence_end_date) {
      newErrors.recurrence_end_date = 'Please select an end date for recurrence';
    }
    
    if (formData.cross_platform && (!formData.additional_platforms || formData.additional_platforms.length === 0)) {
      newErrors.additional_platforms = 'Please select at least one additional platform';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      onSchedule(formData);
    }
  };
  
  // Get best time recommendations for selected platform
  const getBestTimeForPlatform = (platform: string): BestTimeRecommendation | null => {
    if (!platform || bestTimeRecommendations.length === 0) return null;
    
    return bestTimeRecommendations.find(rec => rec.platform === platform) || null;
  };
  
  // Apply best time recommendation
  const applyBestTimeRecommendation = () => {
    const recommendation = getBestTimeForPlatform(formData.platform);
    if (!recommendation) return;
    
    // Map day of week (0-6, where 0 is Sunday)
    const dayOfWeek = recommendation.day_of_week;
    
    // Get the next occurrence of this day of week
    const today = new Date();
    const daysToAdd = (dayOfWeek + 7 - today.getDay()) % 7;
    
    // Create date with the recommended day and hour
    const recommendedDate = set(
      addDays(today, daysToAdd),
      { 
        hours: recommendation.hour_of_day, 
        minutes: 0, 
        seconds: 0, 
        milliseconds: 0 
      }
    );
    
    // Update form with recommended date
    handleChange('scheduled_date', recommendedDate);
  };
  
  // Get day name from day number
  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{initialData?.content_draft_id ? 'Edit Scheduled Content' : 'Schedule Content'}</DialogTitle>
      <DialogContent dividers>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3}>
            {/* Content selection */}
            <Grid item xs={12}>
              <FormControl 
                fullWidth 
                error={!!errors.content_draft_id}
                required
              >
                <InputLabel id="content-draft-label">Content</InputLabel>
                <Select
                  labelId="content-draft-label"
                  value={formData.content_draft_id}
                  label="Content"
                  onChange={(e) => handleChange('content_draft_id', e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value={0} disabled>Select content to schedule</MenuItem>
                  {contentDrafts.map(draft => (
                    <MenuItem key={draft.id} value={draft.id}>
                      {draft.title}
                    </MenuItem>
                  ))}
                </Select>
                {errors.content_draft_id && (
                  <FormHelperText>{errors.content_draft_id}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Platform and content type */}
            <Grid item xs={12} sm={6}>
              <FormControl 
                fullWidth 
                error={!!errors.platform}
                required
              >
                <InputLabel id="platform-label">Platform</InputLabel>
                <Select
                  labelId="platform-label"
                  value={formData.platform}
                  label="Platform"
                  onChange={(e) => handleChange('platform', e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="" disabled>Select platform</MenuItem>
                  {platforms.map(platform => (
                    <MenuItem key={platform} value={platform}>
                      {platform}
                    </MenuItem>
                  ))}
                </Select>
                {errors.platform && (
                  <FormHelperText>{errors.platform}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl 
                fullWidth 
                error={!!errors.content_type}
                required
              >
                <InputLabel id="content-type-label">Content Type</InputLabel>
                <Select
                  labelId="content-type-label"
                  value={formData.content_type}
                  label="Content Type"
                  onChange={(e) => handleChange('content_type', e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="" disabled>Select content type</MenuItem>
                  {contentTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
                {errors.content_type && (
                  <FormHelperText>{errors.content_type}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Scheduling date and time */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Scheduled Date & Time
                </Typography>
                
                {formData.platform && getBestTimeForPlatform(formData.platform) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Alert 
                      severity="info" 
                      icon={<InfoIcon />}
                      action={
                        <Button 
                          color="info" 
                          size="small"
                          onClick={applyBestTimeRecommendation}
                        >
                          Apply
                        </Button>
                      }
                      sx={{ width: '100%' }}
                    >
                      {(() => {
                        const recommendation = getBestTimeForPlatform(formData.platform);
                        if (!recommendation) return '';
                        
                        return (
                          <>
                            Best time to post on {recommendation.platform} is{' '}
                            <strong>
                              {getDayName(recommendation.day_of_week)} at {format(
                                set(new Date(), { hours: recommendation.hour_of_day, minutes: 0 }),
                                'h:mm a'
                              )}
                            </strong>{' '}
                            (based on historical engagement)
                          </>
                        );
                      })()}
                    </Alert>
                  </Box>
                )}
                
                <DateTimePicker
                  label="Schedule Date and Time"
                  value={formData.scheduled_date}
                  onChange={(newValue) => handleChange('scheduled_date', newValue)}
                  sx={{ width: '100%' }}
                  disabled={loading}
                />
              </Box>
            </Grid>
            
            {/* Recurring options */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_recurring}
                      onChange={(e) => handleChange('is_recurring', e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label="Set as recurring content"
                />
                
                {formData.is_recurring && (
                  <Box sx={{ mt: 2, pl: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl 
                          fullWidth 
                          error={!!errors.recurrence_pattern}
                        >
                          <InputLabel id="recurrence-pattern-label">Recurrence Pattern</InputLabel>
                          <Select
                            labelId="recurrence-pattern-label"
                            value={formData.recurrence_pattern}
                            label="Recurrence Pattern"
                            onChange={(e) => handleChange('recurrence_pattern', e.target.value)}
                            disabled={loading}
                          >
                            <MenuItem value="daily">Daily</MenuItem>
                            <MenuItem value="weekly">Weekly</MenuItem>
                            <MenuItem value="biweekly">Bi-weekly</MenuItem>
                            <MenuItem value="monthly">Monthly</MenuItem>
                          </Select>
                          {errors.recurrence_pattern && (
                            <FormHelperText>{errors.recurrence_pattern}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <DateTimePicker
                          label="End Date"
                          value={formData.recurrence_end_date}
                          onChange={(newValue) => handleChange('recurrence_end_date', newValue)}
                          sx={{ width: '100%' }}
                          disabled={loading}
                        />
                        {errors.recurrence_end_date && (
                          <FormHelperText error>{errors.recurrence_end_date}</FormHelperText>
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>
            </Grid>
            
            {/* Cross-platform publishing */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.cross_platform}
                      onChange={(e) => handleChange('cross_platform', e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label="Publish to multiple platforms"
                />
                
                {formData.cross_platform && (
                  <Box sx={{ mt: 2, pl: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControl 
                          fullWidth 
                          error={!!errors.additional_platforms}
                        >
                          <InputLabel id="additional-platforms-label">Additional Platforms</InputLabel>
                          <Select
                            labelId="additional-platforms-label"
                            multiple
                            value={formData.additional_platforms}
                            label="Additional Platforms"
                            onChange={(e) => handleChange('additional_platforms', e.target.value)}
                            disabled={loading}
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {(selected as string[]).map((value) => (
                                  <Chip key={value} label={value} size="small" />
                                ))}
                              </Box>
                            )}
                          >
                            {platforms
                              .filter(p => p !== formData.platform)
                              .map(platform => (
                                <MenuItem key={platform} value={platform}>
                                  {platform}
                                </MenuItem>
                              ))}
                          </Select>
                          {errors.additional_platforms && (
                            <FormHelperText>{errors.additional_platforms}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Delay Between Platforms (minutes)"
                          type="number"
                          value={formData.cross_platform_delay}
                          onChange={(e) => handleChange('cross_platform_delay', parseInt(e.target.value))}
                          fullWidth
                          inputProps={{ min: 0, max: 1440 }} // Max 24 hours
                          disabled={loading}
                        />
                        <FormHelperText>
                          Time between publishing to each platform
                        </FormHelperText>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {initialData?.content_draft_id ? 'Update' : 'Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleDialog;