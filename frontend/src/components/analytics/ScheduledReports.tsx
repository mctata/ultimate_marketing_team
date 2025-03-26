import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar,
  Tabs,
  Tab,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Description as DescriptionIcon,
  Schedule as ScheduleIcon,
  MailOutline as MailIcon,
  CalendarToday as CalendarIcon,
  Palette as PaletteIcon,
  PictureAsPdf as PdfIcon,
  TableChart as TableIcon,
  Assignment as AssignmentIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  PresentToAll as PresentToAllIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { useAnalytics } from '../../hooks/useAnalytics';

// Types for reports
interface ReportRecipient {
  email: string;
  name?: string;
}

interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time?: string; // HH:MM format
  timezone?: string;
}

interface Report {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  report_type: string;
  template_id?: string;
  config: {
    date_range: {
      type: 'relative' | 'fixed';
      start: string;
      end: string;
    };
    metrics: string[];
    filters?: Record<string, any>;
    grouping?: string;
    charts?: Array<Record<string, any>>;
    comparisons?: number[];
  };
  schedule_type?: string;
  schedule_config?: ScheduleConfig;
  recipients?: string[];
  last_generated?: string;
  file_path?: string;
  file_type?: string;
  created_at?: string;
  updated_at?: string;
}

interface CreateReportFormData {
  name: string;
  report_type: string;
  description?: string;
  template_id?: string;
  schedule_type?: string;
  schedule_config?: Partial<ScheduleConfig>;
  recipients?: string[];
  date_range: {
    type: 'relative' | 'fixed';
    start: string;
    end: string;
  };
  metrics: string[];
  file_type: string;
}

interface ScheduledReportsProps {
  availableTemplates?: Array<{id: string; name: string; description: string; type: string}>;
  onGenerateReport?: (report: Report) => void;
  onDownloadReport?: (report: Report) => void;
  onShareReport?: (report: Report, recipients: string[]) => void;
}

/**
 * Scheduled Reports Component
 * 
 * Manages scheduled content analytics reports
 */
