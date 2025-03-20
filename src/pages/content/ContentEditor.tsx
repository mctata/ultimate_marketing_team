import { useState, useEffect } from 'react';
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
  Tooltip
} from '@mui/material';
import { 
  Save as SaveIcon, 
  ArrowBack as ArrowBackIcon, 
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Science as ScienceIcon,
  BarChart as BarChartIcon
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
      } else {
        // For new content, we need to add brand_id and author_id (using placeholder values)
        const newDraft = {
          ...draftData,
          brand_id: 'current-brand-id', // This would come from context or state
          author_id: 'current-user-id', // This would come from auth context
        } as Omit<ContentDraft, 'id' | 'created_at' | 'updated_at'>;
        
        await dispatch(createDraft(newDraft)).unwrap();
      }
      navigate('/content');
    } catch (err) {
      setFormError('Failed to save content. Please try again.');
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
      // First save, then navigate
      setFormError('Please save the content before creating A/B tests');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEditing ? 'Edit Content' : 'Create New Content'}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* Main content editor area */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <TextField
                fullWidth
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 3 }}
                error={formError === 'Title is required'}
                helperText={formError === 'Title is required' ? formError : ''}
              />
              
              <FormLabel>Content</FormLabel>
              <RichTextEditor 
                value={body} 
                onChange={setBody}
                error={formError === 'Content body is required'}
                helperText={formError === 'Content body is required' ? formError : ''}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            {/* Sidebar with metadata and actions */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Content Status</Typography>
              <FormControl component="fieldset" sx={{ mb: 3 }}>
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
                <Button onClick={handleAddTag} variant="outlined">Add</Button>
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
              
              {/* Action buttons */}
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
                  <Tooltip title="Schedule content for publishing">
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ScheduleIcon />}
                      onClick={handleSchedule}
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
                      >
                        View Performance
                      </Button>
                    </Tooltip>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ContentEditor;