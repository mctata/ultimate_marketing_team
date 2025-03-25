import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  Badge,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Tabs,
  Tab,
  SelectChangeEvent,
  Slider,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TuneIcon from '@mui/icons-material/Tune';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import ChatIcon from '@mui/icons-material/Chat';
import AddIcon from '@mui/icons-material/Add';
import MoneyIcon from '@mui/icons-material/Money';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';

// Mock data for performance alerts
const mockAlerts = [
  {
    id: 'alert1',
    type: 'threshold',
    status: 'critical',
    metric: 'conversion_rate',
    metricLabel: 'Conversion Rate',
    threshold: 2.0,
    value: 1.2,
    direction: 'below',
    timestamp: '2023-06-18T15:30:00Z',
    campaign: 'Summer Promo 2023',
    description: 'Conversion rate has dropped below critical threshold of 2.0%',
    read: false,
    actionTaken: false
  },
  {
    id: 'alert2',
    type: 'threshold',
    status: 'warning',
    metric: 'cpc',
    metricLabel: 'Cost Per Click',
    threshold: 1.75,
    value: 1.92,
    direction: 'above',
    timestamp: '2023-06-18T14:15:00Z',
    campaign: 'Product Launch Campaign',
    description: 'Cost per click has increased above warning threshold of $1.75',
    read: true,
    actionTaken: false
  },
  {
    id: 'alert3',
    type: 'anomaly',
    status: 'warning',
    metric: 'clicks',
    metricLabel: 'Click Volume',
    expected: 450,
    value: 283,
    deviation: -37,
    timestamp: '2023-06-18T12:45:00Z',
    campaign: 'Summer Promo 2023',
    description: 'Unusual drop in click volume detected. Current clicks are 37% below expected level.',
    read: false,
    actionTaken: false
  },
  {
    id: 'alert4',
    type: 'threshold',
    status: 'info',
    metric: 'roas',
    metricLabel: 'ROAS',
    threshold: 3.0,
    value: 3.6,
    direction: 'above',
    timestamp: '2023-06-18T10:30:00Z',
    campaign: 'Remarketing Campaign',
    description: 'ROAS has increased above target threshold of 3.0',
    read: true,
    actionTaken: true
  },
  {
    id: 'alert5',
    type: 'anomaly',
    status: 'critical',
    metric: 'impressions',
    metricLabel: 'Impressions',
    expected: 25000,
    value: 12540,
    deviation: -50,
    timestamp: '2023-06-17T22:15:00Z',
    campaign: 'Brand Awareness',
    description: 'Critical drop in impressions detected. Current impressions are 50% below expected level.',
    read: false,
    actionTaken: false
  },
  {
    id: 'alert6',
    type: 'anomaly',
    status: 'info',
    metric: 'ctr',
    metricLabel: 'CTR',
    expected: 2.1,
    value: 2.7,
    deviation: 29,
    timestamp: '2023-06-17T20:00:00Z',
    campaign: 'Email Retargeting',
    description: 'Unusual increase in CTR detected. Current CTR is 29% above expected level.',
    read: true,
    actionTaken: true
  }
];

// Mock data for alert preferences
const initialAlertPreferences = {
  metrics: {
    conversion_rate: {
      enabled: true,
      criticalThreshold: 2.0,
      warningThreshold: 2.5,
      direction: 'below'
    },
    cpc: {
      enabled: true,
      criticalThreshold: 2.0,
      warningThreshold: 1.75,
      direction: 'above'
    },
    ctr: {
      enabled: true,
      criticalThreshold: 1.0,
      warningThreshold: 1.5,
      direction: 'below'
    },
    roas: {
      enabled: true,
      criticalThreshold: 1.5,
      warningThreshold: 2.0,
      direction: 'below'
    },
    impressions: {
      enabled: true,
      criticalThreshold: 0,
      warningThreshold: 0,
      direction: 'anomaly_only'
    },
    clicks: {
      enabled: true,
      criticalThreshold: 0,
      warningThreshold: 0,
      direction: 'anomaly_only'
    }
  },
  anomalyDetection: true,
  anomalyThreshold: 30,
  notificationChannels: {
    inApp: true,
    email: true,
    sms: false
  },
  emailRecipients: ['marketing-team@example.com', 'campaign-manager@example.com']
};

