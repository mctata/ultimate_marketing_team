import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Tooltip, 
  IconButton,
  Chip,
  useTheme,
  Popover,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  addWeeks,
  getHours,
  setHours,
  setMinutes,
  getDay,
  isPast,
  isWithinInterval,
  parseISO,
  addHours
} from 'date-fns';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import TodayIcon from '@mui/icons-material/Today';

// Define content item interface
interface CalendarItem {
  id: number;
  title: string;
  scheduled_date: string;
  status: string;
  content_type?: string;
  platform?: string;
  published_date?: string;
  project_id: number;
}

// Define props for the Calendar component
interface CalendarWeekViewProps {
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
  onAddClick: (date: Date) => void;
  onEditItem: (item: CalendarItem) => void;
  onDeleteItem: (itemId: number) => void;
  onPublishItem: (itemId: number) => void;
  insights?: CalendarInsight[];
  loading?: boolean;
  filters?: {
    status: string[];
    contentType: string[];
    platform: string[];
  };
  onFilterChange?: (type: string, values: string[]) => void;
}

// Define insights interface
interface CalendarInsight {
  insight_type: string;
  description: string;
  severity: string;
  start_date?: string;
  end_date?: string;
  affected_content_ids?: number[];
  recommendation: string;
}

const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  items,
  onItemClick,
  onAddClick,
  onEditItem,
  onDeleteItem,
  onPublishItem,
  insights = [],
  loading = false,
  filters,
  onFilterChange
}) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [showInsightDialog, setShowInsightDialog] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<CalendarInsight | null>(null);
  
  // Content type colors
  const contentTypeColors: Record<string, string> = {
    'blog': theme.palette.primary.main,
    'social': theme.palette.secondary.main,
    'email': theme.palette.success.main,
    'video': theme.palette.error.main,
    'ad': theme.palette.warning.main,
    'infographic': theme.palette.info.main,
    'default': theme.palette.grey[500]
  };
  
  // Platform colors
  const platformColors: Record<string, string> = {
    'instagram': '#E1306C',
    'facebook': '#4267B2',
    'twitter': '#1DA1F2',
    'linkedin': '#0077B5',
    'youtube': '#FF0000',
    'tiktok': '#000000',
    'email': theme.palette.success.main,
    'website': theme.palette.primary.main,
    'default': theme.palette.grey[500]
  };
  
  // Status colors
  const statusColors: Record<string, string> = {
    'draft': theme.palette.grey[500],
    'scheduled': theme.palette.warning.main,
    'published': theme.palette.success.main,
    'failed': theme.palette.error.main
  };
  
  // Calendar navigation
  const prevWeek = () => setCurrentDate(addWeeks(currentDate, -1));
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const today = () => setCurrentDate(new Date());
  
  // Week date range display
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDateRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  // Calendar days calculation
  const weekDays = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [weekStart, weekEnd]);
  
  // Time slots for week view
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(hour);
    }
    return slots;
  }, []);
  
  // Filter items for current week
  const filteredItems = useMemo(() => {
    if (!items) return [];
    
    let filtered = items.filter(item => {
      const itemDate = parseISO(item.scheduled_date);
      return isWithinInterval(itemDate, {
        start: weekStart,
        end: weekEnd
      });
    });
    
    // Apply filters if provided
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        filtered = filtered.filter(item => filters.status.includes(item.status));
      }
      if (filters.contentType && filters.contentType.length > 0) {
        filtered = filtered.filter(item => 
          item.content_type && filters.contentType.includes(item.content_type)
        );
      }
      if (filters.platform && filters.platform.length > 0) {
        filtered = filtered.filter(item => 
          item.platform && filters.platform.includes(item.platform)
        );
      }
    }
    
    return filtered;
  }, [items, weekStart, weekEnd, filters]);
  
  // Get items for a specific day and hour
  const getItemsForTimeSlot = (day: Date, hour: number) => {
    return filteredItems.filter(item => {
      const itemDate = parseISO(item.scheduled_date);
      return (
        format(itemDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') &&
        getHours(itemDate) === hour
      );
    });
  };
  
  // Check if a day and time slot has insights
  const getTimeSlotInsights = (day: Date, hour: number) => {
    const slotStart = setMinutes(setHours(day, hour), 0);
    const slotEnd = setMinutes(setHours(day, hour), 59);
    
    return insights.filter(insight => {
      if (!insight.start_date) return false;
      
      const startDate = parseISO(insight.start_date);
      const endDate = insight.end_date ? parseISO(insight.end_date) : startDate;
      
      return (
        format(startDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') &&
        getHours(startDate) === hour
      );
    });
  };
  
  // Handle item click to show popover
  const handleItemClick = (event: React.MouseEvent<HTMLElement>, item: CalendarItem) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };
  
  // Handle popover close
  const handlePopoverClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };
  
  // Handle editing the selected item
  const handleEditItem = () => {
    if (selectedItem) {
      onEditItem(selectedItem);
      handlePopoverClose();
    }
  };
  
  // Handle deleting the selected item
  const handleDeleteItem = () => {
    if (selectedItem) {
      onDeleteItem(selectedItem.id);
      handlePopoverClose();
    }
  };
  
  // Handle publishing the selected item
  const handlePublishItem = () => {
    if (selectedItem) {
      onPublishItem(selectedItem.id);
      handlePopoverClose();
    }
  };
  
  // Handle insight icon click
  const handleInsightClick = (insight: CalendarInsight) => {
    setSelectedInsight(insight);
    setShowInsightDialog(true);
  };
  
  // Get severity icon for insights
  const getInsightIcon = (severity: string) => {
    switch (severity) {
      case 'info':
        return <InfoIcon fontSize="small" color="info" />;
      case 'warning':
        return <WarningIcon fontSize="small" color="warning" />;
      case 'critical':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return <InfoIcon fontSize="small" color="info" />;
    }
  };

  // Render time slot cell
  const renderTimeSlotCell = (day: Date, hour: number) => {
    const slotItems = getItemsForTimeSlot(day, hour);
    const slotInsights = getTimeSlotInsights(day, hour);
    const isCurrentDay = isToday(day);
    const isPastSlot = isPast(addHours(day, hour + 1)) && !isToday(day);
    const slotTime = format(setHours(day, hour), 'ha').toLowerCase();
    
    return (
      <Box
        sx={{
          height: '80px',
          p: 0.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          borderLeft: isCurrentDay 
            ? `2px solid ${theme.palette.primary.main}` 
            : `1px solid ${theme.palette.divider}`,
          background: isCurrentDay 
            ? `${theme.palette.primary.light}10` 
            : 'transparent',
          opacity: isPastSlot ? 0.7 : 1,
          position: 'relative',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            '& .add-button': {
              opacity: 1
            }
          }
        }}
      >
        {/* Add button */}
        <IconButton 
          size="small" 
          className="add-button"
          onClick={() => onAddClick(setHours(day, hour))}
          sx={{
            opacity: 0,
            transition: 'opacity 0.2s',
            padding: '2px',
            position: 'absolute',
            top: 2,
            right: 2,
            zIndex: 2
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
        
        {/* Insights indicator */}
        {slotInsights.length > 0 && (
          <Box sx={{ position: 'absolute', top: 2, left: 2, display: 'flex', gap: 0.5, zIndex: 2 }}>
            {slotInsights.map((insight, i) => (
              <Tooltip key={i} title={insight.description}>
                <IconButton 
                  size="small" 
                  onClick={() => handleInsightClick(insight)}
                  sx={{ padding: '2px' }}
                >
                  {getInsightIcon(insight.severity)}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        )}
        
        {/* Items in this slot */}
        <Box sx={{ overflow: 'auto', mt: 2, maxHeight: '100%' }}>
          {slotItems.map((item) => (
            <Tooltip
              key={item.id}
              title={`${item.title} (${item.platform || 'No platform'}) - ${item.status}`}
              arrow
            >
              <Box
                onClick={(e) => handleItemClick(e, item)}
                sx={{
                  p: 0.5,
                  mb: 0.5,
                  borderRadius: 1,
                  cursor: 'pointer',
                  borderLeft: `3px solid ${
                    item.content_type 
                      ? contentTypeColors[item.content_type] || contentTypeColors.default
                      : contentTypeColors.default
                  }`,
                  backgroundColor: `${
                    item.platform 
                      ? platformColors[item.platform] || platformColors.default
                      : platformColors.default
                  }15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
              >
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ 
                    fontSize: '0.7rem',
                    maxWidth: '80%',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {item.title}
                </Typography>
                <Box>
                  {item.status === 'published' && (
                    <CheckCircleIcon 
                      sx={{ 
                        fontSize: '0.8rem', 
                        color: statusColors[item.status] 
                      }} 
                    />
                  )}
                </Box>
              </Box>
            </Tooltip>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Calendar Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2 
      }}>
        <Typography variant="h6" component="h2">
          {weekDateRange}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={prevWeek} size="small">
            <KeyboardArrowLeftIcon />
          </IconButton>
          <IconButton onClick={today} size="small">
            <TodayIcon />
          </IconButton>
          <IconButton onClick={nextWeek} size="small">
            <KeyboardArrowRightIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Filter chips - optional based on if filters are provided */}
      {filters && onFilterChange && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {/* Status filter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              multiple
              value={filters.status}
              onChange={(e: SelectChangeEvent<string[]>) => {
                const values = e.target.value as string[];
                onFilterChange('status', values);
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
              label="Status"
              size="small"
            >
              {['draft', 'scheduled', 'published', 'failed'].map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Content Type filter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="content-type-filter-label">Content Type</InputLabel>
            <Select
              labelId="content-type-filter-label"
              multiple
              value={filters.contentType}
              onChange={(e: SelectChangeEvent<string[]>) => {
                const values = e.target.value as string[];
                onFilterChange('contentType', values);
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
              label="Content Type"
              size="small"
            >
              {Object.keys(contentTypeColors).filter(k => k !== 'default').map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Platform filter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="platform-filter-label">Platform</InputLabel>
            <Select
              labelId="platform-filter-label"
              multiple
              value={filters.platform}
              onChange={(e: SelectChangeEvent<string[]>) => {
                const values = e.target.value as string[];
                onFilterChange('platform', values);
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
              label="Platform"
              size="small"
            >
              {Object.keys(platformColors).filter(k => k !== 'default').map((platform) => (
                <MenuItem key={platform} value={platform}>
                  {platform}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Week View Grid */}
      <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
        {/* Time column */}
        <Box sx={{ width: '60px', flexShrink: 0 }}>
          <Box sx={{ height: '40px' }}></Box> {/* Empty cell for header row */}
          {timeSlots.map((hour) => (
            <Box 
              key={hour} 
              sx={{ 
                height: '80px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: `1px solid ${theme.palette.divider}`,
                borderRight: `1px solid ${theme.palette.divider}`,
                p: 0.5
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {format(setHours(new Date(), hour), 'h a')}
              </Typography>
            </Box>
          ))}
        </Box>
        
        {/* Days columns */}
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          {weekDays.map((day, dayIndex) => (
            <Box 
              key={dayIndex} 
              sx={{ 
                flexGrow: 1, 
                width: 0,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Day header */}
              <Box 
                sx={{ 
                  height: '40px',
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  borderLeft: isToday(day) 
                    ? `2px solid ${theme.palette.primary.main}` 
                    : `1px solid ${theme.palette.divider}`,
                  backgroundColor: isToday(day) 
                    ? `${theme.palette.primary.light}15` 
                    : theme.palette.background.paper
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ fontWeight: isToday(day) ? 'bold' : 'normal' }}
                >
                  {format(day, 'E')}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ fontWeight: isToday(day) ? 'bold' : 'normal' }}
                >
                  {format(day, 'd')}
                </Typography>
              </Box>
              
              {/* Time slots */}
              {timeSlots.map((hour) => (
                <React.Fragment key={`${dayIndex}-${hour}`}>
                  {renderTimeSlotCell(day, hour)}
                </React.Fragment>
              ))}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Item Popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {selectedItem && (
          <Box sx={{ p: 2, maxWidth: 300 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {selectedItem.title}
            </Typography>
            
            <Box sx={{ mb: 1 }}>
              <Chip 
                label={selectedItem.status} 
                size="small"
                sx={{ 
                  mr: 0.5,
                  backgroundColor: statusColors[selectedItem.status] || statusColors.draft,
                  color: '#fff'
                }} 
              />
              {selectedItem.content_type && (
                <Chip 
                  label={selectedItem.content_type} 
                  size="small"
                  sx={{ 
                    mr: 0.5,
                    backgroundColor: contentTypeColors[selectedItem.content_type] || contentTypeColors.default,
                    color: '#fff'
                  }} 
                />
              )}
              {selectedItem.platform && (
                <Chip 
                  label={selectedItem.platform} 
                  size="small"
                  sx={{ 
                    backgroundColor: platformColors[selectedItem.platform] || platformColors.default,
                    color: '#fff'
                  }} 
                />
              )}
            </Box>
            
            <Typography variant="body2" gutterBottom>
              Scheduled: {format(parseISO(selectedItem.scheduled_date), 'PPp')}
            </Typography>
            
            {selectedItem.published_date && (
              <Typography variant="body2" gutterBottom>
                Published: {format(parseISO(selectedItem.published_date), 'PPp')}
              </Typography>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                startIcon={<EditIcon />}
                size="small"
                onClick={handleEditItem}
              >
                Edit
              </Button>
              
              {selectedItem.status !== 'published' && (
                <Button 
                  startIcon={<CheckCircleIcon />}
                  size="small"
                  color="success"
                  onClick={handlePublishItem}
                >
                  Publish
                </Button>
              )}
              
              <Button 
                startIcon={<DeleteIcon />}
                size="small"
                color="error"
                onClick={handleDeleteItem}
              >
                Delete
              </Button>
            </Box>
          </Box>
        )}
      </Popover>
      
      {/* Insight Dialog */}
      <Dialog 
        open={showInsightDialog} 
        onClose={() => setShowInsightDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedInsight && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1
            }}>
              {getInsightIcon(selectedInsight.severity)}
              Calendar Insight
            </DialogTitle>
            <DialogContent>
              <Typography variant="subtitle1" gutterBottom>
                {selectedInsight.description}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {selectedInsight.recommendation}
              </Typography>
              
              {selectedInsight.start_date && selectedInsight.end_date && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Period: {format(parseISO(selectedInsight.start_date), 'PP')} - {format(parseISO(selectedInsight.end_date), 'PP')}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowInsightDialog(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CalendarWeekView;