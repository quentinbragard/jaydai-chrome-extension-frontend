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

  const flags = useMemo(() => {
    const isActive = subscription?.isActive ?? false;
    const isTrialing = subscription?.isTrialing ?? false;
    const isPastDue = subscription?.isPastDue ?? false;
    const isCancelled = subscription?.isCancelled ?? false;

    const planId =
      (subscription as any)?.subscription_plan ??
      (subscription as any)?.planId ??
      null;

    const hasSubscription =
      subscription?.hasSubscription ??
      isActive || isTrialing || isPastDue || isCancelled;

    const status =
      (subscription as any)?.subscription_status ??
      (subscription as any)?.status ??
      (isActive
        ? 'active'
        : isTrialing
        ? 'trialing'
        : isPastDue
        ? 'past_due'
        : isCancelled
        ? 'cancelled'
        : 'inactive');

    return {
      isActive,
      isTrialing,
      isPastDue,
      isCancelled,
      hasSubscription,
      planId,
      status,
    };
  }, [subscription]);

  return { subscription, loading, error, refreshStatus: fetchStatus, ...flags };
}
