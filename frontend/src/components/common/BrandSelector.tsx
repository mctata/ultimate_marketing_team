// frontend/src/components/common/BrandSelector.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar, 
  Typography, 
  Tooltip,
  Button,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Business as BusinessIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import { selectBrand } from '../../store/slices/brandsSlice';

interface BrandSelectorProps {
  variant?: 'full' | 'compact' | 'dropdown';
}

const BrandSelector: React.FC<BrandSelectorProps> = ({ variant = 'full' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const { brands, selectedBrand } = useSelector((state: RootState) => state.brands);
  
  // Select the first brand by default if none is selected
  useEffect(() => {
    if (brands.length > 0 && !selectedBrand) {
      dispatch(selectBrand(brands[0].id));
    }
  }, [brands, selectedBrand, dispatch]);
  
  // Memoize handlers to prevent unnecessary re-renders
  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);
  
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);
  
  const handleBrandSelect = useCallback((brandId: string) => {
    dispatch(selectBrand(brandId));
    
    // Update URL to maintain current path but change brand ID
    const currentPath = window.location.pathname;
    const brandPathRegex = /\/brand\/([^/]+)(\/.*)?/;
    const match = currentPath.match(brandPathRegex);
    
    if (match) {
      const currentBrandId = match[1];
      const remainingPath = match[2] || '';
      const newPath = `/brand/${brandId}${remainingPath}`;
      
      // Always navigate even if IDs appear to be the same
      // This ensures the URL is properly updated when manually changed
      navigate(newPath, { replace: true });
    }
    
    handleClose();
  }, [dispatch, handleClose, navigate]);
  
  const handleCreateNewBrand = useCallback(() => {
    navigate('/brands/new');
    handleClose();
  }, [navigate, handleClose]);
  
  // Memoize menu items to prevent unnecessary re-renders
  const brandMenuItems = useMemo(() => (
    brands.map((brand) => (
      <MenuItem
        key={brand.id}
        onClick={() => handleBrandSelect(brand.id)}
        selected={selectedBrand?.id === brand.id}
        sx={{
          borderLeft: selectedBrand?.id === brand.id ? 3 : 0,
          borderColor: 'primary.main',
          pl: selectedBrand?.id === brand.id ? 1.7 : 2,
          backgroundColor: selectedBrand?.id === brand.id ? 
            'rgba(0, 102, 204, 0.08)' : 'transparent',
          fontWeight: selectedBrand?.id === brand.id ? 600 : 400,
        }}
      >
        <ListItemIcon>
          {brand.logo ? (
            <Avatar src={brand.logo} alt={brand.name} sx={{ width: 24, height: 24 }} />
          ) : (
            <BusinessIcon fontSize="small" />
          )}
        </ListItemIcon>
        <ListItemText 
          primary={brand.name} 
          primaryTypographyProps={{ 
            variant: 'body2',
            fontWeight: selectedBrand?.id === brand.id ? 600 : 400
          }}
        />
      </MenuItem>
    ))
  ), [brands, selectedBrand?.id, handleBrandSelect]);
  
  // Add brand menu item (memoized to prevent unnecessary re-renders)
  const addBrandMenuItem = useMemo(() => (
    <MenuItem
      onClick={handleCreateNewBrand}
      sx={{ color: 'primary.main' }}
    >
      <ListItemIcon>
        <AddIcon fontSize="small" color="primary" />
      </ListItemIcon>
      <ListItemText 
        primary="Add New Brand" 
        primaryTypographyProps={{ variant: 'body2' }}
      />
    </MenuItem>
  ), [handleCreateNewBrand]);
  
  // For dropdown variant with no brands, show an add brand button that goes directly to brands/new
  if (brands.length === 0 && variant === 'dropdown') {
    return (
      <Box>
        <Tooltip title="Add Brand">
          <Button
            onClick={handleCreateNewBrand}
            size="small"
            aria-label="Add Brand"
            variant="outlined"
            startIcon={<AddIcon fontSize="small" />}
            sx={{ 
              borderRadius: '20px',
              color: 'text.primary',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'divider',
            }}
          >
            Add Brand
          </Button>
        </Tooltip>
      </Box>
    );
  }
  
  // For other variants with no brands, show the add brand button
  if (brands.length === 0) {
    return (
      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={handleCreateNewBrand}
        sx={{ borderRadius: '20px', borderColor: 'primary.main', color: 'primary.main' }}
      >
        Add Brand
      </Button>
    );
  }

  // For "dropdown" variant - use a proper dropdown with brand name visible
  if (variant === 'dropdown') {
    return (
      <Box>
        <Button
          id="brand-dropdown-button"
          aria-controls={open ? 'brand-menu-dropdown' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: '20px',
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'divider',
            px: 2,
            py: 0.5,
            color: 'text.primary',  // Ensure text is visible in dark mode
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
          endIcon={<ArrowDownIcon />}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {selectedBrand?.logo ? (
              <Avatar
                src={selectedBrand.logo}
                alt={selectedBrand.name}
                sx={{ width: 24, height: 24, mr: 1 }}
              />
            ) : (
              <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
            )}
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {selectedBrand?.name || "Select Brand"}
            </Typography>
          </Box>
        </Button>
        
        <Menu
          id="brand-menu-dropdown"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'brand-dropdown-button',
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            elevation: 3,
            sx: {
              minWidth: 200,
              maxHeight: 400,
              overflow: 'auto',
              mt: 1,
            },
          }}
        >
{brandMenuItems}
          
          <Divider sx={{ my: 1 }} />
          
          {addBrandMenuItem}
        </Menu>
      </Box>
    );
  }

  if (variant === 'compact') {
    return (
      <Tooltip title={selectedBrand?.name || "Select Brand"}>
        <IconButton
          onClick={handleClick}
          size="small"
          aria-controls={open ? 'brand-menu' : undefined}
          aria-haspopup="menu"
          aria-expanded={open ? 'true' : undefined}
          aria-label="Select brand"
          aria-describedby="Currently selected brand"
          sx={{ 
            ml: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '50%',
            p: 1
          }}
        >
          {selectedBrand?.logo ? (
            <Avatar
              src={selectedBrand.logo}
              alt={selectedBrand.name}
              sx={{ width: 24, height: 24 }}
            />
          ) : (
            <BusinessIcon fontSize="small" aria-hidden="true" />
          )}
        </IconButton>
      </Tooltip>
    );
  }
  
  return (
    <Box>
      <Button
        id="brand-selector-button"
        aria-controls={open ? 'brand-selector-menu' : undefined}
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : undefined}
        aria-label="Select brand"
        aria-describedby="brand-selector-description"
        onClick={handleClick}
        endIcon={<ArrowDownIcon aria-hidden="true" />}
        role="combobox"
        sx={{
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
          py: 0.75,
          px: 2,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          minWidth: 160,
          justifyContent: 'space-between',
        }}
      >
        {/* Hidden text for screen readers */}
        <span id="brand-selector-description" style={{ display: 'none' }}>
          Select a brand to view brand-specific content
        </span>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {selectedBrand?.logo ? (
            <Avatar
              src={selectedBrand.logo}
              alt={selectedBrand.name}
              sx={{ width: 24, height: 24, mr: 1 }}
            />
          ) : (
            <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
          )}
          <Typography
            variant="body2"
            noWrap
            sx={{
              maxWidth: 120,
              fontWeight: 500,
            }}
          >
            {selectedBrand?.name || "Select Brand"}
          </Typography>
        </Box>
      </Button>
      <Menu
        id="brand-selector-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'brand-selector-button',
          role: 'listbox',
          'aria-label': 'Available brands',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 200,
            maxHeight: 400,
            overflow: 'auto',
            mt: 1,
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
          Your Brands
        </Typography>
        
        {/* Memoized brand menu items */}
        {brandMenuItems}
        
        <Divider sx={{ my: 1 }} />
        
        {/* Memoized "Add New Brand" menu item */}
        {addBrandMenuItem}
      </Menu>
    </Box>
  );
};

export default BrandSelector;