import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Tooltip,
  ButtonGroup
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Splitscreen as SplitscreenIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchCampaigns, deleteCampaign, setFilters, selectCampaigns, selectCampaignsLoading, selectCampaignsError, selectCampaignFilters } from '../../store/slices/campaignSlice';
import { AppDispatch } from '../../store';
import { format } from 'date-fns';
import { Campaign } from '../../services/campaignService';

// Status colors for the campaign status chip
const statusColors: Record<string, string> = {
  draft: 'default',
  active: 'success',
  paused: 'warning',
  completed: 'info'
};

// Platform options for filtering
const platformOptions = [
  { value: 'all', label: 'All Platforms' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'google', label: 'Google Ads' },
];

// Mock campaigns for development
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Summer Product Launch',
    description: 'Promotional campaign for new summer products',
    status: 'active',
    start_date: '2025-05-01',
    end_date: '2025-08-31',
    budget: 5000,
    platform: 'facebook',
    target_audience: { age: '18-34', interests: ['fashion', 'summer'] },
    brand_id: '1',
    content_ids: ['1', '2', '3'],
    created_at: '2025-03-15',
    updated_at: '2025-03-15'
  },
  {
    id: '2',
    name: 'Holiday Season Sale',
    description: 'Black Friday and Christmas promotional campaign',
    status: 'draft',
    start_date: '2025-11-15',
    end_date: '2025-12-31',
    budget: 8000,
    platform: 'google',
    target_audience: { age: '25-54', interests: ['shopping', 'deals'] },
    brand_id: '1',
    content_ids: ['4', '5'],
    created_at: '2025-03-10',
    updated_at: '2025-03-12'
  },
  {
    id: '3',
    name: 'Spring Collection Launch',
    description: 'Introducing the new spring fashion collection',
    status: 'paused',
    start_date: '2025-02-15',
    end_date: '2025-04-30',
    budget: 4500,
    platform: 'instagram',
    target_audience: { age: '18-34', gender: 'female', interests: ['fashion', 'lifestyle'] },
    brand_id: '1',
    content_ids: ['6', '7', '8'],
    created_at: '2025-01-20',
    updated_at: '2025-02-25'
  },
  {
    id: '4',
    name: 'Customer Loyalty Program',
    description: 'Campaign to promote our new customer loyalty program',
    status: 'completed',
    start_date: '2025-01-01',
    end_date: '2025-02-28',
    budget: 3000,
    platform: 'linkedin',
    target_audience: { age: '25-54', interests: ['loyalty', 'rewards'] },
    brand_id: '1',
    content_ids: ['9', '10'],
    created_at: '2024-12-15',
    updated_at: '2025-03-01'
  },
];

