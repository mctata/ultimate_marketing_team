import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  SelectChangeEvent
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Archive as ArchiveIcon,
  RestoreFromTrash as RestoreIcon,
  VisibilityOff as VisibilityOffIcon,
  Visibility as VisibilityIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import healthWellnessTemplates from '../../healthWellnessTemplates';

interface TemplateAdminViewModel {
  id: string;
  name: string;
  title: string;
  description: string;
  content_type: string;
  category: string;
  format_id: string;
  variable_count: number;
  is_premium: boolean;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  author: string;
  tags: string[];
}

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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminTemplatesUtility: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [templates, setTemplates] = useState<TemplateAdminViewModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Transform templates data for admin view
        const adminTemplates: TemplateAdminViewModel[] = healthWellnessTemplates.map(template => ({
          id: template.id,
          name: template.name,
          title: template.title,
          description: template.description,
          content_type: template.content_type,
          category: template.category,
          format_id: template.format_id,
          variable_count: template.variables.length,
          is_premium: template.is_premium,
          is_featured: template.is_featured,
          is_active: true,
          created_at: template.created_at,
          updated_at: template.updated_at,
          author: template.author || 'System',
          tags: template.tags
        }));
        
        setTemplates(adminTemplates);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle search query change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  // Handle content type filter change
  const handleContentTypeFilterChange = (event: SelectChangeEvent<string>) => {
    setContentTypeFilter(event.target.value);
  };
  
  // Open duplicate dialog
  const handleOpenDuplicateDialog = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setNewTemplateName(`Copy of ${template.name}`);
      setDuplicateDialogOpen(true);
    }
  };
  
  // Close duplicate dialog
  const handleCloseDuplicateDialog = () => {
    setDuplicateDialogOpen(false);
    setSelectedTemplateId(null);
    setNewTemplateName('');
  };
  
  // Handle duplicate template
  const handleDuplicateTemplate = () => {
    if (!selectedTemplateId || !newTemplateName.trim()) return;
    
    const originalTemplate = templates.find(t => t.id === selectedTemplateId);
    
    if (originalTemplate) {
      const newTemplateId = `${originalTemplate.id}-copy-${Date.now()}`;
      
      const newTemplate: TemplateAdminViewModel = {
        ...originalTemplate,
        id: newTemplateId,
        name: newTemplateName.trim(),
        title: newTemplateName.trim(),
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setTemplates([...templates, newTemplate]);
      handleCloseDuplicateDialog();
      
      // Show success message (would use toast in a real app)
      console.log('Template duplicated:', newTemplate);
    }
  };
  
  // Handle toggle featured status
  const handleToggleFeatured = (templateId: string) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === templateId 
          ? { ...template, is_featured: !template.is_featured } 
          : template
      )
    );
  };
  
  // Handle toggle active status
  const handleToggleActive = (templateId: string) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === templateId 
          ? { ...template, is_active: !template.is_active } 
          : template
      )
    );
  };
  
  // Handle toggle premium status
  const handleTogglePremium = (templateId: string) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === templateId 
          ? { ...template, is_premium: !template.is_premium } 
          : template
      )
    );
  };
  
  // Filter templates based on search and content type filter
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesContentType = contentTypeFilter === 'all' || template.content_type === contentTypeFilter;
    
    return matchesSearch && matchesContentType;
  });
  
  // Get appropriate templates for the current tab
  const getTabTemplates = () => {
    switch (tabValue) {
      case 0: // All templates
        return filteredTemplates;
      case 1: // Featured templates
        return filteredTemplates.filter(t => t.is_featured);
      case 2: // Premium templates
        return filteredTemplates.filter(t => t.is_premium);
      case 3: // Inactive templates
        return filteredTemplates.filter(t => !t.is_active);
      default:
        return filteredTemplates;
    }
  };
  
  // Get unique content types for filter
  const contentTypes = ['all', ...new Set(templates.map(t => t.content_type))];
  
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
          Template Administration
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => console.log('Create new template - would navigate to template editor')}
          sx={{ ml: 2 }}
        >
          Create Template
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Search and Filters */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search templates..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                      <SearchIcon fontSize="small" />
                    </Box>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Content Type</InputLabel>
                <Select
                  value={contentTypeFilter}
                  onChange={handleContentTypeFilterChange}
                  label="Content Type"
                >
                  {contentTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="template admin tabs">
              <Tab label={`All Templates (${filteredTemplates.length})`} />
              <Tab label={`Featured (${filteredTemplates.filter(t => t.is_featured).length})`} />
              <Tab label={`Premium (${filteredTemplates.filter(t => t.is_premium).length})`} />
              <Tab label={`Inactive (${filteredTemplates.filter(t => !t.is_active).length})`} />
            </Tabs>
          </Box>
          
          {/* Templates Table */}
          <TabPanel value={tabValue} index={0}>
            {(() => {
              const displayTemplates = getTabTemplates();
              
              return displayTemplates.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No templates found matching your criteria.
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '30%' }}>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="center">Variables</TableCell>
                        <TableCell align="center">Featured</TableCell>
                        <TableCell align="center">Premium</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayTemplates.map((template) => (
                        <TableRow 
                          key={template.id}
                          sx={{ 
                            '&:last-child td, &:last-child th': { border: 0 },
                            opacity: template.is_active ? 1 : 0.6
                          }}
                        >
                          <TableCell component="th" scope="row">
                            <Box>
                              <Typography variant="body1" fontWeight="medium">
                                {template.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {template.description.length > 70 
                                  ? `${template.description.substring(0, 70)}...` 
                                  : template.description}
                              </Typography>
                              <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {template.tags.slice(0, 3).map((tag) => (
                                  <Chip 
                                    key={tag} 
                                    label={tag} 
                                    size="small" 
                                    sx={{ fontSize: '0.7rem' }} 
                                  />
                                ))}
                                {template.tags.length > 3 && (
                                  <Chip 
                                    label={`+${template.tags.length - 3}`} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }} 
                                  />
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={template.content_type.charAt(0).toUpperCase() + template.content_type.slice(1)} 
                              size="small" 
                              color="primary"
                            />
                          </TableCell>
                          <TableCell align="center">
                            {template.variable_count}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton 
                              onClick={() => handleToggleFeatured(template.id)}
                              color={template.is_featured ? 'warning' : 'default'}
                              size="small"
                            >
                              {template.is_featured ? <StarIcon /> : <StarBorderIcon />}
                            </IconButton>
                          </TableCell>
                          <TableCell align="center">
                            <Switch
                              checked={template.is_premium}
                              onChange={() => handleTogglePremium(template.id)}
                              color="secondary"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={template.is_active ? 'Active' : 'Inactive'} 
                              size="small"
                              color={template.is_active ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Tooltip title="Edit Template">
                                <IconButton 
                                  onClick={() => navigate(`/content/templates/${template.id}/test`)}
                                  size="small"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Duplicate Template">
                                <IconButton 
                                  onClick={() => handleOpenDuplicateDialog(template.id)}
                                  size="small"
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={template.is_active ? "Deactivate" : "Activate"}>
                                <IconButton 
                                  onClick={() => handleToggleActive(template.id)}
                                  size="small"
                                  color={template.is_active ? 'default' : 'success'}
                                >
                                  {template.is_active ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {(() => {
              const displayTemplates = getTabTemplates();
              return displayTemplates.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>No templates found matching your criteria.</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  {/* Same table structure as above */}
                  <Table sx={{ minWidth: 650 }}>
                    {/* Table content same as above */}
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '30%' }}>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="center">Variables</TableCell>
                        <TableCell align="center">Featured</TableCell>
                        <TableCell align="center">Premium</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayTemplates.map((template) => (
                        <TableRow key={template.id} sx={{ opacity: template.is_active ? 1 : 0.6 }}>
                          {/* Same row content as above */}
                          <TableCell component="th" scope="row">
                            <Box>
                              <Typography variant="body1" fontWeight="medium">{template.name}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {template.description.length > 70 ? `${template.description.substring(0, 70)}...` : template.description}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Chip label={template.content_type} size="small" color="primary" /></TableCell>
                          <TableCell align="center">{template.variable_count}</TableCell>
                          <TableCell align="center">
                            <IconButton onClick={() => handleToggleFeatured(template.id)} color={template.is_featured ? 'warning' : 'default'} size="small">
                              {template.is_featured ? <StarIcon /> : <StarBorderIcon />}
                            </IconButton>
                          </TableCell>
                          <TableCell align="center">
                            <Switch checked={template.is_premium} onChange={() => handleTogglePremium(template.id)} color="secondary" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={template.is_active ? 'Active' : 'Inactive'} size="small" color={template.is_active ? 'success' : 'default'} />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Tooltip title="Edit Template">
                                <IconButton onClick={() => navigate(`/content/templates/${template.id}/test`)} size="small">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Duplicate Template">
                                <IconButton onClick={() => handleOpenDuplicateDialog(template.id)} size="small">
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={template.is_active ? "Deactivate" : "Activate"}>
                                <IconButton onClick={() => handleToggleActive(template.id)} size="small" color={template.is_active ? 'default' : 'success'}>
                                  {template.is_active ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            {(() => {
              const displayTemplates = getTabTemplates();
              return displayTemplates.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>No premium templates found.</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  {/* Same table structure abbreviated */}
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '30%' }}>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="center">Variables</TableCell>
                        <TableCell align="center">Featured</TableCell>
                        <TableCell align="center">Premium</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayTemplates.map((template) => (
                        <TableRow key={template.id} sx={{ opacity: template.is_active ? 1 : 0.6 }}>
                          <TableCell component="th" scope="row">{template.name}</TableCell>
                          <TableCell><Chip label={template.content_type} size="small" color="primary" /></TableCell>
                          <TableCell align="center">{template.variable_count}</TableCell>
                          <TableCell align="center">
                            <IconButton onClick={() => handleToggleFeatured(template.id)} color="warning" size="small">
                              <StarIcon />
                            </IconButton>
                          </TableCell>
                          <TableCell align="center">
                            <Switch checked={true} onChange={() => handleTogglePremium(template.id)} color="secondary" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label="Active" size="small" color="success" />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                              <IconButton size="small"><ContentCopyIcon fontSize="small" /></IconButton>
                              <IconButton size="small"><VisibilityOffIcon fontSize="small" /></IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            {(() => {
              const displayTemplates = getTabTemplates();
              return displayTemplates.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>No inactive templates found.</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  {/* Same table structure abbreviated */}
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '30%' }}>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="center">Variables</TableCell>
                        <TableCell align="center">Featured</TableCell>
                        <TableCell align="center">Premium</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayTemplates.map((template) => (
                        <TableRow key={template.id} sx={{ opacity: 0.6 }}>
                          <TableCell component="th" scope="row">{template.name}</TableCell>
                          <TableCell><Chip label={template.content_type} size="small" color="primary" /></TableCell>
                          <TableCell align="center">{template.variable_count}</TableCell>
                          <TableCell align="center">
                            <IconButton onClick={() => handleToggleFeatured(template.id)} size="small">
                              <StarBorderIcon />
                            </IconButton>
                          </TableCell>
                          <TableCell align="center">
                            <Switch checked={template.is_premium} onChange={() => handleTogglePremium(template.id)} color="secondary" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label="Inactive" size="small" />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                              <IconButton size="small"><ContentCopyIcon fontSize="small" /></IconButton>
                              <IconButton size="small" color="success"><VisibilityIcon fontSize="small" /></IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}
          </TabPanel>
          
          {/* Duplicate Template Dialog */}
          <Dialog open={duplicateDialogOpen} onClose={handleCloseDuplicateDialog}>
            <DialogTitle>Duplicate Template</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="New Template Name"
                fullWidth
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                sx={{ mt: 1, minWidth: 300 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDuplicateDialog}>Cancel</Button>
              <Button 
                onClick={handleDuplicateTemplate} 
                variant="contained"
                disabled={!newTemplateName.trim()}
              >
                Duplicate
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
      
    </Box>
  );
};

export default AdminTemplatesUtility;