// frontend/src/context/BrandContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { RootState } from '../store';
import { selectBrand } from '../store/slices/brandsSlice';

// Import the Brand interface from services
import { Brand } from '../services/brandService';

// Define the context shape
interface BrandContextType {
  currentBrand: Brand | null;
  brandId: string | null;
  isLoading: boolean;
  error: string | null;
  allBrands: Brand[];
  switchBrand: (brandId: string) => void;
  navigateToBrandRoute: (path: string) => void;
  isBrandRoute: (path: string) => boolean;
}

// Create the context with default values
const BrandContext = createContext<BrandContextType>({
  currentBrand: null,
  brandId: null,
  isLoading: false,
  error: null,
  allBrands: [],
  switchBrand: () => {},
  navigateToBrandRoute: () => {},
  isBrandRoute: () => false,
});

export const useBrand = () => useContext(BrandContext);

interface BrandProviderProps {
  children: React.ReactNode;
}

export const BrandProvider: React.FC<BrandProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { brandId } = useParams<{ brandId: string }>();
  
  const { brands, selectedBrand, isLoading, error } = useSelector(
    (state: RootState) => state.brands
  );
  
  // Helper function to check if a route is a brand-specific route
  const isBrandRoute = (path: string): boolean => {
    // Non-brand routes like brands management, settings, etc.
    const nonBrandRoutes = ['/brands', '/settings', '/login', '/register', '/auth'];
    return !nonBrandRoutes.some(route => path.startsWith(route));
  };
  
  // Helper function for navigating to brand routes - consolidating the logic
  const navigateToBrandRoute = (path: string): void => {
    // If this is not a path that should have a brand, just navigate directly
    if (!isBrandRoute(path)) {
      navigate(path);
      return;
    }
    
    // If we don't have a selected brand but do have brands available, use the first one
    const targetBrand = selectedBrand || (brands.length > 0 ? brands[0] : null);
    
    if (!targetBrand) {
      // No brands available, just navigate to the path as is
      navigate(path);
      return;
    }
    
    // If the path already includes '/brand/', extract the pure route part
    let routePart = path;
    
    if (path.includes('/brand/')) {
      const pathSegments = path.split('/');
      const brandIndex = pathSegments.indexOf('brand');
      
      if (brandIndex >= 0 && brandIndex < pathSegments.length - 1) {
        // Remove 'brand' and the brandId segments to get the route part
        const routeSegments = [...pathSegments.slice(0, brandIndex), ...pathSegments.slice(brandIndex + 2)];
        routePart = routeSegments.join('/');
      }
    }
    
    // Ensure the route part doesn't start with a slash
    if (routePart.startsWith('/')) {
      routePart = routePart.substring(1);
    }
    
    // Construct the brand-specific path
    const brandPath = `/brand/${targetBrand.id}/${routePart}`;
    
    // Navigate to the brand-specific path
    navigate(brandPath);
  };
  
  // When the URL's brandId changes, update Redux state with validation
  useEffect(() => {
    if (brandId) {
      // Check if the brandId exists in our brands array
      const brandExists = brands.some(b => b.id === brandId);
      
      if (brandExists && brandId !== selectedBrand?.id) {
        // Valid brand ID - update the selected brand
        dispatch(selectBrand(brandId));
      } else if (!brandExists && brands.length > 0) {
        // Invalid brand ID - redirect to the first available brand
        console.error(`Brand ID ${brandId} not found. Redirecting to first available brand.`);
        const firstBrandId = brands[0].id;
        
        // Replace current URL path with a valid brand ID
        const pathParts = window.location.pathname.split('/');
        const brandIndex = pathParts.indexOf('brand');
        
        if (brandIndex !== -1 && brandIndex < pathParts.length - 1) {
          pathParts[brandIndex + 1] = firstBrandId;
          navigate(pathParts.join('/'), { replace: true });
        } else {
          // If path structure is unexpected, go to dashboard with first brand
          navigate(`/brand/${firstBrandId}/dashboard`, { replace: true });
        }
      }
    }
  }, [brandId, selectedBrand, brands, dispatch, navigate]);
  
  // Function to switch brands with validation
  const switchBrand = (newBrandId: string) => {
    // Validate that the brand exists before switching
    const brandExists = brands.some(b => b.id === newBrandId);
    
    if (!brandExists) {
      console.error(`Attempted to switch to invalid brand ID: ${newBrandId}`);
      return;
    }
    
    dispatch(selectBrand(newBrandId));
    
    // Update the URL to reflect the brand change
    // Get the current path and replace the brand ID segment
    const pathParts = window.location.pathname.split('/');
    const brandIndex = pathParts.indexOf('brand');
    
    if (brandIndex !== -1 && brandIndex < pathParts.length - 1) {
      pathParts[brandIndex + 1] = newBrandId;
      navigate(pathParts.join('/'));
    } else {
      // If we're not on a brand path, add it
      navigate(`/brand/${newBrandId}/dashboard`);
    }
  };
  
  // State for tracking brand switching operation
  const [isSwitchingBrand, setIsSwitchingBrand] = useState(false);
  
  // Enhanced brand switching function with loading indicator
  const handleSwitchBrand = (newBrandId: string) => {
    // Validate that the brand exists before switching
    const brandExists = brands.some(b => b.id === newBrandId);
    
    if (!brandExists) {
      console.error(`Attempted to switch to invalid brand ID: ${newBrandId}`);
      return;
    }
    
    // Show loading indicator
    setIsSwitchingBrand(true);
    
    // Dispatch action to update Redux state
    dispatch(selectBrand(newBrandId));
    
    // Update the URL to reflect the brand change
    const pathParts = window.location.pathname.split('/');
    const brandIndex = pathParts.indexOf('brand');
    
    try {
      if (brandIndex !== -1 && brandIndex < pathParts.length - 1) {
        pathParts[brandIndex + 1] = newBrandId;
        navigate(pathParts.join('/'));
      } else {
        // If we're not on a brand path, add it
        navigate(`/brand/${newBrandId}/dashboard`);
      }
    } finally {
      // Hide loading indicator after navigation completes
      // Using setTimeout to give a minimum visual feedback even if the operation is fast
      setTimeout(() => {
        setIsSwitchingBrand(false);
      }, 300);
    }
  };
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      currentBrand: selectedBrand,
      brandId: selectedBrand?.id || null,
      isLoading: isLoading || isSwitchingBrand, // Combine both loading states
      error,
      allBrands: brands,
      switchBrand: handleSwitchBrand,
      navigateToBrandRoute, // Add navigation helper
      isBrandRoute, // Add route check helper
    }),
    [selectedBrand, isLoading, isSwitchingBrand, error, brands, navigateToBrandRoute, isBrandRoute]
  );
  
  return (
    <BrandContext.Provider value={contextValue}>
      {children}
    </BrandContext.Provider>
  );
};

export default BrandContext;