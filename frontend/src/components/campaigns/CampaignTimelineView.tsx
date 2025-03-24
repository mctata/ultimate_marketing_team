import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip,
  Tooltip,
  Divider,
  useTheme,
  Button,
  IconButton 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useNavigate } from 'react-router-dom';
import { Campaign } from '../../services/campaignService';
import { format, isAfter, isBefore, addMonths, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, getMonth, getYear } from 'date-fns';

// Status colors for the campaign status chip
const statusColors: Record<string, string> = {
  draft: 'default',
  active: 'success',
  paused: 'warning',
  completed: 'info'
};

interface CampaignTimelineViewProps {
  campaigns: Campaign[];
}

const CampaignTimelineView: React.FC<CampaignTimelineViewProps> = ({ campaigns }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State for timeline view
  const [currentViewStart, setCurrentViewStart] = useState(startOfMonth(new Date()));
  const [monthsToShow, setMonthsToShow] = useState(6);
  
  // Calculate the end date for the view
  const currentViewEnd = endOfMonth(addMonths(currentViewStart, monthsToShow - 1));
  
  // Generate all months in the current view range
  const months = Array.from({ length: monthsToShow }, (_, i) => {
    const month = addMonths(currentViewStart, i);
    return {
      month: getMonth(month),
      year: getYear(month),
      startDate: startOfMonth(month),
      endDate: endOfMonth(month),
      label: format(month, 'MMMM yyyy')
    };
  });
  
  // Move timeline forward or backward
  const moveTimelineForward = () => {
    setCurrentViewStart(addMonths(currentViewStart, monthsToShow));
  };
  
  const moveTimelineBackward = () => {
    setCurrentViewStart(addMonths(currentViewStart, -monthsToShow));
  };
  
  // Filter campaigns that are visible in the current date range
  const visibleCampaigns = campaigns.filter(campaign => {
    const campaignStart = new Date(campaign.start_date);
    const campaignEnd = campaign.end_date ? new Date(campaign.end_date) : new Date(2099, 11, 31); // Far future if no end date
    
    return (isAfter(campaignEnd, currentViewStart) || isSameMonth(campaignEnd, currentViewStart)) && 
           (isBefore(campaignStart, currentViewEnd) || isSameMonth(campaignStart, currentViewEnd));
  });
  
  // Handle edit campaign
  const handleEditCampaign = (id: string) => {
    navigate(`/campaigns/${id}`);
  };
  
  // Handle view metrics
  const handleViewMetrics = (id: string) => {
    navigate(`/campaigns/${id}/metrics`);
  };
  
  // Handle delete campaign
  const handleDeleteCampaign = (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      // This would be connected to a real delete action in the actual implementation
      console.log('Delete campaign:', id);
    }
  };
  
  // Calculate position and width for campaign bar
  const calculateCampaignPosition = (campaign: Campaign) => {
    const campaignStart = new Date(campaign.start_date);
    const campaignEnd = campaign.end_date ? new Date(campaign.end_date) : addMonths(new Date(), 6); // Default to 6 months if ongoing
    
    // Calculate position from left edge (percentage)
    let startPosition = 0;
    if (isBefore(campaignStart, currentViewStart)) {
      // Campaign starts before the current view
      startPosition = 0;
    } else {
      // Calculate based on position within months
      const totalDays = eachDayOfInterval({ start: currentViewStart, end: currentViewEnd }).length;
      const daysFromStart = eachDayOfInterval({ start: currentViewStart, end: campaignStart }).length - 1;
      startPosition = (daysFromStart / totalDays) * 100;
    }
    
    // Calculate width (percentage)
    let endPosition = 100;
    if (isBefore(campaignEnd, currentViewEnd)) {
      // Campaign ends within the current view
      const totalDays = eachDayOfInterval({ start: currentViewStart, end: currentViewEnd }).length;
      const daysFromStart = eachDayOfInterval({ start: currentViewStart, end: campaignEnd }).length;
      endPosition = (daysFromStart / totalDays) * 100;
    }
    
    return {
      left: `${startPosition}%`,
      width: `${endPosition - startPosition}%`
    };
  };
  
  // Generate campaign color based on platform
  const getCampaignColor = (platform: string) => {
    const platformColors: Record<string, string> = {
      facebook: theme.palette.primary.main,
      instagram: theme.palette.secondary.main,
      twitter: '#1DA1F2',
      linkedin: '#0A66C2',
      google: '#DB4437'
    };
    
    return platformColors[platform] || theme.palette.grey[500];
  };

  return (
    <Paper sx={{ p: 2, overflow: 'hidden' }}>
      {/* Timeline header with navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Campaign Timeline</Typography>
        <Box>
          <IconButton onClick={moveTimelineBackward}>
            <ArrowBackIcon />
          </IconButton>
          <IconButton onClick={moveTimelineForward}>
            <ArrowForwardIcon />
          </IconButton>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Month headers */}
      <Box sx={{ display: 'flex', mb: 2 }}>
        <Box sx={{ width: '200px', flexShrink: 0, pr: 2 }}>
          <Typography variant="subtitle2">Campaign</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          {months.map((month, index) => (
            <Box 
              key={`${month.year}-${month.month}`} 
              sx={{ 
                flexGrow: 1, 
                textAlign: 'center',
                borderLeft: index > 0 ? `1px dashed ${theme.palette.divider}` : 'none'
              }}
            >
              <Typography variant="body2">{month.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
      
      {/* Campaign rows */}
      {visibleCampaigns.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            No campaigns found in the selected date range.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/campaigns/new')}
          >
            Create New Campaign
          </Button>
        </Box>
      ) : (
        <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
          {visibleCampaigns.map(campaign => (
            <Box 
              key={campaign.id} 
              sx={{ 
                display: 'flex', 
                mb: 2, 
                pb: 2,
                borderBottom: `1px solid ${theme.palette.divider}`
              }}
            >
              {/* Campaign info */}
              <Box sx={{ 
                width: '200px', 
                flexShrink: 0, 
                pr: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <Typography variant="body1" fontWeight="medium">{campaign.name}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                  <Chip 
                    label={campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)} 
                    color={statusColors[campaign.status] as any}
                    size="small"
                  />
                  <Chip 
                    label={campaign.platform.charAt(0).toUpperCase() + campaign.platform.slice(1)} 
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
              
              {/* Timeline bar container */}
              <Box sx={{ 
                position: 'relative', 
                flexGrow: 1, 
                height: '50px',
                display: 'flex'
              }}>
                {/* Month dividers */}
                {months.map((month, index) => (
                  <Box 
                    key={`divider-${month.year}-${month.month}`} 
                    sx={{ 
                      flexGrow: 1,
                      borderLeft: index > 0 ? `1px dashed ${theme.palette.divider}` : 'none',
                      height: '100%'
                    }}
                  />
                ))}
                
                {/* Campaign bar */}
                <Tooltip 
                  title={
                    <>
                      <Typography variant="body2" fontWeight="bold">{campaign.name}</Typography>
                      <Typography variant="body2">
                        {format(new Date(campaign.start_date), 'MMM d, yyyy')} - 
                        {campaign.end_date ? format(new Date(campaign.end_date), 'MMM d, yyyy') : 'Ongoing'}
                      </Typography>
                      <Typography variant="body2">Budget: ${campaign.budget.toLocaleString()}</Typography>
                      <Typography variant="body2">Status: {campaign.status}</Typography>
                    </>
                  }
                  arrow
                >
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      ...calculateCampaignPosition(campaign),
                      top: '10px',
                      height: '30px',
                      borderRadius: '4px',
                      backgroundColor: getCampaignColor(campaign.platform),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        opacity: 0.9,
                        transform: 'translateY(-2px)',
                        boxShadow: 1
                      }
                    }}
                    onClick={() => handleEditCampaign(campaign.id)}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        px: 1,
                        fontWeight: 'medium',
                        fontSize: '0.7rem'
                      }}
                    >
                      {campaign.name}
                    </Typography>
                  </Box>
                </Tooltip>
                
                {/* Campaign actions */}
                <Box 
                  sx={{ 
                    position: 'absolute',
                    ...calculateCampaignPosition(campaign),
                    top: '45px',
                    display: 'flex',
                    gap: 0.5,
                    opacity: 0.7,
                    '&:hover': {
                      opacity: 1
                    }
                  }}
                >
                  <IconButton 
                    size="small"
                    onClick={() => handleEditCampaign(campaign.id)}
                    sx={{ 
                      backgroundColor: theme.palette.background.paper,
                      boxShadow: 1,
                      fontSize: '0.75rem',
                      p: 0.5
                    }}
                  >
                    <EditIcon fontSize="inherit" />
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={() => handleViewMetrics(campaign.id)}
                    sx={{ 
                      backgroundColor: theme.palette.background.paper,
                      boxShadow: 1,
                      fontSize: '0.75rem',
                      p: 0.5
                    }}
                  >
                    <AssessmentIcon fontSize="inherit" />
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    sx={{ 
                      backgroundColor: theme.palette.background.paper,
                      boxShadow: 1,
                      fontSize: '0.75rem',
                      p: 0.5
                    }}
                  >
                    <DeleteIcon fontSize="inherit" />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default CampaignTimelineView;
