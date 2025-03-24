import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Button,
  FormHelperText,
  Grid,
  Paper,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Save as SaveIcon,
  PlayArrow as PlayArrowIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parse } from 'date-fns';

import { AppDispatch } from '../../store';
import { 
  createCampaignRule, 
  updateCampaignRule, 
  testRuleCondition,
  selectTestResults,
  selectTestResultsLoading,
  clearTestResults
} from '../../store/slices/campaignRulesSlice';
import { CampaignRule } from '../../services/campaignRulesService';

interface RuleEditorProps {
  campaignId: string;
  rule?: CampaignRule;
  onSave: () => void;
  onCancel: () => void;
}

const RuleEditor = ({ campaignId, rule, onSave, onCancel }: RuleEditorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const testResults = useSelector(selectTestResults);
  const testLoading = useSelector(selectTestResultsLoading);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    condition_type: 'metric_threshold',
    condition_metric: 'cpa',
    condition_operator: 'gt',
    condition_value: 0,
    action_type: 'pause_campaign',
    action_value: null,
    schedule_type: 'continuous',
    schedule_start_date: format(new Date(), 'yyyy-MM-dd'),
    schedule_end_date: '',
    schedule_days: [],
    schedule_time: '09:00',
    status: 'active',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTestResults, setShowTestResults] = useState(false);
  
  // Initialize form with rule data if editing
  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        description: rule.description || '',
        condition_type: rule.condition_type || 'metric_threshold',
        condition_metric: rule.condition_metric || 'cpa',
        condition_operator: rule.condition_operator || 'gt',
        condition_value: rule.condition_value || 0,
        action_type: rule.action_type || 'pause_campaign',
        action_value: rule.action_value || null,
        schedule_type: rule.schedule_type || 'continuous',
        schedule_start_date: rule.schedule_start_date || format(new Date(), 'yyyy-MM-dd'),
        schedule_end_date: rule.schedule_end_date || '',
        schedule_days: rule.schedule_days || [],
        schedule_time: rule.schedule_time || '09:00',
        status: rule.status || 'active',
      });
    }
    
    // Clear test results when component mounts
    dispatch(clearTestResults());
  }, [dispatch, rule]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value,
      });
      
      // Clear error for this field
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };
  
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      status: e.target.checked ? 'active' : 'inactive',
    });
  };
  
  const handleDaysChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setFormData({
      ...formData,
      schedule_days: e.target.value as string[],
    });
  };
  
  const handleDateChange = (date: Date | null, fieldName: string) => {
    if (date) {
      setFormData({
        ...formData,
        [fieldName]: format(date, 'yyyy-MM-dd'),
      });
    }
  };
  
  const handleTimeChange = (time: Date | null) => {
    if (time) {
      setFormData({
        ...formData,
        schedule_time: format(time, 'HH:mm'),
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Rule name is required';
    }
    
    if (formData.condition_type === 'metric_threshold') {
      if (!formData.condition_metric) {
        newErrors.condition_metric = 'Metric is required';
      }
      if (!formData.condition_operator) {
        newErrors.condition_operator = 'Operator is required';
      }
      if (formData.condition_value === '' || formData.condition_value === null) {
        newErrors.condition_value = 'Threshold value is required';
      }
    }
    
    if (formData.action_type === 'adjust_budget' && (formData.action_value === null || formData.action_value === '')) {
      newErrors.action_value = 'Budget adjustment value is required';
    }
    
    if (formData.schedule_type === 'one_time' && !formData.schedule_start_date) {
      newErrors.schedule_start_date = 'Start date is required';
    }
    
    if (formData.schedule_type === 'recurring' && formData.schedule_days.length === 0) {
      newErrors.schedule_days = 'At least one day must be selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    const ruleData = {
      ...formData,
      campaign_id: campaignId,
    };
    
    try {
      if (rule) {
        // Update existing rule
        await dispatch(updateCampaignRule({ ruleId: rule.id, rule: ruleData }));
      } else {
        // Create new rule
        await dispatch(createCampaignRule(ruleData));
      }
      onSave();
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };
  
  const handleTest = () => {
    if (!validateForm()) {
      return;
    }
    
    dispatch(testRuleCondition({ 
      ruleData: {
        condition_type: formData.condition_type,
        condition_metric: formData.condition_metric,
        condition_operator: formData.condition_operator,
        condition_value: formData.condition_value
      },
      campaignId
    }));
    
    setShowTestResults(true);
  };
  
  // Option lists
  const metricOptions = [
    { value: 'ctr', label: 'Click-Through Rate (CTR)' },
    { value: 'cpc', label: 'Cost Per Click (CPC)' },
    { value: 'cpa', label: 'Cost Per Acquisition (CPA)' },
    { value: 'roas', label: 'Return On Ad Spend (ROAS)' },
    { value: 'spend', label: 'Daily Spend' },
    { value: 'impressions', label: 'Impressions' },
    { value: 'clicks', label: 'Clicks' },
    { value: 'conversions', label: 'Conversions' },
  ];
  
  const operatorOptions = [
    { value: 'gt', label: 'Greater Than (>)' },
    { value: 'lt', label: 'Less Than (<)' },
    { value: 'eq', label: 'Equal To (=)' },
    { value: 'gte', label: 'Greater Than or Equal To (>=)' },
    { value: 'lte', label: 'Less Than or Equal To (<=)' },
  ];
  
  const actionOptions = [
    { value: 'pause_campaign', label: 'Pause Campaign' },
    { value: 'resume_campaign', label: 'Resume Campaign' },
    { value: 'adjust_budget', label: 'Adjust Budget' },
    { value: 'notify', label: 'Send Notification Only' },
  ];
  
  const dayOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ];
  
  const scheduleTypeOptions = [
    { value: 'continuous', label: 'Continuous (Always Active)' },
    { value: 'one_time', label: 'One-Time Execution' },
    { value: 'recurring', label: 'Recurring Schedule' },
  ];
  
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          {rule ? 'Edit Rule' : 'Create New Rule'}
        </Typography>
        <FormControlLabel
          control={
            <Switch 
              checked={formData.status === 'active'} 
              onChange={handleSwitchChange}
              color="primary"
            />
          }
          label={formData.status === 'active' ? 'Rule Active' : 'Rule Inactive'}
        />
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            name="name"
            label="Rule Name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            required
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={2}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Divider>
            <Chip label="Condition" />
          </Divider>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth required>
            <InputLabel>Condition Type</InputLabel>
            <Select
              name="condition_type"
              value={formData.condition_type}
              onChange={handleChange}
              label="Condition Type"
            >
              <MenuItem value="metric_threshold">Metric Threshold</MenuItem>
              <MenuItem value="time_based">Time-Based</MenuItem>
              <MenuItem value="budget_depleted">Budget Depleted</MenuItem>
              <MenuItem value="roi_based">ROI-Based</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {formData.condition_type === 'metric_threshold' && (
          <>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required error={!!errors.condition_metric}>
                <InputLabel>Metric</InputLabel>
                <Select
                  name="condition_metric"
                  value={formData.condition_metric}
                  onChange={handleChange}
                  label="Metric"
                >
                  {metricOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.condition_metric && (
                  <FormHelperText>{errors.condition_metric}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required error={!!errors.condition_operator}>
                <InputLabel>Operator</InputLabel>
                <Select
                  name="condition_operator"
                  value={formData.condition_operator}
                  onChange={handleChange}
                  label="Operator"
                >
                  {operatorOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.condition_operator && (
                  <FormHelperText>{errors.condition_operator}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="condition_value"
                label="Threshold Value"
                type="number"
                value={formData.condition_value}
                onChange={handleChange}
                error={!!errors.condition_value}
                helperText={errors.condition_value}
                required
                InputProps={{
                  endAdornment: (
                    <Tooltip title="Test if this rule would trigger now with current campaign metrics">
                      <Button 
                        onClick={handleTest}
                        variant="outlined" 
                        size="small"
                        startIcon={testLoading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                        sx={{ ml: 1 }}
                        disabled={testLoading}
                      >
                        Test Rule
                      </Button>
                    </Tooltip>
                  ),
                }}
              />
            </Grid>
          </>
        )}
        
        {/* Budget depleted condition */}
        {formData.condition_type === 'budget_depleted' && (
          <Grid item xs={12}>
            <Alert severity="info">
              This rule will trigger when the campaign budget is 90% spent or higher.
            </Alert>
          </Grid>
        )}
        
        {/* Time-based condition */}
        {formData.condition_type === 'time_based' && (
          <Grid item xs={12}>
            <Alert severity="info">
              This rule will trigger at the scheduled time(s) defined below, regardless of performance metrics.
            </Alert>
          </Grid>
        )}
        
        {/* ROI-based condition */}
        {formData.condition_type === 'roi_based' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="condition_value"
              label="ROI Threshold (%)"
              type="number"
              value={formData.condition_value}
              onChange={handleChange}
              error={!!errors.condition_value}
              helperText={errors.condition_value || "Rule will trigger when ROI falls below this threshold"}
              required
            />
          </Grid>
        )}
        
        {/* Test Results */}
        {showTestResults && testResults && (
          <Grid item xs={12}>
            <Alert 
              severity={testResults.would_trigger ? 'warning' : 'success'}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setShowTestResults(false);
                  }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              <AlertTitle>Test Result</AlertTitle>
              {testResults.would_trigger ? 
                'This rule would trigger with the current campaign metrics.' : 
                'This rule would not trigger with the current campaign metrics.'
              }
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Current {formData.condition_metric}: {testResults.metrics[formData.condition_metric]}
                </Typography>
                <Typography variant="body2">
                  Your threshold: {formData.condition_value}
                </Typography>
              </Box>
            </Alert>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Divider>
            <Chip label="Action" />
          </Divider>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Action</InputLabel>
            <Select
              name="action_type"
              value={formData.action_type}
              onChange={handleChange}
              label="Action"
            >
              {actionOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {formData.action_type === 'adjust_budget' && (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              name="action_value"
              label="Budget Adjustment (%)"
              type="number"
              value={formData.action_value}
              onChange={handleChange}
              error={!!errors.action_value}
              helperText={errors.action_value || "Use negative value to decrease budget (e.g., -20)"}
              required
            />
          </Grid>
        )}
        
        {formData.action_type === 'notify' && (
          <Grid item xs={12} md={6}>
            <Alert severity="info">
              Notifications will be sent to the configured notification channels.
            </Alert>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Divider>
            <Chip label="Schedule" />
          </Divider>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth required>
            <InputLabel>Schedule Type</InputLabel>
            <Select
              name="schedule_type"
              value={formData.schedule_type}
              onChange={handleChange}
              label="Schedule Type"
            >
              {scheduleTypeOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* Schedule options based on type */}
        {formData.schedule_type === 'one_time' && (
          <Grid item xs={12} md={8}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DatePicker
                    label="Execution Date"
                    value={formData.schedule_start_date ? new Date(formData.schedule_start_date) : null}
                    onChange={(date) => handleDateChange(date, 'schedule_start_date')}
                  />
                  {errors.schedule_start_date && (
                    <FormHelperText error>{errors.schedule_start_date}</FormHelperText>
                  )}
                </Grid>
                <Grid item xs={6}>
                  <TimePicker
                    label="Execution Time"
                    value={formData.schedule_time ? parse(formData.schedule_time, 'HH:mm', new Date()) : null}
                    onChange={handleTimeChange}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Grid>
        )}
        
        {formData.schedule_type === 'recurring' && (
          <>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required error={!!errors.schedule_days}>
                <InputLabel>Days of Week</InputLabel>
                <Select
                  multiple
                  name="schedule_days"
                  value={formData.schedule_days}
                  onChange={handleDaysChange}
                  label="Days of Week"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value.charAt(0).toUpperCase() + value.slice(1)} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {dayOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.schedule_days && (
                  <FormHelperText>{errors.schedule_days}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label="Execution Time"
                  value={formData.schedule_time ? parse(formData.schedule_time, 'HH:mm', new Date()) : null}
                  onChange={handleTimeChange}
                />
              </LocalizationProvider>
            </Grid>
          </>
        )}
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button 
              variant="outlined" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSave}
              startIcon={<SaveIcon />}
            >
              {rule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default RuleEditor;