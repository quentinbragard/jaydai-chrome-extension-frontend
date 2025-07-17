// src/state/SubscriptionContext.tsx - Fixed version with proper memoization
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuthState } from '@/hooks/auth/useAuthState';
import { userApi } from '@/services/api/UserApi';
import { stripeService } from '@/services/stripe/StripeService';
import { toast } from 'sonner';
import { getMessage } from '@/core/utils/i18n';

export interface SubscriptionData {
  hasSubscription: boolean;
  subscription_status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'inactive' | 'incomplete' | 'unpaid';
  subscription_plan: string | null;
  isActive: boolean;
  isTrialing: boolean;
  isPastDue: boolean;
  isCancelled: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialStart?: string;
  trialEnd?: string;
  cancelledAt?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  isLoading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  cancelSubscription: () => Promise<boolean>;
  reactivateSubscription: () => Promise<boolean>;
}

const defaultSubscription: SubscriptionData = {
  hasSubscription: false,
  subscription_status: 'inactive',
  subscription_plan: null,
  isActive: false,
  isTrialing: false,
  isPastDue: false,
  isCancelled: false,
  cancelAtPeriodEnd: false,
};

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuthState();

  // Properly memoize the refreshSubscription function
  const refreshSubscription = useCallback(async () => {
    const userId = authState.user?.id;
    if (!userId) {
      setSubscription(defaultSubscription);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await userApi.getSubscriptionStatus();
      
      if (response.success) {
        setSubscription(response.data);
      } else {
        setError(response.message || 'Failed to fetch subscription status');
        setSubscription(defaultSubscription);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setError('Failed to fetch subscription status');
      setSubscription(defaultSubscription);
    } finally {
      setIsLoading(false);
    }
  }, [authState.user?.id]); // Only depend on user ID

  // Properly memoize the cancelSubscription function
  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    const userId = authState.user?.id;
    if (!userId) {
      return false;
    }

    try {
      setIsLoading(true);
      const success = await stripeService.cancelSubscription(userId);
      
      if (success) {
        await refreshSubscription();
        toast.success(getMessage('subscription_cancelled', undefined, 'Subscription cancelled successfully'));
        return true;
      } else {
        toast.error(getMessage('error_cancelling_subscription', undefined, 'Failed to cancel subscription'));
        return false;
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(getMessage('error_cancelling_subscription', undefined, 'Failed to cancel subscription'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authState.user?.id, refreshSubscription]);

  // Properly memoize the reactivateSubscription function
  const reactivateSubscription = useCallback(async (): Promise<boolean> => {
    const userId = authState.user?.id;
    if (!userId) {
      return false;
    }

    try {
      setIsLoading(true);
      const response = await userApi.reactivateSubscription();
      
      if (response.success) {
        await refreshSubscription();
        toast.success(getMessage('subscription_reactivated', undefined, 'Subscription reactivated successfully'));
        return true;
      } else {
        toast.error(getMessage('error_reactivating_subscription', undefined, 'Failed to reactivate subscription'));
        return false;
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error(getMessage('error_reactivating_subscription', undefined, 'Failed to reactivate subscription'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authState.user?.id, refreshSubscription]);

  // Only call refreshSubscription when user ID changes
  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]); // This is safe now because refreshSubscription is properly memoized

  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo<SubscriptionContextType>(() => ({
    subscription,
    isLoading,
    error,
    refreshSubscription,
    cancelSubscription,
    reactivateSubscription,
  }), [subscription, isLoading, error, refreshSubscription, cancelSubscription, reactivateSubscription]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Helper hooks for common subscription checks
export const useSubscriptionStatus = () => {
  const { subscription } = useSubscription();
  
  return React.useMemo(() => ({
    isActive: subscription?.isActive ?? false,
    isTrialing: subscription?.isTrialing ?? false,
    isPastDue: subscription?.isPastDue ?? false,
    isCancelled: subscription?.isCancelled ?? false,
    hasSubscription: subscription?.hasSubscription ?? false,
    planId: subscription?.subscription_plan ?? null,
    status: subscription?.subscription_status ?? 'inactive',
  }), [subscription]);
};

export const useSubscriptionActions = () => {
  const { cancelSubscription, reactivateSubscription, refreshSubscription } = useSubscription();
  
  return React.useMemo(() => ({
    cancelSubscription,
    reactivateSubscription,
    refreshSubscription,
  }), [cancelSubscription, reactivateSubscription, refreshSubscription]);
};