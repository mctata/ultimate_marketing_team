// frontend/src/components/common/BrandRedirector.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import { Brand } from '../../services/brandService';
import useBrands from '../../hooks/useBrands';
import { fetchBrandsStart, fetchBrandsSuccess, fetchBrandsFailure } from '../../store/slices/brandsSlice';

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
  const dispatch = useDispatch();
  const { brands, selectedBrand, isLoading } = useSelector((state: RootState) => state.brands);
  const [redirecting, setRedirecting] = useState(false);
  const redirectAttempts = useRef(0);
  const maxRedirectAttempts = 3;
  const redirectTimeout = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedBrands = useRef(false);
  
  // Track which paths we've already tried to prevent loops
  const attemptedPaths = useRef<Set<string>>(new Set());
  
  // Load brands data at startup if not already loaded
  useEffect(() => {
    // Only try to load brands if we don't already have them and haven't tried yet
    if (!hasLoadedBrands.current && !isLoading && brands.length === 0) {
      hasLoadedBrands.current = true;
      dispatch(fetchBrandsStart());
      
      // Get brands from the service
      const loadBrands = async () => {
        try {
          const brandService = (await import('../../services/brandService')).default;
          const brandsData = await brandService.getBrands();
          dispatch(fetchBrandsSuccess(brandsData));
          console.log('Brands loaded successfully:', brandsData);
        } catch (error) {
          console.error('Failed to load brands:', error);
          dispatch(fetchBrandsFailure((error as Error).message));
        }
      };
      
      loadBrands();
    }
  }, [dispatch, isLoading, brands.length]);
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    };
  }, []);
  
  useEffect(() => {
    // Reset tracking when location changes
    if (!location.pathname.includes('/brand/')) {
      attemptedPaths.current = new Set();
      redirectAttempts.current = 0;
    }
    
    // Only redirect if we're not already redirecting, have brands, and haven't exceeded max attempts
    if (!redirecting && !isLoading && brands.length > 0 && redirectAttempts.current < maxRedirectAttempts) {
      // Determine current path and whether it's already brand-specific
      const currentPath = location.pathname;
      const isBrandPath = currentPath.includes('/brand/');
      
      // Skip redirects for these paths
      const excludedPaths = ['/brands', '/brands/new', '/brands/'];
      if (excludedPaths.some(path => currentPath.startsWith(path))) {
        console.log('Skipping redirect for excluded path:', currentPath);
        return;
      }
      
      // Start redirecting process
      if (!isBrandPath && (selectedBrand || brands.length > 0)) {
        setRedirecting(true);
        redirectAttempts.current++;
        
        // Extract the route part without the leading slash
        const routePart = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
        
        // Determine which brand to use
        const targetBrand: Brand = selectedBrand || brands[0];
        console.log('Using brand for redirect:', targetBrand);
        
        // Create brandPath based on the route
        let brandPath = '';
        
        // Special handling for main section paths
        if (routePart === 'content' || routePart === 'campaigns' || routePart === 'analytics') {
          console.log(`Special handling for ${routePart} path`);
          // Ensure we're going directly to the base content/campaign path with the brand
          brandPath = `/brand/${targetBrand.id}/${routePart}`;
        } else {
          // For other paths, preserve the full path structure
          brandPath = `/brand/${targetBrand.id}/${routePart}`;
        }
        
        // Check if we've already tried this path to prevent loops
        if (attemptedPaths.current.has(brandPath)) {
          console.warn(`Prevented redirect loop to: ${brandPath}`);
          setRedirecting(false);
          return;
        }
        
        // Add this path to our attempted paths
        attemptedPaths.current.add(brandPath);
        
        console.log(`Redirecting from ${currentPath} to ${brandPath}`);
        
        // Set a timeout to prevent UI from getting stuck if navigation fails
        redirectTimeout.current = setTimeout(() => {
          console.log('Redirect timeout exceeded, cancelling redirect.');
          setRedirecting(false);
        }, 3000);
        
        // Navigate to the brand-specific path with query params
        navigate(`${brandPath}${location.search}`, { replace: true })
          .then(() => {
            if (redirectTimeout.current) {
              clearTimeout(redirectTimeout.current);
            }
            setRedirecting(false);
            console.log('Navigation successful to', brandPath);
          })
          .catch(error => {
            console.error("Navigation error:", error);
            setRedirecting(false);
          });
      }
    }
  }, [isLoading, brands, selectedBrand, location, navigate, redirecting]);
  
  // Always render children - we'll do the redirecting in the background
  // This ensures pages are visible immediately without blocking on redirects
  return <>{children}</>;
};

export default BrandRedirector;