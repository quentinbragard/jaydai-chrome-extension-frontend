// src/hooks/prompts/useBlockActions.ts
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'sonner';
import { promptApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { trackEvent, EVENTS } from '@/utils/amplitude';

/**
 * Hook for managing blocks with integrated React Query
 */
export function useBlockActions() {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  /**
   * Fetch blocks of a specific type
   */
  const { data: blockTypes = [], isLoading: isLoadingTypes } = useQuery(
    [QUERY_KEYS.BLOCK_TYPES],
    async () => {
      const response = await promptApi.getBlockTypes();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch block types');
      }
      return response.types || [];
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1
    }
  );

  /**
   * Fetch blocks with optional type filter 
   */
  const useBlocks = (type?: string) => {
    return useQuery(
      [QUERY_KEYS.BLOCKS, type],
      async () => {
        const response = await promptApi.getBlocks(type);
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch blocks');
        }
        return response.blocks || [];
      },
      {
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!type // Only fetch if type is provided
      }
    );
  };

  /**
   * Create block mutation
   */
  const createBlock = useMutation(
    async (blockData: any) => {
      setIsLoading(true);
      try {
        const response = await promptApi.createBlock(blockData);
        if (!response.success) {
          throw new Error(response.error || 'Failed to create block');
        }
        return response.block;
      } finally {
        setIsLoading(false);
      }
    },
    {
      onSuccess: () => {
        toast.success('Block created successfully');
        // Invalidate blocks queries to refresh data
        queryClient.invalidateQueries(QUERY_KEYS.BLOCKS);
        
        // Track analytics event
        trackEvent(EVENTS.BLOCK_CREATED, {
          success: true
        });
      },
      onError: (error: any) => {
        toast.error(`Failed to create block: ${error.message}`);
        
        // Track analytics event with error
        trackEvent(EVENTS.BLOCK_CREATED, {
          success: false,
          error: error.message
        });
      }
    }
  );

  /**
   * Update block mutation
   */
  const updateBlock = useMutation(
    async ({ blockId, data }: { blockId: number; data: any }) => {
      setIsLoading(true);
      try {
        const response = await promptApi.updateBlock(blockId, data);
        if (!response.success) {
          throw new Error(response.error || 'Failed to update block');
        }
        return response.block;
      } finally {
        setIsLoading(false);
      }
    },
    {
      onSuccess: () => {
        toast.success('Block updated successfully');
        // Invalidate blocks queries to refresh data
        queryClient.invalidateQueries(QUERY_KEYS.BLOCKS);
      },
      onError: (error: any) => {
        toast.error(`Failed to update block: ${error.message}`);
      }
    }
  );

  /**
   * Delete block mutation
   */
  const deleteBlock = useMutation(
    async (blockId: number) => {
      setIsLoading(true);
      try {
        const response = await promptApi.deleteBlock(blockId);
        if (!response.success) {
          throw new Error(response.error || 'Failed to delete block');
        }
        return blockId;
      } finally {
        setIsLoading(false);
      }
    },
    {
      onSuccess: () => {
        toast.success('Block deleted successfully');
        // Invalidate blocks queries to refresh data
        queryClient.invalidateQueries(QUERY_KEYS.BLOCKS);
      },
      onError: (error: any) => {
        toast.error(`Failed to delete block: ${error.message}`);
      }
    }
  );

  /**
   * Group blocks by type
   */
  const groupBlocksByType = useCallback((blocks: any[]) => {
    return blocks.reduce((grouped, block) => {
      if (!grouped[block.type]) {
        grouped[block.type] = [];
      }
      grouped[block.type].push(block);
      return grouped;
    }, {} as Record<string, any[]>);
  }, []);

  return {
    isLoading,
    blockTypes,
    isLoadingTypes,
    useBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    groupBlocksByType
  };
}

export default useBlockActions;