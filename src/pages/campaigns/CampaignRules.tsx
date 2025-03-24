import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Campaign as CampaignIcon,
  Settings as SettingsIcon,
  AutoFixHigh as AutoFixHighIcon,
  NotificationsActive as NotificationsActiveIcon,
  Build as BuildIcon
} from '@mui/icons-material';

import { AppDispatch } from '../../store';
import { fetchCampaignById, selectSelectedCampaign, selectCampaignsLoading } from '../../store/slices/campaignSlice';
import CampaignRulesList from '../../components/campaigns/CampaignRulesList';

const CampaignRules = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const campaign = useSelector(selectSelectedCampaign);
  const loading = useSelector(selectCampaignsLoading);
  
  const [activeTab, setActiveTab] = useState(0);
  
  useEffect(() => {
    if (id) {
      dispatch(fetchCampaignById(id));
    }
  }, [dispatch, id]);
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleBackToCampaign = () => {
    navigate(`/campaigns/${id}`);
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={handleBackToCampaign} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Breadcrumbs aria-label="breadcrumb">
            <Link 
              color="inherit" 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                navigate('/campaigns');
              }}
            >
              Campaigns
            </Link>
            <Link
              color="inherit"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(`/campaigns/${id}`);
              }}
            >
              {campaign?.name || 'Campaign Details'}
            </Link>
            <Typography color="text.primary">Automation Rules</Typography>
          </Breadcrumbs>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Campaign Automation Rules
            </Typography>
            {campaign && (
              <Typography variant="subtitle1" color="text.secondary">
                {campaign.name}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : !campaign ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Campaign not found.
        </Alert>
      ) : (
        <>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Typography variant="h6" gutterBottom>
                  What are Campaign Automation Rules?
                </Typography>
                <Typography variant="body1" paragraph>
                  Automation rules help you manage campaigns without manual intervention. Set conditions to trigger actions when specific performance metrics are met or at scheduled times.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: 200 }}>
                    <AutoFixHighIcon color="primary" />
                    <Typography variant="body2">
                      <strong>Automate</strong> campaign management based on performance
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: 200 }}>
                    <NotificationsActiveIcon color="primary" />
                    <Typography variant="body2">
                      <strong>Receive alerts</strong> when metrics cross thresholds
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: 200 }}>
                    <BuildIcon color="primary" />
                    <Typography variant="body2">
                      <strong>Schedule actions</strong> like budget adjustments
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Campaign Details
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">Status:</Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body2">{campaign.status}</Typography>
                    </Grid>
                    
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">Platform:</Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body2">{campaign.platform}</Typography>
                    </Grid>
                    
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">Budget:</Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body2">${campaign.budget?.toLocaleString() || 'N/A'}</Typography>
                    </Grid>
                    
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">Start Date:</Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body2">{new Date(campaign.start_date).toLocaleDateString()}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
          
          <Divider sx={{ my: 4 }} />
          
          <CampaignRulesList campaignId={id || ''} />
        </>
      )}
    </Container>
  );
};

export default CampaignRules;