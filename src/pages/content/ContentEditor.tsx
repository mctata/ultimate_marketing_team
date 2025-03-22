import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Chip,
  Autocomplete,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Drawer,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Fab,
  Snackbar,
  SwipeableDrawer,
  Tabs,
  Tab,
  BottomNavigation,
  BottomNavigationAction,
  Collapse
} from '@mui/material';
import { 
  Save as SaveIcon, 
  ArrowBack as ArrowBackIcon, 
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Science as ScienceIcon,
  BarChart as BarChartIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  TravelExplore as TravelExploreIcon,
  MenuOpen as MenuOpenIcon,
  Edit as EditIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Info as InfoIcon,
  Help as HelpIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { AppDispatch } from '../../store';
import {
  fetchDraftById,
  createDraft,
  updateDraft,
  fetchTopics,
  selectSelectedDraft,
  selectDraftsLoading,
  selectDraftsError,
  selectTopics
} from '../../store/slices/contentSlice';
import { ContentDraft } from '../../services/contentService';
import RichTextEditor from '../../components/content/RichTextEditor';

const ContentEditor = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== 'new';
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const contentDraft = useSelector(selectSelectedDraft);
  const loading = useSelector(selectDraftsLoading);
  const error = useSelector(selectDraftsError);
  const availableTopics = useSelector(selectTopics);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<ContentDraft['status']>('draft');
  const [topics, setTopics] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [formError, setFormError] = useState<string>('');
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState(0);
  const [mobileView, setMobileView] = useState<'editor' | 'metadata'>('editor');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  
  // Mock data for UI
  const mockCollaborators = [
    { id: 'user1', name: 'John Doe', role: 'Editor', avatar: 'JD' },
    { id: 'user2', name: 'Sarah Smith', role: 'Reviewer', avatar: 'SS' }
  ];
  
  // Brand info
  const mockBrandInfo = {
    id: 'brand-123',
    name: 'Acme Corporation',
    primaryColor: '#4caf50',
    guidelines: {
      tone: 'Professional with friendly tone',
      keywords: ['innovative', 'reliable', 'customer-focused'],
      avoid: ['technical jargon', 'overly promotional language']
    }
  };

  useEffect(() => {
    // Fetch available topics
    dispatch(fetchTopics());

    // If editing, fetch the draft content
    if (isEditing && id) {
      dispatch(fetchDraftById(id));
    }
  }, [dispatch, id, isEditing]);

  // Populate form when content draft is loaded
  useEffect(() => {
    if (contentDraft && isEditing) {
      setTitle(contentDraft.title);
      setBody(contentDraft.body);
      setStatus(contentDraft.status);
      setTopics(contentDraft.topics);
      setTags(contentDraft.tags);
    }
  }, [contentDraft, isEditing]);

  const validateForm = () => {
    if (!title.trim()) {
      setFormError('Title is required');
      return false;
    }
    if (!body.trim()) {
      setFormError('Content body is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const draftData: Partial<ContentDraft> = {
      title,
      body,
      status,
      topics,
      tags,
    };

    try {
      if (isEditing && id) {
        await dispatch(updateDraft({ id, draft: draftData })).unwrap();
        showSnackbar('Content updated successfully');
      } else {
        // For new content, we need to add brand_id and author_id (using placeholder values)
        const newDraft = {
          ...draftData,
          brand_id: mockBrandInfo.id,
          author_id: 'current-user-id', // This would come from auth context
        } as Omit<ContentDraft, 'id' | 'created_at' | 'updated_at'>;
        
        await dispatch(createDraft(newDraft)).unwrap();
        showSnackbar('New content created successfully');
      }
      
      // On mobile, don't navigate away immediately to show the success message
      if (!isMobile) {
        navigate('/content');
      }
    } catch (err) {
      setFormError('Failed to save content. Please try again.');
      showSnackbar('Error saving content', 'error');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  const handleBack = () => {
    navigate('/content');
  };

  const handleSchedule = () => {
    if (isEditing && id) {
      navigate(`/content/${id}/schedule`);
    } else {
      // Save draft first, then navigate to scheduling
      handleSave().then(() => {
        if (contentDraft?.id) {
          navigate(`/content/${contentDraft.id}/schedule`);
        }
      });
    }
  };

  const handleCreateABTest = () => {
    if (isEditing && id) {
      navigate(`/content/${id}/abtests/new`);
    } else {
      showSnackbar('Please save the content before creating A/B tests');
    }
  };
  
  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };
  
  const handleMobileViewChange = (view: 'editor' | 'metadata') => {
    setMobileView(view);
  };
  
  const toggleHelp = () => {
    setHelpOpen(!helpOpen);
  };

  // Mobile content editor view
  const renderMobileEditor = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TextField
        fullWidth
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
        error={formError === 'Title is required'}
        helperText={formError === 'Title is required' ? formError : ''}
      />
      
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <RichTextEditor 
          value={body} 
          onChange={setBody}
          error={formError === 'Content body is required'}
          helperText={formError === 'Content body is required' ? formError : ''}
          brandName={mockBrandInfo.name}
        />
      </Box>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
        >
          Save
        </Button>
        
        <Button
          variant="outlined"
          color="primary"
          onClick={() => handleMobileViewChange('metadata')}
          startIcon={<SettingsIcon />}
        >
          Properties
        </Button>
      </Box>
    </Box>
  );
  
  // Mobile metadata view
  const renderMobileMetadata = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => handleMobileViewChange('editor')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">{title || 'Content Properties'}</Typography>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Content Status</Typography>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentDraft['status'])}
            >
              <FormControlLabel value="draft" control={<Radio />} label="Draft" />
              <FormControlLabel value="review" control={<Radio />} label="In Review" />
              <FormControlLabel value="approved" control={<Radio />} label="Approved" />
              <FormControlLabel value="published" control={<Radio />} label="Published" />
            </RadioGroup>
          </FormControl>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Topics</Typography>
          <Autocomplete
            multiple
            size="small"
            options={availableTopics.map(topic => topic.name)}
            value={topics}
            onChange={(_, newValue) => setTopics(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Select Topics"
                placeholder="Add Topic"
              />
            )}
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Tags</Typography>
          <Box sx={{ display: 'flex', mb: 1 }}>
            <TextField
              fullWidth
              size="small"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="Add Tag"
              sx={{ flexGrow: 1, mr: 1 }}
            />
            <Button onClick={handleAddTag} variant="outlined" size="small">Add</Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {tags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleDeleteTag(tag)}
                size="small"
              />
            ))}
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Collaborators</Typography>
          <Button
            variant="text"
            startIcon={showCollaborators ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowCollaborators(!showCollaborators)}
            sx={{ mb: 1 }}
          >
            {showCollaborators ? 'Hide Collaborators' : 'Show Collaborators'}
          </Button>
          
          <Collapse in={showCollaborators}>
            <Box sx={{ mb: 2 }}>
              {mockCollaborators.map(user => (
                <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box 
                    sx={{ 
                      width: 30, 
                      height: 30, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.main', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1
                    }}
                  >
                    {user.avatar}
                  </Box>
                  <Box>
                    <Typography variant="body2">{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.role}</Typography>
                  </Box>
                </Box>
              ))}
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonAddIcon />}
                sx={{ mt: 1 }}
              >
                Add Collaborator
              </Button>
            </Box>
          </Collapse>
        </Box>
        
        <Divider sx={{ my: 2 }} />
      </Box>
      
      <Box sx={{ pt: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{ mb: 2 }}
        >
          Save Content
        </Button>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ScheduleIcon />}
              onClick={handleSchedule}
              size="small"
            >
              Schedule
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ScienceIcon />}
              onClick={handleCreateABTest}
              disabled={!isEditing}
              size="small"
            >
              A/B Test
            </Button>
          </Grid>
          {isEditing && (
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                color="info"
                startIcon={<BarChartIcon />}
                onClick={() => navigate(`/content/${id}/performance`)}
                size="small"
              >
                View Performance
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );

  // Desktop view
  const renderDesktopView = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={sidebarOpen ? 8 : 12}>
        {/* Main content editor area */}
        <Paper 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            mb: 3,
            transition: 'all 0.3s ease',
            position: 'relative'
          }}
        >
          {!sidebarOpen && (
            <IconButton 
              onClick={() => setSidebarOpen(true)}
              sx={{ 
                position: 'absolute', 
                top: 8, 
                right: 8,
                bgcolor: 'background.paper',
                boxShadow: 1,
                zIndex: 10
              }}
              size="small"
              aria-label="Open sidebar"
            >
              <MenuOpenIcon />
            </IconButton>
          )}
          
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 3 }}
            error={formError === 'Title is required'}
            helperText={formError === 'Title is required' ? formError : ''}
            inputProps={{
              'aria-label': 'Content title'
            }}
          />
          
          <FormLabel id="content-editor-label">Content</FormLabel>
          <RichTextEditor 
            value={body} 
            onChange={setBody}
            error={formError === 'Content body is required'}
            helperText={formError === 'Content body is required' ? formError : ''}
            brandName={mockBrandInfo.name}
          />
          
          {/* Help panel for editor tips */}
          <Collapse in={helpOpen}>
            <Box 
              sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: 'info.lighter', 
                borderRadius: 1,
                position: 'relative'
              }}
            >
              <IconButton 
                size="small" 
                sx={{ position: 'absolute', top: 8, right: 8 }}
                onClick={toggleHelp}
                aria-label="Close help"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
              
              <Typography variant="subtitle1" gutterBottom>
                Editor Tips
              </Typography>
              
              <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                <Box component="li">Use keyboard shortcuts: Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline</Box>
                <Box component="li">Add formatting using the toolbar at the top of the editor</Box>
                <Box component="li">View AI suggestions in the right sidebar panel</Box>
                <Box component="li">Check SEO tips for better content performance</Box>
                <Box component="li">Add comments to collaborate with team members</Box>
              </Box>
            </Box>
          </Collapse>
        </Paper>
      </Grid>
      
      {sidebarOpen && (
        <Grid item xs={12} md={4}>
          {/* Sidebar with metadata and actions */}
          <Paper 
            sx={{ 
              p: { xs: 2, sm: 3 }, 
              mb: 3,
              position: 'relative'
            }}
          >
            <IconButton 
              onClick={() => setSidebarOpen(false)}
              sx={{ 
                position: 'absolute', 
                top: 8, 
                right: 8 
              }}
              size="small"
              aria-label="Close sidebar"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            
            <Typography variant="h6" gutterBottom>Content Status</Typography>
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <RadioGroup
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentDraft['status'])}
                aria-labelledby="content-status-label"
              >
                <FormControlLabel value="draft" control={<Radio />} label="Draft" />
                <FormControlLabel value="review" control={<Radio />} label="In Review" />
                <FormControlLabel value="approved" control={<Radio />} label="Approved" />
                <FormControlLabel value="published" control={<Radio />} label="Published" />
              </RadioGroup>
            </FormControl>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>Topics</Typography>
            <Autocomplete
              multiple
              options={availableTopics.map(topic => topic.name)}
              value={topics}
              onChange={(_, newValue) => setTopics(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Select Topics"
                  placeholder="Add Topic"
                />
              )}
              sx={{ mb: 3 }}
            />
            
            <Typography variant="h6" gutterBottom>Tags</Typography>
            <Box sx={{ display: 'flex', mb: 2 }}>
              <TextField
                fullWidth
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add Tag"
                size="small"
                sx={{ flexGrow: 1, mr: 1 }}
              />
              <Button 
                onClick={handleAddTag} 
                variant="outlined"
                aria-label="Add tag"
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {tags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleDeleteTag(tag)}
                  size="small"
                />
              ))}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Collaborators</Typography>
              
              {mockCollaborators.map(user => (
                <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.main', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1
                    }}
                  >
                    {user.avatar}
                  </Box>
                  <Box>
                    <Typography variant="body2">{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.role}</Typography>
                  </Box>
                </Box>
              ))}
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonAddIcon />}
                sx={{ mt: 1 }}
                aria-label="Add collaborator"
              >
                Add Collaborator
              </Button>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Action buttons */}
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              sx={{ mb: 2 }}
              aria-label="Save content"
            >
              Save Content
            </Button>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Tooltip title="Schedule content for publishing">
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ScheduleIcon />}
                    onClick={handleSchedule}
                    aria-label="Schedule content"
                  >
                    Schedule
                  </Button>
                </Tooltip>
              </Grid>
              <Grid item xs={6}>
                <Tooltip title="Create A/B test for this content">
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ScienceIcon />}
                    onClick={handleCreateABTest}
                    disabled={!isEditing}
                    aria-label="Create A/B test"
                  >
                    A/B Test
                  </Button>
                </Tooltip>
              </Grid>
              {isEditing && (
                <Grid item xs={12}>
                  <Tooltip title="View content performance">
                    <Button
                      fullWidth
                      variant="outlined"
                      color="info"
                      startIcon={<BarChartIcon />}
                      onClick={() => navigate(`/content/${id}/performance`)}
                      aria-label="View performance"
                    >
                      View Performance
                    </Button>
                  </Tooltip>
                </Grid>
              )}
            </Grid>
            
            <Button
              fullWidth
              variant="text"
              startIcon={<HelpIcon />}
              onClick={toggleHelp}
              sx={{ mt: 2 }}
              aria-label="Show editor help"
            >
              Editor Help
            </Button>
          </Paper>
        </Grid>
      )}
    </Grid>
  );

  return (
    <Box 
      sx={{ 
        p: { xs: 1, sm: 2, md: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden' // Prevent page overflow
      }}
    >
      {/* Responsive App Bar */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: { xs: 1, sm: 2, md: 3 },
          backgroundColor: theme.palette.background.paper,
          borderRadius: 1,
          p: 1
        }}
      >
        <IconButton 
          onClick={handleBack} 
          sx={{ mr: 1 }}
          edge="start"
          aria-label="Back to content list"
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h1"
          sx={{
            flexGrow: 1,
            // Truncate long titles on mobile
            whiteSpace: isSmall ? 'nowrap' : 'normal',
            overflow: isSmall ? 'hidden' : 'visible',
            textOverflow: isSmall ? 'ellipsis' : 'clip'
          }}
        >
          {isEditing ? 'Edit Content' : 'Create New Content'}
        </Typography>
        
        {!isSmall && (
          <Box sx={{ display: 'flex' }}>
            <Button 
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              aria-label="Save content"
            >
              Save
            </Button>
          </Box>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {isMobile ? (
            <Box sx={{ height: '100%' }}>
              {mobileView === 'editor' ? renderMobileEditor() : renderMobileMetadata()}
            </Box>
          ) : (
            renderDesktopView()
          )}
        </Box>
      )}
      
      {/* Mobile fab for quick saving */}
      {isMobile && mobileView === 'editor' && (
        <Fab 
          color="primary" 
          aria-label="Save content"
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            zIndex: theme.zIndex.fab
          }}
          onClick={handleSave}
        >
          <SaveIcon />
        </Fab>
      )}
      
      {/* Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setSnackbarOpen(false)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};

export default ContentEditor;