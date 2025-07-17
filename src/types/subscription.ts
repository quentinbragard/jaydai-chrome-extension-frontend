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

export interface SubscriptionStatus {
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'inactive'
  planName: string | null;
  createdAt: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}
