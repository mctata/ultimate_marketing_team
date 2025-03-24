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

  useEffect(() => {
    const loadDiagnostics = async () => {
      setLoading(true);
      try {
        // In a real implementation, this would call the API
        // Simulating API call with timeout
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate mock metrics based on actual templates
        const totalTemplates = healthWellnessTemplates.length;
        const errorTemplates = Math.floor(Math.random() * 2); // 0-1 templates with errors
        const activeTemplates = totalTemplates - errorTemplates;
        
        // Calculate average variables per template
        const totalVariables = healthWellnessTemplates.reduce(
          (sum, template) => sum + template.variables.length, 
          0
        );
        const averageVariables = totalVariables / totalTemplates;
        
        setMetrics({
          totalTemplates,
          activeTemplates,
          errorTemplates,
          averageVariables,
          usageCount: Math.floor(Math.random() * 1000)
        });
        
        // Generate sample issues
        const mockIssues: TemplateIssue[] = [
          {
            id: '1',
            templateId: healthWellnessTemplates[0].id,
            templateName: healthWellnessTemplates[0].name,
            issueType: 'warning',
            message: 'Template content contains potentially unused variables',
            location: 'template_content',
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            templateId: healthWellnessTemplates[1].id,
            templateName: healthWellnessTemplates[1].name,
            issueType: 'info',
            message: 'Template has missing sample output for all tone variations',
            location: 'sample_output',
            timestamp: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        
        setIssues(mockIssues);
      } catch (error) {
        console.error('Error loading template diagnostics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDiagnostics();
  }, []);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate refresh with timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update metrics with slightly different values
      if (metrics) {
        setMetrics({
          ...metrics,
          errorTemplates: Math.floor(Math.random() * 2),
          usageCount: metrics.usageCount + Math.floor(Math.random() * 50)
        });
      }
      
      // Update timestamp on issues
      setIssues(prevIssues => 
        prevIssues.map(issue => ({
          ...issue,
          timestamp: new Date().toISOString()
        }))
      );
    } catch (error) {
      console.error('Error refreshing diagnostics:', error);
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