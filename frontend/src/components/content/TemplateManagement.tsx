import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  ListItemIcon,
  ListItemText,
  Menu,
  Tooltip,
  Divider,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  MoreVert as MoreVertIcon,
  SaveAlt as SaveAltIcon,
  Share as ShareIcon,
  History as HistoryIcon,
  LockOutlined as LockOutlinedIcon,
  LockOpenOutlined as LockOpenOutlinedIcon,
  Preview as PreviewIcon,
  Description as DescriptionIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  CategoryOutlined as CategoryOutlinedIcon,
} from '@mui/icons-material';
import { Template } from './TemplateSelector';

interface TemplatePermission {
  roleId: string;
  roleName: string;
  access: 'view' | 'edit' | 'admin';
}

interface TemplateVersion {
  id: string;
  version: string;
  createdAt: string;
  createdBy: string;
  changes: string;
}

interface TemplateDetails extends Template {
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  variables: {
    key: string;
    name: string;
    type: string;
    required: boolean;
  }[];
  content: string;
  isDefault: boolean;
  permissions: TemplatePermission[];
  versions: TemplateVersion[];
}

interface TemplateManagementProps {
  userRole: 'admin' | 'editor' | 'viewer';
  onTemplateCreate?: (template: TemplateDetails) => void;
  onTemplateUpdate?: (template: TemplateDetails) => void;
  onTemplateDelete?: (templateId: string) => void;
}