const ScheduledReports: React.FC<ScheduledReportsProps> = ({
  availableTemplates = [],
  onGenerateReport,
  onDownloadReport,
  onShareReport
}) => {
  const theme = useTheme();
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [generateReportDialogOpen, setGenerateReportDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateReportFormData>({
    name: '',
    report_type: 'content_performance',
    date_range: {
      type: 'relative',
      start: '30d',
      end: 'now'
    },
    metrics: ['views', 'conversions', 'revenue'],
    file_type: 'pdf'
  });
  
  // Mock data
  const reports: Report[] = [
    {
      id: 1,
      name: 'Monthly Content Performance',
      description: 'Detailed analysis of content performance metrics',
      created_by: 1,
      report_type: 'content_performance',
      config: {
        date_range: {
          type: 'relative',
          start: '30d',
          end: 'now'
        },
        metrics: ['views', 'engagement', 'conversions']
      },
      schedule_type: 'scheduled',
      schedule_config: {
        frequency: 'monthly',
        dayOfMonth: 1,
        time: '08:00',
        timezone: 'UTC'
      },
      file_type: 'pdf',
      last_generated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      name: 'Campaign ROI Analysis',
      description: 'ROI and performance metrics for all active campaigns',
      created_by: 1,
      report_type: 'campaign_analytics',
      config: {
        date_range: {
          type: 'relative',
          start: '90d',
          end: 'now'
        },
        metrics: ['spend', 'revenue', 'roi']
      },
      file_type: 'csv'
    }
  ];
  
  const isLoadingReports = false;
  const reportsError = null;
  const isCreatingReport = false;
  const createReportError = null;
  const isGeneratingReport = false;
  const generateReportError = null;
  
  const refetchReports = () => {
    console.log('Refetching reports...');
  };
  
  const createReport = (reportData: any, options?: any) => {
    console.log('Creating report:', reportData);
    if (options?.onSuccess) {
      setTimeout(() => options.onSuccess(), 500);
    }
  };
  
  const generateReport = (params: any, options?: any) => {
    console.log('Generating report:', params);
    if (options?.onSuccess) {
      setTimeout(() => options.onSuccess({ success: true }), 500);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle form field changes
  const handleFormChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };
  
  // Handle create report
  const handleCreateReport = () => {
    // Transform form data to API format
    const reportData = {
      name: formData.name,
      report_type: formData.report_type,
      description: formData.description,
      template_id: formData.template_id,
      schedule_type: formData.schedule_type,
      schedule_config: formData.schedule_config,
      recipients: formData.recipients,
      config: {
        date_range: formData.date_range,
        metrics: formData.metrics,
        filters: {}
      }
    };
    
    createReport(reportData, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        refetchReports();
        
        // Reset form
        setFormData({
          name: '',
          report_type: 'content_performance',
          date_range: {
            type: 'relative',
            start: '30d',
            end: 'now'
          },
          metrics: ['views', 'conversions', 'revenue'],
          file_type: 'pdf'
        });
      }
    });
  };
  
  // Handle delete report
  const handleDeleteReport = () => {
    // In a real app, this would call an API to delete the report
    if (selectedReport) {
      console.log(`Deleting report: ${selectedReport.id}`);
      // After successful deletion:
      setDeleteDialogOpen(false);
      setSelectedReport(null);
      refetchReports();
    }
  };
  
  // Handle generate report
  const handleGenerateReportNow = () => {
    if (selectedReport) {
      generateReport({
        reportId: selectedReport.id,
        fileType: formData.file_type
      }, {
        onSuccess: (result: { success: boolean }) => {
          setGenerateReportDialogOpen(false);
          
          if (onGenerateReport && selectedReport) {
            onGenerateReport(selectedReport);
          }
          
          refetchReports();
        }
      });
    }
  };
  
  // Handle download report
  const handleDownloadReport = (report: Report) => {
    if (onDownloadReport) {
      onDownloadReport(report);
    } else {
      console.log(`Downloading report: ${report.id}`);
      // Mock download logic
      const a = document.createElement('a');
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  
  // Filter reports based on tab
  const filteredReports = reports.filter((report: Report) => {
    if (tabValue === 0) return true; // All reports
    if (tabValue === 1) return report.schedule_type && report.schedule_type !== 'none'; // Scheduled
    if (tabValue === 2) return !report.schedule_type || report.schedule_type === 'none'; // On-demand
    return true;
  });
  
  // Get file type icon
  const getFileTypeIcon = (fileType?: string) => {
    switch (fileType) {
      case 'pdf':
        return <PdfIcon />;
      case 'csv':
        return <TableIcon />;
      case 'pptx':
        return <PresentToAllIcon />;
      default:
        return <DescriptionIcon />;
    }
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Get schedule description
  const getScheduleDescription = (report: Report) => {
    if (!report.schedule_type || report.schedule_type === 'none') {
      return 'On-demand';
    }
    
    const config = report.schedule_config;
    if (!config) return report.schedule_type;
    
    switch (config.frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Weekly on ${days[config.dayOfWeek || 0]}`;
      case 'monthly':
        return `Monthly on day ${config.dayOfMonth || 1}`;
      default:
        return report.schedule_type;
    }
  };
  
  return (
    <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Analytics Reports"
        subheader="Schedule and manage automated reports"
        action={
          <Box sx={{ display: 'flex' }}>
            <Tooltip title="Refresh reports">
              <IconButton onClick={() => refetchReports()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              size="small"
              sx={{ ml: 1 }}
            >
              Create Report
            </Button>
          </Box>
        }
      />
      
      <Divider />
      
      <Box sx={{ px: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="All Reports" />
          <Tab label="Scheduled" />
          <Tab label="On-demand" />
        </Tabs>
      </Box>
      
      <CardContent sx={{ flexGrow: 1, pt: 1 }}>
        {/* Loading state */}
        {isLoadingReports && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {/* Error state */}
        {reportsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(reportsError as Error).message || 'Failed to load reports'}
          </Alert>
        )}
        
        {/* Empty state */}
        {!isLoadingReports && filteredReports.length === 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            py: 4 
          }}>
            <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Reports Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              Create your first report to start automating your analytics workflow.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setCreateDialogOpen(true)}
              startIcon={<AddIcon />}
            >
              Create Report
            </Button>
          </Box>
        )}
        
        {/* Reports list */}
        {!isLoadingReports && filteredReports.length > 0 && (
          <List sx={{ pt: 0 }}>
            {filteredReports.map(report => (
              <Paper
                key={report.id}
                variant="outlined"
                sx={{ mb: 2, overflow: 'hidden' }}
              >
                <ListItem
                  sx={{
                    px: 2,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      {getFileTypeIcon(report.file_type)}
                    </Avatar>
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" component="div">
                        {report.name}
                        {report.schedule_type && report.schedule_type !== 'none' && (
                          <Chip
                            label={getScheduleDescription(report)}
                            size="small"
                            icon={<ScheduleIcon fontSize="small" />}
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {report.description || `${report.report_type} report`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Last generated: {formatDate(report.last_generated)}
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="download"
                      onClick={() => handleDownloadReport(report)}
                      disabled={!report.file_path}
                      title="Download report"
                    >
                      <FileDownloadIcon />
                    </IconButton>
                    
                    <IconButton
                      edge="end"
                      aria-label="generate"
                      onClick={() => {
                        setSelectedReport(report);
                        setGenerateReportDialogOpen(true);
                      }}
                      title="Generate report now"
                      sx={{ ml: 1 }}
                    >
                      <RefreshIcon />
                    </IconButton>
                    
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => {
                        setSelectedReport(report);
                        setDeleteDialogOpen(true);
                      }}
                      title="Delete report"
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </Paper>
            ))}
          </List>
        )}
      </CardContent>
      
      {/* Create Report Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                label="Report Name"
                fullWidth
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={formData.report_type}
                  label="Report Type"
                  onChange={(e) => handleFormChange('report_type', e.target.value)}
                >
                  <MenuItem value="content_performance">Content Performance</MenuItem>
                  <MenuItem value="campaign_analytics">Campaign Analytics</MenuItem>
                  <MenuItem value="conversion_funnel">Conversion Funnel</MenuItem>
                  <MenuItem value="audience_insights">Audience Insights</MenuItem>
                  <MenuItem value="executive_summary">Executive Summary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select
                  value={formData.template_id || ''}
                  label="Template"
                  onChange={(e) => handleFormChange('template_id', e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {availableTemplates.map(template => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={formData.description || ''}
                onChange={(e) => handleFormChange('description', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Time Range
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Date Range Type</InputLabel>
                <Select
                  value={formData.date_range.type}
                  label="Date Range Type"
                  onChange={(e) => handleFormChange('date_range', {
                    ...formData.date_range,
                    type: e.target.value
                  })}
                >
                  <MenuItem value="relative">Relative</MenuItem>
                  <MenuItem value="fixed">Fixed</MenuItem>
                </Select>
              </FormControl>
              
              {formData.date_range.type === 'relative' ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Start Date</InputLabel>
                      <Select
                        value={formData.date_range.start}
                        label="Start Date"
                        onChange={(e) => handleFormChange('date_range', {
                          ...formData.date_range,
                          start: e.target.value
                        })}
                      >
                        <MenuItem value="7d">Last 7 days</MenuItem>
                        <MenuItem value="30d">Last 30 days</MenuItem>
                        <MenuItem value="90d">Last 90 days</MenuItem>
                        <MenuItem value="month_start">Start of month</MenuItem>
                        <MenuItem value="year_start">Start of year</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>End Date</InputLabel>
                      <Select
                        value={formData.date_range.end}
                        label="End Date"
                        onChange={(e) => handleFormChange('date_range', {
                          ...formData.date_range,
                          end: e.target.value
                        })}
                      >
                        <MenuItem value="now">Current Date</MenuItem>
                        <MenuItem value="yesterday">Yesterday</MenuItem>
                        <MenuItem value="week_end">End of Week</MenuItem>
                        <MenuItem value="month_end">End of Month</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Start Date"
                      type="date"
                      fullWidth
                      value={formData.date_range.start}
                      onChange={(e) => handleFormChange('date_range', {
                        ...formData.date_range,
                        start: e.target.value
                      })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="End Date"
                      type="date"
                      fullWidth
                      value={formData.date_range.end}
                      onChange={(e) => handleFormChange('date_range', {
                        ...formData.date_range,
                        end: e.target.value
                      })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Schedule Type</InputLabel>
                <Select
                  value={formData.schedule_type || 'none'}
                  label="Schedule Type"
                  onChange={(e) => handleFormChange('schedule_type', e.target.value)}
                >
                  <MenuItem value="none">On-demand</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>File Format</InputLabel>
                <Select
                  value={formData.file_type}
                  label="File Format"
                  onChange={(e) => handleFormChange('file_type', e.target.value)}
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="pptx">PowerPoint</MenuItem>
                  <MenuItem value="html">HTML</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {formData.schedule_type === 'scheduled' && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Scheduling Options
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Frequency</InputLabel>
                        <Select
                          value={formData.schedule_config?.frequency || 'daily'}
                          label="Frequency"
                          onChange={(e) => handleFormChange('schedule_config', {
                            ...formData.schedule_config,
                            frequency: e.target.value
                          })}
                        >
                          <MenuItem value="daily">Daily</MenuItem>
                          <MenuItem value="weekly">Weekly</MenuItem>
                          <MenuItem value="monthly">Monthly</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {formData.schedule_config?.frequency === 'weekly' && (
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Day of Week</InputLabel>
                          <Select
                            value={formData.schedule_config?.dayOfWeek?.toString() || '1'}
                            label="Day of Week"
                            onChange={(e) => handleFormChange('schedule_config', {
                              ...formData.schedule_config,
                              dayOfWeek: parseInt(e.target.value)
                            })}
                          >
                            <MenuItem value="0">Sunday</MenuItem>
                            <MenuItem value="1">Monday</MenuItem>
                            <MenuItem value="2">Tuesday</MenuItem>
                            <MenuItem value="3">Wednesday</MenuItem>
                            <MenuItem value="4">Thursday</MenuItem>
                            <MenuItem value="5">Friday</MenuItem>
                            <MenuItem value="6">Saturday</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                    
                    {formData.schedule_config?.frequency === 'monthly' && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Day of Month"
                          type="number"
                          fullWidth
                          value={formData.schedule_config?.dayOfMonth || 1}
                          onChange={(e) => handleFormChange('schedule_config', {
                            ...formData.schedule_config,
                            dayOfMonth: parseInt(e.target.value)
                          })}
                          InputProps={{ inputProps: { min: 1, max: 31 } }}
                        />
                      </Grid>
                    )}
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Time"
                        type="time"
                        fullWidth
                        value={formData.schedule_config?.time || '08:00'}
                        onChange={(e) => handleFormChange('schedule_config', {
                          ...formData.schedule_config,
                          time: e.target.value
                        })}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Recipients
              </Typography>
              <TextField
                fullWidth
                label="Email Addresses (comma separated)"
                placeholder="example@email.com, user@company.com"
                value={formData.recipients?.join(', ') || ''}
                onChange={(e) => handleFormChange(
                  'recipients',
                  e.target.value.split(',').map(email => email.trim()).filter(email => email)
                )}
                helperText="Leave empty to generate reports without sending emails"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateReport}
            disabled={!formData.name || isCreatingReport}
          >
            {isCreatingReport ? <CircularProgress size={24} /> : 'Create Report'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Report</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the report "{selectedReport?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteReport}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Generate report dialog */}
      <Dialog
        open={generateReportDialogOpen}
        onClose={() => setGenerateReportDialogOpen(false)}
      >
        <DialogTitle>Generate Report Now</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Generate "{selectedReport?.name}" report immediately?
          </Typography>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>File Format</InputLabel>
            <Select
              value={formData.file_type}
              label="File Format"
              onChange={(e) => handleFormChange('file_type', e.target.value)}
            >
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="pptx">PowerPoint</MenuItem>
              <MenuItem value="html">HTML</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateReportDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleGenerateReportNow}
            disabled={isGeneratingReport}
            startIcon={isGeneratingReport ? <CircularProgress size={18} /> : <RefreshIcon />}
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ScheduledReports;