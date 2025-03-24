import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Button,
  IconButton,
  Collapse,
  Tooltip
} from '@mui/material';
import {
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorOutlineIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { AppDispatch } from '../../store';
import { 
  fetchCampaignPerformanceAlerts,
  selectPerformanceAlerts,
  selectPerformanceAlertsLoading
} from '../../store/slices/predictiveAnalyticsSlice';
import { CampaignPerformanceAlert } from '../../services/predictiveAnalyticsService';

// Alert severity color mapping
const SEVERITY_COLORS = {
  high: 'error',
  medium: 'warning',
  low: 'info'
};

// Alert type icon mapping
const ALERT_ICONS = {
  underperforming: <TrendingDownIcon />,
  overperforming: <CheckCircleIcon color="success" />,
  budget_depleting: <WarningIcon color="warning" />,
  trend_change: <InfoIcon color="info" />
};

const CampaignPerformanceAlerts = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  
  const alerts = useSelector((state) => selectPerformanceAlerts(state, id || ''));
  const loading = useSelector(selectPerformanceAlertsLoading);
  
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});
  
  // Fetch alerts when component mounts
  useEffect(() => {
    if (id) {
      dispatch(fetchCampaignPerformanceAlerts(id));
    }
  }, [dispatch, id]);
  
  // Generate mock alerts for development
  const getMockAlerts = (): CampaignPerformanceAlert[] => {
    return [
      {
        campaign_id: id || '',
        alert_type: 'underperforming',
        severity: 'high',
        message: 'Campaign conversions have dropped by 23% in the last 7 days compared to the previous period.',
        metrics_affected: ['conversions', 'cost_per_conversion', 'roi'],
        recommendation: 'Consider reviewing your audience targeting settings and ad creatives. Recent changes may have affected your conversion rates.'
      },
      {
        campaign_id: id || '',
        alert_type: 'budget_depleting',
        severity: 'medium',
        message: 'At the current spend rate, your campaign budget will be depleted before the scheduled end date.',
        metrics_affected: ['budget', 'daily_spend'],
        recommendation: 'Increase your campaign budget by at least 15% to maintain current performance until the end date, or adjust your bid strategy to reduce daily spending.'
      },
      {
        campaign_id: id || '',
        alert_type: 'trend_change',
        severity: 'low',
        message: 'Click-through rate has been steadily increasing over the past 5 days, indicating improved ad relevance.',
        metrics_affected: ['ctr', 'engagement'],
        recommendation: 'Consider increasing budget allocation to capitalize on the improved engagement levels.'
      }
    ];
  };
  
  // Use mock data if API data is not available
  const displayAlerts: CampaignPerformanceAlert[] = alerts.length > 0 ? alerts : getMockAlerts();
  
  // Toggle alert expansion
  const handleToggleExpand = (index: number) => {
    setExpandedAlerts(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // Get the count of alerts by severity
  const getAlertCounts = () => {
    return displayAlerts.reduce((counts, alert) => {
      counts[alert.severity] = (counts[alert.severity] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  };
  
  const alertCounts = getAlertCounts();
  
  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Performance Alerts</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {alertCounts.high > 0 && (
            <Chip 
              icon={<ErrorOutlineIcon />} 
              label={`${alertCounts.high} High`} 
              color="error" 
              size="small" 
            />
          )}
          {alertCounts.medium > 0 && (
            <Chip 
              icon={<WarningIcon />} 
              label={`${alertCounts.medium} Medium`} 
              color="warning" 
              size="small" 
            />
          )}
          {alertCounts.low > 0 && (
            <Chip 
              icon={<InfoIcon />} 
              label={`${alertCounts.low} Low`} 
              color="info" 
              size="small" 
            />
          )}
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : displayAlerts.length === 0 ? (
        <Alert severity="success">
          <AlertTitle>No active alerts</AlertTitle>
          Your campaign is currently performing as expected. We'll notify you if any performance issues arise.
        </Alert>
      ) : (
        <List>
          {displayAlerts.map((alert, index) => (
            <Box key={index}>
              {index > 0 && <Divider component="li" />}
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    onClick={() => handleToggleExpand(index)}
                    sx={{ 
                      transform: expandedAlerts[index] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s'
                    }}
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  {ALERT_ICONS[alert.alert_type]}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">
                        {alert.alert_type === 'underperforming' && 'Performance Issue Detected'}
                        {alert.alert_type === 'overperforming' && 'Performance Opportunity'}
                        {alert.alert_type === 'budget_depleting' && 'Budget Alert'}
                        {alert.alert_type === 'trend_change' && 'Trend Change Detected'}
                      </Typography>
                      <Chip 
                        label={alert.severity} 
                        size="small"
                        color={SEVERITY_COLORS[alert.severity] as any}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" sx={{ mb: 1, color: 'text.primary' }}>
                        {alert.message}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                        {alert.metrics_affected.map(metric => (
                          <Chip 
                            key={metric} 
                            label={metric.replace('_', ' ')} 
                            size="small" 
                            variant="outlined"
                            color="default"
                          />
                        ))}
                      </Box>
                      <Collapse in={expandedAlerts[index]} timeout="auto" unmountOnExit>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2">Recommendation:</Typography>
                          <Typography variant="body2" paragraph>
                            {alert.recommendation}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {alert.alert_type === 'underperforming' && (
                              <Button size="small" variant="outlined" color="primary">
                                Review Campaign
                              </Button>
                            )}
                            {alert.alert_type === 'budget_depleting' && (
                              <Button size="small" variant="outlined" color="primary">
                                Adjust Budget
                              </Button>
                            )}
                            {alert.alert_type === 'trend_change' && alert.severity === 'low' && (
                              <Button size="small" variant="outlined" color="success">
                                Optimize Campaign
                              </Button>
                            )}
                            <Button size="small" variant="text">
                              Dismiss
                            </Button>
                          </Box>
                        </Box>
                      </Collapse>
                    </>
                  }
                />
              </ListItem>
            </Box>
          ))}
        </List>
      )}
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tooltip title="AI continuously monitors your campaign performance to detect trends and potential issues">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InfoIcon fontSize="small" color="action" sx={{ mr: 1 }} />
            <Typography variant="caption" color="textSecondary">
              Last updated: Today at 08:15 AM
            </Typography>
          </Box>
        </Tooltip>
        
        <Button size="small" variant="text" startIcon={<InfoIcon />}>
          Alert Settings
        </Button>
      </Box>
    </Paper>
  );
};

export default CampaignPerformanceAlerts;
