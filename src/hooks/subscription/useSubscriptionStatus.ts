import { useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { stripeApi } from '@/services/api/StripeApi';
import { useAuthState } from '@/hooks/auth/useAuthState';
import { SubscriptionStatus } from '@/types/subscription';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useSubscriptionStatus() {
  const { authState } = useAuthState();
  const queryClient = useQueryClient();
  const userId = authState.user?.id;

  const query = useQuery<SubscriptionStatus>(
    [QUERY_KEYS.SUBSCRIPTION_STATUS, userId],
    () => stripeApi.getSubscriptionStatus(userId as string),
    {
      enabled: !!userId,
      staleTime: 60 * 60 * 1000,
      cacheTime: 60 * 60 * 1000,
    }
  );

  const refreshStatus = useCallback(async () => {
    if (userId) {
      await queryClient.invalidateQueries([QUERY_KEYS.SUBSCRIPTION_STATUS, userId]);
    }
  }, [queryClient, userId]);

  return {
    subscription: query.data ?? null,
    loading: query.isLoading,
    refreshStatus,
    error: query.error ? (query.error as Error).message : null,
  };
}
