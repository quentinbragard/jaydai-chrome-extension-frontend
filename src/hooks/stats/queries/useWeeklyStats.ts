import { useQuery } from 'react-query';
import { userApi } from '@/services/api/UserApi';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { WeeklyConversationsResponse } from '@/types/services/api';

/**
 * Fetch weekly conversation statistics
 */
export function useWeeklyStats(enabled = true) {
  return useQuery(
    [QUERY_KEYS.WEEKLY_STATS],
    async () => {
      const response = await userApi.getWeeklyConversationStats();
      if ('success' in response) {
        if (!response.success) {
          throw new Error(response.message || 'Failed to load weekly stats');
        }
        return response.data as WeeklyConversationsResponse;
      }
      return response as WeeklyConversationsResponse;
    },
    {
      enabled,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );
}

export default useWeeklyStats;
