// src/components/pricing/PricingSection.tsx
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Crown } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';
import { stripeService } from '@/services/stripe/StripeService';
import { PricingPlan } from '@/types/stripe';
import { User } from '@/types';

interface PricingSectionProps {
  user: User;
  onPaymentSuccess?: () => void;
  onPaymentCancel?: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  user,
  onPaymentSuccess,
  onPaymentCancel,
}) => {
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);
  const plans = stripeService.getPricingPlans();

  const handleSelectPlan = async (planId: 'monthly' | 'yearly') => {
    if (!user?.email) return;
    setLoadingPlan(planId);
    try {
      await stripeService.redirectToCheckout(planId, user.id, user.email);
      onPaymentSuccess?.();
    } catch (err) {
      console.error('Payment error:', err);
      onPaymentCancel?.();
    } finally {
      setLoadingPlan(null);
    }
  };

  const features = [
    getMessage('feature1', undefined, 'Unlimited AI conversations'),
    getMessage('feature2', undefined, 'Smart template library'),
    getMessage('feature3', undefined, 'Energy usage insights'),
    getMessage('feature4', undefined, 'Priority customer support'),
    getMessage('feature5', undefined, 'Advanced analytics'),
    getMessage('feature6', undefined, 'Custom folder organization'),
  ];

  return (
    <section className="jd-space-y-10 jd-w-full jd-max-w-4xl jd-mx-auto">
      <div className="jd-text-center jd-space-y-4">
        <h2 className="jd-text-3xl jd-font-bold jd-text-white jd-font-heading">
          {getMessage('choosePlan', undefined, 'Choose Your Plan')}
        </h2>
        <p className="jd-text-lg jd-text-gray-300 jd-max-w-2xl jd-mx-auto">
          {getMessage(
            'pricingDescription',
            undefined,
            'Unlock the full potential of AI with our premium features'
          )}
        </p>
      </div>
      <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-2 jd-gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`jd-flex jd-flex-col jd-h-full jd-overflow-hidden jd-bg-gray-900 jd-border-gray-800 ${plan.popular ? 'jd-border-blue-500 jd-shadow-lg jd-shadow-blue-500/20' : ''}`}
          >
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
                <CardTitle className="jd-text-xl jd-font-semibold jd-text-white jd-font-heading">
                  {plan.name}
                </CardTitle>
                <div className="jd-mt-4">
                  <div className="jd-flex jd-items-baseline jd-justify-center jd-space-x-1">
                    <span className="jd-text-4xl jd-font-bold jd-text-white">€{plan.price}</span>
                    <span className="jd-text-gray-400">/{getMessage(plan.interval, undefined, plan.interval)}</span>
                  </div>
                  {plan.savings && (
                    <div className="jd-mt-2">
                      <span className="jd-text-green-400 jd-text-sm jd-font-medium">{plan.savings}</span>
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
            <CardContent className="jd-space-y-3 jd-flex-1">
              {features.map((feature, idx) => (
                <div key={idx} className="jd-flex jd-items-center jd-space-x-3">
                  <div className="jd-flex-shrink-0 jd-w-5 jd-h-5 jd-bg-blue-600 jd-rounded-full jd-flex jd-items-center jd-justify-center">
                    <Check className="jd-w-3 jd-h-3 jd-text-white" />
                  </div>
                  <span className="jd-text-gray-300 jd-text-sm">{feature}</span>
                </div>
              ))}
            </CardContent>
            <CardFooter className="jd-pt-0">
              <Button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loadingPlan === plan.id}
                className="jd-w-full jd-py-6 jd-text-base jd-font-semibold"
              >
                {loadingPlan === plan.id ? (
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
                    <span>{getMessage('choosePlan', undefined, 'Choose Plan')}</span>
                  </div>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default PricingSection;
