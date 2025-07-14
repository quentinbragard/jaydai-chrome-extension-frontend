// src/services/stripe/StripeService.ts
import { apiClient } from '@/services/api/ApiClient';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { 
  StripeConfig, 
  PricingPlan, 
  CreateCheckoutSessionRequest, 
  CreateCheckoutSessionResponse,
  SubscriptionStatus,
  PaymentResult
} from '@/types/stripe';

export class StripeService {
  private config: StripeConfig;

  constructor() {
    this.config = {
      publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
      monthlyPriceId: process.env.VITE_STRIPE_MONTHLY_PRICE_ID || '',
      yearlyPriceId: process.env.VITE_STRIPE_YEARLY_PRICE_ID || '',
      successUrl: process.env.VITE_STRIPE_SUCCESS_URL || '',
      cancelUrl: process.env.VITE_STRIPE_CANCEL_URL || ''
    };

    // Validate configuration
    if (!this.config.publishableKey) {
      console.error('❌ Stripe publishable key not configured');
    }
  }

  /**
   * Get available pricing plans
   */
  getPricingPlans(): PricingPlan[] {
    return [
      {
        id: 'yearly',
        name: 'Yearly Plan',
        price: 6.99,
        currency: 'EUR',
        interval: 'year',
        priceId: this.config.yearlyPriceId,
        savings: 'Save 22%',
        popular: true
      },
      {
        id: 'monthly',
        name: 'Monthly Plan', 
        price: 8.99,
        currency: 'EUR',
        interval: 'month',
        priceId: this.config.monthlyPriceId
      }
    ];
  }

  /**
   * Create a Stripe checkout session via backend
   */
  async createCheckoutSession(
    planId: 'monthly' | 'yearly',
    userId: string,
    userEmail: string
  ): Promise<CreateCheckoutSessionResponse> {
    try {
      const plan = this.getPricingPlans().find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      // Track payment attempt
      trackEvent(EVENTS.PAYMENT_INITIATED, {
        planId,
        price: plan.price,
        currency: plan.currency,
        userId
      });

      const request: CreateCheckoutSessionRequest = {
        priceId: plan.priceId,
        successUrl: this.buildReturnUrl('success'),
        cancelUrl: this.buildReturnUrl('cancel'),
        userId,
        userEmail
      };

      const response = await apiClient.request('/stripe/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify(request)
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to create checkout session');
      }

      return response;
    } catch (error) {
      console.error('❌ Error creating checkout session:', error);
      
      // Track payment error
      trackEvent(EVENTS.PAYMENT_FAILED, {
        planId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });

      throw error;
    }
  }

  /**
   * Redirect to Stripe checkout
   */
  async redirectToCheckout(
    planId: 'monthly' | 'yearly',
    userId: string,
    userEmail: string
  ): Promise<void> {
    try {
      const session = await this.createCheckoutSession(planId, userId, userEmail);
      
      if (session.url) {
        // Open Stripe checkout in a new tab
        window.open(session.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('❌ Error redirecting to checkout:', error);
      throw error;
    }
  }

  /**
   * Get user's subscription status
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    try {
      const response = await apiClient.request(`/stripe/subscription-status/${userId}`, {
        method: 'GET'
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to get subscription status');
      }

      return response.subscription;
    } catch (error) {
      console.error('❌ Error getting subscription status:', error);
      
      // Return default status on error
      return {
        isActive: false,
        planId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      };
    }
  }

  /**
   * Handle payment result from URL parameters
   */
  handlePaymentResult(): PaymentResult {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    if (paymentStatus === 'success') {
      // Track successful payment
      trackEvent(EVENTS.PAYMENT_COMPLETED, {
        sessionId
      });

      return {
        success: true,
        type: 'success',
        sessionId: sessionId || undefined
      };
    } else if (paymentStatus === 'cancel') {
      // Track payment cancellation
      trackEvent(EVENTS.PAYMENT_CANCELLED, {
        sessionId
      });

      return {
        success: false,
        type: 'cancel',
        sessionId: sessionId || undefined
      };
    }

    return {
      success: false,
      type: 'error',
      error: 'Unknown payment status'
    };
  }

  /**
   * Build return URLs for Stripe checkout
   */
  private buildReturnUrl(type: 'success' | 'cancel'): string {
    const baseUrl = type === 'success' ? this.config.successUrl : this.config.cancelUrl;
    
    // Replace EXTENSION_ID placeholder with actual extension ID
    const extensionId = chrome.runtime.id;
    return baseUrl.replace('EXTENSION_ID', extensionId);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const response = await apiClient.request('/stripe/cancel-subscription', {
        method: 'POST',
        body: JSON.stringify({ userId })
      });

      if (response.success) {
        trackEvent(EVENTS.SUBSCRIPTION_CANCELLED, {
          userId
        });
      }

      return response.success;
    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      return false;
    }
  }

  /**
   * Get customer portal URL for managing subscription
   */
  async getCustomerPortalUrl(userId: string): Promise<string | null> {
    try {
      const response = await apiClient.request('/stripe/customer-portal', {
        method: 'POST',
        body: JSON.stringify({ 
          userId,
          returnUrl: this.buildReturnUrl('success')
        })
      });

      return response.success ? response.url : null;
    } catch (error) {
      console.error('❌ Error getting customer portal URL:', error);
      return null;
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();