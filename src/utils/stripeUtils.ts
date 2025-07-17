import { stripeApi } from '@/services/api/StripeApi';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { PricingPlan, PaymentResult } from '@/types/stripe';
import { detectPlatform } from '@/extension/content/networkInterceptor/detectPlatform';

const STRIPE_CONFIG = {
  publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  monthlyPriceId: process.env.VITE_STRIPE_PLUS_MONTHLY_PRICE_ID || '',
  yearlyPriceId: process.env.VITE_STRIPE_PLUS_YEARLY_PRICE_ID || '',
  successUrl: 'https://jayd.ai/stripe-checkout',
  cancelUrl: 'https://jayd.ai/'
};

export const getPricingPlans = (): PricingPlan[] => [
  {
    id: 'yearly',
    name: 'Yearly Plan',
    price: 6.99,
    currency: 'EUR',
    interval: 'year',
    priceId: STRIPE_CONFIG.yearlyPriceId,
    savings: 'Save 22%',
    popular: true
  },
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 8.99,
    currency: 'EUR',
    interval: 'month',
    priceId: STRIPE_CONFIG.monthlyPriceId
  }
];

async function getAuthToken(): Promise<string | null> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['authToken']);
      if (result.authToken) {
        return result.authToken;
      }
    }

    const token =
      localStorage.getItem('authToken') ||
      localStorage.getItem('supabase.auth.token') ||
      sessionStorage.getItem('authToken');

    return token;
  } catch (error) {
    console.error('❌ Error getting auth token:', error);
    return null;
  }
}

export async function buildReturnUrl(type: 'success' | 'cancel'): Promise<string> {
  const baseUrl = type === 'success' ? STRIPE_CONFIG.successUrl : STRIPE_CONFIG.cancelUrl;
  const authToken = await getAuthToken();
  const url = new URL(baseUrl);
  if (authToken) {
    url.searchParams.set('auth_token', authToken);
  }
  if (detectPlatform() !== 'unknown') {
    url.searchParams.set('redirect_url', window.location.href);
  }
  return url.toString();
}

export async function redirectToCheckout(
  planId: 'monthly' | 'yearly',
  userId: string,
  userEmail: string
): Promise<void> {
  const plan = getPricingPlans().find(p => p.id === planId);
  if (!plan) {
    throw new Error('Invalid plan selected');
  }

  trackEvent(EVENTS.PAYMENT_INITIATED, {
    planId,
    price: plan.price,
    currency: plan.currency,
    userId
  });

  const session = await stripeApi.createCheckoutSession({
    priceId: plan.priceId,
    successUrl: await buildReturnUrl('success'),
    cancelUrl: await buildReturnUrl('cancel'),
    userId,
    userEmail
  });

  if (session.url) {
    window.open(session.url, '_blank');
  } else {
    trackEvent(EVENTS.PAYMENT_FAILED, { planId, userId });
    throw new Error('No checkout URL received');
  }
}

export function handlePaymentResult(): PaymentResult {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  const sessionId = urlParams.get('session_id');

  if (paymentStatus === 'success') {
    trackEvent(EVENTS.PAYMENT_COMPLETED, { sessionId });
    return {
      success: true,
      type: 'success',
      sessionId: sessionId || undefined
    };
  }

  if (paymentStatus === 'cancel') {
    trackEvent(EVENTS.PAYMENT_CANCELLED, { sessionId });
    return {
      success: false,
      type: 'cancel',
      sessionId: sessionId || undefined
    };
  }

  return { success: false, type: 'error', error: 'Unknown payment status' };
}

export async function getCustomerPortalUrl(userId: string): Promise<string | null> {
  return stripeApi.getCustomerPortalUrl(userId, await buildReturnUrl('success'));
}
