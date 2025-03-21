import { useState, useEffect, useMemo } from 'react';
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
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import useBrands from '../../hooks/useBrands';
import { ErrorBoundary } from 'react-error-boundary';
import GlobalErrorFallback from '../../components/common/GlobalErrorFallback';

const Brands = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Use the React Query hook
  const { getBrands } = useBrands();
  const { data: brands, isLoading, error } = getBrands();
  
  // Filter brands based on search term
  const filteredBrands = useMemo(() => {
    if (!brands) return [];
    
    if (searchTerm) {
      return brands.filter(brand => 
        brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return brands;
  }, [brands, searchTerm]);
  
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
  
  if (error) {
    return <Typography color="error">Error loading brands: {(error as Error).message}</Typography>;
  }
  
  return (
    <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
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
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
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
    </ErrorBoundary>
  );
};

export default Brands;