import { useSubscriptionStatus } from '@/hooks/subscription/useSubscriptionStatus';

/**
 * Component that prefetches the user's subscription status on app load.
 * It renders nothing but ensures the data is cached for later use.
 */
export const SubscriptionPrefetcher: React.FC = () => {
  useSubscriptionStatus();
  return null;
};

export default SubscriptionPrefetcher;
