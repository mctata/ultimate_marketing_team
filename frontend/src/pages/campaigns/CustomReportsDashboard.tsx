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
  Menu, 
  MenuItem, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  SelectChangeEvent, 
  Chip, 
  Divider, 
  CircularProgress, 
  Tab, 
  Tabs,
  ListItemIcon,
  ListItemText,
  Checkbox
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BarChartIcon from '@mui/icons-material/BarChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import TuneIcon from '@mui/icons-material/Tune';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import SendIcon from '@mui/icons-material/Send';

// Mock data for saved reports
const savedReportsMock = [
  {
    id: '1',
    name: 'Monthly Campaign Performance',
    description: 'Overview of all campaign metrics for the current month',
    created: '2023-06-01',
    lastRun: '2023-06-15',
    metrics: ['impressions', 'clicks', 'conversions', 'revenue', 'roas'],
    filters: [{ name: 'timeframe', value: 'month' }],
    scheduleEnabled: true,
    scheduleFrequency: 'monthly',
    recipients: ['marketing-team@example.com', 'executives@example.com'],
    type: 'dashboard'
  },
  {
    id: '2',
    name: 'Ad Creative Performance',
    description: 'Analysis of ad creative performance by format and platform',
    created: '2023-05-12',
    lastRun: '2023-06-14',
    metrics: ['ctr', 'engagement_rate', 'conversion_rate', 'cost_per_acquisition'],
    filters: [{ name: 'ad_format', value: 'all' }, { name: 'platform', value: 'all' }],
    scheduleEnabled: false,
    type: 'table'
  },
  {
    id: '3',
    name: 'Audience Segment Analysis',
    description: 'Detailed breakdown of performance by audience segment',
    created: '2023-04-22',
    lastRun: '2023-06-10',
    metrics: ['reach', 'frequency', 'ctr', 'conversion_rate', 'revenue_per_user'],
    filters: [{ name: 'segments', value: 'all' }, { name: 'timeframe', value: 'quarter' }],
    scheduleEnabled: true,
    scheduleFrequency: 'weekly',
    recipients: ['audience-team@example.com'],
    type: 'dashboard'
  },
  {
    id: '4',
    name: 'ROI Tracking Report',
    description: 'Financial performance tracking including costs, revenue, and ROI',
    created: '2023-05-15',
    lastRun: '2023-06-12',
    metrics: ['spend', 'revenue', 'roi', 'profit_margin', 'cpa', 'ltv'],
    filters: [{ name: 'campaign_type', value: 'conversion' }, { name: 'timeframe', value: 'quarter' }],
    scheduleEnabled: true,
    scheduleFrequency: 'monthly',
    recipients: ['finance@example.com', 'marketing-leads@example.com'],
    type: 'chart'
  }
];

// Available metrics for reports
const availableMetrics = [
  { value: 'impressions', label: 'Impressions', category: 'reach' },
  { value: 'clicks', label: 'Clicks', category: 'reach' },
  { value: 'ctr', label: 'Click-Through Rate', category: 'reach' },
  { value: 'conversions', label: 'Conversions', category: 'conversion' },
  { value: 'conversion_rate', label: 'Conversion Rate', category: 'conversion' },
  { value: 'cost_per_acquisition', label: 'Cost Per Acquisition', category: 'conversion' },
  { value: 'revenue', label: 'Revenue', category: 'revenue' },
  { value: 'roas', label: 'Return on Ad Spend', category: 'revenue' },
  { value: 'roi', label: 'Return on Investment', category: 'revenue' },
  { value: 'engagement_rate', label: 'Engagement Rate', category: 'engagement' },
  { value: 'frequency', label: 'Frequency', category: 'reach' },
  { value: 'reach', label: 'Reach', category: 'reach' },
  { value: 'spend', label: 'Spend', category: 'revenue' },
  { value: 'profit_margin', label: 'Profit Margin', category: 'revenue' },
  { value: 'cpa', label: 'Cost Per Action', category: 'conversion' },
  { value: 'ltv', label: 'Lifetime Value', category: 'revenue' },
  { value: 'revenue_per_user', label: 'Revenue Per User', category: 'revenue' }
];

// Available time filters
const timeframeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'month', label: 'This Month' },
  { value: 'lastmonth', label: 'Last Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'lastquarter', label: 'Last Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'lastyear', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' }
];

// Schedule frequency options
const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' }
];

// Report type options
const reportTypeOptions = [
  { value: 'dashboard', label: 'Dashboard', icon: <BarChartIcon /> },
  { value: 'chart', label: 'Chart', icon: <PieChartIcon /> },
  { value: 'table', label: 'Table', icon: <TableChartIcon /> }
];

