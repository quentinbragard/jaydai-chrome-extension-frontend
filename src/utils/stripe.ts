// src/utils/stripe.ts
import { detectPlatform } from '@/extension/content/networkInterceptor/detectPlatform';
import { PaymentResult } from '@/types/stripe';
import { trackEvent, EVENTS } from '@/utils/amplitude';

export async function getAuthToken(): Promise<string | null> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['authToken']);
      if (result.authToken) {
        return result.authToken as string;
      }
    }

    const token =
      localStorage.getItem('authToken') ||
      localStorage.getItem('supabase.auth.token') ||
      sessionStorage.getItem('authToken');

    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export async function buildReturnUrl(type: 'success' | 'cancel'): Promise<string> {
  const baseUrl = type === 'success' ? 'https://jayd.ai/stripe-checkout' : 'https://jayd.ai/';
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

export function handlePaymentResult(): PaymentResult {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  const sessionId = urlParams.get('session_id');

  if (paymentStatus === 'success') {
    trackEvent(EVENTS.PAYMENT_COMPLETED, { sessionId });
    return { success: true, type: 'success', sessionId: sessionId || undefined };
  }

  if (paymentStatus === 'cancel') {
    trackEvent(EVENTS.PAYMENT_CANCELLED, { sessionId });
    return { success: false, type: 'cancel', sessionId: sessionId || undefined };
  }

  return { success: false, type: 'error', error: 'Unknown payment status' };
}
