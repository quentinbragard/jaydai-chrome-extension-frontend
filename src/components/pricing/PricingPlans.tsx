// src/components/pricing/PricingPlans.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, CreditCard, Shield, ArrowRightIcon, Sparkles, FileText, Database, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { getMessage } from '@/core/utils/i18n';
import { stripeApi } from '@/services/api/StripeApi';
import { buildReturnUrl } from '@/utils/stripe';
import { User } from '@/types';
import { cn } from '@/core/utils/classNames';

interface PricingPlansProps {
  user: User;
  onPaymentSuccess?: () => void;
  onPaymentCancel?: () => void;
  isDark?: boolean;
}

export const PricingPlans: React.FC<PricingPlansProps> = ({
  user,
  onPaymentSuccess,
  onPaymentCancel,
  isDark = true
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  
  const plans = [
    {
      id: 'yearly' as const,
      name: 'Yearly Plan',
      price: 6.99,
      currency: 'EUR',
      interval: 'year' as const,
      priceId: process.env.VITE_STRIPE_PLUS_YEARLY_PRICE_ID || '',
      savings: 'Save 22%',
      popular: true
    },
    {
      id: 'monthly' as const,
      name: 'Monthly Plan',
      price: 8.99,
      currency: 'EUR',
      interval: 'month' as const,
      priceId: process.env.VITE_STRIPE_PLUS_MONTHLY_PRICE_ID || ''
    }
  ];
  const currentPlan = plans.find(p => p.id === selectedPlan);

  const handleSelectPlan = async () => {
    if (!user?.email) {
      toast.error(getMessage('userEmailRequired', undefined, 'User email is required for payment'));
      return;
    }

    setIsLoading(true);

    try {
      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan) throw new Error('Invalid plan selected');

      const session = await stripeApi.createCheckoutSession({
        priceId: plan.priceId,
        successUrl: await buildReturnUrl('success'),
        cancelUrl: await buildReturnUrl('cancel'),
        userId: user.id,
        userEmail: user.email,
      });

      if (session.url) {
        window.open(session.url, '_blank');
      }
      
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
      setIsLoading(false);
    }
  };

  const features = [
    {
      name: getMessage('premiumTemplates', undefined, 'Access to 1000+ premium prompt templates'),
      description: getMessage('premiumTemplatesDesc', undefined, 'Curated templates for all use cases'),
      included: true,
      icon: <FileText className="jd-w-4 jd-h-4" />
    },
    {
      name: getMessage('unlimitedPersonalTemplates', undefined, 'Unlimited personal prompt templates'),
      description: getMessage('unlimitedPersonalTemplatesDesc', undefined, 'Create and save your own templates'),
      included: true,
      icon: <Sparkles className="jd-w-4 jd-h-4" />
    },
    {
      name: getMessage('unlimitedPromptBlocks', undefined, 'Unlimited personal prompt blocks'),
      description: getMessage('unlimitedPromptBlocksDesc', undefined, 'Build reusable prompt components'),
      included: true,
      icon: <Database className="jd-w-4 jd-h-4" />
    },
    {
      name: getMessage('advancedAnalytics', undefined, 'Advanced Data Analytics'),
      description: getMessage('advancedAnalyticsDesc', undefined, 'Detailed insights and usage statistics (coming soon)'),
      included: true,
      icon: <BarChart3 className="jd-w-4 jd-h-4" />
    }
  ];

  const buttonStyles = cn(
    "jd-h-12 jd-w-full jd-py-6 jd-text-base jd-font-semibold jd-relative jd-transition-all jd-duration-200",
    isDark ? "jd-bg-blue-600 jd-text-white" : "jd-bg-blue-600 jd-text-white",
    isDark ? "hover:jd-bg-blue-700" : "hover:jd-bg-blue-700",
    "jd-shadow-lg hover:jd-shadow-xl",
  );

  const badgeStyles = cn(
    "jd-px-4 jd-py-1.5 jd-text-sm jd-font-medium",
    isDark ? "jd-bg-blue-600 jd-text-white" : "jd-bg-blue-600 jd-text-white",
    "jd-border-none jd-shadow-lg",
  );

  return (
    <section className={cn(
      "jd-relative jd-py-8 jd-px-4 jd-overflow-hidden",
      isDark ? "jd-bg-gray-900 jd-text-white" : "jd-bg-white jd-text-gray-900"
    )}>
      <div className="jd-w-full jd-max-w-2xl jd-mx-auto">
        {/* Header */}
        <div className="jd-flex jd-flex-col jd-items-center jd-gap-4 jd-mb-8">
          <motion.h2 
            className={cn(
              "jd-text-3xl jd-font-bold jd-text-center",
              isDark ? "jd-text-white" : "jd-text-gray-900"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {getMessage('choosePlan', undefined, 'Choose Your Plan')}
          </motion.h2>
          
          {/* Pricing Toggle */}
          <motion.div
            className={cn(
              "jd-inline-flex jd-items-center jd-p-1.5 jd-rounded-full jd-border jd-shadow-sm",
              isDark ? "jd-bg-gray-800 jd-border-gray-600" : "jd-bg-white jd-border-gray-200"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {["monthly", "yearly"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPlan(period as 'monthly' | 'yearly')}
                className={cn(
                  "jd-px-8 jd-py-2.5 jd-text-sm jd-font-medium jd-rounded-full jd-transition-all jd-duration-300",
                  (period === selectedPlan)
                    ? isDark 
                      ? "jd-bg-blue-600 jd-text-white jd-shadow-lg" 
                      : "jd-bg-blue-600 jd-text-white jd-shadow-lg"
                    : isDark
                      ? "jd-text-gray-400 hover:jd-text-white"
                      : "jd-text-gray-600 hover:jd-text-gray-900",
                )}
              >
                <span className="jd-flex jd-items-center jd-space-x-2">
                  <span>
                    {period === 'monthly' 
                      ? getMessage('monthly', undefined, 'Monthly') 
                      : getMessage('yearly', undefined, 'Yearly')
                    }
                  </span>
                  {period === 'yearly' && (
                    <Badge className={cn(
                      "jd-text-xs",
                      isDark ? "jd-bg-green-600 jd-text-white" : "jd-bg-green-600 jd-text-white"
                    )}>
                      {getMessage('save', undefined, 'Save 22%')}
                    </Badge>
                  )}
                </span>
              </button>
            ))}
          </motion.div>
        </div>

        {/* Single Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={cn(
            "jd-relative jd-group jd-backdrop-blur-sm jd-transition-all jd-duration-300",
            "jd-rounded-3xl jd-flex jd-flex-col jd-border jd-shadow-lg hover:jd-shadow-xl",
            isDark 
              ? "jd-bg-gradient-to-b jd-from-gray-800 jd-to-gray-900 jd-border-blue-500 jd-shadow-blue-500/20"
              : "jd-bg-gradient-to-b jd-from-blue-50 jd-to-white jd-border-blue-500 jd-shadow-blue-500/20"
          )}
        >
          {/* Most Popular Badge */}
          <div className="jd-absolute jd-top-[-12px] jd-left-1/2 jd-transform jd--translate-x-1/2">
            <Badge className={badgeStyles}>
              <Crown className="jd-w-3 jd-h-3 jd-mr-1" />
              {getMessage('mostPopular', undefined, 'Most Popular')}
            </Badge>
          </div>

          <CardHeader className="jd-p-8 jd-pb-4">
            <div className="jd-flex jd-items-center jd-justify-between jd-mb-4">
              <div className={cn(
                "jd-p-3 jd-rounded-xl",
                isDark 
                  ? "jd-bg-blue-600 jd-text-white"
                  : "jd-bg-blue-600 jd-text-white"
              )}>
                <Crown className="jd-w-6 jd-h-6" />
              </div>
              <h3 className={cn(
                "jd-text-xl jd-font-semibold",
                isDark ? "jd-text-white" : "jd-text-gray-900"
              )}>
                {getMessage('plusPlan', undefined, 'Jaydai Plus')}
              </h3>
            </div>

            <div className="jd-text-center jd-mb-6">
              <div className="jd-flex jd-items-baseline jd-justify-center jd-gap-2">
                <span className={cn(
                  "jd-text-4xl jd-font-bold",
                  isDark ? "jd-text-white" : "jd-text-gray-900"
                )}>
                  €{currentPlan?.price || '6.99'}
                </span>
                <span className={cn(
                  "jd-text-sm",
                  isDark ? "jd-text-gray-400" : "jd-text-gray-500"
                )}>
                  /{getMessage('month', undefined, 'month')}
                </span>
              </div>
              
              {selectedPlan === 'yearly' && (
                <div className="jd-mt-2">
                  <span className="jd-text-green-500 jd-text-sm jd-font-medium">
                    {getMessage('save22', undefined, 'Save 22%')}
                  </span>
                  <div className="jd-mt-1">
                    <span className={cn(
                      "jd-text-sm",
                      isDark ? "jd-text-gray-400" : "jd-text-gray-500"
                    )}>
                      {getMessage('billedAnnually', undefined, 'Billed annually')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="jd-p-8 jd-pt-0 jd-space-y-6 jd-flex-1">
            {/* Features */}
            <div className="jd-space-y-4">
              {features.map((feature, featureIndex) => (
                <div key={featureIndex} className="jd-flex jd-gap-4">
                  <div className={cn(
                    "jd-mt-1 jd-p-0.5 jd-rounded-full jd-transition-colors jd-duration-200",
                    feature.included
                      ? "jd-text-green-500"
                      : isDark 
                        ? "jd-text-gray-600"
                        : "jd-text-gray-400"
                  )}>
                    <Check className="jd-w-4 jd-h-4" />
                  </div>
                  <div className="jd-flex-1">
                    <div className={cn(
                      "jd-text-sm jd-font-medium jd-mb-1",
                      isDark ? "jd-text-white" : "jd-text-gray-900"
                    )}>
                      {feature.name}
                    </div>
                    <div className={cn(
                      "jd-text-sm",
                      isDark ? "jd-text-gray-400" : "jd-text-gray-500"
                    )}>
                      {feature.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="jd-mt-auto jd-pt-6">
              <Button
                onClick={handleSelectPlan}
                disabled={isLoading}
                className={buttonStyles}
              >
                {isLoading ? (
                  <div className="jd-flex jd-items-center jd-justify-center jd-space-x-2">
                    <svg className="jd-animate-spin jd-h-4 jd-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="jd-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="jd-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{getMessage('processing', undefined, 'Processing...')}</span>
                  </div>
                ) : (
                  <span className="jd-relative jd-z-10 jd-flex jd-items-center jd-justify-center jd-gap-2">
                    <CreditCard className="jd-w-4 jd-h-4" />
                    <span>
                      {getMessage('upgradeToPremium', undefined, 'Upgrade to Premium')}
                    </span>
                    <ArrowRightIcon className="jd-w-4 jd-h-4" />
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="jd-flex jd-items-center jd-justify-center jd-space-x-2 jd-text-sm jd-mt-8"
        >
          <Shield className="jd-w-4 jd-h-4 jd-text-green-500" />
          <span className={cn(
            isDark ? "jd-text-gray-400" : "jd-text-gray-500"
          )}>
            {getMessage('securePayment', undefined, 'Secure payment powered by Stripe')}
          </span>
        </motion.div>
      </div>
    </section>
  );
};