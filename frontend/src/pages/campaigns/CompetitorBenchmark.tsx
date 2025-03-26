import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, Tabs, Tab, CircularProgress } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

import ShareOfVoiceAnalysis from '../../components/campaigns/ShareOfVoiceAnalysis';
import CompetitorAdFeed from '../../components/campaigns/CompetitorAdFeed';
import CompetitorPerformanceComparison from '../../components/campaigns/CompetitorPerformanceComparison';
import IndustryBenchmarkChart from '../../components/campaigns/IndustryBenchmarkChart';
import AlertSubscriptionPanel from '../../components/campaigns/AlertSubscriptionPanel';
import campaignService from '../../services/campaignService';

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
      id={`benchmark-tabpanel-${index}`}
      aria-labelledby={`benchmark-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `benchmark-tab-${index}`,
    'aria-controls': `benchmark-tabpanel-${index}`,
  };
}

const CompetitorBenchmark: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [campaignData, setCampaignData] = useState<any>(null);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // In a real implementation, these would be API calls
        const campaign = await campaignService.getCampaignById(id);
        setCampaignData(campaign);
        
        // Mock data - in production this would come from an API
        const competitorData = [
          { id: 'comp1', name: 'Competitor A', shareOfVoice: 28, performance: { ctr: 2.8, cpc: 1.35, conversions: 450 } },
          { id: 'comp2', name: 'Competitor B', shareOfVoice: 18, performance: { ctr: 2.1, cpc: 1.65, conversions: 320 } },
          { id: 'comp3', name: 'Competitor C', shareOfVoice: 12, performance: { ctr: 1.9, cpc: 2.05, conversions: 210 } },
        ];
        setCompetitors(competitorData);
      } catch (error) {
        console.error('Error loading benchmark data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!campaignData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Campaign not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Competitor Benchmark Analysis
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Campaign: {campaignData.name}
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="benchmark tabs">
          <Tab label="Overview" {...a11yProps(0)} />
          <Tab label="Share of Voice" {...a11yProps(1)} />
          <Tab label="Competitor Ads" {...a11yProps(2)} />
          <Tab label="Industry Benchmarks" {...a11yProps(3)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Performance Comparison</Typography>
              <CompetitorPerformanceComparison 
                campaignData={campaignData} 
                competitors={competitors} 
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Share of Voice Summary</Typography>
              <ShareOfVoiceAnalysis 
                campaignData={campaignData} 
                competitors={competitors}
              />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Industry Benchmark Comparison</Typography>
              <IndustryBenchmarkChart 
                campaignData={campaignData}
                industryCategory={campaignData.industry || 'general'}
              />
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ShareOfVoiceAnalysis 
          campaignData={campaignData} 
          competitors={competitors}
          detailed
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <CompetitorAdFeed />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <IndustryBenchmarkChart 
              campaignData={campaignData}
              industryCategory={campaignData.industry || 'general'}
              detailed
            />
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <AlertSubscriptionPanel campaignId={id} />
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default CompetitorBenchmark;