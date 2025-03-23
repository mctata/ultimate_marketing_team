import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Divider,
  Card,
  CardContent,
  CardActions,
  IconButton,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  MoreVert as MoreVertIcon,
  Article as ArticleIcon,
  Campaign as CampaignIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  FormatListBulleted as FormatListBulletedIcon,
} from '@mui/icons-material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for the dashboard
const performanceData = [
  { name: 'Jan', content: 4000, ads: 2400 },
  { name: 'Feb', content: 3000, ads: 1398 },
  { name: 'Mar', content: 2000, ads: 9800 },
  { name: 'Apr', content: 2780, ads: 3908 },
  { name: 'May', content: 1890, ads: 4800 },
  { name: 'Jun', content: 2390, ads: 3800 },
  { name: 'Jul', content: 3490, ads: 4300 },
];

const brandData = [
  { id: 1, name: 'Tech Solutions Inc.', projects: 12, content: 67, campaigns: 5 },
  { id: 2, name: 'Global Retail', projects: 8, content: 42, campaigns: 3 },
  { id: 3, name: 'Health Innovations', projects: 5, content: 28, campaigns: 2 },
];

const recentContentItems = [
  { id: 1, title: 'Product Launch Strategy for Q3', type: 'Strategy', status: 'Published', date: '2025-07-15' },
  { id: 2, title: 'How to Maximize ROI with PPC Campaigns', type: 'Blog Post', status: 'Draft', date: '2025-07-18' },
  { id: 3, title: 'Summer Sale Campaign', type: 'Social Media', status: 'Scheduled', date: '2025-07-20' },
];

const campaignPerformance = [
  { name: 'Email Nurture', engagement: 75, conversion: 23 },
  { name: 'Summer PPC', engagement: 60, conversion: 45 },
  { name: 'Social Contest', engagement: 90, conversion: 30 },
];

