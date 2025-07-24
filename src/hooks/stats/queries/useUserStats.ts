import { useQuery } from 'react-query';
import { userApi } from '@/services/api/UserApi';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Stats } from '@/services/analytics/StatsService';

/**
 * Fetch overall user stats
 */
export function useUserStats(enabled = true) {
  return useQuery(
    [QUERY_KEYS.USER_STATS],
    async () => {
      const response = await userApi.getUserStats();
      if (!response.success) {
        throw new Error(response.message || 'Failed to load stats');
      }
      const data = response.data || {};
      const stats: Stats = {
        totalChats: data.total_chats || 0,
        recentChats: data.recent_chats || 0,
        totalMessages: data.total_messages || 0,
        avgMessagesPerChat: data.avg_messages_per_chat || 0,
        messagesPerDay: data.messages_per_day || {},
        chatsPerDay: data.chats_per_day || {},
        efficiency: data.efficiency,
        tokenUsage: {
          recent: data.token_usage?.recent || 0,
          recentInput: data.token_usage?.recent_input || 0,
          recentOutput: data.token_usage?.recent_output || 0,
          total: data.token_usage?.total || 0,
          totalInput: data.token_usage?.total_input || 0,
          totalOutput: data.token_usage?.total_output || 0,
        },
        energyUsage: {
          recentWh: data.energy_usage?.recent_wh || 0,
          totalWh: data.energy_usage?.total_wh || 0,
          perMessageWh: data.energy_usage?.per_message_wh || 0,
          equivalent: data.energy_usage?.equivalent || '',
        },
        thinkingTime: {
          total: data.thinking_time?.total || 0,
          average: data.thinking_time?.average || 0,
        },
        modelUsage: data.model_usage || {},
      };
      return stats;
    },
    {
      enabled,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );
}

export default useUserStats;
