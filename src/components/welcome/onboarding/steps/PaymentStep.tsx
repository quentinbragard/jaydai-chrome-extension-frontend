// src/components/welcome/onboarding/steps/PaymentStep.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  ArrowLeft, 
  Shield, 
  Check, 
  Crown, 
  Sparkles, 
  Zap,
  Star,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { PricingSection } from '@/components/pricing/pricing-section';
import { toast } from 'sonner';
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

  const plans = stripeService.getPricingPlans();
  const monthlyPlan = plans.find(p => p.id === 'monthly');
  const yearlyPlan = plans.find(p => p.id === 'yearly');

  const features = [
    getMessage('feature1', undefined, 'Unlimited AI conversations'),
    getMessage('feature2', undefined, 'Smart template library'),
    getMessage('feature3', undefined, 'Energy usage insights'),
    getMessage('feature4', undefined, 'Priority customer support'),
    getMessage('feature5', undefined, 'Advanced analytics'),
    getMessage('feature6', undefined, 'Custom folder organization'),
  ].map(name => ({ name, description: '', included: true }));

  const pricingTiers = [
    {
      name: getMessage('premium_plan', undefined, 'Jaydai Premium'),
      price: { monthly: monthlyPlan?.price || 0, yearly: yearlyPlan?.price || 0 },
      description: getMessage('premiumDescriptionShort', undefined, 'Unlock all premium features'),
      features,
      highlight: true,
      badge: getMessage('best_value', undefined, 'Best value'),
      icon: <Crown className="jd-w-5 jd-h-5" />,
    },
  ];

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

  const handleSkipPayment = () => {
    trackEvent(EVENTS.ONBOARDING_PAYMENT_SKIPPED, {
      userId: user.id
    });
    onSkip?.();
  };

  const handleSelectPlan = async (period: 'monthly' | 'yearly') => {
    if (!user.email) {
      trackEvent(EVENTS.PAYMENT_FAILED, { userId: user.id });
      toast.error(getMessage('userEmailRequired', undefined, 'User email is required for payment'));
      return;
    }
    setIsProcessing(true);
    try {
      await stripeService.redirectToCheckout(period, user.id, user.email);
      trackEvent(EVENTS.PAYMENT_INITIATED, { userId: user.id, plan: period });
      toast.info(
        getMessage('redirectingToPayment', undefined, 'Redirecting to payment...'),
        { description: getMessage('completePaymentInNewTab', undefined, 'Complete your payment in the new tab') }
      );
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      toast.error(getMessage('paymentError', undefined, 'Payment failed'));
    }
  };

  // Show success state
  if (paymentResult?.success || isProcessing) {
    return (
      <motion.div
        className="jd-space-y-8 jd-text-center jd-py-12"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Success Animation */}
        <div className="jd-relative jd-flex jd-justify-center">
          <motion.div
            className="jd-relative jd-w-24 jd-h-24 jd-bg-gradient-to-r jd-from-green-500 jd-to-emerald-600 jd-rounded-full jd-flex jd-items-center jd-justify-center jd-shadow-2xl jd-shadow-green-500/30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Check className="jd-w-12 jd-h-12 jd-text-white" />
          </motion.div>
          
          {/* Celebration particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="jd-absolute jd-w-2 jd-h-2 jd-bg-yellow-400 jd-rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                x: [0, (i % 2 ? 80 : -80) * Math.sin(i * 45 * Math.PI / 180)],
                y: [0, (i % 2 ? 80 : -80) * Math.cos(i * 45 * Math.PI / 180)], 
              }}
              transition={{ 
                duration: 1.5,
                delay: 0.3 + (i * 0.05),
                ease: "easeOut" 
              }}
            />
          ))}
        </div>
        
        <div className="jd-space-y-4">
          <motion.h3 
            className="jd-text-3xl jd-font-bold jd-text-white jd-font-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            🎉 {getMessage('paymentSuccessful', undefined, 'Payment Successful!')}
          </motion.h3>
          <motion.p 
            className="jd-text-lg jd-text-gray-300 jd-max-w-md jd-mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {getMessage('paymentSuccessMessage', undefined, 'Welcome to Jaydai Premium! Your account has been upgraded.')}
          </motion.p>
        </div>

        <motion.div 
          className="jd-flex jd-justify-center jd-items-center jd-space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="jd-animate-spin jd-rounded-full jd-h-6 jd-w-6 jd-border-2 jd-border-blue-500 jd-border-t-transparent"></div>
          <span className="jd-text-blue-400 jd-text-sm">
            {getMessage('completing', undefined, 'Completing setup...')}
          </span>
        </motion.div>
      </motion.div>
    );
  }

  // Show cancellation state
  if (paymentResult?.type === 'cancel') {
    return (
      <motion.div
        className="jd-space-y-8 jd-text-center jd-py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="jd-w-16 jd-h-16 jd-bg-orange-500/20 jd-rounded-full jd-flex jd-items-center jd-justify-center jd-mx-auto">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 2 }}
          >
            <CreditCard className="jd-w-8 jd-h-8 jd-text-orange-400" />
          </motion.div>
        </div>
        
        <div className="jd-space-y-3">
          <h3 className="jd-text-2xl jd-font-bold jd-text-white jd-font-heading">
            {getMessage('paymentCancelled', undefined, 'Payment Cancelled')}
          </h3>
          <p className="jd-text-gray-400 jd-max-w-md jd-mx-auto">
            {getMessage('paymentCancelledMessage', undefined, 'No worries! You can upgrade to premium anytime.')}
          </p>
        </div>

        <div className="jd-flex jd-flex-col jd-space-y-4 jd-max-w-sm jd-mx-auto">
          <Button
            onClick={() => setPaymentResult(null)}
            className="jd-bg-gradient-to-r jd-from-blue-600 jd-to-purple-600 hover:jd-from-blue-700 hover:jd-to-purple-700 jd-shadow-lg hover:jd-shadow-xl jd-transition-all jd-duration-300"
            size="lg"
          >
            {getMessage('tryAgain', undefined, 'Try Again')}
          </Button>
          
          <Button
            onClick={handleSkipPayment}
            variant="ghost"
            className="jd-text-gray-400 hover:jd-text-white jd-transition-colors"
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
      className="jd-space-y-8"
    >
      {/* Hero Section */}
      <div className="jd-relative jd-text-center jd-py-8">
        {/* Background gradient */}
        <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-br jd-from-blue-600/10 jd-via-purple-600/10 jd-to-pink-600/10 jd-rounded-3xl jd-blur-3xl"></div>
        
        <div className="jd-relative jd-z-10">
          <motion.div 
            className="jd-inline-flex jd-items-center jd-justify-center jd-w-20 jd-h-20 jd-rounded-full jd-bg-gradient-to-r jd-from-blue-500 jd-to-purple-600 jd-shadow-2xl jd-shadow-blue-500/30 jd-mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.1 
            }}
          >
            <Crown className="jd-h-10 jd-w-10 jd-text-white" />
          </motion.div>
          
          <motion.h2 
            className="jd-text-3xl md:jd-text-4xl jd-font-bold jd-text-white jd-font-heading jd-mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="jd-bg-gradient-to-r jd-from-blue-400 jd-via-purple-400 jd-to-pink-400 jd-bg-clip-text jd-text-transparent">
              {getMessage('upgradeTitle', undefined, 'Unlock Premium Features')}
            </span>
          </motion.h2>
          
          <motion.p 
            className="jd-text-lg jd-text-gray-300 jd-max-w-2xl jd-mx-auto jd-mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {getMessage('premiumDescription', undefined, 'Get unlimited AI conversations, priority support, and exclusive templates to supercharge your productivity.')}
          </motion.p>

          {/* Premium Features Preview */}
          <motion.div 
            className="jd-flex jd-flex-wrap jd-justify-center jd-gap-4 jd-mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {[
              { icon: Zap, text: getMessage('unlimitedAI', undefined, 'Unlimited AI') },
              { icon: Shield, text: getMessage('prioritySupport', undefined, 'Priority Support') },
              { icon: Sparkles, text: getMessage('exclusiveTemplates', undefined, 'Exclusive Templates') },
              { icon: Star, text: getMessage('advancedFeatures', undefined, 'Advanced Features') }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="jd-flex jd-items-center jd-space-x-2 jd-bg-gray-800/50 jd-backdrop-blur-sm jd-rounded-full jd-px-4 jd-py-2 jd-border jd-border-gray-700/50"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <feature.icon className="jd-w-4 jd-h-4 jd-text-blue-400" />
                <span className="jd-text-sm jd-text-gray-300">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Special Offer Badge */}
      <motion.div
        className="jd-flex jd-justify-center jd-mb-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="jd-bg-gradient-to-r jd-from-green-500 jd-to-emerald-600 jd-rounded-full jd-px-6 jd-py-3 jd-flex jd-items-center jd-space-x-2 jd-shadow-lg">
          <Gift className="jd-w-5 jd-h-5 jd-text-white" />
          <span className="jd-text-white jd-font-semibold jd-text-sm">
            {getMessage('specialOffer', undefined, 'Special Launch Offer - Save 22% with Yearly Plan!')}
          </span>
        </div>
      </motion.div>

      {/* Pricing Plans */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <PricingSection
          tiers={pricingTiers}
          onSelectPlan={handleSelectPlan}
        />
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        className="jd-flex jd-justify-between jd-items-center jd-pt-8 jd-border-t jd-border-gray-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          onClick={onBack}
          variant="outline"
          className="jd-border-gray-700 jd-text-gray-300 hover:jd-bg-gray-800 hover:jd-border-gray-600 jd-transition-all jd-duration-200 jd-font-heading"
          size="lg"
        >
          <ArrowLeft className="jd-mr-2 jd-h-4 jd-w-4" />
          {getMessage('back', undefined, 'Back')}
        </Button>

        {onSkip && (
          <Button
            onClick={handleSkipPayment}
            variant="ghost"
            className="jd-text-gray-400 hover:jd-text-white jd-transition-colors jd-group"
            size="lg"
          >
            <span className="jd-group-hover:jd-mr-2 jd-transition-all jd-duration-200">
              {getMessage('skipForNow', undefined, 'Skip for now')}
            </span>
            <motion.span
              className="jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-opacity"
              initial={{ width: 0 }}
              whileHover={{ width: 'auto' }}
            >
              →
            </motion.span>
          </Button>
        )}
      </motion.div>

      {/* Security & Trust Indicators */}
      <motion.div
        className="jd-flex jd-flex-col jd-items-center jd-space-y-4 jd-pt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        {/* Security Notice */}
        <div className="jd-flex jd-items-center jd-space-x-2 jd-text-sm jd-text-gray-400">
          <Shield className="jd-w-4 jd-h-4 jd-text-green-400" />
          <span>
            {getMessage('securePayment', undefined, 'Secure payment powered by Stripe')}
          </span>
        </div>

        {/* Trust badges */}
        <div className="jd-flex jd-items-center jd-space-x-6 jd-text-xs jd-text-gray-500">
          <div className="jd-flex jd-items-center jd-space-x-1">
            <div className="jd-w-2 jd-h-2 jd-bg-green-500 jd-rounded-full"></div>
            <span>{getMessage('ssl', undefined, 'SSL Encrypted')}</span>
          </div>
          <div className="jd-flex jd-items-center jd-space-x-1">
            <div className="jd-w-2 jd-h-2 jd-bg-blue-500 jd-rounded-full"></div>
            <span>{getMessage('instantAccess', undefined, 'Instant Access')}</span>
          </div>
          <div className="jd-flex jd-items-center jd-space-x-1">
            <div className="jd-w-2 jd-h-2 jd-bg-purple-500 jd-rounded-full"></div>
            <span>{getMessage('cancelAnytime', undefined, 'Cancel Anytime')}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};