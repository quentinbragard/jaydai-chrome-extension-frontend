import { useQuery } from 'react-query';
import { userApi } from '@/services/api/UserApi';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { MessageDistributionResponse } from '@/types/services/api';

/**
 * Fetch message distribution statistics
 */
export function useMessageDistribution(enabled = true) {
  return useQuery(
    [QUERY_KEYS.MESSAGE_DISTRIBUTION],
    async () => {
      const response = await userApi.getMessageDistribution();
      if ('success' in response) {
        if (!response.success) {
          throw new Error(response.message || 'Failed to load message distribution');
        }
        return response.data as MessageDistributionResponse;
      }
      return response as MessageDistributionResponse;
    },
    {
      enabled,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );
}

export default useMessageDistribution;
