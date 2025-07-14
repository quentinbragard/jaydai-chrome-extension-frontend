// src/components/pricing/PricingPlans.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, CreditCard, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { getMessage } from '@/core/utils/i18n';
import { stripeService } from '@/services/stripe/StripeService';
import { PricingPlan } from '@/types/stripe';
import { User } from '@/types';

interface PricingPlansProps {
  user: User;
  onPaymentSuccess?: () => void;
  onPaymentCancel?: () => void;
}

export const PricingPlans: React.FC<PricingPlansProps> = ({
  user,
  onPaymentSuccess,
  onPaymentCancel
}) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  
  const plans = stripeService.getPricingPlans();

  const handleSelectPlan = async (planId: 'monthly' | 'yearly') => {
    if (!user?.email) {
      toast.error(getMessage('userEmailRequired', undefined, 'User email is required for payment'));
      return;
    }

    setIsLoading(planId);

    try {
      await stripeService.redirectToCheckout(planId, user.id, user.email);
      
      toast.info(
        getMessage('redirectingToPayment', undefined, 'Redirecting to payment...'),
        {
          description: getMessage('completePaymentInNewTab', undefined, 'Complete your payment in the new tab')
        }
      );
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(
        getMessage('paymentError', undefined, 'Payment failed'),
        {
          description: error instanceof Error ? error.message : getMessage('tryAgainLater', undefined, 'Please try again later')
        }
      );
    } finally {
      setIsLoading(null);
    }
  };

  const features = [
    getMessage('feature1', undefined, 'Unlimited AI conversations'),
    getMessage('feature2', undefined, 'Smart template library'),
    getMessage('feature3', undefined, 'Energy usage insights'),
    getMessage('feature4', undefined, 'Priority customer support'),
    getMessage('feature5', undefined, 'Advanced analytics'),
    getMessage('feature6', undefined, 'Custom folder organization')
  ];

  return (
    <div className="jd-w-full jd-max-w-4xl jd-mx-auto jd-space-y-8">
      {/* Header */}
      <div className="jd-text-center jd-space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="jd-text-3xl jd-font-bold jd-text-white jd-font-heading">
            {getMessage('choosePlan', undefined, 'Choose Your Plan')}
          </h2>
          <p className="jd-text-lg jd-text-gray-300 jd-max-w-2xl jd-mx-auto">
            {getMessage('pricingDescription', undefined, 'Unlock the full potential of AI with our premium features')}
          </p>
        </motion.div>
      </div>

      {/* Pricing Toggle */}
      <motion.div
        className="jd-flex jd-justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="jd-bg-gray-800 jd-rounded-lg jd-p-1 jd-flex jd-space-x-1">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`jd-px-6 jd-py-2 jd-rounded-md jd-text-sm jd-font-medium jd-transition-all jd-duration-200 ${
              selectedPlan === 'monthly'
                ? 'jd-bg-blue-600 jd-text-white jd-shadow-md'
                : 'jd-text-gray-400 hover:jd-text-white'
            }`}
          >
            {getMessage('monthly', undefined, 'Monthly')}
          </button>
          <button
            onClick={() => setSelectedPlan('yearly')}
            className={`jd-px-6 jd-py-2 jd-rounded-md jd-text-sm jd-font-medium jd-transition-all jd-duration-200 jd-flex jd-items-center jd-space-x-2 ${
              selectedPlan === 'yearly'
                ? 'jd-bg-blue-600 jd-text-white jd-shadow-md'
                : 'jd-text-gray-400 hover:jd-text-white'
            }`}
          >
            <span>{getMessage('yearly', undefined, 'Yearly')}</span>
            <Badge className="jd-bg-green-600 jd-text-white jd-text-xs">
              {getMessage('save', undefined, 'Save 22%')}
            </Badge>
          </button>
        </div>
      </motion.div>

      {/* Pricing Cards */}
      <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-2 jd-gap-6 jd-max-w-4xl jd-mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            className={`jd-relative ${selectedPlan === plan.id ? 'jd-scale-105' : ''} jd-transition-transform jd-duration-300`}
          >
            <Card className={`jd-relative jd-overflow-hidden jd-bg-gray-900 jd-border-gray-800 jd-h-full ${
              plan.popular ? 'jd-border-blue-500 jd-shadow-lg jd-shadow-blue-500/20' : ''
            }`}>
              {plan.popular && (
                <div className="jd-absolute jd-top-0 jd-left-0 jd-w-full jd-h-1 jd-bg-gradient-to-r jd-from-blue-600 jd-to-purple-600"></div>
              )}
              
              <CardHeader className="jd-text-center jd-space-y-4 jd-pb-4">
                {plan.popular && (
                  <Badge className="jd-bg-gradient-to-r jd-from-blue-600 jd-to-purple-600 jd-text-white jd-w-fit jd-mx-auto">
                    <Crown className="jd-w-3 jd-h-3 jd-mr-1" />
                    {getMessage('mostPopular', undefined, 'Most Popular')}
                  </Badge>
                )}
                
                <div>
                  <h3 className="jd-text-xl jd-font-semibold jd-text-white jd-font-heading">
                    {plan.name}
                  </h3>
                  
                  <div className="jd-mt-4">
                    <div className="jd-flex jd-items-baseline jd-justify-center jd-space-x-1">
                      <span className="jd-text-4xl jd-font-bold jd-text-white">
                        €{plan.price}
                      </span>
                      <span className="jd-text-gray-400">
                        /{getMessage(plan.interval, undefined, plan.interval)}
                      </span>
                    </div>
                    
                    {plan.savings && (
                      <div className="jd-mt-2">
                        <span className="jd-text-green-400 jd-text-sm jd-font-medium">
                          {plan.savings}
                        </span>
                      </div>
                    )}
                    
                    {plan.id === 'yearly' && (
                      <div className="jd-mt-1">
                        <span className="jd-text-gray-400 jd-text-sm">
                          {getMessage('billedAnnually', undefined, 'Billed annually')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="jd-space-y-6">
                {/* Features */}
                <div className="jd-space-y-3">
                  {features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="jd-flex jd-items-center jd-space-x-3">
                      <div className="jd-flex-shrink-0 jd-w-5 jd-h-5 jd-bg-blue-600 jd-rounded-full jd-flex jd-items-center jd-justify-center">
                        <Check className="jd-w-3 jd-h-3 jd-text-white" />
                      </div>
                      <span className="jd-text-gray-300 jd-text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isLoading === plan.id}
                  className={`jd-w-full jd-py-6 jd-text-base jd-font-semibold jd-transition-all jd-duration-300 ${
                    plan.popular
                      ? 'jd-bg-gradient-to-r jd-from-blue-600 jd-to-purple-600 hover:jd-from-blue-700 hover:jd-to-purple-700 jd-shadow-lg hover:jd-shadow-xl'
                      : 'jd-bg-gray-800 jd-text-white jd-border jd-border-gray-700 hover:jd-bg-gray-700 hover:jd-border-gray-600'
                  }`}
                >
                  {isLoading === plan.id ? (
                    <div className="jd-flex jd-items-center jd-justify-center jd-space-x-2">
                      <svg className="jd-animate-spin jd-h-4 jd-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="jd-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="jd-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{getMessage('processing', undefined, 'Processing...')}</span>
                    </div>
                  ) : (
                    <div className="jd-flex jd-items-center jd-justify-center jd-space-x-2">
                      <CreditCard className="jd-w-4 jd-h-4" />
                      <span>
                        {getMessage('choosePlan', undefined, 'Choose Plan')}
                      </span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="jd-flex jd-items-center jd-justify-center jd-space-x-2 jd-text-sm jd-text-gray-400"
      >
        <Shield className="jd-w-4 jd-h-4" />
        <span>
          {getMessage('securePayment', undefined, 'Secure payment powered by Stripe')}
        </span>
      </motion.div>
    </div>
  );
};