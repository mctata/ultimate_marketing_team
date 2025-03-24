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
  Divider
} from '@mui/material';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListIcon from '@mui/icons-material/List';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import CalendarMonthView from './CalendarMonthView';
import CalendarWeekView from './CalendarWeekView';
import CalendarListView from './CalendarListView';
import ScheduleDialog from './ScheduleDialog';
import { ScheduleFormData } from './ScheduleDialog';

// Define type for best time recommendations
interface BestTimeRecommendation {
  platform: string;
  day_of_week: number;
  hour_of_day: number;
  average_engagement: number;
  confidence: number;
}

// Define type for calendar insights
interface CalendarInsight {
  insight_type: string;
  description: string;
  severity: string;
  start_date?: string;
  end_date?: string;
  affected_content_ids?: number[];
  recommendation: string;
}

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
  content_draft_id?: number;
}

// Define content draft interface
interface ContentDraft {
  id: number;
  title: string;
  content: string;
  version: number;
  status: string;
}

// Sample content drafts (would be fetched from API in production)
const sampleContentDrafts: ContentDraft[] = [
  { id: 1, title: 'Q1 Marketing Strategy', content: 'Lorem ipsum...', version: 1, status: 'approved' },
  { id: 2, title: 'Product Launch Announcement', content: 'Lorem ipsum...', version: 2, status: 'approved' },
  { id: 3, title: 'Weekly Customer Success Story', content: 'Lorem ipsum...', version: 1, status: 'draft' },
  { id: 4, title: 'Monthly Newsletter', content: 'Lorem ipsum...', version: 3, status: 'approved' },
  { id: 5, title: 'New Feature Tutorial', content: 'Lorem ipsum...', version: 1, status: 'draft' },
];

// Sample best time recommendations
const sampleBestTimeRecommendations: BestTimeRecommendation[] = [
  { platform: 'instagram', day_of_week: 2, hour_of_day: 12, average_engagement: 542, confidence: 0.85 },
  { platform: 'facebook', day_of_week: 4, hour_of_day: 15, average_engagement: 320, confidence: 0.75 },
  { platform: 'twitter', day_of_week: 1, hour_of_day: 9, average_engagement: 210, confidence: 0.65 },
  { platform: 'linkedin', day_of_week: 3, hour_of_day: 10, average_engagement: 180, confidence: 0.8 },
  { platform: 'email', day_of_week: 2, hour_of_day: 8, average_engagement: 420, confidence: 0.9 },
];

// Sample insights
const sampleInsights: CalendarInsight[] = [
  {
    insight_type: 'gap',
    description: 'Gap of 5 days without scheduled content',
    severity: 'info',
    start_date: '2025-03-20T00:00:00Z',
    end_date: '2025-03-25T00:00:00Z',
    recommendation: 'Consider adding content during this period to maintain audience engagement'
  },
  {
    insight_type: 'conflict',
    description: 'Content scheduled too close together (30 minutes apart)',
    severity: 'warning',
    start_date: '2025-03-15T14:00:00Z',
    end_date: '2025-03-15T14:30:00Z',
    affected_content_ids: [3, 5],
    recommendation: 'Consider spacing out content by at least 2 hours for better engagement'
  },
  {
    insight_type: 'balance',
    description: 'Over-reliance on one content type (80% blog posts)',
    severity: 'warning',
    recommendation: 'Try to balance content types more evenly (aim for <60% of any single type)'
  },
  {
    insight_type: 'frequency',
    description: 'Posting frequency decreased by 40% compared to last month',
    severity: 'critical',
    recommendation: 'Maintain consistent posting schedule to keep audience engaged'
  }
];

// Sample calendar items (would be fetched from API in production)
const sampleCalendarItems: CalendarItem[] = [
  {
    id: 1,
    title: 'Q1 Marketing Strategy',
    scheduled_date: '2025-03-10T09:00:00Z',
    status: 'published',
    content_type: 'blog',
    platform: 'website',
    published_date: '2025-03-10T09:00:00Z',
    project_id: 1,
    content_draft_id: 1
  },
  {
    id: 2,
    title: 'Product Launch Announcement',
    scheduled_date: '2025-03-15T14:00:00Z',
    status: 'scheduled',
    content_type: 'social',
    platform: 'facebook',
    project_id: 1,
    content_draft_id: 2
  },
  {
    id: 3,
    title: 'Weekly Customer Success Story',
    scheduled_date: '2025-03-15T14:30:00Z',
    status: 'scheduled',
    content_type: 'social',
    platform: 'instagram',
    project_id: 1,
    content_draft_id: 3
  },
  {
    id: 4,
    title: 'Monthly Newsletter',
    scheduled_date: '2025-03-20T08:00:00Z',
    status: 'draft',
    content_type: 'email',
    platform: 'email',
    project_id: 1,
    content_draft_id: 4
  },
  {
    id: 5,
    title: 'New Feature Tutorial',
    scheduled_date: '2025-03-30T10:00:00Z',
    status: 'scheduled',
    content_type: 'video',
    platform: 'youtube',
    project_id: 1,
    content_draft_id: 5
  }
];

// Define props for ContentCalendarContainer
interface ContentCalendarContainerProps {
  projectId: number;
}

