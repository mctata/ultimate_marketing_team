import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import campaignService, { 
  Campaign, 
  CampaignFilters, 
  CreateCampaignInput, 
  UpdateCampaignInput, 
  AdSet, 
  Ad 
} from '../services/campaignService';
import { useDispatch } from 'react-redux';
import { addToast } from '../store/slices/uiSlice';

// Query keys for React Query
export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (filters: CampaignFilters = {}) => [...campaignKeys.lists(), filters] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
  metrics: (id: string) => [...campaignKeys.detail(id), 'metrics'] as const,
  adSets: (campaignId: string) => [...campaignKeys.detail(campaignId), 'adSets'] as const,
  adSet: (campaignId: string, adSetId: string) => [...campaignKeys.adSets(campaignId), adSetId] as const,
  ads: (campaignId: string, adSetId: string) => [...campaignKeys.adSet(campaignId, adSetId), 'ads'] as const,
  ad: (campaignId: string, adSetId: string, adId: string) => [...campaignKeys.ads(campaignId, adSetId), adId] as const,
};

/**
 * Hook for working with campaigns, ad sets, and ads
 */
export const useCampaigns = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  // Get campaigns list with filters
  const getCampaignsList = (filters: CampaignFilters = {}) => {
    return useQuery({
      queryKey: campaignKeys.list(filters),
      queryFn: () => campaignService.getCampaigns(filters),
      keepPreviousData: true,
    });
  };

  // Get a single campaign by id
  const getCampaignById = (id: string) => {
    return useQuery({
      queryKey: campaignKeys.detail(id),
      queryFn: () => campaignService.getCampaignById(id),
      enabled: !!id,
    });
  };

  // Create a new campaign
  const createCampaign = useMutation({
    mutationFn: (newCampaign: CreateCampaignInput) => 
      campaignService.createCampaign(newCampaign),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      
      dispatch(addToast({
        type: 'success',
        title: 'Campaign Created',
        message: `"${data.name}" has been created successfully`,
      }));
    },
    onError: (error: Error) => {
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Create Campaign',
        message: error.message,
      }));
    },
  });

  // Update an existing campaign with optimistic updates
  const updateCampaign = useMutation({
    mutationFn: (updatedCampaign: UpdateCampaignInput) => 
      campaignService.updateCampaign(updatedCampaign.id, updatedCampaign),
    onMutate: async (updatedCampaign) => {
      await queryClient.cancelQueries({ queryKey: campaignKeys.detail(updatedCampaign.id) });
      await queryClient.cancelQueries({ queryKey: campaignKeys.lists() });
      
      const previousCampaign = queryClient.getQueryData<Campaign>(
        campaignKeys.detail(updatedCampaign.id)
      );
      
      if (previousCampaign) {
        queryClient.setQueryData(
          campaignKeys.detail(updatedCampaign.id),
          { ...previousCampaign, ...updatedCampaign }
        );
      }
      
      // Update in lists
      const allListsQueries = queryClient.getQueriesData<Campaign[]>({ queryKey: campaignKeys.lists() });
      
      allListsQueries.forEach(([queryKey, campaigns]) => {
        if (campaigns) {
          queryClient.setQueryData(queryKey, campaigns.map(item => 
            item.id === updatedCampaign.id ? { ...item, ...updatedCampaign } : item
          ));
        }
      });
      
      return { previousCampaign };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      
      dispatch(addToast({
        type: 'success',
        title: 'Campaign Updated',
        message: `"${data.name}" has been updated successfully`,
      }));
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousCampaign) {
        queryClient.setQueryData(
          campaignKeys.detail(variables.id),
          context.previousCampaign
        );
        
        const allListsQueries = queryClient.getQueriesData<Campaign[]>({ queryKey: campaignKeys.lists() });
        
        allListsQueries.forEach(([queryKey, campaigns]) => {
          if (campaigns) {
            queryClient.setQueryData(queryKey, campaigns.map(item => 
              item.id === variables.id ? context.previousCampaign : item
            ));
          }
        });
      }
      
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Update Campaign',
        message: error.message,
      }));
    },
  });

  // Delete a campaign with optimistic updates
  const deleteCampaign = useMutation({
    mutationFn: (id: string) => campaignService.deleteCampaign(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: campaignKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: campaignKeys.lists() });
      
      const previousCampaign = queryClient.getQueryData<Campaign>(
        campaignKeys.detail(id)
      );
      
      queryClient.setQueryData(campaignKeys.detail(id), null);
      
      const allListsQueries = queryClient.getQueriesData<Campaign[]>({ queryKey: campaignKeys.lists() });
      
      allListsQueries.forEach(([queryKey, campaigns]) => {
        if (campaigns) {
          queryClient.setQueryData(queryKey, campaigns.filter(item => item.id !== id));
        }
      });
      
      return { previousCampaign };
    },
    onSuccess: (_data, id) => {
      const campaignName = queryClient.getQueryData<Campaign>(campaignKeys.detail(id))?.name || 'Campaign';
      
      dispatch(addToast({
        type: 'success',
        title: 'Campaign Deleted',
        message: `"${campaignName}" has been deleted`,
      }));
    },
    onError: (error: Error, id, context) => {
      if (context?.previousCampaign) {
        queryClient.setQueryData(
          campaignKeys.detail(id),
          context.previousCampaign
        );
        
        const allListsQueries = queryClient.getQueriesData<Campaign[]>({ queryKey: campaignKeys.lists() });
        
        allListsQueries.forEach(([queryKey, campaigns]) => {
          if (campaigns) {
            queryClient.setQueryData(queryKey, [...campaigns, context.previousCampaign]);
          }
        });
      }
      
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Delete Campaign',
        message: error.message,
      }));
    },
  });

  // Update campaign status with optimistic update
  const updateCampaignStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Campaign['status'] }) => 
      campaignService.updateCampaignStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: campaignKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: campaignKeys.lists() });
      
      const previousCampaign = queryClient.getQueryData<Campaign>(
        campaignKeys.detail(id)
      );
      
      if (previousCampaign) {
        queryClient.setQueryData(
          campaignKeys.detail(id),
          { ...previousCampaign, status }
        );
      }
      
      const allListsQueries = queryClient.getQueriesData<Campaign[]>({ queryKey: campaignKeys.lists() });
      
      allListsQueries.forEach(([queryKey, campaigns]) => {
        if (campaigns) {
          queryClient.setQueryData(queryKey, campaigns.map(item => 
            item.id === id ? { ...item, status } : item
          ));
        }
      });
      
      return { previousCampaign };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      
      const statusLabels: Record<Campaign['status'], string> = {
        draft: 'Draft',
        active: 'Active',
        paused: 'Paused',
        completed: 'Completed',
      };
      
      dispatch(addToast({
        type: 'success',
        title: 'Campaign Status Updated',
        message: `"${data.name}" is now ${statusLabels[data.status].toLowerCase()}`,
      }));
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousCampaign) {
        queryClient.setQueryData(
          campaignKeys.detail(variables.id),
          context.previousCampaign
        );
        
        const allListsQueries = queryClient.getQueriesData<Campaign[]>({ queryKey: campaignKeys.lists() });
        
        allListsQueries.forEach(([queryKey, campaigns]) => {
          if (campaigns) {
            queryClient.setQueryData(queryKey, campaigns.map(item => 
              item.id === variables.id ? context.previousCampaign : item
            ));
          }
        });
      }
      
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Update Status',
        message: error.message,
      }));
    },
  });

  // Get campaign metrics
  const getCampaignMetrics = (campaignId: string, timeRange?: { startDate: string; endDate: string }) => {
    return useQuery({
      queryKey: campaignKeys.metrics(campaignId),
      queryFn: () => campaignService.getCampaignMetrics(campaignId, timeRange),
      enabled: !!campaignId,
    });
  };

  // Ad Set operations
  const getAdSets = (campaignId: string) => {
    return useQuery({
      queryKey: campaignKeys.adSets(campaignId),
      queryFn: () => campaignService.getAdSets(campaignId),
      enabled: !!campaignId,
    });
  };

  const getAdSetById = (campaignId: string, adSetId: string) => {
    return useQuery({
      queryKey: campaignKeys.adSet(campaignId, adSetId),
      queryFn: () => campaignService.getAdSetById(campaignId, adSetId),
      enabled: !!campaignId && !!adSetId,
    });
  };

  const createAdSet = useMutation({
    mutationFn: ({ campaignId, adSetData }: { campaignId: string, adSetData: Omit<AdSet, 'id' | 'campaignId' | 'ads'> }) => 
      campaignService.createAdSet(campaignId, adSetData),
    onSuccess: (data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.adSets(campaignId) });
      
      dispatch(addToast({
        type: 'success',
        title: 'Ad Set Created',
        message: `"${data.name}" has been created successfully`,
      }));
    },
    onError: (error: Error) => {
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Create Ad Set',
        message: error.message,
      }));
    },
  });

  const updateAdSet = useMutation({
    mutationFn: ({ campaignId, adSetId, adSetData }: { campaignId: string, adSetId: string, adSetData: Partial<AdSet> }) => 
      campaignService.updateAdSet(campaignId, adSetId, adSetData),
    onMutate: async ({ campaignId, adSetId, adSetData }) => {
      await queryClient.cancelQueries({ queryKey: campaignKeys.adSet(campaignId, adSetId) });
      await queryClient.cancelQueries({ queryKey: campaignKeys.adSets(campaignId) });
      
      const previousAdSet = queryClient.getQueryData<AdSet>(
        campaignKeys.adSet(campaignId, adSetId)
      );
      
      if (previousAdSet) {
        queryClient.setQueryData(
          campaignKeys.adSet(campaignId, adSetId),
          { ...previousAdSet, ...adSetData }
        );
      }
      
      // Update in lists
      const adSets = queryClient.getQueryData<AdSet[]>(campaignKeys.adSets(campaignId));
      
      if (adSets) {
        queryClient.setQueryData(
          campaignKeys.adSets(campaignId),
          adSets.map(item => 
            item.id === adSetId ? { ...item, ...adSetData } : item
          )
        );
      }
      
      return { previousAdSet };
    },
    onSuccess: (data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.adSets(campaignId) });
      
      dispatch(addToast({
        type: 'success',
        title: 'Ad Set Updated',
        message: `"${data.name}" has been updated successfully`,
      }));
    },
    onError: (error: Error, { campaignId, adSetId }, context) => {
      if (context?.previousAdSet) {
        queryClient.setQueryData(
          campaignKeys.adSet(campaignId, adSetId),
          context.previousAdSet
        );
        
        // Revert in lists
        const adSets = queryClient.getQueryData<AdSet[]>(campaignKeys.adSets(campaignId));
        
        if (adSets) {
          queryClient.setQueryData(
            campaignKeys.adSets(campaignId),
            adSets.map(item => 
              item.id === adSetId ? context.previousAdSet : item
            )
          );
        }
      }
      
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Update Ad Set',
        message: error.message,
      }));
    },
  });

  const deleteAdSet = useMutation({
    mutationFn: ({ campaignId, adSetId }: { campaignId: string, adSetId: string }) => 
      campaignService.deleteAdSet(campaignId, adSetId),
    onMutate: async ({ campaignId, adSetId }) => {
      await queryClient.cancelQueries({ queryKey: campaignKeys.adSet(campaignId, adSetId) });
      await queryClient.cancelQueries({ queryKey: campaignKeys.adSets(campaignId) });
      
      const previousAdSet = queryClient.getQueryData<AdSet>(
        campaignKeys.adSet(campaignId, adSetId)
      );
      
      queryClient.setQueryData(campaignKeys.adSet(campaignId, adSetId), null);
      
      // Remove from lists
      const adSets = queryClient.getQueryData<AdSet[]>(campaignKeys.adSets(campaignId));
      
      if (adSets) {
        queryClient.setQueryData(
          campaignKeys.adSets(campaignId),
          adSets.filter(item => item.id !== adSetId)
        );
      }
      
      return { previousAdSet };
    },
    onSuccess: (_data, { campaignId, adSetId }) => {
      const adSetName = queryClient.getQueryData<AdSet>(campaignKeys.adSet(campaignId, adSetId))?.name || 'Ad Set';
      
      dispatch(addToast({
        type: 'success',
        title: 'Ad Set Deleted',
        message: `"${adSetName}" has been deleted`,
      }));
    },
    onError: (error: Error, { campaignId, adSetId }, context) => {
      if (context?.previousAdSet) {
        queryClient.setQueryData(
          campaignKeys.adSet(campaignId, adSetId),
          context.previousAdSet
        );
        
        // Revert in lists
        const adSets = queryClient.getQueryData<AdSet[]>(campaignKeys.adSets(campaignId));
        
        if (adSets) {
          queryClient.setQueryData(
            campaignKeys.adSets(campaignId),
            [...adSets, context.previousAdSet]
          );
        }
      }
      
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Delete Ad Set',
        message: error.message,
      }));
    },
  });

  // Ad operations
  const getAds = (campaignId: string, adSetId: string) => {
    return useQuery({
      queryKey: campaignKeys.ads(campaignId, adSetId),
      queryFn: () => campaignService.getAds(campaignId, adSetId),
      enabled: !!campaignId && !!adSetId,
    });
  };

  const getAdById = (campaignId: string, adSetId: string, adId: string) => {
    return useQuery({
      queryKey: campaignKeys.ad(campaignId, adSetId, adId),
      queryFn: () => campaignService.getAdById(campaignId, adSetId, adId),
      enabled: !!campaignId && !!adSetId && !!adId,
    });
  };

  const createAd = useMutation({
    mutationFn: ({ campaignId, adSetId, adData }: { campaignId: string, adSetId: string, adData: Omit<Ad, 'id' | 'adSetId'> }) => 
      campaignService.createAd(campaignId, adSetId, adData),
    onSuccess: (data, { campaignId, adSetId }) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.ads(campaignId, adSetId) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.adSet(campaignId, adSetId) });
      
      dispatch(addToast({
        type: 'success',
        title: 'Ad Created',
        message: `"${data.name}" has been created successfully`,
      }));
    },
    onError: (error: Error) => {
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Create Ad',
        message: error.message,
      }));
    },
  });

  const updateAd = useMutation({
    mutationFn: ({ campaignId, adSetId, adId, adData }: { campaignId: string, adSetId: string, adId: string, adData: Partial<Ad> }) => 
      campaignService.updateAd(campaignId, adSetId, adId, adData),
    onMutate: async ({ campaignId, adSetId, adId, adData }) => {
      await queryClient.cancelQueries({ queryKey: campaignKeys.ad(campaignId, adSetId, adId) });
      await queryClient.cancelQueries({ queryKey: campaignKeys.ads(campaignId, adSetId) });
      
      const previousAd = queryClient.getQueryData<Ad>(
        campaignKeys.ad(campaignId, adSetId, adId)
      );
      
      if (previousAd) {
        queryClient.setQueryData(
          campaignKeys.ad(campaignId, adSetId, adId),
          { ...previousAd, ...adData }
        );
      }
      
      // Update in lists
      const ads = queryClient.getQueryData<Ad[]>(campaignKeys.ads(campaignId, adSetId));
      
      if (ads) {
        queryClient.setQueryData(
          campaignKeys.ads(campaignId, adSetId),
          ads.map(item => 
            item.id === adId ? { ...item, ...adData } : item
          )
        );
      }
      
      return { previousAd };
    },
    onSuccess: (data, { campaignId, adSetId }) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.ads(campaignId, adSetId) });
      
      dispatch(addToast({
        type: 'success',
        title: 'Ad Updated',
        message: `"${data.name}" has been updated successfully`,
      }));
    },
    onError: (error: Error, { campaignId, adSetId, adId }, context) => {
      if (context?.previousAd) {
        queryClient.setQueryData(
          campaignKeys.ad(campaignId, adSetId, adId),
          context.previousAd
        );
        
        // Revert in lists
        const ads = queryClient.getQueryData<Ad[]>(campaignKeys.ads(campaignId, adSetId));
        
        if (ads) {
          queryClient.setQueryData(
            campaignKeys.ads(campaignId, adSetId),
            ads.map(item => 
              item.id === adId ? context.previousAd : item
            )
          );
        }
      }
      
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Update Ad',
        message: error.message,
      }));
    },
  });

  const deleteAd = useMutation({
    mutationFn: ({ campaignId, adSetId, adId }: { campaignId: string, adSetId: string, adId: string }) => 
      campaignService.deleteAd(campaignId, adSetId, adId),
    onMutate: async ({ campaignId, adSetId, adId }) => {
      await queryClient.cancelQueries({ queryKey: campaignKeys.ad(campaignId, adSetId, adId) });
      await queryClient.cancelQueries({ queryKey: campaignKeys.ads(campaignId, adSetId) });
      
      const previousAd = queryClient.getQueryData<Ad>(
        campaignKeys.ad(campaignId, adSetId, adId)
      );
      
      queryClient.setQueryData(campaignKeys.ad(campaignId, adSetId, adId), null);
      
      // Remove from lists
      const ads = queryClient.getQueryData<Ad[]>(campaignKeys.ads(campaignId, adSetId));
      
      if (ads) {
        queryClient.setQueryData(
          campaignKeys.ads(campaignId, adSetId),
          ads.filter(item => item.id !== adId)
        );
      }
      
      return { previousAd };
    },
    onSuccess: (_data, { campaignId, adSetId, adId }) => {
      const adName = queryClient.getQueryData<Ad>(campaignKeys.ad(campaignId, adSetId, adId))?.name || 'Ad';
      
      dispatch(addToast({
        type: 'success',
        title: 'Ad Deleted',
        message: `"${adName}" has been deleted`,
      }));
    },
    onError: (error: Error, { campaignId, adSetId, adId }, context) => {
      if (context?.previousAd) {
        queryClient.setQueryData(
          campaignKeys.ad(campaignId, adSetId, adId),
          context.previousAd
        );
        
        // Revert in lists
        const ads = queryClient.getQueryData<Ad[]>(campaignKeys.ads(campaignId, adSetId));
        
        if (ads) {
          queryClient.setQueryData(
            campaignKeys.ads(campaignId, adSetId),
            [...ads, context.previousAd]
          );
        }
      }
      
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Delete Ad',
        message: error.message,
      }));
    },
  });

  return {
    // Campaign operations
    getCampaignsList,
    getCampaignById,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    updateCampaignStatus,
    getCampaignMetrics,
    
    // Ad Set operations
    getAdSets,
    getAdSetById,
    createAdSet,
    updateAdSet,
    deleteAdSet,
    
    // Ad operations
    getAds,
    getAdById,
    createAd,
    updateAd,
    deleteAd,
  };
};

export default useCampaigns;