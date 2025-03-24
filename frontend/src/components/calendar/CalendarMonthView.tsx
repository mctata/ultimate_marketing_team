import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Tooltip, 
  IconButton,
  Badge,
  useTheme,
  Chip,
  Popover,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Zoom,
  Fade,
  Stack
} from '@mui/material';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  getDay,
  isPast,
  isFuture,
  isWithinInterval,
  parseISO
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
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MoreTimeIcon from '@mui/icons-material/MoreTime';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import TimerIcon from '@mui/icons-material/Timer';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

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
interface CalendarMonthViewProps {
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
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
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

const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  items,
  onItemClick,
  onAddClick,
  onEditItem,
  onDeleteItem,
  onPublishItem,
  insights = [],
  loading = false,
  filters,
  onFilterChange,
  onDateRangeChange
}) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [showInsightDialog, setShowInsightDialog] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<CalendarInsight | null>(null);
  
  // Drag & Drop functionality
  const [draggingItem, setDraggingItem] = useState<CalendarItem | null>(null);
  const [previewContent, setPreviewContent] = useState<{ item: CalendarItem, x: number, y: number } | null>(null);
  const dragItemRef = useRef<HTMLDivElement | null>(null);
  const [dropTarget, setDropTarget] = useState<Date | null>(null);
  
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
  
  // Update date range when month changes
  useEffect(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    // Notify parent component of date range change
    if (onDateRangeChange) {
      onDateRangeChange(start, end);
    }
  }, [currentDate, onDateRangeChange]);
  
  // Calendar navigation
  const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const currentMonthName = format(currentDate, 'MMMM yyyy');

  // Calendar days calculation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);
  
  // Generate stable, deterministic mock data when there are no items
  const generateMockData = () => {
    const result: CalendarItem[] = [];
    
    // Get current month days
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    });
    
    // Mock content types and platforms
    const contentTypes = ['blog', 'social', 'email', 'video', 'ad', 'infographic'];
    const platforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok', 'email', 'website'];
    const statuses = ['draft', 'scheduled', 'published'];
    
    // Create deterministic titles for mock content
    const titles = [
      "Monthly Product Update",
      "Customer Success Story",
      "Industry Insights",
      "Feature Highlight",
      "Product Tips & Tricks",
      "Company News",
      "Upcoming Webinar",
      "Team Spotlight", 
      "Product Tutorial",
      "Product Launch"
    ];
    
    // Create some mock items (at least one per day)
    daysInMonth.forEach((day, index) => {
      // Skip some days consistently (not randomly)
      if (index % 3 === 0) return;
      
      // Number of items per day (1-3)
      const itemsPerDay = (index % 3) + 1;
      
      for (let i = 0; i < itemsPerDay; i++) {
        // Use deterministic selections based on day and index
        const contentType = contentTypes[index % contentTypes.length];
        const platform = platforms[(index + i) % platforms.length];
        const status = statuses[(index + i) % statuses.length];
        const title = titles[(index + i) % titles.length];
        
        // Create a stable ID using date and index information
        const stableId = 1000 + (index * 10) + i;
        
        result.push({
          id: stableId,
          title: `${title} - ${contentType}`,
          scheduled_date: format(day, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
          status,
          content_type: contentType,
          platform,
          project_id: 1
        });
      }
    });
    
    return result;
  };

  // Filter items for current month
  const filteredItems = useMemo(() => {
    // If no items provided, generate mock data
    const itemsToFilter = items && items.length > 0 ? items : generateMockData();
    
    let filtered = itemsToFilter.filter(item => {
      const itemDate = parseISO(item.scheduled_date);
      return isWithinInterval(itemDate, {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
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
  }, [items, currentDate, filters]);
  
  // Get items for a specific day
  const getItemsForDay = (day: Date) => {
    return filteredItems.filter(item => {
      const itemDate = parseISO(item.scheduled_date);
      return format(itemDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });
  };
  
  // Check if a day has insights with proper error handling
  const getDayInsights = (day: Date) => {
    // Handle case when insights might be undefined or null
    if (!insights || insights.length === 0) {
      return [];
    }
    
    return insights.filter(insight => {
      // Skip invalid insights without start_date
      if (!insight || !insight.start_date) return false;
      
      try {
        const startDate = parseISO(insight.start_date);
        // Fallback to start date if end_date is missing
        const endDate = insight.end_date ? parseISO(insight.end_date) : startDate;
        
        return isWithinInterval(day, { start: startDate, end: endDate });
      } catch (error) {
        // If there's an error parsing dates, skip this insight
        console.error('Error processing insight date:', error);
        return false;
      }
    });
  };
  
  // Drag and drop handlers
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, item: CalendarItem) => {
    setDraggingItem(item);
    
    // Set data for drag operation
    event.dataTransfer.setData('text/plain', JSON.stringify({
      id: item.id,
      title: item.title,
      type: 'calendar-item'
    }));
    
    // Set the dragging effect
    event.dataTransfer.effectAllowed = 'move';
    
    // Set a custom drag image if needed
    if (event.currentTarget) {
      dragItemRef.current = event.currentTarget;
      // Create a clone for the drag image
      const clone = event.currentTarget.cloneNode(true) as HTMLDivElement;
      clone.style.width = `${event.currentTarget.offsetWidth}px`;
      clone.style.transform = 'translateY(-1000px)';
      document.body.appendChild(clone);
      event.dataTransfer.setDragImage(clone, 0, 0);
      
      // Remove the clone after the drag starts
      setTimeout(() => {
        document.body.removeChild(clone);
      }, 0);
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, day: Date) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTarget(day);
  };
  
  const handleDragLeave = () => {
    setDropTarget(null);
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>, day: Date) => {
    event.preventDefault();
    
    if (!draggingItem) return;
    
    // Get the data (if needed)
    const data = event.dataTransfer.getData('text/plain');
    
    // Create an updated item with the new date
    const updatedItem = {
      ...draggingItem,
      scheduled_date: format(day, "yyyy-MM-dd'T'HH:mm:ss'Z'")
    };
    
    // Call the edit handler to update the item
    onEditItem(updatedItem);
    
    // Reset dragging state
    setDraggingItem(null);
    setDropTarget(null);
  };
  
  const handleDragEnd = () => {
    setDraggingItem(null);
    setDropTarget(null);
  };
  
  // Preview functionality
  const handleItemMouseEnter = (event: React.MouseEvent<HTMLElement>, item: CalendarItem) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPreviewContent({
      item,
      x: rect.right + 10,
      y: rect.top
    });
  };
  
  const handleItemMouseLeave = () => {
    setPreviewContent(null);
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
  
  // Render a single day cell
  const renderDayCell = (day: Date) => {
    const dayNumber = format(day, 'd');
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isCurrentDay = isToday(day);
    const isPastDay = isPast(day) && !isToday(day);
    const dayItems = getItemsForDay(day);
    const dayInsights = getDayInsights(day);
    const isDropTarget = dropTarget && format(dropTarget, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    
    return (
      <Paper
        sx={{
          height: '120px',
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          background: isDropTarget
            ? `${theme.palette.success.light}30`
            : isCurrentDay 
              ? `${theme.palette.primary.light}20` 
              : isCurrentMonth 
                ? theme.palette.background.paper 
                : theme.palette.grey[100],
          opacity: isPastDay ? 0.7 : 1,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          border: isDropTarget 
            ? `2px dashed ${theme.palette.success.main}` 
            : '1px solid rgba(0, 0, 0, 0.12)',
          '&:hover': {
            boxShadow: 2,
            '& .add-button': {
              opacity: 1
            }
          }
        }}
        onDragOver={(e) => handleDragOver(e, day)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, day)}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 0.5
        }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: isCurrentDay ? 'bold' : 'normal',
              color: !isCurrentMonth ? theme.palette.text.disabled : 'inherit'
            }}
          >
            {dayNumber}
          </Typography>
          
          {/* Add button */}
          <IconButton 
            size="small" 
            className="add-button"
            onClick={() => onAddClick(day)}
            sx={{
              opacity: 0,
              transition: 'opacity 0.2s',
              padding: '2px'
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
        
        {/* Insights indicator */}
        {dayInsights.length > 0 && (
          <Box sx={{ position: 'absolute', top: 2, right: 2, display: 'flex', gap: 0.5 }}>
            {dayInsights.map((insight, i) => (
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
        
        {/* Day items */}
        <Box sx={{ overflow: 'auto', flex: 1 }}>
          {dayItems.map((item) => (
            <Box
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onDragEnd={handleDragEnd}
              onClick={(e) => handleItemClick(e, item)}
              onMouseEnter={(e) => handleItemMouseEnter(e, item)}
              onMouseLeave={handleItemMouseLeave}
              sx={{
                p: 0.5,
                mb: 0.5,
                borderRadius: 1,
                cursor: 'grab',
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
                transition: 'all 0.2s ease',
                transform: draggingItem && draggingItem.id === item.id ? 'scale(0.95)' : 'scale(1)',
                opacity: draggingItem && draggingItem.id === item.id ? 0.5 : 1,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                },
                '&:active': {
                  cursor: 'grabbing'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <DragIndicatorIcon 
                  fontSize="small" 
                  sx={{ 
                    fontSize: '0.7rem', 
                    color: theme.palette.text.secondary,
                    mr: 0.5,
                    opacity: 0.6
                  }} 
                />
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ 
                    fontSize: '0.7rem',
                    maxWidth: '70%',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {item.title}
                </Typography>
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                  {item.status === 'draft' && (
                    <HourglassEmptyIcon 
                      sx={{ 
                        fontSize: '0.8rem', 
                        color: statusColors[item.status],
                        ml: 0.5
                      }} 
                    />
                  )}
                  {item.status === 'scheduled' && (
                    <TimerIcon 
                      sx={{ 
                        fontSize: '0.8rem', 
                        color: statusColors[item.status],
                        ml: 0.5
                      }} 
                    />
                  )}
                  {item.status === 'published' && (
                    <CheckCircleIcon 
                      sx={{ 
                        fontSize: '0.8rem', 
                        color: statusColors[item.status],
                        ml: 0.5
                      }} 
                    />
                  )}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    );
  };

  // Render day headers (Sun, Mon, etc.)
  const renderDayHeaders = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {weekDays.map((day) => (
          <Grid item key={day} xs>
            <Typography 
              align="center" 
              variant="body2" 
              sx={{ fontWeight: 'bold' }}
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      {/* Content preview on hover */}
      {previewContent && (
        <Fade in={!!previewContent} timeout={200}>
          <Card
            sx={{
              position: 'fixed',
              top: previewContent.y,
              left: previewContent.x,
              zIndex: 1500,
              width: 280,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              pointerEvents: 'none'
            }}
          >
            <CardHeader
              title={
                <Typography variant="subtitle2">
                  {previewContent.item.title}
                </Typography>
              }
              subheader={
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  {previewContent.item.platform && (
                    <Chip 
                      label={previewContent.item.platform} 
                      size="small"
                      sx={{ 
                        height: 20,
                        backgroundColor: `${platformColors[previewContent.item.platform] || platformColors.default}30`,
                        color: platformColors[previewContent.item.platform] || platformColors.default,
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}
                    />
                  )}
                  {previewContent.item.content_type && (
                    <Chip 
                      label={previewContent.item.content_type} 
                      size="small"
                      sx={{ 
                        height: 20,
                        backgroundColor: `${contentTypeColors[previewContent.item.content_type] || contentTypeColors.default}30`,
                        color: contentTypeColors[previewContent.item.content_type] || contentTypeColors.default,
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}
                    />
                  )}
                </Box>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EventAvailableIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: theme.palette.text.secondary }} />
                <Typography variant="body2" color="text.secondary">
                  {format(parseISO(previewContent.item.scheduled_date), 'PPp')}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {previewContent.item.status === 'draft' ? 'Draft content' : 
                   previewContent.item.status === 'scheduled' ? 'Scheduled for publishing' : 
                   'Published content'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Calendar Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2 
      }}>
        <Typography variant="h6" component="h2">
          {currentMonthName}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={prevMonth} size="small">
            <KeyboardArrowLeftIcon />
          </IconButton>
          <IconButton onClick={nextMonth} size="small">
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

      {/* Calendar Grid */}
      {renderDayHeaders()}
      <Grid container spacing={1}>
        {calendarDays.map((day, index) => (
          <Grid item key={index} xs>
            {renderDayCell(day)}
          </Grid>
        ))}
      </Grid>

      {/* Item Popover with Quick Actions */}
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
        PaperProps={{
          elevation: 4,
          sx: { 
            borderRadius: 2,
            overflow: 'visible',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              left: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          }
        }}
      >
        {selectedItem && (
          <Card sx={{ width: 320, borderRadius: 2, overflow: 'hidden' }} variant="outlined">
            <CardHeader
              title={
                <Typography variant="subtitle1" fontWeight="bold">
                  {selectedItem.title}
                </Typography>
              }
              action={
                <IconButton size="small" onClick={handlePopoverClose}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              }
              sx={{ 
                pb: 1,
                background: selectedItem.content_type
                  ? `${contentTypeColors[selectedItem.content_type]}15`
                  : theme.palette.background.default
              }}
            />
            
            <CardContent sx={{ pb: 1 }}>
              <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                <Chip 
                  label={selectedItem.status} 
                  size="small"
                  sx={{ 
                    backgroundColor: statusColors[selectedItem.status] || statusColors.draft,
                    color: '#fff'
                  }} 
                />
                {selectedItem.content_type && (
                  <Chip 
                    label={selectedItem.content_type} 
                    size="small"
                    sx={{ 
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
              
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EventAvailableIcon sx={{ fontSize: '1rem', mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="body2">
                    Scheduled: {format(parseISO(selectedItem.scheduled_date), 'PPp')}
                  </Typography>
                </Box>
                
                {selectedItem.published_date && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon sx={{ fontSize: '1rem', mr: 1, color: theme.palette.success.main }} />
                    <Typography variant="body2">
                      Published: {format(parseISO(selectedItem.published_date), 'PPp')}
                    </Typography>
                  </Box>
                )}
              </Stack>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Button 
                  variant="outlined"
                  startIcon={<EditIcon />}
                  size="small"
                  onClick={handleEditItem}
                >
                  Edit
                </Button>
                
                {selectedItem.status !== 'published' && (
                  <Button 
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    size="small"
                    color="success"
                    onClick={handlePublishItem}
                  >
                    Publish
                  </Button>
                )}
                
                <Button 
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  size="small"
                  color="error"
                  onClick={handleDeleteItem}
                >
                  Delete
                </Button>
              </Box>
            </CardContent>
          </Card>
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

export default CalendarMonthView;