// Export format options
const exportFormatOptions = [
  { value: 'pdf', label: 'PDF', icon: <DescriptionIcon /> },
  { value: 'excel', label: 'Excel', icon: <TableChartIcon /> },
  { value: 'csv', label: 'CSV', icon: <FormatListBulletedIcon /> }
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
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
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
    id: `reports-tab-${index}`,
    'aria-controls': `reports-tabpanel-${index}`,
  };
}

const CustomReportsDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [savedReports, setSavedReports] = useState(savedReportsMock);
  const [loading, setLoading] = useState(false);
  
  // Create/Edit report dialog
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>({
    name: '',
    description: '',
    metrics: [],
    filters: [{ name: 'timeframe', value: 'month' }],
    scheduleEnabled: false,
    scheduleFrequency: 'monthly',
    recipients: [],
    type: 'dashboard'
  });
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  
  // Export dialog
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  
  // Schedule dialog
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState('monthly');
  const [scheduleRecipients, setScheduleRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  
  // Delete confirmation dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  // Metric selection dialog
  const [openMetricDialog, setOpenMetricDialog] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [metricSearchTerm, setMetricSearchTerm] = useState('');
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, reportId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedReportId(reportId);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReportId(null);
  };
  
  // Report dialog handlers
  const handleOpenCreateDialog = () => {
    setIsEditMode(false);
    setCurrentReport({
      name: '',
      description: '',
      metrics: [],
      filters: [{ name: 'timeframe', value: 'month' }],
      scheduleEnabled: false,
      scheduleFrequency: 'monthly',
      recipients: [],
      type: 'dashboard'
    });
    setOpenReportDialog(true);
  };
  
  const handleOpenEditDialog = (reportId: string) => {
    handleMenuClose();
    setIsEditMode(true);
    const reportToEdit = savedReports.find(report => report.id === reportId);
    if (reportToEdit) {
      setCurrentReport(reportToEdit);
      setSelectedMetrics(reportToEdit.metrics);
    }
    setOpenReportDialog(true);
  };
  
  const handleCloseReportDialog = () => {
    setOpenReportDialog(false);
  };
  
  const handleSaveReport = () => {
    setLoading(true);
    
    setTimeout(() => {
      if (isEditMode) {
        // Update existing report
        setSavedReports(savedReports.map(report => 
          report.id === currentReport.id ? {...currentReport, lastRun: new Date().toISOString().split('T')[0]} : report
        ));
      } else {
        // Create new report
        const newReport = {
          ...currentReport,
          id: Math.random().toString(36).substring(2, 9),
          created: new Date().toISOString().split('T')[0],
          lastRun: new Date().toISOString().split('T')[0]
        };
        setSavedReports([newReport, ...savedReports]);
      }
      
      setLoading(false);
      setOpenReportDialog(false);
    }, 800);
  };
  
  // Report field change handlers
  const handleReportNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentReport({...currentReport, name: event.target.value});
  };
  
  const handleReportDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentReport({...currentReport, description: event.target.value});
  };
  
  const handleReportTypeChange = (event: SelectChangeEvent) => {
    setCurrentReport({...currentReport, type: event.target.value});
  };
  
  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setCurrentReport({
      ...currentReport, 
      filters: currentReport.filters.map((filter: any) => 
        filter.name === 'timeframe' ? {...filter, value: event.target.value} : filter
      )
    });
  };
  
  // Export dialog handlers
  const handleOpenExportDialog = (reportId: string) => {
    handleMenuClose();
    setSelectedReportId(reportId);
    setOpenExportDialog(true);
  };
  
  const handleCloseExportDialog = () => {
    setOpenExportDialog(false);
    setSelectedReportId(null);
  };
  
  const handleExportFormatChange = (event: SelectChangeEvent) => {
    setExportFormat(event.target.value);
  };
  
  const handleExportReport = () => {
    console.log(`Exporting report ${selectedReportId} in ${exportFormat} format`);
    handleCloseExportDialog();
    // In a real application, this would trigger a download
    alert(`Report would be exported as ${exportFormat.toUpperCase()}`);
  };
  
  // Schedule dialog handlers
  const handleOpenScheduleDialog = (reportId: string) => {
    handleMenuClose();
    const report = savedReports.find(r => r.id === reportId);
    if (report) {
      setScheduleFrequency(report.scheduleFrequency || 'monthly');
      setScheduleRecipients(report.recipients || []);
      setSelectedReportId(reportId);
      setOpenScheduleDialog(true);
    }
  };
  
  const handleCloseScheduleDialog = () => {
    setOpenScheduleDialog(false);
    setSelectedReportId(null);
  };
  
  const handleScheduleFrequencyChange = (event: SelectChangeEvent) => {
    setScheduleFrequency(event.target.value);
  };
  
  const handleAddRecipient = () => {
    if (newRecipient.trim() && !scheduleRecipients.includes(newRecipient.trim())) {
      setScheduleRecipients([...scheduleRecipients, newRecipient.trim()]);
      setNewRecipient('');
    }
  };
  
  const handleRemoveRecipient = (index: number) => {
    const updatedRecipients = [...scheduleRecipients];
    updatedRecipients.splice(index, 1);
    setScheduleRecipients(updatedRecipients);
  };
  
  const handleSaveSchedule = () => {
    setSavedReports(savedReports.map(report => 
      report.id === selectedReportId 
        ? {
            ...report, 
            scheduleEnabled: true, 
            scheduleFrequency, 
            recipients: scheduleRecipients
          } 
        : report
    ));
    handleCloseScheduleDialog();
  };
  
  // Delete dialog handlers
  const handleOpenDeleteDialog = (reportId: string) => {
    handleMenuClose();
    setSelectedReportId(reportId);
    setOpenDeleteDialog(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedReportId(null);
  };
  
  const handleDeleteReport = () => {
    setSavedReports(savedReports.filter(report => report.id !== selectedReportId));
    handleCloseDeleteDialog();
  };
  
  // Metric selection handlers
  const handleOpenMetricDialog = () => {
    setSelectedMetrics(currentReport.metrics);
    setOpenMetricDialog(true);
  };
  
  const handleCloseMetricDialog = () => {
    setOpenMetricDialog(false);
  };
  
  const handleSaveMetrics = () => {
    setCurrentReport({...currentReport, metrics: selectedMetrics});
    setOpenMetricDialog(false);
  };
  
  const handleToggleMetric = (metricValue: string) => {
    if (selectedMetrics.includes(metricValue)) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metricValue));
    } else {
      setSelectedMetrics([...selectedMetrics, metricValue]);
    }
  };
  
  // Get the current timeframe filter value
  const getCurrentTimeframe = () => {
    const timeframeFilter = currentReport.filters.find((filter: any) => filter.name === 'timeframe');
    return timeframeFilter ? timeframeFilter.value : 'month';
  };
  
  // Filter metrics by search term
  const filteredMetrics = availableMetrics.filter(metric => 
    metric.label.toLowerCase().includes(metricSearchTerm.toLowerCase()) ||
    metric.category.toLowerCase().includes(metricSearchTerm.toLowerCase())
  );
  
  // Get report type icon
  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'dashboard':
        return <BarChartIcon />;
      case 'chart':
        return <PieChartIcon />;
      case 'table':
        return <TableChartIcon />;
      default:
        return <BarChartIcon />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Custom Reports
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs">
          <Tab label="My Reports" {...a11yProps(0)} />
          <Tab label="Scheduled Reports" {...a11yProps(1)} />
          <Tab label="Report Templates" {...a11yProps(2)} />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Create New Report
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {savedReports.map(report => (
            <Grid item xs={12} md={6} lg={4} key={report.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getReportTypeIcon(report.type)}
                      <Typography variant="h6" component="div">
                        {report.name}
                      </Typography>
                    </Box>
                    <IconButton 
                      aria-label="report options" 
                      onClick={(e) => handleMenuOpen(e, report.id)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {report.description}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Key Metrics:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {report.metrics.slice(0, 3).map((metric: string, index: number) => (
                        <Chip 
                          key={index} 
                          label={availableMetrics.find(m => m.value === metric)?.label || metric} 
                          size="small" 
                          variant="outlined" 
                        />
                      ))}
                      {report.metrics.length > 3 && (
                        <Chip 
                          label={`+${report.metrics.length - 3} more`} 
                          size="small" 
                          variant="outlined" 
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Last Run: {new Date(report.lastRun).toLocaleDateString()}
                    </Typography>
                    {report.scheduleEnabled && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ScheduleIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {report.scheduleFrequency.charAt(0).toUpperCase() + report.scheduleFrequency.slice(1)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<BarChartIcon />}
                    onClick={() => alert(`Viewing report: ${report.name}`)}
                  >
                    View
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<FileDownloadIcon />}
                    onClick={() => handleOpenExportDialog(report.id)}
                  >
                    Export
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {savedReports.filter(report => report.scheduleEnabled).map(report => (
            <Grid item xs={12} md={6} key={report.id}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon color="primary" />
                    <Typography variant="h6">{report.name}</Typography>
                  </Box>
                  <IconButton 
                    aria-label="report options" 
                    onClick={(e) => handleMenuOpen(e, report.id)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {report.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight="bold">Frequency</Typography>
                    <Typography variant="body2">
                      {report.scheduleFrequency.charAt(0).toUpperCase() + report.scheduleFrequency.slice(1)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight="bold">Next Run</Typography>
                    <Typography variant="body2">
                      {/* This would be calculated from the schedule in a real app */}
                      {new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold">Recipients</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {report.recipients && report.recipients.map((recipient: string, index: number) => (
                      <Chip 
                        key={index} 
                        label={recipient} 
                        size="small" 
                      />
                    ))}
                  </Box>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button 
                    size="small" 
                    startIcon={<TuneIcon />}
                    onClick={() => handleOpenScheduleDialog(report.id)}
                  >
                    Manage Schedule
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<SendIcon />}
                    onClick={() => alert(`Report sent manually: ${report.name}`)}
                  >
                    Send Now
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
          
          {savedReports.filter(report => report.scheduleEnabled).length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Scheduled Reports
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  You don't have any scheduled reports yet. You can schedule a report from the My Reports tab.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, borderLeft: '4px solid #4caf50' }}>
              <Typography variant="h6" gutterBottom>Campaign Performance</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Standard campaign performance metrics with conversion tracking and ROI analysis.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                size="small"
                onClick={() => alert("Template 'Campaign Performance' applied")}
              >
                Use Template
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, borderLeft: '4px solid #2196f3' }}>
              <Typography variant="h6" gutterBottom>Content Engagement</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Content-focused metrics including engagement rate, time on page, and social shares.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                size="small"
                onClick={() => alert("Template 'Content Engagement' applied")}
              >
                Use Template
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, borderLeft: '4px solid #f44336' }}>
              <Typography variant="h6" gutterBottom>Executive Summary</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                High-level overview with key business metrics designed for executive stakeholders.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                size="small"
                onClick={() => alert("Template 'Executive Summary' applied")}
              >
                Use Template
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, borderLeft: '4px solid #ff9800' }}>
              <Typography variant="h6" gutterBottom>Social Media Dashboard</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Cross-platform social media metrics with audience growth and engagement tracking.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                size="small"
                onClick={() => alert("Template 'Social Media Dashboard' applied")}
              >
                Use Template
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, borderLeft: '4px solid #9c27b0' }}>
              <Typography variant="h6" gutterBottom>Conversion Funnel</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Detailed funnel analysis showing progression from awareness to conversion.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                size="small"
                onClick={() => alert("Template 'Conversion Funnel' applied")}
              >
                Use Template
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, borderLeft: '4px solid #607d8b' }}>
              <Typography variant="h6" gutterBottom>Campaign ROI</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Financial focus with cost analysis, revenue tracking, and ROI calculations.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                size="small"
                onClick={() => alert("Template 'Campaign ROI' applied")}
              >
                Use Template
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedReportId && handleOpenEditDialog(selectedReportId)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedReportId && handleOpenExportDialog(selectedReportId)}>
          <ListItemIcon>
            <FileDownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedReportId && handleOpenScheduleDialog(selectedReportId)}>
          <ListItemIcon>
            <ScheduleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Schedule</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedReportId && alert(`Duplicating report: ${selectedReportId}`)}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedReportId && handleOpenDeleteDialog(selectedReportId)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Create/Edit Report Dialog */}
      <Dialog 
        open={openReportDialog} 
        onClose={handleCloseReportDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{isEditMode ? 'Edit Report' : 'Create New Report'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Report Name"
                fullWidth
                required
                value={currentReport.name}
                onChange={handleReportNameChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={currentReport.description}
                onChange={handleReportDescriptionChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="report-type-label">Report Type</InputLabel>
                <Select
                  labelId="report-type-label"
                  id="report-type"
                  value={currentReport.type}
                  label="Report Type"
                  onChange={handleReportTypeChange}
                >
                  {reportTypeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.icon}
                        <Typography>{option.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="timeframe-label">Time Period</InputLabel>
                <Select
                  labelId="timeframe-label"
                  id="timeframe"
                  value={getCurrentTimeframe()}
                  label="Time Period"
                  onChange={handleTimeframeChange}
                >
                  {timeframeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">Selected Metrics</Typography>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={handleOpenMetricDialog}
                  >
                    {currentReport.metrics.length > 0 ? 'Edit Metrics' : 'Add Metrics'}
                  </Button>
                </Box>
                
                {currentReport.metrics.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {currentReport.metrics.map((metric: string, index: number) => (
                      <Chip 
                        key={index} 
                        label={availableMetrics.find(m => m.value === metric)?.label || metric} 
                        size="small" 
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No metrics selected. Click 'Add Metrics' to choose metrics for this report.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReportDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveReport} 
            variant="contained" 
            color="primary"
            disabled={!currentReport.name || currentReport.metrics.length === 0 || loading}
          >
            {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Update Report' : 'Create Report')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Export Dialog */}
      <Dialog 
        open={openExportDialog} 
        onClose={handleCloseExportDialog}
      >
        <DialogTitle>Export Report</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth>
            <InputLabel id="export-format-label">Export Format</InputLabel>
            <Select
              labelId="export-format-label"
              id="export-format"
              value={exportFormat}
              label="Export Format"
              onChange={handleExportFormatChange}
            >
              {exportFormatOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {option.icon}
                    <Typography>{option.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExportDialog}>Cancel</Button>
          <Button 
            onClick={handleExportReport} 
            variant="contained" 
            color="primary"
            startIcon={<FileDownloadIcon />}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Schedule Dialog */}
      <Dialog 
        open={openScheduleDialog} 
        onClose={handleCloseScheduleDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Schedule Report</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="schedule-frequency-label">Frequency</InputLabel>
                <Select
                  labelId="schedule-frequency-label"
                  id="schedule-frequency"
                  value={scheduleFrequency}
                  label="Frequency"
                  onChange={handleScheduleFrequencyChange}
                >
                  {frequencyOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Recipients</Typography>
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add email address"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
                />
                <Button 
                  variant="contained" 
                  onClick={handleAddRecipient}
                  disabled={!newRecipient.trim() || scheduleRecipients.includes(newRecipient.trim())}
                  sx={{ ml: 1 }}
                >
                  Add
                </Button>
              </Box>
              
              <Paper variant="outlined" sx={{ p: 2 }}>
                {scheduleRecipients.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {scheduleRecipients.map((recipient, index) => (
                      <Chip 
                        key={index} 
                        label={recipient} 
                        onDelete={() => handleRemoveRecipient(index)} 
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
                    No recipients added
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseScheduleDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveSchedule} 
            variant="contained" 
            color="primary"
            disabled={scheduleRecipients.length === 0}
          >
            Save Schedule
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Delete Report</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this report? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button 
            onClick={handleDeleteReport} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Metric Selection Dialog */}
      <Dialog
        open={openMetricDialog}
        onClose={handleCloseMetricDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Select Metrics</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            placeholder="Search metrics..."
            value={metricSearchTerm}
            onChange={(e) => setMetricSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <Typography variant="subtitle2" gutterBottom>Reach & Awareness</Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {filteredMetrics.filter(m => m.category === 'reach').map(metric => (
              <Grid item xs={6} sm={4} key={metric.value}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={selectedMetrics.includes(metric.value)} 
                      onChange={() => handleToggleMetric(metric.value)}
                    />
                  }
                  label={metric.label}
                />
              </Grid>
            ))}
          </Grid>
          
          <Typography variant="subtitle2" gutterBottom>Engagement</Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {filteredMetrics.filter(m => m.category === 'engagement').map(metric => (
              <Grid item xs={6} sm={4} key={metric.value}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={selectedMetrics.includes(metric.value)} 
                      onChange={() => handleToggleMetric(metric.value)}
                    />
                  }
                  label={metric.label}
                />
              </Grid>
            ))}
          </Grid>
          
          <Typography variant="subtitle2" gutterBottom>Conversion</Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {filteredMetrics.filter(m => m.category === 'conversion').map(metric => (
              <Grid item xs={6} sm={4} key={metric.value}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={selectedMetrics.includes(metric.value)} 
                      onChange={() => handleToggleMetric(metric.value)}
                    />
                  }
                  label={metric.label}
                />
              </Grid>
            ))}
          </Grid>
          
          <Typography variant="subtitle2" gutterBottom>Revenue & ROI</Typography>
          <Grid container spacing={1}>
            {filteredMetrics.filter(m => m.category === 'revenue').map(metric => (
              <Grid item xs={6} sm={4} key={metric.value}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={selectedMetrics.includes(metric.value)} 
                      onChange={() => handleToggleMetric(metric.value)}
                    />
                  }
                  label={metric.label}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMetricDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveMetrics} 
            variant="contained" 
            color="primary"
            disabled={selectedMetrics.length === 0}
          >
            Apply ({selectedMetrics.length} selected)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomReportsDashboard;