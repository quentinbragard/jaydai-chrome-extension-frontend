// src/components/welcome/onboarding/steps/PaymentStep/index.tsx
import React, { useState, useEffect } from 'react';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { stripeService } from '@/services/stripe/StripeService';
import { User } from '@/types';
import { PaymentResult } from '@/types/stripe';
import { PaymentSuccess } from './PaymentSuccess';
import { PaymentCancelled } from './PaymentCancelled';
import { PaymentDefault } from './PaymentDefault';

interface PaymentStepProps {
  user: User;
  onComplete: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  user,
  onComplete,
  onBack,
  onSkip,
}) => {
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');

    if (paymentStatus) {
      const result = stripeService.handlePaymentResult();
      setPaymentResult(result);

      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);

      if (result.success) {
        trackEvent(EVENTS.ONBOARDING_PAYMENT_COMPLETED, {
          userId: user.id,
          sessionId: result.sessionId,
        });
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else if (result.type === 'cancel') {
        trackEvent(EVENTS.ONBOARDING_PAYMENT_CANCELLED, { userId: user.id });
      }
    }
  }, [user.id, onComplete]);

  const handlePaymentSuccess = () => {
    setIsProcessing(true);
    trackEvent(EVENTS.ONBOARDING_PAYMENT_COMPLETED, { userId: user.id });
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const handleSkipPayment = () => {
    trackEvent(EVENTS.ONBOARDING_PAYMENT_SKIPPED, { userId: user.id });
    onSkip?.();
  };

  if (paymentResult?.success || isProcessing) {
    return <PaymentSuccess />;
  }

  if (paymentResult?.type === 'cancel') {
    return (
      <PaymentCancelled
        onTryAgain={() => setPaymentResult(null)}
        onSkip={handleSkipPayment}
      />
    );
  }

  return (
    <PaymentDefault
      user={user}
      onBack={onBack}
      onSkip={onSkip ? handleSkipPayment : undefined}
      onPaymentSuccess={handlePaymentSuccess}
      onPaymentCancel={() => setPaymentResult({ success: false, type: 'cancel' })}
    />
  );
};

export default PaymentStep;
