import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  Campaign as CampaignIcon,
  Article as ArticleIcon,
  Add as AddIcon
} from '@mui/icons-material';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
  
  // Mock performance data
  const performanceMetrics = {
    totalCampaigns: 8,
    activeCampaigns: 4,
    totalSpend: 12450,
    totalRevenue: 43890,
    roi: 3.52,
    weeklyImpressions: 128750,
    weeklyClicks: 5230,
    weeklyConversions: 312
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome to the Ultimate Marketing Team dashboard
        </Typography>
      </Box>
      
      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="contained" 
              fullWidth
              startIcon={<CampaignIcon />}
              onClick={() => navigate('/campaigns/new')}
              sx={{ py: 1.5 }}
            >
              Create Campaign
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="contained" 
              fullWidth
              startIcon={<ArticleIcon />}
              onClick={() => navigate('/content/new')}
              sx={{ py: 1.5 }}
            >
              Create Content
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="contained" 
              fullWidth
              startIcon={<BarChartIcon />}
              onClick={() => navigate('/campaigns/performance')}
              sx={{ py: 1.5 }}
            >
              View Performance
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              fullWidth
              startIcon={<AddIcon />}
              onClick={() => navigate('/templates')}
              sx={{ py: 1.5 }}
            >
              Browse Templates
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Performance Overview */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Performance Overview
          </Typography>
          <Button 
            variant="text" 
            endIcon={<TrendingUpIcon />}
            onClick={() => navigate('/campaigns/performance')}
          >
            View Detailed Analytics
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Campaigns
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h4" component="div">
                      {performanceMetrics.totalCampaigns}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Campaigns
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div" color="success.main">
                      {performanceMetrics.activeCampaigns}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Active Campaigns
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">
                    Total Spend
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    ${performanceMetrics.totalSpend.toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => navigate('/campaigns')}>
                  View All Campaigns
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Return on Investment
                </Typography>
                <Typography variant="h4" component="div" color="success.main">
                  {performanceMetrics.roi.toFixed(2)}x
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Overall ROI
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">
                    Total Revenue
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color="success.main">
                    ${performanceMetrics.totalRevenue.toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => navigate('/campaigns/performance')}>
                  View Performance
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Weekly Engagement
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="h6" component="div">
                      {(performanceMetrics.weeklyImpressions / 1000).toFixed(1)}k
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Impressions
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h6" component="div">
                      {(performanceMetrics.weeklyClicks / 1000).toFixed(1)}k
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Clicks
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h6" component="div">
                      {performanceMetrics.weeklyConversions}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Conversions
                    </Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">
                    CTR
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {((performanceMetrics.weeklyClicks / performanceMetrics.weeklyImpressions) * 100).toFixed(2)}%
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => navigate('/content')}>
                  View Content Performance
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Recent Activity */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <Grid container spacing={3}>
          {/* Activity items would go here */}
          <Grid item xs={12}>
            <Typography color="textSecondary" align="center">
              No recent activity to display
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Dashboard;