// Available metrics for alert settings
const availableMetrics = [
  { value: 'impressions', label: 'Impressions', category: 'reach', icon: <VisibilityIcon /> },
  { value: 'clicks', label: 'Clicks', category: 'reach', icon: <BarChartIcon /> },
  { value: 'ctr', label: 'Click-Through Rate', category: 'reach', icon: <TimelineIcon /> },
  { value: 'conversion_rate', label: 'Conversion Rate', category: 'conversion', icon: <CheckCircleIcon /> },
  { value: 'conversions', label: 'Conversions', category: 'conversion', icon: <PeopleIcon /> },
  { value: 'cpc', label: 'Cost Per Click', category: 'cost', icon: <MoneyIcon /> },
  { value: 'cpa', label: 'Cost Per Acquisition', category: 'cost', icon: <MoneyIcon /> },
  { value: 'roas', label: 'Return on Ad Spend', category: 'revenue', icon: <TrendingUpIcon /> },
  { value: 'revenue', label: 'Revenue', category: 'revenue', icon: <MoneyIcon /> }
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`alert-tabpanel-${index}`}
      aria-labelledby={`alert-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `alert-tab-${index}`,
    'aria-controls': `alert-tabpanel-${index}`,
  };
}

const CampaignPerformanceAlerts: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [campaign, setCampaign] = useState<any>(null);
  const [alertPreferences, setAlertPreferences] = useState(initialAlertPreferences);
  
  // Metric settings dialog state
  const [openMetricDialog, setOpenMetricDialog] = useState(false);
  const [currentMetric, setCurrentMetric] = useState<string | null>(null);
  const [currentMetricSettings, setCurrentMetricSettings] = useState<any>(null);
  
  // New alert dialog state
  const [openNewAlertDialog, setOpenNewAlertDialog] = useState(false);
  const [newAlertMetric, setNewAlertMetric] = useState('conversion_rate');
  const [newAlertDirection, setNewAlertDirection] = useState('below');
  const [newAlertThreshold, setNewAlertThreshold] = useState<number>(2.0);
  
  // Email settings dialog state
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [newEmailRecipient, setNewEmailRecipient] = useState('');
  
  useEffect(() => {
    const loadData = async () => {
      // Simulate API call with delay
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, these would be API calls
      setAlerts(mockAlerts);
      setCampaign({
        id: id || '123',
        name: 'Summer Promo 2023',
        status: 'active',
        startDate: '2023-06-01',
        endDate: '2023-08-31',
        budget: 25000,
        metrics: {
          impressions: 245000,
          clicks: 12300,
          ctr: 5.02,
          conversions: 1250,
          conversion_rate: 10.16,
          cpc: 1.35,
          roas: 3.2
        }
      });
      setEmailRecipients(initialAlertPreferences.emailRecipients);
      
      setLoading(false);
    };
    
    loadData();
  }, [id]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleMarkAsRead = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };
  
  const handleMarkActionTaken = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, actionTaken: true } : alert
    ));
  };
  
  const handleDismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };
  
  const handleOpenMetricDialog = (metric: string) => {
    setCurrentMetric(metric);
    setCurrentMetricSettings(alertPreferences.metrics[metric as keyof typeof alertPreferences.metrics]);
    setOpenMetricDialog(true);
  };
  
  const handleCloseMetricDialog = () => {
    setOpenMetricDialog(false);
    setCurrentMetric(null);
    setCurrentMetricSettings(null);
  };
  
  const handleSaveMetricSettings = () => {
    if (currentMetric && currentMetricSettings) {
      setAlertPreferences({
        ...alertPreferences,
        metrics: {
          ...alertPreferences.metrics,
          [currentMetric]: currentMetricSettings
        }
      });
    }
    handleCloseMetricDialog();
  };
  
  const handleMetricToggle = (metric: string) => {
    setAlertPreferences({
      ...alertPreferences,
      metrics: {
        ...alertPreferences.metrics,
        [metric]: {
          ...alertPreferences.metrics[metric as keyof typeof alertPreferences.metrics],
          enabled: !alertPreferences.metrics[metric as keyof typeof alertPreferences.metrics].enabled
        }
      }
    });
  };
  
  const handleThresholdChange = (event: Event, newValue: number | number[]) => {
    if (currentMetric && currentMetricSettings) {
      if (Array.isArray(newValue)) {
        setCurrentMetricSettings({
          ...currentMetricSettings,
          warningThreshold: newValue[0],
          criticalThreshold: newValue[1]
        });
      }
    }
  };
  
  const handleDirectionChange = (event: SelectChangeEvent) => {
    if (currentMetric && currentMetricSettings) {
      setCurrentMetricSettings({
        ...currentMetricSettings,
        direction: event.target.value
      });
    }
  };
  
  const handleAnomalyDetectionToggle = () => {
    setAlertPreferences({
      ...alertPreferences,
      anomalyDetection: !alertPreferences.anomalyDetection
    });
  };
  
  const handleAnomalyThresholdChange = (event: Event, newValue: number | number[]) => {
    if (!Array.isArray(newValue)) {
      setAlertPreferences({
        ...alertPreferences,
        anomalyThreshold: newValue
      });
    }
  };
  
  const handleNotificationChannelToggle = (channel: string) => {
    setAlertPreferences({
      ...alertPreferences,
      notificationChannels: {
        ...alertPreferences.notificationChannels,
        [channel]: !alertPreferences.notificationChannels[channel as keyof typeof alertPreferences.notificationChannels]
      }
    });
  };
  
  // Email dialog handlers
  const handleOpenEmailDialog = () => {
    setOpenEmailDialog(true);
  };
  
  const handleCloseEmailDialog = () => {
    setOpenEmailDialog(false);
  };
  
  const handleAddEmailRecipient = () => {
    if (newEmailRecipient.trim() && !emailRecipients.includes(newEmailRecipient.trim())) {
      setEmailRecipients([...emailRecipients, newEmailRecipient.trim()]);
      setNewEmailRecipient('');
    }
  };
  
  const handleRemoveEmailRecipient = (email: string) => {
    setEmailRecipients(emailRecipients.filter(recipient => recipient !== email));
  };
  
  const handleSaveEmailRecipients = () => {
    setAlertPreferences({
      ...alertPreferences,
      emailRecipients
    });
    handleCloseEmailDialog();
  };
  
  // New alert dialog handlers
  const handleOpenNewAlertDialog = () => {
    setOpenNewAlertDialog(true);
  };
  
  const handleCloseNewAlertDialog = () => {
    setOpenNewAlertDialog(false);
  };
  
  const handleNewAlertMetricChange = (event: SelectChangeEvent) => {
    setNewAlertMetric(event.target.value);
  };
  
  const handleNewAlertDirectionChange = (event: SelectChangeEvent) => {
    setNewAlertDirection(event.target.value);
  };
  
  const handleNewAlertThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewAlertThreshold(parseFloat(event.target.value));
  };
  
  const handleCreateNewAlert = () => {
    // Generate new alert
    const newAlert = {
      id: `alert${Math.random().toString(36).substring(2, 9)}`,
      type: 'threshold',
      status: 'warning',
      metric: newAlertMetric,
      metricLabel: availableMetrics.find(m => m.value === newAlertMetric)?.label || newAlertMetric,
      threshold: newAlertThreshold,
      value: campaign?.metrics[newAlertMetric] || 0,
      direction: newAlertDirection,
      timestamp: new Date().toISOString(),
      campaign: campaign?.name || 'Unknown Campaign',
      description: `Custom alert: ${availableMetrics.find(m => m.value === newAlertMetric)?.label || newAlertMetric} is ${newAlertDirection} threshold of ${newAlertThreshold}`,
      read: false,
      actionTaken: false
    };
    
    setAlerts([newAlert, ...alerts]);
    handleCloseNewAlertDialog();
  };
  
  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <CheckCircleIcon color="success" />;
      default:
        return <NotificationsIcon color="info" />;
    }
  };
  
  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'above':
        return <TrendingUpIcon />;
      case 'below':
        return <TrendingDownIcon />;
      default:
        return <TrendingFlatIcon />;
    }
  };
  
  const getMetricIcon = (metricValue: string) => {
    const metric = availableMetrics.find(m => m.value === metricValue);
    return metric ? metric.icon : <BarChartIcon />;
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Filter alerts based on tab
  const activeAlerts = alerts.filter(alert => !alert.read || !alert.actionTaken);
  const resolvedAlerts = alerts.filter(alert => alert.read && alert.actionTaken);
  
  const unreadCount = alerts.filter(alert => !alert.read).length;
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Performance Alerts
          </Typography>
          {campaign && (
            <Typography variant="subtitle1" color="text.secondary">
              Campaign: {campaign.name}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<TuneIcon />}
            onClick={() => setTabValue(2)}
          >
            Alert Settings
          </Button>
          
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenNewAlertDialog}
          >
            Create Alert
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="alert tabs">
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Badge badgeContent={unreadCount} color="error" sx={{ mr: 1 }}>
                  <NotificationsActiveIcon />
                </Badge>
                Active Alerts ({activeAlerts.length})
              </Box>
            } 
            {...a11yProps(0)} 
          />
          <Tab label="Resolved Alerts" {...a11yProps(1)} />
          <Tab label="Alert Settings" {...a11yProps(2)} />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        {activeAlerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <NotificationsOffIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No Active Alerts</Typography>
            <Typography variant="body1" color="text.secondary">
              All is well! There are no active alerts for this campaign.
            </Typography>
          </Box>
        ) : (
          <List>
            {activeAlerts.map((alert) => (
              <Paper 
                key={alert.id} 
                elevation={alert.read ? 1 : 3} 
                sx={{ 
                  mb: 2, 
                  borderLeft: `4px solid ${
                    alert.status === 'critical' ? theme.palette.error.main :
                    alert.status === 'warning' ? theme.palette.warning.main :
                    theme.palette.success.main
                  }`,
                  opacity: alert.read ? 0.8 : 1
                }}
              >
                <ListItem 
                  alignItems="flex-start"
                  secondaryAction={
                    <Box>
                      <IconButton 
                        edge="end" 
                        aria-label="mark-read" 
                        onClick={() => handleMarkAsRead(alert.id)}
                        disabled={alert.read}
                        title="Mark as read"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="action-taken" 
                        onClick={() => handleMarkActionTaken(alert.id)}
                        disabled={alert.actionTaken}
                        title="Mark action taken"
                        color="primary"
                      >
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="dismiss" 
                        onClick={() => handleDismissAlert(alert.id)}
                        title="Dismiss alert"
                        color="error"
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 
                      alert.status === 'critical' ? theme.palette.error.light :
                      alert.status === 'warning' ? theme.palette.warning.light :
                      theme.palette.success.light
                    }}>
                      {getStatusIcon(alert.status)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" component="span" fontWeight={alert.read ? 'normal' : 'bold'}>
                          {alert.type === 'threshold' ? (
                            <>
                              {alert.metricLabel} is {alert.direction === 'above' ? 'above' : 'below'} threshold
                            </>
                          ) : (
                            <>
                              Anomaly detected in {alert.metricLabel}
                            </>
                          )}
                        </Typography>
                        <Chip 
                          label={alert.status.toUpperCase()} 
                          size="small" 
                          color={
                            alert.status === 'critical' ? 'error' :
                            alert.status === 'warning' ? 'warning' :
                            'success'
                          } 
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span" sx={{ display: 'block', mb: 1 }}>
                          {alert.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                          {alert.type === 'threshold' ? (
                            <>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Current:</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {typeof alert.value === 'number' ? 
                                    (alert.metric.includes('rate') ? `${alert.value.toFixed(1)}%` : alert.value.toFixed(2)) : 
                                    alert.value
                                  }
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Threshold:</Typography>
                                <Typography variant="body2">
                                  {typeof alert.threshold === 'number' ? 
                                    (alert.metric.includes('rate') ? `${alert.threshold.toFixed(1)}%` : alert.threshold.toFixed(2)) : 
                                    alert.threshold
                                  }
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {getDirectionIcon(alert.direction)}
                                <Typography variant="caption">
                                  {alert.direction === 'above' ? 'Above threshold' : 'Below threshold'}
                                </Typography>
                              </Box>
                            </>
                          ) : (
                            <>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Current:</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {typeof alert.value === 'number' ? 
                                    (alert.metric.includes('rate') ? `${alert.value.toFixed(1)}%` : alert.value.toLocaleString()) : 
                                    alert.value
                                  }
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Expected:</Typography>
                                <Typography variant="body2">
                                  {typeof alert.expected === 'number' ? 
                                    (alert.metric.includes('rate') ? `${alert.expected.toFixed(1)}%` : alert.expected.toLocaleString()) : 
                                    alert.expected
                                  }
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {alert.deviation > 0 ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />}
                                <Typography variant="caption">
                                  {alert.deviation > 0 ? '+' : ''}{alert.deviation}% {alert.deviation > 0 ? 'increase' : 'decrease'}
                                </Typography>
                              </Box>
                            </>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {new Date(alert.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      </>
                    }
                  />
                </ListItem>
              </Paper>
            ))}
          </List>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {resolvedAlerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="h6" color="text.secondary">No Resolved Alerts</Typography>
            <Typography variant="body1" color="text.secondary">
              There are no resolved alerts for this campaign yet.
            </Typography>
          </Box>
        ) : (
          <List>
            {resolvedAlerts.map((alert) => (
              <Paper 
                key={alert.id} 
                elevation={1} 
                sx={{ 
                  mb: 2, 
                  borderLeft: `4px solid ${theme.palette.success.main}`,
                  opacity: 0.7
                }}
              >
                <ListItem 
                  alignItems="flex-start"
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="dismiss" 
                      onClick={() => handleDismissAlert(alert.id)}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.success.light }}>
                      <CheckCircleIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" component="span">
                          {alert.type === 'threshold' ? (
                            <>
                              {alert.metricLabel} {alert.direction === 'above' ? 'above' : 'below'} threshold
                            </>
                          ) : (
                            <>
                              Anomaly in {alert.metricLabel}
                            </>
                          )}
                        </Typography>
                        <Chip 
                          label="RESOLVED" 
                          size="small" 
                          color="success"
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span" sx={{ display: 'block', mb: 1 }}>
                          {alert.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(alert.timestamp).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              </Paper>
            ))}
          </List>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Metric Thresholds</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Set threshold-based alerts for key campaign metrics
              </Typography>
              
              <List>
                {availableMetrics.map((metric) => {
                  const metricSettings = alertPreferences.metrics[metric.value as keyof typeof alertPreferences.metrics];
                  return (
                    <ListItem 
                      key={metric.value}
                      secondaryAction={
                        <Switch
                          edge="end"
                          checked={metricSettings ? metricSettings.enabled : false}
                          onChange={() => handleMetricToggle(metric.value)}
                        />
                      }
                      sx={{ 
                        opacity: metricSettings && metricSettings.enabled ? 1 : 0.6,
                        mb: 1,
                        backgroundColor: 'background.paper',
                        borderRadius: 1
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.primary.lighter }}>
                          {metric.icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={metric.label}
                        secondary={
                          metricSettings ? (
                            <Box sx={{ mt: 0.5 }}>
                              {metricSettings.direction !== 'anomaly_only' ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                  <Chip 
                                    size="small" 
                                    label={
                                      <>
                                        {metricSettings.direction === 'above' ? 'Above' : 'Below'}{' '}
                                        {metricSettings.criticalThreshold}{metric.value.includes('rate') ? '%' : ''}
                                      </>
                                    } 
                                    color="error" 
                                    variant="outlined"
                                  />
                                  <Chip 
                                    size="small" 
                                    label={
                                      <>
                                        {metricSettings.direction === 'above' ? 'Above' : 'Below'}{' '}
                                        {metricSettings.warningThreshold}{metric.value.includes('rate') ? '%' : ''}
                                      </>
                                    } 
                                    color="warning" 
                                    variant="outlined"
                                  />
                                </Box>
                              ) : (
                                <Typography variant="caption">Anomaly detection only</Typography>
                              )}
                            </Box>
                          ) : 'Not configured'
                        }
                      />
                      <Button 
                        size="small" 
                        sx={{ ml: 2 }}
                        onClick={() => handleOpenMetricDialog(metric.value)}
                        disabled={!metricSettings || !metricSettings.enabled}
                      >
                        Configure
                      </Button>
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Anomaly Detection</Typography>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={alertPreferences.anomalyDetection} 
                        onChange={handleAnomalyDetectionToggle}
                      />
                    }
                    label="Enable automatic anomaly detection"
                  />
                  
                  <Box sx={{ mt: 2, opacity: alertPreferences.anomalyDetection ? 1 : 0.5, pointerEvents: alertPreferences.anomalyDetection ? 'auto' : 'none' }}>
                    <Typography variant="body2" gutterBottom>
                      Alert when metrics deviate more than {alertPreferences.anomalyThreshold}% from expected values
                    </Typography>
                    <Slider
                      value={alertPreferences.anomalyThreshold}
                      onChange={handleAnomalyThresholdChange}
                      aria-labelledby="anomaly-threshold-slider"
                      valueLabelDisplay="auto"
                      step={5}
                      marks
                      min={5}
                      max={50}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">More sensitive (5%)</Typography>
                      <Typography variant="caption" color="text.secondary">Less sensitive (50%)</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Notification Settings</Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <NotificationsIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="In-app Notifications" 
                        secondary="Receive alerts in the application interface"
                      />
                      <Switch
                        edge="end"
                        checked={alertPreferences.notificationChannels.inApp}
                        onChange={() => handleNotificationChannelToggle('inApp')}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <EmailIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="Email Notifications" 
                        secondary={
                          alertPreferences.emailRecipients && alertPreferences.emailRecipients.length > 0 ? 
                          `${alertPreferences.emailRecipients.length} recipients configured` : 
                          "No recipients configured"
                        }
                      />
                      <Box>
                        <Switch
                          checked={alertPreferences.notificationChannels.email}
                          onChange={() => handleNotificationChannelToggle('email')}
                        />
                        <Button 
                          size="small" 
                          onClick={handleOpenEmailDialog}
                          disabled={!alertPreferences.notificationChannels.email}
                        >
                          Configure
                        </Button>
                      </Box>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <PhoneIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="SMS Notifications" 
                        secondary="Receive text message alerts for critical issues"
                      />
                      <Switch
                        edge="end"
                        checked={alertPreferences.notificationChannels.sms}
                        onChange={() => handleNotificationChannelToggle('sms')}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => alert('Alert preferences saved successfully!')}
              >
                Save All Settings
              </Button>
            </Box>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Metric Settings Dialog */}
      <Dialog
        open={openMetricDialog}
        onClose={handleCloseMetricDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Configure {availableMetrics.find(m => m.value === currentMetric)?.label} Alerts
        </DialogTitle>
        <DialogContent dividers>
          {currentMetricSettings && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="alert-direction-label">Alert Direction</InputLabel>
                  <Select
                    labelId="alert-direction-label"
                    id="alert-direction"
                    value={currentMetricSettings.direction}
                    label="Alert Direction"
                    onChange={handleDirectionChange}
                  >
                    <MenuItem value="above">Above Threshold</MenuItem>
                    <MenuItem value="below">Below Threshold</MenuItem>
                    <MenuItem value="anomaly_only">Anomaly Detection Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {currentMetricSettings.direction !== 'anomaly_only' && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Alert Thresholds
                  </Typography>
                  <Box sx={{ px: 1, py: 3 }}>
                    <Slider
                      value={[currentMetricSettings.warningThreshold, currentMetricSettings.criticalThreshold]}
                      onChange={handleThresholdChange}
                      valueLabelDisplay="on"
                      aria-labelledby="threshold-slider"
                      disableSwap
                      marks={[
                        { 
                          value: currentMetricSettings.warningThreshold, 
                          label: 
                            <Tooltip title="Warning Threshold">
                              <Chip 
                                size="small" 
                                label="Warning" 
                                color="warning" 
                              />
                            </Tooltip>
                        },
                        { 
                          value: currentMetricSettings.criticalThreshold, 
                          label: 
                            <Tooltip title="Critical Threshold">
                              <Chip 
                                size="small" 
                                label="Critical" 
                                color="error" 
                              />
                            </Tooltip>
                        }
                      ]}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {currentMetricSettings.direction === 'above' ? (
                      `Alert when metric goes above thresholds`
                    ) : (
                      `Alert when metric falls below thresholds`
                    )}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMetricDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveMetricSettings} 
            variant="contained" 
            color="primary"
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Email Recipients Dialog */}
      <Dialog
        open={openEmailDialog}
        onClose={handleCloseEmailDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Email Notification Recipients</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Add email address"
              value={newEmailRecipient}
              onChange={(e) => setNewEmailRecipient(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddEmailRecipient()}
            />
            <Button 
              variant="contained" 
              onClick={handleAddEmailRecipient}
              disabled={!newEmailRecipient.trim() || emailRecipients.includes(newEmailRecipient.trim())}
              sx={{ ml: 1 }}
            >
              Add
            </Button>
          </Box>
          
          <Paper variant="outlined" sx={{ p: 2 }}>
            {emailRecipients.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {emailRecipients.map((email, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 1,
                      backgroundColor: index % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'transparent',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="body2">{email}</Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleRemoveEmailRecipient(email)}
                      color="error"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
                No recipients added
              </Typography>
            )}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEmailDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveEmailRecipients} 
            variant="contained" 
            color="primary"
          >
            Save Recipients
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* New Alert Dialog */}
      <Dialog
        open={openNewAlertDialog}
        onClose={handleCloseNewAlertDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Custom Alert</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="new-alert-metric-label">Metric</InputLabel>
                <Select
                  labelId="new-alert-metric-label"
                  id="new-alert-metric"
                  value={newAlertMetric}
                  label="Metric"
                  onChange={handleNewAlertMetricChange}
                >
                  {availableMetrics.map(metric => (
                    <MenuItem key={metric.value} value={metric.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {metric.icon}
                        <Typography>{metric.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="new-alert-direction-label">Direction</InputLabel>
                <Select
                  labelId="new-alert-direction-label"
                  id="new-alert-direction"
                  value={newAlertDirection}
                  label="Direction"
                  onChange={handleNewAlertDirectionChange}
                >
                  <MenuItem value="above">Above Threshold</MenuItem>
                  <MenuItem value="below">Below Threshold</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Threshold Value"
                type="number"
                fullWidth
                value={newAlertThreshold}
                onChange={handleNewAlertThresholdChange}
                InputProps={{
                  endAdornment: newAlertMetric.includes('rate') ? '%' : null
                }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Current Value</Typography>
            <Typography variant="h5" color="primary">
              {campaign?.metrics && campaign.metrics[newAlertMetric] !== undefined ? (
                newAlertMetric.includes('rate') ? 
                `${campaign.metrics[newAlertMetric].toFixed(1)}%` : 
                campaign.metrics[newAlertMetric].toLocaleString()
              ) : (
                'N/A'
              )}
            </Typography>
            
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              {newAlertDirection === 'above' ? <TrendingUpIcon /> : <TrendingDownIcon />}
              <Typography variant="body2">
                Alert will trigger when {availableMetrics.find(m => m.value === newAlertMetric)?.label} is {newAlertDirection}{' '}
                {newAlertThreshold}{newAlertMetric.includes('rate') ? '%' : ''}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewAlertDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateNewAlert} 
            variant="contained" 
            color="primary"
          >
            Create Alert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CampaignPerformanceAlerts;