const CampaignList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const campaigns = useSelector(selectCampaigns);
  const loading = useSelector(selectCampaignsLoading);
  const error = useSelector(selectCampaignsError);
  const filters = useSelector(selectCampaignFilters);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openFilter, setOpenFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  
  // Fetch campaigns on component mount and when filters change
  useEffect(() => {
    dispatch(fetchCampaigns(filters));
  }, [dispatch, filters]);
  
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const handleStatusFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStatusFilter(event.target.value);
    dispatch(setFilters({ status: event.target.value || undefined }));
  };
  
  const handlePlatformFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPlatformFilter(event.target.value);
    if (event.target.value !== 'all') {
      // Apply platform filter in a real app
      console.log('Filtering by platform:', event.target.value);
    }
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      dispatch(deleteCampaign(id));
    }
  };
  
  const handleEdit = (id: string) => {
    navigate(`/campaigns/${id}`);
  };
  
  const handleCreateNew = () => {
    navigate('/campaigns/new');
  };
  
  const handleViewMetrics = (id: string) => {
    navigate(`/campaigns/${id}/metrics`);
  };
  
  const handleViewABTesting = (id: string) => {
    navigate(`/campaigns/${id}/ab-testing`);
  };
  
  const handleToggleCampaignStatus = (campaign: Campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    // In a real app, this would dispatch an action to update the campaign status
    console.log(`Changing status of campaign ${campaign.id} from ${campaign.status} to ${newStatus}`);
  };
  
  // Use mock campaigns if no real campaigns are loaded (for development)
  const displayCampaigns = campaigns.length > 0 ? campaigns : mockCampaigns;
  
  // Filter campaigns based on search term
  const filteredCampaigns = displayCampaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlatform = platformFilter === 'all' || 
                           campaign.platform.toLowerCase() === platformFilter.toLowerCase();
    
    const matchesStatus = statusFilter === '' || campaign.status === statusFilter;
    
    return matchesSearch && matchesPlatform && matchesStatus;
  });
  
  // Calculate some campaign stats for the dashboard
  const getActiveCampaignsCount = () => {
    return displayCampaigns.filter(campaign => campaign.status === 'active').length;
  };
  
  const getTotalBudget = () => {
    return displayCampaigns.reduce((total, campaign) => total + campaign.budget, 0);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Campaign Management</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          Create New Campaign
        </Button>
      </Box>
      
      {/* Campaign Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Campaigns
              </Typography>
              <Typography variant="h4" component="div">
                {getActiveCampaignsCount()}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <PlayArrowIcon color="success" sx={{ mr: 1 }} fontSize="small" />
                <Typography variant="body2" color="textSecondary">
                  {getActiveCampaignsCount() > 0 ? 'Running' : 'No active campaigns'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Budget
              </Typography>
              <Typography variant="h4" component="div">
                ${getTotalBudget().toLocaleString()}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <AttachMoneyIcon color="primary" sx={{ mr: 1 }} fontSize="small" />
                <Typography variant="body2" color="textSecondary">
                  {displayCampaigns.length} campaigns
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average CTR
              </Typography>
              <Typography variant="h4" component="div">
                2.4%
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon color="info" sx={{ mr: 1 }} fontSize="small" />
                <Typography variant="body2" color="textSecondary">
                  +0.3% vs. last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                ROI
              </Typography>
              <Typography variant="h4" component="div">
                3.2x
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} fontSize="small" />
                <Typography variant="body2" color="textSecondary">
                  +0.5x vs. last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Search and Filters */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </TextField>
              <TextField
                select
                label="Platform"
                value={platformFilter}
                onChange={handlePlatformFilterChange}
                sx={{ minWidth: 150 }}
              >
                {platformOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <IconButton 
                color={openFilter ? 'primary' : 'default'}
                onClick={() => setOpenFilter(!openFilter)}
              >
                <FilterIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Campaign Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Campaign Name</TableCell>
                  <TableCell>Platform</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Budget</TableCell>
                  <TableCell>Date Range</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCampaigns
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((campaign) => (
                    <TableRow key={campaign.id} hover>
                      <TableCell 
                        component="th" 
                        scope="row"
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleEdit(campaign.id)}
                      >
                        <Typography variant="body1" fontWeight="medium">
                          {campaign.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {campaign.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={campaign.platform.charAt(0).toUpperCase() + campaign.platform.slice(1)} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)} 
                          color={statusColors[campaign.status] as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>${campaign.budget.toLocaleString()}</TableCell>
                      <TableCell>
                        {format(new Date(campaign.start_date), 'MM/dd/yyyy')} - 
                        {campaign.end_date ? format(new Date(campaign.end_date), 'MM/dd/yyyy') : 'Ongoing'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={campaign.status === 'active' ? 'Pause Campaign' : 'Activate Campaign'}>
                          <IconButton 
                            size="small" 
                            color={campaign.status === 'active' ? 'warning' : 'success'}
                            onClick={() => handleToggleCampaignStatus(campaign)}
                            disabled={campaign.status === 'completed'}
                          >
                            {campaign.status === 'active' ? 
                              <PauseIcon fontSize="small" /> : 
                              <PlayArrowIcon fontSize="small" />
                            }
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Campaign">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEdit(campaign.id)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Campaign">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDelete(campaign.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <ButtonGroup variant="outlined" size="small" sx={{ ml: 1 }}>
                          <Tooltip title="View Metrics">
                            <Button 
                              color="info" 
                              onClick={() => handleViewMetrics(campaign.id)}
                            >
                              Metrics
                            </Button>
                          </Tooltip>
                          <Tooltip title="A/B Testing">
                            <Button 
                              color="secondary"
                              onClick={() => handleViewABTesting(campaign.id)}
                              startIcon={<SplitscreenIcon />}
                            >
                              A/B Test
                            </Button>
                          </Tooltip>
                        </ButtonGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                {filteredCampaigns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="textSecondary">
                        No campaigns found. {searchTerm && 'Try a different search term.'}
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        sx={{ mt: 2 }}
                        startIcon={<AddIcon />}
                        onClick={handleCreateNew}
                      >
                        Create New Campaign
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredCampaigns.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </Box>
  );
};

export default CampaignList;