// src/components/welcome/onboarding/steps/PaymentStep.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ArrowLeft, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { PricingSection } from '@/components/pricing/PricingSection';
import { stripeService } from '@/services/stripe/StripeService';
import { User } from '@/types';
import { PaymentResult } from '@/types/stripe';

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
  onSkip
}) => {
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check for payment result on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus) {
      const result = stripeService.handlePaymentResult();
      setPaymentResult(result);
      
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Track the result
      if (result.success) {
        trackEvent(EVENTS.ONBOARDING_PAYMENT_COMPLETED, {
          userId: user.id,
          sessionId: result.sessionId
        });
        
        // Auto-complete after success
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else if (result.type === 'cancel') {
        trackEvent(EVENTS.ONBOARDING_PAYMENT_CANCELLED, {
          userId: user.id
        });
      }
    }
  }, [user.id, onComplete]);

  const handlePaymentSuccess = () => {
    setIsProcessing(true);
    trackEvent(EVENTS.ONBOARDING_PAYMENT_COMPLETED, {
      userId: user.id
    });
    
    // Show success state briefly before completing
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const handleSkipPayment = () => {
    trackEvent(EVENTS.ONBOARDING_PAYMENT_SKIPPED, {
      userId: user.id
    });
    onSkip?.();
  };

  // Show success state
  if (paymentResult?.success || isProcessing) {
    return (
      <motion.div
        className="jd-space-y-6 jd-text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="jd-flex jd-justify-center">
          <motion.div
            className="jd-w-16 jd-h-16 jd-bg-green-600 jd-rounded-full jd-flex jd-items-center jd-justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Check className="jd-w-8 jd-h-8 jd-text-white" />
          </motion.div>
        </div>
        
        <div className="jd-space-y-2">
          <h3 className="jd-text-2xl jd-font-bold jd-text-white jd-font-heading">
            {getMessage('paymentSuccessful', undefined, 'Payment Successful!')}
          </h3>
          <p className="jd-text-gray-300">
            {getMessage('paymentSuccessMessage', undefined, 'Welcome to Jaydai Premium! Your account has been upgraded.')}
          </p>
        </div>

        <div className="jd-flex jd-justify-center">
          <div className="jd-animate-spin jd-rounded-full jd-h-8 jd-w-8 jd-border-b-2 jd-border-blue-500"></div>
        </div>
      </motion.div>
    );
  }

  // Show cancellation state
  if (paymentResult?.type === 'cancel') {
    return (
      <motion.div
        className="jd-space-y-6 jd-text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="jd-text-center">
          <h3 className="jd-text-xl jd-font-medium jd-text-white jd-mb-2">
            {getMessage('paymentCancelled', undefined, 'Payment Cancelled')}
          </h3>
          <p className="jd-text-gray-400 jd-text-sm">
            {getMessage('paymentCancelledMessage', undefined, 'No worries! You can upgrade to premium anytime.')}
          </p>
        </div>

        <div className="jd-flex jd-flex-col jd-space-y-3">
          <Button
            onClick={() => setPaymentResult(null)}
            className="jd-bg-blue-600 hover:jd-bg-blue-700"
          >
            {getMessage('tryAgain', undefined, 'Try Again')}
          </Button>
          
          <Button
            onClick={handleSkipPayment}
            variant="ghost"
            className="jd-text-gray-400 hover:jd-text-white"
          >
            {getMessage('continueWithFree', undefined, 'Continue with Free Plan')}
          </Button>
        </div>
      </motion.div>
    );
  }

  // Default payment selection state
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="jd-space-y-6"
    >
      <div className="jd-text-center jd-mb-8">
        <motion.div 
          className="jd-inline-flex jd-items-center jd-justify-center jd-w-16 jd-h-16 jd-rounded-full jd-bg-blue-500/10 jd-mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: 0.1 
          }}
        >
          <CreditCard className="jd-h-8 jd-w-8 jd-text-blue-400" />
        </motion.div>
        <h3 className="jd-text-xl jd-font-medium jd-text-white jd-mb-2">
          {getMessage('upgradeToPremium', undefined, 'Upgrade to Premium')}
        </h3>
        <p className="jd-text-gray-400 jd-text-sm jd-max-w-md jd-mx-auto">
          {getMessage('premiumDescription', undefined, 'Unlock all features and get the most out of your AI experience')}
        </p>
      </div>

      {/* Pricing Plans */}
      <PricingSection
        user={user}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentCancel={() => setPaymentResult({ success: false, type: 'cancel' })}
      />

      {/* Action Buttons */}
      <div className="jd-flex jd-justify-between jd-pt-6 jd-border-t jd-border-gray-800">
        <Button
          onClick={onBack}
          variant="outline"
          className="jd-border-gray-700 jd-text-white hover:jd-bg-gray-800 jd-transition-all jd-duration-200 jd-font-heading"
        >
          <ArrowLeft className="jd-mr-2 jd-h-4 jd-w-4" />
          {getMessage('back', undefined, 'Back')}
        </Button>

        {onSkip && (
          <Button
            onClick={handleSkipPayment}
            variant="ghost"
            className="jd-text-gray-400 hover:jd-text-white jd-transition-colors"
          >
            {getMessage('skipForNow', undefined, 'Skip for now')}
          </Button>
        )}
      </div>

      {/* Security Notice */}
      <div className="jd-flex jd-items-center jd-justify-center jd-space-x-2 jd-text-xs jd-text-gray-500 jd-pt-4">
        <Shield className="jd-w-3 jd-h-3" />
        <span>
          {getMessage('securePayment', undefined, 'Secure payment powered by Stripe')}
        </span>
      </div>
    </motion.div>
  );
};