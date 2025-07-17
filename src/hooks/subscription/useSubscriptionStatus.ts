import { useState, useEffect, useCallback, useMemo } from 'react';
import { stripeApi } from '@/services/api/StripeApi';
import { useAuthState } from '@/hooks/auth/useAuthState';
import { SubscriptionStatus } from '@/types/subscription';

export function useSubscriptionStatus() {
  const { authState } = useAuthState();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    const userId = authState.user?.id;
    if (!userId) {
      setSubscription(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await stripeApi.getSubscriptionStatus(userId);
      setSubscription(result as unknown as SubscriptionStatus);
    } catch (err) {
      console.error('Error fetching subscription status:', err);
      setError('Failed to fetch subscription status');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [authState.user?.id]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    subscription,
    loading,
    refreshStatus: fetchStatus,
    error
  };
}
