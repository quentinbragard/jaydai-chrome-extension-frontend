import { useState, useEffect, useCallback, useMemo } from 'react';
import { stripeApi } from '@/services/api/StripeApi';
import { useAuthState } from '@/hooks/auth/useAuthState';
import { SubscriptionData } from '@/types/subscription';

export function useSubscriptionStatus() {
  const { authState } = useAuthState();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
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
      setSubscription(result as unknown as SubscriptionData);
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

  const flags = useMemo(() => ({
    isActive: subscription?.isActive ?? false,
    isTrialing: subscription?.isTrialing ?? false,
    isPastDue: subscription?.isPastDue ?? false,
    isCancelled: subscription?.isCancelled ?? false,
    hasSubscription: subscription?.hasSubscription ?? false,
    planId: subscription?.subscription_plan ?? null,
    status: subscription?.subscription_status ?? 'inactive',
  }), [subscription]);

  return { subscription, loading, error, refreshStatus: fetchStatus, ...flags };
}