const ContentCalendarContainer: React.FC<ContentCalendarContainerProps> = ({ projectId }) => {
  const theme = useTheme();
  
  // State for calendar data
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>(sampleCalendarItems);
  const [contentDrafts, setContentDrafts] = useState<ContentDraft[]>(sampleContentDrafts);
  const [bestTimeRecommendations, setBestTimeRecommendations] = useState<BestTimeRecommendation[]>(sampleBestTimeRecommendations);
  const [insights, setInsights] = useState<CalendarInsight[]>(sampleInsights);
  
  // UI state
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    status: [] as string[],
    contentType: [] as string[],
    platform: [] as string[],
  });
  
  // Platform and content type options
  const platformOptions = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok', 'email', 'website'];
  const contentTypeOptions = ['blog', 'social', 'email', 'video', 'ad', 'infographic'];
  
  // Fetch calendar data (simulated)
  const fetchCalendarData = useCallback(() => {
    setLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      setCalendarItems(sampleCalendarItems);
      setContentDrafts(sampleContentDrafts);
      setBestTimeRecommendations(sampleBestTimeRecommendations);
      setInsights(sampleInsights);
      setLoading(false);
    }, 1000);
  }, []);
  
  // Initial data load
  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);
  
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
  const handleDeleteItem = (itemId: number) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setCalendarItems(prev => prev.filter(item => item.id !== itemId));
      setLoading(false);
      setSuccessMessage('Content successfully removed from calendar.');
    }, 500);
  };
  
  // Handle publish item
  const handlePublishItem = (itemId: number) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setCalendarItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, status: 'published', published_date: new Date().toISOString() } 
            : item
        )
      );
      setLoading(false);
      setSuccessMessage('Content successfully published!');
    }, 800);
  };
  
  // Handle scheduling submission
  const handleScheduleSubmit = (formData: ScheduleFormData) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (selectedItem) {
        // Edit existing
        setCalendarItems(prev => 
          prev.map(item => 
            item.id === selectedItem.id 
              ? { 
                  ...item, 
                  content_draft_id: formData.content_draft_id,
                  scheduled_date: formData.scheduled_date.toISOString(),
                  platform: formData.platform,
                  content_type: formData.content_type,
                  title: contentDrafts.find(d => d.id === formData.content_draft_id)?.title || item.title
                } 
              : item
          )
        );
        setSuccessMessage('Calendar item updated successfully.');
      } else {
        // Create new
        const newItem: CalendarItem = {
          id: Math.max(...calendarItems.map(i => i.id)) + 1,
          title: contentDrafts.find(d => d.id === formData.content_draft_id)?.title || 'Untitled',
          scheduled_date: formData.scheduled_date.toISOString(),
          status: 'scheduled',
          content_type: formData.content_type,
          platform: formData.platform,
          project_id: formData.project_id,
          content_draft_id: formData.content_draft_id
        };
        
        setCalendarItems(prev => [...prev, newItem]);
        
        // Handle cross-platform publishing
        if (formData.cross_platform && formData.additional_platforms && formData.additional_platforms.length > 0) {
          const additionalItems = formData.additional_platforms.map((platform, index) => {
            const delayMinutes = (index + 1) * (formData.cross_platform_delay || 30);
            const scheduledDate = new Date(formData.scheduled_date);
            scheduledDate.setMinutes(scheduledDate.getMinutes() + delayMinutes);
            
            return {
              id: Math.max(...calendarItems.map(i => i.id)) + 2 + index,
              title: contentDrafts.find(d => d.id === formData.content_draft_id)?.title || 'Untitled',
              scheduled_date: scheduledDate.toISOString(),
              status: 'scheduled',
              content_type: formData.content_type,
              platform,
              project_id: formData.project_id,
              content_draft_id: formData.content_draft_id
            };
          });
          
          setCalendarItems(prev => [...prev, ...additionalItems]);
        }
        
        // Handle recurring content
        if (formData.is_recurring && formData.recurrence_pattern && formData.recurrence_end_date) {
          const recurringItems: CalendarItem[] = [];
          const baseDate = new Date(formData.scheduled_date);
          const endDate = new Date(formData.recurrence_end_date);
          
          let currentDate = new Date(baseDate);
          let itemId = Math.max(...calendarItems.map(i => i.id)) + 10; // Start ID after possible cross-platform items
          
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
              id: itemId++,
              title: contentDrafts.find(d => d.id === formData.content_draft_id)?.title || 'Untitled',
              scheduled_date: new Date(currentDate).toISOString(),
              status: 'scheduled',
              content_type: formData.content_type,
              platform: formData.platform,
              project_id: formData.project_id,
              content_draft_id: formData.content_draft_id
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
          
          setCalendarItems(prev => [...prev, ...recurringItems]);
        }
        
        setSuccessMessage('Content scheduled successfully!');
      }
      
      setLoading(false);
      setScheduleDialogOpen(false);
    }, 1000);
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
  const handleDuplicateItem = (item: CalendarItem) => {
    const newItem: CalendarItem = {
      ...item,
      id: Math.max(...calendarItems.map(i => i.id)) + 1,
      status: 'draft',
      published_date: undefined,
      title: `Copy of ${item.title}`
    };
    
    setCalendarItems(prev => [...prev, newItem]);
    setSuccessMessage('Content duplicated successfully.');
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
      onFilterChange: handleFilterChange
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
              {insightCounts.total === 0 ? (
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