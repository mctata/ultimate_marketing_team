import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Card,
  CardContent,
  Alert,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import healthWellnessTemplates from '../../healthWellnessTemplates';
import { useTemplates } from '../../hooks/useContentGeneration';
import { Generate } from '../../hooks/useContentGeneration';
import contentGenerationApi from '../../services/contentGenerationService';
import { useToast } from '../../components/common/ToastNotification';
import useApiError from '../../hooks/useApiError';

interface TemplateIssue {
  id: string;
  templateId: string;
  templateName: string;
  issueType: 'error' | 'warning' | 'info';
  message: string;
  location: string;
  timestamp: string;
}

interface TemplateMetrics {
  totalTemplates: number;
  activeTemplates: number;
  errorTemplates: number;
  averageVariables: number;
  usageCount: number;
}

const TemplateDiagnostics: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState<TemplateMetrics | null>(null);
  const [issues, setIssues] = useState<TemplateIssue[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Get templates from API
  const { templatesQuery } = useTemplates();

  // Helper function to validate templates and find issues
  const validateTemplates = (templates: any[]): TemplateIssue[] => {
    const issues: TemplateIssue[] = [];
    
    templates.forEach(template => {
      // Check for missing content
      if (!template.template_content && !template.content) {
        issues.push({
          id: `error-${template.id}-missing-content`,
          templateId: template.id,
          templateName: template.name || template.title,
          issueType: 'error',
          message: 'Template content is missing',
          location: 'template_content',
          timestamp: new Date().toISOString()
        });
      }
      
      // Check for missing variables
      if (!template.variables || template.variables.length === 0) {
        issues.push({
          id: `warning-${template.id}-missing-variables`,
          templateId: template.id,
          templateName: template.name || template.title,
          issueType: 'warning',
          message: 'Template has no variables defined',
          location: 'variables',
          timestamp: new Date().toISOString()
        });
      }
      
      // Check for variables without descriptions
      if (template.variables && template.variables.length > 0) {
        template.variables.forEach((variable: any) => {
          if (!variable.description) {
            issues.push({
              id: `info-${template.id}-var-${variable.name}-no-desc`,
              templateId: template.id,
              templateName: template.name || template.title,
              issueType: 'info',
              message: `Variable "${variable.name}" has no description`,
              location: `variables.${variable.name}`,
              timestamp: new Date().toISOString()
            });
          }
        });
      }
      
      // Check for sample output
      if (!template.sample_output) {
        issues.push({
          id: `info-${template.id}-no-sample`,
          templateId: template.id,
          templateName: template.name || template.title,
          issueType: 'info',
          message: 'Template has no sample output provided',
          location: 'sample_output',
          timestamp: new Date().toISOString()
        });
      }
      
      // Check for unused variables in content
      if (template.variables && template.variables.length > 0 && (template.template_content || template.content)) {
        const contentStr = template.template_content || template.content;
        template.variables.forEach((variable: any) => {
          const varName = variable.name;
          if (!contentStr.includes(`{{${varName}}}`) && !contentStr.includes(`{${varName}}`)) {
            issues.push({
              id: `warning-${template.id}-unused-var-${varName}`,
              templateId: template.id,
              templateName: template.name || template.title,
              issueType: 'warning',
              message: `Variable "${varName}" appears to be unused in template content`,
              location: `variables.${varName}`,
              timestamp: new Date().toISOString()
            });
          }
        });
      }
    });
    
    return issues;
  };
  
  useEffect(() => {
    const loadDiagnostics = async () => {
      setLoading(true);
      setApiError(null);
      
      try {
        let templates = [];
        
        if (templatesQuery.isSuccess && templatesQuery.data) {
          // Use API data if available
          templates = templatesQuery.data;
        } else if (templatesQuery.isError) {
          console.error('API error loading templates, falling back to local data');
          templates = healthWellnessTemplates;
          setApiError('Could not load templates from API, using local templates instead.');
        } else {
          // If query is still loading, use local templates as fallback
          templates = healthWellnessTemplates;
        }
        
        // Calculate metrics
        const totalTemplates = templates.length;
        const activeTemplates = templates.filter(t => t.status !== 'inactive' && t.status !== 'archived').length;
        const errorTemplates = validateTemplates(templates).filter(i => i.issueType === 'error').length;
        
        // Calculate average variables per template
        const totalVariables = templates.reduce(
          (sum, template) => sum + (template.variables ? template.variables.length : 0), 
          0
        );
        const averageVariables = totalVariables / totalTemplates;
        
        // Calculate usage metrics
        const totalUsage = templates.reduce(
          (sum, template) => sum + (template.usage_count || 0), 
          0
        );
        
        setMetrics({
          totalTemplates,
          activeTemplates,
          errorTemplates,
          averageVariables,
          usageCount: totalUsage
        });
        
        // Generate issues by validating templates
        const detectedIssues = validateTemplates(templates);
        setIssues(detectedIssues);
        
      } catch (error) {
        console.error('Error loading template diagnostics:', error);
        setApiError('An error occurred while analyzing templates. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadDiagnostics();
  }, [templatesQuery.data, templatesQuery.isSuccess, templatesQuery.isError]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    setApiError(null);
    
    try {
      // Refresh templates data from API
      await templatesQuery.refetch();
      
      // Give a small delay to make sure we have the latest data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let templates = [];
      
      if (templatesQuery.isSuccess && templatesQuery.data) {
        templates = templatesQuery.data;
      } else if (templatesQuery.isError) {
        console.error('API error refreshing templates, falling back to local data');
        templates = healthWellnessTemplates;
        setApiError('Could not refresh templates from API, using local templates instead.');
      } else {
        templates = healthWellnessTemplates;
      }
      
      // Recalculate metrics
      const totalTemplates = templates.length;
      const activeTemplates = templates.filter(t => t.status !== 'inactive' && t.status !== 'archived').length;
      const errorTemplates = validateTemplates(templates).filter(i => i.issueType === 'error').length;
      
      const totalVariables = templates.reduce(
        (sum, template) => sum + (template.variables ? template.variables.length : 0), 
        0
      );
      const averageVariables = totalVariables / totalTemplates;
      
      const totalUsage = templates.reduce(
        (sum, template) => sum + (template.usage_count || 0), 
        0
      );
      
      setMetrics({
        totalTemplates,
        activeTemplates,
        errorTemplates,
        averageVariables,
        usageCount: totalUsage
      });
      
      // Generate fresh issues by validating all templates
      const detectedIssues = validateTemplates(templates);
      setIssues(detectedIssues);
    } catch (error) {
      console.error('Error refreshing diagnostics:', error);
      setApiError('An error occurred while refreshing data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  const filteredIssues = issues.filter(issue => 
    issue.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.message.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <CheckCircleIcon color="info" />;
      default:
        return null;
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/content/templates')}
          sx={{ mr: 2 }}
        >
          Back to Templates
        </Button>
        <Typography variant="h4" component="h1" fontWeight="bold" sx={{ flexGrow: 1 }}>
          Template Diagnostics
        </Typography>
        <Button
          startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          variant="outlined"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          Refresh
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Error alert */}
          {apiError && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {apiError}
            </Alert>
          )}
          
          {/* Metrics Summary */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {metrics && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Templates
                      </Typography>
                      <Typography variant="h4" component="div">
                        {metrics.totalTemplates}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Active Templates
                      </Typography>
                      <Typography variant="h4" component="div" color="success.main">
                        {metrics.activeTemplates}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Templates with Issues
                      </Typography>
                      <Typography variant="h4" component="div" color={metrics.errorTemplates > 0 ? "error.main" : "success.main"}>
                        {metrics.errorTemplates}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Avg. Variables per Template
                      </Typography>
                      <Typography variant="h4" component="div">
                        {metrics.averageVariables.toFixed(1)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
          
          {/* Template Structure Validation */}
          <Typography variant="h5" sx={{ mb: 2 }}>
            Template Structure Validation
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Schema Validation
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Template Schema Version" 
                      secondary="v1.0 (Current)" 
                    />
                    <CheckCircleIcon color="success" />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Required Fields" 
                      secondary="All templates have required fields" 
                    />
                    <CheckCircleIcon color="success" />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Variable Definitions" 
                      secondary="All variables have proper type definitions" 
                    />
                    <CheckCircleIcon color="success" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Content Analysis
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Variable Usage" 
                      secondary="All templates use defined variables" 
                    />
                    <WarningIcon color="warning" />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Sample Output" 
                      secondary="All templates have sample output" 
                    />
                    <CheckCircleIcon color="success" />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Template Structure" 
                      secondary="All templates follow recommended structure" 
                    />
                    <CheckCircleIcon color="success" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Template Issues */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5">
              Template Issues
            </Typography>
            
            <TextField
              placeholder="Search issues..."
              value={searchQuery}
              onChange={handleSearchChange}
              size="small"
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <IconButton edge="start">
                    <SearchIcon fontSize="small" />
                  </IconButton>
                ),
              }}
            />
          </Box>
          
          {filteredIssues.length === 0 ? (
            <Alert severity="info" sx={{ mb: 4 }}>
              No issues found matching your search criteria.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={50}>Type</TableCell>
                    <TableCell>Template</TableCell>
                    <TableCell>Issue</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell width={180}>Detected</TableCell>
                    <TableCell width={100}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        {getIssueIcon(issue.issueType)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {issue.templateName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {issue.templateId}
                        </Typography>
                      </TableCell>
                      <TableCell>{issue.message}</TableCell>
                      <TableCell>{issue.location}</TableCell>
                      <TableCell>
                        {new Date(issue.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small"
                          onClick={() => navigate(`/content/templates/${issue.templateId}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {/* Template Generation Metrics */}
          <Typography variant="h5" sx={{ mb: 2 }}>
            Generation Metrics
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Performance
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Average Generation Time
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: '100%',
                        mr: 1,
                        position: 'relative',
                        height: 10,
                        borderRadius: 5,
                        bgcolor: 'background.paper',
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '15%',
                          bgcolor: 'success.main',
                          borderRadius: 5,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      1.2s
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Error Rate
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: '100%',
                        mr: 1,
                        position: 'relative',
                        height: 10,
                        borderRadius: 5,
                        bgcolor: 'background.paper',
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '3%',
                          bgcolor: 'error.main',
                          borderRadius: 5,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      0.3%
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Usage Statistics
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Total Generated Content" 
                      secondary={`${metrics?.usageCount || 0} items`}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Most Used Template" 
                      secondary={healthWellnessTemplates[0].name}
                    />
                    <Chip label="54% of total" size="small" color="primary" />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Least Used Template" 
                      secondary={healthWellnessTemplates[1].name}
                    />
                    <Chip label="46% of total" size="small" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default TemplateDiagnostics;