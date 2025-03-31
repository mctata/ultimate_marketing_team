import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText
} from '@mui/material';
import { 
  Schedule as ScheduleIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Info as InfoIcon,
  DateRange as DateRangeIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isFuture, isPast, isToday } from 'date-fns';

import { AppDispatch } from '../../store';
import { 
  fetchCampaignRules, 
  pauseScheduledRule, 
  resumeScheduledRule,
  selectCampaignRules,
  selectCampaignRulesLoading,
  selectCampaignRulesError
} from '../../store/slices/campaignRulesSlice';

import { CampaignRule } from '../../services/campaignRulesService';

interface ScheduledCampaignRulesProps {
  campaignId?: string;
}

const ScheduledCampaignRules = ({ campaignId }: ScheduledCampaignRulesProps) => {
  const dispatch = useDispatch<AppDispatch>();
  
  const rules = useSelector(selectCampaignRules);
  const loading = useSelector(selectCampaignRulesLoading);
  const error = useSelector(selectCampaignRulesError);
  
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });
  
  const [confirmPauseRule, setConfirmPauseRule] = useState<CampaignRule | null>(null);
  const [confirmResumeRule, setConfirmResumeRule] = useState<CampaignRule | null>(null);
  
  useEffect(() => {
    // Filter params
    const params: any = {};
    if (campaignId) {
      params.campaign_id = campaignId;
    }
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }
    if (dateRangeFilter.startDate) {
      params.from_date = format(dateRangeFilter.startDate, 'yyyy-MM-dd');
    }
    if (dateRangeFilter.endDate) {
      params.to_date = format(dateRangeFilter.endDate, 'yyyy-MM-dd');
    }
    
    dispatch(fetchCampaignRules(params));
  }, [dispatch, campaignId, statusFilter, dateRangeFilter]);
  
  const handlePauseRule = (rule: CampaignRule) => {
    setConfirmPauseRule(rule);
  };
  
  const handleResumeRule = (rule: CampaignRule) => {
    setConfirmResumeRule(rule);
  };
  
  const confirmPause = () => {
    if (confirmPauseRule) {
      dispatch(pauseScheduledRule(confirmPauseRule.id)).then(() => {
        dispatch(fetchCampaignRules({
          campaign_id: campaignId,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }));
      });
      setConfirmPauseRule(null);
    }
  };
  
  const confirmResume = () => {
    if (confirmResumeRule) {
      dispatch(resumeScheduledRule(confirmResumeRule.id)).then(() => {
        dispatch(fetchCampaignRules({
          campaign_id: campaignId,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }));
      });
      setConfirmResumeRule(null);
    }
  };
  
  const handleStatusFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setStatusFilter(event.target.value as string);
  };
  
  const handleStartDateChange = (date: Date | null) => {
    setDateRangeFilter({
      ...dateRangeFilter,
      startDate: date
    });
  };
  
  const handleEndDateChange = (date: Date | null) => {
    setDateRangeFilter({
      ...dateRangeFilter,
      endDate: date
    });
  };
  
  const clearFilters = () => {
    setStatusFilter('active');
    setDateRangeFilter({
      startDate: null,
      endDate: null
    });
  };
  
  const getStatusColor = (status: string, schedule_type: string, date?: string) => {
    if (status === 'inactive') {
      return 'default';
    }
    if (status === 'completed') {
      return 'success';
    }
    
    // For active rules with one-time schedule
    if (status === 'active' && schedule_type === 'one_time' && date) {
      const scheduleDate = parseISO(date);
      if (isFuture(scheduleDate)) {
        return 'info';
      }
      if (isToday(scheduleDate)) {
        return 'warning';
      }
      if (isPast(scheduleDate)) {
        return 'error';
      }
    }
    
    return 'primary';
  };
  
  const getNextExecutionText = (rule: CampaignRule) => {
    if (rule.status === 'inactive') {
      return 'Inactive';
    }
    
    if (rule.status === 'completed') {
      return 'Completed';
    }
    
    if (rule.schedule_type === 'continuous') {
      return 'Continuous';
    }
    
    if (rule.schedule_type === 'one_time' && rule.schedule_start_date) {
      return `${format(parseISO(rule.schedule_start_date), 'dd MMM yyyy')} at ${rule.schedule_time || '00:00'}`;
    }
    
    if (rule.schedule_type === 'recurring' && rule.schedule_days && rule.schedule_days.length > 0) {
      const days = rule.schedule_days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
      return `Every ${days} at ${rule.schedule_time || '00:00'}`;
    }
    
    return 'Unknown';
  };
  
  const getActionText = (rule: CampaignRule) => {
    switch(rule.action_type) {
      case 'pause_campaign':
        return rule.auto_resume 
          ? `Pause campaign (auto-resume after ${rule.auto_resume_after}h)`
          : 'Pause campaign';
      case 'resume_campaign':
        return 'Resume campaign';
      case 'adjust_budget':
        return `Adjust budget by ${rule.action_value}%`;
      case 'notify':
        return 'Send notification';
      default:
        return rule.action_type;
    }
  };
  
  // Filter scheduled rules (those with one-time or recurring schedule)
  const scheduledRules = rules.filter(rule => 
    rule.schedule_type === 'one_time' || rule.schedule_type === 'recurring'
  );
  
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <ScheduleIcon sx={{ mr: 1 }} />
          Scheduled Campaign Rules
        </Typography>
        
        <Box>
          <Button 
            variant={showFilters ? "contained" : "outlined"} 
            color="primary" 
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ mr: 1 }}
          >
            Filters
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => {/* TODO: Add logic to create new rule */}}
          >
            Add Rule
          </Button>
        </Box>
      </Box>
      
      {/* Filters Section */}
      {showFilters && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Filter Rules</Typography>
            <IconButton size="small" onClick={() => setShowFilters(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DatePicker
                  label="From Date"
                  value={dateRangeFilter.startDate}
                  onChange={handleStartDateChange}
                />
                <Typography>to</Typography>
                <DatePicker
                  label="To Date"
                  value={dateRangeFilter.endDate}
                  onChange={handleEndDateChange}
                />
              </Box>
            </LocalizationProvider>
            
            <Button variant="outlined" onClick={clearFilters}>
              Clear Filters
            </Button>
          </Box>
        </Paper>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : scheduledRules.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No scheduled rules found with the current filters.
        </Alert>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rule Name</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scheduledRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Typography variant="body1">{rule.name}</Typography>
                    {rule.description && (
                      <Typography variant="body2" color="textSecondary">
                        {rule.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
                        {getNextExecutionText(rule)}
                      </Box>
                    </Typography>
                  </TableCell>
                  <TableCell>{getActionText(rule)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={rule.status.charAt(0).toUpperCase() + rule.status.slice(1)} 
                      color={getStatusColor(
                        rule.status, 
                        rule.schedule_type || '', 
                        rule.schedule_start_date
                      )}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="Edit Rule">
                        <IconButton 
                          size="small"
                          onClick={() => {/* TODO: Add edit logic */}}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {rule.status === 'active' ? (
                        <Tooltip title="Pause Rule">
                          <IconButton 
                            size="small" 
                            onClick={() => handlePauseRule(rule)}
                          >
                            <PauseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : rule.status === 'inactive' ? (
                        <Tooltip title="Resume Rule">
                          <IconButton 
                            size="small"
                            onClick={() => handleResumeRule(rule)}
                          >
                            <PlayArrowIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Confirmation Dialogs */}
      <Dialog open={!!confirmPauseRule} onClose={() => setConfirmPauseRule(null)}>
        <DialogTitle>Pause Scheduled Rule</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to pause the rule "{confirmPauseRule?.name}"? 
            This will temporarily deactivate the rule until you resume it manually.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmPauseRule(null)}>Cancel</Button>
          <Button onClick={confirmPause} color="primary">Pause Rule</Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={!!confirmResumeRule} onClose={() => setConfirmResumeRule(null)}>
        <DialogTitle>Resume Scheduled Rule</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to resume the rule "{confirmResumeRule?.name}"? 
            This will activate the rule according to its schedule settings.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmResumeRule(null)}>Cancel</Button>
          <Button onClick={confirmResume} color="primary">Resume Rule</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ScheduledCampaignRules;