import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import brandService, { Brand, CreateBrandInput, UpdateBrandInput } from '../services/brandService';
import { useDispatch } from 'react-redux';
import { addToast } from '../store/slices/uiSlice';

// Query keys for React Query
export const brandKeys = {
  all: ['brands'] as const,
  lists: () => [...brandKeys.all, 'list'] as const,
  list: () => [...brandKeys.lists()] as const,
  details: () => [...brandKeys.all, 'detail'] as const,
  detail: (id: string) => [...brandKeys.details(), id] as const,
};

/**
 * Hook for working with brands
 */
export const useBrands = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  // Get all brands
  const getBrands = () => {
    return useQuery({
      queryKey: brandKeys.list(),
      queryFn: () => brandService.getBrands(),
    });
  };

  // Get a single brand by id
  const getBrandById = (id: string) => {
    return useQuery({
      queryKey: brandKeys.detail(id),
      queryFn: () => brandService.getBrandById(id),
      // Only fetch if we have an id
      enabled: !!id,
    });
  };

  // Create a new brand
  const createBrand = useMutation({
    mutationFn: (newBrand: CreateBrandInput) => 
      brandService.createBrand(newBrand),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
      
      // Notify user
      dispatch(addToast({
        type: 'success',
        title: 'Brand Created',
        message: `"${data.name}" has been created successfully`,
      }));
    },
    onError: (error: Error) => {
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Create Brand',
        message: error.message,
      }));
    },
  });

  // Update an existing brand with optimistic updates
  const updateBrand = useMutation({
    mutationFn: (updatedBrand: UpdateBrandInput) => 
      brandService.updateBrand(updatedBrand.id, updatedBrand),
    onMutate: async (updatedBrand) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: brandKeys.detail(updatedBrand.id) });
      await queryClient.cancelQueries({ queryKey: brandKeys.lists() });
      
      // Snapshot the previous value
      const previousBrand = queryClient.getQueryData<Brand>(
        brandKeys.detail(updatedBrand.id)
      );
      
      // Optimistically update to the new value
      if (previousBrand) {
        queryClient.setQueryData(
          brandKeys.detail(updatedBrand.id),
          { ...previousBrand, ...updatedBrand }
        );
      }
      
      // Update list queries that contain this brand
      const brands = queryClient.getQueryData<Brand[]>(brandKeys.list());
      
      if (brands) {
        queryClient.setQueryData(
          brandKeys.list(),
          brands.map(item => 
            item.id === updatedBrand.id ? { ...item, ...updatedBrand } : item
          )
        );
      }
      
      return { previousBrand };
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
      
      // Notify user
      dispatch(addToast({
        type: 'success',
        title: 'Brand Updated',
        message: `"${data.name}" has been updated successfully`,
      }));
    },
    onError: (error: Error, variables, context) => {
      // Revert optimistic update
      if (context?.previousBrand) {
        queryClient.setQueryData(
          brandKeys.detail(variables.id),
          context.previousBrand
        );
        
        // Also revert in lists
        const brands = queryClient.getQueryData<Brand[]>(brandKeys.list());
        
        if (brands) {
          queryClient.setQueryData(
            brandKeys.list(),
            brands.map(item => 
              item.id === variables.id ? context.previousBrand : item
            )
          );
        }
      }
      
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Update Brand',
        message: error.message,
      }));
    },
  });

  // Delete a brand with optimistic updates
  const deleteBrand = useMutation({
    mutationFn: (id: string) => brandService.deleteBrand(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: brandKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: brandKeys.lists() });
      
      // Snapshot the previous item
      const previousBrand = queryClient.getQueryData<Brand>(
        brandKeys.detail(id)
      );
      
      // Remove from detail
      queryClient.setQueryData(brandKeys.detail(id), null);
      
      // Remove from lists
      const brands = queryClient.getQueryData<Brand[]>(brandKeys.list());
      
      if (brands) {
        queryClient.setQueryData(
          brandKeys.list(),
          brands.filter(item => item.id !== id)
        );
      }
      
      return { previousBrand };
    },
    onSuccess: (_data, id) => {
      // Get the brand name for the toast message from cache if possible
      const brandName = queryClient.getQueryData<Brand>(brandKeys.detail(id))?.name || 'Brand';
      
      dispatch(addToast({
        type: 'success',
        title: 'Brand Deleted',
        message: `"${brandName}" has been deleted`,
      }));
    },
    onError: (error: Error, id, context) => {
      // Revert optimistic removal
      if (context?.previousBrand) {
        queryClient.setQueryData(
          brandKeys.detail(id),
          context.previousBrand
        );
        
        // Also revert in lists
        const brands = queryClient.getQueryData<Brand[]>(brandKeys.list());
        
        if (brands) {
          queryClient.setQueryData(
            brandKeys.list(),
            [...brands, context.previousBrand]
          );
        }
      }
      
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Delete Brand',
        message: error.message,
      }));
    },
  });

  // Update brand status with optimistic update
  const updateBrandStatus = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => 
      brandService.updateBrandStatus(id, active),
    onMutate: async ({ id, active }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: brandKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: brandKeys.lists() });
      
      // Snapshot previous value
      const previousBrand = queryClient.getQueryData<Brand>(
        brandKeys.detail(id)
      );
      
      // Optimistically update
      if (previousBrand) {
        queryClient.setQueryData(
          brandKeys.detail(id),
          { ...previousBrand, active }
        );
      }
      
      // Update in lists
      const brands = queryClient.getQueryData<Brand[]>(brandKeys.list());
      
      if (brands) {
        queryClient.setQueryData(
          brandKeys.list(),
          brands.map(item => 
            item.id === id ? { ...item, active } : item
          )
        );
      }
      
      return { previousBrand };
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
      
      dispatch(addToast({
        type: 'success',
        title: 'Brand Status Updated',
        message: `"${data.name}" is now ${data.active ? 'active' : 'inactive'}`,
      }));
    },
    onError: (error: Error, variables, context) => {
      // Revert optimistic update
      if (context?.previousBrand) {
        queryClient.setQueryData(
          brandKeys.detail(variables.id),
          context.previousBrand
        );
        
        // Revert in lists
        const brands = queryClient.getQueryData<Brand[]>(brandKeys.list());
        
        if (brands) {
          queryClient.setQueryData(
            brandKeys.list(),
            brands.map(item => 
              item.id === variables.id ? context.previousBrand : item
            )
          );
        }
      }
      
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Update Status',
        message: error.message,
      }));
    },
  });

  // Prefetch a brand (for optimization)
  const prefetchBrand = (id: string) => {
    return queryClient.prefetchQuery({
      queryKey: brandKeys.detail(id),
      queryFn: () => brandService.getBrandById(id),
    });
  };

  return {
    getBrands,
    getBrandById,
    createBrand,
    updateBrand,
    deleteBrand,
    updateBrandStatus,
    prefetchBrand,
  };
};

export default useBrands;