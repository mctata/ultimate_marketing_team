// frontend/src/components/common/BrandRedirector.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import LoadingScreen from './LoadingScreen';
import { Brand } from '../../services/brandService';

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
  const [redirecting, setRedirecting] = useState(false);
  const redirectAttempts = useRef(0);
  const maxRedirectAttempts = 3;
  const redirectTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Track which paths we've already tried to prevent loops
  const attemptedPaths = useRef<Set<string>>(new Set());
  
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
        
        // Construct the new brand-specific path
        const brandPath = `/brand/${targetBrand.id}/${routePart}`;
        
        // Check if we've already tried this path to prevent loops
        if (attemptedPaths.current.has(brandPath)) {
          console.warn(`Prevented redirect loop to: ${brandPath}`);
          setRedirecting(false);
          return;
        }
        
        // Add this path to our attempted paths
        attemptedPaths.current.add(brandPath);
        
        // Set a timeout to prevent UI from getting stuck if navigation fails
        redirectTimeout.current = setTimeout(() => {
          setRedirecting(false);
        }, 3000);
        
        // Navigate to the brand-specific path with query params
        navigate(`${brandPath}${location.search}`, { replace: true })
          .then(() => {
            if (redirectTimeout.current) {
              clearTimeout(redirectTimeout.current);
            }
            setRedirecting(false);
          })
          .catch(error => {
            console.error("Navigation error:", error);
            setRedirecting(false);
          });
      }
    }
  }, [isLoading, brands, selectedBrand, location, navigate, redirecting]);
  
  // If still loading or redirecting, show loading screen
  if (isLoading || redirecting) {
    return <LoadingScreen message="Loading brand context..." />;
  }
  
  // If we have no brands, or we've exceeded redirect attempts, show the children anyway
  if (brands.length === 0 || redirectAttempts.current >= maxRedirectAttempts) {
    return <>{children}</>;
  }
  
  // If we're already on a brand path, show the children
  if (location.pathname.includes('/brand/')) {
    return <>{children}</>;
  }
  
  // For specific paths that shouldn't be redirected
  const excludedPaths = ['/brands', '/brands/new', '/brands/'];
  if (excludedPaths.some(path => location.pathname.startsWith(path))) {
    return <>{children}</>;
  }
  
  // Show loading while we're figuring out where to go
  return <LoadingScreen message="Setting up brand context..." />;
};

export default BrandRedirector;