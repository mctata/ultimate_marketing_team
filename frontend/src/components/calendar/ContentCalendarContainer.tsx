import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  Paper,
  Tooltip,
  Divider,
  Chip
} from '@mui/material';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListIcon from '@mui/icons-material/List';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';

import CalendarMonthView from './CalendarMonthView';
import CalendarWeekView from './CalendarWeekView';
import CalendarListView from './CalendarListView';
import ScheduleDialog from './ScheduleDialog';
import { ScheduleFormData } from './ScheduleDialog';
import contentCalendarService from '../../services/contentCalendarService';
import { 
  CalendarItem, 
  BestTimeRecommendation, 
  SchedulingInsight as CalendarInsight, 
  ScheduleItemRequest 
} from '../../services/contentCalendarService';

// Define content draft interface
interface ContentDraft {
  id: number;
  title: string;
  content: string;
  version: number;
  status: string;
}

// Define props for ContentCalendarContainer
interface ContentCalendarContainerProps {
  projectId: number;
}

const ContentCalendarContainer: React.FC<ContentCalendarContainerProps> = ({ projectId }) => {
  const theme = useTheme();
  
  // State for calendar data
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [contentDrafts, setContentDrafts] = useState<ContentDraft[]>([]);
  const [bestTimeRecommendations, setBestTimeRecommendations] = useState<BestTimeRecommendation[]>([]);
  const [insights, setInsights] = useState<CalendarInsight[]>([]);
  
  // UI state
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Date range state for fetching data
  const [currentDateRange, setCurrentDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    status: [] as string[],
    contentType: [] as string[],
    platform: [] as string[],
  });
  
  // Platform and content type options
  const platformOptions = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok', 'email', 'website'];
  const contentTypeOptions = ['blog', 'social', 'email', 'video', 'ad', 'infographic'];
  
  // Fetch content drafts - needed for scheduling
  const fetchContentDrafts = useCallback(async () => {
    try {
      // This is a placeholder. In a real implementation, you would fetch 
      // content drafts from an API endpoint that we would need to create
      // For now, we'll use sample data
      setContentDrafts([
        { id: 1, title: 'Q1 Marketing Strategy', content: 'Lorem ipsum...', version: 1, status: 'approved' },
        { id: 2, title: 'Product Launch Announcement', content: 'Lorem ipsum...', version: 2, status: 'approved' },
        { id: 3, title: 'Weekly Customer Success Story', content: 'Lorem ipsum...', version: 1, status: 'draft' },
        { id: 4, title: 'Monthly Newsletter', content: 'Lorem ipsum...', version: 3, status: 'approved' },
        { id: 5, title: 'New Feature Tutorial', content: 'Lorem ipsum...', version: 1, status: 'draft' },
      ]);
    } catch (err) {
      console.error('Error fetching content drafts:', err);
      setError('Failed to load content drafts. Please try again.');
    }
  }, []);
  
  // Fetch calendar data from API
  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Format dates for API
      const startDateStr = format(currentDateRange.startDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
      const endDateStr = format(currentDateRange.endDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
      
      // Fetch calendar entries
      const calendarData = await contentCalendarService.getCalendarEntries(
        projectId,
        startDateStr,
        endDateStr
      );
      setCalendarItems(calendarData);
      
      // Fetch best time recommendations
      const timeRecommendations = await contentCalendarService.getBestTimeRecommendations(projectId);
      setBestTimeRecommendations(timeRecommendations);
      
      // Fetch scheduling insights
      const schedulingInsights = await contentCalendarService.getSchedulingInsights(
        projectId,
        startDateStr,
        endDateStr
      );
      setInsights(schedulingInsights);
      
      // Fetch content drafts
      await fetchContentDrafts();
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('Failed to load calendar data. Please try again.');
      setLoading(false);
    }
  }, [projectId, currentDateRange, fetchContentDrafts]);
  
  // Initial data load
  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);
  
  // Handle date range change (e.g., when switching months)
  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setCurrentDateRange({ startDate, endDate });
  };
  
  // Handle view mode change
  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'month' | 'week' | 'list' | null
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };
  
  // Handle schedule dialog open
  const handleScheduleOpen = () => {
    setSelectedItem(null);
    setScheduleDialogOpen(true);
  };
  
  // Handle add click on a specific date
  const handleAddClick = (date: Date) => {
    setSelectedItem(null);
    setScheduleDialogOpen(true);
  };
  
  // Handle edit item
  const handleEditItem = (item: CalendarItem) => {
    setSelectedItem(item);
    setScheduleDialogOpen(true);
  };
  
  // Handle delete item
  const handleDeleteItem = async (itemId: number) => {
    setLoading(true);
    
    try {
      await contentCalendarService.deleteCalendarEntry(itemId);
      setCalendarItems(prev => prev.filter(item => item.id !== itemId));
      setSuccessMessage('Content successfully removed from calendar.');
    } catch (err) {
      console.error('Error deleting calendar item:', err);
      setError('Failed to delete calendar item. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle publish item
  const handlePublishItem = async (itemId: number) => {
    setLoading(true);
    
    try {
      const updatedItem = await contentCalendarService.publishContent(itemId);
      setCalendarItems(prev => 
        prev.map(item => item.id === itemId ? updatedItem : item)
      );
      setSuccessMessage('Content successfully published!');
    } catch (err) {
      console.error('Error publishing content:', err);
      setError('Failed to publish content. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle scheduling submission
  const handleScheduleSubmit = async (formData: ScheduleFormData) => {
    setLoading(true);
    
    try {
      if (selectedItem) {
        // Edit existing
        const updateData: Partial<ScheduleItemRequest> = {
          content_draft_id: formData.content_draft_id,
          scheduled_date: formData.scheduled_date.toISOString(),
          status: 'scheduled'
        };
        
        const updatedItem = await contentCalendarService.updateCalendarEntry(selectedItem.id, updateData);
        
        setCalendarItems(prev => 
          prev.map(item => item.id === selectedItem.id ? updatedItem : item)
        );
        
        setSuccessMessage('Calendar item updated successfully.');
      } else {
        // Create new item
        const newItemData: ScheduleItemRequest = {
          project_id: formData.project_id,
          content_draft_id: formData.content_draft_id,
          scheduled_date: formData.scheduled_date.toISOString(),
          status: 'scheduled',
          platform: formData.platform,
          content_type: formData.content_type
        };
        
        // Create the main item
        const createdItem = await contentCalendarService.createCalendarEntry(newItemData);
        setCalendarItems(prev => [...prev, createdItem]);
        
        // Handle cross-platform publishing
        if (formData.cross_platform && formData.additional_platforms && formData.additional_platforms.length > 0) {
          const bulkItems = formData.additional_platforms.map((platform, index) => {
            const delayMinutes = (index + 1) * (formData.cross_platform_delay || 30);
            const scheduledDate = new Date(formData.scheduled_date);
            scheduledDate.setMinutes(scheduledDate.getMinutes() + delayMinutes);
            
            return {
              project_id: formData.project_id,
              content_draft_id: formData.content_draft_id,
              scheduled_date: scheduledDate.toISOString(),
              status: 'scheduled',
              platform,
              content_type: formData.content_type
            };
          });
          
          // Bulk create additional platform items
          const additionalItems = await contentCalendarService.bulkCreateCalendarEntries({
            items: bulkItems
          });
          
          setCalendarItems(prev => [...prev, ...additionalItems]);
        }
        
        // Handle recurring content
        if (formData.is_recurring && formData.recurrence_pattern && formData.recurrence_end_date) {
          const recurringItems: ScheduleItemRequest[] = [];
          const baseDate = new Date(formData.scheduled_date);
          const endDate = new Date(formData.recurrence_end_date);
          
          let currentDate = new Date(baseDate);
          
          while (currentDate < endDate) {
            // Skip the first occurrence as we already created it
            if (currentDate.getTime() === baseDate.getTime()) {
              // Advance to next occurrence
              if (formData.recurrence_pattern === 'daily') {
                currentDate.setDate(currentDate.getDate() + 1);
              } else if (formData.recurrence_pattern === 'weekly') {
                currentDate.setDate(currentDate.getDate() + 7);
              } else if (formData.recurrence_pattern === 'biweekly') {
                currentDate.setDate(currentDate.getDate() + 14);
              } else if (formData.recurrence_pattern === 'monthly') {
                currentDate.setMonth(currentDate.getMonth() + 1);
              }
              continue;
            }
            
            if (currentDate >= endDate) break;
            
            recurringItems.push({
              project_id: formData.project_id,
              content_draft_id: formData.content_draft_id,
              scheduled_date: new Date(currentDate).toISOString(),
              status: 'scheduled',
              platform: formData.platform,
              content_type: formData.content_type
            });
            
            // Advance to next occurrence
            if (formData.recurrence_pattern === 'daily') {
              currentDate.setDate(currentDate.getDate() + 1);
            } else if (formData.recurrence_pattern === 'weekly') {
              currentDate.setDate(currentDate.getDate() + 7);
            } else if (formData.recurrence_pattern === 'biweekly') {
              currentDate.setDate(currentDate.getDate() + 14);
            } else if (formData.recurrence_pattern === 'monthly') {
              currentDate.setMonth(currentDate.getMonth() + 1);
            }
          }
          
          // Bulk create recurring items
          if (recurringItems.length > 0) {
            const createdRecurringItems = await contentCalendarService.bulkCreateCalendarEntries({
              items: recurringItems
            });
            
            setCalendarItems(prev => [...prev, ...createdRecurringItems]);
          }
        }
        
        setSuccessMessage('Content scheduled successfully!');
      }
    } catch (err) {
      console.error('Error scheduling content:', err);
      setError('Failed to schedule content. Please try again.');
    } finally {
      setLoading(false);
      setScheduleDialogOpen(false);
    }
  };
  
  // Handle item click
  const handleItemClick = (item: CalendarItem) => {
    // Do nothing for now, we're handling this in the individual views
    console.log('Item clicked:', item);
  };
  
  // Handle filter change
  const handleFilterChange = (type: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [type]: values
    }));
  };
  
  // Duplicate an item (for list view)
  const handleDuplicateItem = async (item: CalendarItem) => {
    setLoading(true);
    
    try {
      // Create a new item based on the existing one
      const newItemData: ScheduleItemRequest = {
        project_id: item.project_id,
        content_draft_id: item.content_draft_id || null,
        scheduled_date: item.scheduled_date,
        status: 'draft',
        platform: item.platform,
        content_type: item.content_type
      };
      
      const duplicatedItem = await contentCalendarService.createCalendarEntry(newItemData);
      setCalendarItems(prev => [...prev, duplicatedItem]);
      setSuccessMessage('Content duplicated successfully.');
    } catch (err) {
      console.error('Error duplicating item:', err);
      setError('Failed to duplicate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSuccessMessage(null);
    setError(null);
  };
  
  // Render appropriate view based on viewMode
  const renderCalendarView = () => {
    const commonProps = {
      items: calendarItems,
      onItemClick: handleItemClick,
      onEditItem: handleEditItem,
      onDeleteItem: handleDeleteItem,
      onPublishItem: handlePublishItem,
      loading,
      insights,
      filters,
      onFilterChange: handleFilterChange,
      onDateRangeChange: handleDateRangeChange
    };
    
    switch (viewMode) {
      case 'month':
        return (
          <CalendarMonthView
            {...commonProps}
            onAddClick={handleAddClick}
          />
        );
      case 'week':
        return (
          <CalendarWeekView
            {...commonProps}
            onAddClick={handleAddClick}
          />
        );
      case 'list':
        return (
          <CalendarListView
            {...commonProps}
            onDuplicateItem={handleDuplicateItem}
          />
        );
      default:
        return null;
    }
  };
  
  // Calculate insight counts by severity
  const insightCounts = {
    info: insights.filter(i => i.severity === 'info').length,
    warning: insights.filter(i => i.severity === 'warning').length,
    critical: insights.filter(i => i.severity === 'critical').length,
    total: insights.length
  };

  return (
    <Box>
      {/* Header with title and actions */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2 
      }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Content Calendar
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained"
            onClick={handleScheduleOpen}
            disabled={loading}
          >
            Schedule Content
          </Button>
          <IconButton 
            onClick={fetchCalendarData}
            disabled={loading}
            color="primary"
            aria-label="Refresh calendar data"
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Insights and view controls */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2 
      }}>
        {/* Insights summary */}
        <Card sx={{ minWidth: 300, maxWidth: 500, flexGrow: 1 }}>
          <CardContent sx={{ padding: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AutoAwesomeIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Calendar Insights
              </Typography>
              <Tooltip title="Insights are AI-generated recommendations based on your content performance and scheduling patterns">
                <IconButton size="small">
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {loading ? (
                <CircularProgress size={20} thickness={2} />
              ) : insightCounts.total === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No insights available for current view
                </Typography>
              ) : (
                <>
                  {insightCounts.critical > 0 && (
                    <Chip 
                      icon={<ErrorOutlineIcon />} 
                      label={`${insightCounts.critical} Critical`} 
                      color="error" 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                  {insightCounts.warning > 0 && (
                    <Chip 
                      icon={<ErrorOutlineIcon />} 
                      label={`${insightCounts.warning} Warnings`} 
                      color="warning" 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                  {insightCounts.info > 0 && (
                    <Chip 
                      icon={<InfoIcon />} 
                      label={`${insightCounts.info} Suggestions`} 
                      color="info" 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                </>
              )}
            </Box>
          </CardContent>
        </Card>
        
        {/* View controls */}
        <Box>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="calendar view mode"
            size="small"
          >
            <ToggleButton value="month" aria-label="month view">
              <Tooltip title="Month View">
                <CalendarMonthIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="week" aria-label="week view">
              <Tooltip title="Week View">
                <ViewWeekIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <Tooltip title="List View">
                <ListIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      
      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Calendar view */}
      <Paper elevation={1} sx={{ p: 2 }}>
        {renderCalendarView()}
      </Paper>
      
      {/* Schedule dialog */}
      <ScheduleDialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        onSchedule={handleScheduleSubmit}
        initialData={selectedItem ? {
          content_draft_id: selectedItem.content_draft_id || 0,
          platform: selectedItem.platform || '',
          content_type: selectedItem.content_type || '',
          scheduled_date: new Date(selectedItem.scheduled_date),
          project_id: selectedItem.project_id
        } : undefined}
        contentDrafts={contentDrafts.map(d => ({ id: d.id, title: d.title }))}
        platforms={platformOptions}
        contentTypes={contentTypeOptions}
        projectId={projectId}
        bestTimeRecommendations={bestTimeRecommendations}
        loading={loading}
      />
      
      {/* Success snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContentCalendarContainer;