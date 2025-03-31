import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Add as AddIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { AppDispatch } from '../../store';
import {
  fetchAdSetById,
  updateAdSet,
  fetchAds,
  selectSelectedAdSet,
  selectAds,
  selectAdsLoading,
  fetchCampaignById,
  selectSelectedCampaign,
} from '../../store/slices/campaignSlice';
import { format } from 'date-fns';
import AdList from './AdList';
import AdEditor from './AdEditor';

// Tab panel component for switching between different sections
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
      id={`ad-set-tabpanel-${index}`}
      aria-labelledby={`ad-set-tab-${index}`}
      {...other}
      style={{ padding: '20px 0' }}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdSetDetail = () => {
  const { campaignId, adSetId } = useParams<{ campaignId: string; adSetId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const adSet = useSelector(selectSelectedAdSet);
  const campaign = useSelector(selectSelectedCampaign);
  const ads = useSelector(selectAds);
  const adsLoading = useSelector(selectAdsLoading);
  
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  
  // Fetch adSet and ads on component mount
  useEffect(() => {
    if (campaignId && adSetId) {
      dispatch(fetchCampaignById(campaignId));
      dispatch(fetchAdSetById({ campaignId, adSetId }));
      dispatch(fetchAds({ campaignId, adSetId }));
    }
  }, [dispatch, campaignId, adSetId]);
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleBackClick = () => {
    navigate(`/campaigns/${campaignId}`);
  };
  
  const handleToggleStatus = () => {
    if (adSet && campaignId) {
      const newStatus = adSet.status === 'active' ? 'paused' : 'active';
      dispatch(updateAdSet({
        campaignId,
        adSetId: adSet.id,
        adSet: { status: newStatus }
      }));
    }
  };
  
  const handleEdit = () => {
    setIsEditing(true);
    setTabValue(1); // Switch to settings tab
  };
  
  const handleCreateAd = () => {
    setIsCreatingAd(true);
    setEditingAdId(null);
    setTabValue(2); // Switch to ad creation tab
  };
  
  const handleEditAd = (adId: string) => {
    setIsCreatingAd(true);
    setEditingAdId(adId);
    setTabValue(2); // Switch to ad creation tab
  };
  
  const handleAdSaved = () => {
    setIsCreatingAd(false);
    setEditingAdId(null);
    setTabValue(0); // Return to ads tab
    
    // Refresh the ads list
    if (campaignId && adSetId) {
      dispatch(fetchAds({ campaignId, adSetId }));
    }
  };
  
  const handleAdCancelled = () => {
    setIsCreatingAd(false);
    setEditingAdId(null);
    setTabValue(0); // Return to ads tab
  };
  
  if (!adSet || !campaign) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const getTotalAdsCount = () => ads.length;
  const getActiveAdsCount = () => ads.filter(ad => ad.status === 'active').length;
  const getPausedAdsCount = () => ads.filter(ad => ad.status === 'paused').length;
  const getRejectedAdsCount = () => ads.filter(ad => ad.status === 'rejected').length;
  
  const getAveragePerformance = (metric: string) => {
    if (ads.length === 0) return 0;
    return ads.reduce((sum, ad) => sum + (ad.performance[metric] || 0), 0) / ads.length;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with back button and title */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBackClick} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Ad Set: {adSet.name}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Chip 
          label={adSet.status.charAt(0).toUpperCase() + adSet.status.slice(1)} 
          color={adSet.status === 'active' ? 'success' : 'warning'}
          sx={{ mx: 1 }}
        />
        <Button
          variant="outlined"
          startIcon={adSet.status === 'active' ? <PauseIcon /> : <PlayArrowIcon />}
          onClick={handleToggleStatus}
          color={adSet.status === 'active' ? 'warning' : 'success'}
          sx={{ mr: 1 }}
        >
          {adSet.status === 'active' ? 'Pause' : 'Activate'}
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleEdit}
        >
          Edit
        </Button>
      </Box>

      {/* Campaign context */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" color="textSecondary">Campaign</Typography>
        <Typography variant="body1" fontWeight="medium">{campaign.name}</Typography>
      </Paper>
      
      {/* Stats cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Ads</Typography>
              <Typography variant="h4">{getTotalAdsCount()}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip 
                  size="small" 
                  color="success" 
                  label={`${getActiveAdsCount()} active`} 
                />
                <Chip 
                  size="small" 
                  color="warning" 
                  label={`${getPausedAdsCount()} paused`} 
                />
                {getRejectedAdsCount() > 0 && (
                  <Chip 
                    size="small" 
                    color="error" 
                    label={`${getRejectedAdsCount()} rejected`} 
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Avg. CTR</Typography>
              <Typography variant="h4">
                {(getAveragePerformance('ctr') * 100).toFixed(2)}%
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Industry avg: 1.91%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Avg. CPC</Typography>
              <Typography variant="h4">
                ${getAveragePerformance('cpc').toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Budget: ${adSet.budget.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Conversions</Typography>
              <Typography variant="h4">
                {Math.round(getAveragePerformance('conversions'))}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Conv. rate: {(getAveragePerformance('conversion_rate') * 100).toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs for different sections */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Ads" id="ad-set-tab-0" />
          <Tab label="Settings" id="ad-set-tab-1" />
          {isCreatingAd && <Tab label={editingAdId ? "Edit Ad" : "Create Ad"} id="ad-set-tab-2" />}
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Manage Ads</Typography>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  sx={{ mr: 1 }}
                  onClick={() => console.log('Duplicate functionality would go here')}
                >
                  Duplicate Ad
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateAd}
                >
                  Create New Ad
                </Button>
              </Box>
            </Box>
            
            {adsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <AdList 
                ads={ads}
                campaignId={campaignId!}
                adSetId={adSetId!}
                onEditAd={handleEditAd}
              />
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" sx={{ mb: 3 }}>Ad Set Settings</Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ad Set Name"
                  value={adSet.name}
                  disabled={!isEditing}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Budget"
                  type="number"
                  value={adSet.budget}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={adSet.status}
                  disabled={!isEditing}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="paused">Paused</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={adSet.start_date.split('T')[0]}
                  disabled={!isEditing}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={adSet.end_date ? adSet.end_date.split('T')[0] : ''}
                  disabled={!isEditing}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Targeting</Typography>
                
                <Paper sx={{ p: 2 }}>
                  {Object.entries(adSet.targeting).map(([key, value]) => (
                    <Box key={key} sx={{ mb: 1 }}>
                      <Typography variant="body2" color="textSecondary">{key}</Typography>
                      <Typography variant="body1">{JSON.stringify(value)}</Typography>
                    </Box>
                  ))}
                </Paper>
              </Grid>
              
              {isEditing && (
                <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    sx={{ mr: 1 }}
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setIsEditing(false)}
                  >
                    Save Changes
                  </Button>
                </Grid>
              )}
            </Grid>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            {isCreatingAd && (
              <AdEditor
                campaignId={campaignId!}
                adSetId={adSetId!}
                adId={editingAdId}
                onSave={handleAdSaved}
                onCancel={handleAdCancelled}
              />
            )}
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdSetDetail;