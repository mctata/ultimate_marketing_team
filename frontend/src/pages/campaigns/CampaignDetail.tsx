import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Paper, 
  Tabs, 
  Tab, 
  Divider,
  Breadcrumbs,
  Link
} from '@mui/material';
import { AdSetDetail } from '../../components/campaigns';

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
      id={`campaign-tabpanel-${index}`}
      aria-labelledby={`campaign-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  
  useEffect(() => {
    // Simulate loading campaign data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleBackToList = () => {
    navigate('/campaigns');
  };
  
  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          onClick={handleBackToList}
          sx={{ cursor: 'pointer' }}
        >
          Campaigns
        </Link>
        <Typography color="text.primary">Campaign Details</Typography>
      </Breadcrumbs>
      
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Campaign Details
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            ID: {id}
          </Typography>
        </Box>
        
        <Button variant="contained" onClick={handleBackToList}>
          Back to Campaigns
        </Button>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Campaign Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              aria-label="campaign tabs"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Overview" id="campaign-tab-0" />
              <Tab label="Ad Sets" id="campaign-tab-1" />
              <Tab label="Performance" id="campaign-tab-2" />
              <Tab label="Budget & Schedule" id="campaign-tab-3" />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              <Typography variant="body1">
                Campaign overview and summary statistics will be displayed here.
              </Typography>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Ad Set Targeting
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {/* Enhanced Ad Set Detail Component */}
              <AdSetDetail campaignId={id} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <Typography variant="body1">
                Campaign performance metrics and analytics will be displayed here.
              </Typography>
            </TabPanel>
            
            <TabPanel value={tabValue} index={3}>
              <Typography variant="body1">
                Budget and scheduling options will be displayed here.
              </Typography>
            </TabPanel>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default CampaignDetail;
