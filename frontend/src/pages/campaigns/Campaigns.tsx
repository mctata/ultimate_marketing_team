import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Campaign as CampaignIcon,
  Science as ScienceIcon,
  Assessment as AssessmentIcon,
  BarChart as BenchmarkIcon,
  NotificationsActive as AlertsIcon,
  Description as ReportsIcon,
} from '@mui/icons-material';
import useCampaigns from '../../hooks/useCampaigns';
import { CampaignFilters } from '../../services/campaignService';
import { ErrorBoundary } from 'react-error-boundary';
import GlobalErrorFallback from '../../components/common/GlobalErrorFallback';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

const Campaigns = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CampaignFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const { selectedBrand } = useSelector((state: RootState) => state.brands);
  
  useEffect(() => {
    console.log('Campaigns component rendered with:');
    console.log('- Location:', location);
    console.log('- Params:', params);
    console.log('- Selected Brand:', selectedBrand);
    
    // Update filters when brand changes
    if (selectedBrand) {
      setFilters(prev => ({
        ...prev,
        brandId: selectedBrand.id
      }));
    }
  }, [location, params, selectedBrand]);
  
  // Use the React Query hook
  const { getCampaignsList } = useCampaigns();
  const { data: campaigns, isLoading, error } = getCampaignsList(filters);
  
  console.log('Campaigns data:', campaigns, 'isLoading:', isLoading, 'error:', error, 'filters:', filters);
  
  // Filter campaigns based on search term
  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    
    if (searchTerm) {
      return campaigns.filter(campaign => 
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return campaigns;
  }, [campaigns, searchTerm]);
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const handleStatusChange = (event: SelectChangeEvent) => {
    setFilters(prev => ({
      ...prev,
      status: event.target.value,
    }));
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  const getBudgetDisplay = (budget?: number) => {
    if (!budget) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(budget);
  };
  
  // Handlers for new features
  const handleViewBenchmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/campaigns/${id}/benchmark`);
  };
  
  const handleViewAlerts = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/campaigns/${id}/alerts`);
  };
  
  const handleViewReports = () => {
    navigate('/campaigns/reports');
  };
  
  if (error) {
    return <Typography color="error">Error loading campaigns: {(error as Error).message}</Typography>;
  }
  
  // If no brand is selected, show a helpful message
  if (!selectedBrand) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Please select a brand using the dropdown in the header to view campaigns.
        </Alert>
        <Typography variant="body1">
          Campaign management requires a brand context. Use the brand selector in the top right of the header.
        </Typography>
      </Box>
    );
  }
  
  return (
    <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
      <Box>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Campaigns
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="secondary" 
              startIcon={<ReportsIcon />}
              onClick={handleViewReports}
            >
              Custom Reports
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => navigate('/campaigns/new')}
            >
              Create Campaign
            </Button>
          </Box>
        </Box>
        
        {/* Search and filters */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: showFilters ? 2 : 0 }}>
            <TextField
              fullWidth
              placeholder="Search campaigns..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            
            <IconButton 
              sx={{ 
                border: 1, 
                borderColor: 'divider',
                borderRadius: 1,
              }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterListIcon fontSize="small" />
            </IconButton>
          </Box>
          
          {showFilters && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={filters.status || ''}
                  label="Status"
                  onChange={handleStatusChange}
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {filteredCampaigns.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CampaignIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No campaigns found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Try adjusting your search or filter criteria
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/campaigns/new')}
                >
                  Create Campaign
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {filteredCampaigns.map((campaign) => (
                  <Grid item xs={12} md={6} key={campaign.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                        },
                      }}
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" component="div" fontWeight="bold">
                            {campaign.name}
                          </Typography>
                          <Chip 
                            label={campaign.status} 
                            color={campaign.status === 'active' ? 'success' : 
                                   campaign.status === 'paused' ? 'warning' : 
                                   campaign.status === 'completed' ? 'info' : 'default'} 
                            size="small" 
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {campaign.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" display="block">
                            <strong>Start Date:</strong> {formatDate(campaign.startDate)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            <strong>End Date:</strong> {formatDate(campaign.endDate)}
                          </Typography>
                        </Box>
                        
                        <Typography variant="caption" display="block" gutterBottom>
                          <strong>Budget:</strong> {getBudgetDisplay(campaign.budget)}
                        </Typography>
                        
                        {campaign.platform && (
                          <Chip 
                            label={campaign.platform} 
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </CardContent>
                      
                      <Divider />
                      
                      <CardActions sx={{ flexWrap: 'wrap', gap: 0.5, justifyContent: 'flex-start' }}>
                        <Button 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/campaigns/${campaign.id}`);
                          }}
                        >
                          View Details
                        </Button>
                        <Button 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/campaigns/${campaign.id}/edit`);
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="small"
                          startIcon={<ScienceIcon />}
                          color="info"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/campaigns/${campaign.id}/ab-testing`);
                          }}
                        >
                          A/B Test
                        </Button>
                        <Button 
                          size="small"
                          startIcon={<BenchmarkIcon />}
                          color="primary"
                          onClick={(e) => handleViewBenchmark(campaign.id, e)}
                        >
                          Benchmark
                        </Button>
                        <Button 
                          size="small"
                          startIcon={<AlertsIcon />}
                          color="warning"
                          onClick={(e) => handleViewAlerts(campaign.id, e)}
                        >
                          Alerts
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Box>
    </ErrorBoundary>
  );
};

export default Campaigns;