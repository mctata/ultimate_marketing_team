import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Chip,
  Badge
} from '@mui/material';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListIcon from '@mui/icons-material/List';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';
import SyncIcon from '@mui/icons-material/Sync';
import PeopleIcon from '@mui/icons-material/People';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import CalendarWebSocketService, { 
  CalendarWebSocketMessage,
  CalendarChangeMessage,
  ContentLockedMessage,
  UserJoinedProjectMessage,
  UserLeftProjectMessage
} from '../../services/calendarWebSocketService';

import CalendarMonthView from './CalendarMonthView';
import CalendarWeekView from './CalendarWeekView';
import CalendarListView from './CalendarListView';
import ScheduleDialog from './ScheduleDialog';
import { ScheduleFormData } from './ScheduleDialog';
import { 
  CalendarItem, 
  BestTimeRecommendation, 
  SchedulingInsight as CalendarInsight, 
  ScheduleItemRequest 
} from '../../services/contentCalendarService';

// Import Redux actions and selectors
import { 
  fetchCalendarItems,
  fetchCalendarInsights,
  fetchBestTimeRecommendations,
  createCalendarItem,
  updateCalendarItem,
  deleteCalendarItem,
  publishCalendarItem,
  addCalendarItemOptimistic,
  updateCalendarItemOptimistic,
  deleteCalendarItemOptimistic,
  invalidateCalendarCache,
  selectCalendarItems,
  selectCalendarItemsForDateRange,
  selectCalendarInsights,
  selectBestTimeRecommendations,
  selectCalendarLoading,
  selectCalendarError
} from '../../store/slices/contentSlice';
import { RootState } from '../../store';

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
  const dispatch = useDispatch();
  
  // Access Redux state with cached data
  const calendarItemsObj = useSelector(selectCalendarItems);
  const insights = useSelector(selectCalendarInsights);
  const bestTimeRecommendations = useSelector(selectBestTimeRecommendations);
  const loading = useSelector(selectCalendarLoading);
  const reduxError = useSelector(selectCalendarError);
  
  // Local state for other data
  const [contentDrafts, setContentDrafts] = useState<ContentDraft[]>([]);
  
  // UI state
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState(true);
  
  // WebSocket reference
  const wsServiceRef = useRef<CalendarWebSocketService | null>(null);
  
  // Date range state for fetching data
  const [currentDateRange, setCurrentDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });
  
  // Active users state for collaboration awareness
  const [activeUsers, setActiveUsers] = useState<{id: string, data: any}[]>([]);
  
  // Locked content state
  const [lockedContent, setLockedContent] = useState<{[key: string]: {lockedBy: string, userData: any}}>({});
  
  // When a real-time update was last received
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  // Get calendar items for the current date range
  const calendarItems = useSelector((state: RootState) => 
    selectCalendarItemsForDateRange(
      format(currentDateRange.startDate, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      format(currentDateRange.endDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")
    )(state)
  );
  
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
  
  // Fetch calendar data from Redux
  const fetchCalendarData = useCallback(async (force = false) => {
    setError(null);
    
    // Format dates for API
    const startDateStr = format(currentDateRange.startDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const endDateStr = format(currentDateRange.endDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
    
    try {
      // Fetch calendar entries
      await dispatch(fetchCalendarItems({
        startDate: startDateStr,
        endDate: endDateStr,
        force
      }));
      
      // Fetch best time recommendations
      await dispatch(fetchBestTimeRecommendations(projectId.toString()));
      
      // Fetch scheduling insights
      await dispatch(fetchCalendarInsights(projectId.toString()));
      
      // Fetch content drafts
      await fetchContentDrafts();
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('Failed to load calendar data. Please try again.');
    }
  }, [dispatch, projectId, currentDateRange, fetchContentDrafts]);
  
  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: CalendarWebSocketMessage) => {
    console.log('WebSocket message received:', message);
    
    // Update last update time
    setLastUpdateTime(new Date());
    
    switch (message.type) {
      case 'calendar_change':
        const changeMsg = message as CalendarChangeMessage;
        
        // Only invalidate cache if change came from another user
        if (changeMsg.source_user_id !== wsServiceRef.current?.getCurrentUserId()) {
          console.log('Invalidating cache due to remote change');
          
          // Invalidate cache to refresh data
          dispatch(invalidateCalendarCache());
          
          // Fetch updated data
          fetchCalendarData(true);
          
          // Show notification based on change type
          const changeTypeMap: {[key: string]: string} = {
            'create': 'added',
            'update': 'updated',
            'delete': 'deleted',
            'publish': 'published',
            'bulk_create': 'added multiple items',
            'bulk_update': 'updated multiple items'
          };
          
          const action = changeTypeMap[changeMsg.change_type] || 'modified';
          setSuccessMessage(`Calendar content was ${action} by another user.`);
        }
        break;
        
      case 'user_joined_project':
        const joinMsg = message as UserJoinedProjectMessage;
        
        // Add user to active users if not already present
        setActiveUsers(prev => {
          const exists = prev.some(u => u.id === joinMsg.user_id);
          if (!exists) {
            return [...prev, { id: joinMsg.user_id, data: joinMsg.user_data }];
          }
          return prev;
        });
        break;
        
      case 'user_left_project':
        const leaveMsg = message as UserLeftProjectMessage;
        
        // Remove user from active users
        setActiveUsers(prev => prev.filter(u => u.id !== leaveMsg.user_id));
        break;
        
      case 'content_locked':
        const lockMsg = message as ContentLockedMessage;
        
        // Update locked content state
        setLockedContent(prev => ({
          ...prev,
          [lockMsg.content_id]: {
            lockedBy: lockMsg.locked_by,
            userData: lockMsg.user_data
          }
        }));
        break;
        
      case 'content_unlocked':
        const unlockMsg = message as ContentLockedMessage;
        
        // Remove content from locked state
        setLockedContent(prev => {
          const { [unlockMsg.content_id]: _, ...rest } = prev;
          return rest;
        });
        break;
    }
  }, [dispatch, fetchCalendarData]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (realtimeUpdates) {
      // Create WebSocket connection
      const wsService = CalendarWebSocketService.getInstance();
      wsServiceRef.current = wsService;
      
      // Connect to WebSocket server
      wsService.connect().then(connected => {
        if (connected) {
          console.log('WebSocket connected');
          
          // Register message handler
          wsService.on('*', handleWebSocketMessage);
          
          // Join project room
          wsService.joinProject(projectId.toString(), {
            name: 'Current User' // In a real app, this would be the actual user info
          });
        } else {
          console.error('Failed to connect to WebSocket');
          setError('Failed to establish real-time connection. Some features may be limited.');
        }
      });
      
      // Cleanup on unmount
      return () => {
        if (wsServiceRef.current) {
          // Leave project room
          wsServiceRef.current.leaveProject(projectId.toString());
          
          // Remove message handler
          wsServiceRef.current.off('*', handleWebSocketMessage);
          
          // Disconnect
          wsServiceRef.current.disconnect();
        }
      };
    }
  }, [realtimeUpdates, projectId, handleWebSocketMessage]);
  
  // Initial data load
  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);
  
  // Update error state from Redux
  useEffect(() => {
    if (reduxError) {
      setError(reduxError);
    }
  }, [reduxError]);
  
  // Handle toggling real-time updates
  const toggleRealTimeUpdates = () => {
    if (realtimeUpdates) {
      // Disconnect WebSocket
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }
      setActiveUsers([]);
      setLockedContent({});
    } else {
      // Connect WebSocket
      if (wsServiceRef.current) {
        wsServiceRef.current.connect().then(connected => {
          if (connected) {
            wsServiceRef.current?.joinProject(projectId.toString(), {
              name: 'Current User' // In a real app, this would be the actual user info
            });
          }
        });
      } else {
        const wsService = CalendarWebSocketService.getInstance();
        wsServiceRef.current = wsService;
        
        // Connect and join project
        wsService.connect().then(connected => {
          if (connected) {
            wsService.on('*', handleWebSocketMessage);
            wsService.joinProject(projectId.toString(), {
              name: 'Current User' // In a real app, this would be the actual user info
            });
          }
        });
      }
    }
    
    setRealtimeUpdates(!realtimeUpdates);
  };
  
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
  
  // Handle edit item with content locking
  const handleEditItem = (item: CalendarItem) => {
    // Check if item is locked by someone else
    if (lockedContent[item.id] && lockedContent[item.id].lockedBy !== wsServiceRef.current?.getCurrentUserId()) {
      const lockedBy = lockedContent[item.id].userData?.name || lockedContent[item.id].lockedBy;
      setError(`This item is currently being edited by ${lockedBy}.`);
      return;
    }
    
    // Try to lock the item
    if (wsServiceRef.current && realtimeUpdates) {
      wsServiceRef.current.lockContent(item.id, {
        name: 'Current User' // In a real app, this would be the actual user info
      });
    }
    
    setSelectedItem(item);
    setScheduleDialogOpen(true);
  };
  
  // Handle delete item with optimistic updates
  const handleDeleteItem = async (itemId: number) => {
    try {
      // Optimistic update
      dispatch(deleteCalendarItemOptimistic(itemId.toString()));
      
      // Actual API call
      await dispatch(deleteCalendarItem(itemId.toString()));
      setSuccessMessage('Content successfully removed from calendar.');
    } catch (err) {
      console.error('Error deleting calendar item:', err);
      setError('Failed to delete calendar item. Please try again.');
      
      // Refresh data if optimistic update failed
      fetchCalendarData(true);
    }
  };
  
  // Handle publish item with optimistic updates
  const handlePublishItem = async (itemId: number) => {
    try {
      // Find the item in the current items
      const itemToPublish = calendarItems.find(item => item.id === itemId);
      
      if (itemToPublish) {
        // Create an optimistic update
        const optimisticItem = {
          ...itemToPublish,
          status: 'published',
          publishedDate: new Date().toISOString()
        };
        
        // Optimistic update
        dispatch(updateCalendarItemOptimistic(optimisticItem));
        
        // Actual API call
        await dispatch(publishCalendarItem(itemId.toString()));
        setSuccessMessage('Content successfully published!');
      }
    } catch (err) {
      console.error('Error publishing content:', err);
      setError('Failed to publish content. Please try again.');
      
      // Refresh data if optimistic update failed
      fetchCalendarData(true);
    }
  };
  
  // Handle scheduling submission with optimistic updates
  const handleScheduleSubmit = async (formData: ScheduleFormData) => {
    try {
      if (selectedItem) {
        // Edit existing
        const updateData: Partial<ScheduleItemRequest> = {
          content_draft_id: formData.content_draft_id,
          scheduled_date: formData.scheduled_date.toISOString(),
          status: 'scheduled'
        };
        
        // Create optimistic update item
        const optimisticItem = {
          ...selectedItem,
          ...updateData,
          scheduledDate: formData.scheduled_date.toISOString()
        };
        
        // Optimistic update
        dispatch(updateCalendarItemOptimistic(optimisticItem));
        
        // Actual API call
        await dispatch(updateCalendarItem(optimisticItem));
        
        // Unlock the item if it was locked
        if (wsServiceRef.current && realtimeUpdates) {
          wsServiceRef.current.unlockContent(selectedItem.id);
        }
        
        setSuccessMessage('Calendar item updated successfully.');
      } else {
        // Create a temporary ID for optimistic updates
        const tempId = `temp-${Date.now()}`;
        
        // Create new item
        const newItemData: ScheduleItemRequest = {
          project_id: formData.project_id,
          content_draft_id: formData.content_draft_id,
          scheduled_date: formData.scheduled_date.toISOString(),
          status: 'scheduled',
          platform: formData.platform,
          content_type: formData.content_type
        };
        
        // Create optimistic item
        const optimisticItem = {
          id: tempId,
          project_id: formData.project_id,
          content_draft_id: formData.content_draft_id,
          scheduledDate: formData.scheduled_date.toISOString(),
          status: 'scheduled',
          platform: formData.platform || '',
          contentType: formData.content_type || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          title: contentDrafts.find(d => d.id === formData.content_draft_id)?.title || 'New Content',
          author: 'Current User'
        };
        
        // Optimistic update
        dispatch(addCalendarItemOptimistic(optimisticItem));
        
        // Actual API call
        await dispatch(createCalendarItem(newItemData));
        
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
          
          // Create optimistic items for each platform
          bulkItems.forEach((item, index) => {
            const platformTempId = `temp-platform-${Date.now()}-${index}`;
            const platformOptimisticItem = {
              id: platformTempId,
              project_id: item.project_id,
              content_draft_id: item.content_draft_id,
              scheduledDate: item.scheduled_date,
              status: item.status,
              platform: item.platform || '',
              contentType: item.content_type || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              title: contentDrafts.find(d => d.id === item.content_draft_id)?.title || 'New Platform Content',
              author: 'Current User'
            };
            
            dispatch(addCalendarItemOptimistic(platformOptimisticItem));
          });
          
          // Bulk API call (non-optimistic for simplicity)
          await contentCalendarService.bulkCreateCalendarEntries({
            items: bulkItems
          });
          
          // Refresh data to get accurate IDs
          fetchCalendarData(true);
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
          
          // Create optimistic items for recurring items
          recurringItems.forEach((item, index) => {
            const recurringTempId = `temp-recurring-${Date.now()}-${index}`;
            const recurringOptimisticItem = {
              id: recurringTempId,
              project_id: item.project_id,
              content_draft_id: item.content_draft_id,
              scheduledDate: item.scheduled_date,
              status: item.status,
              platform: item.platform || '',
              contentType: item.content_type || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              title: contentDrafts.find(d => d.id === item.content_draft_id)?.title || 'Recurring Content',
              author: 'Current User'
            };
            
            dispatch(addCalendarItemOptimistic(recurringOptimisticItem));
          });
          
          // Bulk API call (non-optimistic for bulk items)
          if (recurringItems.length > 0) {
            await contentCalendarService.bulkCreateCalendarEntries({
              items: recurringItems
            });
            
            // Refresh data to get accurate IDs
            fetchCalendarData(true);
          }
        }
        
        setSuccessMessage('Content scheduled successfully!');
      }
    } catch (err) {
      console.error('Error scheduling content:', err);
      setError('Failed to schedule content. Please try again.');
      
      // Refresh data if optimistic update failed
      fetchCalendarData(true);
    } finally {
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
  
  // Duplicate an item with optimistic updates
  const handleDuplicateItem = async (item: CalendarItem) => {
    try {
      // Create a temporary ID for optimistic update
      const tempId = `temp-duplicate-${Date.now()}`;
      
      // Create a new item based on the existing one
      const newItemData: ScheduleItemRequest = {
        project_id: item.project_id,
        content_draft_id: item.content_draft_id || null,
        scheduled_date: item.scheduledDate,
        status: 'draft',
        platform: item.platform,
        content_type: item.contentType
      };
      
      // Create optimistic item for immediate UI feedback
      const optimisticItem = {
        ...item,
        id: tempId,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Optimistic update
      dispatch(addCalendarItemOptimistic(optimisticItem));
      
      // Actual API call
      await dispatch(createCalendarItem(newItemData));
      setSuccessMessage('Content duplicated successfully.');
    } catch (err) {
      console.error('Error duplicating item:', err);
      setError('Failed to duplicate content. Please try again.');
      
      // Refresh data if optimistic update failed
      fetchCalendarData(true);
    }
  };
  
  // Handle dialog close with content unlocking
  const handleDialogClose = () => {
    // Unlock content if it was selected for editing
    if (selectedItem && wsServiceRef.current && realtimeUpdates) {
      wsServiceRef.current.unlockContent(selectedItem.id);
    }
    
    setScheduleDialogOpen(false);
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
          <Tooltip title={realtimeUpdates ? "Disable real-time updates" : "Enable real-time updates"}>
            <IconButton
              onClick={toggleRealTimeUpdates}
              color={realtimeUpdates ? "success" : "default"}
              aria-label="Toggle real-time updates"
            >
              <SyncIcon />
            </IconButton>
          </Tooltip>
          <IconButton 
            onClick={() => fetchCalendarData(true)}
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
      
      {/* Active users indicator */}
      {realtimeUpdates && activeUsers.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={`${activeUsers.length} active user${activeUsers.length !== 1 ? 's' : ''}`}>
            <Badge
              badgeContent={activeUsers.length}
              color="primary"
              sx={{ '& .MuiBadge-badge': { top: 8, right: 8 } }}
            >
              <PeopleIcon color="action" />
            </Badge>
          </Tooltip>
          <Typography variant="body2" color="text.secondary">
            {activeUsers.length} user{activeUsers.length !== 1 ? 's' : ''} viewing this calendar
          </Typography>
        </Box>
      )}
      
      {/* Real-time updates status indicator */}
      {realtimeUpdates && lastUpdateTime && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={<SyncIcon fontSize="small" />}
            label={`Last updated: ${new Date(lastUpdateTime).toLocaleTimeString()}`}
            size="small"
            color="success"
            variant="outlined"
          />
        </Box>
      )}
      
      {/* Schedule dialog */}
      <ScheduleDialog
        open={scheduleDialogOpen}
        onClose={handleDialogClose}
        onSchedule={handleScheduleSubmit}
        initialData={selectedItem ? {
          content_draft_id: selectedItem.content_draft_id || 0,
          platform: selectedItem.platform || '',
          content_type: selectedItem.content_type || '',
          scheduled_date: new Date(selectedItem.scheduledDate),
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