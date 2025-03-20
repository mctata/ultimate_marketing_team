import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

// Mock data for brands
const brandsData = [
  {
    id: 1,
    name: 'Tech Solutions Inc.',
    description: 'Enterprise software and cloud solutions provider',
    logo: null,
    industry: 'Technology',
    website: 'https://techsolutions.example.com',
    projects: 12,
    active: true,
  },
  {
    id: 2,
    name: 'Global Retail',
    description: 'International retail chain with both physical and online presence',
    logo: null,
    industry: 'Retail',
    website: 'https://globalretail.example.com',
    projects: 8,
    active: true,
  },
  {
    id: 3,
    name: 'Health Innovations',
    description: 'Healthcare technology and services provider',
    logo: null,
    industry: 'Healthcare',
    website: 'https://healthinnovations.example.com',
    projects: 5,
    active: true,
  },
  {
    id: 4,
    name: 'EcoSolutions',
    description: 'Sustainable products and environmental consulting',
    logo: null,
    industry: 'Environment',
    website: 'https://ecosolutions.example.com',
    projects: 3,
    active: false,
  },
];

const Brands = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBrands, setFilteredBrands] = useState(brandsData);
  
  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle search
  useEffect(() => {
    if (searchTerm) {
      const filtered = brandsData.filter(brand => 
        brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBrands(filtered);
    } else {
      setFilteredBrands(brandsData);
    }
  }, [searchTerm]);
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Brands
        </Typography>
        
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/brands/new')}
        >
          Add New Brand
        </Button>
      </Box>
      
      {/* Search and filter */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          placeholder="Search brands..."
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
        >
          <FilterListIcon fontSize="small" />
        </IconButton>
      </Box>
      
      {isLoading ? (
        <LinearProgress />
      ) : (
        <>
          {filteredBrands.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <BusinessIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No brands found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Try adjusting your search or filter criteria
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/brands/new')}
              >
                Add New Brand
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredBrands.map((brand) => (
                <Grid item xs={12} md={6} lg={4} key={brand.id}>
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
                    onClick={() => navigate(`/brands/${brand.id}`)}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          src={brand.logo || undefined} 
                          sx={{ 
                            width: 56, 
                            height: 56,
                            bgcolor: 'primary.main',
                            mr: 2
                          }}
                        >
                          {getInitials(brand.name)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="div" fontWeight="bold">
                            {brand.name}
                          </Typography>
                          <Chip 
                            label={brand.industry} 
                            size="small" 
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {brand.description}
                      </Typography>
                      
                      <Typography variant="caption" display="block" gutterBottom>
                        <strong>Website:</strong> {brand.website}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <Chip 
                          label={`${brand.projects} Projects`}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          label={brand.active ? 'Active' : 'Inactive'}
                          color={brand.active ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/brands/${brand.id}`);
                        }}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/brands/${brand.id}/edit`);
                        }}
                      >
                        Edit
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
  );
};

export default Brands;