const TemplateManagement = ({
  userRole,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
}: TemplateManagementProps) => {
  const [templates, setTemplates] = useState<TemplateDetails[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDetails | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [tabValue, setTabValue] = useState(0);
  
  // Load templates (mock data here)
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setTemplates([
        {
          id: 'blog-standard',
          name: 'Standard Blog Post',
          description: 'A versatile blog post template with introduction, body sections, and conclusion.',
          type: 'blog',
          tags: ['blog', 'general', 'featured'],
          lastModified: '2025-03-15',
          createdBy: 'Admin User',
          createdAt: '2025-02-10',
          updatedAt: '2025-03-15',
          updatedBy: 'Content Editor',
          variables: [
            { key: 'title', name: 'Blog Title', type: 'text', required: true },
            { key: 'topic', name: 'Topic', type: 'text', required: true },
            { key: 'audience', name: 'Target Audience', type: 'select', required: true },
            { key: 'tone', name: 'Tone', type: 'select', required: true },
            { key: 'keyPoints', name: 'Key Points', type: 'multiline', required: false },
          ],
          content: 'You are writing a blog post about {{topic}} targeted at {{audience}} with a {{tone}} tone. The title of the blog is "{{title}}". Cover the following key points:\n\n{{keyPoints}}\n\nInclude an introduction, 3-5 main sections with subheadings, and a conclusion.',
          isDefault: true,
          permissions: [
            { roleId: 'admin', roleName: 'Administrator', access: 'admin' },
            { roleId: 'editor', roleName: 'Content Editor', access: 'edit' },
            { roleId: 'viewer', roleName: 'Viewer', access: 'view' },
          ],
          versions: [
            { id: 'v1', version: '1.0', createdAt: '2025-02-10', createdBy: 'Admin User', changes: 'Initial version' },
            { id: 'v2', version: '1.1', createdAt: '2025-02-28', createdBy: 'Content Editor', changes: 'Added target audience variable' },
            { id: 'v3', version: '1.2', createdAt: '2025-03-15', createdBy: 'Content Editor', changes: 'Improved instructions for key points' },
          ]
        },
        {
          id: 'email-newsletter',
          name: 'Weekly Newsletter',
          description: 'Email newsletter template with a structured format for weekly updates.',
          type: 'email',
          tags: ['newsletter', 'email'],
          lastModified: '2025-03-10',
          createdBy: 'Admin User',
          createdAt: '2025-02-15',
          updatedAt: '2025-03-10',
          updatedBy: 'Admin User',
          variables: [
            { key: 'subject', name: 'Newsletter Subject', type: 'text', required: true },
            { key: 'mainStory', name: 'Main Story', type: 'text', required: true },
            { key: 'secondaryStories', name: 'Secondary Stories', type: 'multiline', required: false },
            { key: 'cta', name: 'Call to Action', type: 'text', required: true },
          ],
          content: 'You are creating an email newsletter with the subject "{{subject}}". The main story is about {{mainStory}}. Include the following secondary stories:\n\n{{secondaryStories}}\n\nEnd with a call to action: {{cta}}',
          isDefault: false,
          permissions: [
            { roleId: 'admin', roleName: 'Administrator', access: 'admin' },
            { roleId: 'editor', roleName: 'Content Editor', access: 'edit' },
          ],
          versions: [
            { id: 'v1', version: '1.0', createdAt: '2025-02-15', createdBy: 'Admin User', changes: 'Initial version' },
            { id: 'v2', version: '1.1', createdAt: '2025-03-10', createdBy: 'Admin User', changes: 'Added call to action variable' },
          ]
        },
        {
          id: 'social-announcement',
          name: 'Product Announcement',
          description: 'Social media post announcing a new product or feature.',
          type: 'social',
          tags: ['social', 'product', 'announcement'],
          lastModified: '2025-03-05',
          createdBy: 'Content Editor',
          createdAt: '2025-02-20',
          updatedAt: '2025-03-05',
          updatedBy: 'Content Editor',
          variables: [
            { key: 'productName', name: 'Product Name', type: 'text', required: true },
            { key: 'keyFeature', name: 'Key Feature', type: 'text', required: true },
            { key: 'launchDate', name: 'Launch Date', type: 'date', required: true },
            { key: 'hashtags', name: 'Hashtags', type: 'text', required: false },
          ],
          content: 'Create a social media announcement for {{productName}}. The key feature to highlight is {{keyFeature}}. The product launches on {{launchDate}}. Include these hashtags: {{hashtags}}',
          isDefault: false,
          permissions: [
            { roleId: 'admin', roleName: 'Administrator', access: 'admin' },
            { roleId: 'editor', roleName: 'Content Editor', access: 'edit' },
            { roleId: 'viewer', roleName: 'Viewer', access: 'view' },
          ],
          versions: [
            { id: 'v1', version: '1.0', createdAt: '2025-02-20', createdBy: 'Content Editor', changes: 'Initial version' },
            { id: 'v2', version: '1.1', createdAt: '2025-03-05', createdBy: 'Content Editor', changes: 'Added hashtags field' },
          ]
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);
  
  // Filter templates when search changes
  useEffect(() => {
    if (templates.length === 0) {
      setFilteredTemplates([]);
      return;
    }
    
    let filtered = [...templates];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        template => 
          template.name.toLowerCase().includes(query) || 
          template.description.toLowerCase().includes(query) ||
          template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply type filter
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter(template => template.type === typeFilter);
    }
    
    setFilteredTemplates(filtered);
  }, [templates, searchQuery, typeFilter]);
  
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, template: TemplateDetails) => {
    setAnchorEl(event.currentTarget);
    setSelectedTemplate(template);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  
  const handleCreate = () => {
    setDialogMode('create');
    setSelectedTemplate(null);
    setOpenDialog(true);
  };
  
  const handleEdit = (template: TemplateDetails) => {
    setDialogMode('edit');
    setSelectedTemplate(template);
    setOpenDialog(true);
    handleCloseMenu();
  };
  
  const handleView = (template: TemplateDetails) => {
    setDialogMode('view');
    setSelectedTemplate(template);
    setOpenDialog(true);
    handleCloseMenu();
  };
  
  const handleDuplicate = (template: TemplateDetails) => {
    const duplicatedTemplate = {
      ...template,
      id: `${template.id}-copy`,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Current User',
      updatedBy: 'Current User',
      isDefault: false,
    };
    
    setTemplates([...templates, duplicatedTemplate]);
    setSnackbar({
      open: true,
      message: 'Template duplicated successfully',
      severity: 'success'
    });
    
    handleCloseMenu();
  };
  
  const handleDelete = (template: TemplateDetails) => {
    if (window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      setTemplates(templates.filter(t => t.id !== template.id));
      if (onTemplateDelete) {
        onTemplateDelete(template.id);
      }
      setSnackbar({
        open: true,
        message: 'Template deleted successfully',
        severity: 'success'
      });
    }
    handleCloseMenu();
  };
  
  const handleDialogClose = () => {
    setOpenDialog(false);
  };
  
  const handleSaveTemplate = () => {
    // In a real application, this would validate and save the template
    setOpenDialog(false);
    setSnackbar({
      open: true,
      message: dialogMode === 'create' ? 'Template created successfully' : 'Template updated successfully',
      severity: 'success'
    });
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const getTemplateTypeColor = (type: Template['type']) => {
    const colors: Record<Template['type'], string> = {
      blog: '#4caf50',
      email: '#2196f3',
      social: '#9c27b0',
      ad: '#f44336',
      landing: '#ff9800',
      other: '#607d8b'
    };
    return colors[type];
  };
  
  const canEditTemplate = (template: TemplateDetails) => {
    if (userRole === 'admin') return true;
    if (userRole === 'editor') {
      const permission = template.permissions.find(p => p.roleId === 'editor');
      return permission && (permission.access === 'edit' || permission.access === 'admin');
    }
    return false;
  };
  
  const canDeleteTemplate = (template: TemplateDetails) => {
    return userRole === 'admin';
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Template Management</Typography>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
            <TextField
              placeholder="Search templates..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ mr: 2, width: 250 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150, mr: 2 }}>
              <InputLabel id="type-filter-label">Type</InputLabel>
              <Select
                labelId="type-filter-label"
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="blog">Blog</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="social">Social Media</MenuItem>
                <MenuItem value="ad">Advertisement</MenuItem>
                <MenuItem value="landing">Landing Page</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            
            {(userRole === 'admin' || userRole === 'editor') && (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleCreate}
              >
                New Template
              </Button>
            )}
          </Box>
        </Box>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Last Modified</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    Loading templates...
                  </TableCell>
                </TableRow>
              ) : filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No templates found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {template.name}
                        </Typography>
                        {template.isDefault && (
                          <Chip 
                            label="Default" 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                            sx={{ ml: 1, height: 20 }} 
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={template.type} 
                        size="small" 
                        sx={{ 
                          bgcolor: getTemplateTypeColor(template.type),
                          color: 'white',
                          fontWeight: 'medium'
                        }} 
                      />
                    </TableCell>
                    <TableCell>{template.description}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {template.tags.map((tag) => (
                          <Chip 
                            key={tag} 
                            label={tag} 
                            size="small" 
                            variant="outlined" 
                            sx={{ height: 20 }} 
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>{template.lastModified}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleView(template)}>
                          <PreviewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {canEditTemplate(template) && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEdit(template)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <IconButton 
                        size="small" 
                        aria-controls="template-menu" 
                        aria-haspopup="true"
                        onClick={(e) => handleOpenMenu(e, template)}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Template Actions Menu */}
      <Menu
        id="template-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => selectedTemplate && handleView(selectedTemplate)}>
          <ListItemIcon>
            <PreviewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Template</ListItemText>
        </MenuItem>
        
        {selectedTemplate && canEditTemplate(selectedTemplate) && (
          <MenuItem onClick={() => selectedTemplate && handleEdit(selectedTemplate)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Template</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={() => selectedTemplate && handleDuplicate(selectedTemplate)}>
          <ListItemIcon>
            <FileCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => {}}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View History</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {}}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share Template</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {}}>
          <ListItemIcon>
            <SaveAltIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export</ListItemText>
        </MenuItem>
        
        {selectedTemplate && canDeleteTemplate(selectedTemplate) && (
          <>
            <Divider />
            <MenuItem 
              onClick={() => selectedTemplate && handleDelete(selectedTemplate)}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete Template</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
      
      {/* Template Dialog (Create/Edit/View) */}
      <Dialog 
        open={openDialog} 
        onClose={handleDialogClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New Template' : 
           dialogMode === 'edit' ? 'Edit Template' : 'View Template'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="General" />
              <Tab label="Content" />
              <Tab label="Variables" />
              {userRole === 'admin' && <Tab label="Permissions" />}
              <Tab label="History" />
            </Tabs>
          </Box>
          
          {/* General Tab */}
          <Box role="tabpanel" hidden={tabValue !== 0}>
            {tabValue === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Template Name"
                    value={selectedTemplate?.name || ''}
                    disabled={dialogMode === 'view'}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Template Type</InputLabel>
                    <Select
                      value={selectedTemplate?.type || 'blog'}
                      label="Template Type"
                      disabled={dialogMode === 'view'}
                    >
                      <MenuItem value="blog">Blog</MenuItem>
                      <MenuItem value="email">Email</MenuItem>
                      <MenuItem value="social">Social Media</MenuItem>
                      <MenuItem value="ad">Advertisement</MenuItem>
                      <MenuItem value="landing">Landing Page</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={selectedTemplate?.description || ''}
                    disabled={dialogMode === 'view'}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tags (comma separated)"
                    value={selectedTemplate?.tags.join(', ') || ''}
                    disabled={dialogMode === 'view'}
                    margin="normal"
                    helperText="Enter tags separated by commas"
                  />
                </Grid>
                {userRole === 'admin' && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Default Template</InputLabel>
                      <Select
                        value={selectedTemplate?.isDefault ? 'yes' : 'no'}
                        label="Default Template"
                        disabled={dialogMode === 'view'}
                      >
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
          
          {/* Content Tab */}
          <Box role="tabpanel" hidden={tabValue !== 1}>
            {tabValue === 1 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Template Content
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={12}
                  value={selectedTemplate?.content || ''}
                  disabled={dialogMode === 'view'}
                  margin="normal"
                  placeholder="Enter template content with variables in {{variable}} format"
                  variant="outlined"
                />
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Variable Usage
                  </Typography>
                  <Typography variant="body2">
                    Use double curly braces to insert variables: <code>{"{{variableName}}"}</code>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Example: <code>{"Write a blog post about {{topic}} with {{tone}} tone."}</code>
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
          
          {/* Variables Tab */}
          <Box role="tabpanel" hidden={tabValue !== 2}>
            {tabValue === 2 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2">
                    Template Variables
                  </Typography>
                  {dialogMode !== 'view' && (
                    <Button 
                      size="small" 
                      variant="outlined" 
                      startIcon={<AddIcon />}
                    >
                      Add Variable
                    </Button>
                  )}
                </Box>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Key</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Required</TableCell>
                        {dialogMode !== 'view' && <TableCell align="right">Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedTemplate?.variables.map((variable) => (
                        <TableRow key={variable.key}>
                          <TableCell>{variable.name}</TableCell>
                          <TableCell><code>{`{{${variable.key}}}`}</code></TableCell>
                          <TableCell>{variable.type}</TableCell>
                          <TableCell>{variable.required ? 'Yes' : 'No'}</TableCell>
                          {dialogMode !== 'view' && (
                            <TableCell align="right">
                              <IconButton size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
          
          {/* Permissions Tab */}
          <Box role="tabpanel" hidden={tabValue !== 3 || userRole !== 'admin'}>
            {tabValue === 3 && userRole === 'admin' && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Role Permissions
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Role</TableCell>
                        <TableCell>Access Level</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedTemplate?.permissions.map((permission) => (
                        <TableRow key={permission.roleId}>
                          <TableCell>{permission.roleName}</TableCell>
                          <TableCell>
                            {dialogMode === 'view' ? (
                              <Chip 
                                label={permission.access} 
                                size="small" 
                                color={
                                  permission.access === 'admin' ? 'primary' :
                                  permission.access === 'edit' ? 'success' : 'default'
                                }
                              />
                            ) : (
                              <Select
                                value={permission.access}
                                size="small"
                                sx={{ minWidth: 120 }}
                              >
                                <MenuItem value="view">View Only</MenuItem>
                                <MenuItem value="edit">Edit</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {dialogMode !== 'view' && (
                              <IconButton size="small">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {dialogMode !== 'view' && (
                  <Button 
                    size="small" 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    sx={{ mt: 2 }}
                  >
                    Add Role Permission
                  </Button>
                )}
              </Box>
            )}
          </Box>
          
          {/* History Tab */}
          <Box role="tabpanel" hidden={tabValue !== (userRole === 'admin' ? 4 : 3)}>
            {tabValue === (userRole === 'admin' ? 4 : 3) && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Version History
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Version</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Modified By</TableCell>
                        <TableCell>Changes</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedTemplate?.versions.map((version) => (
                        <TableRow key={version.id}>
                          <TableCell>{version.version}</TableCell>
                          <TableCell>{version.createdAt}</TableCell>
                          <TableCell>{version.createdBy}</TableCell>
                          <TableCell>{version.changes}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Version">
                              <IconButton size="small">
                                <PreviewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Restore Version">
                              <IconButton size="small">
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button variant="contained" onClick={handleSaveTemplate}>
              {dialogMode === 'create' ? 'Create Template' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={5000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TemplateManagement;