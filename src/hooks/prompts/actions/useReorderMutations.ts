// src/hooks/prompts/actions/useReorderMutations.ts - Enhanced version
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'sonner';
import { promptApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useSafeQuery } from '@/providers/QueryProvider';
import { useCallback } from 'react';

export interface ReorderItem {
  id: number;
  sort_order: number;
  is_priority?: boolean;
}

interface ReorderFoldersParams {
  items: ReorderItem[];
  parent_folder_id?: number | null;
}

interface ReorderTemplatesParams {
  items: ReorderItem[];
  folder_id?: number | null;
}

/**
 * Enhanced hook for reordering mutations with better error handling and optimistic updates
 */
export function useReorderMutations() {
  const { isQueryAvailable, queryClient: safeQueryClient } = useSafeQuery();
  
  let queryClient;
  try {
    queryClient = useQueryClient();
  } catch (error) {
    queryClient = safeQueryClient;
    
    if (!isQueryAvailable) {
      console.warn("QueryClient not available for reordering. Some features may be limited.");
    }
  }

  // Invalidate relevant queries after reordering
  const invalidateQueries = useCallback(async () => {
    if (queryClient) {
      // Invalidate all relevant queries
      await Promise.all([
        queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS),
        queryClient.invalidateQueries(QUERY_KEYS.USER_TEMPLATES),
        queryClient.invalidateQueries(QUERY_KEYS.UNORGANIZED_TEMPLATES),
        queryClient.invalidateQueries(QUERY_KEYS.COMPANY_FOLDERS),
        queryClient.invalidateQueries(QUERY_KEYS.ORGANIZATION_FOLDERS),
        queryClient.invalidateQueries(QUERY_KEYS.PINNED_FOLDERS)
      ]);
    }
  }, [queryClient]);

  // Enhanced reorder folders mutation
  const reorderFolders = (() => {
    try {
      return useMutation(
        async (params: ReorderFoldersParams) => {
          // Validate parameters
          if (!params.items || params.items.length === 0) {
            throw new Error('No items to reorder');
          }

          // Validate each item has required fields
          for (const item of params.items) {
            if (!item.id || typeof item.sort_order !== 'number') {
              throw new Error('Invalid item data: missing id or sort_order');
            }
          }

          console.log('Reordering folders:', params);
          
          const response = await promptApi.reorderFolders(params);
          
          if (!response.success) {
            throw new Error(response.message || 'Failed to reorder folders');
          }
          
          return response.data;
        },
        {
          onSuccess: async (data, variables) => {
            console.log('Folders reordered successfully:', data);
            
            // Invalidate queries to refresh data
            await invalidateQueries();
            
            // Show success message (optional)
            toast.success(`${variables.items.length} folder(s) reordered successfully`);
          },
          onError: (error: Error) => {
            console.error('Error reordering folders:', error);
            toast.error(`Failed to reorder folders: ${error.message}`);
          }
        }
      );
    } catch (error) {
      // Fallback for when React Query isn't available
      console.warn("Using direct API fallback for reorderFolders");
      return {
        mutateAsync: async (params: ReorderFoldersParams) => {
          try {
            // Validate parameters
            if (!params.items || params.items.length === 0) {
              throw new Error('No items to reorder');
            }

            console.log('Reordering folders (fallback):', params);
            
            const response = await promptApi.reorderFolders(params);
            
            if (!response.success) {
              throw new Error(response.message || 'Failed to reorder folders');
            }
            
            toast.success(`${params.items.length} folder(s) reordered successfully`);
            return response.data;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error reordering folders:', error);
            toast.error(`Failed to reorder folders: ${errorMessage}`);
            throw error;
          }
        },
        isLoading: false,
        reset: () => {}
      };
    }
  })();

  // Enhanced reorder templates mutation
  const reorderTemplates = (() => {
    try {
      return useMutation(
        async (params: ReorderTemplatesParams) => {
          // Validate parameters
          if (!params.items || params.items.length === 0) {
            throw new Error('No items to reorder');
          }

          // Validate each item has required fields
          for (const item of params.items) {
            if (!item.id || typeof item.sort_order !== 'number') {
              throw new Error('Invalid item data: missing id or sort_order');
            }
          }

          console.log('Reordering templates:', params);
          
          const response = await promptApi.reorderTemplates(params);
          
          if (!response.success) {
            throw new Error(response.message || 'Failed to reorder templates');
          }
          
          return response.data;
        },
        {
          onSuccess: async (data, variables) => {
            console.log('Templates reordered successfully:', data);
            
            // Invalidate queries to refresh data
            await invalidateQueries();
            
            // Show success message (optional)
            toast.success(`${variables.items.length} template(s) reordered successfully`);
          },
          onError: (error: Error) => {
            console.error('Error reordering templates:', error);
            toast.error(`Failed to reorder templates: ${error.message}`);
          }
        }
      );
    } catch (error) {
      // Fallback for when React Query isn't available
      console.warn("Using direct API fallback for reorderTemplates");
      return {
        mutateAsync: async (params: ReorderTemplatesParams) => {
          try {
            // Validate parameters
            if (!params.items || params.items.length === 0) {
              throw new Error('No items to reorder');
            }

            console.log('Reordering templates (fallback):', params);
            
            const response = await promptApi.reorderTemplates(params);
            
            if (!response.success) {
              throw new Error(response.message || 'Failed to reorder templates');
            }
            
            toast.success(`${params.items.length} template(s) reordered successfully`);
            return response.data;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error reordering templates:', error);
            toast.error(`Failed to reorder templates: ${errorMessage}`);
            throw error;
          }
        },
        isLoading: false,
        reset: () => {}
      };
    }
  })();

  return {
    reorderFolders,
    reorderTemplates,
    invalidateQueries // Export this for manual cache invalidation if needed
  };
}