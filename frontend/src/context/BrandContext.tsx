// frontend/src/context/BrandContext.tsx
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { selectBrand } from '../store/slices/brandsSlice';

// Define the context shape
interface BrandContextType {
  currentBrand: any | null;
  brandId: string | null;
  isLoading: boolean;
  error: string | null;
  allBrands: any[];
  switchBrand: (brandId: string) => void;
}

// Create the context with default values
const BrandContext = createContext<BrandContextType>({
  currentBrand: null,
  brandId: null,
  isLoading: false,
  error: null,
  allBrands: [],
  switchBrand: () => {},
});

export const useBrand = () => useContext(BrandContext);

interface BrandProviderProps {
  children: React.ReactNode;
}

export const BrandProvider: React.FC<BrandProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { brandId } = useParams<{ brandId: string }>();
  
  const { brands, selectedBrand, isLoading, error } = useSelector(
    (state: RootState) => state.brands
  );
  
  // When the URL's brandId changes, update Redux state
  useEffect(() => {
    if (brandId && brandId !== selectedBrand?.id && brands.some(b => b.id === brandId)) {
      dispatch(selectBrand(brandId));
    }
  }, [brandId, selectedBrand, brands, dispatch]);
  
  // Function to switch brands
  const switchBrand = (newBrandId: string) => {
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
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      currentBrand: selectedBrand,
      brandId: selectedBrand?.id || null,
      isLoading,
      error,
      allBrands: brands,
      switchBrand,
    }),
    [selectedBrand, isLoading, error, brands]
  );
  
  return (
    <BrandContext.Provider value={contextValue}>
      {children}
    </BrandContext.Provider>
  );
};

export default BrandContext;