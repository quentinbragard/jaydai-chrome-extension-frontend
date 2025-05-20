// src/hooks/prompts/queries/blocks/useBlockTypes.ts

import { useQuery } from 'react-query';
import { promptApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';

/**
 * Hook to fetch all available block types
 */
export function useBlockTypes() {
  return useQuery(
    QUERY_KEYS.BLOCK_TYPES,
    async () => {
      const response = await promptApi.getBlockTypes();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch block types');
      }
      return response.types || [];
    },
    {
      staleTime: 60 * 60 * 1000, // 1 hour
      refetchOnWindowFocus: false,
    }
  );
}
