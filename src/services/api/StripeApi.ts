// src/services/api/StripeApi.ts
import { apiClient } from './ApiClient';
import {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  SubscriptionStatus
} from '@/types/stripe';

export interface SubscriptionStatusResponse {
  success: boolean;
  data: {
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
  };
}

export class StripeApi {
  /**
   * Create a Stripe checkout session
   */
  async createCheckoutSession(request: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
    try {
      const response = await apiClient.request('/stripe/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify(request)
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to create checkout session');
      }

      return {
        success: true,
        sessionId: response.sessionId,
        url: response.url
      };
    } catch (error) {
      console.error('❌ Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Get detailed subscription status for the current user
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
    return apiClient.request('/user/subscription-status');
  }

  /**
   * Reactivate a cancelled subscription
   */
  async reactivateSubscription(): Promise<any> {
    return apiClient.request('/user/subscription/reactivate', {
      method: 'POST'
    });
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const response = await apiClient.request('/stripe/cancel-subscription', {
        method: 'POST',
        body: JSON.stringify({ userId })
      });

      return response.success;
    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      return false;
    }
  }

  /**
   * Get customer portal URL
   */
  async getCustomerPortalUrl(userId: string, returnUrl: string): Promise<string | null> {
    try {
      const response = await apiClient.request('/stripe/customer-portal', {
        method: 'POST',
        body: JSON.stringify({ 
          userId,
          returnUrl
        })
      });

      return response.success ? response.url : null;
    } catch (error) {
      console.error('❌ Error getting customer portal URL:', error);
      return null;
    }
  }

  /**
   * Verify a checkout session
   */
  async verifyCheckoutSession(sessionId: string): Promise<{
    success: boolean;
    subscription?: SubscriptionStatus;
    error?: string;
  }> {
    try {
      const response = await apiClient.request('/stripe/verify-session', {
        method: 'POST',
        body: JSON.stringify({ sessionId })
      });

      return response;
    } catch (error) {
      console.error('❌ Error verifying checkout session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get pricing information
   */
  async getPricing(): Promise<{
    success: boolean;
    plans?: Array<{
      id: string;
      name: string;
      price: number;
      currency: string;
      interval: string;
      priceId: string;
    }>;
    error?: string;
  }> {
    try {
      const response = await apiClient.request('/stripe/pricing', {
        method: 'GET'
      });

      return response;
    } catch (error) {
      console.error('❌ Error getting pricing:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const stripeApi = new StripeApi();