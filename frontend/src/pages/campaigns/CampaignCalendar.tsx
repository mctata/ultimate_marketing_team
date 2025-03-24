import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab,
  Button,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardContent
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InsightsIcon from '@mui/icons-material/Insights';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  fetchCampaigns, 
  selectCampaigns, 
  selectCampaignsLoading, 
  selectCampaignsError 
} from '../../store/slices/campaignSlice';
import { AppDispatch } from '../../store';
import CampaignTimelineView from '../../components/campaigns/CampaignTimelineView';
import CampaignFilterPanel from '../../components/campaigns/CampaignFilterPanel';
import { Campaign } from '../../services/campaignService';
import ContentCalendarContainer from '../../components/calendar/ContentCalendarContainer';

// Mock campaigns for development
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Summer Product Launch',
    description: 'Promotional campaign for new summer products',
    status: 'active',
    start_date: '2025-05-01',
    end_date: '2025-08-31',
    budget: 5000,
    platform: 'facebook',
    target_audience: { age: '18-34', interests: ['fashion', 'summer'] },
    brand_id: '1',
    content_ids: ['1', '2', '3'],
    created_at: '2025-03-15',
    updated_at: '2025-03-15'
  },
  {
    id: '2',
    name: 'Holiday Season Sale',
    description: 'Black Friday and Christmas promotional campaign',
    status: 'draft',
    start_date: '2025-11-15',
    end_date: '2025-12-31',
    budget: 8000,
    platform: 'google',
    target_audience: { age: '25-54', interests: ['shopping', 'deals'] },
    brand_id: '1',
    content_ids: ['4', '5'],
    created_at: '2025-03-10',
    updated_at: '2025-03-12'
  },
  {
    id: '3',
    name: 'Spring Collection Launch',
    description: 'Introducing the new spring fashion collection',
    status: 'paused',
    start_date: '2025-02-15',
    end_date: '2025-04-30',
    budget: 4500,
    platform: 'instagram',
    target_audience: { age: '18-34', gender: 'female', interests: ['fashion', 'lifestyle'] },
    brand_id: '1',
    content_ids: ['6', '7', '8'],
    created_at: '2025-01-20',
    updated_at: '2025-02-25'
  },
  {
    id: '4',
    name: 'Customer Loyalty Program',
    description: 'Campaign to promote our new customer loyalty program',
    status: 'completed',
    start_date: '2025-01-01',
    end_date: '2025-02-28',
    budget: 3000,
    platform: 'linkedin',
    target_audience: { age: '25-54', interests: ['loyalty', 'rewards'] },
    brand_id: '1',
    content_ids: ['9', '10'],
    created_at: '2024-12-15',
    updated_at: '2025-03-01'
  },
];

enum ViewMode {
  CALENDAR = 0,
  TIMELINE = 1
}

const CampaignCalendar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const campaigns = useSelector(selectCampaigns);
  const loading = useSelector(selectCampaignsLoading);
  const error = useSelector(selectCampaignsError);
  
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CALENDAR);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: [] as string[],
    platform: [] as string[]
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // Use mock campaigns if no real campaigns are loaded (for development)
  const displayCampaigns = campaigns.length > 0 ? campaigns : mockCampaigns;
  
  useEffect(() => {
    // Fetch campaigns when component mounts
    dispatch(fetchCampaigns({}));
  }, [dispatch]);

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setViewMode(newValue);
  };

  // Handle filter changes
  const handleFilterChange = (type: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [type]: values
    }));
  };

  // Apply filters to campaigns
  const filteredCampaigns = displayCampaigns.filter(campaign => {
    if (filters.status.length && !filters.status.includes(campaign.status)) {
      return false;
    }
    
    if (filters.platform.length && !filters.platform.includes(campaign.platform)) {
      return false;
    }
    
    return true;
  });

  // Handle manual refresh
  const handleRefresh = () => {
    dispatch(fetchCampaigns({}));
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Campaign Timeline</Typography>
        <Box>
          <Tooltip title="Filter">
            <IconButton 
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? "primary" : "default"}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton 
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button 
            variant="contained" 
            sx={{ ml: 2 }}
            onClick={() => navigate('/campaigns/new')}
          >
            Create Campaign
          </Button>
        </Box>
      </Box>

      {/* Filter panel */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <CampaignFilterPanel 
            filters={filters} 
            onFilterChange={handleFilterChange} 
          />
        </Paper>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body1">
            The campaign timeline provides a visual representation of your marketing campaigns,
            allowing you to see how they align with your content calendar. You can switch between the calendar 
            view (which shows campaigns alongside content) and the timeline view (which shows campaigns in a Gantt-style chart).
          </Typography>
        </CardContent>
      </Card>

      {/* Tabs for switching between views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={viewMode} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<CalendarTodayIcon />} label="Calendar View" />
          <Tab icon={<InsightsIcon />} label="Timeline View" />
        </Tabs>
      </Paper>

      {/* Loading state */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* View content based on selected tab */}
      {!loading && !error && (
        <>
          {viewMode === ViewMode.CALENDAR && (
            <ContentCalendarContainer 
              projectId={1} 
              campaigns={filteredCampaigns}
              key={`calendar-${refreshKey}`}
            />
          )}
          {viewMode === ViewMode.TIMELINE && (
            <CampaignTimelineView 
              campaigns={filteredCampaigns} 
              key={`timeline-${refreshKey}`}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default CampaignCalendar;
