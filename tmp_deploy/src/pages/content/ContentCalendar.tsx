import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '../../store';
import {
  fetchCalendarItems,
  fetchDrafts,
  selectCalendarItems,
  selectCalendarLoading,
  selectDrafts
} from '../../store/slices/contentSlice';
import { ContentCalendarItem } from '../../services/contentService';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PLATFORMS = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'Website', 'Email'];

const ContentCalendar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const calendarItems = useSelector(selectCalendarItems);
  const drafts = useSelector(selectDrafts);
  const loading = useSelector(selectCalendarLoading);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<{
    contentDraftId: string;
    platform: string;
    scheduledTime: string;
  }>({
    contentDraftId: '',
    platform: '',
    scheduledTime: '12:00',
  });
  const [showError, setShowError] = useState('');

  // Fetch calendar items for the current month
  useEffect(() => {
    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
    
    dispatch(fetchCalendarItems({ 
      startDate,
      endDate
    }));
    dispatch(fetchDrafts({ status: 'approved' }));
  }, [dispatch, currentMonth]);

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setScheduleForm(prev => ({
      ...prev,
      scheduledTime: '12:00'
    }));
    setOpenScheduleDialog(true);
  };

  const handleDialogClose = () => {
    setOpenScheduleDialog(false);
    setSelectedDate(null);
    setShowError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setScheduleForm(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleScheduleContent = () => {
    if (!scheduleForm.contentDraftId) {
      setShowError('Please select content to schedule');
      return;
    }
    if (!scheduleForm.platform) {
      setShowError('Please select a platform');
      return;
    }
    if (!selectedDate) return;

    const scheduledDateTime = `${format(selectedDate, 'yyyy-MM-dd')}T${scheduleForm.scheduledTime}:00`;
    
    // In a real app, this would dispatch an action to save the calendar item
    console.log('Scheduling content:', {
      content_draft_id: scheduleForm.contentDraftId,
      scheduled_date: scheduledDateTime,
      platform: scheduleForm.platform
    });
    
    setOpenScheduleDialog(false);
    setSelectedDate(null);
  };

  // Get days for the current month view
  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = monthStart;
    const endDate = monthEnd;

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // For a complete calendar grid, add leading and trailing dates
    const dayOfWeekStart = getDay(monthStart);
    
    return {
      days,
      dayOfWeekStart
    };
  };

  // Get items scheduled for a specific day
  const getItemsForDay = (day: Date) => {
    return calendarItems.filter(item => {
      const itemDate = new Date(item.scheduled_date);
      return isSameDay(itemDate, day);
    });
  };

  const { days, dayOfWeekStart } = getDaysInMonth();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/content')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">Content Calendar</Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3, mb: 3 }}>
          {/* Calendar Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={prevMonth}>
              <NavigateBefore />
            </IconButton>
            <Typography variant="h5">
              {format(currentMonth, 'MMMM yyyy')}
            </Typography>
            <IconButton onClick={nextMonth}>
              <NavigateNext />
            </IconButton>
          </Box>

          {/* Calendar Grid */}
          <Grid container sx={{ textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
            {DAYS_OF_WEEK.map(day => (
              <Grid item xs key={day} sx={{ p: 1, borderBottom: '1px solid #e0e0e0', fontWeight: 'bold' }}>
                {day}
              </Grid>
            ))}
          </Grid>

          <Grid container>
            {/* Empty cells for days before the start of the month */}
            {Array.from({ length: dayOfWeekStart }).map((_, index) => (
              <Grid item xs key={`empty-${index}`} sx={{ p: 1, height: 120, borderBottom: '1px solid #e0e0e0' }}></Grid>
            ))}

            {/* Days of the month */}
            {days.map(day => {
              const itemsForDay = getItemsForDay(day);
              return (
                <Grid 
                  item 
                  xs 
                  key={day.toString()} 
                  sx={{ 
                    p: 1, 
                    height: 120, 
                    borderBottom: '1px solid #e0e0e0',
                    borderRight: '1px solid #e0e0e0',
                    position: 'relative',
                    '&:nth-of-type(7n)': {
                      borderRight: 'none',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                  onClick={() => handleDateClick(day)}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {format(day, 'd')}
                  </Typography>
                  
                  {/* Content items for this day */}
                  <Box sx={{ maxHeight: 75, overflowY: 'auto' }}>
                    {itemsForDay.map((item, index) => {
                      const draftTitle = drafts.find(d => d.id === item.content_draft_id)?.title || 'Untitled';
                      return (
                        <Chip
                          key={item.id}
                          size="small"
                          label={`${format(new Date(item.scheduled_date), 'HH:mm')} - ${draftTitle.substring(0, 15)}${draftTitle.length > 15 ? '...' : ''}`}
                          color="primary"
                          variant="outlined"
                          sx={{ mb: 0.5, width: '100%', justifyContent: 'flex-start' }}
                        />
                      );
                    })}
                  </Box>
                  
                  {/* Add button shown on hover */}
                  <Tooltip title="Schedule content">
                    <IconButton 
                      size="small" 
                      sx={{ 
                        position: 'absolute', 
                        bottom: 5, 
                        right: 5,
                        opacity: 0.7,
                        '&:hover': { opacity: 1 },
                        backgroundColor: 'background.paper',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDateClick(day);
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}

      {/* Schedule Dialog */}
      <Dialog open={openScheduleDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Schedule Content for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
        </DialogTitle>
        <DialogContent>
          {showError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {showError}
            </Alert>
          )}
          
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel id="content-select-label">Select Content</InputLabel>
            <Select
              labelId="content-select-label"
              name="contentDraftId"
              value={scheduleForm.contentDraftId}
              label="Select Content"
              onChange={handleInputChange}
            >
              {drafts
                .filter(draft => draft.status === 'approved' || draft.status === 'published')
                .map(draft => (
                  <MenuItem key={draft.id} value={draft.id}>
                    {draft.title}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="platform-select-label">Platform</InputLabel>
                <Select
                  labelId="platform-select-label"
                  name="platform"
                  value={scheduleForm.platform}
                  label="Platform"
                  onChange={handleInputChange}
                >
                  {PLATFORMS.map(platform => (
                    <MenuItem key={platform} value={platform.toLowerCase()}>
                      {platform}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Time"
                name="scheduledTime"
                type="time"
                value={scheduleForm.scheduledTime}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 min
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleScheduleContent} 
            variant="contained" 
            startIcon={<CalendarToday />}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentCalendar;