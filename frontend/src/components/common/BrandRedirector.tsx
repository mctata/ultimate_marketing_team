// frontend/src/components/common/BrandRedirector.tsx
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import LoadingScreen from './LoadingScreen';

interface BrandRedirectorProps {
  children?: React.ReactNode;
}

/**
 * Component that redirects to the brand-specific version of the current route.
 * Used to smoothly transition from legacy routes to brand-aware routes.
 */
const BrandRedirector: React.FC<BrandRedirectorProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { brands, selectedBrand, isLoading } = useSelector((state: RootState) => state.brands);
  
  useEffect(() => {
    // Only redirect if we have brands and a selected brand
    if (!isLoading && brands.length > 0) {
      // Determine current path and whether it's already brand-specific
      const currentPath = location.pathname;
      const isBrandPath = currentPath.includes('/brand/');
      
      if (!isBrandPath && selectedBrand) {
        // Extract the route part without the leading slash
        const routePart = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
        
        // Construct the new brand-specific path
        const brandPath = `/brand/${selectedBrand.id}/${routePart}`;
        
        // Navigate to the brand-specific path with query params
        navigate(`${brandPath}${location.search}`, { replace: true });
      } else if (!selectedBrand && brands.length > 0) {
        // If no brand is selected but we have brands, use the first one
        const firstBrand = brands[0];
        const routePart = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
        const brandPath = `/brand/${firstBrand.id}/${routePart}`;
        
        navigate(`${brandPath}${location.search}`, { replace: true });
      }
    }
  }, [isLoading, brands, selectedBrand, location, navigate]);
  
  // If still loading or redirecting, show loading screen
  if (isLoading || (brands.length > 0 && !location.pathname.includes('/brand/'))) {
    return <LoadingScreen message="Loading brand context..." />;
  }
  
  // If we have no brands, show the children anyway
  if (brands.length === 0) {
    return <>{children}</>;
  }
  
  // Otherwise show the children content
  return <>{children}</>;
};

export default BrandRedirector;