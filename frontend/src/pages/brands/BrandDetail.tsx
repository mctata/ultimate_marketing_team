import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Divider,
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Language as LanguageIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Article as ArticleIcon,
  Campaign as CampaignIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useBrands } from '../../hooks/useBrands';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`brand-tabpanel-${index}`}
      aria-labelledby={`brand-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const BrandDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [value, setValue] = useState(0);
  const { getBrandById } = useBrands();
  
  // Fetch brand data using the hook
  const { 
    data: brandData, 
    isLoading, 
    isError 
  } = getBrandById(id || '');
  
  useEffect(() => {
    // Prefetch the brand data when component mounts
    if (id) {
      console.log("Fetching brand with ID:", id);
    }
  }, [id]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  
  if (isLoading) {
    return <LinearProgress />;
  }
  
  if (isError || !brandData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error loading brand details
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/brands')}
          sx={{ mt: 2 }}
        >
          Back to Brands
        </Button>
      </Box>
    );
  }
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <Box>
      {/* Header with brand info */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={brandData.logo || undefined} 
              sx={{ 
                width: 72, 
                height: 72,
                bgcolor: 'primary.main',
                mr: 3
              }}
            >
              {getInitials(brandData.name)}
            </Avatar>
            
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                {brandData.name}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  label={brandData.industry} 
                  color="primary"
                  size="small" 
                />
                {brandData.website && (
                  <Chip 
                    icon={<LanguageIcon fontSize="small" />}
                    label={brandData.website.replace(/^https?:\/\//, '')}
                    component="a"
                    href={brandData.website.startsWith('http') ? brandData.website : `https://${brandData.website}`}
                    target="_blank"
                    clickable
                    size="small"
                  />
                )}
              </Box>
            </Box>
          </Box>
          
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<EditIcon />}
              onClick={() => navigate(`/brands/${id}`)}
              sx={{ mr: 1 }}
            >
              Edit Brand
            </Button>
            <IconButton color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
      
      {/* Tabs */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Tabs 
          value={value} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            px: 2
          }}
        >
          <Tab label="Overview" />
          <Tab label="Projects" />
          <Tab label="Content" />
          <Tab label="Campaigns" />
          <Tab label="Analytics" />
          <Tab label="Settings" />
        </Tabs>
        
        {/* Overview Tab */}
        <TabPanel value={value} index={0}>
          <Box sx={{ px: 3 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom>
                  About
                </Typography>
                <Typography variant="body1" paragraph>
                  {brandData.description}
                </Typography>
                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom>
                    Contact Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <LanguageIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Website" 
                        secondary={
                          brandData.website ? (
                            <a 
                              href={brandData.website.startsWith('http') ? brandData.website : `https://${brandData.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              {brandData.website}
                            </a>
                          ) : (
                            "Not provided"
                          )
                        } 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Email" 
                        secondary={
                          brandData.contactInfo?.email ? (
                            <a href={`mailto:${brandData.contactInfo.email}`}>
                              {brandData.contactInfo.email}
                            </a>
                          ) : (
                            <Typography 
                              component="span" 
                              sx={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                color: 'text.secondary',
                                '&:hover': { color: 'primary.main' },
                                cursor: 'pointer'
                              }}
                              onClick={() => navigate(`/brands/${id}/edit`)}
                            >
                              Add email <EditIcon fontSize="small" sx={{ ml: 0.5 }} />
                            </Typography>
                          )
                        } 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Phone" 
                        secondary={
                          brandData.contactInfo?.phone ? (
                            <a href={`tel:${brandData.contactInfo.phone}`}>
                              {brandData.contactInfo.phone}
                            </a>
                          ) : (
                            <Typography 
                              component="span" 
                              sx={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                color: 'text.secondary',
                                '&:hover': { color: 'primary.main' },
                                cursor: 'pointer'
                              }}
                              onClick={() => navigate(`/brands/${id}/edit`)}
                            >
                              Add phone <EditIcon fontSize="small" sx={{ ml: 0.5 }} />
                            </Typography>
                          )
                        } 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <LocationIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Address" 
                        secondary={
                        brandData.contactInfo?.address || (
                          <Typography 
                            component="span" 
                            sx={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              color: 'text.secondary',
                              '&:hover': { color: 'primary.main' },
                              cursor: 'pointer'
                            }}
                            onClick={() => navigate(`/brands/${id}/edit`)}
                          >
                            Add address <EditIcon fontSize="small" sx={{ ml: 0.5 }} />
                          </Typography>
                        )
                      } 
                      />
                    </ListItem>
                  </List>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="h2" fontWeight="bold">
                      Key Contacts
                    </Typography>
                    <Button startIcon={<AddCircleOutlineIcon />} size="small">
                      Add Contact
                    </Button>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {(brandData.contacts || []).length > 0 ? (
                      (brandData.contacts || []).map(contact => (
                        <Grid item xs={12} md={6} key={contact.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {contact.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {contact.position}
                              </Typography>
                              <Typography variant="body2">
                                <EmailIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1, fontSize: 16 }} />
                                {contact.email}
                              </Typography>
                              <Typography variant="body2">
                                <PhoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1, fontSize: 16 }} />
                                {contact.phone}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" align="center">
                          No contacts added yet. Click "Add Contact" to create one.
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Recent Projects
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {(brandData.projects || []).length > 0 ? (
                    (brandData.projects || []).slice(0, 3).map((project, index) => (
                      <Box key={project.id}>
                        <Box 
                          sx={{ 
                            py: 1, 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {project.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Chip 
                                label={project.status} 
                                size="small"
                                color={
                                  project.status === 'Completed' ? 'success' :
                                  project.status === 'In Progress' ? 'primary' : 'default'
                                }
                                sx={{ mr: 1 }}
                              />
                              {project.deadline && (
                                <Typography variant="caption" color="text.secondary">
                                  Due: {new Date(project.deadline).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          <IconButton size="small">
                            <ArticleIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        {index < (brandData.projects?.length || 0) - 1 && <Divider />}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                      No projects yet. Create your first project to see it here.
                    </Typography>
                  )}
                  
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => setValue(1)} // Switch to Projects tab
                  >
                    View All Projects
                  </Button>
                </Paper>
                
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Recent Content
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {(brandData.recentContent || []).map((content, index) => (
                    <Box key={content.id}>
                      <Box 
                        sx={{ 
                          py: 1, 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {content.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                              {content.type}
                            </Typography>
                            <Chip 
                              label={content.status} 
                              size="small"
                              color={
                                content.status === 'Published' ? 'success' :
                                content.status === 'Scheduled' ? 'info' : 'default'
                              }
                            />
                          </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(content.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      {index < brandData.recentContent.length - 1 && <Divider />}
                    </Box>
                  ))}
                  
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => setValue(2)} // Switch to Content tab
                  >
                    View All Content
                  </Button>
                </Paper>
                
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Active Campaigns
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {(brandData.recentCampaigns || []).map((campaign, index) => (
                    <Box key={campaign.id}>
                      <Box 
                        sx={{ 
                          py: 1, 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {campaign.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                              {campaign.platform}
                            </Typography>
                            <Chip 
                              label={campaign.status} 
                              size="small"
                              color={
                                campaign.status === 'Active' ? 'success' :
                                campaign.status === 'Planning' ? 'info' : 'default'
                              }
                            />
                          </Box>
                        </Box>
                        <IconButton size="small">
                          <CampaignIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      {index < brandData.recentCampaigns.length - 1 && <Divider />}
                    </Box>
                  ))}
                  
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => setValue(3)} // Switch to Campaigns tab
                  >
                    View All Campaigns
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        {/* Projects Tab */}
        <TabPanel value={value} index={1}>
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h2" fontWeight="bold">
                Projects
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddCircleOutlineIcon />}
              >
                New Project
              </Button>
            </Box>
            
            <Typography variant="body1">
              Project management content will be displayed here.
            </Typography>
          </Box>
        </TabPanel>
        
        {/* Content Tab */}
        <TabPanel value={value} index={2}>
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h2" fontWeight="bold">
                Content
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddCircleOutlineIcon />}
              >
                Create Content
              </Button>
            </Box>
            
            <Typography variant="body1">
              Brand-related content will be displayed here.
            </Typography>
          </Box>
        </TabPanel>
        
        {/* Campaigns Tab */}
        <TabPanel value={value} index={3}>
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h2" fontWeight="bold">
                Campaigns
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddCircleOutlineIcon />}
              >
                New Campaign
              </Button>
            </Box>
            
            <Typography variant="body1">
              Advertising campaigns will be displayed here.
            </Typography>
          </Box>
        </TabPanel>
        
        {/* Analytics Tab */}
        <TabPanel value={value} index={4}>
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h2" fontWeight="bold">
                Analytics
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<BarChartIcon />}
              >
                Export Report
              </Button>
            </Box>
            
            <Typography variant="body1">
              Brand performance analytics will be displayed here.
            </Typography>
          </Box>
        </TabPanel>
        
        {/* Settings Tab */}
        <TabPanel value={value} index={5}>
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h2" fontWeight="bold">
                Settings
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<SettingsIcon />}
              >
                Advanced Settings
              </Button>
            </Box>
            
            <Typography variant="body1">
              Brand settings will be displayed here.
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default BrandDetail;