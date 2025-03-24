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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormHelperText,
  Autocomplete,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Card,
  CardContent
} from '@mui/material';
import { 
  Save as SaveIcon, 
  ArrowBack as ArrowBackIcon, 
  PlayArrow as PlayArrowIcon,
  BarChart as BarChartIcon,
  Add as AddIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { AppDispatch } from '../../store';
import {
  fetchCampaignById,
  createCampaign,
  updateCampaign,
  fetchAdSets,
  createAdSet,
  selectSelectedCampaign,
  selectCampaignsLoading,
  selectAdSets
} from '../../store/slices/campaignSlice';
import { fetchDrafts, selectDrafts } from '../../store/slices/contentSlice';
import { Campaign, AdSet, Ad } from '../../services/campaignService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays } from 'date-fns';

const platforms = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'google', label: 'Google Ads' },
];

// Mock audience targeting options
const ageRanges = [
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55-64', label: '55-64' },
  { value: '65+', label: '65+' },
];

const genders = [
  { value: 'all', label: 'All Genders' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const interests = [
  'Technology', 'Sports', 'Fashion', 'Travel', 'Food', 'Fitness', 
  'Music', 'Movies', 'Art', 'Education', 'Business', 'Politics',
  'Gaming', 'Home & Garden', 'Pets', 'Health', 'Beauty', 'Automotive'
];

const CampaignEditor = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== 'new';
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const campaign = useSelector(selectSelectedCampaign);
  const loading = useSelector(selectCampaignsLoading);
  const adSets = useSelector(selectAdSets);
  const contentDrafts = useSelector(selectDrafts);
  
  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [formError, setFormError] = useState<string>('');
  
  // Campaign form state
  const [campaignForm, setCampaignForm] = useState<{
    name: string;
    description: string;
    status: Campaign['status'];
    platform: string;
    budget: number | '';
    start_date: Date | null;
    end_date: Date | null;
    target_audience: {
      age_ranges: string[];
      genders: string[];
      interests: string[];
      locations: string[];
    };
    content_ids: string[];
  }>({
    name: '',
    description: '',
    status: 'draft',
    platform: 'facebook',
    budget: '',
    start_date: new Date(),
    end_date: addDays(new Date(), 30),
    target_audience: {
      age_ranges: ['25-34', '35-44'],
      genders: ['all'],
      interests: [],
      locations: [],
    },
    content_ids: [],
  });
  
  // Ad Set form state
  const [adSetForm, setAdSetForm] = useState<{
    name: string;
    status: AdSet['status'];
    budget: number | '';
  }>({
    name: '',
    status: 'active',
    budget: '',
  });
  
  // Ad form state
  const [adForms, setAdForms] = useState<{
    content_id: string;
    headline: string;
    description: string;
    call_to_action: string;
    url: string;
  }[]>([
    {
      content_id: '',
      headline: '',
      description: '',
      call_to_action: 'Learn More',
      url: '',
    }
  ]);
  
  // Fetch data on component mount
  useEffect(() => {
    // Fetch available content
    dispatch(fetchDrafts({ status: 'approved' }));
    
    if (isEditing && id) {
      dispatch(fetchCampaignById(id)).then(() => {
        // Fetch ad sets if campaign loaded successfully
        dispatch(fetchAdSets(id));
      });
    }
  }, [dispatch, id, isEditing]);
  
  // Initialize form with campaign data when editing
  useEffect(() => {
    if (campaign && isEditing) {
      setCampaignForm({
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        platform: campaign.platform,
        budget: campaign.budget,
        start_date: new Date(campaign.start_date),
        end_date: campaign.end_date ? new Date(campaign.end_date) : null,
        target_audience: campaign.target_audience || {
          age_ranges: ['25-34', '35-44'],
          genders: ['all'],
          interests: [],
          locations: [],
        },
        content_ids: campaign.content_ids || [],
      });
    }
  }, [campaign, isEditing]);
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleCampaignInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setCampaignForm(prev => ({
      ...prev,
      [name as string]: value,
    }));
  };
  
  const handleAudienceChange = (name: string, value: any) => {
    setCampaignForm(prev => ({
      ...prev,
      target_audience: {
        ...prev.target_audience,
        [name]: value,
      },
    }));
  };
  
  const handleContentSelection = (event: React.SyntheticEvent, value: any) => {
    setCampaignForm(prev => ({
      ...prev,
      content_ids: value.map((item: any) => item.id),
    }));
  };
  
  const handleAdSetInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setAdSetForm(prev => ({
      ...prev,
      [name as string]: value,
    }));
  };
  
  const handleAdInputChange = (index: number, name: string, value: any) => {
    const updatedAdForms = [...adForms];
    updatedAdForms[index] = {
      ...updatedAdForms[index],
      [name]: value,
    };
    setAdForms(updatedAdForms);
  };
  
  const handleAddAd = () => {
    setAdForms([
      ...adForms,
      {
        content_id: '',
        headline: '',
        description: '',
        call_to_action: 'Learn More',
        url: '',
      }
    ]);
  };
  
  const handleRemoveAd = (index: number) => {
    if (adForms.length > 1) {
      setAdForms(adForms.filter((_, i) => i !== index));
    }
  };
  
  const validateCampaignForm = () => {
    if (!campaignForm.name.trim()) {
      setFormError('Campaign name is required');
      return false;
    }
    if (!campaignForm.platform) {
      setFormError('Platform is required');
      return false;
    }
    if (!campaignForm.budget) {
      setFormError('Budget is required');
      return false;
    }
    if (!campaignForm.start_date) {
      setFormError('Start date is required');
      return false;
    }
    return true;
  };
  
  const validateAdSetForm = () => {
    if (!adSetForm.name.trim()) {
      setFormError('Ad set name is required');
      return false;
    }
    if (!adSetForm.budget) {
      setFormError('Ad set budget is required');
      return false;
    }
    return true;
  };
  
  const handleNextStep = () => {
    if (activeStep === 0) {
      // Validate campaign form before moving to next step
      if (!validateCampaignForm()) {
        return;
      }
    } else if (activeStep === 1) {
      // Validate ad set form before moving to next step
      if (!validateAdSetForm()) {
        return;
      }
    }
    
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };
  
  const handleBackStep = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };
  
  const handleSaveCampaign = async () => {
    if (!validateCampaignForm()) return;
    
    try {
      const campaignData = {
        name: campaignForm.name,
        description: campaignForm.description,
        status: campaignForm.status,
        platform: campaignForm.platform,
        budget: Number(campaignForm.budget),
        start_date: campaignForm.start_date ? format(campaignForm.start_date, 'yyyy-MM-dd') : '',
        end_date: campaignForm.end_date ? format(campaignForm.end_date, 'yyyy-MM-dd') : '',
        target_audience: campaignForm.target_audience,
        content_ids: campaignForm.content_ids,
        brand_id: 'current-brand-id', // This would come from context or state
      };
      
      if (isEditing && id) {
        await dispatch(updateCampaign({ id, campaign: campaignData })).unwrap();
      } else {
        await dispatch(createCampaign(campaignData as any)).unwrap();
      }
      
      navigate('/campaigns');
    } catch (err) {
      setFormError('Failed to save campaign. Please try again.');
    }
  };
  
  const handleCreateAdSet = async () => {
    if (!validateAdSetForm()) return;
    
    if (!isEditing || !id || !campaign) {
      setFormError('Please save the campaign first before creating ad sets');
      return;
    }
    
    try {
      const adSetData = {
        name: adSetForm.name,
        status: adSetForm.status,
        budget: Number(adSetForm.budget),
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        targeting: campaignForm.target_audience,
      };
      
      await dispatch(createAdSet({
        campaignId: id,
        adSet: adSetData,
      })).unwrap();
      
      // Reset form after successful creation
      setAdSetForm({
        name: '',
        status: 'active',
        budget: '',
      });
      
      setFormError('');
    } catch (err) {
      setFormError('Failed to create ad set. Please try again.');
    }
  };
  
  const handleLaunchCampaign = () => {
    if (isEditing && id) {
      // In a real app, this would dispatch an action to update the campaign status
      console.log(`Launching campaign ${id}`);
    }
  };
  
  // Get selected content items for campaign setup
  const getSelectedContent = () => {
    if (!campaignForm.content_ids || !contentDrafts.length) return [];
    
    return contentDrafts.filter(draft => 
      campaignForm.content_ids.includes(draft.id)
    );
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/campaigns')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEditing ? 'Edit Campaign' : 'Create New Campaign'}
        </Typography>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {isEditing ? (
            <Box sx={{ mb: 3 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Campaign Details" />
                <Tab label="Ad Sets" />
                <Tab label="Ads" />
                <Tab label="Preview" />
              </Tabs>
              
              <Divider sx={{ mb: 3 }} />
              
              {/* Campaign Details Tab */}
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                      {formError && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                          {formError}
                        </Alert>
                      )}
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Campaign Name"
                            name="name"
                            value={campaignForm.name}
                            onChange={handleCampaignInputChange}
                            required
                            error={formError === 'Campaign name is required'}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            value={campaignForm.description}
                            onChange={handleCampaignInputChange}
                            multiline
                            rows={2}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth required error={formError === 'Platform is required'}>
                            <InputLabel>Platform</InputLabel>
                            <Select
                              name="platform"
                              value={campaignForm.platform}
                              label="Platform"
                              onChange={handleCampaignInputChange}
                            >
                              {platforms.map(platform => (
                                <MenuItem key={platform.value} value={platform.value}>
                                  {platform.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth required error={formError === 'Budget is required'}>
                            <TextField
                              label="Budget"
                              name="budget"
                              value={campaignForm.budget}
                              onChange={handleCampaignInputChange}
                              type="number"
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                            />
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                              label="Start Date"
                              value={campaignForm.start_date}
                              onChange={(value) => setCampaignForm(prev => ({ ...prev, start_date: value }))}
                              sx={{ width: '100%' }}
                            />
                          </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                              label="End Date"
                              value={campaignForm.end_date}
                              onChange={(value) => setCampaignForm(prev => ({ ...prev, end_date: value }))}
                              sx={{ width: '100%' }}
                            />
                          </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                              name="status"
                              value={campaignForm.status}
                              label="Status"
                              onChange={handleCampaignInputChange}
                            >
                              <MenuItem value="draft">Draft</MenuItem>
                              <MenuItem value="active">Active</MenuItem>
                              <MenuItem value="paused">Paused</MenuItem>
                              <MenuItem value="completed">Completed</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Paper>
                    
                    <Paper sx={{ p: 3, mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Target Audience
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Age Ranges</InputLabel>
                            <Select
                              multiple
                              value={campaignForm.target_audience.age_ranges}
                              onChange={(e) => handleAudienceChange('age_ranges', e.target.value)}
                              label="Age Ranges"
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {(selected as string[]).map((value) => (
                                    <Chip key={value} label={value} />
                                  ))}
                                </Box>
                              )}
                            >
                              {ageRanges.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Gender</InputLabel>
                            <Select
                              multiple
                              value={campaignForm.target_audience.genders}
                              onChange={(e) => handleAudienceChange('genders', e.target.value)}
                              label="Gender"
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {(selected as string[]).map((value) => (
                                    <Chip key={value} label={value} />
                                  ))}
                                </Box>
                              )}
                            >
                              {genders.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <Autocomplete
                            multiple
                            options={interests}
                            value={campaignForm.target_audience.interests}
                            onChange={(_, value) => handleAudienceChange('interests', value)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Interests"
                                placeholder="Add interests"
                                fullWidth
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Autocomplete
                            multiple
                            freeSolo
                            options={[]}
                            value={campaignForm.target_audience.locations}
                            onChange={(_, value) => handleAudienceChange('locations', value)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Locations"
                                placeholder="Add locations"
                                fullWidth
                              />
                            )}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                    
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Content Selection
                      </Typography>
                      <Autocomplete
                        multiple
                        options={contentDrafts}
                        getOptionLabel={(option) => option.title}
                        value={getSelectedContent()}
                        onChange={handleContentSelection}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Select Content"
                            placeholder="Choose content to use in this campaign"
                            fullWidth
                          />
                        )}
                      />
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Campaign Summary
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Platform
                        </Typography>
                        <Typography variant="body1">
                          {platforms.find(p => p.value === campaignForm.platform)?.label || campaignForm.platform}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Budget
                        </Typography>
                        <Typography variant="body1">
                          ${campaignForm.budget ? Number(campaignForm.budget).toLocaleString() : 0}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Date Range
                        </Typography>
                        <Typography variant="body1">
                          {campaignForm.start_date ? format(campaignForm.start_date, 'MM/dd/yyyy') : 'N/A'} - 
                          {campaignForm.end_date ? format(campaignForm.end_date, 'MM/dd/yyyy') : 'Ongoing'}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Status
                        </Typography>
                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                          {campaignForm.status}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveCampaign}
                          fullWidth
                        >
                          Save Campaign
                        </Button>
                        {campaignForm.status !== 'active' && (
                          <Button
                            variant="outlined"
                            color="success"
                            startIcon={<PlayArrowIcon />}
                            onClick={handleLaunchCampaign}
                            fullWidth
                            disabled={!isEditing}
                          >
                            Launch Campaign
                          </Button>
                        )}
                        <Button
                          variant="outlined"
                          color="info"
                          startIcon={<BarChartIcon />}
                          onClick={() => isEditing && id && navigate(`/campaigns/${id}/metrics`)}
                          fullWidth
                          disabled={!isEditing}
                        >
                          View Metrics
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              )}
              
              {/* Ad Sets Tab */}
              {activeTab === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Ad Sets
                      </Typography>
                      {formError && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                          {formError}
                        </Alert>
                      )}
                      
                      {adSets.length > 0 ? (
                        <Grid container spacing={2}>
                          {adSets.map((adSet) => (
                            <Grid item xs={12} key={adSet.id}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6">{adSet.name}</Typography>
                                    <Chip 
                                      label={adSet.status}
                                      color={adSet.status === 'active' ? 'success' : 'default'}
                                      size="small"
                                    />
                                  </Box>
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" color="textSecondary">
                                      Budget: ${adSet.budget.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                      Date Range: {format(new Date(adSet.start_date), 'MM/dd/yyyy')} - 
                                      {adSet.end_date ? format(new Date(adSet.end_date), 'MM/dd/yyyy') : 'Ongoing'}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                      Ads: {adSet.ads?.length || 0}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                    <Button 
                                      size="small" 
                                      variant="outlined"
                                      onClick={() => navigate(`/campaigns/${id}/adsets/${adSet.id}`)}
                                    >
                                      View Details
                                    </Button>
                                    <Button 
                                      size="small" 
                                      variant="outlined" 
                                      color="primary"
                                      startIcon={<ContentCopyIcon />}
                                    >
                                      Duplicate
                                    </Button>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Alert severity="info" sx={{ mb: 3 }}>
                          No ad sets have been created for this campaign yet.
                        </Alert>
                      )}
                      
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Create New Ad Set
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Ad Set Name"
                              name="name"
                              value={adSetForm.name}
                              onChange={handleAdSetInputChange}
                              required
                              error={formError === 'Ad set name is required'}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel>Status</InputLabel>
                              <Select
                                name="status"
                                value={adSetForm.status}
                                label="Status"
                                onChange={handleAdSetInputChange}
                              >
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="paused">Paused</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Budget"
                              name="budget"
                              value={adSetForm.budget}
                              onChange={handleAdSetInputChange}
                              type="number"
                              required
                              error={formError === 'Ad set budget is required'}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleCreateAdSet}
                            >
                              Create Ad Set
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Ad Set Tips
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Ad sets are groups of ads that share the same budget, schedule, and targeting. Use ad sets to organize your ads by audience.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Best practices:
                      </Typography>
                      <ul>
                        <li>
                          <Typography variant="body2">
                            Create separate ad sets for different audience segments
                          </Typography>
                        </li>
                        <li>
                          <Typography variant="body2">
                            Test different budget allocations between ad sets
                          </Typography>
                        </li>
                        <li>
                          <Typography variant="body2">
                            Monitor performance and adjust budgets accordingly
                          </Typography>
                        </li>
                      </ul>
                    </Paper>
                  </Grid>
                </Grid>
              )}
              
              {/* Ads Tab */}
              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Select an Ad Set to manage its ads
                  </Typography>
                  {adSets.length > 0 ? (
                    <Grid container spacing={2}>
                      {adSets.map((adSet) => (
                        <Grid item xs={12} sm={6} md={4} key={adSet.id}>
                          <Card 
                            variant="outlined" 
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { 
                                boxShadow: 3 
                              }
                            }}
                            onClick={() => navigate(`/campaigns/${id}/adsets/${adSet.id}`)}
                          >
                            <CardContent>
                              <Typography variant="h6">{adSet.name}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                Ads: {adSet.ads?.length || 0}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Budget: ${adSet.budget.toLocaleString()}
                              </Typography>
                              <Box sx={{ mt: 2 }}>
                                <Button 
                                  size="small" 
                                  variant="outlined"
                                >
                                  Manage Ads
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Alert severity="info">
                      You need to create ad sets before you can create ads. Go to the Ad Sets tab to create your first ad set.
                    </Alert>
                  )}
                </Box>
              )}
              
              {/* Preview Tab */}
              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Campaign Preview
                  </Typography>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    This is a preview of how your campaign will appear on {campaignForm.platform}. The actual appearance may vary.
                  </Alert>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Campaign Summary
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold">Name:</Typography>
                          <Typography variant="body2">{campaignForm.name}</Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold">Description:</Typography>
                          <Typography variant="body2">{campaignForm.description}</Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold">Platform:</Typography>
                          <Typography variant="body2">
                            {platforms.find(p => p.value === campaignForm.platform)?.label || campaignForm.platform}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold">Budget:</Typography>
                          <Typography variant="body2">
                            ${campaignForm.budget ? Number(campaignForm.budget).toLocaleString() : 0}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold">Date Range:</Typography>
                          <Typography variant="body2">
                            {campaignForm.start_date ? format(campaignForm.start_date, 'MM/dd/yyyy') : 'N/A'} - 
                            {campaignForm.end_date ? format(campaignForm.end_date, 'MM/dd/yyyy') : 'Ongoing'}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold">Status:</Typography>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {campaignForm.status}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Audience Overview
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold">Age Ranges:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {campaignForm.target_audience.age_ranges.map((age) => (
                              <Chip key={age} label={age} size="small" />
                            ))}
                          </Box>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold">Genders:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {campaignForm.target_audience.genders.map((gender) => (
                              <Chip key={gender} label={gender} size="small" />
                            ))}
                          </Box>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold">Interests:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {campaignForm.target_audience.interests.map((interest) => (
                              <Chip key={interest} label={interest} size="small" />
                            ))}
                          </Box>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold">Locations:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {campaignForm.target_audience.locations.map((location) => (
                              <Chip key={location} label={location} size="small" />
                            ))}
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Ad Sets & Ads
                        </Typography>
                        {adSets.length > 0 ? (
                          <Grid container spacing={2}>
                            {adSets.map((adSet) => (
                              <Grid item xs={12} key={adSet.id}>
                                <Card variant="outlined" sx={{ mb: 2 }}>
                                  <CardContent>
                                    <Typography variant="subtitle1">
                                      {adSet.name}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                      Budget: ${adSet.budget.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                      Status: {adSet.status}
                                    </Typography>
                                    
                                    {adSet.ads && adSet.ads.length > 0 ? (
                                      <Box sx={{ mt: 2 }}>
                                        <Typography variant="body2" fontWeight="bold">
                                          Ads ({adSet.ads.length}):
                                        </Typography>
                                        <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                          {adSet.ads.map((ad) => (
                                            <Grid item xs={12} sm={6} md={4} key={ad.id}>
                                              <Card variant="outlined">
                                                <CardContent>
                                                  <Typography variant="body2" fontWeight="bold">
                                                    {ad.name}
                                                  </Typography>
                                                  <Typography variant="body2" noWrap>
                                                    {ad.headline}
                                                  </Typography>
                                                </CardContent>
                                              </Card>
                                            </Grid>
                                          ))}
                                        </Grid>
                                      </Box>
                                    ) : (
                                      <Typography variant="body2" sx={{ mt: 1 }}>
                                        No ads created yet.
                                      </Typography>
                                    )}
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        ) : (
                          <Typography variant="body2">
                            No ad sets have been created for this campaign yet.
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          ) : (
            <Paper sx={{ p: 3 }}>
              {formError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {formError}
                </Alert>
              )}
              
              <Stepper activeStep={activeStep} orientation="vertical">
                <Step>
                  <StepLabel>Campaign Setup</StepLabel>
                  <StepContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Campaign Name"
                          name="name"
                          value={campaignForm.name}
                          onChange={handleCampaignInputChange}
                          required
                          error={formError === 'Campaign name is required'}
                          helperText={formError === 'Campaign name is required' ? formError : ''}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Description"
                          name="description"
                          value={campaignForm.description}
                          onChange={handleCampaignInputChange}
                          multiline
                          rows={2}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required error={formError === 'Platform is required'}>
                          <InputLabel>Platform</InputLabel>
                          <Select
                            name="platform"
                            value={campaignForm.platform}
                            label="Platform"
                            onChange={handleCampaignInputChange}
                          >
                            {platforms.map(platform => (
                              <MenuItem key={platform.value} value={platform.value}>
                                {platform.label}
                              </MenuItem>
                            ))}
                          </Select>
                          {formError === 'Platform is required' && (
                            <FormHelperText error>{formError}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Budget"
                          name="budget"
                          value={campaignForm.budget}
                          onChange={handleCampaignInputChange}
                          type="number"
                          required
                          error={formError === 'Budget is required'}
                          helperText={formError === 'Budget is required' ? formError : ''}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DatePicker
                            label="Start Date"
                            value={campaignForm.start_date}
                            onChange={(value) => setCampaignForm(prev => ({ ...prev, start_date: value }))}
                            sx={{ width: '100%' }}
                          />
                        </LocalizationProvider>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DatePicker
                            label="End Date"
                            value={campaignForm.end_date}
                            onChange={(value) => setCampaignForm(prev => ({ ...prev, end_date: value }))}
                            sx={{ width: '100%' }}
                          />
                        </LocalizationProvider>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            onClick={handleNextStep}
                          >
                            Continue
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={handleSaveCampaign}
                          >
                            Save as Draft
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </StepContent>
                </Step>
                
                <Step>
                  <StepLabel>Target Audience</StepLabel>
                  <StepContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Age Ranges</InputLabel>
                          <Select
                            multiple
                            value={campaignForm.target_audience.age_ranges}
                            onChange={(e) => handleAudienceChange('age_ranges', e.target.value)}
                            label="Age Ranges"
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {(selected as string[]).map((value) => (
                                  <Chip key={value} label={value} />
                                ))}
                              </Box>
                            )}
                          >
                            {ageRanges.map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Gender</InputLabel>
                          <Select
                            multiple
                            value={campaignForm.target_audience.genders}
                            onChange={(e) => handleAudienceChange('genders', e.target.value)}
                            label="Gender"
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {(selected as string[]).map((value) => (
                                  <Chip key={value} label={value} />
                                ))}
                              </Box>
                            )}
                          >
                            {genders.map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <Autocomplete
                          multiple
                          options={interests}
                          value={campaignForm.target_audience.interests}
                          onChange={(_, value) => handleAudienceChange('interests', value)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Interests"
                              placeholder="Add interests"
                              fullWidth
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Autocomplete
                          multiple
                          freeSolo
                          options={[]}
                          value={campaignForm.target_audience.locations}
                          onChange={(_, value) => handleAudienceChange('locations', value)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Locations"
                              placeholder="Add locations"
                              fullWidth
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button onClick={handleBackStep}>
                            Back
                          </Button>
                          <Button
                            variant="contained"
                            onClick={handleNextStep}
                          >
                            Continue
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </StepContent>
                </Step>
                
                <Step>
                  <StepLabel>Content Selection</StepLabel>
                  <StepContent>
                    <Autocomplete
                      multiple
                      options={contentDrafts}
                      getOptionLabel={(option) => option.title}
                      value={getSelectedContent()}
                      onChange={handleContentSelection}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Content"
                          placeholder="Choose content to use in this campaign"
                          fullWidth
                        />
                      )}
                    />
                    <Box sx={{ mt: 3, mb: 2 }}>
                      <Typography variant="subtitle1">
                        Selected Content ({getSelectedContent().length})
                      </Typography>
                      {getSelectedContent().length > 0 ? (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {getSelectedContent().map((content) => (
                            <Grid item xs={12} key={content.id}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Typography variant="subtitle1">{content.title}</Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    Status: {content.status}
                                  </Typography>
                                  <Typography variant="body2" noWrap>
                                    {content.body.substring(0, 100)}...
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          No content selected yet. Please select content to use in your campaign.
                        </Alert>
                      )}
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button onClick={handleBackStep}>
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSaveCampaign}
                      >
                        Create Campaign
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
              </Stepper>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default CampaignEditor;