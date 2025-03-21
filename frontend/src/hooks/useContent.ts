import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { apiMethods } from '../services/api';
import { useDispatch } from 'react-redux';
import { addToast } from '../store/slices/uiSlice';

// Content interfaces
export interface ContentItem {
  id: string;
  title: string;
  description: string;
  content: string;
  brandId: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  type: 'blog' | 'social' | 'email' | 'ad' | 'other';
  scheduledDate?: string;
  publishedDate?: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentFilters {
  status?: string;
  type?: string;
  brandId?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface CreateContentInput {
  title: string;
  description: string;
  content: string;
  brandId: string;
  status: ContentItem['status'];
  type: ContentItem['type'];
  scheduledDate?: string;
  tags: string[];
}

export interface UpdateContentInput extends Partial<CreateContentInput> {
  id: string;
}

// Query keys for React Query
export const contentKeys = {
  all: ['contents'] as const,
  lists: () => [...contentKeys.all, 'list'] as const,
  list: (filters: ContentFilters = {}) => [...contentKeys.lists(), filters] as const,
  details: () => [...contentKeys.all, 'detail'] as const,
  detail: (id: string) => [...contentKeys.details(), id] as const,
};

/**
 * Hook for working with content items
 */
export const useContent = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  // Get content list with filters
  const getContentList = (filters: ContentFilters = {}) => {
    return useQuery({
      queryKey: contentKeys.list(filters),
      queryFn: () => apiMethods.get<ContentItem[]>('/content', filters),
      keepPreviousData: true,
    });
  };

  // Get a single content item by id
  const getContentById = (id: string) => {
    return useQuery({
      queryKey: contentKeys.detail(id),
      queryFn: () => apiMethods.get<ContentItem>(`/content/${id}`),
      // Only fetch if we have an id
      enabled: !!id,
    });
  };

  // Create a new content item with optimistic updates
  const createContent = useMutation({
    mutationFn: (newContent: CreateContentInput) => 
      apiMethods.post<ContentItem>('/content', newContent),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
      
      // Notify user
      dispatch(addToast({
        type: 'success',
        title: 'Content Created',
        message: `"${data.title}" has been created successfully`,
      }));
    },
    onError: (error: Error) => {
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Create Content',
        message: error.message,
      }));
    },
  });

  // Update an existing content item with optimistic updates
  const updateContent = useMutation({
    mutationFn: (updatedContent: UpdateContentInput) => 
      apiMethods.put<ContentItem>(`/content/${updatedContent.id}`, updatedContent),
    onMutate: async (updatedContent) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: contentKeys.detail(updatedContent.id) });
      await queryClient.cancelQueries({ queryKey: contentKeys.lists() });
      
      // Snapshot the previous value
      const previousContent = queryClient.getQueryData<ContentItem>(
        contentKeys.detail(updatedContent.id)
      );
      
      // Optimistically update to the new value
      if (previousContent) {
        queryClient.setQueryData(
          contentKeys.detail(updatedContent.id),
          { ...previousContent, ...updatedContent }
        );
      }
      
      // Update list queries that contain this content
      const allListsQueries = queryClient.getQueriesData<ContentItem[]>({ queryKey: contentKeys.lists() });
      
      allListsQueries.forEach(([queryKey, contents]) => {
        if (contents) {
          queryClient.setQueryData(queryKey, contents.map(item => 
            item.id === updatedContent.id ? { ...item, ...updatedContent } : item
          ));
        }
      });
      
      return { previousContent };
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: contentKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
      
      // Notify user
      dispatch(addToast({
        type: 'success',
        title: 'Content Updated',
        message: `"${data.title}" has been updated successfully`,
      }));
    },
    onError: (error: Error, variables, context) => {
      // Revert optimistic update
      if (context?.previousContent) {
        queryClient.setQueryData(
          contentKeys.detail(variables.id),
          context.previousContent
        );
        
        // Also revert in lists
        const allListsQueries = queryClient.getQueriesData<ContentItem[]>({ queryKey: contentKeys.lists() });
        
        allListsQueries.forEach(([queryKey, contents]) => {
          if (contents) {
            queryClient.setQueryData(queryKey, contents.map(item => 
              item.id === variables.id ? context.previousContent : item
            ));
          }
        });
      }
      
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Update Content',
        message: error.message,
      }));
    },
  });

  // Delete a content item with optimistic updates
  const deleteContent = useMutation({
    mutationFn: (id: string) => apiMethods.delete<void>(`/content/${id}`),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: contentKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: contentKeys.lists() });
      
      // Snapshot the previous item
      const previousContent = queryClient.getQueryData<ContentItem>(
        contentKeys.detail(id)
      );
      
      // Remove from detail
      queryClient.setQueryData(contentKeys.detail(id), null);
      
      // Remove from lists
      const allListsQueries = queryClient.getQueriesData<ContentItem[]>({ queryKey: contentKeys.lists() });
      
      allListsQueries.forEach(([queryKey, contents]) => {
        if (contents) {
          queryClient.setQueryData(queryKey, contents.filter(item => item.id !== id));
        }
      });
      
      return { previousContent };
    },
    onSuccess: (_data, id) => {
      // Get the content title for the toast message
      const contentTitle = queryClient.getQueryData<ContentItem>(contentKeys.detail(id))?.title || 'Content';
      
      dispatch(addToast({
        type: 'success',
        title: 'Content Deleted',
        message: `"${contentTitle}" has been deleted`,
      }));
    },
    onError: (error: Error, id, context) => {
      // Revert optimistic removal
      if (context?.previousContent) {
        queryClient.setQueryData(
          contentKeys.detail(id),
          context.previousContent
        );
        
        // Also revert in lists
        const allListsQueries = queryClient.getQueriesData<ContentItem[]>({ queryKey: contentKeys.lists() });
        
        allListsQueries.forEach(([queryKey, contents]) => {
          if (contents) {
            queryClient.setQueryData(queryKey, [...contents, context.previousContent]);
          }
        });
      }
      
      dispatch(addToast({
        type: 'error',
        title: 'Failed to Delete Content',
        message: error.message,
      }));
    },
  });

  // Update content status with optimistic update
  const updateContentStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContentItem['status'] }) => 
      apiMethods.patch<ContentItem>(`/content/${id}/status`, { status }),
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: contentKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: contentKeys.lists() });
      
      // Snapshot previous value
      const previousContent = queryClient.getQueryData<ContentItem>(
        contentKeys.detail(id)
      );
      
      // Optimistically update
      if (previousContent) {
        queryClient.setQueryData(
          contentKeys.detail(id),
          { ...previousContent, status }
        );
      }
      
      // Update in lists
      const allListsQueries = queryClient.getQueriesData<ContentItem[]>({ queryKey: contentKeys.lists() });
      
      allListsQueries.forEach(([queryKey, contents]) => {
        if (contents) {
          queryClient.setQueryData(queryKey, contents.map(item => 
            item.id === id ? { ...item, status } : item
          ));
        }
      });
      
      return { previousContent };
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: contentKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
      
      // Get status label for toast
      const statusLabels: Record<ContentItem['status'], string> = {
        draft: 'Draft',
        scheduled: 'Scheduled',
        published: 'Published',
        archived: 'Archived',
      };
      
      dispatch(addToast({
        type: 'success',
        title: 'Content Status Updated',
        message: `"${data.title}" is now ${statusLabels[data.status].toLowerCase()}`,
      }));
    },
    onError: (error: Error, variables, context) => {
      // Revert optimistic update
      if (context?.previousContent) {
        queryClient.setQueryData(
          contentKeys.detail(variables.id),
          context.previousContent
        );
        
        // Revert in lists
        const allListsQueries = queryClient.getQueriesData<ContentItem[]>({ queryKey: contentKeys.lists() });
        
        allListsQueries.forEach(([queryKey, contents]) => {
          if (contents) {
            queryClient.setQueryData(queryKey, contents.map(item => 
              item.id === variables.id ? context.previousContent : item
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

  // Prefetch a content item (for optimization)
  const prefetchContent = (id: string) => {
    return queryClient.prefetchQuery({
      queryKey: contentKeys.detail(id),
      queryFn: () => apiMethods.get<ContentItem>(`/content/${id}`),
    });
  };

  return {
    getContentList,
    getContentById,
    createContent,
    updateContent,
    deleteContent,
    updateContentStatus,
    prefetchContent,
  };
};

export default useContent;