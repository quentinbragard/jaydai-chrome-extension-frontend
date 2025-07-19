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
import { detectPlatform } from '@/extension/content/networkInterceptor/detectPlatform';

export class StripeService {
  private config: StripeConfig;

  constructor() {
    this.config = {
      publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
      monthlyPriceId: process.env.VITE_STRIPE_PLUS_MONTHLY_PRICE_ID || '',
      yearlyPriceId: process.env.VITE_STRIPE_PLUS_YEARLY_PRICE_ID || '',
      successUrl: 'https://jayd.ai/stripe-checkout',
      cancelUrl: 'https://jayd.ai/',
      redirectUrl: detectPlatform() !== 'unknown' ? window.location.href : undefined
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
    planName: 'monthly' | 'yearly',
    userId: string,
    userEmail: string
  ): Promise<CreateCheckoutSessionResponse> {
    try {
      const plan = this.getPricingPlans().find(p => p.id === planName);
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      // Track payment attempt
      trackEvent(EVENTS.PAYMENT_INITIATED, {
        planName,
        price: plan.price,
        currency: plan.currency,
        userId
      });

      const request: CreateCheckoutSessionRequest = {
        priceId: plan.priceId,
        successUrl: await this.buildReturnUrl('success'),
        cancelUrl: await this.buildReturnUrl('cancel'),
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
        planName,
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
    planName: 'monthly' | 'yearly',
    userId: string,
    userEmail: string
  ): Promise<void> {
    try {
      const session = await this.createCheckoutSession(planName, userId, userEmail);
      
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
      const response = await apiClient.request(`/user/subscription-status`, {
        method: 'GET'
      });

      console.log('response --->', response);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get subscription status');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error getting subscription status:', error);
      throw error;
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
   * Build return URLs for Stripe checkout with auth token
   */
  private async buildReturnUrl(type: 'success' | 'cancel'): Promise<string> {
    const baseUrl = type === 'success' ? this.config.successUrl : this.config.cancelUrl;
    
    // Get the current auth token from storage or API client
    const authToken = await this.getAuthToken();
    
    // Add auth token and extension ID to the URL
    const url = new URL(baseUrl);
    if (authToken) {
      url.searchParams.set('auth_token', authToken);
    }
    
    return url.toString();
  }

  /**
   * Get the current auth token
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      // Try to get token from chrome storage first
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['authToken']);
        if (result.authToken) {
          return result.authToken;
        }
      }

      // Fallback to get from API client or localStorage
      const token = localStorage.getItem('authToken') || 
                   localStorage.getItem('supabase.auth.token') ||
                   sessionStorage.getItem('authToken');
      
      return token;
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
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
          returnUrl: await this.buildReturnUrl('success')
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


