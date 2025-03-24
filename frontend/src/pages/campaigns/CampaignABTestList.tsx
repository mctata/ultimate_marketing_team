import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  CircularProgress,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Science as ScienceIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';

// Mock A/B test data
const mockTests = [
  {
    id: '1',
    campaignId: '1',
    campaignName: 'Summer Collection Launch',
    testName: 'Homepage Banner Test',
    status: 'running',
    variants: 3,
    startDate: '2025-03-10T00:00:00Z',
    endDate: '2025-03-31T00:00:00Z',
    winningVariant: null,
    conversionLift: null,
  },
  {
    id: '2',
    campaignId: '1',
    campaignName: 'Summer Collection Launch',
    testName: 'Product Page Layout Test',
    status: 'completed',
    variants: 2,
    startDate: '2025-02-15T00:00:00Z',
    endDate: '2025-03-15T00:00:00Z',
    winningVariant: 'Variant B',
    conversionLift: '+18.5%',
  },
  {
    id: '3',
    campaignId: '2',
    campaignName: 'Q2 Lead Generation',
    testName: 'CTA Button Color Test',
    status: 'running',
    variants: 4,
    startDate: '2025-03-15T00:00:00Z',
    endDate: '2025-04-15T00:00:00Z',
    winningVariant: null,
    conversionLift: null,
  },
  {
    id: '4',
    campaignId: '3',
    campaignName: 'Product Launch: Home Fitness',
    testName: 'Headline Copy Test',
    status: 'completed',
    variants: 3,
    startDate: '2025-02-01T00:00:00Z',
    endDate: '2025-03-01T00:00:00Z',
    winningVariant: 'Variant C',
    conversionLift: '+12.3%',
  },
  {
    id: '5',
    campaignId: '4',
    campaignName: 'Interior Design Spring Showcase',
    testName: 'Image Layout Test',
    status: 'paused',
    variants: 2,
    startDate: '2025-03-05T00:00:00Z',
    endDate: '2025-04-05T00:00:00Z',
    winningVariant: null,
    conversionLift: null,
  },
];

const CampaignABTestList: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredTests, setFilteredTests] = useState(mockTests);
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Apply filters whenever search term or status filter changes
    let filtered = [...mockTests];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        test => 
          test.testName.toLowerCase().includes(term) ||
          test.campaignName.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(test => test.status === statusFilter);
    }
    
    setFilteredTests(filtered);
  }, [searchTerm, statusFilter]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  const handleViewTest = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}/ab-testing`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            A/B Testing Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage and monitor your campaign A/B tests
          </Typography>
        </Box>
        
        <Button variant="contained" startIcon={<ScienceIcon />} onClick={() => navigate('/campaigns')}>
          Create New Test
        </Button>
      </Box>
      
      {/* Filters */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <TextField
          placeholder="Search tests..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            label="Status"
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="running">Running</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="paused">Paused</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Tests Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Test Name</TableCell>
              <TableCell>Campaign</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Variants</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Winning Variant</TableCell>
              <TableCell>Conversion Lift</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Box sx={{ py: 3 }}>
                    <ScienceIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                      No A/B tests found matching your criteria
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredTests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell>{test.testName}</TableCell>
                  <TableCell>{test.campaignName}</TableCell>
                  <TableCell>
                    <Chip 
                      label={test.status} 
                      color={
                        test.status === 'running' ? 'success' : 
                        test.status === 'completed' ? 'primary' : 
                        'default'
                      } 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{test.variants}</TableCell>
                  <TableCell>{formatDate(test.startDate)}</TableCell>
                  <TableCell>{formatDate(test.endDate)}</TableCell>
                  <TableCell>
                    {test.winningVariant || '—'}
                  </TableCell>
                  <TableCell>
                    {test.conversionLift ? (
                      <Chip 
                        label={test.conversionLift} 
                        color="success" 
                        size="small" 
                      />
                    ) : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewTest(test.campaignId)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CampaignABTestList;