const popularTemplates = [
  { 
    id: 'wellness-transformation-instagram', 
    title: 'Client Transformation - Instagram Post', 
    type: 'Social Media',
    format: 'Instagram Post',
    category: 'Health & Wellness',
    usageCount: 127,
    rating: 4.8
  },
  { 
    id: 'wellness-educational-blog', 
    title: 'Educational Health Guide - Blog Post', 
    type: 'Blog Post',
    format: 'Blog Article',
    category: 'Health & Wellness',
    usageCount: 89,
    rating: 4.5
  },
  { 
    id: 'wellness-class-promotion-email', 
    title: 'Class/Workshop Promotion - Email', 
    type: 'Email',
    format: 'Promotional Email',
    category: 'Health & Wellness',
    usageCount: 102,
    rating: 4.6
  },
];

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Dashboard
        </Typography>
        
        <Box>
          <Button 
            variant="contained"
            onClick={() => navigate('/brands/new')}
            sx={{ mr: 1 }}
          >
            Add New Brand
          </Button>
          <Button 
            variant="outlined"
            onClick={() => navigate('/content/new')}
          >
            Create Content
          </Button>
        </Box>
      </Box>
      
      {isLoading ? (
        <LinearProgress />
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3} lg={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" component="h2" fontWeight="bold">
                    Brands
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: 'primary.light',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary.contrastText',
                    }}
                  >
                    <BusinessIcon />
                  </Box>
                </Box>
                <Typography variant="h3" component="p" fontWeight="bold" sx={{ my: 2 }}>
                  3
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <span style={{ color: theme.palette.success.main }}>+1 new</span> this month
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3} lg={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" component="h2" fontWeight="bold">
                    Projects
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: 'secondary.light',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'secondary.contrastText',
                    }}
                  >
                    <ArticleIcon />
                  </Box>
                </Box>
                <Typography variant="h3" component="p" fontWeight="bold" sx={{ my: 2 }}>
                  25
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <span style={{ color: theme.palette.success.main }}>+5 new</span> this month
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3} lg={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" component="h2" fontWeight="bold">
                    Content
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: 'info.light',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'info.contrastText',
                    }}
                  >
                    <ArticleIcon />
                  </Box>
                </Box>
                <Typography variant="h3" component="p" fontWeight="bold" sx={{ my: 2 }}>
                  137
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <span style={{ color: theme.palette.success.main }}>+32 new</span> this month
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3} lg={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" component="h2" fontWeight="bold">
                    Templates
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: 'success.light',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'success.contrastText',
                    }}
                  >
                    <DescriptionIcon />
                  </Box>
                </Box>
                <Typography variant="h3" component="p" fontWeight="bold" sx={{ my: 2 }}>
                  42
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <span style={{ color: theme.palette.success.main }}>+5 new</span> this month
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3} lg={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" component="h2" fontWeight="bold">
                    Campaigns
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: 'warning.light',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'warning.contrastText',
                    }}
                  >
                    <CampaignIcon />
                  </Box>
                </Box>
                <Typography variant="h3" component="p" fontWeight="bold" sx={{ my: 2 }}>
                  10
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <span style={{ color: theme.palette.success.main }}>+3 new</span> this month
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Paper 
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" component="h2" fontWeight="bold">
                    Performance Overview
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                      <TrendingUpIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      +15.3% from last month
                    </Typography>
                    <IconButton size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={performanceData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="content"
                        stroke={theme.palette.primary.main}
                        activeDot={{ r: 8 }}
                      />
                      <Line type="monotone" dataKey="ads" stroke={theme.palette.secondary.main} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" component="h2" fontWeight="bold">
                    Campaign Performance
                  </Typography>
                  <IconButton size="small">
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={campaignPerformance}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Bar 
                        dataKey="engagement" 
                        name="Engagement Rate (%)"
                        fill={theme.palette.primary.main} 
                      />
                      <Bar 
                        dataKey="conversion" 
                        name="Conversion Rate (%)"
                        fill={theme.palette.secondary.main} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Brands and Content */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                }}
              >
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="h2" fontWeight="bold">
                      Active Brands
                    </Typography>
                    <Button size="small" onClick={() => navigate('/brands')}>
                      View All
                    </Button>
                  </Box>
                </Box>
                
                <Divider />
                
                {brandData.map((brand, index) => (
                  <Box key={brand.id}>
                    <Box 
                      sx={{ 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                      onClick={() => navigate(`/brands/${brand.id}`)}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: `primary.light`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'primary.contrastText',
                          mr: 2,
                        }}
                      >
                        {brand.name.charAt(0)}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {brand.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {brand.projects} projects • {brand.content} content • {brand.campaigns} campaigns
                        </Typography>
                      </Box>
                    </Box>
                    {index < brandData.length - 1 && <Divider />}
                  </Box>
                ))}
                
                <Box sx={{ p: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate('/brands/new')}
                  >
                    Add New Brand
                  </Button>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                }}
              >
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="h2" fontWeight="bold">
                      Recent Content
                    </Typography>
                    <Button size="small" onClick={() => navigate('/content')}>
                      View All
                    </Button>
                  </Box>
                </Box>
                
                <Divider />
                
                <Grid container spacing={2} sx={{ p: 2 }}>
                  {recentContentItems.map((item) => (
                    <Grid item xs={12} md={4} key={item.id}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                          },
                        }}
                        onClick={() => navigate(`/content/${item.id}`)}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography 
                            variant="caption" 
                            component="div"
                            sx={{
                              display: 'inline-block',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              bgcolor: 
                                item.status === 'Published' ? 'success.light' :
                                item.status === 'Scheduled' ? 'info.light' : 'warning.light',
                              color: 
                                item.status === 'Published' ? 'success.dark' :
                                item.status === 'Scheduled' ? 'info.dark' : 'warning.dark',
                              mb: 1,
                            }}
                          >
                            {item.status}
                          </Typography>
                          <Typography gutterBottom variant="subtitle1" component="div" fontWeight="medium">
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.type}
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(item.date).toLocaleDateString()}
                          </Typography>
                          <Button size="small">Edit</Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                
                <Box sx={{ p: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate('/content/new')}
                  >
                    Create New Content
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Popular Templates */}
          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                }}
              >
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="h2" fontWeight="bold">
                      Popular Templates
                    </Typography>
                    <Button 
                      size="small" 
                      onClick={() => navigate('/templates')}
                      endIcon={<FormatListBulletedIcon />}
                    >
                      Browse All Templates
                    </Button>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Ready-to-use templates for your marketing content. Click on a template to test it.
                  </Typography>
                </Box>
                
                <Divider />
                
                <Grid container spacing={2} sx={{ p: 2 }}>
                  {popularTemplates.map((template) => (
                    <Grid item xs={12} md={4} key={template.id}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                          },
                        }}
                        onClick={() => navigate(`/templates/${template.id}/test`)}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography 
                              variant="caption" 
                              component="div"
                              sx={{
                                display: 'inline-block',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: 'success.light',
                                color: 'success.dark',
                                mb: 1,
                              }}
                            >
                              {template.type}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ mr: 0.5, fontWeight: 'bold' }}>
                                {template.rating}
                              </Typography>
                              <TrendingUpIcon sx={{ fontSize: 14, color: 'success.main' }} />
                            </Box>
                          </Box>
                          
                          <Typography gutterBottom variant="subtitle1" component="div" fontWeight="medium">
                            {template.title}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary">
                            {template.format} • {template.category}
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Used {template.usageCount} times
                          </Typography>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/templates/${template.id}/test`);
                            }}
                          >
                            Test
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;