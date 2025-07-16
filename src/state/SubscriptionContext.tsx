import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SubscriptionStatus } from '@/types/stripe';
import { stripeService } from '@/services/stripe/StripeService';
import { authService } from '@/services/auth/AuthService';

interface SubscriptionContextType {
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadSubscription = useCallback(async (userId: string | null) => {
    if (!userId) {
      setSubscription(null);
      return;
    }
    try {
      setIsLoading(true);
      const status = await stripeService.getSubscriptionStatus(userId);
      setSubscription(status);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const state = authService.getAuthState();
    loadSubscription(state.user?.id || null);

    const unsubscribe = authService.subscribe((authState) => {
      loadSubscription(authState.user?.id || null);
    });

    return () => {
      unsubscribe();
    };
  }, [loadSubscription]);

  const refreshSubscription = useCallback(async () => {
    const state = authService.getAuthState();
    await loadSubscription(state.user?.id || null);
  }, [loadSubscription]);

  const value: SubscriptionContextType = {
    subscription,
    isLoading,
    refreshSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  );
};

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
