import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ContentCopy as ContentCopyIcon,
  Share as ShareIcon,
  Sort as SortIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
  getTemplateCollections,
  getTemplateCollectionById,
  createTemplateCollection,
  updateTemplateCollection,
  deleteTemplateCollection,
  addTemplateToCollection,
  removeTemplateFromCollection,
  TemplateCollection
} from '../../services/templateManagementService';
import { Template } from '../../services/templateService';

interface TemplateCollectionsManagerProps {
  onSelectTemplate?: (template: Template) => void;
  inSelectionMode?: boolean;
  selectedTemplateId?: string;
}

const TemplateCollectionsManager: React.FC<TemplateCollectionsManagerProps> = ({
  onSelectTemplate,
  inSelectionMode = false,
  selectedTemplateId
}) => {
  const navigate = useNavigate();
  
  // State
  const [collections, setCollections] = useState<TemplateCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<(TemplateCollection & { templates?: Template[] }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTemplateForActions, setSelectedTemplateForActions] = useState<Template | null>(null);

  // Fetch collections on component mount
  useEffect(() => {
    fetchCollections();
  }, []);

  // Fetch collections
  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getTemplateCollections();
      setCollections(response);
      
      // Select the default collection by default
      const defaultCollection = response.find(c => c.is_default);
      if (defaultCollection) {
        fetchCollectionContent(defaultCollection.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch template collections');
    } finally {
      setLoading(false);
    }
  };

  // Fetch collection content
  const fetchCollectionContent = async (collectionId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getTemplateCollectionById(collectionId);
      setSelectedCollection(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch collection content');
    } finally {
      setLoading(false);
    }
  };

  // Create new collection
  const handleCreateCollection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await createTemplateCollection({
        name: newCollectionName,
        description: newCollectionDescription
      });
      
      fetchCollections();
      setNewCollectionName('');
      setNewCollectionDescription('');
      setAddDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  // Update collection
  const handleUpdateCollection = async () => {
    if (!selectedCollection) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await updateTemplateCollection(selectedCollection.id, {
        name: newCollectionName,
        description: newCollectionDescription
      });
      
      fetchCollections();
      setEditDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update collection');
    } finally {
      setLoading(false);
    }
  };

  // Delete collection
  const handleDeleteCollection = async () => {
    if (!selectedCollection) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await deleteTemplateCollection(selectedCollection.id);
      
      fetchCollections();
      setSelectedCollection(null);
      setDeleteDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to delete collection');
    } finally {
      setLoading(false);
    }
  };

  // Open edit dialog
  const openEditDialog = () => {
    if (selectedCollection) {
      setNewCollectionName(selectedCollection.name);
      setNewCollectionDescription(selectedCollection.description);
      setEditDialogOpen(true);
    }
  };

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, template: Template) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedTemplateForActions(template);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedTemplateForActions(null);
  };

  // Remove template from collection
  const handleRemoveTemplateFromCollection = async () => {
    if (!selectedCollection || !selectedTemplateForActions) return;
    
    try {
      await removeTemplateFromCollection(
        selectedCollection.id,
        selectedTemplateForActions.id
      );
      
      fetchCollectionContent(selectedCollection.id);
      handleMenuClose();
    } catch (err: any) {
      setError(err.message || 'Failed to remove template from collection');
    }
  };

  // View template details
  const handleViewTemplate = (template: Template) => {
    if (inSelectionMode && onSelectTemplate) {
      onSelectTemplate(template);
    } else {
      navigate(`/templates/${template.id}`);
    }
  };

  // Use template
  const handleUseTemplate = (template: Template) => {
    navigate(`/templates/${template.id}/use`);
  };

  return (
    <Box>
      <Paper>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Template Collections</Typography>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            size="small"
            onClick={() => setAddDialogOpen(true)}
          >
            New Collection
          </Button>
        </Box>
        <Divider />
        
        <Grid container>
          {/* Collections Sidebar */}
          <Grid item xs={12} md={3} sx={{ borderRight: 1, borderColor: 'divider' }}>
            <List sx={{ p: 0 }}>
              {loading && collections.length === 0 ? (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={24} />
                </Box>
              ) : collections.length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary="No collections found" 
                    secondary="Create your first collection to organize templates"
                  />
                </ListItem>
              ) : (
                collections.map((collection) => (
                  <ListItem
                    key={collection.id}
                    button
                    selected={selectedCollection?.id === collection.id}
                    onClick={() => fetchCollectionContent(collection.id)}
                  >
                    <ListItemIcon>
                      {selectedCollection?.id === collection.id ? (
                        <FolderOpenIcon color="primary" />
                      ) : (
                        <FolderIcon />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={collection.name} 
                      secondary={`${collection.templates_count} templates`}
                    />
                    {collection.is_default && (
                      <Chip label="Default" size="small" />
                    )}
                  </ListItem>
                ))
              )}
            </List>
          </Grid>
          
          {/* Collection Content */}
          <Grid item xs={12} md={9}>
            {selectedCollection ? (
              <Box>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{selectedCollection.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCollection.description}
                    </Typography>
                  </Box>
                  
                  <Box>
                    {!selectedCollection.is_default && (
                      <>
                        <IconButton onClick={openEditDialog} size="small" sx={{ mr: 1 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => setDeleteDialogOpen(true)} size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </Box>
                
                <Divider />
                
                {loading && !selectedCollection.templates ? (
                  <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                  </Box>
                ) : !selectedCollection.templates || selectedCollection.templates.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No templates in this collection
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Browse templates and add them to this collection
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      {selectedCollection.templates.map((template) => (
                        <Grid item xs={12} sm={6} md={4} key={template.id}>
                          <Card 
                            sx={{ 
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              position: 'relative',
                              boxShadow: selectedTemplateId === template.id ? 4 : 1,
                              border: selectedTemplateId === template.id ? 2 : 0,
                              borderColor: 'primary.main'
                            }}
                          >
                            {template.is_premium && (
                              <Chip
                                label="Premium"
                                color="secondary"
                                size="small"
                                sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                              />
                            )}
                            
                            {template.preview_image ? (
                              <CardMedia
                                component="img"
                                height="140"
                                image={template.preview_image}
                                alt={template.title}
                              />
                            ) : (
                              <Box sx={{ height: 140, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography variant="body2">{template.format.name}</Typography>
                              </Box>
                            )}
                            
                            <CardContent sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Typography variant="h6" component="h3" gutterBottom>
                                  {template.title}
                                </Typography>
                                <IconButton size="small" onClick={(e) => handleMenuOpen(e, template)}>
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {template.description.length > 80 
                                  ? `${template.description.substring(0, 80)}...` 
                                  : template.description}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                <Chip 
                                  label={template.format.name} 
                                  size="small" 
                                  variant="outlined"
                                />
                                {template.categories.slice(0, 1).map((category) => (
                                  <Chip 
                                    key={category.id} 
                                    label={category.name} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </CardContent>
                            
                            <CardActions sx={{ p: 1, pt: 0 }}>
                              <Button 
                                size="small" 
                                onClick={() => handleViewTemplate(template)}
                                startIcon={<ChevronRightIcon />}
                              >
                                {inSelectionMode ? 'Select' : 'View'}
                              </Button>
                              
                              {!inSelectionMode && (
                                <Button 
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  onClick={() => handleUseTemplate(template)}
                                  sx={{ ml: 'auto' }}
                                >
                                  Use
                                </Button>
                              )}
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Select a collection
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a collection from the sidebar to view its templates
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Add Collection Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create New Collection</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Collection Name"
            fullWidth
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={newCollectionDescription}
            onChange={(e) => setNewCollectionDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateCollection} 
            variant="contained" 
            disabled={!newCollectionName.trim() || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Collection Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Collection</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Collection Name"
            fullWidth
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={newCollectionDescription}
            onChange={(e) => setNewCollectionDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateCollection} 
            variant="contained" 
            disabled={!newCollectionName.trim() || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Collection Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Collection</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the collection "{selectedCollection?.name}"? 
            This action cannot be undone. The templates will not be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteCollection} 
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Template Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          if (selectedTemplateForActions) {
            handleViewTemplate(selectedTemplateForActions);
          }
        }}>
          <ListItemIcon>
            <ChevronRightIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View Details" />
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleMenuClose();
          if (selectedTemplateForActions) {
            handleUseTemplate(selectedTemplateForActions);
          }
        }}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Use Template" />
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleRemoveTemplateFromCollection}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Remove from Collection" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TemplateCollectionsManager;