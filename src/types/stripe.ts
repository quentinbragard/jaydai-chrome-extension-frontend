// src/types/stripe.ts
export interface StripeConfig {
    publishableKey: string;
    monthlyPriceId: string;
    yearlyPriceId: string;
    successUrl: string;
    cancelUrl: string;
    redirectUrl?: string;
  }
  
  export interface PricingPlan {
    id: 'monthly' | 'yearly';
    name: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    priceId: string;
    savings?: string;
    popular?: boolean;
  }
  
  export interface CreateCheckoutSessionRequest {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    userId: string;
    userEmail: string;
    redirectUrl?: string;
  }
  
  export interface CreateCheckoutSessionResponse {
    success: boolean;
    sessionId: string;
    url: string;
    error?: string;
  }
  
  export interface SubscriptionStatus {
    isActive: boolean;
    planName: 'monthly' | 'yearly' | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  }
  
  export interface PaymentResult {
    success: boolean;
    type: 'success' | 'cancel' | 'error';
    sessionId?: string;
    error?: string;
  }